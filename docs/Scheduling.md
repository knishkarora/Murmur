# Scheduling

Murmur runs scheduled background cron processes using **node-cron** within the persistent backend environment ([`apps/api`](../apps/api), [`cronService.ts`](../apps/api/src/services/cronService.ts)).

---

## Job Schedules

The background worker schedules several recurring jobs:

| Job Name | Trigger Frequency | Scope / Logic | Status |
|----------|-------------------|---------------|--------|
| `daily_morning` | Every Hour (00 min) | Queries users whose current timezone local time is between **8 AM and 9 AM** (default or preferred hour) and generates a daily action task. | **Active** |
| `daily_evening` | Every Hour (00 min) | Queries users with `eveningNotificationEnabled: true` whose preferred evening hour matches the current local hour, generating a gentle reflection prompt. | **Active (Opt-in)** |
| `weekly_planner` | Every Hour (00 min) | Runs on Sundays. Queries users whose current timezone local time is **6 PM** and generates a weekly summary + upcoming plan. | **Active** |
| `memory_summarize` | Nightly at 2 AM UTC | Aggregates user logs and generates the updated conversation rolling summary. | **Active** |
| `embedding_backfill` | Nightly at 3 AM UTC | Runs vector calculations on any unprocessed database messages. | **Active** |

---

## Render Free Tier & Pre-Warming Strategy

Render's free tier spins down instances after **15 minutes** of inactivity. Because background `node-cron` timers are frozen while an instance sleeps:
1. **Pre-Warming Wakeup:** An external pinger (e.g., [Cron-job.org](https://cron-job.org) or UptimeRobot) can ping `GET /health` or `GET /api/health` ~10 minutes prior to a scheduled hour (e.g., at 7:50 AM for an 8:00 AM delivery). This ensures the instance is warm and `node-cron` fires right on the hour.
2. **Alternative Keep-Alive:** Pinging `/health` every 10–14 minutes keeps the free tier instance awake 24/7 without consuming API quota.

## Timezone Translation & Evaluation

Since users live in different timezones (e.g. `Asia/Kolkata`, `America/New_York`), a standard single-time cron run does not work.

### Execution Pattern:
1. The Express server registers a cron task executing **every hour** (e.g. `0 * * * *`).
2. Upon execution, the worker:
   - Gets the current UTC timestamp.
   - Runs a query checking user profiles/preferences to calculate their current local time hour using `date-fns-tz`.
   - Filters users whose local hour matches the target execution hour (e.g. `8` for morning notifications).
3. Executes operations strictly for the matching user cohort.

---

## Idempotency & Fail-Safe Mechanics

To prevent duplicate alerts if the backend restarts or experiences network retries, we use the database `job_runs` table as a locking mechanism.

### The Locking Flow:
1. Before pushing a Telegram message or triggering an LLM generation, the scheduler attempts to insert a record into `job_runs`:
   ```sql
   INSERT INTO job_runs (job_type, user_id, run_date)
   VALUES ('daily_morning', 'user-uuid', '2026-07-21');
   ```
2. **Unique Index Guard:** The `job_runs` table contains a unique index on `(job_type, user_id, run_date)`.
3. **Outcome:**
   - If the insert succeeds: The job has not run yet. Execute the action and send the message.
   - If the insert fails (violates unique constraint): The job already ran for this user today. Silently skip execution.

---

## Related Docs
- [[Database]]
- [[Telegram Integration]]
- [[AI and Memory]]
