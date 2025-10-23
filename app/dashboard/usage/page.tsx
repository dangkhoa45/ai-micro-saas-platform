import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getUserUsageStats,
  getDailyUsage,
  getRecentUsage,
  getMonthlyTokenUsage,
  getMonthlyCost,
} from "@/lib/usage";
import { getUserSubscription } from "@/lib/subscription";

export const metadata = {
  title: "Usage Statistics | AI Micro-SaaS Platform",
  description: "View your AI usage statistics, token consumption, and costs",
};

/**
 * Format large numbers with commas
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format cost in USD
 */
function formatCost(cost: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
  }).format(cost);
}

/**
 * Format date
 */
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Calculate percentage
 */
function calculatePercentage(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

/**
 * Usage statistics page
 */
export default async function UsagePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch all usage data
  const [
    subscription,
    monthlyTokens,
    monthlyCost,
    stats,
    dailyUsage,
    recentLogs,
  ] = await Promise.all([
    getUserSubscription(session.user.id),
    getMonthlyTokenUsage(session.user.id),
    getMonthlyCost(session.user.id),
    getUserUsageStats(session.user.id),
    getDailyUsage(session.user.id, 30),
    getRecentUsage(session.user.id, 10),
  ]);

  const usagePercentage = calculatePercentage(
    monthlyTokens,
    subscription.limits.monthlyTokens
  );

  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usage Statistics</h1>
        <p className="text-muted-foreground mt-2">
          Track your AI usage, token consumption, and costs
        </p>
      </div>

      {/* Usage Alert */}
      {isNearLimit && (
        <div
          className={`rounded-lg border p-4 ${
            isAtLimit
              ? "border-red-500 bg-red-50 dark:bg-red-950/30"
              : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30"
          }`}
        >
          <h3
            className={`font-semibold ${
              isAtLimit
                ? "text-red-900 dark:text-red-100"
                : "text-yellow-900 dark:text-yellow-100"
            }`}
          >
            {isAtLimit ? "⚠️ Quota Exceeded" : "⚡ Approaching Limit"}
          </h3>
          <p
            className={`text-sm mt-1 ${
              isAtLimit
                ? "text-red-800 dark:text-red-200"
                : "text-yellow-800 dark:text-yellow-200"
            }`}
          >
            {isAtLimit
              ? `You have reached your monthly limit of ${formatNumber(
                  subscription.limits.monthlyTokens
                )} tokens. Please upgrade your plan to continue using AI features.`
              : `You have used ${usagePercentage}% of your monthly token quota. Consider upgrading to avoid interruptions.`}
          </p>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Current Plan */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Current Plan
            </h3>
          </div>
          <p className="text-2xl font-bold mt-2 capitalize">
            {subscription.plan}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatNumber(subscription.limits.monthlyTokens)} tokens/month
          </p>
        </div>

        {/* Tokens Used */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Tokens Used
            </h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {formatNumber(monthlyTokens)}
          </p>
          <div className="mt-2 h-2 rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                isAtLimit
                  ? "bg-red-500"
                  : isNearLimit
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{
                width: `${Math.min(100, usagePercentage)}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatNumber(subscription.limits.monthlyTokens - monthlyTokens)}{" "}
            remaining ({usagePercentage}%)
          </p>
        </div>

        {/* Monthly Cost */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Monthly Cost
            </h3>
          </div>
          <p className="text-2xl font-bold mt-2">{formatCost(monthlyCost)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Avg: {formatCost(stats.averageCostPerRequest)} per request
          </p>
        </div>

        {/* Total Requests */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Requests
            </h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {formatNumber(stats.totalRequests)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Avg: {formatNumber(Math.round(stats.averageTokensPerRequest))}{" "}
            tokens each
          </p>
        </div>
      </div>

      {/* Usage by Model */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4">Usage by Model</h3>
        <div className="space-y-3">
          {stats.byModel.length > 0 ? (
            stats.byModel.map((model) => {
              const percentage = (model.tokens / stats.totalTokens) * 100;
              return (
                <div key={model.model}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{model.model}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold">
                        {formatNumber(model.tokens)} tokens
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formatCost(model.cost)})
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No usage data available yet
            </p>
          )}
        </div>
      </div>

      {/* Usage by App */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4">Usage by Application</h3>
        <div className="space-y-3">
          {stats.byApp.length > 0 ? (
            stats.byApp.map((app) => {
              const percentage = (app.tokens / stats.totalTokens) * 100;
              return (
                <div key={app.appId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{app.appName}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold">
                        {formatNumber(app.requests)} requests
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formatNumber(app.tokens)} tokens)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No usage data available yet
            </p>
          )}
        </div>
      </div>

      {/* Daily Usage Chart (Simple Text-Based) */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4">Daily Usage (Last 30 Days)</h3>
        <div className="space-y-2">
          {dailyUsage.slice(-7).map((day) => {
            const maxTokens = Math.max(...dailyUsage.map((d) => d.tokens));
            const percentage =
              maxTokens > 0 ? (day.tokens / maxTokens) * 100 : 0;
            return (
              <div key={day.date}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(day.date)}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-medium">
                      {formatNumber(day.tokens)} tokens
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({day.requests} req)
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentLogs.length > 0 ? (
            recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{log.app.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()} •{" "}
                    {log.model || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatNumber(log.tokens)} tokens
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCost(log.cost)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
