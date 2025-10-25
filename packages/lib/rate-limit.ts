/**
 * Rate Limiting Utility
 * Implements token bucket algorithm for rate limiting API requests
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens in the window
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory store for rate limiting (use Redis in production)
const tokenCache = new Map<string, number[]>();

/**
 * Rate limiter using sliding window algorithm
 */
export function rateLimit(config: RateLimitConfig) {
  return {
    check: async (
      identifier: string,
      limit: number
    ): Promise<RateLimitResult> => {
      const now = Date.now();
      const windowStart = now - config.interval;

      // Get or initialize token bucket
      let tokens = tokenCache.get(identifier) || [];

      // Remove expired tokens
      tokens = tokens.filter((timestamp) => timestamp > windowStart);

      // Check if limit exceeded
      const success = tokens.length < limit;
      const remaining = Math.max(0, limit - tokens.length);

      if (success) {
        // Add new token
        tokens.push(now);
        tokenCache.set(identifier, tokens);
      }

      // Calculate reset time
      const oldestToken = tokens[0] || now;
      const reset = oldestToken + config.interval;

      // Cleanup old entries periodically
      if (tokenCache.size > config.uniqueTokenPerInterval) {
        const entriesToDelete: string[] = [];
        tokenCache.forEach((value, key) => {
          if (value.length === 0 || value[value.length - 1] < windowStart) {
            entriesToDelete.push(key);
          }
        });
        entriesToDelete.forEach((key) => tokenCache.delete(key));
      }

      return {
        success,
        limit,
        remaining: success ? remaining - 1 : remaining,
        reset,
      };
    },
  };
}

/**
 * Create rate limiter for API routes
 */
export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

/**
 * Create rate limiter for authentication routes
 */
export const authLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
});

/**
 * Create rate limiter for AI generation routes
 */
export const aiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

/**
 * Get client identifier (IP address or user ID)
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`;

  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  const ip = forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown";
  return `ip:${ip}`;
}

/**
 * Rate limit response headers
 */
export function setRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
): void {
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", new Date(result.reset).toISOString());
}

/**
 * Middleware wrapper for rate limiting
 */
export async function withRateLimit(
  request: Request,
  handler: () => Promise<Response>,
  options: {
    limiter: ReturnType<typeof rateLimit>;
    limit: number;
    userId?: string;
  }
): Promise<Response> {
  const identifier = getClientIdentifier(request, options.userId);
  const result = await options.limiter.check(identifier, options.limit);

  if (!result.success) {
    const response = new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(
            (result.reset - Date.now()) / 1000
          ).toString(),
        },
      }
    );

    setRateLimitHeaders(response.headers, result);
    return response;
  }

  const response = await handler();
  setRateLimitHeaders(response.headers, result);
  return response;
}
