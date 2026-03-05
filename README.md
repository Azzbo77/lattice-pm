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
│   └── seeds.ts               # ROLES, colors, status meta, demo seed data
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

8. **Theme / styles centralisation**
   Extract all colour, spacing, and typography values into a single `theme.ts` constant. Eliminates magic hex values across components and makes light-mode trivial to add.

9. **Table column alignment audit**
   Tasks and BOM tables have inconsistent horizontal alignment on badge/status/updated columns. Full audit of all `TH`/`TD` usage — left for text, centre for badges and actions — applied consistently across all pages.

10. **~~TypeScript strict mode~~** ✅ *(v2.6)*
    All files migrated, strict mode enabled, `useStorage` returns proper `Dispatch<SetStateAction<T>>`.

11. **Auth / security basics**
    Move passwords out of localStorage (hash with bcrypt-js or replace with a proper auth provider). Session expiry. Optional: Supabase Auth drop-in.

12. **Perf & reliability tweaks**
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
