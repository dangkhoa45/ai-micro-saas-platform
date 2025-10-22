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

## 🛠️ Phase 1: Core Platform Setup - COMPLETED ✅

### Completed Tasks:

1. ✅ **Next.js + TypeScript Configuration**

   - Configured `next.config.ts` with App Router support
   - Set up `tsconfig.json` with path aliases
   - Created project structure

2. ✅ **Prisma + PostgreSQL Setup**

   - Created comprehensive database schema
   - Models: User, Account, Session, Subscription, Project, UsageLog, App
   - NextAuth.js integration ready

3. ✅ **Environment Variables**

   - Created `.env.example` with all required variables
   - Documented all API keys and secrets

4. ✅ **NextAuth Authentication**

   - Configured NextAuth with Prisma adapter
   - Credentials provider (email/password)
   - OAuth providers (Google, GitHub)
   - Session management with JWT

5. ✅ **Stripe Integration**

   - Stripe client setup
   - Subscription plans (Free, Starter, Pro, Business)
   - Checkout session helpers
   - Customer portal integration
   - Webhook signature verification

6. ✅ **Database Client**

   - Singleton Prisma client
   - Development logging
   - Production-ready configuration

7. ✅ **Dashboard & UI**

   - Home page
   - Dashboard layout
   - Sign-in page with OAuth
   - API route for NextAuth

8. ✅ **TailwindCSS + shadcn/ui**

   - TailwindCSS configuration
   - Dark mode support
   - shadcn/ui theme variables
   - Global styles

9. ✅ **AI Integration Helpers**
   - OpenAI client setup
   - Text generation functions
   - Streaming support
   - Image generation (DALL-E)
   - Token cost calculation

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Stripe account (for payments)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Setup Environment Variables

Copy `.env.example` to `.env` (or `.env.local`) and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Usually `http://localhost:3000` for local dev
- `OPENAI_API_KEY`: Your OpenAI API key
- `STRIPE_SECRET_KEY`: Your Stripe secret key

Optional (to enable OAuth buttons on the sign-in page):

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

OAuth redirect URIs for local development:

- Google: `http://localhost:3000/api/auth/callback/google`
- GitHub: `http://localhost:3000/api/auth/callback/github`

### Step 3: Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# (Optional) Open Prisma Studio
npm run prisma:studio
```

#### Option: Run PostgreSQL locally with Docker

If you don't have PostgreSQL installed, you can start a local instance using Docker:

```bash
# Start Postgres in the background
docker compose up -d postgres

# Apply the Prisma schema
npm run prisma:push
```

This uses the provided `docker-compose.yml` with credentials that match the sample `DATABASE_URL` in `.env.example`.

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Creating Your First User

Since we're using credentials authentication, you'll need to manually create a user in the database with a hashed password, or implement a registration endpoint.

### Option 1: Create user via Prisma Studio

1. Run `npm run prisma:studio`
2. Navigate to the User model
3. Create a new user with email and a bcrypt-hashed password

### Option 2: Create a registration API route (recommended for production)

## 📚 Next Steps: Phase 2 - AI Core Module

The following tasks are planned for Phase 2:

1. Create `/api/ai/generate` endpoint
2. Implement usage tracking
3. Add token limit enforcement per plan
4. Build AI Writer interface
5. Build AI Analytics interface

## 🤖 Available AI Models

- **GPT-4o**: Latest and most capable model
- **GPT-4 Turbo**: Fast and powerful
- **GPT-3.5 Turbo**: Cost-effective option

## 💳 Subscription Plans

| Plan     | Price  | Tokens/Month | Projects  | Features            |
| -------- | ------ | ------------ | --------- | ------------------- |
| Free     | $0     | 1,000        | 1         | Basic               |
| Starter  | $9.99  | 50,000       | 5         | Advanced analytics  |
| Pro      | $29.99 | 200,000      | Unlimited | API access          |
| Business | $99.99 | 1,000,000    | Unlimited | Custom integrations |

## 📖 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Tech Stack Details](./docs/TECH_STACK.md)
- [Development Tasks](./docs/TASKS.md)

## 🤝 Contributing

This project follows the architecture and tasks defined in the `/docs` folder. Please refer to:

- `/docs/ARCHITECTURE.md` for system design
- `/docs/TECH_STACK.md` for technology choices
- `/docs/TASKS.md` for current development roadmap

## 📄 License

MIT
