/**
 * AI Model Integration
 * Unified AI client with OpenRouter + Multi-Provider support
 */

import OpenAI from "openai";
import type {
  AIProvider,
  AIGenerateOptions,
  AIGenerateResponse,
  AIModelConfig,
  AIUseCase,
} from "@/lib/types/ai.types";
import {
  AIError,
  AIRateLimitError,
  AIQuotaError,
  AIAuthError,
} from "@/lib/types/ai.types";
import {
  AIConfig,
  getModelConfig,
  getModelByUseCase,
  getFallbackModel,
  calculateCost as calculateModelCost,
  ModelRegistry,
} from "@/config/ai.config";
import {
  buildChatMessages,
  parseAIError,
  retryWithBackoff,
} from "@/lib/utils/ai-utils";

/**
 * Legacy exports for backward compatibility
 */
export const AI_MODELS = {
  GPT4O: "gpt-4o",
  GPT4_TURBO: "gpt-4-turbo-preview",
  GPT35_TURBO: "gpt-3.5-turbo",
} as const;

/**
 * AI Client Class
 * Handles model selection, request creation, and provider fallback
 */
export class AIClient {
  public readonly client: OpenAI;
  private config: AIModelConfig;
  private modelId: string;

  constructor(modelId?: string, useCase?: AIUseCase) {
    // Determine model ID
    if (modelId) {
      this.modelId = modelId;
    } else if (useCase) {
      this.modelId = getModelByUseCase(useCase);
    } else {
      this.modelId = AIConfig.defaultModel;
    }

    // Get model configuration
    this.config = getModelConfig(this.modelId);

    // Initialize OpenAI client with the appropriate configuration
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      defaultHeaders: this.config.headers,
      maxRetries: AIConfig.defaults.maxRetries,
      timeout: AIConfig.defaults.timeout,
    });
  }

  /**
   * Generate text completion
   */
  async generate(
    prompt: string,
    options: Omit<AIGenerateOptions, "stream"> = {}
  ): Promise<AIGenerateResponse> {
    const {
      temperature = AIConfig.defaults.temperature,
      maxTokens = AIConfig.defaults.maxTokens,
      systemPrompt,
    } = options;

    // Build messages
    const messages = buildChatMessages({
      systemPrompt,
      userMessage: prompt,
    });

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelId,
        messages: messages as any,
        temperature,
        max_tokens: maxTokens,
      });

      const text = response.choices[0]?.message?.content || "";
      const usage = response.usage;

      return {
        text,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
        model: response.model,
        provider: this.config.provider,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate streaming completion
   */
  async *generateStream(
    prompt: string,
    options: Omit<AIGenerateOptions, "stream"> = {}
  ): AsyncGenerator<string, void, unknown> {
    const {
      temperature = AIConfig.defaults.temperature,
      maxTokens = AIConfig.defaults.maxTokens,
      systemPrompt,
    } = options;

    const messages = buildChatMessages({
      systemPrompt,
      userMessage: prompt,
    });

    try {
      const stream = await this.client.chat.completions.create({
        model: this.modelId,
        messages: messages as any,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle and classify errors
   */
  private handleError(error: any): AIError {
    const parsedError = parseAIError(error);

    if (parsedError.isRateLimit) {
      return new AIRateLimitError(this.config.provider);
    }

    if (parsedError.isQuotaError) {
      return new AIQuotaError(this.config.provider);
    }

    if (parsedError.isAuthError) {
      return new AIAuthError(this.config.provider);
    }

    return new AIError(
      parsedError.message,
      this.config.provider,
      parsedError.statusCode,
      error
    );
  }
}

/**
 * Generate text with automatic fallback
 */
export async function generateText(
  prompt: string,
  options?: AIGenerateOptions
): Promise<AIGenerateResponse> {
  const {
    model,
    useCase = "general",
    temperature = 0.7,
    maxTokens = 2000,
    systemPrompt,
  } = options || {};

  // Mock mode for development
  if (process.env.AI_MOCK === "1") {
    const mockContent = `"${prompt}"\n\nHere is a concise, friendly piece generated in mock mode for development/testing.\n- Tone: ${
      systemPrompt?.match(/tone\./i) ? "configured" : "default"
    }\n- Length hint: ${maxTokens}\n\nKey points:\n1) This content is produced locally without calling AI APIs.\n2) Use it to validate UI flows and costs display.\n3) Disable by removing AI_MOCK=1 from .env.`;

    const tokens = Math.min(
      Math.ceil(mockContent.split(/\s+/).length * 1.3),
      maxTokens
    );
    
    return {
      text: mockContent,
      usage: {
        promptTokens: Math.ceil(prompt.split(/\s+/).length * 1.3),
        completionTokens: tokens,
        totalTokens: tokens + Math.ceil(prompt.split(/\s+/).length * 1.3),
      },
      model: "mock",
      provider: "OpenAI",
    };
  }

  const primaryModelId = model || getModelByUseCase(useCase);
  
  try {
    // Try primary model (OpenRouter)
    const client = new AIClient(primaryModelId);
    return await retryWithBackoff(() =>
      client.generate(prompt, { temperature, maxTokens, systemPrompt })
    );
  } catch (primaryError: any) {
    console.warn(
      `[AI] Primary model failed (${primaryModelId}):`,
      primaryError.message
    );

    // Try fallback model (OpenAI direct)
    const fallbackModelId = getFallbackModel(useCase);
    
    if (!fallbackModelId) {
      throw primaryError;
    }

    try {
      console.log(`[AI] Attempting fallback to ${fallbackModelId}`);
      const fallbackClient = new AIClient(fallbackModelId);
      return await fallbackClient.generate(prompt, {
        temperature,
        maxTokens,
        systemPrompt,
      });
    } catch (fallbackError: any) {
      console.error(
        `[AI] Fallback model also failed (${fallbackModelId}):`,
        fallbackError.message
      );
      // Throw the original error
      throw primaryError;
    }
  }
}

/**
 * Generate chat completion
 */
export async function generateChat(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  options?: AIGenerateOptions
): Promise<AIGenerateResponse> {
  const userMessage = messages[messages.length - 1]?.content || "";
  const systemPrompt = messages.find((m) => m.role === "system")?.content;
  const conversationHistory = messages
    .filter((m) => m.role !== "system")
    .slice(0, -1) as Array<{ role: "user" | "assistant"; content: string }>;

  const {
    model,
    useCase = "chat",
    temperature = 0.7,
    maxTokens = 2000,
  } = options || {};

  const primaryModelId = model || getModelByUseCase(useCase);

  try {
    const client = new AIClient(primaryModelId);
    const fullMessages = buildChatMessages({
      systemPrompt,
      userMessage,
      conversationHistory,
    });

    const response = await retryWithBackoff(() =>
      client.client.chat.completions.create({
        model: primaryModelId,
        messages: fullMessages as any,
        temperature,
        max_tokens: maxTokens,
      })
    );

    const text = response.choices[0]?.message?.content || "";
    const usage = response.usage;

    return {
      text,
      usage: {
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      },
      model: response.model,
      provider: ModelRegistry[primaryModelId]?.provider || "OpenAI",
    };
  } catch (error: any) {
    // Fallback logic
    const fallbackModelId = getFallbackModel(useCase);
    if (fallbackModelId) {
      const fallbackClient = new AIClient(fallbackModelId);
      const fullMessages = buildChatMessages({
        systemPrompt,
        userMessage,
        conversationHistory,
      });

      const response = await fallbackClient.client.chat.completions.create({
        model: fallbackModelId,
        messages: fullMessages as any,
        temperature,
        max_tokens: maxTokens,
      });

      const text = response.choices[0]?.message?.content || "";
      const usage = response.usage;

      return {
        text,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
        model: response.model,
        provider: "OpenAI",
      };
    }

    throw error;
  }
}

/**
 * Stream text generation with fallback
 */
export async function* streamText(
  prompt: string,
  options?: AIGenerateOptions
): AsyncGenerator<string, void, unknown> {
  const {
    model,
    useCase = "general",
    temperature = 0.7,
    maxTokens = 2000,
    systemPrompt,
  } = options || {};

  // Mock mode
  if (process.env.AI_MOCK === "1") {
    const chunks = [
      "This is a ",
      "streamed response ",
      "from mock mode. ",
      "Use it to verify UI behavior.",
    ];
    for (const c of chunks) {
      yield c;
      await new Promise((r) => setTimeout(r, 50));
    }
    return;
  }

  const primaryModelId = model || getModelByUseCase(useCase);

  try {
    const client = new AIClient(primaryModelId);
    yield* client.generateStream(prompt, {
      temperature,
      maxTokens,
      systemPrompt,
    });
  } catch (error: any) {
    console.warn(`[AI] Stream failed for ${primaryModelId}, trying fallback`);
    
    const fallbackModelId = getFallbackModel(useCase);
    if (fallbackModelId) {
      const fallbackClient = new AIClient(fallbackModelId);
      yield* fallbackClient.generateStream(prompt, {
        temperature,
        maxTokens,
        systemPrompt,
      });
    } else {
      throw error;
    }
  }
}

/**
 * Calculate cost based on token usage
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  return calculateModelCost(model, promptTokens, completionTokens);
}

/**
 * Generate image using DALL-E
 */
export async function generateImage(
  prompt: string,
  options?: {
    model?: "dall-e-2" | "dall-e-3";
    size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
    quality?: "standard" | "hd";
    n?: number;
  }
) {
  const {
    model = "dall-e-3",
    size = "1024x1024",
    quality = "standard",
    n = 1,
  } = options || {};

  // Always use OpenAI for image generation
  const client = new AIClient("dall-e-3");

  const response = await client.client.images.generate({
    model,
    prompt,
    size,
    quality,
    n,
  });

  return response.data;
}

/**
 * Create embeddings for text
 */
export async function createEmbedding(text: string) {
  const client = new AIClient("gpt-4o"); // Use any OpenAI model config
  
  const response = await client.client.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  return {
    embedding: response.data[0].embedding,
    usage: response.usage,
  };
}

/**
 * Analyze data with AI
 */
export async function analyzeData(
  data: string,
  question: string,
  options?: AIGenerateOptions
): Promise<AIGenerateResponse> {
  const systemPrompt =
    "You are a data analyst. Analyze the provided data and answer questions with clear, accurate insights.";
  
  const prompt = `Data:\n${data}\n\nQuestion: ${question}`;

  return generateText(prompt, {
    ...options,
    useCase: "data",
    systemPrompt,
  });
}

/**
 * Summarize text
 */
export async function summarize(
  text: string,
  options?: { length?: "short" | "medium" | "long" } & AIGenerateOptions
): Promise<AIGenerateResponse> {
  const { length = "medium", ...restOptions } = options || {};
  
  const lengthInstructions = {
    short: "in 2-3 sentences",
    medium: "in 1-2 paragraphs",
    long: "in detail with key points",
  };

  const systemPrompt = `You are a summarization expert. Summarize the following text ${lengthInstructions[length]}.`;

  return generateText(text, {
    ...restOptions,
    useCase: "text",
    systemPrompt,
    maxTokens: length === "short" ? 200 : length === "medium" ? 500 : 1000,
  });
}

/**
 * Create default AI client instance
 * Lazily initialized to avoid errors at module load time
 */
let _defaultClient: AIClient | null = null;

export function getDefaultAIClient(): AIClient {
  if (!_defaultClient) {
    _defaultClient = new AIClient();
  }
  return _defaultClient;
}

/**
 * Export default AI client instance (lazy)
 */
export const ai = {
  get client() {
    return getDefaultAIClient();
  },
  generate: (prompt: string, options?: Omit<AIGenerateOptions, "stream">) => {
    return getDefaultAIClient().generate(prompt, options);
  },
  generateStream: (prompt: string, options?: Omit<AIGenerateOptions, "stream">) => {
    return getDefaultAIClient().generateStream(prompt, options);
  },
};
