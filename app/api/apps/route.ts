import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/apps
 * Get all available apps
 */
export async function GET(req: NextRequest) {
  try {
    const apps = await prisma.app.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ apps });
  } catch (error) {
    console.error("[APPS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/apps/seed
 * Seed initial apps (only for development/setup)
 */
export async function POST(req: NextRequest) {
  try {
    // In production, you might want to protect this endpoint
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Forbidden in production" },
        { status: 403 }
      );
    }

    const defaultApps = [
      {
        slug: "ai-writer",
        name: "AI Writer",
        description:
          "Generate high-quality content with AI - blogs, articles, marketing copy, and more",
        icon: "✍️",
        enabled: true,
      },
      {
        slug: "ai-analytics",
        name: "AI Analytics",
        description:
          "Analyze data and get insights with AI - charts, predictions, and recommendations",
        icon: "📊",
        enabled: true,
      },
      {
        slug: "ai-chatbot",
        name: "AI Chatbot",
        description:
          "Create and deploy intelligent chatbots for customer service and engagement",
        icon: "💬",
        enabled: false,
      },
      {
        slug: "ai-image-gen",
        name: "AI Image Generator",
        description:
          "Generate stunning images from text descriptions using DALL-E",
        icon: "🎨",
        enabled: false,
      },
    ];

    const createdApps = [];

    for (const app of defaultApps) {
      const existingApp = await prisma.app.findUnique({
        where: { slug: app.slug },
      });

      if (!existingApp) {
        const createdApp = await prisma.app.create({
          data: app,
        });
        createdApps.push(createdApp);
      }
    }

    return NextResponse.json({
      message: `Seeded ${createdApps.length} new apps`,
      apps: createdApps,
    });
  } catch (error) {
    console.error("[APPS_SEED_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
