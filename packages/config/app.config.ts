import { env, isDevelopment, isProduction } from "../lib/env";

/**
 * Application configuration
 * Centralizes all app-level configuration with environment-specific overrides
 */
export const appConfig = {
  /**
   * App metadata
   */
  name: "AI Micro-SaaS Platform",
  description: "Build and monetize AI-powered micro-SaaS tools",
  url: env.NEXT_PUBLIC_APP_URL,

  /**
   * Feature flags
   */
  features: {
    oauth: {
      google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      github: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
    },
    aiMock: env.AI_MOCK === "1",
    emailVerification: false, // TODO: Implement
    passwordReset: false, // TODO: Implement
  },

  /**
   * API configuration
   */
  api: {
    timeout: isDevelopment ? 30000 : 10000, // 30s dev, 10s prod
    rateLimit: {
      maxRequests: isDevelopment ? 1000 : 100,
      windowMs: 60 * 1000, // 1 minute
    },
  },

  /**
   * Database configuration
   */
  database: {
    connectionPooling: isProduction,
    logQueries: isDevelopment,
  },

  /**
   * Session configuration
   */
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  /**
   * Logging configuration
   */
  logging: {
    level: isDevelopment ? "debug" : "info",
    prettyPrint: isDevelopment,
  },

  /**
   * CORS configuration
   */
  cors: {
    allowedOrigins: isDevelopment
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : [env.NEXT_PUBLIC_APP_URL],
  },

  /**
   * Pagination defaults
   */
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  /**
   * File upload configuration
   */
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
} as const;

/**
 * Type-safe access to app configuration
 */
export type AppConfig = typeof appConfig;
