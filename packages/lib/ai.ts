import OpenAI from "openai";

/**
 * OpenAI client configuration
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  // Add a small amount of built-in resiliency to transient 429s/timeouts
  maxRetries: 3,
  timeout: 60_000,
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
    model = (process.env.AI_DEFAULT_MODEL as string) || AI_MODELS.GPT4O,
    temperature = 0.7,
    maxTokens = Number(process.env.AI_MAX_TOKENS || 2000),
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

  // Dev-friendly mock mode to allow UI testing without OpenAI quota
  if (process.env.AI_MOCK === "1") {
    const mockContent = `"${prompt}"\n\nHere is a concise, friendly piece generated in mock mode for development/testing.\n- Tone: ${
      options?.systemPrompt?.match(/tone\./i) ? "configured" : "default"
    }\n- Length hint: ${
      options?.maxTokens
    }\n\nKey points:\n1) This content is produced locally without calling OpenAI.\n2) Use it to validate UI flows and costs display.\n3) Disable by removing AI_MOCK=1 from .env.`;

    const tokens = Math.min(
      Math.ceil(mockContent.split(/\s+/).length * 1.3),
      maxTokens
    );
    return {
      text: mockContent,
      usage: {
        promptTokens: Math.ceil(prompt.split(/\s+/).length * 1.3),
        completionTokens: tokens,
        totalTokens: tokens,
      },
      model: "mock",
    };
  }

  // Basic exponential backoff for transient rate limits beyond SDK retries
  const attemptRequest = async (
    attempt = 0
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> => {
    try {
      return await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });
    } catch (err: any) {
      // Only retry on 429 rate limits
      if (err?.status === 429 && attempt < 2) {
        const delay = 500 * Math.pow(2, attempt); // 500ms, 1s
        await new Promise((r) => setTimeout(r, delay));
        return attemptRequest(attempt + 1);
      }
      throw err;
    }
  };

  const response = await attemptRequest();

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
    model = (process.env.AI_DEFAULT_MODEL as string) || AI_MODELS.GPT4O,
    temperature = 0.7,
    maxTokens = Number(process.env.AI_MAX_TOKENS || 2000),
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
