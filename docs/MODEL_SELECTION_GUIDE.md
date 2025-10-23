# 🎯 AI Model Selection Guide

## Quick Reference: Best Models by Use Case

| Use Case              | Primary Model                      | Cost/1k tokens | Why?                                 |
| --------------------- | ---------------------------------- | -------------- | ------------------------------------ |
| **Text Generation**   | `mistralai/mistral-7b-instruct`    | $0.00006       | Ultra-fast, cheap, good quality      |
| **Chat/Conversation** | `meta-llama/llama-3.1-8b-instruct` | $0.00005       | Natural dialogue, context-aware      |
| **Data Analysis**     | `anthropic/claude-3.5-sonnet`      | $0.003         | Best reasoning, handles complex data |
| **Code Generation**   | `deepseek/deepseek-coder`          | $0.00014       | Specialized for programming          |
| **General Tasks**     | `google/gemini-flash-1.5`          | $0.000025      | FREE tier, 1M context window         |

---

## 📊 All Available Models

### 💚 Budget Tier ($0.00001 - $0.0001/1k tokens)

#### 1. Google Gemini Flash 1.5

```typescript
modelId: "google/gemini-flash-1.5"
cost: $0.000025/1k tokens
context: 1,048,576 tokens
```

**Best for:**

- Development & testing (FREE tier)
- High-volume applications
- Tasks requiring huge context
- Real-time responses

**Strengths:**

- ⚡ Ultra-fast
- 💰 FREE tier available
- 🧠 1M token context window
- 📊 Good for data analysis

**Limitations:**

- Slightly less accurate than premium models
- Rate limits on free tier

---

#### 2. Meta Llama 3.1 8B Instruct

```typescript
modelId: "meta-llama/llama-3.1-8b-instruct"
cost: $0.00005/1k tokens
context: 131,072 tokens
```

**Best for:**

- Chat applications
- Customer support bots
- Content moderation
- General Q&A

**Strengths:**

- 💬 Excellent for dialogue
- 🎯 Context-aware responses
- ⚖️ Good quality/cost balance
- 🔒 Open-source (transparent)

---

#### 3. Mistral 7B Instruct

```typescript
modelId: "mistralai/mistral-7b-instruct"
cost: $0.00006/1k tokens
context: 32,768 tokens
```

**Best for:**

- Blog post generation
- Email writing
- Social media content
- Product descriptions

**Strengths:**

- ⚡ Very fast
- 💰 Extremely cheap
- 📝 Good writing quality
- 🌍 Multilingual support

---

### 💙 Mid-Tier ($0.0001 - $0.001/1k tokens)

#### 4. DeepSeek Coder

```typescript
modelId: "deepseek/deepseek-coder"
cost: $0.00014/1k tokens
context: 64,000 tokens
```

**Best for:**

- Code generation
- Bug fixing
- Code documentation
- Refactoring

**Strengths:**

- 👨‍💻 Specialized for code
- 🐛 Excellent debugging
- 📚 Understands multiple languages
- 💡 Smart suggestions

**Limitations:**

- Not ideal for general text
- Best used specifically for coding tasks

---

#### 5. Mixtral 8x7B Instruct

```typescript
modelId: "mistralai/mixtral-8x7b-instruct"
cost: $0.00024/1k tokens
context: 32,768 tokens
```

**Best for:**

- Complex reasoning tasks
- Multi-step instructions
- Technical writing
- Creative content

**Strengths:**

- 🧠 Mixture of Experts architecture
- ⚡ Fast despite size
- 🎯 High quality outputs
- 💪 Strong reasoning

---

#### 6. Qwen 2.5 Coder 32B

```typescript
modelId: "qwen/qwen-2.5-coder-32b-instruct"
cost: $0.0003/1k tokens
context: 32,768 tokens
```

**Best for:**

- Advanced code generation
- System architecture
- Algorithm implementation
- Code review

**Strengths:**

- 🚀 Powerful reasoning
- 💻 Excellent code quality
- 📖 Good documentation
- 🔧 Handles complex logic

---

### 💎 Premium Tier ($0.001 - $0.005/1k tokens)

#### 7. Google Gemini Pro 1.5

```typescript
modelId: "google/gemini-pro-1.5"
cost: $0.00125/1k tokens (input)
context: 2,097,152 tokens
```

**Best for:**

- Analyzing large documents
- Research paper summarization
- Legal document review
- Codebase analysis

**Strengths:**

- 📚 2M token context (entire books!)
- 🔍 Excellent comprehension
- 📊 Data analysis
- 🌐 Multimodal capabilities

---

#### 8. Meta Llama 3.1 70B Instruct

```typescript
modelId: "meta-llama/llama-3.1-70b-instruct"
cost: $0.0009/1k tokens
context: 131,072 tokens
```

**Best for:**

- Enterprise applications
- Complex problem solving
- Research assistance
- High-quality content

**Strengths:**

- 🎯 High accuracy
- 🧠 Strong reasoning
- 🔒 Open-source
- ⚖️ Balanced cost/quality

---

### 💰 Premium Tier ($0.003+/1k tokens)

#### 9. Anthropic Claude 3.5 Sonnet

```typescript
modelId: "anthropic/claude-3.5-sonnet"
cost: $0.003/1k tokens (input)
context: 200,000 tokens
```

**Best for:**

- Data analysis & insights
- Complex reasoning tasks
- Research assistance
- Critical business decisions

**Strengths:**

- 🧠 Best-in-class reasoning
- 📊 Excellent data analysis
- 🎯 Very accurate
- 🔍 Deep understanding

**Use when:**

- Accuracy is critical
- Complex analysis needed
- Budget allows for quality

---

#### 10. OpenAI GPT-4o

```typescript
modelId: "openai/gpt-4o"
cost: $0.005/1k tokens (input)
context: 128,000 tokens
```

**Best for:**

- Mission-critical applications
- Highest quality requirements
- Multimodal tasks
- Complex reasoning

**Strengths:**

- 🏆 Top-tier quality
- 🎨 Multimodal (text, vision)
- 🧠 Excellent reasoning
- 🌍 Wide knowledge

**Use when:**

- Best possible quality needed
- Brand/reputation critical
- Complex multimodal tasks

---

## 🎯 Decision Tree

```
Start Here
│
├─ Need: Code generation?
│  ├─ Yes → deepseek/deepseek-coder ($0.00014/1k)
│  └─ No ↓
│
├─ Need: Chat/Conversation?
│  ├─ Yes → meta-llama/llama-3.1-8b-instruct ($0.00005/1k)
│  └─ No ↓
│
├─ Need: Large document analysis?
│  ├─ Yes → google/gemini-pro-1.5 ($0.00125/1k)
│  └─ No ↓
│
├─ Need: Critical data analysis?
│  ├─ Yes → anthropic/claude-3.5-sonnet ($0.003/1k)
│  └─ No ↓
│
├─ Budget: Limited/Free?
│  ├─ Yes → google/gemini-flash-1.5 (FREE)
│  └─ No ↓
│
└─ Default: mistralai/mistral-7b-instruct ($0.00006/1k)
```

---

## 💡 Pro Tips

### For Startups (Budget Conscious)

**Recommended Stack:**

```typescript
{
  text: "mistralai/mistral-7b-instruct",      // $0.00006/1k
  chat: "meta-llama/llama-3.1-8b-instruct",   // $0.00005/1k
  code: "deepseek/deepseek-coder",            // $0.00014/1k
  general: "google/gemini-flash-1.5",         // FREE tier
}
```

**Monthly cost estimate:** $5-10 for 1000 users

---

### For Enterprises (Quality Focused)

**Recommended Stack:**

```typescript
{
  text: "meta-llama/llama-3.1-70b-instruct",  // $0.0009/1k
  chat: "anthropic/claude-3.5-sonnet",        // $0.003/1k
  code: "qwen/qwen-2.5-coder-32b-instruct",   // $0.0003/1k
  data: "anthropic/claude-3.5-sonnet",        // $0.003/1k
}
```

**Monthly cost estimate:** $50-500 for 10,000 users

---

### For Development/Testing

**Recommended:**

```typescript
// In .env
AI_MOCK = "1"; // Use mock responses

// Or use free tier
{
  defaultModel: "google/gemini-flash-1.5"; // FREE
}
```

---

## 📈 Performance Comparison

| Model          | Speed      | Quality    | Cost     | Best For      |
| -------------- | ---------- | ---------- | -------- | ------------- |
| Gemini Flash   | ⚡⚡⚡⚡⚡ | ⭐⭐⭐     | 💰       | High volume   |
| Mistral 7B     | ⚡⚡⚡⚡   | ⭐⭐⭐⭐   | 💰       | General text  |
| Llama 3.1 8B   | ⚡⚡⚡⚡   | ⭐⭐⭐⭐   | 💰       | Chat          |
| DeepSeek Coder | ⚡⚡⚡     | ⭐⭐⭐⭐   | 💰       | Code          |
| Mixtral 8x7B   | ⚡⚡⚡⚡   | ⭐⭐⭐⭐   | 💰💰     | Complex tasks |
| Llama 3.1 70B  | ⚡⚡⚡     | ⭐⭐⭐⭐⭐ | 💰💰     | Quality       |
| Claude 3.5     | ⚡⚡       | ⭐⭐⭐⭐⭐ | 💰💰💰   | Analysis      |
| GPT-4o         | ⚡⚡       | ⭐⭐⭐⭐⭐ | 💰💰💰💰 | Premium       |

---

## 🔄 How to Change Models

### Method 1: Environment Variable

```env
AI_DEFAULT_MODEL="mistralai/mistral-7b-instruct"
```

### Method 2: In Code (Specific Request)

```typescript
const result = await generateText("Your prompt", {
  model: "anthropic/claude-3.5-sonnet",
});
```

### Method 3: By Use Case (Config File)

```typescript
// packages/config/ai.config.ts
models: {
  text: "your-preferred-model",
  chat: "your-preferred-model",
  // ...
}
```

---

## 📊 ROI Calculator

### Example: Blog Post Generator

**Scenario:** Generate 100 blog posts/day (500 words each ≈ 750 tokens)

| Model        | Cost/Post | Monthly Cost | Annual Cost |
| ------------ | --------- | ------------ | ----------- |
| Gemini Flash | $0.000019 | $0.57        | $6.84       |
| Mistral 7B   | $0.000045 | $1.35        | $16.20      |
| Llama 8B     | $0.000038 | $1.14        | $13.68      |
| GPT-4o-mini  | $0.000113 | $3.39        | $40.68      |
| Claude 3.5   | $0.002250 | $67.50       | $810.00     |
| GPT-4o       | $0.003750 | $112.50      | $1,350.00   |

**Savings:** Using Mistral 7B vs GPT-4o = **$1,333.80/year** (98% cheaper!)

---

## 🎬 Getting Started

1. **Read the setup guide:** `docs/OPENROUTER_SETUP.md`
2. **Get your API key:** https://openrouter.ai/keys
3. **Add to `.env`:** `OPENROUTER_API_KEY="sk-or-v1-..."`
4. **Restart server:** `npm run dev`
5. **Test it:** Visit `/tools/ai-writer`

---

**Questions?** Check the full documentation in `docs/AI_MODULE_README.md`
