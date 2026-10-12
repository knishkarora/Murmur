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

## Render Free Tier & Pre-Warming via GitHub Actions

Murmur's backend runs on **Render** (Free Tier Web Service), which spins down after 15 minutes of inactivity to save compute.
To ensure the backend is awake when scheduled `node-cron` routines fire:
1. **GitHub Actions Scheduled Workflow:** [`.github/workflows/wake-render.yml`](../.github/workflows/wake-render.yml) runs automatically:
   - **10:50 AM IST** (`20 5 * * *` UTC) — 10 minutes prior to the 11:00 AM daily morning action.
   - **07:50 PM IST** (`20 14 * * *` UTC) — 10 minutes prior to the 08:00 PM evening reflection.
   - **05:50 PM IST Sundays** (`20 12 * * 0` UTC) — 10 minutes prior to the 06:00 PM weekly planner.
2. **Cold-Boot Retry Loop:** The workflow pings `GET /health?format=text` with a 60-second timeout and automatic retries. When Render boots from cold sleep (~40s), the workflow catches it and exits with code 0 once `200 OK` is returned.
3. **Compute Efficiency:** The instance stays awake for ~15–20 minutes around scheduled delivery windows and sleeps during idle hours, consuming only ~15–20 hours of Render compute per month out of the 750 free hours.
4. **GitHub Actions Free Quota:** 2 runs/day consume ~60–65 minutes per month (~3% of the 2,000 free monthly minutes).

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
