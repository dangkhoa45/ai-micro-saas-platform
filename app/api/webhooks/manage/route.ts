/**
 * Webhook Management API
 * Create, list, update, and delete webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import crypto from "crypto";
import { authOptions } from "@/packages/lib/auth";
import { prisma } from "@/packages/lib/db";

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

const updateWebhookSchema = z.object({
  id: z.string(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Generate webhook secret for signature verification
 */
function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * GET /api/webhooks
 * List user's webhooks
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const webhooks = await prisma.webhook.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Error listing webhooks:", error);
    return NextResponse.json(
      { error: "Failed to list webhooks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook
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
    const validatedData = createWebhookSchema.parse(body);

    // Generate secret
    const secret = generateWebhookSecret();

    // Create webhook
    const webhook = await prisma.webhook.create({
      data: {
        userId: session.user.id,
        url: validatedData.url,
        events: validatedData.events,
        secret,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "webhook.created",
        resource: "webhook",
        resourceId: webhook.id,
        metadata: {
          url: validatedData.url,
          events: validatedData.events,
        },
      },
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error("Error creating webhook:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/webhooks
 * Update a webhook
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
    const validatedData = updateWebhookSchema.parse(body);

    // Verify ownership
    const existing = await prisma.webhook.findUnique({
      where: {
        id: validatedData.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Update webhook
    const { id, ...updateData } = validatedData;
    const webhook = await prisma.webhook.update({
      where: { id },
      data: updateData,
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "webhook.updated",
        resource: "webhook",
        resourceId: id,
        metadata: updateData,
      },
    });

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error("Error updating webhook:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update webhook" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks
 * Delete a webhook
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
    const webhookId = searchParams.get("id");

    if (!webhookId) {
      return NextResponse.json(
        { error: "Webhook ID required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const webhook = await prisma.webhook.findUnique({
      where: {
        id: webhookId,
        userId: session.user.id,
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Delete webhook
    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "webhook.deleted",
        resource: "webhook",
        resourceId: webhookId,
        metadata: {
          url: webhook.url,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
