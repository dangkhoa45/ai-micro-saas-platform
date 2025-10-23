/**
 * Structured Logging System
 * Centralized logging for all AI operations and application events
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * Log context for structured logging
 */
export interface LogContext {
  userId?: string;
  requestId?: string;
  model?: string;
  provider?: string;
  appId?: string;
  projectId?: string;
  [key: string]: any;
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
    status?: number;
  };
  performance?: {
    duration: number;
    tokens?: number;
    cost?: number;
  };
}

/**
 * Logger class for structured logging
 */
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  /**
   * Format log entry for output
   */
  private format(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      return JSON.stringify(entry, null, 2);
    }
    // Compact format for production
    return JSON.stringify(entry);
  }

  /**
   * Log a message with the specified level
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error | any,
    performance?: { duration: number; tokens?: number; cost?: number }
  ) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        message: error?.message || String(error),
        stack: error?.stack,
        code: error?.code,
        status: error?.status,
      };
    }

    if (performance) {
      entry.performance = performance;
    }

    const formatted = this.format(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.log(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning
   */
  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error
   */
  error(message: string, error?: Error | any, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log AI request
   */
  aiRequest(data: {
    userId: string;
    model: string;
    provider: string;
    prompt: string;
    tokens?: number;
    appId?: string;
    projectId?: string;
  }) {
    this.info("AI request started", {
      userId: data.userId,
      model: data.model,
      provider: data.provider,
      promptLength: data.prompt.length,
      tokens: data.tokens,
      appId: data.appId,
      projectId: data.projectId,
    });
  }

  /**
   * Log AI response
   */
  aiResponse(data: {
    userId: string;
    model: string;
    provider: string;
    tokens: number;
    cost: number;
    duration: number;
    success: boolean;
    error?: Error | any;
  }) {
    if (data.success) {
      this.info("AI request completed", {
        userId: data.userId,
        model: data.model,
        provider: data.provider,
        performance: {
          duration: data.duration,
          tokens: data.tokens,
          cost: data.cost,
        },
      });
    } else {
      this.error("AI request failed", data.error, {
        userId: data.userId,
        model: data.model,
        provider: data.provider,
      });
    }
  }

  /**
   * Log API request
   */
  apiRequest(data: {
    method: string;
    path: string;
    userId?: string;
    body?: any;
  }) {
    this.info(`API ${data.method} ${data.path}`, {
      userId: data.userId,
      method: data.method,
      path: data.path,
      bodySize: data.body ? JSON.stringify(data.body).length : 0,
    });
  }

  /**
   * Log API response
   */
  apiResponse(data: {
    method: string;
    path: string;
    status: number;
    duration: number;
    userId?: string;
  }) {
    const level =
      data.status >= 500
        ? LogLevel.ERROR
        : data.status >= 400
        ? LogLevel.WARN
        : LogLevel.INFO;

    this.log(
      level,
      `API ${data.method} ${data.path} - ${data.status}`,
      {
        userId: data.userId,
        method: data.method,
        path: data.path,
        status: data.status,
      },
      undefined,
      { duration: data.duration }
    );
  }

  /**
   * Log authentication event
   */
  auth(data: {
    event: "signin" | "signout" | "signup" | "error";
    userId?: string;
    provider?: string;
    error?: Error | any;
  }) {
    if (data.event === "error") {
      this.error("Authentication error", data.error, {
        provider: data.provider,
        userId: data.userId,
      });
    } else {
      this.info(`Authentication: ${data.event}`, {
        userId: data.userId,
        provider: data.provider,
      });
    }
  }

  /**
   * Log subscription event
   */
  subscription(data: {
    event:
      | "created"
      | "updated"
      | "canceled"
      | "payment_succeeded"
      | "payment_failed";
    userId: string;
    plan?: string;
    error?: Error | any;
  }) {
    if (data.event === "payment_failed") {
      this.warn("Subscription payment failed", {
        userId: data.userId,
        plan: data.plan,
      });
    } else {
      this.info(`Subscription: ${data.event}`, {
        userId: data.userId,
        plan: data.plan,
      });
    }
  }

  /**
   * Log database operation
   */
  database(data: {
    operation: "create" | "read" | "update" | "delete";
    model: string;
    duration?: number;
    error?: Error | any;
  }) {
    if (data.error) {
      this.error(
        `Database ${data.operation} failed: ${data.model}`,
        data.error
      );
    } else {
      this.debug(`Database ${data.operation}: ${data.model}`, {
        model: data.model,
        operation: data.operation,
        duration: data.duration,
      });
    }
  }

  /**
   * Log performance metric
   */
  performance(data: {
    operation: string;
    duration: number;
    metadata?: Record<string, any>;
  }) {
    this.info(`Performance: ${data.operation}`, {
      operation: data.operation,
      ...data.metadata,
      performance: {
        duration: data.duration,
      },
    });
  }

  /**
   * Log rate limit event
   */
  rateLimit(data: { userId: string; endpoint: string; limit: number }) {
    this.warn("Rate limit exceeded", {
      userId: data.userId,
      endpoint: data.endpoint,
      limit: data.limit,
    });
  }

  /**
   * Log quota event
   */
  quota(data: { userId: string; current: number; limit: number }) {
    this.warn("Quota exceeded", {
      userId: data.userId,
      currentUsage: data.current,
      limit: data.limit,
    });
  }
}

/**
 * Export singleton logger instance
 */
export const logger = new Logger();

/**
 * Helper function to measure execution time
 */
export async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.performance({ operation, duration, metadata });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      `${operation} failed after ${duration}ms`,
      error as Error,
      metadata
    );
    throw error;
  }
}

/**
 * Helper to create a request-scoped logger
 */
export function createRequestLogger(context: LogContext) {
  return {
    debug: (message: string) => logger.debug(message, context),
    info: (message: string) => logger.info(message, context),
    warn: (message: string) => logger.warn(message, context),
    error: (message: string, error?: Error) =>
      logger.error(message, error, context),
  };
}
