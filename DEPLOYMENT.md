# ◈ Lattice PM — Deployment Guide

Two environments: Windows laptop for development, Raspberry Pi 4 (Ubuntu 64-bit) for production.

---

## Architecture

```
Windows (dev)                          Pi 4 (prod)
─────────────────────────────          ──────────────────────────────
React app   → localhost:3000           nginx          → :80
PocketBase  → localhost:8090           PocketBase     → localhost:8090
                                       nginx /pb/     → localhost:8090
```

The React app talks to PocketBase via `REACT_APP_PB_URL`.
In dev this points directly at `localhost:8090`.
In prod, nginx proxies `/pb/` so the app and API share one origin — no CORS.

---

## Windows (Dev Setup)

### 1 — Download PocketBase

1. Go to https://pocketbase.io/docs/ → download **Windows AMD64** zip
2. Create `C:\pocketbase-dev\` and extract `pocketbase.exe` into it
3. Copy the `pb_migrations/` folder from this repo into `C:\pocketbase-dev\`

```
C:\pocketbase-dev\
├── pocketbase.exe
└── pb_migrations\
    └── 1_initial_schema.json
```

### 2 — First run & admin account

```powershell
cd C:\pocketbase-dev
.\pocketbase.exe serve --http="127.0.0.1:8090"
```

Open http://127.0.0.1:8090/_/ and create your admin account.
PocketBase will apply `pb_migrations/1_initial_schema.json` automatically on first start —
all 6 collections (projects, tasks, suppliers, parts, orders, bom) will appear in the admin UI.

> **Important:** See [POCKETBASE_SETUP.md](POCKETBASE_SETUP.md) for the full collection and API rules setup, including the required `role` and `mustChangePassword` fields and delete rules needed for team member removal.

### 3 — Environment files

Create these two files in the project root (they are gitignored):

**.env.development**
```
REACT_APP_PB_URL=http://127.0.0.1:8090
```

**.env.production**
```
REACT_APP_PB_URL=/pb
```

### 4 — Install PocketBase SDK

```powershell
npm install pocketbase
```

### 5 — Seed demo data

```powershell
npx ts-node scripts/seed.ts \
  --url http://127.0.0.1:8090 \
  --email your@admin.email \
  --password yourAdminPassword
```

### 6 — Start dev

Make sure PocketBase is running, then:

```powershell
npm start
```

---

## Raspberry Pi 4 (Prod Setup)

### 1 — Download PocketBase

```bash
PB_VERSION=0.22.0
wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_arm64.zip
sudo mkdir -p /opt/pocketbase
sudo unzip pocketbase_${PB_VERSION}_linux_arm64.zip -d /opt/pocketbase
sudo chmod +x /opt/pocketbase/pocketbase
```

Copy the migrations folder:

```bash
sudo mkdir -p /opt/pocketbase/pb_migrations
sudo cp pb_migrations/1_initial_schema.json /opt/pocketbase/pb_migrations/
```

### 2 — systemd service

```bash
sudo nano /etc/systemd/system/pocketbase.service
```

```ini
[Unit]
Description=PocketBase — Lattice PM
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http="127.0.0.1:8090"
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase
```

Open http://PI_IP:8090/_/ and create the admin account (same as step 2 above — also add the `role` and `mustChangePassword` fields to the users collection).

### 3 — nginx

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/lattice-pm
```

```nginx
server {
    listen 80;
    server_name _;
    root /var/www/lattice-pm;
    index index.html;

    # React app — SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PocketBase API + admin UI
    location /pb/ {
        proxy_pass http://127.0.0.1:8090/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        # Required for PocketBase realtime (SSE)
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
    }
}
```

```bash
sudo mkdir -p /var/www/lattice-pm
sudo chown www-data:www-data /var/www/lattice-pm
sudo ln -s /etc/nginx/sites-available/lattice-pm /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### 4 — Deploy React build

On Windows:
```powershell
npm run build
scp -r build/* user@PI_IP:/var/www/lattice-pm/
```

### 5 — Seed the Pi instance

```powershell
npx ts-node scripts/seed.ts \
  --url http://PI_IP:8090 \
  --email your@admin.email \
  --password yourAdminPassword
```

---

## Updating

When you deploy a new build:

```powershell
# Windows — build and push
npm run build
scp -r build/* user@PI_IP:/var/www/lattice-pm/
```

PocketBase data is untouched. Users will see the "New version available → Refresh" banner automatically.

For schema changes — add a new numbered migration file to `pb_migrations/` and restart PocketBase.

---

## Useful URLs

| | Dev | Prod |
|---|---|---|
| App | http://localhost:3000 | http://PI_IP |
| PocketBase admin | http://localhost:8090/_/ | http://PI_IP:8090/_/ |
| PocketBase API | http://localhost:8090/api/ | http://PI_IP/pb/api/ |

---

## Troubleshooting

**PocketBase won't start on Pi**
```bash
sudo systemctl status pocketbase
sudo journalctl -u pocketbase -n 50
```

**nginx 502 Bad Gateway**
PocketBase isn't running — check `systemctl status pocketbase`.

**Collections missing after first run**
Make sure `pb_migrations/` is in the same folder as the binary before first start.
If PocketBase already ran without it, delete `pb_data/` and restart.

**CORS errors in dev**
Check `.env.development` points to `http://127.0.0.1:8090` (not `localhost` — they differ on some systems).
In PocketBase admin → Settings → Application → allowed origins, add `http://localhost:3000`.

---

## Docker Deployment

Docker is the recommended way to run Lattice PM — it spins up both PocketBase and the React app together with a single command.

### Prerequisites
- Docker and Docker Compose installed
- Port 3000 free (dev) or port 80 free (prod)

---

### Local Development (full stack, no hot reload)

> Use this when you want to test the full stack locally without installing PocketBase separately.
> For active coding with live reload, run PocketBase standalone and use `npm start` instead — see the manual setup section.

```bash
docker compose up --build
```

- App: http://localhost:3000
- PocketBase admin UI: http://localhost:8090/_/

On first run, open the PocketBase admin UI and create your admin account. Then run the seed script (see the manual setup section) or create the collections and users manually.

---

### Production (Pi)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

- App: http://<your-pi-ip>
- PocketBase admin UI is **not** exposed publicly — only accessible from within the Pi itself via `http://localhost:8090/_/`

To access the PocketBase admin UI on the Pi:

```bash
ssh -L 8090:localhost:8090 user@your-pi-ip
# Then open http://localhost:8090/_/ on your local machine
```

---

### Data Persistence

PocketBase data is stored in a Docker named volume (`pb_data`). It persists across container restarts and rebuilds.

```bash
# View volumes
docker volume ls

# Back up pb_data to a local folder
docker run --rm -v lattice-pm_pb_data:/data -v $(pwd):/backup alpine   tar czf /backup/pb_data_backup.tar.gz /data
```

---

### Updating

```bash
# Rebuild the app after code changes
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app

# Update PocketBase image
docker compose pull pocketbase
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d pocketbase
```

---

### Stopping

```bash
docker compose down          # Stop containers, keep volumes
docker compose down -v       # Stop containers AND delete all data ⚠
```

