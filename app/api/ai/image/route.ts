import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateImage } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { checkUsageLimit } from "@/lib/usage";

/**
 * POST /api/ai/image
 * Generate images using DALL-E
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
    const { prompt, model, size, quality, n } = body;

    // Validate input
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    if (prompt.length < 10) {
      return NextResponse.json(
        { error: "Prompt must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: "Prompt must not exceed 4000 characters" },
        { status: 400 }
      );
    }

    // Validate model
    const validModels = ["dall-e-2", "dall-e-3"];
    if (model && !validModels.includes(model)) {
      return NextResponse.json(
        { error: `Invalid model. Must be one of: ${validModels.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate size based on model
    const validSizes =
      model === "dall-e-2"
        ? ["256x256", "512x512", "1024x1024"]
        : ["1024x1024", "1792x1024", "1024x1792"];

    if (size && !validSizes.includes(size)) {
      return NextResponse.json(
        {
          error: `Invalid size for ${
            model || "dall-e-3"
          }. Must be one of: ${validSizes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate quality
    if (quality && !["standard", "hd"].includes(quality)) {
      return NextResponse.json(
        { error: 'Invalid quality. Must be "standard" or "hd"' },
        { status: 400 }
      );
    }

    // Validate n (number of images)
    const numImages = n || 1;
    if (numImages < 1 || numImages > 10) {
      return NextResponse.json(
        { error: "Number of images must be between 1 and 10" },
        { status: 400 }
      );
    }

    // DALL-E 3 only supports n=1
    if (model === "dall-e-3" && numImages > 1) {
      return NextResponse.json(
        { error: "DALL-E 3 only supports generating 1 image at a time" },
        { status: 400 }
      );
    }

    console.log("[Image Generation] Request:", {
      userId: user.id,
      prompt: prompt.substring(0, 50) + "...",
      model: model || "dall-e-3",
      size: size || "1024x1024",
      quality: quality || "standard",
      n: numImages,
    });

    // Generate images
    const startTime = Date.now();
    const response = await generateImage(prompt, {
      model: model || "dall-e-3",
      size: size || "1024x1024",
      quality: quality || "standard",
      n: numImages,
    });
    const duration = Date.now() - startTime;

    // Calculate cost (approximate)
    // DALL-E 2: $0.02/image (1024x1024), $0.018/image (512x512), $0.016/image (256x256)
    // DALL-E 3: $0.04/image (standard 1024x1024), $0.08/image (hd 1024x1024)
    //          $0.08/image (standard 1792x1024/1024x1792), $0.12/image (hd 1792x1024/1024x1792)
    let costPerImage = 0;
    const imageModel = model || "dall-e-3";
    const imageSize = size || "1024x1024";
    const imageQuality = quality || "standard";

    if (imageModel === "dall-e-2") {
      if (imageSize === "1024x1024") costPerImage = 0.02;
      else if (imageSize === "512x512") costPerImage = 0.018;
      else if (imageSize === "256x256") costPerImage = 0.016;
    } else {
      // DALL-E 3
      if (imageSize === "1024x1024") {
        costPerImage = imageQuality === "hd" ? 0.08 : 0.04;
      } else {
        // 1792x1024 or 1024x1792
        costPerImage = imageQuality === "hd" ? 0.12 : 0.08;
      }
    }

    const totalCost = costPerImage * numImages;

    // Log usage
    try {
      // Get or create the AI Image Generator app
      let app = await prisma.app.findUnique({
        where: { slug: "ai-image-generator" },
      });

      if (!app) {
        app = await prisma.app.create({
          data: {
            slug: "ai-image-generator",
            name: "AI Image Generator",
            description: "DALL-E powered image generation",
            enabled: true,
          },
        });
      }

      await prisma.usageLog.create({
        data: {
          userId: user.id,
          appId: app.id,
          type: "image_generation",
          model: imageModel,
          tokens: 0, // Images don't use token-based pricing
          cost: totalCost,
          metadata: {
            prompt: prompt.substring(0, 100),
            size: imageSize,
            quality: imageQuality,
            n: numImages,
            duration,
            imageUrls:
              response.data
                ?.map((img) => img.url)
                .filter((url): url is string => !!url) || [],
          } as any,
        },
      });

      console.log("[Image Generation] Success:", {
        userId: user.id,
        model: imageModel,
        cost: totalCost,
        duration,
        imagesGenerated: response.data?.length || 0,
      });
    } catch (error) {
      console.error("[Image Generation] Error logging usage:", error);
      // Don't fail the request if logging fails
    }

    // Return response
    return NextResponse.json({
      success: true,
      images: response.data,
      model: response.model,
      created: response.created,
      cost: totalCost,
      metadata: {
        prompt,
        size: imageSize,
        quality: imageQuality,
        n: numImages,
        duration,
      },
    });
  } catch (error: any) {
    console.error("[Image Generation] Error:", error);

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
        error: "Image generation failed",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/image
 * Get available models and configurations
 */
export async function GET() {
  return NextResponse.json({
    models: [
      {
        id: "dall-e-2",
        name: "DALL-E 2",
        description: "Fast and cost-effective image generation",
        sizes: ["256x256", "512x512", "1024x1024"],
        maxImages: 10,
        pricing: {
          "256x256": 0.016,
          "512x512": 0.018,
          "1024x1024": 0.02,
        },
      },
      {
        id: "dall-e-3",
        name: "DALL-E 3",
        description:
          "High quality image generation with better prompt understanding",
        sizes: ["1024x1024", "1792x1024", "1024x1792"],
        qualities: ["standard", "hd"],
        maxImages: 1,
        pricing: {
          "1024x1024-standard": 0.04,
          "1024x1024-hd": 0.08,
          "1792x1024-standard": 0.08,
          "1792x1024-hd": 0.12,
          "1024x1792-standard": 0.08,
          "1024x1792-hd": 0.12,
        },
      },
    ],
    limits: {
      minPromptLength: 10,
      maxPromptLength: 4000,
    },
  });
}
