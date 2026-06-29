# @portlhub/link-service

Owns the **platform catalog** (the master list of supported platforms) and each
user's **links/handles** for **Portlhub**. Node.js + Express + MongoDB (via
Mongoose).

This is Phase 1: a single standalone service, no containers, no gateway. It runs
locally on its own port (4001) alongside user-service (4000). It references
users only by the `userId` (UUID) issued by user-service — it never reads or
writes user-service's database.

---

## 1. Install dependencies

```bash
cd services/link-service
npm install
```

## 2. Configure

```bash
cp .env.example .env
```

| Var | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | **Must match user-service's secret** — this service verifies tokens user-service issued |
| `PORT` | HTTP port (default 4001) |

## 3. Seed the platform catalog

Start MongoDB locally, then:

```bash
npm run seed       # idempotent upsert by slug
```

## 4. Run

```bash
npm run dev        # nodemon
# or
npm start
```

Health check: `GET http://localhost:4001/health`

---

## API

All routes are prefixed `/api`. Success → `{ data: ... }`, failure →
`{ error: { message, code } }`.

| Method | Route | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/platforms` | public | Active platforms for the wizard, ordered |
| `POST` | `/api/links` | required | Create/replace caller's links; `userId` in body must match token |
| `GET` | `/api/links/user/:userId` | public | Visible links, ordered (hot read path) |
| `PATCH` | `/api/links/user/:userId` | self | Whole-array replace (dashboard edits) |
| `DELETE` | `/api/links/user/:userId` | self | Removes the links document (204) |

**Auth model:** the JWT is issued by user-service and verified here with the
shared `JWT_SECRET` (the `sub` claim is the userId). Write routes additionally
enforce that the token's user matches the targeted `userId` — a user can only
modify their own links.

**URL resolution:** for non-custom links the full `url` is resolved server-side
from the platform's `urlTemplate` + `handle` (the client is never trusted to
build it). Unknown or inactive `platformSlug` values are rejected. Custom links
carry a raw `url` + `label` instead.

---

## Data models (MongoDB)

- **`platforms`** — the seeded catalog. Unique index on `slug`, filtered by
  `isActive` on the read path.
- **`links`** — one document per user (unique index on `userId`) holding all
  their link entries, so the public-profile read is a single query.

See [src/models/](src/models/) for the Mongoose schemas.

---

## Project structure

```
link-service/
├── src/
│   ├── routes/        platform.routes.js, link.routes.js
│   ├── controllers/   platform.controller.js, link.controller.js
│   ├── models/        platform.model.js, link.model.js
│   ├── middleware/    auth.middleware.js, validate.middleware.js
│   ├── db/            index.js (Mongo connection)
│   ├── seed/          platforms.seed.js
│   ├── utils/         resolveUrl.js
│   ├── app.js
│   └── server.js
├── .env.example
└── package.json
```

## Out of scope for now

No Docker, no gateway, no Redis caching, no Kafka events, and no cross-service
validation that a `userId` exists (a gateway concern, later).
