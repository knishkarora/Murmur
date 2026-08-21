# UI System

The user interface of Murmur ([`apps/web`](../apps/web)) is built as a single-page application (SPA) focused on clarity, responsiveness, and agency-reinforcing feedback.

---

## Technical Stack

We use modern React libraries to ensure accessibility, ease of customization, and responsive styling:

| Layer | Dependency | Purpose |
|-------|------------|---------|
| **Bundler & Dev Server** | `Vite 6` | Instant reload and fast ES Module builds |
| **Framework** | `React 19` | Client render loop |
| **Styling** | `Tailwind CSS 4` | Utility classes and variable styling |
| **Primitives** | `shadcn/ui` (Radix UI) | Semantic, accessible UI blocks (modals, tooltips, cards) |
| **Icons** | `lucide-react` | Unified SVG iconography |
| **Router** | `React Router 7` | Declarative client routing |
| **Server State** | `TanStack Query v5` | Query caching, optimistic updates, loading boundaries |
| **UI State** | `Zustand` | Global layout settings (sidebar toggle, dark mode, filter inputs) |
| **Forms** | `react-hook-form` + `@hookform/resolvers/zod` | Client form validation matching package schemas |
| **Charts** | `Recharts` | Analytics on daily completions |
| **Toasts** | `sonner` | Toast feedback notifications |

---

## Dashboard Pages

The client application exposes 6 primary view routes:

| Route Path | View Page Name | Key Features |
|------------|----------------|--------------|
| `/` | **Landing / Login** | Product hook introduction, email-password signup/login forms. |
| `/onboarding` | **User Onboarding** | Profile details (name, segment), timezone picker, Telegram link deep link. |
| `/dashboard` | **Main Workspace** | Daily action task checkoff card, completion trackers, recent achievements. |
| `/conversations` | **Chat Archive** | Filterable list of all daily bot conversation histories and transcripts. |
| `/insights` | **Weekly Insights** | Memory timelines, weekly plan archives, progress overviews. |
| `/settings` | **Account Settings** | Notification hours (morning/evening), IANA timezone changer, assistant tone. |

---

## State Management Architecture

To keep frontend logic clean, state is separated into three distinct boundaries:
1. **Server State (TanStack Query):** All fetched data (profile, message lists, actions) is managed by TanStack. We use global queries with defined `staleTime` caches (e.g. conversations: 30s; profile: 5m) to avoid redundant requests.
2. **Client UI State (Zustand):** Local interactive parameters (such as whether a sidebar is collapsed, search filter terms, active tooltips) are managed in lightweight Zustand stores.
3. **Authentication State (Supabase Client):** Session data (active JWT token, session status, user object) is handled directly by `supabase.auth`.

---

## Realtime Live Synchronization

To show chatbot responses immediately on the dashboard without requiring manual refreshes:
1. The web client initializes a Supabase Realtime channel subscription targeting the `messages` table filtered by the current `userId`.
2. When the backend service role writes a new message row (incoming from user or outgoing from Gemini), the Realtime engine pushes a websocket update containing the new row to the browser.
3. TanStack Query invalidates the relevant queries (`['conversations', currentConversationId]`), triggering a clean re-fetch of the visual dialogue.

---

## Design Principles

- **Agency-Focused Copy:** The UI replaces guilt-inducing mechanics (like streak counters, missed-day warnings, or alarm notifications) with agency-maximizing indicators (like checkboxes that can be completed at any point, warm celebratory toast alerts, and small incremental visual graphs).
- **Mobile First Responsive Layouts:** Since users access the dashboard on mobile devices as well as desktops, pages utilize flex grids, collapsible drawer navigation, and scroll containers.
- **Premium Aesthetics:** We use tailored, premium, dark-mode-first color palettes (e.g., sleek HSL tailored neutrals, soft glassmorphism, clean cards, and smooth micro-animations).

---

## Related Docs
- [[Architecture]]
- [[Authentication]]
- [[Folder Structure]]
