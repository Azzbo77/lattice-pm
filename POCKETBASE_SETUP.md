# PocketBase Setup Checklist

Complete this once after first run. Open the PocketBase admin UI at `http://<your-pi-ip>:8090/_/`.

---

## 1 — Create Superuser Account

On first visit PocketBase will show a one-time install URL in the container logs. Run:

```bash
docker logs lattice-pm-pocketbase-1 --tail 20
```

Copy the `/_/#/pbinstal/...` URL, replace `0.0.0.0` with your Pi's IP, and open it in a browser. Create your superuser account — this is your PocketBase admin account, separate from Lattice users.

> If the token has expired, restart the container to get a fresh one:
> ```bash
> docker restart lattice-pm-pocketbase-1
> docker logs lattice-pm-pocketbase-1 --tail 20
> ```

Alternatively, once the container is running you can set the superuser password directly:
```bash
docker exec -it lattice-pm-pocketbase-1 /usr/local/bin/pocketbase superuser upsert your@email.com 'YourPassword'
```
Then log in at `http://<your-pi-ip>:8090/_/`.

---

## 2 — Configure the Users Collection

Go to **Collections → _pb_users_auth_ → Edit collection** and add these fields:

| Field name | Type | Required | Options |
|------------|------|----------|---------|
| `role` | Select | ✅ | Values: `admin`, `manager`, `office`, `shopfloor` |
| `mustChangePassword` | Bool | — | — |

The `name` field should already exist. Click **Save**.

Then set the **API Rules** for `_pb_users_auth_`:

- **List/View:** `@request.auth.id != ''`
- **Create:** `@request.auth.role = "admin"`
- **Update:** `@request.auth.id = id || @request.auth.role = "admin"`
- **Delete:** `@request.auth.role = "admin"`

> ⚠ The Delete rule is required — without it, admins cannot remove team members from Lattice.

---

## 3 — Create Collections

Create each collection below in order. Go to **Collections → New collection → Base collection**.

> ⚠ Collection names are case-sensitive. Use exactly the names shown.

---

### `projects`

| Field name | Type | Required |
|------------|------|----------|
| `name` | Text | ✅ |
| `color` | Text | ✅ |
| `description` | Text | — |
| `updatedBy` | Text | — |

**API Rules:**
- **List/View:** `@request.auth.id != ''`
- **Create/Update:** `@request.auth.role = "admin" || @request.auth.role = "manager" || @request.auth.role = "office"`
- **Delete:** `@request.auth.role = "admin"`

---

### `tasks`

| Field name | Type | Required | Options |
|------------|------|----------|---------|
| `title` | Text | ✅ | — |
| `projectId` | Relation | ✅ | Collection: `projects`, Max: 1 |
| `assigneeId` | Relation | — | Collection: `_pb_users_auth_`, Max: 1 |
| `status` | Select | ✅ | Values: `todo`, `in-progress`, `done`, `blocked` |
| `priority` | Select | ✅ | Values: `low`, `medium`, `high` |
| `startDate` | Text | — | — |
| `endDate` | Text | — | — |
| `description` | Text | — | — |
| `dependsOn` | Relation | — | Collection: `tasks`, Max: 999 |
| `updatedBy` | Text | — | — |

**API Rules:**
- **List/View:** `@request.auth.id != ''`
- **Create/Delete:** `@request.auth.role = "admin" || @request.auth.role = "manager" || @request.auth.role = "office"`
- **Update:** `@request.auth.role = "admin" || @request.auth.role = "manager" || @request.auth.role = "office" || @request.auth.id = assigneeId`

---

### `suppliers`

| Field name | Type | Required |
|------------|------|----------|
| `name` | Text | ✅ |
| `contact` | Text | — |
| `phone` | Text | — |
| `email` | Email | — |
| `archived` | Bool | — |
| `updatedBy` | Text | — |

**API Rules:**
- **List/View:** `@request.auth.id != ''`
- **Create/Update:** `@request.auth.role = "admin" || @request.auth.role = "manager"`
- **Delete:** `@request.auth.role = "admin"`

---

### `parts`

| Field name | Type | Required | Options |
|------------|------|----------|---------|
| `supplierId` | Relation | ✅ | Collection: `suppliers`, Max: 1 |
| `partNumber` | Text | ✅ | — |
| `description` | Text | — | — |
| `unit` | Text | — | — |
| `unitQty` | Number | — | — |
| `updatedBy` | Text | — | — |

**API Rules** — same as `suppliers`.

---

### `orders`

| Field name | Type | Required | Options |
|------------|------|----------|---------|
| `supplierId` | Relation | ✅ | Collection: `suppliers`, Max: 1 |
| `description` | Text | — | — |
| `partIds` | Relation | — | Collection: `parts`, Max: 999 |
| `orderedDate` | Text | — | — |
| `leadTimeDays` | Number | — | — |
| `arrived` | Bool | — | — |
| `arrivedDate` | Text | — | — |
| `updatedBy` | Text | — | — |

**API Rules** — same as `suppliers`.

---

### `bom`

| Field name | Type | Required | Options |
|------------|------|----------|---------|
| `supplierId` | Relation | ✅ | Collection: `suppliers`, Max: 1 |
| `partId` | Relation | ✅ | Collection: `parts`, Max: 1 |
| `projectId` | Relation | — | Collection: `projects`, Max: 1 |
| `taskId` | Relation | — | Collection: `tasks`, Max: 1 |
| `qtyOrdered` | Number | — | — |
| `status` | Select | ✅ | Values: `pending`, `used`, `not-used`, `under-review` |
| `notes` | Text | — | — |
| `updatedBy` | Text | — | — |

**API Rules** — same as `suppliers`.

---

## 4 — Create the First Lattice User

Go to **Collections → _pb_users_auth_ → New record** and create your admin user:

| Field | Value |
|-------|-------|
| `name` | Your name |
| `email` | Your email |
| `password` | Your password |
| `role` | `admin` |
| `mustChangePassword` | false |

---

## 5 — Log In to Lattice

Go to `http://<your-pi-ip>:8080` and log in with the credentials you just created.

---

## Backups

Use the built-in PocketBase backup system — no external tools needed:

1. Go to `http://<your-pi-ip>:8090/_/`
2. **Settings → Backups**
3. Click **Create backup** or set up automatic scheduled backups

---

## Done ✅
