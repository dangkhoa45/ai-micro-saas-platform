# 🚀 OpenRouter Setup Guide

## Why OpenRouter?

OpenRouter provides access to **50+ AI models** from different providers through a single API, with significant cost advantages:

### 💰 Cost Comparison (per 1M tokens)

| Model                | Direct Provider | OpenRouter | Savings                          |
| -------------------- | --------------- | ---------- | -------------------------------- |
| GPT-4o               | $5.00           | $5.00      | Same                             |
| GPT-4o-mini          | $0.15           | $0.15      | Same                             |
| Claude 3.5 Sonnet    | $3.00           | $3.00      | Same                             |
| **Mistral 7B**       | N/A             | **$0.06**  | **83x cheaper than GPT-4o-mini** |
| **Gemini Flash 1.5** | N/A             | **$0.025** | **FREE tier available!**         |
| **Llama 3.1 8B**     | N/A             | **$0.05**  | **3x cheaper than GPT-4o-mini**  |

### ⚡ Current Configuration

Our platform is optimized to use the best model for each task:

```typescript
models: {
  text: "mistralai/mistral-7b-instruct",        // $0.00006/1k tokens - Ultra cheap
  chat: "meta-llama/llama-3.1-8b-instruct",     // $0.00005/1k tokens - Great for conversations
  data: "anthropic/claude-3.5-sonnet",          // $0.003/1k tokens - Best for analysis
  code: "deepseek/deepseek-coder",              // $0.00014/1k tokens - Code specialist
  general: "google/gemini-flash-1.5",           // $0.000025/1k tokens - FREE tier!
}
```

### 🛡️ Smart Fallback System

If a model fails, the system automatically tries multiple fallbacks:

```
Primary Model → Fallback 1 → Fallback 2 → Fallback 3
```

Example for text generation:

1. `mistralai/mistral-7b-instruct` (OpenRouter)
2. `google/gemini-flash-1.5` (OpenRouter, FREE)
3. `meta-llama/llama-3.1-8b-instruct` (OpenRouter)
4. `gpt-4o-mini` (OpenAI, if configured)

---

## 📝 Setup Instructions

### Step 1: Create OpenRouter Account

1. Visit https://openrouter.ai/
2. Sign up with GitHub or Email
3. No credit card required initially (FREE tier available)

### Step 2: Get API Key

1. Go to **Keys** section: https://openrouter.ai/keys
2. Click **Create Key**
3. Name it: "AI Micro-SaaS Platform"
4. Copy the key (starts with `sk-or-v1-...`)

### Step 3: Add to Environment

Open your `.env` file and add:

```env
# OpenRouter (Primary AI Provider) - REQUIRED
OPENROUTER_API_KEY="sk-or-v1-YOUR_KEY_HERE"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"

# OpenAI (Fallback) - OPTIONAL
OPENAI_API_KEY="sk-proj-YOUR_KEY_HERE"
```

### Step 4: Add Credits (Optional)

For production usage:

1. Go to https://openrouter.ai/credits
2. Click **Add Credits**
3. Start with $5 (lasts for ~100,000 requests with cheap models)
4. Credits never expire

---

## 💡 Usage Examples

### Cost Estimation

Using our default models, here's what you can generate for $1:

| Model        | Cost per 1k tokens | Requests for $1  |
| ------------ | ------------------ | ---------------- |
| Mistral 7B   | $0.00006           | ~16,666 requests |
| Gemini Flash | $0.000025          | ~40,000 requests |
| Llama 3.1 8B | $0.00005           | ~20,000 requests |
| GPT-4o-mini  | $0.00015           | ~6,666 requests  |

### Real-world Example

Generating a 500-word blog post (≈750 tokens):

| Model        | Cost per post | Posts for $1     |
| ------------ | ------------- | ---------------- |
| Mistral 7B   | $0.000045     | **22,222 posts** |
| Gemini Flash | $0.000019     | **52,631 posts** |
| GPT-4o-mini  | $0.000113     | **8,849 posts**  |

---

## 🔧 Testing Your Setup

### Method 1: Quick Test (Terminal)

```bash
# Test OpenRouter API
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer YOUR_OPENROUTER_KEY"
```

### Method 2: In-App Test

1. Restart your dev server: `npm run dev`
2. Go to http://localhost:3000/tools/ai-writer
3. Enter any prompt and click "Generate Content"
4. Check terminal logs for model used:

```
[AI] Using model: mistralai/mistral-7b-instruct
[AI] ✓ Success - Cost: $0.00001
```

### Method 3: Test Script

Run our test script:

```bash
npm run test:ai
```

This will test all configured models and show which ones work.

---

## 🎯 Model Selection Strategy

### Budget Mode (Recommended for Development)

```typescript
defaultModel: "mistralai/mistral-7b-instruct"; // $0.00006/1k
```

### Balanced Mode (Recommended for Production)

```typescript
defaultModel: "meta-llama/llama-3.1-8b-instruct"; // $0.00005/1k
```

### Quality Mode (For Critical Tasks)

```typescript
defaultModel: "anthropic/claude-3.5-sonnet"; // $0.003/1k
```

---

## 🆓 FREE Tier Models

These models have free tiers on OpenRouter:

1. **google/gemini-flash-1.5**

   - FREE for limited usage
   - 1M token context window
   - Great for testing

2. **meta-llama/llama-3.1-8b-instruct**
   - Very cheap ($0.00005/1k)
   - Good quality
   - Fast responses

---

## ❓ FAQ

### Q: Do I need both OpenRouter AND OpenAI?

**A:** No! You only need OpenRouter. OpenAI is optional as a fallback.

### Q: What if I run out of credits?

**A:** The system will automatically try fallback models. You'll get clear error messages in the console.

### Q: Can I use this in production?

**A:** Yes! OpenRouter is production-ready and used by many companies. Just add credits to your account.

### Q: How do I monitor usage?

**A:** Check https://openrouter.ai/activity for detailed usage logs and costs.

### Q: Can I limit spending?

**A:** Yes! Set spending limits in OpenRouter dashboard: https://openrouter.ai/settings

---

## 🔗 Useful Links

- OpenRouter Dashboard: https://openrouter.ai/
- Model Comparison: https://openrouter.ai/models
- API Documentation: https://openrouter.ai/docs
- Pricing: https://openrouter.ai/docs#models
- Status Page: https://status.openrouter.ai/

---

## 🚨 Troubleshooting

### Error: "API key not configured for provider OpenRouter"

**Solution:** Add `OPENROUTER_API_KEY` to your `.env` file

### Error: "Rate limit exceeded"

**Solution 1:** Wait a few seconds and try again
**Solution 2:** Add credits to your OpenRouter account
**Solution 3:** System will auto-fallback to cheaper models

### Error: "All models failed"

**Solution:** Check if you have at least ONE API key configured (OpenRouter OR OpenAI)

---

## 📊 Recommended Setup for Different Scales

### Hobby Project (FREE)

```env
OPENROUTER_API_KEY="sk-or-v1-..."  # Use free tier models
AI_DEFAULT_MODEL="google/gemini-flash-1.5"
```

### Startup (<1000 users)

```env
OPENROUTER_API_KEY="sk-or-v1-..."  # $10/month budget
AI_DEFAULT_MODEL="mistralai/mistral-7b-instruct"
```

### Growing Business (1000-10000 users)

```env
OPENROUTER_API_KEY="sk-or-v1-..."  # $50/month budget
AI_DEFAULT_MODEL="meta-llama/llama-3.1-8b-instruct"
```

### Enterprise (10000+ users)

```env
OPENROUTER_API_KEY="sk-or-v1-..."  # $500+/month
AI_DEFAULT_MODEL="anthropic/claude-3.5-sonnet"
OPENAI_API_KEY="sk-proj-..."  # Additional fallback
```

---

**Need help?** Check the logs in your terminal for detailed error messages and model fallback information.
