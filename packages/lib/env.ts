import { z } from "zod";

/**
 * Environment variable schema validation
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),

  // NextAuth
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters"),

  // OAuth Providers (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // OpenRouter (Primary AI Provider)
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),

  // OpenAI (Fallback AI Provider - Optional)
  OPENAI_API_KEY: z.string().optional(),

  // AI Configuration
  AI_MOCK: z.string().optional().default("0"),
  AI_DEFAULT_MODEL: z.string().optional(),
  AI_MAX_TOKENS: z.string().optional().default("2000"),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_"),
  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("pk_", "STRIPE_PUBLISHABLE_KEY must start with pk_"),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_"),

  // Stripe Price IDs
  STRIPE_PRICE_ID_STARTER: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),
  STRIPE_PRICE_ID_BUSINESS: z.string().optional(),

  // App Settings
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),
});

/**
 * Validated environment variables
 * Use this instead of process.env for type safety
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 */
function parseEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      throw new Error(
        "Invalid environment variables. Check console for details."
      );
    }
    throw error;
  }
}

/**
 * Validated and typed environment variables
 * Import this in your code instead of using process.env directly
 */
export const env = parseEnv();

/**
 * Check if we're in development mode
 */
export const isDevelopment = env.NODE_ENV === "development";

/**
 * Check if we're in production mode
 */
export const isProduction = env.NODE_ENV === "production";

/**
 * Check if we're in test mode
 */
export const isTest = env.NODE_ENV === "test";

/**
 * Get the base URL for the application
 */
export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Browser
    return window.location.origin;
  }
  // Server
  return env.NEXT_PUBLIC_APP_URL || env.NEXTAUTH_URL;
};
