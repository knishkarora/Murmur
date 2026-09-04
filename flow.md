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

