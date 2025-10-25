/**
 * API Key Management Routes
 * Generate, list, and revoke API keys
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import crypto from "crypto";
import { authOptions } from "@/packages/lib/auth";
import { prisma } from "@/packages/lib/db";

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().min(1).max(365).optional(),
  permissions: z.array(z.string()).optional().default(["read"]),
});

/**
 * Generate a secure API key
 */
function generateApiKey(): string {
  const prefix = "sk_live_";
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString("base64url");
  return `${prefix}${key}`;
}

/**
 * GET /api/keys
 * List user's API keys
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

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mask the keys (show only first 8 and last 4 characters)
    const maskedKeys = apiKeys.map((key) => ({
      ...key,
      key: `${key.key.substring(0, 12)}...${key.key.substring(
        key.key.length - 4
      )}`,
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error) {
    console.error("Error listing API keys:", error);
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keys
 * Create a new API key
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
    const validatedData = createKeySchema.parse(body);

    // Generate unique API key
    const key = generateApiKey();

    // Calculate expiration date
    const expiresAt = validatedData.expiresInDays
      ? new Date(Date.now() + validatedData.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Create API key
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        key,
        permissions: validatedData.permissions,
        expiresAt,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "api.key.created",
        resource: "api_key",
        resourceId: apiKey.id,
        metadata: {
          name: validatedData.name,
          permissions: validatedData.permissions,
        },
      },
    });

    return NextResponse.json(
      {
        key: apiKey,
        message:
          "API key created successfully. Save it now - you won't be able to see it again.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating API key:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/keys
 * Revoke an API key
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
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json(
        { error: "API key ID required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const apiKey = await prisma.apiKey.findUnique({
      where: {
        id: keyId,
        userId: session.user.id,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Soft delete by deactivating
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "api.key.revoked",
        resource: "api_key",
        resourceId: keyId,
        metadata: {
          name: apiKey.name,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/keys
 * Update API key (e.g., toggle active state, update permissions)
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
    const { id, isActive, permissions, name } = body;

    if (!id) {
      return NextResponse.json(
        { error: "API key ID required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingKey = await prisma.apiKey.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Update key
    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(permissions && { permissions }),
        ...(name && { name }),
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "api.key.updated",
        resource: "api_key",
        resourceId: id,
        metadata: {
          changes: { isActive, permissions, name },
        },
      },
    });

    return NextResponse.json({ key: apiKey });
  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    );
  }
}
