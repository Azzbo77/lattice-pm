# ◈ Lattice PM

A self-contained project management tool built with React. Designed for engineering and operations teams.

---

## Features

- **🏠 Dashboard** — Morning briefing view showing overdue tasks, items due this week, delivery alerts, project progress bars, and team workload at a glance. Clickable stat cards jump straight to the relevant section.
- **📅 Timeline (Gantt Chart)** — Visual bar chart of all tasks with a live "today" marker. Filter by project.
- **✅ Tasks** — Create, assign, and track tasks with status, priority, due dates, and project tagging. Export to CSV.
- **🗂️ Projects** — Add and manage projects with custom colours and progress tracking.
- **📦 Suppliers & Orders** — Maintain a parts catalogue per supplier, log orders with lead times, and mark deliveries as arrived.
- **🔩 Bill of Materials (BOM)** — Auto-populated from supplier parts. Set usage status (Used / Not Used / Under Review), quantity ordered, total units, and engineering / CI notes per part. Filter by status. Export to CSV.
- **👥 Team Management** — Add, edit, and remove team members. Role-based access (Admin / Manager / Worker).
- **🔔 Notifications** — In-app alerts for overdue tasks and upcoming deadlines and deliveries.
- **🔐 Password management** — Show/hide toggle, strength meter, auto-generate, and force-reset on next login.

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

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- npm (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Azzbo77/lattice-pm.git
cd lattice-pm

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
```

Output goes to the `/build` folder, ready to deploy to any static host (Netlify, Vercel, GitHub Pages, etc.).

---

## CSV Exports

### BOM Export
From the **🔩 BOM** tab, click **⬇ Export CSV** to download a spreadsheet containing:
- Part Number, Description, Supplier
- Unit, Unit Qty, Qty Ordered, Total Units
- Status (Used / Not Used / Under Review / Pending)
- Project / Assembly
- Engineering Notes / CI suggestions

The filter you have active is respected — export only "Used" parts by selecting that filter first.

### Tasks Export
From the **✅ Tasks** tab, click **⬇ Export CSV** to download:
- Title, Project, Assignee, Start Date, End Date, Status, Priority, Description

The current project filter is respected — export one project at a time if needed.

---

## Data Storage

Data is stored in **browser localStorage** — it persists between sessions on the same browser but is not shared across devices or users.

> For real multi-user collaboration, this app would need a backend (e.g. Supabase, Firebase, or a custom Node/Express API). The front-end architecture is designed to make that transition straightforward — all data flows through a single `useStorage` hook that can be swapped out.

---

## Project Structure

```
lattice-pm/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx             # Main application (all components)
│   └── index.js            # React root mount
├── .gitignore
├── package.json
└── README.md
```

---

## Changelog

| Version | What changed |
|---------|-------------|
| 1.3 | CSV export for BOM and Tasks |
| 1.2 | Dashboard home screen with daily briefing |
| 1.1 | Project management, password UX improvements |
| 1.0 | Initial release — Tasks, Gantt, Suppliers, BOM, Team |

---

## Roadmap

- [ ] Gantt chart — click bar to open task, drag to reschedule
- [ ] Comments / activity log on tasks
- [ ] Real backend + database (Supabase / Firebase) for live multi-user sync
- [ ] Email / SMS notifications for deadlines
- [ ] File attachments on tasks and orders
- [ ] BOM revision history — track who changed what and when
- [ ] Link BOM parts directly to tasks
- [ ] Mobile-optimised layout

---

## Built With

- [React 18](https://react.dev/)
- [Create React App](https://create-react-app.dev/)
- Google Fonts — Playfair Display + IBM Plex Sans

---

## License

MIT — free to use and modify.
