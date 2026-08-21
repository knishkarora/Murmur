# Authentication

**Supabase Auth** for Phase 1.

## Flow

### Registration / Login (web)
1. User submits email + password on [`apps/web`](../apps/web)
2. `@supabase/supabase-js` calls `signUp` / `signInWithPassword`
3. Session stored in browser; JWT available via `supabase.auth.getSession()`

### API requests (web → api)
1. Web sends `Authorization: Bearer <access_token>`
2. [`apps/api`](../apps/api) middleware [`auth.ts`](../apps/api/src/middleware/auth.ts) calls `supabase.auth.getUser(token)`
3. Attaches `userId` to request context

### Telegram linking
Telegram users are **not** authenticated via Supabase directly. Instead:
1. Authenticated web user requests link token → [[Telegram Integration]]
2. Bot `/start link_TOKEN` binds `telegram_user_id` to Supabase `user_id`

## Security Rules
- `SUPABASE_ANON_KEY` — web only (public, RLS-protected)
- `SUPABASE_SERVICE_ROLE_KEY` — api only (bypasses RLS; never expose to frontend)
- All dashboard reads go through RLS policies on [[Database]]

## Related Docs
- [[Architecture]]
- [[Telegram Integration]]
- [[APIs]]
