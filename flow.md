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
