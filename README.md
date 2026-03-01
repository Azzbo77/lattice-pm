# ◈ Lattice PM

A self-contained project management tool built with React. Designed for engineering and operations teams.

---

## Features

- **📅 Timeline (Gantt Chart)** — Visual bar chart of all tasks with a live "today" marker. Filter by project.
- **✅ Tasks** — Create, assign, and track tasks with status, priority, due dates, and project tagging.
- **🗂️ Projects** — Add and manage projects with custom colours and progress tracking.
- **📦 Suppliers & Orders** — Maintain a parts catalogue per supplier, log orders with lead times, and mark deliveries as arrived.
- **🔩 Bill of Materials (BOM)** — Auto-populated from supplier parts. Set usage status (Used / Not Used / Under Review), quantity, and engineering / CI notes per part.
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
git clone https://github.com/YOUR_USERNAME/lattice-pm.git
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

## Data Storage

Data is stored in **browser localStorage** — it persists between sessions on the same browser but is not shared across devices or users.

> For real multi-user collaboration, this app would need a backend (e.g. Supabase, Firebase, or a custom Node/Express API). The front-end architecture is designed to make that transition straightforward — all data flows through a single `useStorage` hook that can be swapped out.

---

## Project Structure

```
lattice-pm/
├── public/
│   └── index.html          # HTML entry point
├── src/
│   ├── App.jsx             # Main application (all components)
│   └── index.js            # React root mount
├── .gitignore
├── package.json
└── README.md
```

---

## Roadmap / Future Improvements

- [ ] Real backend + database (Supabase / Firebase)
- [ ] Real-time multi-user sync
- [ ] Email / SMS notifications for deadlines
- [ ] File attachments on tasks and orders
- [ ] Export BOM to CSV / Excel
- [ ] Gantt chart drag-to-resize bars
- [ ] Comments and activity log on tasks
- [ ] Mobile-optimised layout

---

## Built With

- [React 18](https://react.dev/)
- [Create React App](https://create-react-app.dev/)
- Google Fonts — Playfair Display + IBM Plex Sans

---

## License

MIT — free to use and modify.
