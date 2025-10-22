import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCustomerPortalSession } from "@/lib/stripe";
import { prisma } from "@/lib/db";

/**
 * POST /api/subscription/portal
 * Create a Stripe customer portal session
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user || !user.subscriptions[0]) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    const customerId = user.subscriptions[0].stripeCustomerId;

    if (!customerId || customerId.startsWith("temp_")) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "";
    const portalSession = await createCustomerPortalSession(
      customerId,
      `${origin}/dashboard/subscription`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("[PORTAL_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
