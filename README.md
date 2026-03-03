# ◈ Lattice PM

A modular React project management tool for engineering and operations teams.

---

## Features

- **🏠 Dashboard** — Daily briefing: overdue tasks, delivery alerts, project progress, team workload. Clickable stat cards navigate to the relevant section.
- **📅 Timeline (Gantt)** — Project-focused Gantt chart. Select any project to focus, toggle "show overlapping projects" to see other timelines dimmed behind it. Date axis auto-scales, click any bar to edit the task. Groups tasks by project in "All" view.
- **✅ Tasks** — Create, assign, and track tasks with status, priority, dates, and project tagging. CSV export respects active filter.
- **🗂️ Projects** — Custom colour-coded projects with progress bars and per-project stats.
- **📦 Suppliers & Orders** — Parts catalogue per supplier, orders with lead-time tracking and arrival confirmation.
- **🔩 BOM** — Auto-populated from supplier parts. Usage status (Used / Not Used / Under Review / Pending), quantity, engineering / CI notes. Filter and CSV export.
- **👥 Team** — Role-based access. Add, edit, remove members. Password show/hide, strength meter, auto-generate, force-reset on next login.
- **🔔 Notifications** — In-app alerts for overdue tasks and delivery deadlines.
- **💾 Backup & Restore** — Full JSON export/import with browser storage meter and drag-and-drop restore.
- **🔍 Global Search** — Instant search across tasks, projects, suppliers, parts, orders, BOM notes, and team members. Highlighted matches, keyboard (Esc) dismiss.

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

Deploy the `/build` folder to any static host — Netlify, Vercel, GitHub Pages, etc.

---

## CSV Exports

**BOM** — click ⬇ Export CSV in the BOM tab. Exports part number, description, supplier, quantities, status, project/assembly, and engineering notes. Active filter applies.

**Tasks** — click ⬇ Export CSV in the Tasks tab. Exports title, project, assignee, dates, status, priority, and description. Active project filter applies.

---

## Data Storage

Browser `localStorage` — persists between sessions on the same browser, not shared across devices.

> For real multi-user collaboration, swap the `useStorage` hook for a backend like Supabase or Firebase. The architecture is designed to make that a clean one-file change.

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
│   ├── csvExport.js           # exportCSV helper
│   └── dateHelpers.js         # todayStr, addDays, fmt, daysBetween, initials
│
├── constants/
│   └── seeds.js               # ROLES, colors, status meta, demo seed data
│
├── components/
│   ├── ui/index.jsx           # Overlay, Btn, Avatar, Lbl, TH, TD, ConfirmModal
│   ├── Sidebar.jsx
│   ├── SearchBar.jsx
│   └── NotificationBell.jsx
│
├── modals/
│   ├── TaskModal.jsx
│   ├── ProjectModal.jsx
│   ├── SupplierModals.jsx     # SupplierModal + PartModal + OrderModal
│   ├── BomModal.jsx
│   ├── MemberModal.jsx
│   └── BackupModal.jsx
│
└── pages/
    ├── AuthScreens.jsx        # LoginScreen + MustSetPasswordScreen
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
| 2.1 | Project-focused Gantt — pill selector, show-all overlay, date axis, click-to-edit, stats bar |
| 2.0 | Full modular refactor — context, hooks, utils, pages, modals |
| 1.5 | Backup / restore with storage meter |
| 1.4 | Global search bar across all entities |
| 1.3 | CSV export for BOM and Tasks |
| 1.2 | Dashboard home screen |
| 1.1 | Project management, password UX |
| 1.0 | Initial release |

---

## Roadmap

### 🟢 Up Next

- [ ] **Weekly Summary generator** — role-filtered HTML/Markdown report with copy-to-clipboard or export. Manager: overdue tasks, project progress, delivery alerts. Admin: supplier chase list. Worker: personal jobs for next 7–14 days.
- [ ] **Mobile / responsive basics** — stack columns, larger touch targets, no horizontal scrolling on phone.
- [ ] **Task dependencies** — "depends on" multi-select field, visual blocked indicators on Gantt and dashboard.
- [ ] **BOM ↔ Task bridging** — link parts to tasks, alert when linked parts are delayed or unused.
- [ ] **Last-updated timestamps** — "last changed by [user] on [date]" on every entity, subtle badge for recent changes.

### 🔴 Parked — Do Later

- External API integrations (calendar sync, email, payments)
- Advanced analytics / PDF / PowerBI export
- Native mobile app / full PWA
- Theming beyond dark/light toggle

---

## Built With

- [React 18](https://react.dev/) + Create React App
- Google Fonts — Playfair Display + IBM Plex Sans

---

## License

MIT
