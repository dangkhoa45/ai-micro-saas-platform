# Copilot Instruction Guide

When working inside this project, follow these rules:

- Always use **TypeScript** and **Next.js App Router**.
- Follow **SDLC phases** described in `/docs/TASKS.md`.
- Reuse shared components from `packages/ui` whenever possible.
- Store configuration and API keys in `packages/config`.
- Use **Prisma ORM** for all database access.
- Use **OpenAI API (gpt-4o)** for AI tasks.
- Implement proper **error handling** and **loading states**.
- Write clean, maintainable code that follows best practices.

When a new module (micro-SaaS) is added:

1. Create a folder under `/apps/{app-name}`.
2. Add UI components under `/apps/{app-name}/components`.
3. Add API routes under `/apps/{app-name}/api`.
4. Register the app route in `/apps/platform/routes.ts`.
