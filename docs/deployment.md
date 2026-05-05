# WC 2026 F2P Prize Planner — Deployment Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22 LTS | https://nodejs.org or `nvm install 22` |
| pnpm | 9+ | `npm install -g pnpm` |
| Git | any | https://git-scm.com |

You also need access to:
- The GitHub repo (`nolan595` account)
- Railway account (Postgres database)
- Netlify account (`nolan595`, site name `world-cup-calendar`)

---

## Environment variables

There is exactly one required environment variable:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string for the Railway Postgres instance | Railway dashboard → Project → Postgres service → Connect tab → copy "Postgres Connection URL" |

The connection string format is:
```
postgresql://postgres:<password>@<host>.railway.app:5432/<db>?sslmode=require
```

For local development, set this in `.env.local` (never `.env`). `.env.local` is in `.gitignore` and is not committed.

---

## Local development from scratch

```bash
# 1. Clone the repo
git clone https://github.com/nolan595/world-cup-calendar.git
cd world-cup-calendar

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env.local
# Open .env.local and fill in DATABASE_URL with the Railway connection string

# 4. Push the Prisma schema to the database (first time only)
pnpm db:push

# 5. Start the dev server
pnpm dev
```

The app is available at http://localhost:3000.

### Subsequent runs

After the first setup, only steps 5 is needed unless the schema has changed.

---

## How to run tests

Tests are unit tests only — they mock Prisma so no database connection is required.

```bash
pnpm test
```

To run in watch mode during development:

```bash
pnpm test:watch
```

Test files live in `__tests__/`. The suite covers:
- `GET /api/plans/[market]` — all response paths including DB errors
- `PUT /api/plans/[market]` — all response paths including validation failures

---

## How to build

```bash
pnpm build
```

The build runs `prisma generate` as part of the Next.js build process (Prisma generates the client from `prisma/schema.prisma`). No live database connection is needed at build time.

Output goes to `.next/`. The build is environment-agnostic — the `DATABASE_URL` is only consumed at runtime, not baked into the build artefact.

---

## Railway — Postgres database setup

### First-time setup

1. Create a new project in Railway (https://railway.app)
2. Add a Postgres service: **New** → **Database** → **PostgreSQL**
3. Once provisioned, go to the Postgres service → **Connect** tab → copy the **Postgres Connection URL**
4. Paste it into `.env.local` as `DATABASE_URL`
5. Apply the schema:

```bash
pnpm db:push
```

`db:push` introspects the schema and creates/updates the `plans` table directly. It does not generate a migration history — this is the right choice for a Railway hobby project.

If you want a full migration history instead (e.g. before a production launch):

```bash
pnpm db:migrate
```

This creates a migration file in `prisma/migrations/` and applies it. Commit the migration file to the repo.

### Viewing data

```bash
pnpm db:studio
```

Opens Prisma Studio at http://localhost:5555 — a browser UI for viewing and editing the `plans` table directly.

---

## Netlify — deploying the app

### First-time site setup

1. Go to https://app.netlify.com (account: `nolan595`)
2. **Add new site** → **Import an existing project** → connect the GitHub repo `nolan595/world-cup-calendar`
3. Netlify auto-detects `netlify.toml` — the build command and publish directory are already configured
4. Set the environment variable in Netlify:
   - Site settings → **Environment variables** → **Add variable**
   - Key: `DATABASE_URL`
   - Value: the Railway Postgres connection URL
5. Click **Deploy site**

The `@netlify/plugin-nextjs` plugin (declared in `netlify.toml` and installed as a dependency) handles all Next.js-specific adapter work — SSR, API routes, image optimisation.

### Ongoing deploys

Every push to `main` triggers an automatic deploy via Netlify's GitHub integration. No manual steps are needed.

The CI pipeline (`.github/workflows/ci.yml`) runs lint, typecheck, tests, and a build check before deploying. If any step fails, the deploy does not proceed.

---

## CI/CD pipeline

The pipeline runs on every push and pull request to `main`.

### Jobs

**`ci`** (runs on every push and PR):
1. Checkout
2. Install pnpm 9
3. Install Node 22
4. `pnpm install --frozen-lockfile`
5. `pnpm lint`
6. `pnpm typecheck`
7. `pnpm test`
8. `pnpm build`

**`deploy-staging`** (runs on push to `main` only, after `ci` passes):
1. Builds with `DATABASE_URL` from GitHub Secrets
2. Deploys to Netlify using the Netlify CLI action

### Required GitHub Secrets

Set these in the repo: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | Railway Postgres connection URL |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token (Netlify → User settings → Applications → Personal access tokens) |
| `NETLIFY_SITE_ID` | Found in Netlify → Site settings → General → Site ID |

---

## How auto-save works end-to-end

1. The user changes any prize value, toggle, or override in the planner UI
2. `useAutoSave` (in `lib/useAutoSave.ts`) starts a 1-second debounce timer
3. After 1 second of inactivity, it fires `PUT /api/plans/[market]` with the full planner state as `payload`
4. The API route validates the market slug (Zod) and the body shape, then calls `prisma.plan.upsert`
5. The `plans` table stores one row per market — on the first save for a market a row is created; all subsequent saves replace the `payload` JSON in full
6. On next page load, the app calls `GET /api/plans/[market]` and restores the saved state. If no row exists yet, `payload: null` is returned and the app renders defaults.

The save status indicator (Saving / Saved / Error) is driven by `useAutoSave.status`. An `AbortController` cancels the in-flight request if a newer save fires before the previous one completes.

---

## How to add a new market

1. **`lib/validation.ts`** — add the new slug to `VALID_MARKETS`
2. **`lib/constants.ts`** — add an entry to `COUNTRIES` (timezone offset, home matches), `STREAK_CONFIG` (prize segments and streak levels), and `MARKET_OPTIONS`
3. **`lib/types.ts`** — if `Market` is a separate type alias, update it (it is currently derived from `VALID_MARKETS` so step 1 handles it automatically)
4. Test locally: `pnpm dev`, select the new market in the UI
5. No database migration is needed — the schema is market-agnostic (one row per market slug, payload is a JSON blob)

---

## Rollback

### Application rollback

Netlify keeps a full deploy history. To revert to the previous deploy:

1. Netlify dashboard → **Deploys**
2. Click the last known-good deploy
3. Click **Publish deploy**

The previous build is served immediately — no rebuild is triggered.

### Database rollback

The `plans` table contains only current planner state (one JSON blob per market). There is no event log or history.

- If a bad deploy corrupts a market's payload, the simplest fix is to re-open that market and manually reset the values — the auto-save will overwrite the bad row.
- For a full data recovery, Railway provides automated daily backups on paid plans. Restore via the Railway dashboard → Postgres service → **Backups**.

---

## Checklist for a clean first deploy

- [ ] Railway Postgres instance provisioned
- [ ] `pnpm db:push` run against the Railway database
- [ ] `.env.local` set with `DATABASE_URL` for local dev
- [ ] GitHub repo pushed to `nolan595/world-cup-calendar`
- [ ] Netlify site connected to the GitHub repo
- [ ] `DATABASE_URL` set in Netlify environment variables
- [ ] `DATABASE_URL`, `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` added as GitHub Secrets
- [ ] First CI run passes (lint, typecheck, test, build)
- [ ] First Netlify deploy succeeds and app loads at `world-cup-calendar.netlify.app`
