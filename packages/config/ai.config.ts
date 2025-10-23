/**
 * AI Configuration
 * Model registry and provider selection logic
 */

import type {
  AIProvider,
  AIUseCase,
  AIModelConfig,
  ModelRegistryEntry,
} from "@/lib/types/ai.types";

/**
 * Main AI Configuration
 */
export const AIConfig = {
  // Default model to use when no specific use case is provided
  defaultModel: "mistralai/mistral-7b-instruct",

  // Model selection based on use case (using diverse OpenRouter models)
  models: {
    text: "mistralai/mistral-7b-instruct", // Fast, cheap, good quality
    chat: "meta-llama/llama-3.1-8b-instruct", // Great for conversations
    data: "anthropic/claude-3.5-sonnet", // Best for analysis
    code: "deepseek/deepseek-coder", // Specialized for code
    image: "openai/dall-e-3", // Image generation (OpenAI only)
    general: "google/gemini-flash-1.5", // Fast, free tier available
  } as Record<AIUseCase, string>,

  // Fallback chain: Try multiple models in order
  fallbackModels: {
    text: [
      "google/gemini-flash-1.5",
      "meta-llama/llama-3.1-8b-instruct",
      "gpt-4o-mini",
    ],
    chat: [
      "mistralai/mistral-7b-instruct",
      "google/gemini-flash-1.5",
      "gpt-4o-mini",
    ],
    data: [
      "google/gemini-pro-1.5",
      "meta-llama/llama-3.1-70b-instruct",
      "gpt-4o",
    ],
    code: [
      "qwen/qwen-2.5-coder-32b-instruct",
      "meta-llama/llama-3.1-70b-instruct",
      "gpt-4o",
    ],
    general: [
      "mistralai/mistral-7b-instruct",
      "meta-llama/llama-3.1-8b-instruct",
      "gpt-4o-mini",
    ],
  } as Record<Exclude<AIUseCase, "image">, string[]>,

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
 * Updated with diverse OpenRouter models for cost-effectiveness and variety
 */
export const ModelRegistry: Record<string, ModelRegistryEntry> = {
  // ========== BUDGET-FRIENDLY MODELS (OpenRouter) ==========

  "mistralai/mistral-7b-instruct": {
    id: "mistralai/mistral-7b-instruct",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "general"],
    costPer1kTokens: { input: 0.00006, output: 0.00006 },
    maxTokens: 32768,
    description:
      "⚡ Ultra-fast and cheap - Excellent for general tasks, 10x cheaper than GPT-4",
  },

  "google/gemini-flash-1.5": {
    id: "google/gemini-flash-1.5",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "general", "data"],
    costPer1kTokens: { input: 0.000025, output: 0.0001 },
    maxTokens: 1048576,
    description: "🚀 FREE tier available - Ultra-fast with 1M context window",
  },

  "meta-llama/llama-3.1-8b-instruct": {
    id: "meta-llama/llama-3.1-8b-instruct",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "general"],
    costPer1kTokens: { input: 0.00005, output: 0.00015 },
    maxTokens: 131072,
    description:
      "💬 Best for chat - Meta's efficient model, great quality/price ratio",
  },

  // ========== SPECIALIZED MODELS (OpenRouter) ==========

  "deepseek/deepseek-coder": {
    id: "deepseek/deepseek-coder",
    provider: "OpenRouter",
    capabilities: ["code", "text"],
    costPer1kTokens: { input: 0.00014, output: 0.00028 },
    maxTokens: 64000,
    description:
      "👨‍💻 Code specialist - Trained specifically for programming tasks",
  },

  "qwen/qwen-2.5-coder-32b-instruct": {
    id: "qwen/qwen-2.5-coder-32b-instruct",
    provider: "OpenRouter",
    capabilities: ["code", "text", "chat"],
    costPer1kTokens: { input: 0.0003, output: 0.0006 },
    maxTokens: 32768,
    description: "🔧 Advanced coder - Strong reasoning and code generation",
  },

  // ========== PREMIUM MODELS (OpenRouter) ==========

  "anthropic/claude-3.5-sonnet": {
    id: "anthropic/claude-3.5-sonnet",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "data", "code"],
    costPer1kTokens: { input: 0.003, output: 0.015 },
    maxTokens: 200000,
    description: "🧠 Best for analysis - Claude's most intelligent model",
  },

  "google/gemini-pro-1.5": {
    id: "google/gemini-pro-1.5",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "data"],
    costPer1kTokens: { input: 0.00125, output: 0.005 },
    maxTokens: 2097152,
    description: "📊 Massive context - 2M tokens, perfect for large documents",
  },

  "meta-llama/llama-3.1-70b-instruct": {
    id: "meta-llama/llama-3.1-70b-instruct",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "code", "data"],
    costPer1kTokens: { input: 0.0009, output: 0.0009 },
    maxTokens: 131072,
    description: "🦙 Powerful & balanced - Meta's flagship open model",
  },

  "mistralai/mixtral-8x7b-instruct": {
    id: "mistralai/mixtral-8x7b-instruct",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "general", "code"],
    costPer1kTokens: { input: 0.00024, output: 0.00024 },
    maxTokens: 32768,
    description:
      "⚡ Fast MoE - Mixture of Experts architecture, very efficient",
  },

  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "code", "data"],
    costPer1kTokens: { input: 0.005, output: 0.015 },
    maxTokens: 128000,
    description: "🔥 Top tier - OpenAI's most capable model via OpenRouter",
  },

  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    provider: "OpenRouter",
    capabilities: ["text", "chat", "general"],
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
    maxTokens: 128000,
    description: "💰 Cost-effective - Good balance of quality and price",
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
 * Now with graceful handling when API keys are missing
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
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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
 * Check if a provider has API key configured
 */
export function isProviderConfigured(provider: AIProvider): boolean {
  if (provider === "OpenRouter") {
    return !!process.env.OPENROUTER_API_KEY;
  } else if (provider === "OpenAI") {
    return !!process.env.OPENAI_API_KEY;
  }
  return false;
}

/**
 * Get best available model for use case based on configured providers
 */
export function getBestAvailableModel(useCase: AIUseCase): string {
  const primaryModel = AIConfig.models[useCase];
  const primaryModelConfig = ModelRegistry[primaryModel];

  // Check if primary model's provider is configured
  if (primaryModelConfig && isProviderConfigured(primaryModelConfig.provider)) {
    return primaryModel;
  }

  // Try fallback models
  const fallbacks = getAllFallbackModels(useCase);
  for (const fallback of fallbacks) {
    const fallbackConfig = ModelRegistry[fallback];
    if (fallbackConfig && isProviderConfigured(fallbackConfig.provider)) {
      return fallback;
    }
  }

  // If nothing available, return primary anyway (will fail with clear error)
  return primaryModel;
}

/**
 * Get model ID by use case
 */
export function getModelByUseCase(useCase: AIUseCase): string {
  return AIConfig.models[useCase] || AIConfig.defaultModel;
}

/**
 * Get fallback model for a use case
 * Returns array of fallback models to try in order
 */
export function getFallbackModel(useCase: AIUseCase): string | null {
  if (useCase === "image") {
    return null; // No fallback for image generation
  }
  const fallbacks = AIConfig.fallbackModels[useCase];
  return Array.isArray(fallbacks) ? fallbacks[0] : fallbacks || "gpt-4o-mini";
}

/**
 * Get all fallback models for a use case
 * Returns array of all available fallback models
 */
export function getAllFallbackModels(useCase: AIUseCase): string[] {
  if (useCase === "image") {
    return [];
  }
  const fallbacks = AIConfig.fallbackModels[useCase];
  return Array.isArray(fallbacks) ? fallbacks : [fallbacks || "gpt-4o-mini"];
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
    console.warn(
      `Model ${modelId} not found in registry, cannot calculate cost`
    );
    return 0;
  }

  const promptCost = (promptTokens / 1000) * model.costPer1kTokens.input;
  const completionCost =
    (completionTokens / 1000) * model.costPer1kTokens.output;

  return promptCost + completionCost;
}

/**
 * Get list of models by capability
 */
export function getModelsByCapability(
  capability: AIUseCase
): ModelRegistryEntry[] {
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
    errors.push(
      "At least one of OPENROUTER_API_KEY or OPENAI_API_KEY must be set"
    );
  }

  if (process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_BASE_URL) {
    errors.push("OPENROUTER_BASE_URL is required when using OpenRouter");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
