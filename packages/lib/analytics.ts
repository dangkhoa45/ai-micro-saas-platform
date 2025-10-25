import { prisma } from "./db";

export interface UsageStats {
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  byApp: {
    appName: string;
    tokens: number;
    cost: number;
    requests: number;
  }[];
  byModel: {
    model: string;
    tokens: number;
    cost: number;
    requests: number;
  }[];
  dailyUsage: {
    date: string;
    tokens: number;
    cost: number;
    requests: number;
  }[];
}

export interface UsageLimits {
  tokenLimit: number;
  costLimit: number;
  requestLimit: number;
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageStats> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
  const end = endDate || new Date();

  // Get all usage logs for the period
  const logs = await prisma.usageLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      app: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Calculate total stats
  const totalTokens = logs.reduce((sum, log) => sum + log.tokens, 0);
  const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
  const totalRequests = logs.length;

  // Group by app
  const appMap = new Map<
    string,
    { tokens: number; cost: number; requests: number }
  >();

  logs.forEach((log) => {
    const appName = log.app.name;
    const current = appMap.get(appName) || {
      tokens: 0,
      cost: 0,
      requests: 0,
    };
    appMap.set(appName, {
      tokens: current.tokens + log.tokens,
      cost: current.cost + log.cost,
      requests: current.requests + 1,
    });
  });

  const byApp = Array.from(appMap.entries()).map(([appName, stats]) => ({
    appName,
    ...stats,
  }));

  // Group by model
  const modelMap = new Map<
    string,
    { tokens: number; cost: number; requests: number }
  >();

  logs.forEach((log) => {
    const model = log.model || "unknown";
    const current = modelMap.get(model) || {
      tokens: 0,
      cost: 0,
      requests: 0,
    };
    modelMap.set(model, {
      tokens: current.tokens + log.tokens,
      cost: current.cost + log.cost,
      requests: current.requests + 1,
    });
  });

  const byModel = Array.from(modelMap.entries()).map(([model, stats]) => ({
    model,
    ...stats,
  }));

  // Group by day
  const dayMap = new Map<
    string,
    { tokens: number; cost: number; requests: number }
  >();

  logs.forEach((log) => {
    const date = log.createdAt.toISOString().split("T")[0];
    const current = dayMap.get(date) || { tokens: 0, cost: 0, requests: 0 };
    dayMap.set(date, {
      tokens: current.tokens + log.tokens,
      cost: current.cost + log.cost,
      requests: current.requests + 1,
    });
  });

  const dailyUsage = Array.from(dayMap.entries())
    .map(([date, stats]) => ({
      date,
      ...stats,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalTokens,
    totalCost,
    totalRequests,
    byApp,
    byModel,
    dailyUsage,
  };
}

/**
 * Get usage limits based on subscription plan
 */
export function getUsageLimits(plan: string): UsageLimits {
  const limits: { [key: string]: UsageLimits } = {
    free: {
      tokenLimit: 10000,
      costLimit: 1.0,
      requestLimit: 100,
    },
    basic: {
      tokenLimit: 100000,
      costLimit: 10.0,
      requestLimit: 1000,
    },
    pro: {
      tokenLimit: 1000000,
      costLimit: 100.0,
      requestLimit: 10000,
    },
    enterprise: {
      tokenLimit: Infinity,
      costLimit: Infinity,
      requestLimit: Infinity,
    },
  };

  return limits[plan] || limits.free;
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercentage(used: number, limit: number): number {
  if (limit === Infinity) return 0;
  return Math.min(100, (used / limit) * 100);
}

/**
 * Check if user is approaching limit
 */
export function isApproachingLimit(
  used: number,
  limit: number,
  threshold: number = 80
): boolean {
  if (limit === Infinity) return false;
  return calculateUsagePercentage(used, limit) >= threshold;
}

/**
 * Get usage trend (increase/decrease percentage)
 */
export function getUsageTrend(
  current: number,
  previous: number
): { percentage: number; direction: "up" | "down" | "stable" } {
  if (previous === 0) {
    return { percentage: 0, direction: "stable" };
  }

  const percentage = ((current - previous) / previous) * 100;

  if (Math.abs(percentage) < 5) {
    return { percentage: 0, direction: "stable" };
  }

  return {
    percentage: Math.abs(percentage),
    direction: percentage > 0 ? "up" : "down",
  };
}
