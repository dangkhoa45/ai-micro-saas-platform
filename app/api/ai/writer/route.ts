import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateText, calculateCost } from "@/lib/ai";
import { prisma } from "@/lib/db";
import {
  getUserSubscription,
  getMonthlyTokenUsage,
  getRemainingTokens,
} from "@/lib/subscription";
import { z } from "zod";

/**
 * AI Writer request schema - Enhanced with new parameters
 */
const writerSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  type: z
    .enum([
      "blog",
      "article",
      "email",
      "social",
      "general",
      "technical",
      "creative",
    ])
    .optional(),
  tone: z
    .enum([
      "professional",
      "casual",
      "friendly",
      "formal",
      "persuasive",
      "technical",
      "creative",
      "humorous",
    ])
    .optional(),
  style: z
    .enum([
      "standard",
      "descriptive",
      "narrative",
      "expository",
      "persuasive",
      "conversational",
    ])
    .optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
  language: z
    .enum([
      "english",
      "spanish",
      "french",
      "german",
      "italian",
      "portuguese",
      "chinese",
      "japanese",
    ])
    .optional(),
  audience: z
    .enum([
      "general",
      "expert",
      "beginner",
      "students",
      "professionals",
      "executives",
    ])
    .optional(),
  projectId: z.string().optional(),
});

/**
 * POST /api/ai/writer
 * Generate content using AI
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const validation = writerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      prompt,
      type = "general",
      tone = "professional",
      style = "standard",
      length = "medium",
      language = "english",
      audience = "general",
      projectId,
    } = validation.data;

    // Check user subscription and usage limits using centralized utilities
    const { limits } = await getUserSubscription(session.user.id);
    const currentMonthUsage = await getMonthlyTokenUsage(session.user.id);

    if (currentMonthUsage >= limits.monthlyTokens) {
      return NextResponse.json(
        {
          error: "Usage limit exceeded",
          message: `You have reached your monthly limit of ${limits.monthlyTokens} tokens. Please upgrade your plan.`,
        },
        { status: 429 }
      );
    }

    // Build system prompt based on content type, tone, style, language, and audience
    const systemPrompts: Record<string, string> = {
      blog: `You are a professional blog writer. Write engaging, SEO-friendly blog content`,
      article: `You are a skilled article writer. Create informative, well-researched articles`,
      email: `You are an email copywriter. Write clear, effective emails`,
      social: `You are a social media content creator. Write engaging social media posts`,
      technical: `You are a technical writer. Create clear, detailed technical documentation`,
      creative: `You are a creative writer. Craft imaginative and engaging content`,
      general: `You are a professional writer. Create high-quality content`,
    };

    const styleInstructions: Record<string, string> = {
      standard: "using a clear and straightforward style",
      descriptive: "using rich, descriptive language with vivid details",
      narrative: "using a storytelling approach with narrative flow",
      expository: "using an explanatory style that informs and educates",
      persuasive: "using persuasive techniques to convince and motivate",
      conversational: "using a natural, conversational style",
    };

    const audienceInstructions: Record<string, string> = {
      general: "for a general audience",
      expert: "for industry experts and professionals with deep knowledge",
      beginner: "for beginners who are new to the topic",
      students: "for students in an educational context",
      professionals: "for working professionals in the field",
      executives: "for business executives and decision-makers",
    };

    const languageInstructions: Record<string, string> = {
      english: "in English",
      spanish: "in Spanish",
      french: "in French",
      german: "in German",
      italian: "in Italian",
      portuguese: "in Portuguese",
      chinese: "in Chinese",
      japanese: "in Japanese",
    };

    const lengthInstructions: Record<string, string> = {
      short: "Keep the content concise, around 150-250 words.",
      medium: "Write a moderate length piece, around 400-600 words.",
      long: "Create comprehensive content, around 800-1200 words.",
    };

    const systemPrompt = `${systemPrompts[type]} in a ${tone} tone, ${styleInstructions[style]}, ${audienceInstructions[audience]}, ${languageInstructions[language]}. ${lengthInstructions[length]}`;

    // Optional: lightweight per-user throttle to avoid spamming OpenAI
    const fiveSecondsAgo = new Date(Date.now() - 5_000);
    const recentLog = await prisma.usageLog.findFirst({
      where: {
        userId: session.user.id,
        createdAt: { gte: fiveSecondsAgo },
        type: "text_generation",
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentLog) {
      return NextResponse.json(
        {
          error:
            "You're sending requests too quickly. Please wait a few seconds and try again.",
        },
        { status: 429 }
      );
    }

    // Generate content with AI
    const result = await generateText(prompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: length === "short" ? 500 : length === "medium" ? 1000 : 2000,
    });

    // Calculate cost
    const cost = calculateCost(
      result.model,
      result.usage.promptTokens,
      result.usage.completionTokens
    );

    // Get or verify app
    const app = await prisma.app.findUnique({
      where: { slug: "ai-writer" },
    });

    if (!app) {
      return NextResponse.json(
        { error: "AI Writer app not found in database" },
        { status: 500 }
      );
    }

    // Log usage
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
          contentType: type,
          tone,
          style,
          length,
          language,
          audience,
          promptLength: prompt.length,
        },
      },
    });

    return NextResponse.json({
      content: result.text,
      usage: result.usage,
      cost,
      remainingTokens:
        limits.monthlyTokens - currentMonthUsage - result.usage.totalTokens,
    });
  } catch (error: any) {
    console.error("[AI_WRITER_ERROR]", error);

    // Handle OpenAI specific errors with clearer messaging
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "OpenAI API key is invalid or missing" },
        { status: 500 }
      );
    }

    if (error?.status === 429) {
      const message: string =
        error?.error?.code === "insufficient_quota" ||
        /insufficient_quota|quota/i.test(error?.message || "")
          ? "Your OpenAI account has insufficient quota. Add billing or increase limits in the OpenAI dashboard."
          : "OpenAI rate limit exceeded. Please wait a few seconds and try again.";

      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
