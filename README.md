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

| Name | Email | Password | Role |
|------|-------|----------|------|
| Alex Morgan | alex@company.com | admin123 | Admin |
| Jamie Chen | jamie@company.com | manager123 | Manager |
| Sam Rivera | sam@company.com | worker123 | Worker |
| Taylor Brooks | taylor@company.com | worker456 | Worker |

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
│   └── useBreakpoint.ts       # Responsive breakpoint detection
│
├── utils/
│   ├── csvExport.ts
│   └── dateHelpers.ts
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
│   └── WeeklySummaryModal.tsx
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

### v2.9 — BOM ↔ Task Bridging
- **`BomEntry.projectId` + `BomEntry.taskId`** — proper entity links added to type (legacy `project` string field retained for compatibility)
- **BomModal** — "Linked Project" and "Linked Task" dropdowns replace free-text field; task list filters to selected project; switching project clears task selection; inline task status badge shown when linked
- **BomModal alerts** — warns if linked task is overdue or if part has delayed orders at time of editing
- **BomPage — Task/Project filter** — dropdown groups tasks by project; filter by individual task, full project, or unlinked parts only
- **BomPage — Linked Task column** — shows task name (colour-coded by status) and project name; "—" for unlinked parts
- **BomPage — Alert indicators** — rows with issues get a red left border; alert badges in Notes column: "Linked task overdue", "Linked task blocked", "Part delivery delayed", "Linked part unused"
- **BomPage — Alert count** — header shows total alert count across all BOM rows
- **CSV export** — now includes Project and Linked Task columns

### v2.8 — Task Dependencies
- **`Task.dependsOn`** — new optional `string[]` field storing prerequisite task IDs
- **TaskModal** — searchable "Depends on" multi-select dropdown; tasks grouped by status; switching project clears selections; stale dep IDs cleaned up on task delete
- **TasksPage** — ⛔ "blocked" badge on tasks with incomplete dependencies (tooltip lists blocking tasks); ✓ "deps done" badge when all dependencies complete
- **DashboardPage** — ⛔ indicator on blocked tasks in the active task list
- **GanttPage** — SVG dependency arrows between task bars; green solid = dep complete, red dashed = dep still pending
- **Notifications** — new alert type for tasks blocked by an overdue dependency

### v2.7 — Suppliers Mini-Epic
- **Collapsible supplier cards** — click header to expand/collapse; collapsed view shows part count, order count, pending and overdue badges
- **Delete suppliers** — permanent delete with confirmation modal; also removes all associated BOM entries
- **Archive/restore suppliers** — soft-delete toggle; archived cards shown at reduced opacity with "archived" badge
- **Page-level filters** — Active / Archived / Overdue orders dropdown with live counts
- **Empty states** — contextual messages per filter ("No overdue orders ✓" in green)
- **`Supplier.archived`** field added to type; `deleteSupplier` + `toggleArchiveSupplier` handlers added to AppContext

### v2.6 — Full TypeScript Migration
- All 29 source files converted from `.jsx`/`.js` to `.tsx`/`.ts`
- `src/types.ts` — central domain interfaces: `User`, `Project`, `Task`, `Supplier`, `Part`, `Order`, `BomEntry`, `BomRow`, `Notification`, `SearchResult`, `BackupPayload`
- `AppContext` fully typed with `AppContextType` interface; `createContext<AppContextType | null>` with null guard hook
- `useStorage` returns `Dispatch<SetStateAction<T>>` — supports functional updaters throughout
- All component prop interfaces explicit; all handler params typed; strict mode enabled (`noImplicitAny`)
- TypeScript downgraded to 4.9.5 for react-scripts@5.0.1 compatibility
- `cleanup-old-files.bat` included to remove stale `.jsx`/`.js` files before upgrade

### v2.5 — Dashboard UI Polish
- Dropdown contrast fixes across all selects (colorScheme dark)
- Colour-coded status and priority selects throughout Tasks and BOM
- Global option styles for consistent dark-mode rendering

### v2.4 — Mobile / Responsive
- Bottom tab bar navigation on mobile
- Sheet-style modals on small screens
- Horizontal-scroll tables with minimum widths
- Single-column dashboard layout on narrow viewports

### v2.3 — Last-Updated Timestamps
- All entities stamped with `updatedAt` / `updatedBy` on every save
- `UpdatedBadge` component shown on all tables and supplier cards
- Recent Activity feed on Dashboard (last 10 changes across all entities)

### v2.2 — Weekly Summary Generator
- Role-filtered report modal (Worker / Manager / Admin views)
- Copy as plain text or export as standalone HTML file

### v2.1 — Project-Focused Gantt
- Project pill selector with "show all" overlay
- Date axis with auto-scaling
- Click any bar to edit the task

### v2.0 — Full Modular Refactor
- Split monolithic file into context, hooks, utils, pages, modals (26 files)
- `AppContext` as single source of truth

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

### Phase 4 — Backend Migration *(future)*

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
