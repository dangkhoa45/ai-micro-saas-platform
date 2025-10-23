import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/packages/lib/auth";
import { prisma } from "@/packages/lib/db";

// POST /api/content/prompts/[id]/use - Increment usage count
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const promptId = params.id;

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

    // Increment usage count
    const updatedPrompt = await prisma.favoritePrompt.update({
      where: { id: promptId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ prompt: updatedPrompt });
  } catch (error) {
    console.error("Error incrementing prompt usage:", error);
    return NextResponse.json(
      { error: "Failed to update prompt usage" },
      { status: 500 }
    );
  }
}
