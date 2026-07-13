# Architecture

High-level system design for Phase 1.

## System Diagram

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│  Web App    │────▶│  Express    │────▶│  Supabase        │
│  (Vercel)   │     │  API        │     │  PostgreSQL      │
│  apps/web   │     │  (Render)   │     │  + pgvector      │
└──────┬──────┘     └──────┬──────┘     │  + Realtime      │
       │                   │            └──────────────────┘
       │ direct RLS reads  │                      ▲
       └───────────────────┼──────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌────▼────┐  ┌───▼────┐
         │ Gemini  │  │Telegram │  │ node-  │
         │   API   │  │  Bot    │  │ cron   │
         └─────────┘  └─────────┘  └────────┘
```

## Monorepo Layout
| Package | Deploy | Responsibility |
|---------|--------|----------------|
| `apps/web` | Vercel | Dashboard, auth UI, Realtime subscriptions |
| `apps/api` | Render | REST API, Telegram webhook, cron jobs |
| `packages/shared` | — | Zod schemas, types, prompt templates |

## Data Flow Patterns

### Telegram message (inbound)
1. Telegram → `POST /webhooks/telegram` ([[Telegram Integration]])
2. Dedup via `webhook_events.update_id`
3. Load user context ([[AI and Memory]])
4. Gemini generates reply
5. Store in `messages` → Realtime pushes to dashboard

### Dashboard read (hybrid)
- **Reads:** Web app → Supabase client with RLS (conversations, summaries)
- **Writes involving AI/Telegram:** Web → Express API → service role

## Why Render for API
Telegram webhooks and `node-cron` require a persistent Node process. Vercel serverless cannot host in-process cron.

## Related Docs
- [[Folder Structure]]
- [[Database]]
- [[APIs]]
- [[Authentication]]
- [[Scheduling]]
- [[AI and Memory]]
