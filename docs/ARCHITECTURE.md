# Architecture Overview

This project is an **AI Micro-SaaS Platform** built with Next.js, TypeScript, Prisma, PostgreSQL, Stripe, and OpenAI API. It follows a modular, scalable architecture designed to host multiple AI-powered micro-SaaS tools.

---

## 📐 System Architecture

### High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js App)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Dashboard   │  │  AI Writer   │  │  Future Apps     │   │
│  │  (Core UI)  │  │  (Tool #1)   │  │  (Extensible)    │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              API Layer (Next.js API Routes)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │  Stripe  │  │ AI/Writer│  │ Webhooks │   │
│  │   APIs   │  │   APIs   │  │   APIs   │  │   APIs   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
    ┌──────────────┐  ┌──────────┐  ┌──────────┐
    │   Database   │  │   AI     │  │  Stripe  │
    │  (Postgres)  │  │  (OpenAI)│  │   API    │
    │   + Prisma   │  │  Models  │  │          │
    └──────────────┘  └──────────┘  └──────────┘
```

---

## 🏗️ Core Architecture Layers

### 1. Presentation Layer (`/app`)

**Responsibility:** User interface and client-side logic

- **Pages:** Next.js 15 App Router pages
- **Layouts:** Shared layouts for dashboard, auth, tools
- **Client Components:** Interactive UI with "use client" directive
- **Server Components:** Default rendering strategy for performance

**Key Directories:**

- `/app/dashboard` - Main user dashboard
- `/app/auth` - Authentication pages (signin, signup)
- `/app/tools` - Micro-SaaS tool pages (ai-writer, etc.)
- `/app/api` - API route handlers

### 2. Business Logic Layer (`/packages/lib`)

**Responsibility:** Reusable business logic and utilities

**Core Modules:**

- **`ai.ts`** - AI integration with OpenAI, model selection, fallback logic, streaming
- **`auth.ts`** - NextAuth configuration and session management
- **`stripe.ts`** - Stripe integration for subscriptions and payments
- **`db.ts`** - Prisma client singleton
- **`types/`** - TypeScript type definitions and interfaces
- **`utils/`** - Helper functions and utilities

### 3. Data Access Layer (`/prisma`)

**Responsibility:** Database schema and migrations

**Core Models:**

- **User** - Authentication and profile data
- **Account/Session** - NextAuth session management
- **Subscription** - Stripe subscription tracking
- **Project** - User workspaces for organizing AI work
- **App** - Registry of available micro-SaaS tools
- **UsageLog** - AI API usage tracking (tokens, costs)

### 4. Configuration Layer (`/packages/config`)

**Responsibility:** Application configuration and settings

- **`ai.config.ts`** - AI model configuration, pricing, fallback strategies

---

## 🔌 Core Modules

### Authentication System

**Technology:** NextAuth.js v4 with Prisma adapter

**Features:**

- Credential-based authentication (email/password)
- OAuth providers (Google, GitHub) - _in progress_
- JWT session strategy
- Protected routes with middleware
- Session persistence

**Database Models:** `User`, `Account`, `Session`, `VerificationToken`

**API Routes:**

- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `POST /api/auth/register` - User registration

### Billing System

**Technology:** Stripe with subscription model

**Features:**

- Multiple subscription tiers (Free, Starter, Pro, Business)
- Stripe Checkout integration
- Customer Portal for plan management
- Webhook handling for subscription events
- Usage-based billing tracking

**Database Models:** `Subscription`

**API Routes:**

- `POST /api/subscription/checkout` - Create checkout session
- `POST /api/subscription/portal` - Access customer portal
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

### AI Engine

**Technology:** OpenAI API with intelligent fallback system

**Features:**

- Multi-model support (GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo)
- Automatic fallback when primary model fails
- Streaming response support
- Token usage tracking and cost calculation
- Mock mode for development (`AI_MOCK=1`)
- Custom error handling (rate limits, quotas, auth errors)
- Retry logic with exponential backoff

**Core Functions:**

- `generateText()` - Text generation with fallback
- `generateChat()` - Chat completions
- `streamText()` - Streaming responses
- `generateImage()` - DALL-E image generation
- `calculateCost()` - Token cost calculation
- `analyzeData()` - Data analysis
- `summarize()` - Text summarization

**Database Models:** `UsageLog`

**API Routes:**

- `POST /api/ai/writer` - AI Writer tool API

### Usage Analytics

**Purpose:** Track AI usage, costs, and user behavior

**Features:**

- Real-time token tracking
- Cost calculation per request
- Per-user usage aggregation
- Per-project usage tracking
- Monthly quota enforcement

**Database Models:** `UsageLog`

### Multi-App Support

**Architecture:** Plugin-based micro-SaaS system

**Features:**

- Each tool is isolated under `/app/tools/{tool-name}`
- Tools registered in `App` database table
- Shared UI components from `/packages/ui`
- Tool-specific API routes under `/app/api/{tool-name}`
- Per-tool settings stored in Project model

**Current Tools:**

- **AI Writer** (`/app/tools/ai-writer`) - Content generation tool

**Future Tools:**

- AI Analytics
- AI Image Generator
- AI Code Assistant

---

## 🔄 Data Flow Examples

### Example 1: User Generates Content with AI Writer

```text
1. User submits prompt in UI (/app/tools/ai-writer/page.tsx)
   │
   ▼
2. Client sends POST to /api/ai/writer
   │
   ▼
3. API validates user session (NextAuth)
   │
   ▼
4. API checks subscription status and usage quota
   │
   ▼
5. API calls generateText() from /packages/lib/ai.ts
   │
   ▼
6. AI client tries primary model (GPT-4o)
   │
   ├─ Success → Continue
   │
   └─ Failure → Try fallback models (GPT-4 Turbo → GPT-3.5)
   │
   ▼
7. Log usage to UsageLog table (tokens, cost, metadata)
   │
   ▼
8. Return generated content to client
   │
   ▼
9. UI displays content with formatting
```

### Example 2: User Subscribes to Pro Plan

```text
1. User clicks "Upgrade" button in dashboard
   │
   ▼
2. Client calls POST /api/subscription/checkout
   │
   ▼
3. API creates Stripe Checkout session
   │
   ▼
4. User redirected to Stripe payment page
   │
   ▼
5. User completes payment
   │
   ▼
6. Stripe sends webhook to /api/webhooks/stripe
   │
   ▼
7. Webhook handler updates Subscription model
   │
   ▼
8. User session refreshed with new plan data
```

---

## 🛠️ Technology Stack

### Frontend

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Icons:** lucide-react
- **Forms:** react-hook-form + zod validation
- **Animations:** Framer Motion (planned)

### Backend

- **Runtime:** Node.js (Next.js serverless)
- **API:** Next.js API Routes + Server Actions
- **Database ORM:** Prisma
- **Validation:** Zod schemas
- **Authentication:** NextAuth.js
- **Payments:** Stripe SDK

### Database

- **Database:** PostgreSQL
- **Hosting:** Railway (production) / Local (development)
- **Migrations:** Prisma Migrate

### AI Services

- **Provider:** OpenAI
- **Models:** GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo, DALL-E
- **SDK:** Official OpenAI Node.js library

### DevOps

- **Hosting:** Vercel (frontend + API)
- **CI/CD:** GitHub Actions (planned)
- **Monitoring:** Sentry (planned)
- **Analytics:** PostHog/Umami (planned)

---

## 🔒 Security Architecture

### Authentication Security

- JWT-based sessions with secure httpOnly cookies
- Password hashing with bcrypt
- Session expiration and refresh
- Protected API routes with middleware

### API Security

- Request validation with Zod schemas
- Rate limiting per user tier (planned)
- CSRF protection
- API key authentication for external access (planned)

### Data Security

- Environment variables for sensitive keys
- Database encryption at rest
- Secure Stripe webhook signature verification
- Input sanitization

---

## 📊 Scalability Considerations

### Current Architecture Strengths

- **Serverless-first:** Leverages Vercel serverless functions
- **Stateless API:** No server-side state, scales horizontally
- **Connection pooling:** Prisma manages database connections
- **Modular design:** Easy to add new micro-SaaS tools

### Planned Improvements

- **Caching layer:** Redis for session/API response caching
- **Background jobs:** Queue system (Bull/BullMQ) for heavy tasks
- **CDN:** Edge caching for static assets
- **Database optimization:** Read replicas, query optimization
- **Monitoring:** Real-time performance tracking

---

## 🔗 Integration Points

### External Services

| Service    | Purpose                  | Integration Point                      |
| ---------- | ------------------------ | -------------------------------------- |
| OpenAI API | AI text/image generation | `/packages/lib/ai.ts`                  |
| Stripe     | Payment processing       | `/packages/lib/stripe.ts`              |
| Railway    | PostgreSQL hosting       | Database connection via `DATABASE_URL` |
| Vercel     | Application hosting      | Automatic deployment from Git          |

### Internal Modules

| Module                    | Exports                                      | Used By                           |
| ------------------------- | -------------------------------------------- | --------------------------------- |
| `/packages/lib/ai.ts`     | `generateText()`, `streamText()`, `AIClient` | AI Writer API, future tools       |
| `/packages/lib/auth.ts`   | `authOptions`, session helpers               | API routes, middleware            |
| `/packages/lib/stripe.ts` | `stripe` client, helpers                     | Subscription APIs, webhooks       |
| `/packages/lib/db.ts`     | `prisma` client                              | All API routes requiring database |

---

## 📁 Folder Structure Reference

```text
ai-micro-saas-platform/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── ai/              # AI-related endpoints
│   │   ├── subscription/    # Stripe subscription APIs
│   │   └── webhooks/        # Webhook handlers
│   ├── auth/                # Auth pages (signin, signup)
│   ├── dashboard/           # Main dashboard pages
│   └── tools/               # Micro-SaaS tool pages
│       └── ai-writer/       # AI Writer tool
├── packages/
│   ├── config/              # Configuration files
│   │   └── ai.config.ts     # AI model configuration
│   ├── lib/                 # Business logic
│   │   ├── ai.ts           # AI integration
│   │   ├── auth.ts         # NextAuth config
│   │   ├── stripe.ts       # Stripe integration
│   │   ├── db.ts           # Prisma client
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helper functions
│   └── ui/                  # Shared UI components (future)
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts             # Seed data
│   └── migrations/          # Database migrations
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md     # This file
│   ├── TASKS.md            # Development roadmap
│   ├── TECH_STACK.md       # Technology details
│   └── PROMPT_GUIDE.md     # Coding guidelines
└── scripts/                 # Utility scripts
    └── test-ai-writer.ts    # Testing utilities
```

---

## 🎯 Design Principles

1. **Modularity** - Each feature is self-contained and reusable
2. **Type Safety** - TypeScript strict mode throughout
3. **Server-First** - Leverage server components for performance
4. **API-First** - Clean separation between frontend and backend
5. **Cost Awareness** - Track and optimize AI API costs
6. **Developer Experience** - Clear structure, good documentation
7. **Extensibility** - Easy to add new micro-SaaS tools

---

## 📝 Notes for Developers

- Always use the Prisma client from `/packages/lib/db.ts`
- All AI operations must go through `/packages/lib/ai.ts`
- Use Zod for request validation in API routes
- Follow the task roadmap in `/docs/TASKS.md`
- Reference tech stack details in `/docs/TECH_STACK.md`
- Check `/docs/PROMPT_GUIDE.md` for coding conventions
