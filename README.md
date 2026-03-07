# ◈ Lattice PM

A modular React project management tool for engineering and operations teams.

---

## Features

- **🏠 Dashboard** — Daily briefing: overdue tasks, delivery alerts, project progress, team workload. Clickable stat cards navigate to the relevant section.
- **📅 Timeline (Gantt)** — Project-focused Gantt. Select any project to focus, toggle "show overlapping projects" to see other timelines dimmed behind it. Date axis auto-scales, click any bar to edit the task. SVG dependency arrows between linked tasks.
- **✅ Tasks** — Create, assign, and track tasks with status, priority, dates, project tagging, and dependency linking. Blocked indicators when prerequisites are incomplete. CSV export respects active filter.
- **🗂️ Projects** — Colour-coded projects with progress bars and per-project stats.
- **📦 Suppliers & Orders** — Collapsible supplier cards with parts catalogue and order tracking. Archive/delete suppliers. Filter by Active / Archived / Overdue.
- **🔩 BOM** — Bill of Materials linked to tasks and projects. Usage status, quantities, engineering/CI notes. Alert indicators for delayed parts and overdue linked tasks. Filter by status or task/project.
- **👥 Team** — Role-based access. Add, edit, remove members. Password show/hide, strength meter, auto-generate, force-reset.
- **🔔 Notifications** — In-app alerts for overdue tasks, upcoming deadlines, and tasks blocked by overdue dependencies.
- **💾 Backup & Restore** — Full JSON export/import with browser storage meter and drag-and-drop restore.
- **🔍 Global Search** — Search across tasks, projects, suppliers, parts, orders, BOM notes, and team members.
- **📊 Weekly Summary** — Role-filtered report. Copy as plain text or export as a standalone HTML file. Three views: Worker (personal jobs), Manager (project snapshot + deliveries), Admin (adds team workload + supplier chase list + BOM attention items).

---

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full access — manage users, projects, tasks, suppliers, BOM |
| **Manager** | Manage tasks, suppliers, BOM — cannot manage users |
| **Worker** | View and update own assigned tasks only |

---

## Demo Accounts

_Demo accounts are created by the seed script — see scripts/seed.ts._

---

## Getting Started

```bash
git clone https://github.com/Azzbo77/lattice-pm.git
cd lattice-pm
npm install
npm start
```

Opens at [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # Production build → /build
```

---

## Project Structure

```
src/
├── App.tsx                    # Thin orchestrator — layout, tab routing, modal rendering
├── index.tsx
├── types.ts                   # All domain interfaces and types
├── react-app-env.d.ts
│
├── context/
│   └── AppContext.tsx         # Single source of truth — all state + handlers
│
├── hooks/
│   ├── useStorage.ts          # localStorage abstraction with Dispatch<SetStateAction<T>>
│   ├── useSearch.ts           # Global search engine
│   ├── useBreakpoint.ts       # Responsive breakpoint detection
│   └── useSession.ts          # Session token — create, read, write, clear, expiry helpers
│
├── utils/
│   ├── csvExport.ts
│   ├── dateHelpers.ts
│   └── password.ts            # bcryptjs helpers — hashPassword, verifyPassword, isHashed
│
├── constants/
│   ├── theme.ts               # Design tokens — all colours, spacing, typography, radii
│   └── seeds.ts               # ROLES, color maps, BOM status meta, demo seed data
│
├── components/
│   ├── ui/index.tsx           # Shared primitives — Btn, TH, TD, Overlay, Avatar, etc.
│   ├── Sidebar.tsx
│   ├── SearchBar.tsx
│   └── NotificationBell.tsx
│
├── modals/
│   ├── TaskModal.tsx
│   ├── ProjectModal.tsx
│   ├── SupplierModals.tsx
│   ├── BomModal.tsx
│   ├── MemberModal.tsx
│   ├── BackupModal.tsx
│   ├── WeeklySummaryModal.tsx
│   └── GuidePanel.tsx          # Onboarding guide + APP_VERSION constant
│
└── pages/
    ├── AuthScreens.tsx
    ├── DashboardPage.tsx
    ├── GanttPage.tsx
    ├── TasksPage.tsx
    ├── ProjectsPage.tsx
    ├── SuppliersPage.tsx
    ├── BomPage.tsx
    └── TeamPage.tsx
```

---

## Changelog

### v4.1 — PocketBase Integration
- **`src/lib/pb.ts`** — PocketBase client singleton; reads `REACT_APP_PB_URL`; `autoCancellation(false)` prevents request conflicts during rapid state updates
- **`src/lib/db.ts`** — full typed data layer (345 lines): mapper functions for all 6 collections, CRUD functions for every entity, `subscribeToCollection` wrapper returning unsubscribe functions
- **`src/context/AppContext.tsx`** — fully rewritten: all handlers async, `useStorage`/localStorage removed, initial `loadAll()` via `Promise.all`, 7 realtime subscriptions (one per collection), `loading` state exposed, session rehydration via `pb.authStore`
- **`src/pages/AuthScreens.tsx`** — `login` made async with submitting state; "Signing in…" label during request
- **`scripts/seed.ts`** — creates a single admin account (`admin@lattice.dev`); skips if already exists; prints login credentials on completion
- **All modal/page call sites** — handler calls wrapped in `async () =>` where needed; `BackupModal.handleFile` made async
- **`App.tsx`** — loading spinner shown while initial data fetch completes
- **`.gitignore`** — `pb_data/` and `.env.*` files excluded
- **`.env.development` / `.env.production`** — see DEPLOYMENT.md for values
- **Note:** `useStorage`, `useSession`, and `password.ts` are now unused — they will be removed in v4.2 cleanup

### v4.0 — PocketBase Schema & Deployment Docs
- **`pb_migrations/1_initial_schema.json`** — full schema for all 6 collections: projects, tasks, suppliers, parts, orders, bom; includes field types, relation constraints (cascade deletes where appropriate), and row-level security rules per role
- **`DEPLOYMENT.md`** — complete setup guide for Windows dev and Pi prod: PocketBase download, first-run, admin account, migrations, nginx config with SSE support for realtime, deploy workflow, troubleshooting
- **Row-level security:** shopfloor can only update their own assigned tasks; office can manage tasks; managers can manage tasks, suppliers, parts, orders and BOM; admins have full access including team management
- **Self-referencing relation:** `tasks.dependsOn` references the tasks collection itself (maxSelect: 999)
- **Cascade deletes:** parts cascade from suppliers; orders cascade from suppliers; bom entries cascade from suppliers and parts

### v3.7 — PWA Support
- **`public/manifest.json`** — app identity, icons, `standalone` display mode, shortcuts to Dashboard and Tasks
- **`public/sw.js`** — service worker with three caching strategies: network-first for HTML navigation (picks up new deploys promptly), cache-first for JS/CSS/images (fast loads), network-only for `/pb/` and `/api/` routes (never serves stale data); clears old caches on activate
- **`public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`** — generated PWA icons matching the ◈ Lattice brand mark
- **`src/serviceWorkerRegistration.ts`** — registers `sw.js` in production only; fires `onUpdate` callback when a new version is installed
- **`index.html`** — full PWA meta tags: `theme-color`, apple-mobile-web-app tags, manifest link, apple-touch-icon
- **`src/index.tsx`** — calls `serviceWorkerRegistration.register()`
- **Update banner** — when a new build is deployed, a "New version available → Refresh" toast appears at the bottom of the screen; dismissible without refreshing
- **Note:** SW only activates in production builds (`npm run build`). `npm start` skips registration intentionally.

### v3.6 — Onboarding Guide & Version Number
- **`src/modals/GuidePanel.tsx`** — new slide-in onboarding guide covering all 9 features: Team, Projects, Suppliers, BOM, Tasks, Timeline, Dashboard, Weekly Summary, Backup
- **Guide panel** — opens from a `?` button in the topbar (desktop and mobile); backdrop click or ✕ closes it; pill nav to jump between topics; numbered steps per topic; tip block per topic; Back/Next/Done footer navigation; app remains visible behind the panel
- **`APP_VERSION`** — exported from `GuidePanel.tsx`; displayed as a small badge next to the page title in the topbar (desktop) and next to the Lattice logo (mobile)

### v3.5 — Session Persistence & Expiry
- **`src/hooks/useSession.ts`** — new session utility: `createSession`, `readSession`, `writeSession`, `clearSession`, `refreshSession`, `sessionMinutesRemaining`; session stores `{ userId, token, expiresAt }` in localStorage with an 8-hour TTL; token generated via `crypto.randomUUID()` (native browser API, no polyfills)
- **Session rehydration** — on app mount, AppContext reads the stored session and restores `currentUser` silently; page refresh no longer logs the user out
- **`sessionReady` flag** — App.tsx waits for rehydration before rendering; prevents the login screen flashing briefly on refresh
- **Session expiry polling** — `setInterval` checks every 60 seconds; auto-logout when session expires or is cleared
- **Login writes session** — `createSession(userId)` written on every successful login
- **Logout clears session** — `clearSession()` called before nulling `currentUser`
- **Password reset refreshes token** — `completePasswordReset` issues a fresh session token after the password change
- **Force-reset invalidates session** — when an admin marks a user for password reset, their stored session is cleared so they must re-login immediately
- **Member removal invalidates session** — removing a user clears their session token

### v3.4 — Password Hashing
- **`bcryptjs`** added as a dependency (cost factor 10)
- **`@craco/craco`** added to resolve Webpack 5 / CRA Node core-module polyfill errors (`crypto`, `buffer`, `stream`, `vm` set to `false` in `craco.config.js`)
- **`craco.config.js`** — disables Node core-module polyfills; bcryptjs falls back to `Math.random`-based salt generation in browser context ⚠ acceptable for localStorage demo use, not for production auth
- **`src/utils/password.ts`** — new utility module: `hashPassword`, `verifyPassword`, `isHashed`; handles both hashed and legacy plain-text passwords during migration window
- **`AppContext.login`** — uses `verifyPassword` instead of `===`; migrates plain-text passwords to bcrypt hash on successful login
- **`AppContext.completePasswordReset`** — hashes new password before saving
- **`AppContext` startup migration** — `useEffect` on mount detects any unhashed passwords in storage and upgrades them automatically
- **`MemberModal`** — hashes password via `hashPassword` before passing to `saveMember`
- **`AuthScreens`** — demo account buttons fill email only; passwords no longer read from user state
- **`TasksPage`** — `isBlocked` and `blockedBy` wrapped in `useCallback([tasks])` to fix `react-hooks/exhaustive-deps` warnings

### v3.3 — Accessibility (WCAG AA)
- **ARIA labels** — All interactive buttons now have descriptive `aria-label` attributes for screen readers (TasksPage, ProjectsPage, TeamPage, BomPage, SuppliersPage, DashboardPage, GanttPage, AuthScreens)
- **ARIA roles** — Modals have `role="dialog"` and `aria-modal="true"`, clickable StatCards have `role="button"`, Toggle switches have `role="switch"` with `aria-checked`
- **ARIA states** — Project filter buttons use `aria-pressed`, password visibility toggle has context-aware labels
- **Keyboard navigation** — StatCards, Toggle switches, and all buttons support Enter/Space key activation
- **Focus management** — Global `:focus-visible` styles with 2px cyan ring, 2px white offset; focus tokens in `theme.ts` exported for consistency
- **Modal accessibility** — Escape key closes modals, focus restored on close
- **Reduced motion** — `prefers-reduced-motion: reduce` media query disables animations for users with motion sensitivity
- **High contrast** — `prefers-contrast: high` media query increases border visibility for accessibility
- **Result** — Full keyboard navigability, screen reader support, and automatic accessibility features across all pages and components

### v3.2 — Performance: React.memo Memoization
- **TaskRow, ProjectCard, TeamMemberCard** — All extracted and memoized to prevent unnecessary re-renders when parent state updates
- **Supplier list components** — `SupplierCard`, `PartRow`, `OrderRow` wrapped with `React.memo`
- **BomRow** — Extracted and memoized with `useMemo` for linkedTask, linkedProj, alerts data
- **useMemo audit** — All pages optimized to memoize derived data (task stats, project stats, BOM alerts, supplier summaries) to avoid recalculation on every render
- **Result** — Significant performance improvement on pages with many items (Tasks, Projects, BOM, Suppliers, Team)

### v3.1 — Table Column Alignment
- **Rule applied consistently** — text columns (title, name, description, notes) left-aligned; data columns (dates, quantities, status badges, action buttons) centred
- **TasksPage** — Due, Status, Priority, Updated, Actions all centred; header TH matches
- **BomPage** — Qty, Total, Status, Updated, Actions centred; Part No., Description, Supplier, Task, Notes remain left
- **SuppliersPage parts sub-table** — Qty and Unit centred; actions centred
- **SuppliersPage orders sub-table** — Ordered, Lead, Est. Arrival, Status, Updated, Actions all centred

### v3.0 — Theme Centralisation
- **`src/constants/theme.ts`** — new design token file: `bg` (9 background layers), `clr` (brand + text colours), `font` (11 size steps + families), `space` (spacing scale), `radius` (8 steps), `shadow`, `z` (z-index scale), plus composite helpers `cardStyle`, `inputStyle`, `rowDivider`
- **960+ replacements** across 19 source files — all magic hex values, font sizes, spacing, and border radii now reference tokens
- **`ui/index.tsx`** fully rewritten to use tokens throughout — `inp`, `selStyle`, `miniSel`, `Overlay`, `Btn`, `TH`, `TD`, `Avatar`, `UpdatedBadge`, `ConfirmModal`
- **`seeds.ts`** re-exports theme tokens so existing `import { roleColor } from "../constants/seeds"` imports continue to work
- Foundation for future light-mode — swap token values in one file to re-theme the entire app

### v2.x
| Version | What changed |
|---------|-------------|
| 2.9 | BOM ↔ Task bridging — `projectId`/`taskId` links, linked task column, alert indicators, task/project filter dropdown |
| 2.8 | Task dependencies — `dependsOn` field, searchable multi-select, Gantt SVG arrows, blocked indicators, cascade delete |
| 2.7 | Suppliers mini-epic — collapsible cards, archive/delete, page-level filters, empty states |
| 2.6 | Full TypeScript migration — `types.ts`, all 29 files converted, strict mode, `useStorage` typed |
| 2.5 | Dashboard UI polish — dropdown contrast, colorScheme dark, colour-coded selects |
| 2.4 | Mobile / responsive — bottom tab bar, sheet modals, horizontal-scroll tables |
| 2.3 | Last-updated timestamps — `updatedAt`/`updatedBy` on all entities, UpdatedBadge, Recent Activity feed |
| 2.2 | Weekly Summary generator — role-filtered report, copy text + HTML export |
| 2.1 | Project-focused Gantt — pill selector, show-all overlay, date axis, click-to-edit |
| 2.0 | Full modular refactor — context, hooks, utils, pages, modals (26 files) |

### v1.x
| Version | What changed |
|---------|-------------|
| 1.5 | Backup / restore with browser storage meter and drag-and-drop import |
| 1.4 | Global search bar across all entities |
| 1.3 | CSV export for BOM and Tasks |
| 1.2 | Dashboard home screen |
| 1.1 | Project management, password UX improvements |
| 1.0 | Initial release |

---

## Roadmap

### Phase 1 — Quick Polish & Immediate Personal Wins *(complete)*

1. **~~Last-updated timestamps~~** ✅ *(v2.3)*
2. **~~Weekly Summary generator~~** ✅ *(v2.2)*
3. **~~Mobile / responsive basics~~** ✅ *(v2.4)*
4. **~~Dashboard UI polish — contrast on dropdowns~~** ✅ *(v2.5)*

---

### Phase 2 — Core Workflow + Supplier/BOM Enhancements *(complete)*

5. **~~SuppliersPage improvements~~** ✅ *(v2.7)*
   Collapsible cards, delete/archive with confirmation, page-level Active / Archived / Overdue filter.

6. **~~Task dependencies~~** ✅ *(v2.8)*
   Searchable "Depends on" multi-select per task. Gantt dependency arrows. Blocked indicators on Dashboard and Tasks. Cascade cleanup on delete.

7. **~~BOM ↔ Task bridging~~** ✅ *(v2.9)*
   Link parts to tasks and projects. Alert indicators for delayed/unused parts and overdue linked tasks. Task/project filter on BOM page.

---

### Phase 3 — Polish & Prep *(ongoing)*

8. **~~Theme / styles centralisation~~** ✅ *(v3.0)*
   `theme.ts` defines all design tokens. 960+ magic values replaced across 19 files.

9. **~~Table column alignment audit~~** ✅ *(v3.1)*
   Full audit of Tasks, BOM, and Suppliers sub-tables. Rule: left for text/descriptions, centre for dates/badges/numbers/actions. Applied consistently across all `TH`/`TD` usages.

10. **~~TypeScript strict mode~~** ✅ *(v2.6)*
    All files migrated, strict mode enabled, `useStorage` returns proper `Dispatch<SetStateAction<T>>`.

11. **~~Auth / security basics — passwords~~** ✅ *(v3.4)*
    bcryptjs hashing on all password save paths. Startup migration hashes any plain-text passwords already in localStorage. Demo login buttons no longer expose passwords.

12. **~~Perf & reliability tweaks~~** ✅ *v3.2-v3.3*
    `React.memo` on heavy list components, `useMemo` audit, accessibility pass (keyboard nav, ARIA roles, focus trapping in modals).

---

### Phase 4 — Backend Migration *(complete)*

- **Auth** — hashed passwords (bcrypt-js), session tokens, optional Supabase Auth
- **Backend** — REST or tRPC API; PostgreSQL via Supabase or PlanetScale
- **Migration script** — export localStorage data and seed the remote database
- **Realtime** — live updates across sessions via Supabase Realtime or WebSockets

---

### Phase 5 — Production Polish *(future)*

- **PWA** — service worker, offline mode, installable on mobile and desktop
- **Reporting** — exportable PDF/Excel reports, project burn-down charts, supplier performance dashboard
- **Security audit** — input sanitisation, role enforcement review, session expiry
- **Dependency & Gantt enhancements** — critical path highlighting, milestone markers, drag-to-reschedule bars

---

## Screenshots

### Dashboard
Daily briefing with stat cards, due-this-week tasks, delivery alerts, project progress, and team workload at a glance.

![Dashboard](public/screenshots/dashboard.png)

### Timeline
Project-focused Gantt with pill selector, status breakdown (To Do, In Progress, Done, Overdue), dependency arrows, and click-to-edit task bars.

![Timeline](public/screenshots/timeline.png)

### Tasks
Create, assign, and track tasks with status, priority, dates, project tagging, dependency linking, and CSV export.

![Tasks](public/screenshots/tasks.png)

### Projects
Colour-coded project cards with progress bars, task breakdown (To Do, Active, Done, Overdue), and per-project stats.

![Projects](public/screenshots/projects.png)

### Suppliers
Collapsible supplier cards with parts catalogue, order tracking (pending, overdue badges), and archive/delete capabilities.

![Suppliers](public/screenshots/suppliers.png)

### BOM
Bill of Materials linked to tasks and projects. Usage status pills, alert indicators, task/project filter, and CSV export.

![BOM](public/screenshots/bom.png)

### Team
Role-based access control. Add, edit, or remove team members with password reset and member removal options.

![Team](public/screenshots/team.png)

---

## Built With

- [React 18](https://react.dev/) + Create React App
- TypeScript 4.9.5
- Google Fonts — Playfair Display + IBM Plex Sans

## License

MIT
