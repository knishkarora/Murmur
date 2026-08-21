# APIs

REST API specifications for Murmur's Express application (`apps/api`). 

- **Base URL:** `VITE_API_URL` (Local: `http://localhost:3001` | Production: `https://api.yourdomain.com`)
- **Format:** All requests and responses are JSON, except for binary/webhook payloads where specified.
- **Request Validation:** Validated using `Zod` schemas defined in [`schemas/index.ts`](../packages/shared/src/schemas/index.ts).
- **Authentication:** Authenticated requests require an `Authorization: Bearer <supabase_jwt>` header.

---

## Route Groups

### 1. Public Routes
Used for server health checking and external webhook inputs.

| Method | Route | Description | Payload Schema | Response Schema |
|--------|-------|-------------|----------------|-----------------|
| `GET` | `/health` | Render health check | None | `{ "status": "ok" }` |
| `POST` | `/webhooks/telegram` | Grammy bot webhook handler | Telegram Update | Void |

#### Telegram Webhook
- **Headers:** Must include `X-Telegram-Bot-Api-Secret-Token` matching the configured webhook secret.
- **Handler:** Forwards update payload to the Grammy instance for execution.

---

### 2. Authenticated Profile & Preferences
All routes below require a valid Supabase client JWT token.

| Method | Route | Description | Payload Schema | Response Schema |
|--------|-------|-------------|----------------|-----------------|
| `GET` | `/me` | Retrieve profile and user preferences | None | Combined Profile + Preferences JSON |
| `PATCH` | `/me/profile` | Update profile fields (e.g. name, tz) | Partial `profileSchema` | Updated `Profile` |
| `PATCH` | `/me/preferences` | Update communication preferences | Partial `userPreferencesSchema` | Updated `UserPreferences` |
| `POST` | `/me/telegram/link` | Generate deep link link-token for bot | None | `linkTokenResponseSchema` |

#### Telegram Link Generation (`POST /me/telegram/link`)
- **Process:** Generates a short-lived link token with a 15-minute TTL, inserts it into `link_tokens` and returns a Telegram deep link formatting: `t.me/YourBot?start=link_TOKEN`.
- **Zod Response:**
  ```json
  {
    "url": "https://t.me/YourBot?start=link_TOKEN",
    "expiresAt": "2026-07-21T14:15:00.000Z"
  }
  ```

---

### 3. Authenticated Core Features
Manage user conversation history, summaries, actions, and memories.

| Method | Route | Description | Payload Schema | Response Schema |
|--------|-------|-------------|----------------|-----------------|
| `GET` | `/me/conversations` | List conversation threads | Query: `limit`, `offset` | List of Conversations |
| `GET` | `/me/conversations/:id` | Fetch message history in a thread | Query: `limit`, `offset` | Array of `Message` |
| `GET` | `/me/summaries` | List weekly summaries | None | Array of Weekly Summaries |
| `GET` | `/me/actions` | List daily actions | Query: `scheduled_for` | Array of `DailyAction` |
| `POST` | `/me/actions/:id/complete` | Mark a daily action as done | None | Updated `DailyAction` |
| `GET` | `/me/memories` | List structured long-term facts | None | List of Memory Key-Values |

---

## Hybrid Data Access Pattern

To minimize server workload and database round-trips, the application adopts a hybrid access model:
- **Direct reads from web client:** The frontend connects directly to Supabase with the client SDK to fetch `messages` (and subscribe to realtime updates), read `weekly_summaries`, and load `daily_actions`. This uses Supabase Row-Level Security (RLS) to enforce data privacy.
- **API writes & proxy operations:** Writing data, initiating Telegram linking, and triggering LLM workflows are routed through the Express API server (`apps/api`) so that database transactions are executed securely by the service role client.

---

## Error Handling

All Express endpoints respond with a consistent error structure in the event of failure.

```json
{
  "error": "Detailed description of the error",
  "code": "ERROR_CODE"
}
```

### Standard Error Codes
- `UNAUTHORIZED`: Provided token was missing, invalid, or expired.
- `VALIDATION_ERROR`: Zod validation failed (the response will include an additional `details` array containing path and error rules).
- `NOT_FOUND`: Target resource was not found.
- `CONFLICT`: Duplicate run attempt or key constraint violation.
- `INTERNAL_SERVER_ERROR`: Fallback generic server error.

---

## Related Docs
- [[Authentication]]
- [[Telegram Integration]]
- [[Database]]
