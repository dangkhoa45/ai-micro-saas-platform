/**
 * AI Types and Interfaces
 * Shared type definitions for the AI model architecture
 */

/**
 * Supported AI providers
 */
export type AIProvider =
  | "OpenAI"
  | "OpenRouter"
  | "Anthropic"
  | "Gemini"
  | "Mistral";

/**
 * Use case categories for model selection
 */
export type AIUseCase = "text" | "chat" | "code" | "data" | "image" | "general";

/**
 * AI model configuration
 */
export interface AIModelConfig {
  provider: AIProvider;
  modelId: string;
  baseURL: string;
  apiKey: string;
  headers?: Record<string, string>;
}

/**
 * AI generation options
 */
export interface AIGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
  useCase?: AIUseCase;
}

/**
 * AI generation response
 */
export interface AIGenerateResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: AIProvider;
}

/**
 * AI streaming chunk
 */
export interface AIStreamChunk {
  content: string;
  done: boolean;
}

/**
 * Model registry entry
 */
export interface ModelRegistryEntry {
  id: string;
  provider: AIProvider;
  capabilities: AIUseCase[];
  costPer1kTokens: {
    input: number;
    output: number;
  };
  maxTokens: number;
  description?: string;
}

/**
 * AI error types
 */
export class AIError extends Error {
  constructor(
    message: string,
    public provider: AIProvider,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = "AIError";
  }
}

/**
 * Rate limit error
 */
export class AIRateLimitError extends AIError {
  constructor(provider: AIProvider, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, provider, 429);
    this.name = "AIRateLimitError";
    this.retryAfter = retryAfter;
  }
  retryAfter?: number;
}

/**
 * Quota exceeded error
 */
export class AIQuotaError extends AIError {
  constructor(provider: AIProvider) {
    super(`Quota exceeded for ${provider}`, provider, 402);
    this.name = "AIQuotaError";
  }
}

/**
 * Authentication error
 */
export class AIAuthError extends AIError {
  constructor(provider: AIProvider) {
    super(`Authentication failed for ${provider}`, provider, 401);
    this.name = "AIAuthError";
  }
}
