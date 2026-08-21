# Folder Structure

```
companion/
├── AGENT.md                    # Agent behavioral rules
├── JOURNEY.md                  # Development diary
├── docs/                       # Knowledge base (this directory)
├── apps/
│   ├── web/                    # React dashboard (Vite)
│   │   ├── src/
│   │   │   ├── pages/          # Route-level components
│   │   │   ├── components/     # UI components (shadcn + custom)
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   └── lib/            # supabase client, api helpers
│   │   ├── index.html
│   │   └── package.json
│   └── api/                    # Express server
│       ├── src/
│       │   ├── routes/         # Express routers
│       │   ├── services/       # ai, telegram, memory
│       │   ├── jobs/           # Cron scheduler
│       │   ├── middleware/     # Auth, error handling
│       │   └── index.ts        # Entry point
│       └── package.json
├── packages/
│   └── shared/                 # Cross-app shared code
│       ├── src/
│       │   ├── schemas/        # Zod schemas
│       │   ├── types/          # TypeScript types
│       │   ├── prompts/        # AI prompt templates
│       │   └── env.ts          # Env validation
│       └── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                # Root scripts
└── .env.example
```

## Conventions
- **One file per route** in [`apps/web/src/pages/`](../apps/web/src/pages)
- **Services, not fat controllers** in [`apps/api/src/services/`](../apps/api/src/services)
- **All shared validation** lives in [`packages/shared/src/schemas/`](../packages/shared/src/schemas)
- **SQL migrations** in [`apps/api/drizzle/`](../apps/api/drizzle) (Drizzle Kit output)

## Core Project Reference

- **Agent Rules:** [`AGENT.md`](../AGENT.md)
- **Journey Diary:** [`JOURNEY.md`](../JOURNEY.md)
- **Root Configuration:**
  - [`package.json`](../package.json)
  - [`pnpm-workspace.yaml`](../pnpm-workspace.yaml)
  - [`turbo.json`](../turbo.json)
- **Web App (Vite/React):** [`apps/web`](../apps/web)
  - App Entry: [`main.tsx`](../apps/web/src/main.tsx)
  - Core Component: [`App.tsx`](../apps/web/src/App.tsx)
  - CSS Styles: [`index.css`](../apps/web/src/index.css)
- **API Server (Express):** [`apps/api`](../apps/api)
  - Server Entry: [`index.ts`](../apps/api/src/index.ts)
  - Config: [`config.ts`](../apps/api/src/config.ts)
  - DB Schema: [`schema.ts`](../apps/api/src/db/schema.ts)
  - DB Connection: [`index.ts`](../apps/api/src/db/index.ts)
  - Auth Middleware: [`auth.ts`](../apps/api/src/middleware/auth.ts)
  - Error Middleware: [`errorHandler.ts`](../apps/api/src/middleware/errorHandler.ts)
  - AI Service: [`aiService.ts`](../apps/api/src/services/aiService.ts)
- **Shared Package:** [`packages/shared`](../packages/shared)
  - Env Validator: [`env.ts`](../packages/shared/src/env.ts)
  - Schemas Index: [`schemas/index.ts`](../packages/shared/src/schemas/index.ts)
  - Prompts Index: [`prompts/index.ts`](../packages/shared/src/prompts/index.ts)

## Related Docs
- [[Architecture]]
- [[UI System]]
- [[APIs]]
- [[Database]]
