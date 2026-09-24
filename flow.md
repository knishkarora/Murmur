# Execution Flow Documentation

This document tracks execution flows across application boundaries in Murmur.

---

## 1. Telegram Deep-Link Account Linking Flow

### Entry Point
- User clicks "Connect Telegram" in React frontend -> `POST /me/telegram/link` (Express API).

### Execution Sequence
1. **[web] Client Request:** React Dashboard -> `POST /me/telegram/link` with `Authorization: Bearer <Supabase_JWT>`.
2. **[api] Auth Middleware ([`auth.ts`](apps/api/src/middleware/auth.ts)):** Verifies JWT using Supabase public key / client verification. Attaches `req.userId`.
3. **[api] Route Handler ([`routes/telegram.ts`](apps/api/src/routes/telegram.ts)):**
   - Generates random 16-byte hex token (`rawToken`).
   - Hashes `rawToken` with SHA-256 (`tokenHash`).
   - Inserts record into `link_tokens` table with `userId`, `tokenHash`, and 15-minute `expiresAt`.
   - Returns `{ url: "https://t.me/<TELEGRAM_BOT_USERNAME>?start=link_<RAW_TOKEN>", expiresAt }`.
4. **[telegram] Telegram App Launch:** User opens deep link -> Telegram sends `/start link_<RAW_TOKEN>` command to Telegram Bot API.
5. **[api] Webhook Ingestion ([`routes/telegram.ts`](apps/api/src/routes/telegram.ts)):**
   - Telegram Bot API delivers webhook payload to `POST /webhooks/telegram`.
   - Header check: `X-Telegram-Bot-Api-Secret-Token` matched against `env.TELEGRAM_WEBHOOK_SECRET`.
   - Idempotency check: `update_id` recorded in `webhook_events` table (discards duplicate updates).
   - Grammy `webhookCallback` delegates update processing to bot handler.
6. **[api] Bot Command Handler ([`bot.ts`](apps/api/src/bot.ts)):**
   - Extracts `link_<RAW_TOKEN>` from `ctx.match`.
   - Hashes `rawToken` with SHA-256 to compute `tokenHash`.
   - Queries `link_tokens` table for matching unused, unexpired token.
   - Upserts record in `telegram_accounts` linking `userId` to `telegramUserId` and `chatId`.
   - Marks `link_tokens.usedAt = now()`.
   - Updates `profiles.onboardingDone = true`.
   - Replies to Telegram user via `ctx.reply("🎉 Account successfully linked!...")`.

### Modified Scope (Slice 3)
- `[NEW]` [`apps/api/src/bot.ts`](apps/api/src/bot.ts): Grammy Bot instance & `/start` handler.
- `[NEW]` [`apps/api/src/routes/telegram.ts`](apps/api/src/routes/telegram.ts): `/me/telegram/link` & `/webhooks/telegram` endpoints.
- `[MODIFY]` [`apps/api/src/index.ts`](apps/api/src/index.ts): Router registration.
- `[MODIFY]` [`packages/shared/src/env.ts`](packages/shared/src/env.ts): Added `TELEGRAM_BOT_USERNAME`.

### Cross-Boundary Data Transformations
- **Raw Token -> Hash:** `rawToken` (sent in URL parameter to Telegram client) is converted via `SHA-256` hex encoding before database insertion and matching.
- **Telegram BigInt IDs:** `ctx.from.id` and `ctx.chat.id` (numbers in JS runtime) mapped to `bigint` columns in `telegram_accounts`.

---

## 2. Telegram Message Ingestion & 4-Layer Context Assembly Flow

### Entry Point
- Telegram user sends text message to Telegram Bot -> Delivered via `POST /webhooks/telegram` to `bot.on("message:text")` ([`bot.ts`](apps/api/src/bot.ts)).

### Execution Sequence
1. **[api] User Lookup:** `bot.on("message:text")` queries `telegram_accounts` to map `ctx.from.id` to `userId`.
2. **[api] Message Persistence:** Inserts message into `messages` table (`role: 'user'`).
3. **[api] Async Vector Embedding:** `storeMessageEmbedding` generates a 768-dim vector via Gemini `text-embedding-004` and inserts into `message_embeddings`.
4. **[api] 4-Layer Context Assembly ([`contextService.ts`](apps/api/src/services/contextService.ts)):**
   - **Layer 1:** Fetches last 20 messages from `messages` table.
   - **Layer 2:** Fetches `profiles.conversationSummary`.
   - **Layer 3:** Fetches `user_memories` KV fact rows.
   - **Layer 4:** Generates query vector for user prompt and performs `pgvector` HNSW cosine distance search (`<=>`) over `message_embeddings` for top 5 closest past messages.
5. **[api] Gemini Generation ([`aiService.ts`](apps/api/src/services/aiService.ts)):**
   - Passes assembled prompt context to Gemini `gemini-2.0-flash`.
   - Post-slices response text to <= 4096 chars (Telegram max length).
6. **[api] Assistant Message Persistence & Delivery:**
   - Saves assistant reply to `messages` table (`role: 'assistant'`).
   - Delivers reply to Telegram user via `ctx.reply()`.
7. **[api] Background Memory Extraction:**
   - Asynchronously runs `triggerMemoryExtractionAndSummary`: parses facts into `user_memories` and updates `profiles.conversationSummary`.

### Modified Scope (Slice 4)
- `[NEW]` [`apps/api/src/services/contextService.ts`](apps/api/src/services/contextService.ts): 4-layer context memory assembly, pgvector cosine queries, and background memory extract trigger.
- `[MODIFY]` [`apps/api/src/bot.ts`](apps/api/src/bot.ts): Added `bot.on("message:text")` listener wiring memory assembly and AI generation to Telegram replies.

---

## 3. Scheduled Background Cron Automations Flow

### Entry Points
- `node-cron` daemon triggers:
  - Hourly at `:00` (`0 * * * *`): Evaluates `runDailyMorningJob()` and `runWeeklyPlannerJob()`.
  - Nightly at `02:00 UTC` (`0 2 * * *`): Evaluates `runMemorySummarizeJob()`.
  - Nightly at `03:00 UTC` (`0 3 * * *`): Evaluates `runEmbeddingBackfillJob()`.

### Execution Sequences

#### A. Daily Morning Action Flow (`daily_morning`)
1. **[api] Scheduler Tick ([`cronService.ts`](apps/api/src/services/cronService.ts)):** Hourly runner pulls candidate users with their `profiles`, `user_preferences`, and `telegram_accounts`.
2. **[api] Timezone Evaluation:** Uses `toZonedTime(now, timezone)` and `formatInTimeZone` to resolve localized hour and `YYYY-MM-DD` date string. Filters for users where `localHour === morningHour` (default 8 AM).
3. **[db] Idempotency Lock:** Executes `INSERT INTO job_runs (job_type, user_id, run_date) VALUES ('daily_morning', userId, localDateStr) ON CONFLICT DO NOTHING RETURNING id;`. If conflict occurs (already executed today), runner aborts execution for this user.
4. **[api] AI Context Assembly & Generation:** Calls `assembleUserContext(userId, "What should I do today?")` and generates action recommendation using `generateDailyAction()`.
5. **[db] Persistence:** Inserts generated action into `daily_actions` (`status: 'pending'`, `scheduledFor: now`).
6. **[telegram] Message Dispatch:** Sends recommendation to user's Telegram chat via `bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' })` with plain text fallback on markdown parsing error.

#### B. Weekly Planner & Summary Flow (`weekly_planner`)
1. **[api] Timezone & Day Evaluation:** Checks if `localDay === weeklyDay` (Sunday = 0) and `localHour === 18` (6 PM).
2. **[db] Idempotency Lock:** Inserts record into `job_runs` with `job_type = 'weekly_planner'` and `run_date = localDateStr`. Skips if conflict.
3. **[db] Stats Compilation:** Queries `daily_actions` for user in the past 7 days to calculate total and completed micro-tasks.
4. **[api] AI Summary Generation:** Invokes `generateWeeklySummary(context, statsSummary)` with Gemini `gemini-2.0-flash`.
5. **[db] Persistence:** Inserts record into `weekly_summaries` (`weekStart`, `content`).
6. **[telegram] Message Dispatch:** Delivers Sunday summary report via `bot.api.sendMessage(chatId, markdownSummary)`.

#### C. Nightly Maintenance Flows
1. **Memory Summarization (`memory_summarize` at 2 AM UTC):** Queries distinct users from `messages` and invokes `triggerMemoryExtractionAndSummary(userId)` to refresh rolling summaries.
2. **Embedding Backfill (`embedding_backfill` at 3 AM UTC):** Queries messages lacking embeddings (`LEFT JOIN message_embeddings WHERE id IS NULL LIMIT 50`), calculates 768-dim embeddings via `embedText()`, and inserts into `message_embeddings`.

### Modified Scope (Slice 5)
- `[NEW]` [`apps/api/src/services/cronService.ts`](apps/api/src/services/cronService.ts): Cron runner implementations and `initScheduler()`.
- `[MODIFY]` [`apps/api/src/services/aiService.ts`](apps/api/src/services/aiService.ts): Graceful fallback wrappers and weekly statistics support for `generateWeeklySummary`.
- `[MODIFY]` [`apps/api/src/index.ts`](apps/api/src/index.ts): Scheduler daemon initialization on API server startup.

### Cross-Boundary Data Transformations
- **Timezone Offsets:** Date timestamps converted from UTC system clock to user local hour integers (`0-23`) and date keys (`YYYY-MM-DD`) via `date-fns-tz`.
- **Completion Stats Aggregation:** Array of `daily_actions` mapped to Markdown bullet list passed directly into Gemini generation prompt.

---

## 4. Web Dashboard Workspace Execution & Realtime Live Synchronization Flow

### Entry Points
- **Client Route Navigation:** Browser hits `/` (Landing), `/onboarding` (Setup), `/dashboard` (Workspace), `/conversations` (Chat), `/insights` (Analytics), or `/settings` (Preferences).
- **Interactive User Mutation:** Check off daily action, create focus task, send chat prompt, or update notification schedule.

### Execution Sequences

#### A. Authentication & Workspace Protection
1. **[web] Session Evaluation ([`authContext.tsx`](apps/web/src/lib/authContext.tsx)):** Reads `murmur_demo_token` from localStorage or evaluates `supabase.auth.getSession()`.
2. **[web] Guard Check ([`ProtectedRoute.tsx`](apps/web/src/components/ProtectedRoute.tsx)):**
   - If unauthenticated -> Redirects to `/`.
   - If authenticated but `profile.onboardingDone === false` and not on `/onboarding` -> Redirects to `/onboarding`.
   - If onboarded -> Renders target view wrapped in `Layout`.

#### B. Data Hydration & Server State Management
1. **[web] API Dispatch ([`api.ts`](apps/web/src/lib/api.ts)):** Attaches `Authorization: Bearer <token>` and proxies requests through Vite `/api` to Express backend.
2. **[api] Authenticated Query Execution:**
   - `GET /me/profile`: Resolves combined `profiles`, `user_preferences`, and `telegram_accounts` link status.
   - `GET /me/actions`: Returns 50 most recent micro-actions ordered by `scheduledFor desc`.
   - `GET /me/messages`: Returns historical chat transcript for conversational display.
   - `GET /me/summaries`: Returns Sunday Markdown summaries.
   - `GET /me/memories`: Returns Gemini-extracted KV fact cards.
3. **[web] React Query Cache ([`queries.ts`](apps/web/src/lib/queries.ts)):** Caches results in TanStack Query with configured `staleTime`.

#### C. Realtime Live Synchronization Loop
1. **[web] Channel Attachment ([`realtime.ts`](apps/web/src/lib/realtime.ts)):** Attaches Supabase Realtime channel listeners to Postgres changes on `messages` and `daily_actions` filtered by `user_id=eq.${userId}`.
2. **[api / telegram] Background Row Write:** When Grammy bot receives a Telegram message or cron runner inserts a daily action:
3. **[supabase] Event Broadcast:** Supabase Realtime engine pushes websocket delta event to client.
4. **[web] Cache Invalidation:** `queryClient.invalidateQueries({ queryKey: ['messages'] })` or `queryKey: ['actions']` fires, immediately refreshing the UI without manual page reloads.

#### D. In-Dashboard Web Chat Mutation
1. **[web] User Submits Chat Input ([`ConversationsPage.tsx`](apps/web/src/pages/ConversationsPage.tsx)):** Calls `useSendMessage` -> `POST /me/messages`.
2. **[api] Conversational Pipeline ([`conversations.ts`](apps/api/src/routes/conversations.ts)):**
   - Persists user message row and initiates background vector embedding.
   - Executes 4-layer context memory assembly (`assembleUserContext`).
   - Invokes Gemini `generateReply` with prompt.
   - Persists assistant reply row and starts background memory extraction (`triggerMemoryExtractionAndSummary`).
   - Returns `{ userMessage, assistantMessage }` immediately to web client.

### Modified Scope (Slice 6)
- `[NEW]` [`apps/api/src/routes/profile.ts`](apps/api/src/routes/profile.ts): Combined profile, preferences, and telegram status.
- `[NEW]` [`apps/api/src/routes/actions.ts`](apps/api/src/routes/actions.ts): Daily action creation, listing, and toggle completion.
- `[NEW]` [`apps/api/src/routes/conversations.ts`](apps/api/src/routes/conversations.ts): Chat message retrieval and web prompting.
- `[NEW]` [`apps/api/src/routes/summaries.ts`](apps/api/src/routes/summaries.ts): Sunday summary reports retrieval.
- `[NEW]` [`apps/api/src/routes/memories.ts`](apps/api/src/routes/memories.ts): Structured memory facts retrieval.
- `[MODIFY]` [`apps/api/src/index.ts`](apps/api/src/index.ts): Router registrations.
- `[NEW]` [`apps/web/src/lib/api.ts`](apps/web/src/lib/api.ts), [`authContext.tsx`](apps/web/src/lib/authContext.tsx), [`realtime.ts`](apps/web/src/lib/realtime.ts), [`queries.ts`](apps/web/src/lib/queries.ts).
- `[NEW]` [`apps/web/src/components/Layout.tsx`](apps/web/src/components/Layout.tsx), [`ProtectedRoute.tsx`](apps/web/src/components/ProtectedRoute.tsx).
- `[NEW]` [`apps/web/src/pages/LandingPage.tsx`](apps/web/src/pages/LandingPage.tsx), [`OnboardingPage.tsx`](apps/web/src/pages/OnboardingPage.tsx), [`DashboardPage.tsx`](apps/web/src/pages/DashboardPage.tsx), [`ConversationsPage.tsx`](apps/web/src/pages/ConversationsPage.tsx), [`InsightsPage.tsx`](apps/web/src/pages/InsightsPage.tsx), [`SettingsPage.tsx`](apps/web/src/pages/SettingsPage.tsx).
- `[MODIFY]` [`apps/web/src/App.tsx`](apps/web/src/App.tsx), [`vite.config.ts`](apps/web/vite.config.ts), [`index.css`](apps/web/src/index.css).

### Cross-Boundary Data Transformations
- **Auth Token Propagation:** Supabase Auth JWT / local demo token passed via `Authorization: Bearer <token>` on all API requests.
- **7-Day Chart Bucket Aggregation:** Array of `daily_actions` reduced into day-name buckets (`Sun-Sat`) and counted for Recharts visualization.



