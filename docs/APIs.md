# APIs

Express REST API at `apps/api`. Base URL: `VITE_API_URL` (e.g. `http://localhost:3001`).

## Public Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Render health check |
| POST | `/webhooks/telegram` | Grammy webhook handler |

## Authenticated Routes

All require `Authorization: Bearer <supabase_jwt>`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Current user profile + preferences |
| PATCH | `/me/profile` | Update profile fields |
| PATCH | `/me/preferences` | Reminder windows, tone |
| POST | `/me/telegram/link` | Generate Telegram deep link token |
| GET | `/me/conversations` | List conversation threads |
| GET | `/me/conversations/:id` | Messages in a thread |
| GET | `/me/summaries` | Weekly summaries |
| GET | `/me/actions` | Daily actions list |
| GET | `/me/memories` | Structured AI memories |
| POST | `/me/actions/:id/complete` | Mark action as done |

## Direct Supabase Reads (web, RLS)
These bypass the Express API — web reads directly from Supabase:
- `messages` (with Realtime subscription)
- `weekly_summaries`
- `daily_actions` (read-only)

Document any new endpoint here before implementing.

## Error Format
```json
{ "error": "Human-readable message", "code": "ERROR_CODE" }
```

## Validation
All request bodies validated with **Zod** schemas from `packages/shared`.

## Related Docs
- [[Authentication]]
- [[Telegram Integration]]
- [[Database]]
