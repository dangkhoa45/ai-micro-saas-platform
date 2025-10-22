import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createCheckoutSession,
  createStripeCustomer,
  createCustomerPortalSession,
} from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { z } from "zod";

/**
 * Checkout session schema
 */
const checkoutSchema = z.object({
  priceId: z.string(),
});

/**
 * POST /api/subscription/checkout
 * Create a Stripe checkout session
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    const { priceId } = validation.data;

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.subscriptions[0]?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId || customerId.startsWith("temp_")) {
      const customer = await createStripeCustomer(user.email || "", user.id);
      customerId = customer.id;

      // Update subscription with real customer ID
      if (user.subscriptions[0]) {
        await prisma.subscription.update({
          where: { id: user.subscriptions[0].id },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    // Create checkout session
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "";
    const checkoutSession = await createCheckoutSession(
      customerId,
      priceId,
      `${origin}/dashboard/subscription?success=true`,
      `${origin}/dashboard/subscription?canceled=true`
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("[CHECKOUT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
