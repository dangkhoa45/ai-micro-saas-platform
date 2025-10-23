import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import {
  hasActiveSubscription,
  hasExceededQuota,
  getUserSubscription,
  PlanName,
} from "./subscription";

/**
 * Middleware to check if user has an active subscription
 */
export async function requireSubscription(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasActive = await hasActiveSubscription(session.user.id);

  if (!hasActive) {
    return NextResponse.json(
      {
        error: "Subscription required",
        message:
          "This feature requires an active subscription. Please upgrade your plan.",
      },
      { status: 403 }
    );
  }

  return null; // Allow request to continue
}

/**
 * Middleware to check if user has not exceeded their quota
 */
export async function checkQuota(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exceeded = await hasExceededQuota(session.user.id);

  if (exceeded) {
    return NextResponse.json(
      {
        error: "Quota exceeded",
        message:
          "You have reached your monthly token limit. Please upgrade your plan or wait until next month.",
      },
      { status: 429 }
    );
  }

  return null; // Allow request to continue
}

/**
 * Middleware to check if user has a specific plan
 */
export async function requirePlan(
  request: NextRequest,
  requiredPlan: PlanName | PlanName[]
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await getUserSubscription(session.user.id);

  const requiredPlans = Array.isArray(requiredPlan)
    ? requiredPlan
    : [requiredPlan];

  if (!requiredPlans.includes(plan)) {
    return NextResponse.json(
      {
        error: "Plan upgrade required",
        message: `This feature requires a ${requiredPlans.join(" or ")} plan.`,
        currentPlan: plan,
        requiredPlans,
      },
      { status: 403 }
    );
  }

  return null; // Allow request to continue
}

/**
 * Combined middleware: Check auth, subscription, and quota
 */
export async function requireSubscriptionAndQuota(request: NextRequest) {
  // First check subscription
  const subscriptionCheck = await requireSubscription(request);
  if (subscriptionCheck) return subscriptionCheck;

  // Then check quota
  const quotaCheck = await checkQuota(request);
  if (quotaCheck) return quotaCheck;

  return null; // All checks passed
}

/**
 * Helper to get user from request
 */
export async function getUserFromRequest(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}
