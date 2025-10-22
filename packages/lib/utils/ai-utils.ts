/**
 * AI Utilities
 * Helper functions for prompt handling and response processing
 */

import type { AIUseCase } from "@/lib/types/ai.types";

/**
 * Build system prompt based on use case and parameters
 */
export function buildSystemPrompt(params: {
  useCase: AIUseCase;
  tone?: "professional" | "casual" | "friendly" | "formal";
  length?: "short" | "medium" | "long";
  additionalContext?: string;
}): string {
  const { useCase, tone = "professional", length = "medium", additionalContext } = params;

  const basePlrompts: Record<AIUseCase, string> = {
    text: `You are a professional writer creating high-quality content in a ${tone} tone.`,
    chat: `You are a helpful AI assistant providing clear and accurate responses in a ${tone} tone.`,
    code: `You are an expert software engineer providing clean, efficient, and well-documented code.`,
    data: `You are a data analyst providing accurate insights and clear explanations.`,
    image: `You are an AI image generation assistant. Create detailed, specific image prompts.`,
    general: `You are a knowledgeable AI assistant providing helpful responses in a ${tone} tone.`,
  };

  const lengthInstructions: Record<string, string> = {
    short: "Keep responses concise and to the point (150-250 words).",
    medium: "Provide a well-balanced response with sufficient detail (400-600 words).",
    long: "Create comprehensive, in-depth content with thorough explanations (800-1200 words).",
  };

  let systemPrompt = basePlrompts[useCase];

  if (useCase !== "image" && useCase !== "code") {
    systemPrompt += ` ${lengthInstructions[length]}`;
  }

  if (additionalContext) {
    systemPrompt += ` ${additionalContext}`;
  }

  return systemPrompt;
}

/**
 * Build content-specific system prompts
 */
export function buildContentSystemPrompt(params: {
  type: "blog" | "article" | "email" | "social" | "general";
  tone?: "professional" | "casual" | "friendly" | "formal";
  length?: "short" | "medium" | "long";
}): string {
  const { type, tone = "professional", length = "medium" } = params;

  const typePrompts: Record<string, string> = {
    blog: `You are a professional blog writer. Write engaging, SEO-friendly blog content in a ${tone} tone.`,
    article: `You are a skilled article writer. Create informative, well-researched articles in a ${tone} tone.`,
    email: `You are an email copywriter. Write clear, effective emails in a ${tone} tone.`,
    social: `You are a social media content creator. Write engaging social media posts in a ${tone} tone.`,
    general: `You are a professional writer. Create high-quality content in a ${tone} tone.`,
  };

  const lengthInstructions: Record<string, string> = {
    short: "Keep the content concise, around 150-250 words.",
    medium: "Write a moderate length piece, around 400-600 words.",
    long: "Create comprehensive content, around 800-1200 words.",
  };

  return `${typePrompts[type]} ${lengthInstructions[length]}`;
}

/**
 * Estimate token count from text
 * Rough estimation: ~1.3 tokens per word for English text
 */
export function estimateTokens(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(words * 1.3);
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(text);
  
  if (estimatedTokens <= maxTokens) {
    return text;
  }

  const words = text.split(/\s+/);
  const maxWords = Math.floor(maxTokens / 1.3);
  
  return words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Format streaming response
 */
export function formatStreamChunk(content: string): string {
  return `data: ${JSON.stringify({ content })}\n\n`;
}

/**
 * Parse error message from AI provider
 */
export function parseAIError(error: any): {
  message: string;
  statusCode?: number;
  isRateLimit: boolean;
  isQuotaError: boolean;
  isAuthError: boolean;
} {
  const errorMessage = error?.message || "Unknown error";
  const statusCode = error?.status || error?.statusCode;

  return {
    message: errorMessage,
    statusCode,
    isRateLimit: statusCode === 429 || /rate.?limit/i.test(errorMessage),
    isQuotaError: statusCode === 402 || /quota|billing/i.test(errorMessage),
    isAuthError: statusCode === 401 || /unauthorized|invalid.*key/i.test(errorMessage),
  };
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 500,
    maxDelay = 10000,
    shouldRetry = (error: any) => error?.status === 429 || error?.status >= 500,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries - 1 || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Sanitize prompt to prevent injection attacks
 */
export function sanitizePrompt(prompt: string): string {
  // Remove potential injection patterns
  let sanitized = prompt
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/<script[\s\S]*?<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .trim();

  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  return sanitized;
}

/**
 * Build chat messages array
 */
export function buildChatMessages(params: {
  systemPrompt?: string;
  userMessage: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

  if (params.systemPrompt) {
    messages.push({
      role: "system",
      content: params.systemPrompt,
    });
  }

  if (params.conversationHistory) {
    messages.push(...params.conversationHistory);
  }

  messages.push({
    role: "user",
    content: params.userMessage,
  });

  return messages;
}

/**
 * Extract JSON from text response
 */
export function extractJSON<T = any>(text: string): T | null {
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch {
    // Try to find JSON in markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        return null;
      }
    }

    // Try to find JSON object in text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        return null;
      }
    }

    return null;
  }
}
