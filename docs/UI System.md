# UI System

Frontend design system for `apps/web`.

## Stack
| Layer | Library |
|-------|---------|
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (Radix primitives) |
| Icons | lucide-react |
| Charts | Recharts |
| Toasts | sonner |
| Forms | react-hook-form + Zod resolver |

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing + login/register |
| `/onboarding` | Profile setup + Telegram connect |
| `/dashboard` | Progress overview, current goals |
| `/conversations` | Message history + search |
| `/insights` | Weekly summaries + memory timeline |
| `/settings` | Reminder windows, preferences |

## State Management
- **Server state:** TanStack Query (all API/Supabase data)
- **Client UI state:** Zustand (sidebar, filters only)
- **Auth session:** Supabase client

## Realtime
Subscribe to `messages` table inserts via Supabase Realtime for live conversation updates.

## Design Principles
- Agency-focused copy (no guilt, no streaks)
- Progress cards over complex charts where possible
- Mobile-responsive (Tailwind breakpoints)

## Related Docs
- [[Architecture]]
- [[Authentication]]
- [[Folder Structure]]
