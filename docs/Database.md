# Database

PostgreSQL hosted on **Supabase** with **pgvector** extension.

## Extensions
- `vector` (pgvector) — semantic search on message embeddings
- `gen_random_uuid()` — primary keys

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile: name, timezone, onboarding stage, conversation_summary |
| `telegram_accounts` | Maps Supabase user ↔ Telegram chat_id |
| `user_preferences` | Reminder windows, tone, frequency |
| `user_memories` | Structured long-term facts (key/value) |
| `conversations` | Logical threads (daily, weekly, ad-hoc) |
| `messages` | All messages: role, content, timestamps |
| `message_embeddings` | vector(768) per message chunk |
| `daily_actions` | Generated recommendations + status |
| `weekly_summaries` | Weekly summary content |
| `job_runs` | Cron idempotency log |
| `webhook_events` | Telegram update_id dedup |
| `link_tokens` | Pending Telegram link tokens |

## Row Level Security
All user-facing tables: `auth.uid() = user_id`.

Service role key used **only** on `apps/api` for webhook and cron paths.

## ORM
**Drizzle ORM** — schema in `apps/api/src/db/schema.ts`, migrations via Drizzle Kit.

## Indexes
- `messages(user_id, created_at DESC)`
- `message_embeddings` — HNSW on vector column
- `daily_actions(user_id, scheduled_for)`
- `job_runs(job_type, user_id, run_date)` — UNIQUE

## Related Docs
- [[Architecture]]
- [[Authentication]]
- [[AI and Memory]]
- [[APIs]]
