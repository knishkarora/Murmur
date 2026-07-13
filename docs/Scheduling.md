# Scheduling

Cron jobs via **node-cron** in `apps/api/src/jobs/`.

## Jobs (Phase 1)

| Job | Schedule | Action |
|-----|----------|--------|
| `daily_morning` | User pref hour (default 8 AM local) | Generate + send daily action |
| `weekly_planner` | Sunday 6 PM local | Generate weekly summary + plan |
| `memory_summarize` | Nightly 2 AM | Update rolling summaries |
| `embedding_backfill` | Nightly 3 AM | Embed unprocessed messages |

## Deferred
- `daily_evening` reflection — build only when explicitly requested

## Timezone Handling
- Store IANA timezone (e.g. `Asia/Kolkata`) in `user_preferences`
- Cron runs every hour; queries users whose local hour matches target
- Uses **date-fns-tz** for conversions

## Idempotency
`job_runs` table with UNIQUE constraint on `(job_type, user_id, run_date)`.
Insert before sending; skip if conflict.

## Related Docs
- [[AI and Memory]]
- [[Telegram Integration]]
- [[Database]]
