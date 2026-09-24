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
- Fully mapped the `/docs` folder using Obsidian wiki links and relative markdown links directly to the codebase directories, schema files, prompts, and middleware to make context discovery instant.

---

## Entry 3 — Slice 2 Completed: Database Connection & Auth Layer (2026-07-24)

### What was accomplished
- Updated `.agents/rules/AGENT.md` and `feature-builder` skill instructions to require relative markdown links and wiki links for doc syncs (eliminating absolute `file:///` paths).
- Defined Drizzle Postgres database schemas in `apps/api/src/db/schema.ts` covering all 12 tables and configured Drizzle ORM client connection in `apps/api/src/db/index.ts`.
- Configured Supabase Auth JWT verification middleware (`apps/api/src/middleware/auth.ts`) and added the `/me` authenticated endpoint in `apps/api/src/index.ts`.
- Exported client-side Supabase instance in `apps/web/src/lib/supabase.ts` with `vite-env.d.ts` type safety.
- Verified monorepo typecheck (`pnpm typecheck`) and full production build (`pnpm build`).

### Why this mattered
Establishes a type-safe, database-ready backend with authenticated routes and client auth helpers, laying the groundwork for Telegram account linking and user onboarding in Slice 3.

---

## Entry 4 — Slice 3 Completed: Telegram Account Connection & Linking Flow (2026-07-24)

### What was accomplished
- Added `TELEGRAM_BOT_USERNAME` configuration to `@companion/shared` env validators.
- Implemented authenticated `POST /me/telegram/link` route to generate 15-minute SHA-256 link tokens and returned formatted deep links (`https://t.me/<BotUsername>?start=link_TOKEN`).
- Created Grammy Bot instance and `/start link_TOKEN` handler ([`bot.ts`](apps/api/src/bot.ts)) to verify tokens, upsert `telegram_accounts`, and set `onboardingDone = true`.
- Configured public webhook route (`POST /webhooks/telegram` in [`telegram.ts`](apps/api/src/routes/telegram.ts)) with secret header verification (`X-Telegram-Bot-Api-Secret-Token`) and database idempotency guard via `webhook_events`.
- Documented execution sequence in `flow.md` and recorded architectural rationale in `decision.md`.

### Why this mattered
Enables seamless, secure user account linking between web dashboard users and Telegram chats using single-use SHA-256 tokens, paving the way for AI conversational memory integration in Slice 4.

---

## Entry 5 — Slice 4 Completed: AI Conversational Core (2026-07-24)

### What was accomplished
- Created [`contextService.ts`](apps/api/src/services/contextService.ts) implementing the complete 4-layer memory pipeline (Short-term buffer, Rolling Summary, Structured Memories, and `pgvector` HNSW Cosine Similarity search over `message_embeddings`).
- Attached `bot.on("message:text")` text listener in [`bot.ts`](apps/api/src/bot.ts) to intercept incoming Telegram messages, store messages in Postgres, call Gemini `gemini-2.0-flash`, persist AI responses, deliver replies via Grammy, and trigger background memory extraction.
- Recorded decisions for memory pipeline layering and non-blocking background memory extractions in `decision.md`, and updated `flow.md`.
- Verified 0 type errors (`pnpm typecheck`) and successful monorepo production build (`pnpm build`).

### Why this mattered
Completes the core conversational loop of Murmur: Telegram messages now trigger multi-layered context retrieval and Gemini responses, laying the groundwork for scheduled daily cron automations in Slice 5.

---

## Entry 6 — Slice 5 Completed: Cron Automations & Background Scheduling (2026-07-24)

### What was accomplished
- Created [`cronService.ts`](apps/api/src/services/cronService.ts) containing four background job runners:
  - `runDailyMorningJob()`: Evaluates users on the hourly tick, translates their timezone using `date-fns-tz` to detect their configured `morningHour` (default 8 AM), atomically locks via `job_runs` (`onConflictDoNothing()`), generates an actionable micro-task via Gemini, records the task into `daily_actions`, and dispatches it to Telegram.
  - `runWeeklyPlannerJob()`: Evaluates localized day and hour (Sunday 6 PM), aggregates completion stats from `daily_actions` over the past 7 days, generates an uplifting weekly summary via Gemini, stores in `weekly_summaries`, and delivers to Telegram.
  - `runMemorySummarizeJob()`: Nightly maintenance job (2 AM UTC) running rolling conversation summarization for active message threads.
  - `runEmbeddingBackfillJob()`: Nightly maintenance job (3 AM UTC) calculating and inserting 768-dim vector embeddings for any un-indexed messages.
- Registered background daemon scheduler in [`index.ts`](apps/api/src/index.ts) triggered on server startup.
- Updated `aiService.ts` to support optional completion statistics for weekly summaries and graceful error fallbacks.
- Verified timezone offsets, `job_runs` idempotency guard, full monorepo typecheck (`npx pnpm typecheck`), and production build (`npx pnpm build`).
- Synchronized `decision.md`, `flow.md`, and `/docs` knowledge graph (`Current Status.md`, `Roadmap.md`, `Scheduling.md`).

### Why this mattered
Murmur is no longer a purely reactive chatbot; it now actively reaches out to users each morning with focused action tasks and every Sunday with celebrating reflections, without requiring Redis or extra infrastructure.

---

## Entry 7 — Slice 6 Completed: Web Dashboard Workspace & Realtime Sync (2026-07-24)

### What was accomplished
- Implemented the complete Web Dashboard single-page application ([`apps/web`](apps/web)) across 6 core views:
  - **Landing / Auth (`/`)**: Product philosophy introduction, tabbed Email/Password signup/login, and Instant Demo session fallback.
  - **User Onboarding (`/onboarding`)**: Profile customization (name, IANA timezone selector), and Telegram bot deep link card.
  - **Main Dashboard (`/dashboard`)**: Today's primary action card with agency-reinforcing checkbox completion toggle, recent action history with status filters (All, Pending, Done), and instant custom action creation.
  - **Conversations Archive (`/conversations`)**: Chat transcript viewer with distinct user/assistant visual speech bubbles, search filter, live synchronization status, and direct web chat prompt input.
  - **Weekly Insights (`/insights`)**: Interactive 7-day activity completion chart rendered via `Recharts`, Sunday report archive, and PostgreSQL `user_memories` KV bank cards.
  - **Settings (`/settings`)**: Delivery schedule configuration (morning action delivery hour, evening reflection target), assistant tone selector (Friendly, Direct, Encouraging), timezone picker, and Telegram bot linking management with Sonner toast feedback.
- Configured TanStack Query (`@tanstack/react-query`) server state management with optimistic cache invalidation.
- Attached Supabase Realtime channel listeners ([`realtime.ts`](apps/web/src/lib/realtime.ts)) to `messages` and `daily_actions`, automatically re-fetching canonical data when Telegram or cron jobs create or update records.
- Built supporting Express 5 backend endpoints ([`apps/api/src/routes`](apps/api/src/routes)):
  - `GET /me/profile`, `PATCH /me/profile`: User profile, preferences, and Telegram link status.
  - `GET /me/actions`, `POST /me/actions`, `PATCH /me/actions/:id`, `POST /me/actions/:id/complete`: Action management.
  - `GET /me/messages`, `POST /me/messages`: Message history and in-dashboard Gemini conversational AI prompting.
  - `GET /me/summaries`: Weekly Sunday reports retrieval.
  - `GET /me/memories`: Structured memory facts retrieval.
- Verified 0 type errors across all packages (`npx pnpm typecheck`) and full production build (`npx pnpm build`).
- Synchronized `/docs` (`Current Status.md`, `Roadmap.md`), `decision.md`, and `flow.md`.

### Why this mattered
Murmur now provides a complete, modern visual workspace alongside its Telegram interface. Users can inspect their entire conversational memory, track their daily progress, analyze weekly momentum, and adjust assistant behavior seamlessly in real time.






