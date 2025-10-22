# AI Module Quick Reference

## 🚀 Common Usage Patterns

### Text Generation
```typescript
import { generateText } from "@/lib/ai";

const result = await generateText("Write a blog post about TypeScript", {
  useCase: "text",
  maxTokens: 1000,
});
```

### Chat
```typescript
import { generateChat } from "@/lib/ai";

const result = await generateChat([
  { role: "system", content: "You are helpful" },
  { role: "user", content: "Hello!" },
]);
```

### Streaming
```typescript
import { streamText } from "@/lib/ai";

for await (const chunk of streamText("Tell a story")) {
  process.stdout.write(chunk);
}
```

### Specific Model
```typescript
import { AIClient } from "@/lib/ai";

const client = new AIClient("anthropic/claude-3-5-sonnet");
const result = await client.generate("Complex analysis task");
```

## 📊 Model Selection by Use Case

| Use Case | Default Model | Best For |
|----------|---------------|----------|
| `text` | Mixtral 8x7B | Blog posts, articles, content |
| `chat` | GPT-4o-mini | Conversations, Q&A |
| `code` | GPT-4o | Programming, debugging |
| `data` | Claude 3.5 | Analysis, insights |
| `general` | Mixtral 8x7B | All-purpose |

## ⚙️ Environment Variables

```env
# Required (at least one)
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-proj-...

# Optional
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_MOCK=0
AI_MAX_TOKENS=2000
```

## 🎯 Options Reference

```typescript
interface AIGenerateOptions {
  model?: string;              // Specific model ID
  temperature?: number;        // 0-1 (default: 0.7)
  maxTokens?: number;          // Max output (default: 2000)
  systemPrompt?: string;       // Custom system message
  useCase?: AIUseCase;         // Auto-select model
}
```

## 💰 Cost Calculation

```typescript
import { calculateCost } from "@/lib/ai";

const cost = calculateCost(modelId, promptTokens, completionTokens);
console.log(`Cost: $${cost.toFixed(6)}`);
```

## 🧪 Testing & Development

```bash
# Run test suite
npx tsx scripts/test-ai.ts

# Mock mode (no API calls)
AI_MOCK=1 npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## 🔄 Fallback Flow

```
Request → OpenRouter (primary)
    ↓ (on error)
OpenAI (fallback)
    ↓ (on error)
Throw AIError
```

## ⚠️ Error Handling

```typescript
import { AIError, AIRateLimitError } from "@/lib/types/ai.types";

try {
  const result = await generateText("prompt");
} catch (error) {
  if (error instanceof AIRateLimitError) {
    // Handle rate limit
  } else if (error instanceof AIError) {
    console.log(error.provider, error.statusCode);
  }
}
```

## 📦 Module Structure

```
lib/
├── ai.ts                # Main exports
├── types/ai.types.ts    # TypeScript definitions
└── utils/ai-utils.ts    # Helper functions

config/
└── ai.config.ts         # Models & configuration

scripts/
└── test-ai.ts           # Integration tests
```

## 🔑 Key Functions

| Function | Purpose |
|----------|---------|
| `generateText()` | Basic text generation |
| `generateChat()` | Multi-turn conversations |
| `streamText()` | Streaming responses |
| `analyzeData()` | Data analysis |
| `summarize()` | Text summarization |
| `generateImage()` | DALL-E images |
| `createEmbedding()` | Vector embeddings |
| `calculateCost()` | Token cost calculation |

## 🎨 Content Types

```typescript
import { buildContentSystemPrompt } from "@/lib/utils/ai-utils";

const prompt = buildContentSystemPrompt({
  type: "blog" | "article" | "email" | "social" | "general",
  tone: "professional" | "casual" | "friendly" | "formal",
  length: "short" | "medium" | "long",
});
```

## 🔐 Production Checklist

- [ ] Set `OPENROUTER_API_KEY` or `OPENAI_API_KEY`
- [ ] Configure error logging
- [ ] Set up monitoring
- [ ] Test fallback mechanism
- [ ] Set appropriate rate limits
- [ ] Remove `AI_MOCK=1` from production
- [ ] Document usage limits per plan
- [ ] Configure alerts for API errors

## 📚 Documentation

- **Full docs**: `docs/AI_MODULE_README.md`
- **Phase 2 summary**: `docs/PHASE_2_AI_SETUP_COMPLETE.md`
- **Test suite**: `scripts/test-ai.ts`
- **Types**: `packages/lib/types/ai.types.ts`
- **Config**: `packages/config/ai.config.ts`
