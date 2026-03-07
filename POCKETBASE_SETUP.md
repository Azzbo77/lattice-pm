# PocketBase Setup Checklist

Complete this once after first run. Open the PocketBase admin UI at `http://<your-pi-ip>:8090/_/`.

---

## 1 — Create Superuser Account

On first visit PocketBase will prompt you to create a superuser. This is your PocketBase admin account — separate from Lattice users.

- Email: anything you like
- Password: strong password, store it somewhere safe

---

## 2 — Enable the Users Collection

PocketBase creates a `_pb_users_auth_` collection by default. You need to add a custom field to it.

1. Go to **Collections → _pb_users_auth_**
2. Click **Edit collection**
3. Add the following field:

| Field name | Type | Required | Options |
|------------|------|----------|---------|
| `role` | Select | ✅ | Values: `admin`, `manager`, `office`, `shopfloor` |
| `mustChangePassword` | Bool | — | — |
| `name` | Text | ✅ | — |

4. Click **Save**

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

**API Rules** — set all four rules to:
```
@request.auth.role = 'admin' || @request.auth.role = 'manager' || @request.auth.role = 'office'
```
Except **Delete**:
```
@request.auth.role = 'admin'
```

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
- **List/View:**
```
@request.auth.id != ''
```
- **Create/Delete:**
```
@request.auth.role = 'admin' || @request.auth.role = 'manager' || @request.auth.role = 'office'
```
- **Update:**
```
@request.auth.role = 'admin' || @request.auth.role = 'manager' || @request.auth.role = 'office' || @request.auth.id = assigneeId
```

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

**API Rules** — List/View:
```
@request.auth.id != ''
```
Create/Update:
```
@request.auth.role = 'admin' || @request.auth.role = 'manager'
```
Delete:
```
@request.auth.role = 'admin'
```

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

Once collections are created, go to **Collections → _pb_users_auth_ → New record** and create your admin user:

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

## Done ✅

The seed script (`scripts/seed.ts`) automates step 4 only — it cannot create collections. If you ran it before completing step 3, it would have failed. Now that collections exist you can either use the record you created in step 4, or run the seed script to create the default `admin@lattice.dev` account.
