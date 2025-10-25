import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createEmbedding } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { checkUsageLimit } from "@/lib/usage";

/**
 * POST /api/ai/embedding
 * Create embeddings for text using OpenAI embeddings API
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscriptions: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check usage limits
    const usageCheck = await checkUsageLimit(user.id);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: "Usage limit exceeded",
          message: usageCheck.message,
          remainingTokens: usageCheck.remainingTokens,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { text, model } = body;

    // Validate input
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    if (text.length === 0) {
      return NextResponse.json(
        { error: "Text cannot be empty" },
        { status: 400 }
      );
    }

    if (text.length > 8000) {
      return NextResponse.json(
        { error: "Text must not exceed 8000 characters" },
        { status: 400 }
      );
    }

    // Validate model
    const validModels = [
      "text-embedding-ada-002",
      "text-embedding-3-small",
      "text-embedding-3-large",
    ];
    if (model && !validModels.includes(model)) {
      return NextResponse.json(
        { error: `Invalid model. Must be one of: ${validModels.join(", ")}` },
        { status: 400 }
      );
    }

    console.log("[Embedding Generation] Request:", {
      userId: user.id,
      textLength: text.length,
      model: model || "text-embedding-ada-002",
    });

    // Create embedding
    const startTime = Date.now();
    const response = await createEmbedding(text, {
      model: model || "text-embedding-ada-002",
    });
    const duration = Date.now() - startTime;

    // Calculate cost (approximate)
    // text-embedding-ada-002: $0.0001 / 1K tokens
    // text-embedding-3-small: $0.00002 / 1K tokens
    // text-embedding-3-large: $0.00013 / 1K tokens
    const costPer1KTokens: { [key: string]: number } = {
      "text-embedding-ada-002": 0.0001,
      "text-embedding-3-small": 0.00002,
      "text-embedding-3-large": 0.00013,
    };

    const embeddingModel = response.model;
    const tokensUsed = response.usage.total_tokens;
    const cost =
      (tokensUsed / 1000) * (costPer1KTokens[embeddingModel] || 0.0001);

    // Log usage
    try {
      // Get or create the AI Embeddings app
      let app = await prisma.app.findUnique({
        where: { slug: "ai-embeddings" },
      });

      if (!app) {
        app = await prisma.app.create({
          data: {
            slug: "ai-embeddings",
            name: "AI Embeddings",
            description: "OpenAI embeddings for semantic search and analysis",
            enabled: true,
          },
        });
      }

      await prisma.usageLog.create({
        data: {
          userId: user.id,
          appId: app.id,
          type: "analysis",
          model: embeddingModel,
          tokens: tokensUsed,
          cost,
          metadata: {
            textLength: text.length,
            textPreview: text.substring(0, 100),
            duration,
            embeddingDimensions: response.embedding.length,
          } as any,
        },
      });

      console.log("[Embedding Generation] Success:", {
        userId: user.id,
        model: embeddingModel,
        tokens: tokensUsed,
        cost,
        duration,
      });
    } catch (error) {
      console.error("[Embedding Generation] Error logging usage:", error);
      // Don't fail the request if logging fails
    }

    // Return response
    return NextResponse.json({
      success: true,
      embedding: response.embedding,
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        totalTokens: response.usage.total_tokens,
      },
      cost,
      metadata: {
        textLength: text.length,
        embeddingDimensions: response.embedding.length,
        duration,
      },
    });
  } catch (error: any) {
    console.error("[Embedding Generation] Error:", error);

    // Handle specific error types
    if (error.status === 429) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    if (error.status === 400) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: error.message || "The request was invalid",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Embedding generation failed",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/embedding
 * Get available embedding models and configurations
 */
export async function GET() {
  return NextResponse.json({
    models: [
      {
        id: "text-embedding-ada-002",
        name: "Ada v2",
        description: "Most popular and balanced embedding model",
        dimensions: 1536,
        maxTokens: 8191,
        pricing: {
          per1KTokens: 0.0001,
        },
      },
      {
        id: "text-embedding-3-small",
        name: "Embedding v3 Small",
        description: "Latest small embedding model with improved performance",
        dimensions: 1536,
        maxTokens: 8191,
        pricing: {
          per1KTokens: 0.00002,
        },
      },
      {
        id: "text-embedding-3-large",
        name: "Embedding v3 Large",
        description: "Latest large embedding model with highest quality",
        dimensions: 3072,
        maxTokens: 8191,
        pricing: {
          per1KTokens: 0.00013,
        },
      },
    ],
    limits: {
      maxTextLength: 8000,
    },
    useCases: [
      "Semantic search",
      "Text similarity",
      "Content classification",
      "Recommendation systems",
      "Question answering",
      "Document clustering",
    ],
  });
}
