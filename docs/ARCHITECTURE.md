# Architecture Overview

This project is an **AI Micro-SaaS Platform** built with Next.js, TypeScript, Prisma, PostgreSQL, Stripe, and OpenAI API.

## Core Modules

- **Auth System:** NextAuth with credentials and OAuth providers
- **Billing System:** Stripe subscriptions with usage-based plans
- **AI Engine:** OpenAI API integration for text and image generation
- **Analytics:** Track usage and cost per user
- **Multi-App Support:** Each micro-SaaS tool (ai-writer, ai-analytics, etc.) is an isolated module under `/apps/`

## Tech Highlights

- Frontend: Next.js (App Router), TailwindCSS, shadcn/ui
- Backend: Next.js API routes, Prisma ORM
- Deployment: Vercel + Railway (PostgreSQL)
