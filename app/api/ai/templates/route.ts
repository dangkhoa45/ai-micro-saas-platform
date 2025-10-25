/**
 * Prompt Template API Routes
 * Endpoints for managing custom prompt templates
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/packages/lib/auth";
import {
  createPromptTemplate,
  listPromptTemplates,
  getPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
} from "@/packages/lib/utils/prompt-template-utils";

// Validation schema
const promptVariableSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "array"]),
  description: z.string(),
  required: z.boolean().optional(),
  default: z.any().optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  template: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  variables: z.array(promptVariableSchema).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(32000).optional(),
  topP: z.number().min(0).max(1).optional(),
});

const updateTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  template: z.string().min(1).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  variables: z.array(promptVariableSchema).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(32000).optional(),
  topP: z.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/ai/templates
 * List prompt templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || undefined;
    const tags = searchParams.get("tags")?.split(",") || undefined;
    const isPublic = searchParams.get("isPublic") === "true" ? true : undefined;
    const isFeatured =
      searchParams.get("isFeatured") === "true" ? true : undefined;
    const searchQuery = searchParams.get("search") || undefined;

    const templates = await listPromptTemplates({
      userId: session?.user?.id,
      category,
      tags,
      isPublic,
      isFeatured,
      searchQuery,
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error listing templates:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/templates
 * Create a new prompt template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    const template = await createPromptTemplate(session.user.id, validatedData);

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/templates
 * Update a prompt template
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    const template = await updatePromptTemplate(validatedData, session.user.id);

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error updating template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/templates
 * Delete a prompt template
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    await deletePromptTemplate(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
