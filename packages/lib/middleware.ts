import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import {
  hasActiveSubscription,
  hasExceededQuota,
  getUserSubscription,
  PlanName,
} from "./subscription";
import { logger } from "./logger";
import { prisma } from "./db";

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

/**
 * Rate limit configuration per plan
 */
const RATE_LIMITS = {
  free: { requestsPerMinute: 5, requestsPerHour: 20 },
  starter: { requestsPerMinute: 15, requestsPerHour: 100 },
  pro: { requestsPerMinute: 60, requestsPerHour: 500 },
  business: { requestsPerMinute: 120, requestsPerHour: 2000 },
};

/**
 * In-memory rate limit store
 * In production, this should be replaced with Redis or similar
 */
const rateLimitStore = new Map<
  string,
  { requests: { timestamp: number }[]; lastCleanup: number }
>();

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  rateLimitStore.forEach((value, key) => {
    // Remove requests older than 1 hour
    value.requests = value.requests.filter(
      (r: { timestamp: number }) => r.timestamp > oneHourAgo
    );

    // Remove entry if no recent requests
    if (value.requests.length === 0) {
      rateLimitStore.delete(key);
    }

    value.lastCleanup = now;
  });
}

/**
 * Check rate limit for user
 */
function checkRateLimit(
  userId: string,
  plan: PlanName
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const now = Date.now();
  const limits = RATE_LIMITS[plan];

  // Get or create user rate limit data
  if (!rateLimitStore.has(userId)) {
    rateLimitStore.set(userId, { requests: [], lastCleanup: now });
  }

  const userData = rateLimitStore.get(userId)!;

  // Cleanup old requests periodically
  if (now - userData.lastCleanup > 5 * 60 * 1000) {
    cleanupRateLimitStore();
  }

  // Filter requests within the last minute
  const oneMinuteAgo = now - 60 * 1000;
  const recentRequests = userData.requests.filter(
    (r) => r.timestamp > oneMinuteAgo
  );

  // Calculate remaining and reset time
  const remaining = Math.max(
    0,
    limits.requestsPerMinute - recentRequests.length
  );
  const oldestRequest = recentRequests[0];
  const resetTime = oldestRequest
    ? oldestRequest.timestamp + 60 * 1000
    : now + 60 * 1000;

  // Check if limit exceeded
  if (recentRequests.length >= limits.requestsPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      resetTime,
      limit: limits.requestsPerMinute,
    };
  }

  // Add current request
  userData.requests.push({ timestamp: now });

  return {
    allowed: true,
    remaining: remaining - 1,
    resetTime,
    limit: limits.requestsPerMinute,
  };
}

/**
 * Rate limiting middleware
 * Enforces rate limits based on user subscription plan
 */
export async function requireRateLimit(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await getUserSubscription(session.user.id);

  const rateLimitResult = checkRateLimit(session.user.id, plan);

  if (!rateLimitResult.allowed) {
    logger.rateLimit({
      userId: session.user.id,
      endpoint: request.nextUrl.pathname,
      limit: rateLimitResult.limit,
    });

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Too many requests. Your ${plan} plan allows ${rateLimitResult.limit} requests per minute.`,
        limit: rateLimitResult.limit,
        remaining: 0,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(
            Math.floor(rateLimitResult.resetTime / 1000)
          ),
        },
      }
    );
  }

  return null; // Allow request to continue
}

/**
 * Combined middleware: Auth, subscription, quota, and rate limiting
 */
export async function requireFullAccess(request: NextRequest) {
  // 1. Check subscription
  const subscriptionCheck = await requireSubscription(request);
  if (subscriptionCheck) return subscriptionCheck;

  // 2. Check rate limit
  const rateLimitCheck = await requireRateLimit(request);
  if (rateLimitCheck) return rateLimitCheck;

  // 3. Check quota
  const quotaCheck = await checkQuota(request);
  if (quotaCheck) return quotaCheck;

  return null; // All checks passed
}
