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
- **One file per route** in [apps/web/src/pages/](file:///e:/Projects/tasks/Murmur/apps/web/src/pages)
- **Services, not fat controllers** in [apps/api/src/services/](file:///e:/Projects/tasks/Murmur/apps/api/src/services)
- **All shared validation** lives in [packages/shared/src/schemas/](file:///e:/Projects/tasks/Murmur/packages/shared/src/schemas)
- **SQL migrations** in [apps/api/drizzle/](file:///e:/Projects/tasks/Murmur/apps/api/drizzle) (Drizzle Kit output)

## Core Project Reference

- **Agent Rules:** [AGENT.md](file:///e:/Projects/tasks/Murmur/AGENT.md)
- **Journey Diary:** [JOURNEY.md](file:///e:/Projects/tasks/Murmur/JOURNEY.md)
- **Root Configuration:**
  - [package.json](file:///e:/Projects/tasks/Murmur/package.json)
  - [pnpm-workspace.yaml](file:///e:/Projects/tasks/Murmur/pnpm-workspace.yaml)
  - [turbo.json](file:///e:/Projects/tasks/Murmur/turbo.json)
- **Web App (Vite/React):** [apps/web](file:///e:/Projects/tasks/Murmur/apps/web)
  - App Entry: [main.tsx](file:///e:/Projects/tasks/Murmur/apps/web/src/main.tsx)
  - Core Component: [App.tsx](file:///e:/Projects/tasks/Murmur/apps/web/src/App.tsx)
  - CSS Styles: [index.css](file:///e:/Projects/tasks/Murmur/apps/web/src/index.css)
- **API Server (Express):** [apps/api](file:///e:/Projects/tasks/Murmur/apps/api)
  - Server Entry: [index.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/index.ts)
  - Config: [config.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/config.ts)
  - DB Schema: [schema.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/db/schema.ts)
  - DB Connection: [index.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/db/index.ts)
  - Auth Middleware: [auth.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/middleware/auth.ts)
  - Error Middleware: [errorHandler.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/middleware/errorHandler.ts)
  - AI Service: [aiService.ts](file:///e:/Projects/tasks/Murmur/apps/api/src/services/aiService.ts)
- **Shared Package:** [packages/shared](file:///e:/Projects/tasks/Murmur/packages/shared)
  - Env Validator: [env.ts](file:///e:/Projects/tasks/Murmur/packages/shared/src/env.ts)
  - Schemas Index: [schemas/index.ts](file:///e:/Projects/tasks/Murmur/packages/shared/src/schemas/index.ts)
  - Prompts Index: [prompts/index.ts](file:///e:/Projects/tasks/Murmur/packages/shared/src/prompts/index.ts)

## Related Docs
- [[Architecture]]
- [[UI System]]
- [[APIs]]
- [[Database]]
