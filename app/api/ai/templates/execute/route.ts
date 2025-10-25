/**
 * Execute Prompt Template API
 * Execute a template with variables and AI generation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/packages/lib/auth";
import {
  executePromptTemplate,
  rateTemplate,
} from "@/packages/lib/utils/prompt-template-utils";
import { generateText } from "@/packages/lib/ai";

const executeSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.any()).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(32000).optional(),
  topP: z.number().min(0).max(1).optional(),
  generate: z.boolean().optional().default(true), // Whether to generate AI response
});

const rateSchema = z.object({
  templateId: z.string(),
  rating: z.number().min(1).max(5),
});

/**
 * POST /api/ai/templates/execute
 * Execute a template and optionally generate AI response
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
    const validatedData = executeSchema.parse(body);

    // Execute template to get interpolated prompt
    const prompt = await executePromptTemplate(validatedData.templateId, {
      userId: session.user.id,
      variables: validatedData.variables,
      model: validatedData.model,
      temperature: validatedData.temperature,
      maxTokens: validatedData.maxTokens,
      topP: validatedData.topP,
    });

    // If generate is false, just return the prompt
    if (!validatedData.generate) {
      return NextResponse.json({ prompt });
    }

    // Generate AI response
    const result = await generateText(prompt, {
      model: validatedData.model,
      temperature: validatedData.temperature,
      maxTokens: validatedData.maxTokens,
    });

    return NextResponse.json({
      prompt,
      response: result.text,
      usage: result.usage,
      model: result.model,
    });
  } catch (error) {
    console.error("Error executing template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to execute template",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/templates/rate
 * Rate a template
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
    const validatedData = rateSchema.parse(body);

    await rateTemplate(validatedData.templateId, validatedData.rating);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rating template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to rate template" },
      { status: 500 }
    );
  }
}
