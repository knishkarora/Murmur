# JOURNEY.md

Development diary for **AI Progress Companion**. Technical details live in `/docs`. This file is the human story.

---

## Entry 1 — Project Kickoff (2026-07-14)

### What was accomplished
- Defined Phase 1 technical architecture (monorepo, Supabase, Gemini, Grammy, full library stack).
- Created `/docs` knowledge graph as the single source of truth.
- Scaffolded project foundation per [[Architecture]] and [[Folder Structure]].

### Why this mattered
Every future feature builds on a documented, consistent foundation. Starting with docs-first means agents (and future me) never have to rediscover decisions from scratch.

### Biggest challenge
Balancing AGENT.md minimalism with a deliberate library stack — resolved by recording the choice in [[Decisions]]: use libraries to reduce boilerplate, but YAGNI on vision features.

### Decisions
- **Gemini** as primary AI (cost-effective for POC).
- **Supabase Auth** integrated with PostgreSQL + pgvector + Realtime.
- **pnpm + Turborepo** monorepo with `packages/shared` for Zod schemas.
- Evening reflection cron **deferred** until explicitly requested.

### What I learned
Planning the docs graph before code forces clarity on data flows and module boundaries before writing a single route.

### What I'd do differently next time
Nothing yet — first milestone. Will revisit after Telegram + AI conversation loop works end-to-end.

### Evidence
- Architecture diagram: `docs/journey-assets/` (to be added at first deploy)

---

## Entry 2 — Slice 1 Completed: Monorepo Foundation & Base Apps (2026-07-24)

### What was accomplished
- Built and exported `@companion/shared` with Zod schemas, prompt templates, and env validators.
- Built Express 5 server entry in `@companion/api` hosting `GET /health` endpoint with Helmet, CORS, and Pino logger.
- Scaffolded `@companion/web` React 19 + Vite 6 + TypeScript application displaying live API status.
- Verified workspace dependencies (`pnpm install`), full build (`pnpm build`), typecheck (`pnpm typecheck`), and live `/health` response.

### Why this mattered
Establishes a clean, runnable, zero-error monorepo foundation that compiles and passes typechecks locally before introducing database and auth dependencies in Slice 2.

### Decisions
- Added dev fallbacks in env schema to allow offline local server startup prior to populating cloud API keys.
- Fully mapped the `/docs` folder using clickable `file:///` scheme links directly to the codebase directories, schema files, prompts, and middleware to make context discovery instant for future development.

---

## Entry 3 — Slice 2 Completed: Database Connection & Auth Layer (2026-07-24)

### What was accomplished
- Updated `.agents/rules/AGENT.md` and `feature-builder` skill instructions to make doc updates and clickable `file:///` link mapping a mandatory, automatic step for all future coding tasks.
- Defined Drizzle Postgres database schemas in [schema.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/db/schema.ts) covering all 12 tables and configured Drizzle ORM client connection in [index.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/db/index.ts).
- Configured Supabase Auth JWT verification middleware ([auth.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/middleware/auth.ts)) and added the `/me` authenticated endpoint in [index.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/index.ts).
- Exported client-side Supabase instance in [supabase.ts](file:///e:/Projects/tasks/Murmur/apps/web/src/lib/supabase.ts) with `vite-env.d.ts` type safety.
- Verified monorepo typecheck (`pnpm typecheck`) and full production build (`pnpm build`).

### Why this mattered
Establishes a type-safe, database-ready backend with authenticated routes and client auth helpers, laying the groundwork for Telegram account linking and user onboarding in Slice 3.


