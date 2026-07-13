# Project Overview

**AI Progress Companion** — an AI-powered system that helps final-year students and fresh graduates take one meaningful step forward each day.

## Problem
People feel stuck not from lack of intelligence, but from decision fatigue, mental exhaustion, and invisible progress.

## Solution
A conversational AI companion that delivers small, practical actions via **Telegram**, with a **web dashboard** for history and insights.

## Phase 1 Scope
Proof of concept targeting placement-seeking students. See [[Roadmap]] for full timeline.

## Core User Journey
1. Register on website → [[Authentication]]
2. Connect Telegram → [[Telegram Integration]]
3. Receive daily guidance via bot
4. Review progress on dashboard → [[UI System]]
5. Weekly summaries every Sunday → [[Scheduling]]

## Tech Stack Summary
| Layer | Choice |
|-------|--------|
| Frontend | React 19, Vite, Tailwind, shadcn/ui |
| Backend | Node.js, Express 5 |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth |
| AI | Google Gemini |
| Messaging | Telegram (Grammy) |
| Monorepo | pnpm + Turborepo |

## Related Docs
- [[Architecture]]
- [[Folder Structure]]
- [[Decisions]]
- [[Current Status]]
- [[Roadmap]]
