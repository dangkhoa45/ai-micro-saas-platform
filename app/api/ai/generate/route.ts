import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateText, calculateCost } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { getUserSubscription, getMonthlyTokenUsage } from "@/lib/subscription";
import { z } from "zod";

/**
 * AI Generate API Request Schema
 * Generic AI text generation endpoint
 */
const generateSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(10000, "Prompt must be less than 10,000 characters"),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().min(1).max(4000).optional().default(2000),
  model: z.string().optional(),
  useCase: z.enum(["text", "chat", "data", "code", "general"]).optional(),
  projectId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type AIGenerateRequest = z.infer<typeof generateSchema>;

/**
 * POST /api/ai/generate
 *
 * Generic AI text generation endpoint with quota enforcement
 *
 * Request Body:
 * - prompt: string (required) - The input prompt
 * - systemPrompt: string (optional) - System instructions
 * - temperature: number (optional, 0-2, default: 0.7) - Creativity level
 * - maxTokens: number (optional, 1-4000, default: 2000) - Max response length
 * - model: string (optional) - Specific model to use
 * - useCase: string (optional) - Use case for automatic model selection
 * - projectId: string (optional) - Project ID for usage tracking
 * - metadata: object (optional) - Additional metadata to log
 *
 * Response:
 * - content: string - Generated text
 * - usage: object - Token usage statistics
 * - cost: number - Cost of the request in USD
 * - model: string - Model used for generation
 * - remainingTokens: number - Remaining monthly tokens
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validation = generateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          message: "Invalid request parameters",
          details: validation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      prompt,
      systemPrompt,
      temperature,
      maxTokens,
      model,
      useCase,
      projectId,
      metadata = {},
    } = validation.data;

    // 3. Check subscription and usage quota
    const { limits } = await getUserSubscription(session.user.id);
    const currentMonthUsage = await getMonthlyTokenUsage(session.user.id);

    if (currentMonthUsage >= limits.monthlyTokens) {
      return NextResponse.json(
        {
          error: "Quota exceeded",
          message: `You have reached your monthly limit of ${limits.monthlyTokens.toLocaleString()} tokens. Please upgrade your plan.`,
          currentUsage: currentMonthUsage,
          limit: limits.monthlyTokens,
        },
        { status: 429 }
      );
    }

    // 4. Simple rate limiting: prevent rapid consecutive requests
    const recentRequest = await prisma.usageLog.findFirst({
      where: {
        userId: session.user.id,
        createdAt: { gte: new Date(Date.now() - 5_000) }, // Last 5 seconds
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentRequest) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            "You are sending requests too quickly. Please wait a few seconds and try again.",
        },
        { status: 429 }
      );
    }

    // 5. Generate AI response
    const result = await generateText(prompt, {
      systemPrompt,
      temperature,
      maxTokens,
      model,
      useCase,
    });

    // 6. Calculate cost
    const cost = calculateCost(
      result.model,
      result.usage.promptTokens,
      result.usage.completionTokens
    );

    const responseTime = Date.now() - startTime;

    // 7. Find or create "AI Generate" app
    let app = await prisma.app.findUnique({
      where: { slug: "ai-generate" },
    });

    if (!app) {
      app = await prisma.app.create({
        data: {
          slug: "ai-generate",
          name: "AI Generate",
          description: "Generic AI text generation API",
          enabled: true,
        },
      });
    }

    // 8. Log usage to database
    await prisma.usageLog.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        appId: app.id,
        type: "text_generation",
        model: result.model,
        tokens: result.usage.totalTokens,
        cost,
        metadata: {
          promptLength: prompt.length,
          systemPromptLength: systemPrompt?.length || 0,
          temperature,
          maxTokens,
          responseTime,
          provider: result.provider,
          ...metadata,
        },
      },
    });

    // 9. Return successful response
    return NextResponse.json({
      content: result.text,
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      },
      cost: parseFloat(cost.toFixed(6)),
      model: result.model,
      provider: result.provider,
      remainingTokens:
        limits.monthlyTokens - currentMonthUsage - result.usage.totalTokens,
      responseTime,
    });
  } catch (error: any) {
    console.error("[AI_GENERATE_ERROR]", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      stack: error?.stack?.split("\n").slice(0, 3),
    });

    // Handle specific error types
    if (error?.name === "AIRateLimitError") {
      return NextResponse.json(
        {
          error: "AI provider rate limit",
          message:
            "The AI service is temporarily overloaded. Please try again in a moment.",
        },
        { status: 429 }
      );
    }

    if (error?.name === "AIQuotaError") {
      return NextResponse.json(
        {
          error: "AI provider quota exceeded",
          message:
            "The AI service quota has been exceeded. Please contact support.",
        },
        { status: 503 }
      );
    }

    if (error?.name === "AIAuthError") {
      return NextResponse.json(
        {
          error: "AI provider authentication failed",
          message:
            "Failed to authenticate with AI service. Please contact support.",
        },
        { status: 500 }
      );
    }

    if (error?.status === 401) {
      return NextResponse.json(
        {
          error: "AI provider authentication error",
          message: "Invalid API credentials configured",
        },
        { status: 500 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            "Too many requests to AI provider. Please try again in a moment.",
        },
        { status: 429 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error?.message || "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
