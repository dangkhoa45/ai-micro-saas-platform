import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

/**
 * Register schema validation
 */
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Create free subscription for new user
    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: `temp_${user.id}`, // Temporary, will be updated when Stripe customer is created
        plan: "free",
        status: "active",
      },
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
