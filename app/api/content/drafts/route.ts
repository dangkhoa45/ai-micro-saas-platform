import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/packages/lib/auth";
import { prisma } from "@/packages/lib/db";
import { z } from "zod";

const createDraftSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string(),
  sections: z.any().optional(),
  settings: z.any().optional(),
  keywords: z.string().optional(),
  metadata: z.any().optional(),
  isFavorite: z.boolean().optional(),
});

const updateDraftSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  sections: z.any().optional(),
  settings: z.any().optional(),
  keywords: z.string().optional(),
  metadata: z.any().optional(),
  isFavorite: z.boolean().optional(),
});

// GET /api/content/drafts - Get all drafts for user
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const favorite = searchParams.get("favorite") === "true";

    const drafts = await prisma.contentDraft.findMany({
      where: {
        userId: user.id,
        ...(favorite && { isFavorite: true }),
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    const total = await prisma.contentDraft.count({
      where: {
        userId: user.id,
        ...(favorite && { isFavorite: true }),
      },
    });

    return NextResponse.json({ drafts, total });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}

// POST /api/content/drafts - Create new draft
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
    const validated = createDraftSchema.parse(body);

    const draft = await prisma.contentDraft.create({
      data: {
        userId: user.id,
        title: validated.title,
        content: validated.content,
        sections: validated.sections,
        settings: validated.settings,
        keywords: validated.keywords,
        metadata: validated.metadata,
        isFavorite: validated.isFavorite || false,
      },
      include: {
        versions: true,
      },
    });

    // Create initial version
    await prisma.contentVersion.create({
      data: {
        draftId: draft.id,
        content: validated.content,
        sections: validated.sections,
        version: 1,
      },
    });

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    console.error("Error creating draft:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create draft" },
      { status: 500 }
    );
  }
}

// PATCH /api/content/drafts - Update draft
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
    const validated = updateDraftSchema.parse(body);

    // Verify ownership
    const existingDraft = await prisma.contentDraft.findUnique({
      where: { id: validated.id },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });

    if (!existingDraft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (existingDraft.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, ...updateData } = validated;

    // Update draft
    const draft = await prisma.contentDraft.update({
      where: { id },
      data: updateData,
      include: { versions: true },
    });

    // Create new version if content changed
    if (validated.content && validated.content !== existingDraft.content) {
      const latestVersion = existingDraft.versions[0];
      await prisma.contentVersion.create({
        data: {
          draftId: draft.id,
          content: validated.content,
          sections: validated.sections,
          version: (latestVersion?.version || 0) + 1,
        },
      });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Error updating draft:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update draft" },
      { status: 500 }
    );
  }
}

// DELETE /api/content/drafts?id=xxx - Delete draft
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
    const draftId = searchParams.get("id");

    if (!draftId) {
      return NextResponse.json(
        { error: "Draft ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const draft = await prisma.contentDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (draft.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.contentDraft.delete({
      where: { id: draftId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }
}
