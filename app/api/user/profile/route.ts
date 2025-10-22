import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Update profile schema
 */
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    )
    .optional(),
});

/**
 * PUT /api/user/profile
 * Update user profile information
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, email, currentPassword, newPassword } = validation.data;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }

      if (!user.password) {
        return NextResponse.json(
          {
            error:
              "Cannot set password for OAuth account. Please use your OAuth provider.",
          },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      updateData.email = email;
    }

    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[PROFILE_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/profile
 * Get current user profile
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
