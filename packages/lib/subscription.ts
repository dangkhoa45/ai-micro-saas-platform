import { prisma } from "./db";

/**
 * Subscription plan limits and features
 */
export const PLAN_LIMITS = {
  free: {
    name: "Free",
    monthlyTokens: 10000,
    features: ["Basic AI Writer", "5 projects", "Community support"],
  },
  starter: {
    name: "Starter",
    monthlyTokens: 100000,
    features: [
      "Advanced AI Writer",
      "20 projects",
      "Email support",
      "Export to PDF",
    ],
  },
  pro: {
    name: "Pro",
    monthlyTokens: 500000,
    features: [
      "All AI tools",
      "Unlimited projects",
      "Priority support",
      "Advanced analytics",
      "Team collaboration",
    ],
  },
  business: {
    name: "Business",
    monthlyTokens: 2000000,
    features: [
      "Everything in Pro",
      "Custom AI models",
      "API access",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
    },
  });

  return !!subscription && subscription.plan !== "free";
}

/**
 * Get user's current subscription with limits
 */
export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const plan = (subscription?.plan || "free") as PlanName;
  const limits = PLAN_LIMITS[plan];

  return {
    subscription,
    plan,
    limits,
    isActive: subscription?.status === "active",
    isPaid: plan !== "free",
  };
}

/**
 * Get user's token usage for current month
 */
export async function getMonthlyTokenUsage(userId: string): Promise<number> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const usage = await prisma.usageLog.aggregate({
    where: {
      userId,
      createdAt: {
        gte: firstDayOfMonth,
      },
    },
    _sum: {
      tokens: true,
    },
  });

  return usage._sum.tokens || 0;
}

/**
 * Check if user has exceeded their monthly token quota
 */
export async function hasExceededQuota(userId: string): Promise<boolean> {
  const { plan, limits } = await getUserSubscription(userId);
  const usage = await getMonthlyTokenUsage(userId);

  return usage >= limits.monthlyTokens;
}

/**
 * Get remaining tokens for current month
 */
export async function getRemainingTokens(userId: string): Promise<number> {
  const { limits } = await getUserSubscription(userId);
  const usage = await getMonthlyTokenUsage(userId);

  return Math.max(0, limits.monthlyTokens - usage);
}

/**
 * Check if user can access a specific feature
 */
export async function canAccessFeature(
  userId: string,
  feature: string
): Promise<boolean> {
  const { plan, limits } = await getUserSubscription(userId);

  // Check if feature is in plan
  return limits.features.some((f) =>
    f.toLowerCase().includes(feature.toLowerCase())
  );
}

/**
 * Check if user needs to upgrade to access more tokens
 */
export async function needsUpgrade(userId: string): Promise<{
  needsUpgrade: boolean;
  currentPlan: PlanName;
  suggestedPlan?: PlanName;
  usage: number;
  limit: number;
}> {
  const { plan, limits } = await getUserSubscription(userId);
  const usage = await getMonthlyTokenUsage(userId);

  const needsUpgrade = usage >= limits.monthlyTokens * 0.9; // 90% threshold

  let suggestedPlan: PlanName | undefined;
  if (needsUpgrade) {
    // Suggest next tier
    const planTiers: PlanName[] = ["free", "starter", "pro", "business"];
    const currentIndex = planTiers.indexOf(plan);
    if (currentIndex < planTiers.length - 1) {
      suggestedPlan = planTiers[currentIndex + 1];
    }
  }

  return {
    needsUpgrade,
    currentPlan: plan,
    suggestedPlan,
    usage,
    limit: limits.monthlyTokens,
  };
}
