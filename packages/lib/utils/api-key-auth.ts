/**
 * API Key Authentication Utilities
 * Verify and validate API keys for external API access
 */

import { NextRequest } from "next/server";
import { prisma } from "../db";

export interface ApiKeyAuth {
  valid: boolean;
  userId?: string;
  keyId?: string;
  permissions?: string[];
  error?: string;
}

/**
 * Verify API key from request headers
 */
export async function verifyApiKey(request: NextRequest): Promise<ApiKeyAuth> {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return {
        valid: false,
        error: "Missing authorization header",
      };
    }

    // Extract key from "Bearer <key>" format
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return {
        valid: false,
        error: "Invalid authorization header format. Use: Bearer <api_key>",
      };
    }

    const apiKey = parts[1];

    // Validate key format
    if (!apiKey.startsWith("sk_live_")) {
      return {
        valid: false,
        error: "Invalid API key format",
      };
    }

    // Look up key in database
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      select: {
        id: true,
        userId: true,
        permissions: true,
        isActive: true,
        expiresAt: true,
      },
    });

    if (!keyRecord) {
      return {
        valid: false,
        error: "Invalid API key",
      };
    }

    // Check if key is active
    if (!keyRecord.isActive) {
      return {
        valid: false,
        error: "API key has been revoked",
      };
    }

    // Check if key has expired
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return {
        valid: false,
        error: "API key has expired",
      };
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      valid: true,
      userId: keyRecord.userId,
      keyId: keyRecord.id,
      permissions: keyRecord.permissions,
    };
  } catch (error) {
    console.error("Error verifying API key:", error);
    return {
      valid: false,
      error: "Internal server error during API key verification",
    };
  }
}

/**
 * Check if API key has specific permission
 */
export function hasPermission(
  auth: ApiKeyAuth,
  requiredPermission: string
): boolean {
  if (!auth.valid || !auth.permissions) {
    return false;
  }

  // Admin permission grants all access
  if (auth.permissions.includes("admin")) {
    return true;
  }

  return auth.permissions.includes(requiredPermission);
}

/**
 * Get user from API key authentication
 */
export async function getUserFromApiKey(auth: ApiKeyAuth) {
  if (!auth.valid || !auth.userId) {
    return null;
  }

  return await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptions: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}
