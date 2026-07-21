# Decisions

Log of Architecture Decision Records (ADRs) and scope definitions for Murmur.

---

## Architecture Decision Records (ADRs)

### ADR-001: Monorepo Setup with Turborepo
- **Decision:** Use `pnpm workspaces` + `Turborepo` containing frontend application `apps/web`, backend api service `apps/api`, and cross-workspace utility `packages/shared`.
- **Reasoning:** Prevents schema and interface duplication. Zod validation schemas can be shared between form handlers in React and route validators in Express, eliminating type drift. Parallelized tasks improve local build and dev speeds.

### ADR-002: Google Gemini for Primary AI
- **Decision:** Utilize Google Gemini (`gemini-2.0-flash`) as the primary language model.
- **Reasoning:** Offers a highly cost-efficient free tier, high context window capability, and robust structured JSON output support.

### ADR-003: Supabase Auth
- **Decision:** Adopt `Supabase Auth` (Email + password) instead of third-party vendors like Clerk.
- **Reasoning:** Keeps database and authentication workflows inside a single ecosystem. Allows setting clean Postgres Row-Level Security (RLS) policies directly linked to the user's Auth UUID.

### ADR-004: Grammy SDK for Telegram
- **Decision:** Adopt `Grammy` instead of writing custom raw HTTP webhook handlers.
- **Reasoning:** Grammy is a TypeScript-first bot framework. Middleware composition simplifies inbound flow controls, error interception, and webhook execution.

### ADR-005: Drizzle ORM
- **Decision:** Use `Drizzle ORM` for schema definition and migrations rather than relying on raw Supabase client database mutations.
- **Reasoning:** Offers SQL-first type safety, schema-controlled migration outputs via Drizzle Kit, and high-performance Postgres connections.

### ADR-006: 4-Layer Context Memory
- **Decision:** Implement a custom 4-layer memory context engine (Short-term buffer, Rolling summary, Key-value facts, and pgvector semantic recalls).
- **Reasoning:** Avoids the overhead and abstraction complexity of frameworks like LangChain, while keeping prompt token lengths bounded.

### ADR-007: Hosting Express API on Render
- **Decision:** Deploy the Express server API service on `Render` (persistent web service) rather than Vercel Serverless.
- **Reasoning:** Grammy webhook endpoints require quick, warm execution paths. Long-running scheduler processes (`node-cron`) are not supported in serverless architectures.

### ADR-008: Deferred Evening Reflection Job
- **Decision:** Omit the `daily_evening` reflection cron check in the initial Phase 1 release.
- **Reasoning:** Governed by YAGNI (You Aren't Gonna Need It). The daily morning loop is sufficient to validate the core user value.

### ADR-009: Standard Libraries Over Native Re-implementations
- **Decision:** Use established libraries (Tailwind CSS 4, shadcn/ui, TanStack Query, Zustand, Zod, date-fns, Recharts, postgres.js).
- **Reasoning:** Aligns with user preferences to minimize custom boilerplates and leverage robust, community-supported libraries.

---

## Scope Exclusions (What is skipped in Phase 1)

The following items are deferred to Phase 2 to focus strictly on building a functional POC:
- **Alternate Channels:** WhatsApp, voice interfaces, SMS, or multi-language messaging.
- **Framework Overhead:** LangChain or other agent frameworks.
- **Heavy Job Queues:** Redis, BullMQ, or RabbitMQ services.
- **Scrapers:** External job board feeds or placement scrape workers (the assistant generates career tips dynamically using LLM context).
- **Monetization:** Payment gates or recurring subscriptions.
- **Alternative Auth:** Clerk or Auth0 configurations.
- **Evening Reflection Cron:** Deferred until user request confirmation.

---

## Related Docs
- [[Architecture]]
- [[Project Overview]]
- [[Roadmap]]
- [[Current Status]]
