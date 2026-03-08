# PocketBase Setup Checklist

Complete this once after first run. Open the PocketBase admin UI at `http://<your-ip>:8090/_/`.

---

## 1 — Create Superuser Account

On first start PocketBase generates a one-time install URL. Grab it from the container logs:

```bash
docker logs lattice-pm-pocketbase-1 --tail 20
```

Copy the `/_/#/pbinstal/...` URL, replace `0.0.0.0` with your machine's IP (or `localhost` on a local machine), and open it in a browser. Create your superuser account — this is your PocketBase admin account, separate from Lattice users.

> If the token has expired, restart the container to get a fresh one:
> ```bash
> docker restart lattice-pm-pocketbase-1
> docker logs lattice-pm-pocketbase-1 --tail 20
> ```

Alternatively, set the superuser password directly via the CLI:
```bash
docker exec -it lattice-pm-pocketbase-1 /usr/local/bin/pocketbase superuser upsert your@email.com 'YourPassword'
```
Then log in at `http://<your-ip>:8090/_/`.

---

## 2 — Import Collections

All collections, fields and API rules are bundled in `pb_migrations/1_initial_schema.json`. Import them in one step:

1. Go to **Settings → Import collections**
2. Click **Load from JSON file** and select `pb_migrations/1_initial_schema.json` from the repo
3. Review the preview — you should see 8 collections: `users`, `projects`, `tasks`, `suppliers`, `parts`, `orders`, `bom`, `announcements`
4. Click **Confirm and import**

> ⚠ The `users` collection includes the `role` field (Select: `admin`, `manager`, `office`, `shopfloor`), `mustChangePassword` (Bool), and all API rules including the Delete rule required for team member removal. All of this is applied automatically by the import.

---

## 3 — Create the First Lattice User

Go to **Collections → users → New record** and create your admin user:

| Field | Value |
|-------|-------|
| `name` | Your name |
| `email` | Your email |
| `password` | Your password |
| `role` | `admin` |
| `mustChangePassword` | false |

---

## 4 — Log In to Lattice

- **Local / laptop:** `http://localhost:8080`
- **Pi on your network:** `http://<your-pi-ip>:8080`
- **Via Cloudflare Tunnel:** your configured domain (see [CLOUDFLARE_TUNNEL.md](CLOUDFLARE_TUNNEL.md))

---

## Backups

Use the built-in PocketBase backup system — no external tools needed:

1. Go to `http://<your-ip>:8090/_/`
2. **Settings → Backups**
3. Click **Create backup** or configure automatic scheduled backups

---

## Collection Reference

For reference only — these are created by the import above. No manual setup needed.

### `users` (auth collection)
| Field | Type | Notes |
|-------|------|-------|
| `name` | Text | Required |
| `email` | Email | Required |
| `role` | Select | `admin`, `manager`, `office`, `shopfloor` |
| `mustChangePassword` | Bool | — |

### `projects`
| Field | Type |
|-------|------|
| `name` | Text ✅ |
| `color` | Text ✅ |
| `description` | Text |
| `updatedBy` | Text |

### `tasks`
| Field | Type |
|-------|------|
| `title` | Text ✅ |
| `projectId` | Relation → projects ✅ |
| `assigneeId` | Relation → users |
| `status` | Select: `todo`, `in-progress`, `done`, `blocked` ✅ |
| `priority` | Select: `low`, `medium`, `high` ✅ |
| `startDate` | Text |
| `endDate` | Text |
| `description` | Text |
| `dependsOn` | Relation → tasks (multi) |
| `updatedBy` | Text |

### `suppliers`
| Field | Type |
|-------|------|
| `name` | Text ✅ |
| `contact` | Text |
| `phone` | Text |
| `email` | Email |
| `archived` | Bool |
| `updatedBy` | Text |

### `parts`
| Field | Type |
|-------|------|
| `supplierId` | Relation → suppliers ✅ |
| `partNumber` | Text ✅ |
| `description` | Text |
| `unit` | Text |
| `unitQty` | Number |
| `updatedBy` | Text |

### `orders`
| Field | Type |
|-------|------|
| `supplierId` | Relation → suppliers ✅ |
| `description` | Text |
| `partIds` | Relation → parts (multi) |
| `orderedDate` | Text |
| `leadTimeDays` | Number |
| `arrived` | Bool |
| `arrivedDate` | Text |
| `updatedBy` | Text |

### `bom`
| Field | Type |
|-------|------|
| `supplierId` | Relation → suppliers ✅ |
| `partId` | Relation → parts ✅ |
| `projectId` | Relation → projects |
| `taskId` | Relation → tasks |
| `qtyOrdered` | Number |
| `status` | Select: `pending`, `used`, `not-used`, `under-review` ✅ |
| `notes` | Text |
| `updatedBy` | Text |

---

## Done ✅
