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
- **One file per route** in `apps/web/src/pages/`
- **Services, not fat controllers** in `apps/api/src/services/`
- **All shared validation** lives in `packages/shared/src/schemas/`
- **SQL migrations** in `apps/api/drizzle/` (Drizzle Kit output)

## Related Docs
- [[Architecture]]
- [[UI System]]
- [[APIs]]
- [[Database]]
