import OpenAI from "openai";

/**
 * OpenAI client configuration
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * Available AI models
 */
export const AI_MODELS = {
  GPT4O: "gpt-4o",
  GPT4_TURBO: "gpt-4-turbo-preview",
  GPT35_TURBO: "gpt-3.5-turbo",
} as const;

/**
 * Token pricing (per 1K tokens)
 */
export const TOKEN_PRICING = {
  [AI_MODELS.GPT4O]: {
    input: 0.005,
    output: 0.015,
  },
  [AI_MODELS.GPT4_TURBO]: {
    input: 0.01,
    output: 0.03,
  },
  [AI_MODELS.GPT35_TURBO]: {
    input: 0.0005,
    output: 0.0015,
  },
} as const;

/**
 * Generate text using OpenAI
 */
export async function generateText(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
) {
  const {
    model = AI_MODELS.GPT4O,
    temperature = 0.7,
    maxTokens = 2000,
    systemPrompt,
  } = options || {};

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const response = await openai.chat.completions.create({
    model,
    messages,
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
  };
}

/**
 * Calculate cost based on token usage
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = TOKEN_PRICING[model as keyof typeof TOKEN_PRICING];

  if (!pricing) {
    return 0;
  }

  const promptCost = (promptTokens / 1000) * pricing.input;
  const completionCost = (completionTokens / 1000) * pricing.output;

  return promptCost + completionCost;
}

/**
 * Stream text generation
 */
export async function* streamText(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
) {
  const {
    model = AI_MODELS.GPT4O,
    temperature = 0.7,
    maxTokens = 2000,
    systemPrompt,
  } = options || {};

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const stream = await openai.chat.completions.create({
    model,
    messages,
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

  const response = await openai.images.generate({
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
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  return {
    embedding: response.data[0].embedding,
    usage: response.usage,
  };
}
