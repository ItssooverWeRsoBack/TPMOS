# ARD — TPMOS Architecture Requirements Document

**Version:** 1.0 (locked after refinement on 2026-04-11)
**Status:** Active for MVP
**Owner:** Project owner (torfinn)
**Last updated:** 2026-04-11

> Architecture decisions are tracked in [`DECISIONS.md`](DECISIONS.md). The data model lives in [`DATA_MODEL.md`](DATA_MODEL.md). AI integration spec lives in [`AI_INTEGRATION.md`](AI_INTEGRATION.md). Build sequencing lives in [`IMPLEMENTATION_PLAN_MVP.md`](IMPLEMENTATION_PLAN_MVP.md).

---

## Executive Summary

TPMOS is delivered as a **client-side SPA at `tpmos.torfinn.xyz`** built on Next.js 16 with `output: "export"`, backed by **Cloudflare Pages Functions + D1**, authenticated via **Cloudflare Access**. It is a **modular monolith** organized by domain folders that scales to 1000+ users without architectural rework. AI features are gated behind a provider abstraction defaulting to free Cloudflare Workers AI, swappable to Anthropic Claude Haiku via env var. The architecture explicitly rejects microservices for MVP and explicitly preserves the existing concept site by living in a separate repo and Cloudflare Pages project.

---

## Current Repo Assessment (companion site)

The companion site at `~/src/systems-design-interview/` is a Next.js 16.2.1 + React 19 + TypeScript + Tailwind v4 + @base-ui/react + Zod static-export site with `output: "export"` and a Cloudflare Pages deployment via wrangler. It has a polished AppShell with sidebar/topbar/command-palette, dark-first theme, and existing IndexedDB persistence for studio artifacts.

**Critical constraint:** The companion site is a pure SSG site whose `next.config.ts` and `wrangler.toml` are flagged as protected. Any architecture for TPMOS that requires modifying these files in the companion repo is rejected.

**TPMOS lives in its own repo** (`~/src/TPMOS/`) deployed to a separate Cloudflare Pages project on `tpmos.torfinn.xyz`. The companion site only adds a single sidebar link to TPMOS in M1.10 — zero structural change.

---

## Architecture Options Compared

### Option A — Static SPA + Cloudflare Pages Functions + D1 (CHOSEN)

```
            tpmos.torfinn.xyz
                   │
                   ▼
       ┌─────────────────────────┐
       │   Cloudflare Pages       │
       │                         │
       │   Static assets (out/)  │ ← Next.js 16 static export
       │           +             │
       │   Pages Functions       │ ← functions/api/tpmos/*.ts
       │           ↓             │
       │       D1 binding        │ ← SQLite at the edge
       │           +             │
       │       AI binding        │ ← Workers AI
       └─────────────────────────┘
                   │
                   ▼
          Cloudflare Access
       (Google / GitHub / OTP)
```

**Pros:**
- Lowest blast radius — no companion site changes
- Native Cloudflare integration (D1, Workers AI, Access)
- Free demo cost
- Local dev mirrors prod (`wrangler pages dev`)
- Zero auth code in production
- Schema migrations via wrangler

**Cons:**
- D1 is SQLite (no JSONB, no full-text, ~10GB ceiling)
- No SSR for TPMOS pages (negligible — auth-gated app, not marketing)
- Two Pages projects to manage (acceptable for one author)

### Option B — Eject from static export, full Next.js SSR via @opennextjs/cloudflare

**Rejected.** Requires removing `output: "export"` from companion site. Massive blast radius. Not justified for an auth-gated app.

### Option C — Separate Next.js app on `tpmos.torfinn.xyz` (rejected variant: same Pages project, subpath routing)

**Rejected variant:** Tried to colocate. Created dependency entanglement, build coupling, and required touching protected files. Owner correctly pushed back.

**Chosen variant of C:** Separate repo, separate Pages project, separate subdomain. Same as Option A.

### Option D — Microservices on Kubernetes

**Explicitly rejected.** For 1000 users on a TPM tool the expected load is ~10 RPS average and ~100 RPS peak. A single Worker handles 10K+ RPS comfortably. K8s adds 100x ops cost for zero MVP benefit. Domain folder boundaries inside the monolith make later extraction trivial if it ever becomes warranted.

---

## Recommended Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 | Mirrors companion site, well-known, owner expertise |
| Rendering | Static export + client hydration | Mandatory — preserves Pages Functions coexistence |
| Routing | App Router with `'use client'` | TPMOS pages are interactive client components |
| Styling | Tailwind v4 | Already configured in companion site |
| UI primitives | shadcn-on-Base UI (port from companion) | Minimal new surface |
| State management | TanStack Query v5 + URL state | Server cache + URL-as-state for filters |
| Forms | React Hook Form + Zod resolver | Type-safe, low-ceremony |
| Drag & drop | dnd-kit | Headless, accessible, React 19 compatible |
| Charts | Recharts (MVP) → visx (Phase 2 if needed) | Fast to ship |
| Backend | Cloudflare Pages Functions | Coexists with static assets |
| API style | REST (JSON) | Simpler debugging; tRPC adds complexity to static export |
| Validation | Zod (shared client + functions) | Single source of truth |
| Database | Cloudflare D1 (SQLite) | Native binding, free, edge |
| Migrations | wrangler d1 migrations | Built in |
| Auth | Cloudflare Access (prod) + signed dev cookie (local) | Zero auth code |
| AI provider | Workers AI (default) → Anthropic Claude Haiku | Free → quality upgrade via env var |
| Email (Phase 2) | Resend free tier | 3K/month free |
| Observability | Cloudflare Analytics + Workers logs | Built in |

### New runtime dependencies

```
@base-ui/react              UI primitives (matches companion)
@dnd-kit/core
@dnd-kit/sortable
@dnd-kit/utilities          Drag-and-drop (planner)
@hookform/resolvers
react-hook-form             Forms with Zod validation
@tanstack/react-query       Server state
recharts                    Charts (MVP)
date-fns                    Date math (quarters)
nanoid                      ID generation
class-variance-authority
clsx
tailwind-merge              Tailwind utility composition (matches companion)
cmdk                        Command palette
framer-motion               Motion
lucide-react                Icons
zod                         Validation
```

### New dev dependencies

```
@cloudflare/workers-types
wrangler                    Cloudflare CLI + dev server
vitest                      Tests
tailwindcss + @tailwindcss/postcss
```

---

## Frontend Architecture

### Route map

```
/                                    Home (role-based redirect)              [M3]
/login                               Request access screen                   [M1]
/teams                               Teams Directory                         [M3]
/teams/[slug]                        Team Detail (Overview tab)              [M3]
/teams/[slug]/plan                   Quarterly Planning (planner)            [M5+M6]
/teams/[slug]/plan/[epicId]          Epic Detail (modal route)               [M5]
/teams/[slug]/capacity               Capacity editor                         [M4]
/teams/[slug]/board                  Status board                            [M7]
/quarters                            Quarter Management                      [M3]
/risks                               Cross-team Risks Feed                   [M7]
/intake                              TPM Intake list                         [M10]
/intake/[interviewId]                Interview detail                        [M10]
/intake/themes                       Theme cluster visualization             [M10]
/admin/users                         Admin user management                   [M3]
/admin/seed                          Demo seed (dev only)                    [M11]

/goals                               📦 placeholder Phase 2                  [M1]
/goals/[goalId]                      📦 placeholder Phase 2
/initiatives                         📦 placeholder Phase 2
/dashboard                           📦 placeholder Phase 2
/reports                             📦 placeholder Phase 2
```

### Folder layout

```
src/
  app/
    page.tsx                          (Home, role-based redirect)
    layout.tsx                        (Root layout with AppShell)
    login/page.tsx
    teams/page.tsx
    teams/[slug]/page.tsx
    teams/[slug]/plan/page.tsx
    teams/[slug]/plan/[epicId]/page.tsx
    teams/[slug]/capacity/page.tsx
    teams/[slug]/board/page.tsx
    quarters/page.tsx
    risks/page.tsx
    intake/page.tsx
    intake/[interviewId]/page.tsx
    intake/themes/page.tsx
    admin/users/page.tsx
    admin/seed/page.tsx
    goals/page.tsx                    (placeholder)
    goals/[goalId]/page.tsx           (placeholder)
    initiatives/page.tsx              (placeholder)
    dashboard/page.tsx                (placeholder)
    reports/page.tsx                  (placeholder)
  components/
    ui/                               Base UI primitives (port from companion)
    tpmos/
      shell/
        app-shell.tsx
        sidebar.tsx
        top-bar.tsx
        command-palette.tsx
        quarter-switcher.tsx
        role-badge.tsx
      teams/
        team-card.tsx
        team-form.tsx
        member-list.tsx
        member-row.tsx
      capacity/
        capacity-form.tsx
        capacity-bar.tsx
      planner/
        planner-board.tsx             ★ the crown jewel
        epic-card.tsx
        line-divider.tsx
        wsjf-badge.tsx
      epic/
        epic-form.tsx
        epic-detail-sheet.tsx
        vote-panel.tsx
        consensus-heatmap.tsx
        status-control.tsx
      progress/
        progress-bar.tsx
        time-elapsed-overlay.tsx
        risk-feed.tsx
      carry-forward/
        carry-forward-dialog.tsx
      ai/
        draft-button.tsx
        dod-lint-badge.tsx
        synthesize-button.tsx
      intake/
        interview-form.tsx
        interview-detail.tsx
        theme-chip.tsx
        theme-cluster-viz.tsx
      shared/
        placeholder-surface.tsx       ★ used by 4 deferred surfaces
        empty-state.tsx
        confirm-dialog.tsx
        page-header.tsx
        skeleton.tsx
  lib/
    tpmos/
      domain/                         Pure functions, 100% test coverage
        capacity.ts
        wsjf.ts
        planner-line.ts
        carry-forward.ts
        progress.ts
      schemas/                        Zod, shared client+functions
        user.ts
        team.ts
        quarter.ts
        capacity.ts
        epic.ts
        vote.ts
        interview.ts
      api/                            Typed client wrappers
        teams.ts
        quarters.ts
        capacity.ts
        epics.ts
        votes.ts
        risks.ts
        interviews.ts
        ai.ts
      hooks/
        use-current-user.ts
        use-current-quarter.ts
        use-team.ts
        use-epics.ts
      auth/
        client.ts
functions/
  api/
    tpmos/
      _middleware.ts                  Auth + CORS + error handling
      me.ts
      dev/
        login.ts                      ★ HARD-GATED to ENV=local, returns 404 in prod
      teams/
        index.ts
        [teamId].ts
        [teamId]/members.ts
      quarters/
        index.ts
        [quarterId].ts
        [quarterId]/lock.ts
        [quarterId]/close.ts
        [quarterId]/carry-forward.ts
      epics/
        index.ts
        [epicId].ts
        reorder.ts
        [epicId]/votes.ts
        [epicId]/status.ts
      capacity/
        [teamId]/[quarterId].ts
      risks/
        index.ts
      interviews/
        index.ts
        [interviewId].ts
      interview-themes/
        index.ts
      admin/
        users.ts
        seed.ts
      ai/
        draft-epic.ts
        lint-dod.ts
        synthesize-interview.ts
        cluster-themes.ts
  _lib/
    db/
      client.ts                       D1 prepared statement helpers
      queries/
        users.ts
        teams.ts
        quarters.ts
        capacity.ts
        epics.ts
        votes.ts
        interviews.ts
    auth/
      middleware.ts                   JWT verification / dev cookie
      can.ts                          Permission helper
    domain/                           Server-side domain helpers
      teams/
      quarters/
      epics/
      voting/
      capacity/
      carry-forward/
    ai/
      provider.ts                     Provider abstraction
      providers/
        workers-ai.ts
        anthropic.ts
        null.ts
      prompts/
        draft-epic.ts
        lint-dod.ts
        synthesize-interview.ts
migrations/
  0001_init.sql
  0002_capacity.sql
  0003_epics.sql
  0004_intake.sql
  0005_audit.sql
  seed.sql
docs/
  PRD.md
  ARD.md
  DECISIONS.md
  IMPLEMENTATION_PLAN_MVP.md
  DATA_MODEL.md
  AI_INTEGRATION.md
  DEV.md
  DEPLOY.md
  AGENTS.md
STATUS.md
README.md
```

### State management strategy

- **Server state:** TanStack Query — one query key per resource, optimistic updates for mutations, automatic invalidation on success
- **URL state:** quarter, team, filters — via `useSearchParams`
- **Local UI state:** `useState` — modals, drag preview, form drafts
- **No Redux. No Zustand.** Adding either is unjustified for this scope.

### Component design rules

- Container/presenter split where data fetching is involved
- No component over 200 lines
- All forms use React Hook Form + Zod resolver
- All async UI explicitly handles loading / error / empty
- Pure domain functions live in `src/lib/tpmos/domain/`; zero React, importable from tests

---

## Backend Architecture

### Pages Functions

Each route under `functions/api/tpmos/` is a small handler. Shared middleware in `_middleware.ts`:

1. Verifies Cloudflare Access JWT (or dev cookie)
2. Loads user from D1 by email
3. Attaches user to `context.data.user`
4. Rejects unauthenticated requests with 401
5. Adds CORS headers (none needed for same-origin, but safe defaults)

Each handler:

1. Parses request body with shared Zod schema
2. Authorizes via `can(user, action, resource)`
3. Reads/writes D1 via prepared statements
4. Returns JSON

**Handler size target: ≤80 lines.** If a handler grows beyond that, extract domain logic into `functions/_lib/domain/`.

### Domain boundaries

```
functions/_lib/
  domain/
    teams/         Team CRUD + membership business rules
    quarters/      Quarter lifecycle, locking, carry-forward
    epics/         Epic CRUD + status transitions
    voting/        Vote capture + WSJF computation
    capacity/      Capacity math
    auth/          Role/permission helpers
  ai/              LLM provider abstraction
  db/              D1 client + named queries
```

**Future microservice extraction:** any `functions/_lib/domain/X/` folder is copy-pasteable into a standalone Worker on the day extraction is warranted. We design for this; we do not implement it.

### API design (REST)

Full endpoint list in [`IMPLEMENTATION_PLAN_MVP.md`](IMPLEMENTATION_PLAN_MVP.md) § 5.5. Highlights:

- Mutations use `If-Match: <version>` header for optimistic concurrency. 409 on mismatch with current state.
- All requests return JSON. Errors include `{ error: { code, message } }`.
- Read endpoints support `?team=`, `?quarter=` query filters.
- Bulk operations: `POST /epics/reorder`, `POST /quarters/:id/carry-forward`.

---

## Auth Approach

### Production: Cloudflare Access

1. Configure an Access Application for `tpmos.torfinn.xyz/*` covering both static pages and `/api/*`
2. Allowed identity providers: Google + GitHub + email OTP
3. Pages Functions middleware reads `Cf-Access-Authenticated-User-Email`, looks up the user in `users` table by email
4. First-time login: user auto-created with `role='pending'`; admin promotes them
5. **Cost:** $0 up to 50 users. Above 50: Cloudflare Zero Trust paid (~$3/user/month).

### Local development: signed dev cookie

1. `/api/tpmos/dev/login?email=...` (gated by `env.ENV === 'local'`) sets an HMAC-signed cookie
2. Middleware accepts dev cookie when `ENV=local`
3. Same user lookup path

**The dev login route returns 404 in production.** This is enforced in code at the top of the handler. Verified by CI smoke test against the deployed site.

### Migration path off Cloudflare Access

If cost or UX becomes a constraint:
- Replace middleware's JWT verification with magic-link verification (Resend + signed token)
- One file changes: `functions/_lib/auth/middleware.ts`
- Add a `magic_links` table

---

## Data / Storage Approach

| Option | Free? | Local dev | Edge fit | SQL | Choice |
|---|---|---|---|---|---|
| **Cloudflare D1** | **5GB / 5M reads-day / 100K writes-day** | **`wrangler dev`** | **Native** | **SQLite** | **MVP** |
| Turso (libSQL) | 9GB / 1B reads / 1B row-writes mo | Excellent | Edge replicas | SQLite | Runner-up |
| Supabase | 500MB Postgres + auth | Good | Not edge | Postgres | Phase 3+ option |
| Neon | 0.5GB free, branching | Good | Via Hyperdrive | Postgres | Phase 3+ option |
| SQLite file | Free | Excellent | No | SQLite | Doesn't work on Pages |
| KV | Free | OK | Native | KV | Wrong shape |

**Decision: D1 for MVP.** Migrate to Turso or Neon-via-Hyperdrive only if D1 limits become real. Schema is portable.

---

## Integration Strategy (designed for, not implemented)

A clean **connector interface** is defined now so future GitHub/Linear/Notion/Slack integrations don't require refactoring:

```ts
interface Connector {
  id: string;
  type: 'github' | 'linear' | 'notion' | 'slack';
  syncEpics?(team: Team, quarter: Quarter): Promise<EpicDraft[]>;
  syncStatus?(epic: Epic): Promise<EpicStatusUpdate>;
  notify?(event: TpmosEvent): Promise<void>;
}
```

- Stored in `connectors` table (Phase 2)
- Triggered by Cloudflare Cron Triggers or manually
- Each connector lives in `functions/_lib/connectors/<vendor>/`
- **No connectors in MVP.** Just the interface and one stub.

---

## Deployment Strategy

1. **Companion site:** Unchanged. Push to `main` of `systems-design-interview` → Cloudflare Pages build → static `/out` deployed.
2. **TPMOS:**
   - New Cloudflare Pages project bound to the `TPMOS` repo
   - `main` branch → auto-deploy
   - Pages Functions in `functions/api/tpmos/` are auto-discovered
   - `wrangler.toml` declares D1 binding (database created via wrangler CLI)
   - Schema migrations run via `npm run db:migrate:prod` from local before each deploy that touches schema
   - Custom domain `tpmos.torfinn.xyz` set in dashboard
   - Cloudflare Access policy gates all routes

Full setup steps in [`DEPLOY.md`](DEPLOY.md).

---

## Local Dev Strategy

Two modes:

```bash
# Mode A — UI iteration with mock API (fastest)
npm run dev

# Mode B — Full stack with Pages Functions + D1
npm run build && npm run pages:dev
```

Authentication in dev: `/api/tpmos/dev/login?email=tpm@example.com` sets a signed HMAC cookie. Route is hard-gated to `env.ENV === 'local'`.

Full setup in [`DEV.md`](DEV.md).

---

## Testing Strategy

| Layer | Tool | Coverage target |
|---|---|---|
| Pure domain functions (`wsjf.ts`, `planner-line.ts`, `capacity.ts`, `carry-forward.ts`) | Vitest | **100% branch** |
| `can()` permission helper | Vitest | **100% matrix** |
| Zod schemas | Vitest + Zod | round-trip parse |
| API handlers | Vitest + miniflare | happy path per endpoint |
| UI components | None for MVP | — |
| End-to-end | Manual checklist in `docs/QA.md` | All 11 functional surfaces |

**Skeptical note:** Don't write component tests for shadcn-style primitives. Don't unit-test handlers that are just "parse, query, return." Test the math and the policy.

---

## Observability Strategy

- Cloudflare Workers logs (`wrangler tail`)
- Cloudflare Pages Analytics for traffic
- Structured `console.log` in functions: `{ requestId, userId, action, durationMs }`
- Phase 2: Logpush to R2 for retention

---

## Security Considerations

| Concern | Mitigation |
|---|---|
| Auth bypass | Cloudflare Access in front of every route |
| **Public repo + dev login route** | **Hard gate `env.ENV !== 'local'` returns 404; CI smoke test verifies** |
| CSRF | Same-origin only; cookies SameSite=Strict |
| SQL injection | D1 prepared statements only; never string concat |
| Authorization bugs | Single `can(user, action, resource)` helper; 100% test coverage |
| Mass assignment | Zod schemas pick exactly the allowed fields |
| Rate limiting | Cloudflare Workers built-in (Phase 2 if abuse seen) |
| PII | Email + display name only; no sensitive fields in MVP |
| Audit | `audit_log` table written for create/update/delete/lock (Phase 2 UI) |
| Secrets | `wrangler secret put` — never in repo |
| AI prompt injection | Synthesized AI output never auto-executes; always human review |

---

## Scale Path to 1000+ Users

| Scale | Bottleneck | Action |
|---|---|---|
| 1–50 users | None | Free tier sufficient |
| 50–200 users | Cloudflare Access free cap | Access paid OR magic-link auth |
| 200–1000 users | D1 writes near 100K/day | D1 paid ($5/mo, 25M writes/day) |
| 1000+ users | D1 storage or write contention | Migrate to Turso or Neon-via-Hyperdrive |
| 5000+ users | Single monolith handlers feel cramped | Extract `/integrations` and `/reports` to dedicated Workers (paste folder, deploy) |
| Multi-tenant | Single org_id hardcoded | Implement org switcher; schema already supports `org_id` |

**The architecture already accommodates each step.** None requires a rewrite.

---

## Migration Plan from Demo to Production

1. **Demo → first real users:** add Cloudflare Access policy, run `npm run db:migrate:prod`, seed first admin.
2. **First org → multi-org:** un-hardcode `org_id`, add org switcher, extend Access policy. Existing data already namespaced.
3. **D1 → Postgres (only if needed):** Generate Postgres-compatible schema, dump+restore data, swap D1 client for `node-postgres` over Hyperdrive. Estimated effort: 1 day because the query layer is centralized in `functions/_lib/db/queries/`.

---

## Key Tradeoffs (re-stated, sharper)

1. **Static SPA over SSR.** TPMOS pages will not be server-rendered. Brief skeleton state on first paint. Worth it to preserve the companion site.
2. **D1 over Postgres.** No JSONB, no full-text. Worth it for $0 hosting and zero ops.
3. **REST over tRPC.** Less type magic, more debuggability, no static-export complications. Worth it for MVP.
4. **Cloudflare Access over custom auth.** ~0 auth code. Migration plan in place. Worth it.
5. **Modular monolith over microservices.** Pushed back on the original brief. Strongly worth it.
6. **Async voting over live sessions.** Lower complexity, same outcome. Worth it.
7. **No real-time collaboration.** Optimistic + version field handles edits cleanly. Worth it.
8. **MVP = planning loop + intake only.** 4 surfaces explicitly Phase 2. Worth it — coherent vertical slice beats broad half-platform.
9. **Workers AI default, Anthropic via env var.** $0 demo, quality upgrade is one variable. Worth it.
10. **Separate repo over colocation.** Clean isolation, independent iteration, simple auth scope. Worth it.

---

## Risks / Unknowns (architectural)

1. Verify Cloudflare Pages Functions co-deploy correctly alongside Next.js static export. Validated in M0.10.
2. dnd-kit + React 19 — verify with a one-component spike before building the full planner (M6.1).
3. Cloudflare Access JWT verification in Pages Functions — verify in M1 spike.
4. Tailwind v4 + Recharts — verify charts render correctly with CSS variables.
5. D1 migrations under wrangler — verify the migration tool works as expected (M2 first migration is the test).
6. Workers AI quality for B1/B2 — fallback to Anthropic Haiku is one env var if quality is insufficient.
