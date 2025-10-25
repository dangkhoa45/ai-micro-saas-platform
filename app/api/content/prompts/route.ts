import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createPromptSchema = z.object({
  title: z.string().min(1, "Title is required"),
  prompt: z.string().min(1, "Prompt is required"),
  category: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
  language: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updatePromptSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  prompt: z.string().optional(),
  category: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
  language: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/content/prompts - Get all favorite prompts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const prompts = await prisma.favoritePrompt.findMany({
      where: {
        userId: user.id,
        ...(category && { category }),
      },
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: offset,
    });

    const total = await prisma.favoritePrompt.count({
      where: {
        userId: user.id,
        ...(category && { category }),
      },
    });

    return NextResponse.json({ prompts, total });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

// POST /api/content/prompts - Create new favorite prompt
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const validated = createPromptSchema.parse(body);

    const prompt = await prisma.favoritePrompt.create({
      data: {
        userId: user.id,
        title: validated.title,
        prompt: validated.prompt,
        category: validated.category,
        tone: validated.tone,
        length: validated.length,
        language: validated.language,
        tags: validated.tags || [],
      },
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    console.error("Error creating prompt:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}

// PATCH /api/content/prompts - Update prompt
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const validated = updatePromptSchema.parse(body);

    // Verify ownership
    const existingPrompt = await prisma.favoritePrompt.findUnique({
      where: { id: validated.id },
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    if (existingPrompt.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, ...updateData } = validated;

    const prompt = await prisma.favoritePrompt.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("Error updating prompt:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update prompt" },
      { status: 500 }
    );
  }
}

// DELETE /api/content/prompts?id=xxx - Delete prompt
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const promptId = searchParams.get("id");

    if (!promptId) {
      return NextResponse.json(
        { error: "Prompt ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const prompt = await prisma.favoritePrompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    if (prompt.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.favoritePrompt.delete({
      where: { id: promptId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    return NextResponse.json(
      { error: "Failed to delete prompt" },
      { status: 500 }
    );
  }
}
