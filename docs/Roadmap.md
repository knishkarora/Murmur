# Roadmap

Milestones for Murmur's implementation path.

---

## Phase 1 — Proof of Concept (Current Phase)

### Milestone 1: Foundations & Setup
- [x] Establish documentation workspace & architectural wiki graph
- [x] Configure `.agents/` operational rules (`AGENT.md`) & `JOURNEY.md`
- [ ] Scaffold the monorepo structure (`pnpm` + `Turborepo` workspaces)
- [ ] Initialize Supabase Postgres project, enable extensions (`pgvector`), and apply Drizzle schema migration
- [ ] Build basic user authentication APIs (JWT validations and middleware)

### Milestone 2: Telegram Account Connection
- [ ] Implement short-lived link token generator route (`POST /me/telegram/link`)
- [ ] Setup Grammy bot webhook endpoints and header verification middleware
- [ ] Develop `/start link_TOKEN` bot command handler to store account links in the database
- [ ] Verify message ingestion database writes and webhook idempotency guards

### Milestone 3: AI Conversational Core
- [ ] Construct the 4-layer context memory assembly pipeline
- [ ] Program semantic vector query routines on database utilizing `pgvector` HNSW indexes
- [ ] Implement Gemini service prompts and request wrappers (`gemini-2.0-flash`)
- [ ] Establish message write triggers (realtime updates pipeline integration)

### Milestone 4: Cron Automations
- [ ] Set up Express `node-cron` daemon process and timezone lookup queries
- [ ] Write morning job runner (`daily_morning`): pulls active timezone users and generates daily action items
- [ ] Write summary job runner (`weekly_planner`): compiles completion stats and creates Sunday reports
- [ ] Write database cleanup tasks (`memory_summarize` and `embedding_backfill`)

### Milestone 5: Web Dashboard Workspace
- [ ] Build React pages (Landing, Onboarding details, Main Dashboard, Chat Archive, Settings)
- [ ] Integrate TanStack Query server state hydration
- [ ] Connect Supabase Realtime client message subscriptions for chat updates
- [ ] Render analytics logs utilizing Recharts

### Milestone 6: Deployment & Launch
- [ ] Configure Vercel static deployments for `apps/web`
- [ ] Deploy persistent Express server to Render
- [ ] Register Telegram webhooks and verify end-to-end user loops

---

## Phase 2 — Production Launch & Expansion (Future)

- **Alternative Interfaces:** WhatsApp and SMS integration.
- **Audience Scope:** Dedicated channels for corporate team planners.
- **Feature Enhancements:** Curated career database updates, automated job match alerts.
- **Monetization:** Subscription tiers and payment processors integration.

---

## Related Docs
- [[Current Status]]
- [[Decisions]]
- [[Project Overview]]
