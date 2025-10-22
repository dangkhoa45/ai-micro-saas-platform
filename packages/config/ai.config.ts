/**
 * AI Configuration
 * Model registry and provider selection logic
 */

import type { AIProvider, AIUseCase, AIModelConfig, ModelRegistryEntry } from "@/lib/types/ai.types";

/**
 * Main AI Configuration
 */
export const AIConfig = {
  // Default model to use when no specific use case is provided
  defaultModel: "mistralai/mixtral-8x7b-instruct",
  
  // Model selection based on use case
  models: {
    text: "mistralai/mixtral-8x7b-instruct",
    chat: "openai/gpt-4o-mini",
    data: "anthropic/claude-3-5-sonnet",
    code: "openai/gpt-4o",
    image: "openai/dall-e-3",
    general: "mistralai/mixtral-8x7b-instruct",
  } as Record<AIUseCase, string>,
  
  // Fallback models when primary fails
  fallbackModels: {
    text: "gpt-4o-mini",
    chat: "gpt-4o-mini",
    data: "gpt-4o",
    code: "gpt-4o",
    general: "gpt-4o-mini",
  } as Record<Exclude<AIUseCase, "image">, string>,
  
  // Provider priority (will try in this order)
  providerPriority: ["OpenRouter", "OpenAI"] as AIProvider[],
  
  // Default generation parameters
  defaults: {
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 60000,
    maxRetries: 3,
  },
};

/**
 * Model Registry
 * Comprehensive list of available models with their capabilities and pricing
 */
export const ModelRegistry: Record<string, ModelRegistryEntry> = {
  // OpenRouter Models
  "mistralai/mixtral-8x7b-instruct": {
    id: "mistralai/mixtral-8x7b-instruct",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "general"],
    costPer1kTokens: { input: 0.0006, output: 0.0006 },
    maxTokens: 32768,
    description: "High-performance open-source model, great for general tasks",
  },
  "anthropic/claude-3-5-sonnet": {
    id: "anthropic/claude-3-5-sonnet",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "data", "code"],
    costPer1kTokens: { input: 0.003, output: 0.015 },
    maxTokens: 200000,
    description: "Claude's most intelligent model, excellent for analysis",
  },
  "google/gemini-pro-1.5": {
    id: "google/gemini-pro-1.5",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "data"],
    costPer1kTokens: { input: 0.00125, output: 0.005 },
    maxTokens: 2097152,
    description: "Google's advanced model with massive context window",
  },
  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "code", "data"],
    costPer1kTokens: { input: 0.005, output: 0.015 },
    maxTokens: 128000,
    description: "OpenAI's most capable multimodal model",
  },
  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "general"],
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
    maxTokens: 128000,
    description: "Cost-effective model for everyday tasks",
  },
  "meta-llama/llama-3.1-70b-instruct": {
    id: "meta-llama/llama-3.1-70b-instruct",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "code"],
    costPer1kTokens: { input: 0.0009, output: 0.0009 },
    maxTokens: 131072,
    description: "Meta's powerful open-source model",
  },
  
  // OpenAI Direct Models (Fallback)
  "gpt-4o": {
    id: "gpt-4o",
    provider: "OpenAI",
    capabilities: ["text", "chat", "code", "data"],
    costPer1kTokens: { input: 0.005, output: 0.015 },
    maxTokens: 128000,
    description: "OpenAI's flagship model",
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    provider: "OpenAI",
    capabilities: ["text", "chat", "general"],
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
    maxTokens: 128000,
    description: "Fast and affordable OpenAI model",
  },
  "gpt-4-turbo-preview": {
    id: "gpt-4-turbo-preview",
    provider: "OpenAI",
    capabilities: ["text", "chat", "code", "data"],
    costPer1kTokens: { input: 0.01, output: 0.03 },
    maxTokens: 128000,
    description: "Previous generation GPT-4 Turbo",
  },
  "gpt-3.5-turbo": {
    id: "gpt-3.5-turbo",
    provider: "OpenAI",
    capabilities: ["text", "chat", "general"],
    costPer1kTokens: { input: 0.0005, output: 0.0015 },
    maxTokens: 16385,
    description: "Legacy fast and efficient model",
  },
  "dall-e-3": {
    id: "dall-e-3",
    provider: "OpenAI",
    capabilities: ["image"],
    costPer1kTokens: { input: 0, output: 0 }, // Image pricing is different
    maxTokens: 0,
    description: "Advanced image generation",
  },
};

/**
 * Get model configuration by model ID
 */
export function getModelConfig(modelId: string): AIModelConfig {
  const model = ModelRegistry[modelId];
  
  if (!model) {
    throw new Error(`Model ${modelId} not found in registry`);
  }

  const provider = model.provider;
  
  // Determine API key and base URL based on provider
  let apiKey: string;
  let baseURL: string;
  let headers: Record<string, string> = {};

  if (provider === "OpenRouter") {
    apiKey = process.env.OPENROUTER_API_KEY || "";
    baseURL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
    headers = {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "AI Micro-SaaS Platform",
    };
  } else if (provider === "OpenAI") {
    apiKey = process.env.OPENAI_API_KEY || "";
    baseURL = "https://api.openai.com/v1";
  } else {
    throw new Error(`Provider ${provider} not yet implemented`);
  }

  if (!apiKey) {
    throw new Error(`API key not configured for provider ${provider}`);
  }

  return {
    provider,
    modelId,
    baseURL,
    apiKey,
    headers,
  };
}

/**
 * Get model ID by use case
 */
export function getModelByUseCase(useCase: AIUseCase): string {
  return AIConfig.models[useCase] || AIConfig.defaultModel;
}

/**
 * Get fallback model for a use case
 */
export function getFallbackModel(useCase: AIUseCase): string | null {
  if (useCase === "image") {
    return null; // No fallback for image generation
  }
  return AIConfig.fallbackModels[useCase] || "gpt-4o-mini";
}

/**
 * Calculate cost based on token usage and model
 */
export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const model = ModelRegistry[modelId];
  
  if (!model) {
    console.warn(`Model ${modelId} not found in registry, cannot calculate cost`);
    return 0;
  }

  const promptCost = (promptTokens / 1000) * model.costPer1kTokens.input;
  const completionCost = (completionTokens / 1000) * model.costPer1kTokens.output;

  return promptCost + completionCost;
}

/**
 * Get list of models by capability
 */
export function getModelsByCapability(capability: AIUseCase): ModelRegistryEntry[] {
  return Object.values(ModelRegistry).filter((model) =>
    model.capabilities.includes(capability)
  );
}

/**
 * Validate environment variables
 */
export function validateAIConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
    errors.push("At least one of OPENROUTER_API_KEY or OPENAI_API_KEY must be set");
  }

  if (process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_BASE_URL) {
    errors.push("OPENROUTER_BASE_URL is required when using OpenRouter");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
