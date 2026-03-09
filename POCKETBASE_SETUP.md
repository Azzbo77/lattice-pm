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

> ⚠ If the import succeeds, skip to [Step 3](#3--create-the-first-lattice-user). Only follow the [Manual Collection Setup](#manual-collection-setup) section below if the import fails.

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

## Manual Collection Setup

Follow this section only if the JSON import failed or you need to recreate a collection by hand. Create all 8 collections in the order listed — relations depend on earlier collections existing first.

> **API rule shorthand used below:**
> - `auth` = `@request.auth.id != ""` — any logged-in user
> - `admin` = `@request.auth.role = "admin"` — admins only

---

### `users` *(Auth collection)*

**Auth options** (Collections → users → ⚙ Settings):
- Enable **Email / Password** auth

**Fields:**
| Field | Type | Options |
|-------|------|---------|
| `name` | Text | Required |
| `role` | Select | Required · Options: `admin`, `manager`, `office`, `shopfloor` |
| `mustChangePassword` | Bool | Default: false |

**API rules:**
| Rule | Value |
|------|-------|
| List | `auth` |
| View | `auth` |
| Create | `auth` |
| Update | `auth` |
| Delete | `@request.auth.role = "admin"` |

> The Delete rule is intentionally restricted to admins — without this any logged-in user could delete team members.

---

### `projects`

**Fields:**
| Field | Type | Options |
|-------|------|---------|
| `name` | Text | Required |
| `color` | Text | Required |
| `description` | Text | — |
| `updatedBy` | Text | — |

**API rules:**
| Rule | Value |
|------|-------|
| List | `auth` |
| View | `auth` |
| Create | `auth` |
| Update | `auth` |
| Delete | `auth` |

---

### `tasks`

**Fields:**
| Field | Type | Options |
|-------|------|---------|
| `title` | Text | Required |
| `projectId` | Relation → `projects` | Required · Max select: 1 |
| `assigneeId` | Relation → `users` | Max select: 1 |
| `status` | Select | Required · Options: `todo`, `in-progress`, `done`, `blocked` |
| `priority` | Select | Required · Options: `low`, `medium`, `high` |
| `startDate` | Text | — |
| `endDate` | Text | — |
| `description` | Text | — |
| `dependsOn` | Relation → `tasks` | Max select: unlimited (multi) |
| `updatedBy` | Text | — |

**API rules:**
| Rule | Value |
|------|-------|
| List | `auth` |
| View | `auth` |
| Create | `auth` |
| Update | `auth` |
| Delete | `auth` |

---

### `suppliers`

**Fields:**
| Field | Type | Options |
|-------|------|---------|
| `name` | Text | Required |
| `contact` | Text | — |
| `phone` | Text | — |
| `email` | Email | — |
| `archived` | Bool | Default: false |
| `updatedBy` | Text | — |

**API rules:**
| Rule | Value |
|------|-------|
| List | `auth` |
| View | `auth` |
| Create | `auth` |
| Update | `auth` |
| Delete | `auth` |

---

### `parts`

**Fields:**
| Field | Type | Options |
|-------|------|---------|
| `supplierId` | Relation → `suppliers` | Required · Max select: 1 · **On delete: Cascade** |
| `partNumber` | Text | Required |
| `description` | Text | — |
| `unit` | Text | — |
| `unitQty` | Number | — |
| `updatedBy` | Text | — |

**API rules:**
| Rule | Value |
|------|-------|
| List | `auth` |
| View | `auth` |
| Create | `auth` |
| Update | `auth` |
| Delete | `auth` |

---

### `orders`

**Fields:**
| Field | Type | Options |
|-------|------|---------|
| `supplierId` | Relation → `suppliers` | Required · Max select: 1 · **On delete: Cascade** |
| `description` | Text | — |
| `partIds` | Relation → `parts` | Max select: unlimited (multi) |
| `orderedDate` | Text | — |
| `leadTimeDays` | Number | — |
| `arrived` | Bool | Default: false |
| `arrivedDate` | Text | — |
| `updatedBy` | Text | — |

**API rules:**
| Rule | Value |
|------|-------|
| List | `auth` |
| View | `auth` |
| Create | `auth` |
| Update | `auth` |
| Delete | `auth` |

---

### `bom`

**Fields:**
| Field | Type | Options |
|-------|------|---------|
| `supplierId` | Relation → `suppliers` | Required · Max select: 1 · **On delete: Cascade** |
| `partId` | Relation → `parts` | Required · Max select: 1 · **On delete: Cascade** |
| `projectId` | Relation → `projects` | Max select: 1 |
| `taskId` | Relation → `tasks` | Max select: 1 |
| `qtyOrdered` | Number | — |
| `status` | Select | Required · Options: `pending`, `used`, `not-used`, `under-review` |
| `notes` | Text | — |
| `updatedBy` | Text | — |

**API rules:**
| Rule | Value |
|------|-------|
| List | `auth` |
| View | `auth` |
| Create | `auth` |
| Update | `auth` |
| Delete | `auth` |

---

### `announcements`

**Fields:**
| Field | Type | Options |
|-------|------|---------|
| `title` | Text | Required |
| `body` | Text | Required |
| `pinned` | Bool | Default: false |
| `expires` | Text | Format: YYYY-MM-DD |
| `updatedBy` | Text | — |

**API rules:**
| Rule | Value |
|------|-------|
| List | `auth` |
| View | `auth` |
| Create | `auth` |
| Update | `auth` |
| Delete | `auth` |

---

## Done ✅
