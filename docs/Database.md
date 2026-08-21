# Database

PostgreSQL database hosted on **Supabase** using **Drizzle ORM** for schema declaration, type safety, and migrations.

## Extensions & RLS Defaults
- `vector` (pgvector): Enables vector data type and distance operators for semantic similarity searches on message chunks.
- `gen_random_uuid()`: Generates random UUIDv4 primary keys.

---

## Core Schema & Tables

All schemas are defined in [`schema.ts`](../apps/api/src/db/schema.ts).

### 1. `profiles`
Extends user authentication profile with basic metadata and conversation contexts.
- `id`: `uuid` (Primary Key, default: random)
- `userId`: `uuid` (Unique, foreign key to auth.users)
- `name`: `text` (Nullable)
- `timezone`: `text` (Default: `'Asia/Kolkata'`)
- `onboardingDone`: `boolean` (Default: `false`)
- `conversationSummary`: `text` (Nullable, rolling LLM-generated summary)
- `createdAt`: `timestamp with timezone` (Default: `now()`)

### 2. `telegram_accounts`
Maps registered application users to their corresponding Telegram account details.
- `id`: `uuid` (Primary Key, default: random)
- `userId`: `uuid` (Unique, links to user profiles)
- `telegramUserId`: `bigint` (Unique, Telegram identifier)
- `chatId`: `bigint` (Chat ID used to send outbound messages)
- `linkedAt`: `timestamp with timezone` (Default: `now()`)

### 3. `user_preferences`
Daily notification windows and tone presets.
- `id`: `uuid` (Primary Key, default: random)
- `userId`: `uuid` (Unique, links to user profiles)
- `morningHour`: `integer` (Default: `8`, morning notification hour)
- `eveningHour`: `integer` (Default: `20`, evening reflection hour)
- `weeklyDay`: `integer` (Default: `0` (Sunday), weekly summarization trigger day)
- `tone`: `enum` (`'friendly'`, `'direct'`, `'encouraging'`, Default: `'friendly'`)

### 4. `user_memories`
KeyValue metadata representing extracted long-term memories and facts about the user.
- `id`: `uuid` (Primary Key, default: random)
- `userId`: `uuid` (User identifier)
- `key`: `text` (Memory classification, e.g. `'goal'`, `'focus'`, `'challenge'`)
- `value`: `text` (Actual description)
- `updatedAt`: `timestamp with timezone` (Default: `now()`)
- **Index:** Unique composite index on `(user_id, key)` to upsert memories.

### 5. `conversations`
Thread identifiers partitioning user chats.
- `id`: `uuid` (Primary Key, default: random)
- `userId`: `uuid` (User identifier)
- `type`: `text` (Default: `'general'`)
- `createdAt`: `timestamp with timezone` (Default: `now()`)

### 6. `messages`
Stores actual dialogue between user, assistant, and system instructions.
- `id`: `uuid` (Primary Key, default: random)
- `userId`: `uuid` (User identifier)
- `conversationId`: `uuid` (Nullable, references conversations)
- `role`: `enum` (`'user'`, `'assistant'`, `'system'`)
- `content`: `text` (Message text)
- `createdAt`: `timestamp with timezone` (Default: `now()`)
- **Index:** Index on `(user_id, created_at DESC)` for high-performance timeline fetching.

### 7. `message_embeddings`
Stores the semantic vector array of messages for retrieval.
- `id`: `uuid` (Primary Key, default: random)
- `messageId`: `uuid` (Unique, references messages)
- `userId`: `uuid` (User identifier)
- `embedding`: `vector(768)` (Google `text-embedding-004` dimensions)
- **Index:** `HNSW` index using `vector_cosine_ops` for fast similarity searches.

### 8. `daily_actions`
Daily micro-tasks assigned to the user.
- `id`: `uuid` (Primary Key, default: random)
- `userId`: `uuid` (User identifier)
- `content`: `text` (Task details)
- `status`: `enum` (`'pending'`, `'done'`, `'skipped'`, Default: `'pending'`)
- `scheduledFor`: `timestamp with timezone`
- `createdAt`: `timestamp with timezone` (Default: `now()`)
- **Index:** Index on `(user_id, scheduled_for)` for quick job evaluations.

### 9. `weekly_summaries`
Summarized timeline reports for dashboard progress visualizers.
- `id`: `uuid` (Primary Key, default: random)
- `userId`: `uuid` (User identifier)
- `weekStart`: `timestamp with timezone`
- `content`: `text` (Markdown content summary)
- `createdAt`: `timestamp with timezone` (Default: `now()`)

### 10. `job_runs`
Cron job run tracker preventing duplicate runs on worker restarts.
- `id`: `uuid` (Primary Key, default: random)
- `jobType`: `text` (e.g. `'daily_morning'`)
- `userId`: `uuid` (User identifier)
- `runDate`: `text` (Formatted date string, e.g., `'2026-07-21'`)
- `createdAt`: `timestamp with timezone` (Default: `now()`)
- **Index:** Unique composite index on `(job_type, user_id, run_date)`.

### 11. `webhook_events`
Webhook log to prevent processing duplicate requests from Telegram Bot API.
- `updateId`: `bigint` (Primary Key, Telegram update identifier)
- `processedAt`: `timestamp with timezone` (Default: `now()`)

### 12. `link_tokens`
Short-lived linking tokens used to pair a Telegram client with a dashboard user.
- `id`: `uuid` (Primary Key, default: random)
- `userId`: `uuid` (User identifier)
- `tokenHash`: `text` (Unique token SHA-256 hash representation)
- `expiresAt`: `timestamp with timezone` (15 min TTL)
- `usedAt`: `timestamp with timezone` (Nullable)

---

## Row-Level Security (RLS) Policies

To protect database privacy, RLS is configured on all user-linked tables on Supabase:
- **Rule:** `auth.uid() = user_id` for operations executed by the web client using `anon_key` JWT session.
- **Express API Client:** Uses Supabase `service_role` client. The service role key bypasses RLS rules, allowing the backend server to link accounts, read/write message streams, insert daily cron runs, and execute semantic vectors queries.

---

## Database Migrations

Migrations are managed with Drizzle Kit.
- **Schema File:** [`schema.ts`](../apps/api/src/db/schema.ts)
- **Output Folder:** [`drizzle/`](../apps/api/drizzle)
- **Generate Migration command:** `npx drizzle-kit generate`
- **Apply Migration command:** `npx drizzle-kit migrate` or `supabase db push` (depending on local vs cloud deployment configuration).

---

## Related Docs
- [[Architecture]]
- [[Authentication]]
- [[AI and Memory]]
- [[APIs]]
