# AI and Memory

Gemini-powered conversational AI with 4-layer memory.

## Model
- **Primary:** `gemini-2.0-flash` (all Phase 1 tasks)
- **Embeddings:** `text-embedding-004`

## Memory Layers

| Layer | Source | Purpose |
|-------|--------|---------|
| 1 — Short-term | Last 20 `messages` | Immediate conversation context |
| 2 — Rolling summary | `profiles.conversation_summary` | Token-efficient history |
| 3 — Structured facts | `user_memories` rows | Goals, preferences, completed actions |
| 4 — Semantic recall | `message_embeddings` + pgvector | Relevant past messages by similarity |

## Context Assembly Flow
1. Query last 20 messages for user
2. Load conversation_summary from profile
3. Load all user_memories as bullet list
4. Embed current user message → pgvector top-5 similar messages
5. Concatenate with system prompt from `packages/shared/prompts/`
6. Call Gemini → store reply in `messages`
7. Every ~10 messages: update rolling summary
8. Every ~5 exchanges: extract new facts → `user_memories`

## Prompt Files (`packages/shared/src/prompts/`)
- `system.ts` — Core persona (agency, no guilt, small actions)
- `daily-action.ts` — One daily recommendation
- `weekly-summary.ts` — Progress-over-perfection summary
- `memory-extract.ts` — Structured JSON fact extraction
- `career-tip.ts` — Contextual career guidance

## Guardrails
- Zod-parse all structured outputs; retry once on failure
- 15s timeout on Gemini calls
- Truncate replies to 4096 chars (Telegram limit)
- System prompt refuses sensitive financial data

## Related Docs
- [[Database]]
- [[Telegram Integration]]
- [[Scheduling]]
- [[Decisions]]
