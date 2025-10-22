# AI Micro-SaaS Platform

A modular platform for building and monetizing AI-powered micro-SaaS applications.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, shadcn/ui (Radix UI)
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Credentials + OAuth)
- **AI Integration**: OpenAI API (GPT-4o, GPT-4 Turbo)
- **Payments**: Stripe (Subscriptions)
- **Deployment**: Vercel + Railway

## 📁 Project Structure

```
ai-micro-saas-platform/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── apps/                   # Micro-SaaS modules
│   ├── platform/          # Core platform
│   ├── ai-writer/         # AI Writer tool
│   └── ai-analytics/      # AI Analytics tool
├── packages/
│   ├── lib/               # Shared utilities
│   │   ├── auth.ts        # NextAuth configuration
│   │   ├── db.ts          # Prisma client
│   │   ├── stripe.ts      # Stripe helpers
│   │   └── ai.ts          # OpenAI helpers
│   ├── ui/                # Shared UI components
│   └── config/            # Configuration files
├── prisma/
│   └── schema.prisma      # Database schema
└── docs/                  # Documentation
```
