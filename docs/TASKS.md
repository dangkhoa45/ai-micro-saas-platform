# Development Tasks

## Phase 1 – Core Platform Setup

1. Initialize Next.js + TypeScript project.
2. Configure Prisma + PostgreSQL connection.
3. Setup authentication using NextAuth.
4. Setup Stripe subscription flow.
5. Build dashboard layout with shadcn/ui.

## Phase 2 – AI Core Module

1. Integrate OpenAI API.
2. Create AI service utils for text and image generation.
3. Add API route `/api/ai/generate` that uses OpenAI.
4. Add usage tracking and token limit per user.

## Phase 3 – Micro-SaaS Modules

1. Create `/apps/ai-writer` module.
2. Create `/apps/ai-analytics` module.
3. Each app should have its own UI + API endpoints.

## Phase 4 – Deployment

1. Configure environment variables.
2. Setup Vercel deploy pipeline.
3. Migrate Prisma schema
