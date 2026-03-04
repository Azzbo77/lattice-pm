# ◈ Lattice PM

A modular React project management tool for engineering and operations teams.

---

## Features

- **🏠 Dashboard** — Daily briefing: overdue tasks, delivery alerts, project progress, team workload. Clickable stat cards navigate to the relevant section.
- **📅 Timeline (Gantt)** — Project-focused Gantt. Select any project to focus, toggle "show overlapping projects" to see other timelines dimmed behind it. Date axis auto-scales, click any bar to edit the task.
- **✅ Tasks** — Create, assign, and track tasks with status, priority, dates, and project tagging. CSV export respects active filter.
- **🗂️ Projects** — Colour-coded projects with progress bars and per-project stats.
- **📦 Suppliers & Orders** — Parts catalogue per supplier, orders with lead-time tracking and arrival confirmation.
- **🔩 BOM** — Auto-populated from supplier parts. Usage status, quantities, engineering/CI notes. Filter pills and CSV export.
- **👥 Team** — Role-based access. Add, edit, remove members. Password show/hide, strength meter, auto-generate, force-reset.
- **🔔 Notifications** — In-app alerts for overdue tasks and delivery deadlines.
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
├── App.jsx                    # Thin orchestrator — layout, tab routing, modal rendering
├── index.js
│
├── context/
│   └── AppContext.jsx         # Single source of truth — all state + handlers
│
├── hooks/
│   ├── useStorage.js          # localStorage / window.storage abstraction
│   └── useSearch.js           # Global search engine
│
├── utils/
│   ├── csvExport.js
│   └── dateHelpers.js
│
├── constants/
│   └── seeds.js               # ROLES, colors, status meta, demo seed data
│
├── components/
│   ├── ui/index.jsx           # Shared primitives
│   ├── Sidebar.jsx
│   ├── SearchBar.jsx
│   └── NotificationBell.jsx
│
├── modals/
│   ├── TaskModal.jsx
│   ├── ProjectModal.jsx
│   ├── SupplierModals.jsx
│   ├── BomModal.jsx
│   ├── MemberModal.jsx
│   ├── BackupModal.jsx
│   └── WeeklySummaryModal.jsx
│
└── pages/
    ├── AuthScreens.jsx
    ├── DashboardPage.jsx
    ├── GanttPage.jsx
    ├── TasksPage.jsx
    ├── ProjectsPage.jsx
    ├── SuppliersPage.jsx
    ├── BomPage.jsx
    └── TeamPage.jsx
```

---

## Changelog

| Version | What changed |
|---------|-------------|
| 2.6 | TypeScript migration — all files .ts/.tsx, central types.ts, two ESLint bugs fixed |
| 2.5 | Dashboard UI polish — dropdown contrast, colorScheme dark, colour-coded status/priority selects, global option styles |
| 2.4 | Mobile / responsive — bottom tab bar, sheet modals, horizontal-scroll tables, single-column dashboard |
| 2.3 | Last-updated timestamps — all entities stamped, UpdatedBadge on tables/cards, Recent Activity feed on dashboard |
| 2.2 | Weekly Summary generator — role-filtered report, copy text + HTML export |
| 2.1 | Project-focused Gantt — pill selector, show-all overlay, date axis, click-to-edit |
| 2.0 | Full modular refactor — context, hooks, utils, pages, modals |
| 1.5 | Backup / restore with storage meter |
| 1.4 | Global search bar across all entities |
| 1.3 | CSV export for BOM and Tasks |
| 1.2 | Dashboard home screen |
| 1.1 | Project management, password UX |
| 1.0 | Initial release |

---

## Roadmap

### Phase 1 — Quick Polish & Immediate Personal Wins *(1–2 weekends)*

1. **~~Last-updated timestamps~~** ✅ *(v2.3)*
   Add to all entities (tasks, projects, suppliers, parts, orders, BOM items). Show on cards/tables as a subtle "last changed by [user] on [date]" badge. Highlight recently changed items.

2. **~~Weekly Summary generator~~** ✅ *(v2.2)*

3. **~~Mobile / responsive basics~~** ✅ *(v2.4)*
   Stack columns on small screens, larger touch targets, no horizontal scrolling on supplier lists, tables, or BOM. Sidebar collapses to an icon strip or hamburger.

4. **~~Dashboard UI polish — contrast on dropdowns~~** ✅ *(v2.5)*
   Audit all dropdowns and filter selects for text/background contrast. Align to theme constants from `seeds.js`. Validate with WAVE or browser devtools accessibility checker.

---

### Phase 2 — Core Workflow + Supplier/BOM Enhancements *(2–4 weekends)*

5. **SuppliersPage improvements** *(group as one mini-epic)*
   - **Collapsible supplier boxes** — accordion per supplier card (expand to show parts catalogue + orders). Collapsed state shows name, contact, part count, order summary.
   - **Delete / archive suppliers** — delete with confirmation modal; archive toggle (soft-delete: mark inactive, hidden by default, with "show archived" filter).
   - **Filter & search** — page-level dropdown (active / inactive / lead-time overdue) + integration with global search.

6. **Task dependencies** *(simple)*
   "Depends on" multi-select field per task. Gantt shows dependency lines or blocked indicators. Dashboard flags tasks whose dependency is overdue.

7. **BOM ↔ Task bridging**
   Link parts to tasks. Alert when a linked part is delayed or unused. Add "Filter by task / project" dropdown on the BOM page to show only parts relevant to a given task.

---

### Phase 3 — Polish & Prep *(ongoing)*

8. **Theme / styles centralisation**
   Extract all colour, spacing, and typography values into a single `theme.js` constant. Eliminates magic hex values across components and makes light-mode trivial to add.

9. **~~Incremental TypeScript~~** ✅ *(v2.6)*
   Migrated all at once — `types.ts` defines all interfaces, all files converted to `.ts`/`.tsx` → `dateHelpers.ts` → context. No big-bang rewrite.

10. **Auth / security basics**
    Move passwords out of localStorage (hash with bcrypt-js or replace with a proper auth provider). Session expiry. Optional: Supabase Auth drop-in.

11. **Perf & reliability tweaks**
    `React.memo` on heavy list components, `useMemo` audit, accessibility pass on new collapsible/delete UI (keyboard nav, ARIA roles, focus trapping in modals).

---

## Built With

- [React 18](https://react.dev/) + Create React App
- Google Fonts — Playfair Display + IBM Plex Sans

## License

MIT
