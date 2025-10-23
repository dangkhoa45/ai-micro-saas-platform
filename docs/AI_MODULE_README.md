# AI Module Documentation

## Overview

The AI module provides a unified interface for interacting with multiple AI providers (OpenRouter, OpenAI) with automatic fallback, use-case based model selection, and comprehensive error handling.

## Quick Start

```typescript
import { generateText } from "@/lib/ai";

// Basic usage
const result = await generateText("Write a blog post about AI");

// With options
const result = await generateText("Write code documentation", {
  useCase: "code",
  temperature: 0.3,
  maxTokens: 1000,
  systemPrompt: "You are a technical writer",
});

console.log(result.text);
console.log(`Tokens used: ${result.usage.totalTokens}`);
console.log(`Provider: ${result.provider}`);
```

## Architecture

```
/lib
├── ai.ts                     # Main AI client & exports
├── types/
│   └── ai.types.ts          # TypeScript interfaces & types
└── utils/
    └── ai-utils.ts          # Helper functions

/config
└── ai.config.ts             # Model registry & configuration
```

## Core Components

### AIClient Class

The main class for AI interactions:

```typescript
import { AIClient } from "@/lib/ai";

// Create client with specific model
const client = new AIClient("anthropic/claude-3-5-sonnet");

// Or with use case
const client = new AIClient(undefined, "code");

// Generate
const result = await client.generate("Write a function");

// Stream
for await (const chunk of client.generateStream("Tell a story")) {
  process.stdout.write(chunk);
}
```

### Helper Functions

#### `generateText(prompt, options?)`

Generate text with automatic model selection and fallback.

```typescript
const result = await generateText("prompt", {
  useCase: "text" | "chat" | "code" | "data" | "general",
  model: "specific-model-id",
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: "Custom system prompt",
});
```

#### `generateChat(messages, options?)`

Multi-turn chat completions.

```typescript
const result = await generateChat([
  { role: "system", content: "You are helpful" },
  { role: "user", content: "Hello" },
  { role: "assistant", content: "Hi there!" },
  { role: "user", content: "How are you?" },
]);
```

#### `streamText(prompt, options?)`

Stream responses in real-time.

```typescript
for await (const chunk of streamText("prompt", { useCase: "chat" })) {
  console.log(chunk);
}
```

#### `analyzeData(data, question, options?)`

Analyze data with AI.

```typescript
const result = await analyzeData(
  "Sales data: Q1: $100K, Q2: $150K",
  "What's the trend?"
);
```

#### `summarize(text, options?)`

Summarize text.

```typescript
const result = await summarize(longText, {
  length: "short" | "medium" | "long",
});
```

## Configuration

### Environment Variables

```env
# Primary Provider (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Fallback Provider (OpenAI)
OPENAI_API_KEY=sk-proj-...

# Optional
AI_MOCK=0                    # Set to "1" for testing without API calls
AI_DEFAULT_MODEL=            # Override default model
AI_MAX_TOKENS=2000           # Default max tokens
```

### Model Registry

Models are configured in `packages/config/ai.config.ts`:

```typescript
export const AIConfig = {
  defaultModel: "mistralai/mixtral-8x7b-instruct",

  models: {
    text: "mistralai/mixtral-8x7b-instruct",
    chat: "openai/gpt-4o-mini",
    data: "anthropic/claude-3-5-sonnet",
    code: "openai/gpt-4o",
    general: "mistralai/mixtral-8x7b-instruct",
  },

  fallbackModels: {
    text: "gpt-4o-mini",
    chat: "gpt-4o-mini",
    data: "gpt-4o",
    code: "gpt-4o",
    general: "gpt-4o-mini",
  },
};
```

## Available Models

### OpenRouter Models

| Model ID                            | Description            | Best For                           |
| ----------------------------------- | ---------------------- | ---------------------------------- |
| `mistralai/mixtral-8x7b-instruct`   | Fast open-source model | General tasks, text generation     |
| `anthropic/claude-3-5-sonnet`       | Claude's best model    | Analysis, reasoning, complex tasks |
| `openai/gpt-4o`                     | GPT-4 Omni             | Code, multimodal, advanced tasks   |
| `openai/gpt-4o-mini`                | Cost-effective GPT-4   | Chat, everyday tasks               |
| `google/gemini-pro-1.5`             | Large context window   | Long documents, extensive context  |
| `meta-llama/llama-3.1-70b-instruct` | Open-source Llama      | Code, general tasks                |

### OpenAI Direct Models (Fallback)

| Model ID              | Description         |
| --------------------- | ------------------- |
| `gpt-4o`              | Latest GPT-4        |
| `gpt-4o-mini`         | Fast and affordable |
| `gpt-4-turbo-preview` | Previous generation |
| `gpt-3.5-turbo`       | Legacy model        |

## Use Cases

The system automatically selects the best model for each use case:

- **`text`**: Content generation, blog posts, articles
- **`chat`**: Conversational AI, customer support
- **`code`**: Code generation, documentation, debugging
- **`data`**: Data analysis, insights, reporting
- **`general`**: All-purpose tasks

## Error Handling

The module provides custom error classes:

```typescript
import {
  AIError,
  AIRateLimitError,
  AIQuotaError,
  AIAuthError,
} from "@/lib/types/ai.types";

try {
  const result = await generateText("prompt");
} catch (error) {
  if (error instanceof AIRateLimitError) {
    console.log("Rate limited, retry after:", error.retryAfter);
  } else if (error instanceof AIQuotaError) {
    console.log("Quota exceeded");
  } else if (error instanceof AIAuthError) {
    console.log("Authentication failed");
  } else if (error instanceof AIError) {
    console.log("AI Error:", error.message, error.provider);
  }
}
```

## Fallback Mechanism

The system automatically falls back from OpenRouter to OpenAI:

1. Try primary model (OpenRouter)
2. On failure, try fallback model (OpenAI)
3. Throw error if both fail

```typescript
// This will try OpenRouter first, then OpenAI if it fails
const result = await generateText("prompt", { useCase: "chat" });
```

## Cost Calculation

Calculate costs for any model:

```typescript
import { calculateCost } from "@/lib/ai";

const cost = calculateCost(
  "gpt-4o",
  promptTokens: 100,
  completionTokens: 200
);

console.log(`Cost: $${cost.toFixed(4)}`);
```

## Testing

### Run Test Suite

```bash
npx tsx scripts/test-ai.ts
```

### Mock Mode

Enable mock mode for testing without API calls:

```bash
AI_MOCK=1 npx tsx scripts/test-ai.ts
```

Or in code:

```typescript
// Set in .env
AI_MOCK = 1;

// Calls to generateText() will return mock responses
const result = await generateText("test");
```

## Utilities

### Build System Prompts

```typescript
import {
  buildSystemPrompt,
  buildContentSystemPrompt,
} from "@/lib/utils/ai-utils";

const systemPrompt = buildSystemPrompt({
  useCase: "text",
  tone: "professional",
  length: "medium",
  additionalContext: "Focus on technical accuracy",
});

const contentPrompt = buildContentSystemPrompt({
  type: "blog",
  tone: "casual",
  length: "long",
});
```

### Token Estimation

```typescript
import { estimateTokens, truncateToTokens } from "@/lib/utils/ai-utils";

const tokens = estimateTokens("Some text");
const truncated = truncateToTokens(longText, 1000);
```

### Retry with Backoff

```typescript
import { retryWithBackoff } from "@/lib/utils/ai-utils";

const result = await retryWithBackoff(() => someAPICall(), {
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 10000,
  shouldRetry: (error) => error.status === 429,
});
```

## Best Practices

1. **Use appropriate use cases**: Select the right `useCase` for your task
2. **Handle errors gracefully**: Implement proper error handling for production
3. **Monitor costs**: Track token usage and costs
4. **Set appropriate limits**: Use `maxTokens` to control output length
5. **Use streaming for long responses**: Better UX for lengthy generations
6. **Leverage mock mode**: Test without API costs during development
7. **Configure fallback**: Ensure both providers are configured for reliability

## Migration Guide

### From Legacy OpenAI-only Setup

```typescript
// Old
import { openai } from "@/lib/ai";
const response = await openai.chat.completions.create(...);

// New (backward compatible)
import { generateText } from "@/lib/ai";
const result = await generateText("prompt");

// Or direct client access
import { AIClient } from "@/lib/ai";
const client = new AIClient();
const result = await client.generate("prompt");
```

The new system maintains backward compatibility with the old `generateText()` signature.

## Troubleshooting

### "API key not configured"

Ensure at least one provider is configured:

- `OPENROUTER_API_KEY` or `OPENAI_API_KEY`

### "Rate limit exceeded"

The system includes automatic retry with backoff. If it persists:

- Check your API quotas
- Reduce request frequency
- Upgrade your plan

### "Model not found in registry"

Add the model to `ModelRegistry` in `ai.config.ts`:

```typescript
export const ModelRegistry: Record<string, ModelRegistryEntry> = {
  "your-model-id": {
    id: "your-model-id",
    provider: "OpenRouter",
    capabilities: ["text", "chat"],
    costPer1kTokens: { input: 0.001, output: 0.002 },
    maxTokens: 4096,
  },
};
```

## Support

For issues or questions:

1. Check this documentation
2. Review `scripts/test-ai.ts` for examples
3. Check TypeScript types in `lib/types/ai.types.ts`
4. See configuration in `config/ai.config.ts`
