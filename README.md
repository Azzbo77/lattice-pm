# ◈ Lattice PM

A self-hosted, browser-based project management tool built for small engineering and operations teams. Written in TypeScript and React, it runs as a Docker container and connects to a PocketBase backend — no cloud subscription, no per-seat fees.

Teams using Lattice can track tasks, manage suppliers and bill of materials, monitor delivery schedules, post team announcements, and get a daily project briefing — all in one place. It is designed around the reality that engineering work involves procurement, dependencies, and people with different levels of system access, not just a to-do list.

---

## Features

- **🏠 Dashboard** — Daily briefing: overdue tasks, delivery alerts, project progress and team workload. Clickable stat cards navigate to the relevant section.
- **📅 Timeline (Gantt)** — Project-focused Gantt with SVG dependency arrows. Select any project to focus, toggle overlapping projects, click any bar to edit.
- **✅ Tasks** — Create, assign and track tasks with status, priority, dates, project tagging and dependency linking. Blocked indicators when prerequisites are incomplete. CSV export respects the active filter.
- **🗂️ Projects** — Colour-coded projects with progress bars and per-project stats.
- **📦 Suppliers & Orders** — Collapsible supplier cards with parts catalogue and order tracking. Archive/delete suppliers. Filter by Active / Archived / Overdue.
- **🔩 BOM** — Bill of Materials linked to tasks and projects. Usage status, quantities, engineering notes, and alert indicators for delayed parts and overdue linked tasks.
- **👥 Team** — Role-based access. Add, edit and remove members. Password show/hide, strength meter, auto-generate and force-reset.
- **📋 Noticeboard** — Team announcements with markdown, pins, expiry dates and `@mention` notifications.
- **🔔 Notifications** — In-app alerts for overdue tasks, upcoming deadlines, blocked dependencies and `@mentions`.
- **🔍 Global Search** — Search across tasks, projects, suppliers, parts, orders, BOM notes and team members.
- **📊 Weekly Summary** — Role-filtered report. Copy as plain text or export as a standalone HTML file.
- **📱 PWA** — Installable on mobile and desktop, offline-capable, with an update banner.
- **❓ Onboarding Guide** — Slide-in guide covering all features in dependency order.

---

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full access — manage users, projects, tasks, suppliers, BOM, announcements |
| **Manager** | Manage tasks, suppliers, parts, orders and BOM — cannot manage users |
| **Office** | Manage tasks and view all data — no supplier or BOM editing |
| **Shopfloor** | View and update own assigned tasks only |

All roles can read and post announcements on the Noticeboard.

---

## Getting Started

### With Docker (recommended)

```bash
git clone https://github.com/Azzbo77/lattice-pm.git
cd lattice-pm

# Development
docker compose up --build

# Production (Pi or server)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

App runs at `http://localhost:8080`, PocketBase admin at `http://localhost:8090/_/`.

Follow **[POCKETBASE_SETUP.md](POCKETBASE_SETUP.md)** to import the bundled schema and create your first user.

### Without Docker

```bash
git clone https://github.com/Azzbo77/lattice-pm.git
cd lattice-pm
npm install
cp .env.local.example .env.local
```

Download and run PocketBase separately (see [POCKETBASE_SETUP.md](POCKETBASE_SETUP.md)), then:

```bash
npm start        # Development — http://localhost:3000
npm run build    # Production build → /dist
```

### Further reading

- [POCKETBASE_SETUP.md](POCKETBASE_SETUP.md) — collection setup, API rules and first-user guide
- [DEPLOYMENT.md](DEPLOYMENT.md) — Docker, nginx and Pi deployment reference
- [CLOUDFLARE_TUNNEL.md](CLOUDFLARE_TUNNEL.md) — expose Lattice via your domain using Cloudflare Tunnel

---

## Testing

Tests use **Vitest** and **React Testing Library**. Vitest is configured in `vitest.config.ts` and is separate from the Vite build config so it does not affect production builds.

```bash
npm test                # Run all tests once
npm run test:watch      # Watch mode — reruns on file save
npm run test:coverage   # Coverage report → /coverage/index.html
```

### What's covered

| Suite | Covers |
|-------|--------|
| `dateHelpers.test.ts` | All 7 date/time utility functions |
| `csvExport.test.ts` | CSV formatting, comma/quote escaping, header row |
| `password.test.ts` | `isHashed`, `hashPassword`, `verifyPassword`, `ensureHashed` |
| `usePagination.test.ts` | Page navigation, boundary clamping, reset on filter change |
| `useSearch.test.ts` | All result types, role scoping, email matching, case insensitivity |
| `AppContext.test.tsx` | Context shape, role flag derivation, sub-context composition |

---

## Project Structure

```
├── pb_migrations/
│   └── 1_initial_schema.json  # All 8 collections with fields and API rules
│                              #   import via PocketBase Settings → Import collections
│
├── public/
│   ├── sw.js                  # Service worker — caching strategies
│   ├── manifest.json          # PWA manifest
│   ├── icon-192.png
│   ├── icon-512.png
│   └── screenshots/           # PWA store screenshots
│
├── index.html                 # Vite app entry point (project root)
│
└── src/
    ├── App.tsx                # Layout shell, tab routing, modal rendering, error boundaries
    ├── index.tsx              # React root + crypto.randomUUID polyfill
    ├── types.ts               # All domain interfaces and types
    │
    ├── lib/
    │   ├── pb.ts              # PocketBase client singleton
    │   └── db.ts              # Typed data layer — CRUD + realtime subscriptions
    │
    ├── context/
    │   ├── AppContext.tsx          # Thin composition layer — merges all sub-contexts,
    │   │                          #   exposes single useApp() hook (no logic lives here)
    │   ├── AuthContext.tsx         # Session, login/logout, password reset, role flags
    │   ├── DataContext.tsx         # Data state, all CRUD handlers, realtime subscriptions
    │   ├── UIContext.tsx           # Tab, filters, modal state, confirm dialogs
    │   ├── NotificationsContext.tsx# Task overdue/due-soon + @mention notifications
    │   └── ToastContext.tsx        # Toast notification system — showToast(message, type)
    │
    ├── hooks/
    │   ├── useBreakpoint.ts   # Responsive breakpoint detection
    │   ├── usePagination.ts   # Generic pagination — resets to page 1 on filter change
    │   ├── useSearch.ts       # Global search — tasks, projects, suppliers, parts, BOM, team
    │   ├── useSession.ts      # Session persistence helpers
    │   └── useStorage.ts      # Local storage abstraction
    │
    ├── utils/
    │   ├── csvExport.ts       # CSV string builder + browser download trigger
    │   ├── dateHelpers.ts     # Date formatting, arithmetic, relative time
    │   └── password.ts        # bcrypt hashing, strength checking, legacy fallback
    │
    ├── test/
    │   ├── setup.ts                # Vitest + jest-dom global setup
    │   ├── dateHelpers.test.ts
    │   ├── csvExport.test.ts
    │   ├── password.test.ts
    │   ├── usePagination.test.ts
    │   ├── useSearch.test.ts
    │   └── AppContext.test.tsx
    │
    ├── constants/
    │   ├── theme.ts           # Design tokens — colours, spacing, typography, radii
    │   └── seeds.ts           # ROLES, colour maps, BOM status meta
    │
    ├── components/
    │   ├── ui/index.tsx       # Shared primitives — Btn, TH, TD, Pager, ConfirmModal, etc.
    │   ├── ErrorBoundary.tsx  # Catches render errors — full panel or inline strip
    │   ├── Sidebar.tsx        # Desktop nav + mobile bottom tab bar + More sheet
    │   ├── SearchBar.tsx
    │   └── NotificationBell.tsx
    │
    ├── modals/
    │   ├── TaskModal.tsx
    │   ├── ProjectModal.tsx
    │   ├── SupplierModals.tsx
    │   ├── BomModal.tsx
    │   ├── MemberModal.tsx
    │   ├── WeeklySummaryModal.tsx
    │   └── GuidePanel.tsx     # Onboarding guide + APP_VERSION constant
    │
    └── pages/
        ├── AuthScreens.tsx
        ├── DashboardPage.tsx
        ├── GanttPage.tsx
        ├── TasksPage.tsx      # Mobile cards + desktop table, paginated 25/page
        ├── ProjectsPage.tsx
        ├── SuppliersPage.tsx  # Paginated 10/page, supplier email field
        ├── BomPage.tsx        # Mobile cards + desktop table, paginated 20/page
        ├── TeamPage.tsx
        └── Noticeboard.tsx
```

---

## Changelog

### v4.9 — Error Handling & Resilience
- `ErrorBoundary` component added — wraps page content (label adapts to current tab) and modals (inline strip) in `App.tsx`; a crash in one section no longer takes down the whole app
- `ToastContext` added — lightweight toast notification system; `showToast(message, type)` available anywhere via `useToast()`; toasts auto-dismiss after 4 seconds, stack in the bottom-right corner
- All CRUD operations in `DataContext` now have `try/catch` wired to `showToast` — users see feedback for every save and delete, and a clear error message if an operation fails
- `alert()` calls removed from `removeMember` — 403 and unknown errors now surface as toasts
- `ToastProvider` added as outermost wrapper in `AppContext` so the data layer can call `showToast` at any point
- `APP_VERSION` bumped to `v4.9` in UI

### v4.8 — Mobile Polish
- `TasksPage` — full mobile card layout alongside desktop table; no horizontal scroll on mobile
- `DashboardPage` — task rows in overdue/due-soon/in-progress sections wrap correctly on narrow screens
- `useSearch` — supplier search now matches on `email` field

### v4.7 — Pagination
- `usePagination` hook — generic, resets to page 1 when source list changes
- `Pager` component — record range, prev/next, numbered buttons with ellipsis
- Tasks paginated 25/page, BOM 20/page, Suppliers 10/page

### v4.6 — AppContext Refactor & Logout Fix
- `AppContext` split into `AuthContext`, `DataContext`, `UIContext`, `NotificationsContext` — thin composition layer; all `useApp()` calls unchanged
- Logout bug fixed — switching users no longer briefly flashes previous user's data

### v4.5 — Mobile Tab Bar & Onboarding
- Mobile tab bar reordered — Noticeboard promoted to primary 5; BOM, Projects, Team in More sheet
- BOM mobile card layout; Suppliers sub-table min-width reduced
- Onboarding Guide updated — Noticeboard step, PocketBase backup step, Shopfloor role rename

### v4.4 — Noticeboard & @Mentions
- Noticeboard page — pinned section, chronological feed, markdown, expiry dates
- `@mention` autocomplete with cyan highlighting; tagged users notified in bell
- Realtime subscription — new posts appear instantly across all sessions

### v4.3 — Vite Migration
- CRA + CRACO replaced with Vite 5; build output `/build` → `/dist`; env vars `REACT_APP_*` → `VITE_*`

### v4.0–4.2 — PocketBase Backend
- Full PocketBase integration: typed data layer (`db.ts`), realtime subscriptions, session via `pb.authStore`
- Schema exported to `pb_migrations/1_initial_schema.json`; cascade deletes; all collection/field bugs fixed
- Deployment docs: `DEPLOYMENT.md`, `POCKETBASE_SETUP.md`, Docker + nginx + Pi setup

### v3.x — Polish & PWA
PWA (service worker, installable), onboarding guide, session persistence, bcrypt passwords, WCAG AA accessibility, React.memo performance pass, theme design tokens.

### v1.x–2.x — Foundation
BOM ↔ Task bridging, task dependencies + Gantt arrows, Suppliers, TypeScript strict mode, Dashboard, mobile layout, timestamps, Weekly Summary, global search, CSV export, modular refactor.

---

## Roadmap

### ✅ Complete
- Core feature set (Tasks, Projects, Suppliers, BOM, Team, Noticeboard, Gantt, Dashboard)
- PocketBase backend, realtime subscriptions, Docker deployment
- Mobile responsive layouts, PWA
- AppContext refactor, pagination, error boundaries, toast notifications
- Test coverage — Vitest + React Testing Library

### Remaining
- **Reporting & exports** — PDF/HTML dashboards, burn-down charts, supplier performance metrics
- **Dependency auto-scheduling** — critical-path hints on the Gantt
- **Inventory lite** — stock levels and minimum reorder quantity alerts
- **CSV/Trello/Jira import** — import existing projects without manual re-entry
- **Security hardening** — CSP headers via nginx, security header audit, optional 2FA
- **Demo video** — Loom walkthrough pinned to the README
- **Multi-project portfolio view** — cross-project Gantt and resource view

---

## Screenshots

### Dashboard
![Dashboard](public/screenshots/dashboard.png)

### Timeline
![Timeline](public/screenshots/timeline.png)

### Tasks
![Tasks](public/screenshots/tasks.png)

### Projects
![Projects](public/screenshots/projects.png)

### Suppliers
![Suppliers](public/screenshots/suppliers.png)

### BOM
![BOM](public/screenshots/bom.png)

### Team
![Team](public/screenshots/team.png)

### Noticeboard
![Noticeboard](public/screenshots/noticeboard.png)

---

## Built With

- [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- [PocketBase 0.23](https://pocketbase.io/) — self-hosted backend, auth and realtime
- TypeScript 4.9.5
- Google Fonts — Playfair Display + IBM Plex Sans
- [Docker](https://www.docker.com/) + nginx — containerised deployment

---

## Licence

[MIT](https://opensource.org/licenses/MIT)
