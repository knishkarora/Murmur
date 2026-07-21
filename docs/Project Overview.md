# Project Overview

**AI Progress Companion** — an AI-powered system that helps final-year students and fresh graduates take one meaningful step forward each day.

## Branding & Naming Concept

### Why "Murmur"?
The name **Murmur** is inspired by a **murmuration**—the natural phenomenon where thousands of birds fly in perfect, fluid coordination without a single leader or a master plan.

- **Local Coordination:** They do not achieve direction by looking at the whole sky; instead, each bird simply responds to the tiny movements of the few closest to it.
- **Rippling Momentum:** That single, immediate adjustment ripples through the entire flock, creating massive, beautiful momentum.

### The Murmur Philosophy
Most productivity tools fail because they demand overwhelming, massive overhauls to a user's routine. **Murmur** flips this dynamic:
- It cuts through decision fatigue by focusing entirely on the **immediate next step**.
- It is a gentle, low-friction presence designed to turn tiny daily micro-actions into massive life and career direction.

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
