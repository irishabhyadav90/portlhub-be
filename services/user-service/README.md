# @portlhub/user-service

Owns auth, user identity, username uniqueness, and profile details for
**Portlhub**. Node.js + Express + PostgreSQL (via Drizzle ORM).

This is Phase 0: a single standalone service, no containers, no gateway. It
runs locally on its own port.

---

## 1. Install dependencies

```bash
cd services/user-service
npm install
```

## 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable         | Description                                  | Default               |
| ---------------- | -------------------------------------------- | --------------------- |
| `DATABASE_URL`   | Postgres connection string                   | —                     |
| `JWT_SECRET`     | Secret used to sign JWTs                      | —                     |
| `JWT_EXPIRES_IN` | Token lifetime (`15m`, `1h`, `7d`, …)        | `7d`                  |
| `PORT`           | HTTP port to listen on                       | `4000`                |

## 3. Set up PostgreSQL locally

Create a database for the service. If you have Postgres installed locally:

```bash
createdb portlhub_users
```

Or with `psql`:

```sql
CREATE DATABASE portlhub_users;
```

Then point `DATABASE_URL` at it, e.g.:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/portlhub_users
```

`drizzle.config.js` reads `DATABASE_URL` from `.env`, so there's nothing else to
configure for migrations.

## 4. Create the database tables (Drizzle migrations)

There are two ways to get the schema into your database. Both are wired up as
npm scripts.

### Option A — generate + migrate (recommended, version-controlled)

```bash
npm run db:generate   # reads src/db/schema.js, writes SQL into ./drizzle
npm run db:migrate    # applies the generated SQL to your database
```

- `db:generate` (`drizzle-kit generate`) diffs your schema against the existing
  migrations and writes a new, timestamped SQL migration file into `./drizzle`.
  These files are committed to git, so every environment applies the **same**
  ordered set of changes. This is what you want for anything shared or
  production-bound.
- `db:migrate` (`drizzle-kit migrate`) runs those committed SQL files against
  the database, tracking which have already been applied.

### Option B — push (fast local iteration, no migration files)

```bash
npm run db:push       # drizzle-kit push
```

- `db:push` compares your schema directly to the live database and applies the
  difference immediately — no SQL files written, no history kept.
- Great for quick local experimentation while the schema is changing rapidly.
- **Not** recommended for shared/production databases: there's no migration
  history, no review step, and it can be destructive.

**Rule of thumb:** use `push` while you're iterating solo on your laptop; switch
to `generate` + `migrate` once the schema needs to be reproducible across
environments.

You can also inspect data with Drizzle Studio:

```bash
npm run db:studio
```

## 5. Run the service

```bash
npm run dev    # nodemon, auto-reload on changes
# or
npm start      # plain node
```

You should see:

```
[user-service] listening on http://localhost:4000
```

Health check: `curl http://localhost:4000/health`

---

## API

Base path: `/api/users`. All responses are JSON. Errors use a consistent shape:

```json
{ "error": { "message": "...", "code": "..." } }
```

Validation errors additionally include a `fields` array.

### 1. Register — `POST /api/users/register`

```bash
curl -s -X POST http://localhost:4000/api/users/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "ada@example.com",
    "password": "supersecret",
    "username": "ada-lovelace"
  }'
```

**201 Created**

```json
{
  "user": {
    "id": "f6e1...",
    "username": "ada-lovelace",
    "email": "ada@example.com",
    "firstName": null,
    "lastName": null,
    "bio": null,
    "professionalTitle": null,
    "yearsOfExperience": null,
    "phone": null,
    "location": null,
    "profilePhotoUrl": null,
    "createdAt": "2026-06-23T10:00:00.000Z",
    "updatedAt": "2026-06-23T10:00:00.000Z"
  },
  "token": "eyJhbGciOi..."
}
```

`409` if the email (`EMAIL_TAKEN`) or username (`USERNAME_TAKEN`) is taken.

### 2. Login — `POST /api/users/login`

```bash
curl -s -X POST http://localhost:4000/api/users/login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "ada@example.com", "password": "supersecret" }'
```

**200 OK** → same `{ user, token }` shape as register. `401` on bad credentials.

### 3. Check username availability — `GET /api/users/check-username/:username`

Public, no auth.

```bash
curl -s http://localhost:4000/api/users/check-username/ada-lovelace
```

```json
{ "username": "ada-lovelace", "available": false }
```

### 4. Public profile — `GET /api/users/:username`

Public, no auth. Returns public fields only (no email, phone, or passwordHash).

```bash
curl -s http://localhost:4000/api/users/ada-lovelace
```

```json
{
  "user": {
    "id": "f6e1...",
    "username": "ada-lovelace",
    "firstName": null,
    "lastName": null,
    "bio": null,
    "professionalTitle": null,
    "yearsOfExperience": null,
    "location": null,
    "profilePhotoUrl": null,
    "createdAt": "2026-06-23T10:00:00.000Z"
  }
}
```

`404` (`USER_NOT_FOUND`) if no such user.

### 5. Get my profile — `GET /api/users/me`

Requires auth.

```bash
curl -s http://localhost:4000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

**200 OK** → `{ "user": { ...full profile excluding passwordHash } }`.

### 6. Update my profile — `PATCH /api/users/me`

Requires auth. Updatable: `firstName`, `lastName`, `bio`, `professionalTitle`,
`yearsOfExperience`, `phone`, `location`, `profilePhotoUrl`. Username and email
changes are intentionally **out of scope** in Phase 0.

```bash
curl -s -X PATCH http://localhost:4000/api/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "Ada",
    "lastName": "Lovelace",
    "professionalTitle": "Full Stack Developer",
    "yearsOfExperience": 7,
    "bio": "Building Portlhub.",
    "location": "London",
    "profilePhotoUrl": "https://example.com/ada.png"
  }'
```

**200 OK** → `{ "user": { ...updated profile } }`.

---

## End-to-end smoke test

```bash
# Register and capture the token
TOKEN=$(curl -s -X POST http://localhost:4000/api/users/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"supersecret","username":"ada-lovelace"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# Username should now be taken
curl -s http://localhost:4000/api/users/check-username/ada-lovelace

# Authenticated read
curl -s http://localhost:4000/api/users/me -H "Authorization: Bearer $TOKEN"

# Update profile
curl -s -X PATCH http://localhost:4000/api/users/me \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"firstName":"Ada","professionalTitle":"Full Stack Developer"}'

# Public profile
curl -s http://localhost:4000/api/users/ada-lovelace
```
