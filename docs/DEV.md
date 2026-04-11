# DEV.md — Local Development Setup

## Prerequisites

- Node.js 20+
- npm 10+
- Cloudflare account (free tier is fine)
- Wrangler CLI: `npm install -g wrangler` (or use the local one in `package.json`)

## First-time setup

```bash
git clone https://github.com/ItssooverWeRsoBack/TPMOS.git
cd TPMOS
npm install

# Authenticate wrangler (one-time, opens browser)
npx wrangler login

# Create local D1 database
npx wrangler d1 create tpmos-local

# Apply migrations to local DB
npm run db:migrate:local

# Seed demo data
npm run db:seed:local
```

## Daily development

There are **two dev modes** because Cloudflare Pages Functions don't run under `next dev`:

### Mode A — UI iteration with mock API (fastest)

```bash
npm run dev
```

Runs `next dev` on `http://localhost:3000`. Mock API responses are returned by client-side hooks. Ideal for component work and CSS iteration. Hot reload is instant.

### Mode B — Full stack with Pages Functions + D1 (closer to prod)

```bash
npm run build
npm run pages:dev
```

Runs `wrangler pages dev` against the static `out/` directory plus the `functions/` directory bound to local D1. Use this when working on API handlers, auth flows, or anything backend-touching.

You will need to rebuild (`npm run build`) after every UI change in this mode. Slower iteration but real Workers runtime.

## Authentication in dev

Cloudflare Access is not active in local dev. Instead, use the dev login route:

```bash
# In another terminal, simulate logging in as the seeded TPM
curl -c cookies.txt "http://localhost:8788/api/tpmos/dev/login?email=tpm@example.com"
```

Or just visit `http://localhost:8788/api/tpmos/dev/login?email=tpm@example.com` in the browser. This sets a signed HMAC cookie that the middleware accepts when `ENV=local`.

**The dev login route returns 404 in production.** This is enforced in code at the top of the handler.

## Database operations

```bash
# Run a query
npx wrangler d1 execute tpmos-local --local --command "SELECT * FROM teams"

# Apply a new migration
npm run db:migrate:local

# Reseed
rm -f .wrangler/state/v3/d1/*.sqlite
npm run db:migrate:local
npm run db:seed:local
```

## Tests

```bash
npm test          # Run once
npm run test:watch # Watch mode
```

Domain functions in `src/lib/tpmos/domain/` and `functions/_lib/auth/can.ts` have 100% branch coverage. API handler tests use miniflare.

## Linting and typechecking

```bash
npm run lint
npm run typecheck
```

CI runs both on every PR.

## File watch tips

- `src/app/` and `src/components/` — UI, fast reload in `next dev`
- `functions/` — API handlers, requires rebuild + `pages:dev` restart
- `migrations/` — DB schema, requires `db:migrate:local`
- `docs/` — never affects runtime

## Common issues

| Symptom | Fix |
|---|---|
| `wrangler: command not found` | `npm install` first, then use `npx wrangler` |
| D1 errors about missing table | Run `npm run db:migrate:local` |
| Auth always returns 401 in `pages:dev` | You forgot to call `/api/tpmos/dev/login` first |
| `next dev` works but `pages:dev` shows old UI | Run `npm run build` again |
| Workers AI returns 401 | Workers AI binding requires authenticated wrangler — run `npx wrangler login` |
