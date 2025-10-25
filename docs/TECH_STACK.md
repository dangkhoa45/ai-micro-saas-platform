# 🧠 TECH STACK OVERVIEW

This document defines the full technology stack used in the **AI Micro-SaaS Platform** project. It serves as a technical reference for developers and AI assistants (e.g., GitHub Copilot, ChatGPT) to understand the environment, dependencies, and coding conventions.

---

## 📋 Table of Contents

1. [Project Summary](#-project-summary)
2. [Frontend](#-frontend)
3. [Backend](#-backend)
4. [AI Integration](#-ai-integration)
5. [Billing System](#-billing-system)
6. [Database Layer](#-database-layer)
7. [Authentication](#-authentication)
8. [Deployment](#-deployment)
9. [Tooling and Standards](#-tooling-and-standards)
10. [Folder Structure Summary](#-folder-structure-summary)
11. [Copilot and AI Assistant Notes](#-copilot-and-ai-assistant-notes)

---

## 🏗️ Project Summary

**Goal:**  
A modular platform that can host multiple AI-powered micro-SaaS tools — such as content generation, data analysis, and AI workflow automation — from zero to monetisation.

**Tech Stack:**  
Next.js + TypeScript + Prisma + PostgreSQL + Stripe + OpenAI API  
Deployed via Vercel (frontend & API) and Railway (database).

---

## 🖥️ Frontend

**Framework:**

- **Next.js 15+** with **App Router**
- Written entirely in **TypeScript**

**UI Layer:**

- **TailwindCSS** for styling
- **shadcn/ui** components (built on **Radix UI**)
- **lucide-react** icons
- **react-hook-form** + **zod** for validation
- Minimal state management (React hooks / Zustand if needed)

**Guidelines:**

- Default to **server components**; use `"use client"` only when required.
- Follow **App Router convention:** `/app/{module}/page.tsx`
- Use `async` **Server Actions** for data mutations.
- Keep components modular, reusable, and typed.

---

## ⚙️ Backend

**Architecture:**

- API built with **Next.js API Routes / Server Actions**
- Database handled via **Prisma ORM**
- Type-safe validation via **zod**

**Core backend directories:**

```plaintext
lib/
├─ db.ts       # Prisma client
├─ ai.ts       # OpenAI helper
├─ stripe.ts   # Stripe helper
├─ auth.ts     # NextAuth config
├─ errors.ts   # Custom error classes
```

**Environment variables:**  
Defined in `.env` and documented in `.env.example`

```plaintext
DATABASE_URL=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

---

## 🧠 AI Integration

**Provider:**

- **OpenAI API (GPT-4o / GPT-4 Turbo)**

**Library:**

- Official `openai` npm SDK

**Usage:**

- Text generation (content, summaries, email, code)
- Image generation (optional, via DALL-E)
- Embedding & workflow chaining for advanced features

**Implementation rules:**

- All AI requests go through `/lib/ai.ts`
- Include user ID or project ID in every AI call for usage tracking
- Store token usage in `UsageLog` table

**Example:**

```typescript
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateText(prompt: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0].message?.content;
}
```

---

## 💳 Billing System

**Provider:**

- **Stripe**

**Model:**

- Subscription plans (Starter, Pro, Business)
- Optionally usage-based billing (per AI call or token count)

**Implementation:**

- Stripe Checkout session for subscription
- Customer Portal for plan management
- Webhooks handled in `/app/api/webhooks/stripe/route.ts`
- Sync subscription data to local DB (`Subscription` model)

---

## 🗄️ Database Layer

**Database:**

- **PostgreSQL**

**ORM:**

- **Prisma**

**Schema location:**

- `/prisma/schema.prisma`

**Main entities:**

| Model          | Description                  |
| -------------- | ---------------------------- |
| `User`         | Authentication and profile   |
| `Subscription` | Stripe plan data             |
| `Project`      | Each micro-SaaS instance     |
| `UsageLog`     | AI token usage tracking      |
| `App`          | Registry for available tools |

**Example schema:**

```prisma
model User {
  id           String       @id @default(cuid())
  email        String       @unique
  name         String?
  subscriptions Subscription[]
  usageLogs    UsageLog[]
}

model UsageLog {
  id        String   @id @default(cuid())
  userId    String
  tokens    Int
  cost      Float
  createdAt DateTime @default(now())
}
```

---

## 🔐 Authentication

**Library:**

- **NextAuth.js**

**Features:**

- Email/password & OAuth (Google/GitHub)
- JWT-based sessions
- Integrated with Prisma adapter
- Secure API protection using `getServerSession()`

---

## 🚀 Deployment

**Hosting:**

- **Vercel**: Frontend + API routes
- **Railway**: PostgreSQL instance

**CI/CD:**

- GitHub Actions (`.github/workflows/deploy.yml`)
- Automatic schema migration & test before deploy

**Build Commands:**

```bash
npm run build
npm run prisma generate
npm run start
```

---

## 🛠️ Tooling and Standards

| Tool                               | Purpose                     |
| ---------------------------------- | --------------------------- |
| **ESLint** + **Prettier**          | Code formatting and linting |
| **Husky**                          | Pre-commit hooks            |
| **Zod**                            | Input validation            |
| **PostHog** / **Umami** (optional) | Analytics                   |
| **Sentry** (optional)              | Error monitoring            |

**Code Style Rules:**

- Use TypeScript strict mode
- Components → PascalCase
- Utils → camelCase
- No inline styles (use Tailwind classes)
- One default export per file
- Validate all API inputs with `zod`

---

## 📂 Folder Structure Summary

```plaintext
ai-micro-saas-platform/
│
├── apps/
│   ├── platform/      # Core dashboard & system
│   ├── ai-writer/     # Micro-SaaS tool #1
│   ├── ai-analytics/  # Micro-SaaS tool #2
│
├── packages/
│   ├── ui/            # Shared components (shadcn/ui)
│   ├── lib/           # Reusable helpers
│   ├── config/        # OpenAI, Stripe, env settings
│
├── prisma/            # Database schema & migrations
├── docs/              # Documentation (this file, tasks, prompts)
└── .github/           # CI/CD workflows
```

---

## 🤖 Copilot and AI Assistant Notes

To ensure Copilot and AI assistants generate consistent code:

- Always use TypeScript.
- Always import the Prisma client from `lib/db.ts`.
- Always use OpenAI via `lib/ai.ts`.
- Always handle Stripe operations via `lib/stripe.ts`.
- Follow the roadmap in `/docs/TASKS.md`.
- Reuse shared UI from `packages/ui`.
- Follow the architecture described in `/docs/ARCHITECTURE.md`.
