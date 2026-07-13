# Decisions

Architecture Decision Records (ADRs) for Phase 1.

## ADR-001: Monorepo with Turborepo
**Choice:** pnpm workspaces + Turborepo (`apps/web`, `apps/api`, `packages/shared`)
**Why:** Shared Zod schemas prevent type drift; parallel dev; portfolio-quality structure.

## ADR-002: Gemini as Primary AI
**Choice:** Google Gemini (`gemini-2.0-flash`)
**Why:** Generous free tier; sufficient for conversational POC; user preference.

## ADR-003: Supabase Auth (not Clerk)
**Choice:** Supabase Auth integrated with PostgreSQL
**Why:** Single platform; RLS; lower cost; no separate auth vendor.

## ADR-004: Grammy for Telegram
**Choice:** Grammy SDK over raw fetch
**Why:** TypeScript-first middleware; less webhook boilerplate.

## ADR-005: Drizzle ORM
**Choice:** Drizzle over raw Supabase client for server queries
**Why:** Type-safe migrations; explicit schema; easier complex queries.

## ADR-006: 4-Layer AI Memory
**Choice:** Recent messages + summary + structured facts + pgvector semantic recall
**Why:** Continuity without sending full history; no LangChain complexity.

## ADR-007: Render for API (not Vercel)
**Choice:** Express on Render; React on Vercel
**Why:** Persistent process needed for webhooks + cron.

## ADR-008: Evening Reflection Deferred
**Choice:** Skip `daily_evening` cron in Phase 1
**Why:** YAGNI — not required to prove core loop.

## ADR-009: Library Stack over Native-First
**Choice:** shadcn, TanStack Query, Recharts, Zod, etc.
**Why:** User preference — reduce hand-written boilerplate; libraries are deliberately adopted per [[Project Overview]].

## Related Docs
- [[Architecture]]
- [[Project Overview]]
- [[Roadmap]]
