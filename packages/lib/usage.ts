/**
 * Usage Tracking Utilities
 * Centralized functions for logging and analyzing AI usage
 */

import { prisma } from "@/lib/db";
import { calculateCost } from "@/lib/ai";

/**
 * Usage log entry data
 */
export interface UsageLogData {
  userId: string;
  appId: string;
  projectId?: string | null;
  type: "text_generation" | "image_generation" | "analysis" | "chat" | "other";
  model: string;
  tokens: number;
  cost?: number;
  metadata?: Record<string, any>;
}

/**
 * Usage statistics for a user
 */
export interface UserUsageStats {
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  averageTokensPerRequest: number;
  averageCostPerRequest: number;
  byModel: Array<{
    model: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
  byApp: Array<{
    appId: string;
    appName: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
  byType: Array<{
    type: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
}

/**
 * Daily usage data point
 */
export interface DailyUsage {
  date: string;
  tokens: number;
  cost: number;
  requests: number;
}

/**
 * Log AI usage to the database
 *
 * @param data - Usage log data
 * @returns Created usage log entry
 */
export async function logUsage(data: UsageLogData) {
  try {
    const usageLog = await prisma.usageLog.create({
      data: {
        userId: data.userId,
        appId: data.appId,
        projectId: data.projectId || null,
        type: data.type,
        model: data.model,
        tokens: data.tokens,
        cost: data.cost || 0,
        metadata: data.metadata || {},
      },
    });

    return usageLog;
  } catch (error) {
    console.error("[USAGE_LOG_ERROR]", error);
    throw new Error("Failed to log usage");
  }
}

/**
 * Get total token usage for a user in the current month
 *
 * @param userId - User ID
 * @returns Total tokens used this month
 */
export async function getMonthlyTokenUsage(userId: string): Promise<number> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await prisma.usageLog.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        tokens: true,
      },
    });

    return result._sum.tokens || 0;
  } catch (error) {
    console.error("[MONTHLY_USAGE_ERROR]", error);
    return 0;
  }
}

/**
 * Get total cost for a user in the current month
 *
 * @param userId - User ID
 * @returns Total cost this month in USD
 */
export async function getMonthlyCost(userId: string): Promise<number> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await prisma.usageLog.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        cost: true,
      },
    });

    return result._sum.cost || 0;
  } catch (error) {
    console.error("[MONTHLY_COST_ERROR]", error);
    return 0;
  }
}

/**
 * Get comprehensive usage statistics for a user
 *
 * @param userId - User ID
 * @param startDate - Optional start date (defaults to beginning of current month)
 * @param endDate - Optional end date (defaults to now)
 * @returns Detailed usage statistics
 */
export async function getUserUsageStats(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UserUsageStats> {
  try {
    // Default to current month if no dates provided
    if (!startDate) {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    if (!endDate) {
      endDate = new Date();
    }

    // Get all usage logs for the period
    const logs = await prisma.usageLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        app: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Calculate totals
    const totalTokens = logs.reduce((sum, log) => sum + log.tokens, 0);
    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
    const totalRequests = logs.length;

    // Group by model
    const byModelMap = new Map<
      string,
      { tokens: number; cost: number; requests: number }
    >();
    logs.forEach((log) => {
      const model = log.model || "unknown";
      const existing = byModelMap.get(model) || {
        tokens: 0,
        cost: 0,
        requests: 0,
      };
      byModelMap.set(model, {
        tokens: existing.tokens + log.tokens,
        cost: existing.cost + log.cost,
        requests: existing.requests + 1,
      });
    });

    const byModel = Array.from(byModelMap.entries()).map(([model, stats]) => ({
      model,
      ...stats,
    }));

    // Group by app
    const byAppMap = new Map<
      string,
      { appName: string; tokens: number; cost: number; requests: number }
    >();
    logs.forEach((log) => {
      const existing = byAppMap.get(log.appId) || {
        appName: log.app.name,
        tokens: 0,
        cost: 0,
        requests: 0,
      };
      byAppMap.set(log.appId, {
        appName: log.app.name,
        tokens: existing.tokens + log.tokens,
        cost: existing.cost + log.cost,
        requests: existing.requests + 1,
      });
    });

    const byApp = Array.from(byAppMap.entries()).map(([appId, stats]) => ({
      appId,
      ...stats,
    }));

    // Group by type
    const byTypeMap = new Map<
      string,
      { tokens: number; cost: number; requests: number }
    >();
    logs.forEach((log) => {
      const existing = byTypeMap.get(log.type) || {
        tokens: 0,
        cost: 0,
        requests: 0,
      };
      byTypeMap.set(log.type, {
        tokens: existing.tokens + log.tokens,
        cost: existing.cost + log.cost,
        requests: existing.requests + 1,
      });
    });

    const byType = Array.from(byTypeMap.entries()).map(([type, stats]) => ({
      type,
      ...stats,
    }));

    return {
      totalTokens,
      totalCost,
      totalRequests,
      averageTokensPerRequest:
        totalRequests > 0 ? totalTokens / totalRequests : 0,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      byModel,
      byApp,
      byType,
    };
  } catch (error) {
    console.error("[USER_USAGE_STATS_ERROR]", error);
    throw new Error("Failed to get usage statistics");
  }
}

/**
 * Get daily usage data for charts
 *
 * @param userId - User ID
 * @param days - Number of days to retrieve (default: 30)
 * @returns Array of daily usage data
 */
export async function getDailyUsage(
  userId: string,
  days: number = 30
): Promise<DailyUsage[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const logs = await prisma.usageLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by date
    const dailyMap = new Map<
      string,
      { tokens: number; cost: number; requests: number }
    >();

    logs.forEach((log) => {
      const dateKey = log.createdAt.toISOString().split("T")[0];
      const existing = dailyMap.get(dateKey) || {
        tokens: 0,
        cost: 0,
        requests: 0,
      };
      dailyMap.set(dateKey, {
        tokens: existing.tokens + log.tokens,
        cost: existing.cost + log.cost,
        requests: existing.requests + 1,
      });
    });

    // Convert to array and fill missing days with zeros
    const result: DailyUsage[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < days; i++) {
      const dateKey = currentDate.toISOString().split("T")[0];
      const data = dailyMap.get(dateKey) || {
        tokens: 0,
        cost: 0,
        requests: 0,
      };

      result.push({
        date: dateKey,
        ...data,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  } catch (error) {
    console.error("[DAILY_USAGE_ERROR]", error);
    return [];
  }
}

/**
 * Get recent usage logs for a user
 *
 * @param userId - User ID
 * @param limit - Number of logs to retrieve (default: 20)
 * @returns Array of recent usage logs
 */
export async function getRecentUsage(userId: string, limit: number = 20) {
  try {
    const logs = await prisma.usageLog.findMany({
      where: {
        userId,
      },
      include: {
        app: {
          select: {
            name: true,
            slug: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return logs;
  } catch (error) {
    console.error("[RECENT_USAGE_ERROR]", error);
    return [];
  }
}

/**
 * Check if user has remaining quota
 *
 * @param userId - User ID
 * @param requiredTokens - Number of tokens needed
 * @param monthlyLimit - Monthly token limit
 * @returns true if user has enough quota
 */
export async function hasRemainingQuota(
  userId: string,
  requiredTokens: number,
  monthlyLimit: number
): Promise<boolean> {
  try {
    const currentUsage = await getMonthlyTokenUsage(userId);
    return currentUsage + requiredTokens <= monthlyLimit;
  } catch (error) {
    console.error("[QUOTA_CHECK_ERROR]", error);
    return false;
  }
}

/**
 * Get usage summary for all users (admin function)
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Aggregated usage statistics
 */
export async function getGlobalUsageStats(startDate: Date, endDate: Date) {
  try {
    const logs = await prisma.usageLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalTokens = logs.reduce((sum, log) => sum + log.tokens, 0);
    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
    const totalRequests = logs.length;
    const uniqueUsers = new Set(logs.map((log) => log.userId)).size;

    return {
      totalTokens,
      totalCost,
      totalRequests,
      uniqueUsers,
      averageTokensPerRequest:
        totalRequests > 0 ? totalTokens / totalRequests : 0,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
    };
  } catch (error) {
    console.error("[GLOBAL_USAGE_STATS_ERROR]", error);
    throw new Error("Failed to get global usage statistics");
  }
}
