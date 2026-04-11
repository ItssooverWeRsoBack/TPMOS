# AGENTS.md — Briefing for LLM Sessions

> If you are an LLM session picking up this project, **read this file first**, then read `STATUS.md`. After that you have enough context to make progress.

## What this project is

TPMOS (Technical Program Management Operating System) is a sub-product of `torfinn.xyz` deployed at `tpmos.torfinn.xyz`. It is a Linear-quality web app for engineering leaders to plan quarters, model capacity, vote on epics, track execution, and map work to leadership goals.

It is a **separate repo** from the concept-content site at `torfinn.xyz`. The two share design tokens but no code.

## How to pick up where the last session left off

**Read in this order:**

1. **`STATUS.md`** — current milestone, current task, blocked items, next 3 actions. Always up to date.
2. **`docs/IMPLEMENTATION_PLAN_MVP.md`** — milestone breakdown with task IDs (M0.1, M5.4, etc.). Find the task referenced in `STATUS.md` § Active task.
3. **`docs/PRD.md`** — what we're building and why
4. **`docs/ARD.md`** — how we're building it
5. **`docs/DECISIONS.md`** — every architectural decision with rationale. Read this **before** making any architectural change.
6. The relevant code files for the active task

That's enough to start working.

## Operating rules for LLM sessions

### Before starting work
- Read `STATUS.md` (always)
- Read the active task in `docs/IMPLEMENTATION_PLAN_MVP.md`
- Verify nothing has changed in the active task's dependencies (run `git log --since="last update of STATUS.md" --oneline`)
- If `STATUS.md` shows a task as "in progress" but you didn't start it, check `git status` to see if there's uncommitted work to resume

### While working
- One task at a time. Don't drift.
- Before introducing a new dependency, check `package.json` and `docs/DECISIONS.md`. Adding deps requires a decision entry.
- Before making an architectural change, write a `DEC-XXXX` entry in `docs/DECISIONS.md` first, then implement.
- Keep handlers ≤80 lines. Keep components ≤200 lines. Extract domain logic to `src/lib/tpmos/domain/`.
- Pure domain functions (`wsjf.ts`, `planner-line.ts`, `capacity.ts`, `carry-forward.ts`) live in `src/lib/tpmos/domain/` with **100% Vitest branch coverage**. No I/O, no React.
- Zod schemas in `src/lib/tpmos/schemas/` are imported by both client AND functions — single source of truth.
- All mutations use optimistic concurrency via `version` field + `If-Match` header.

### After finishing a task
1. Update `STATUS.md`:
   - `Last updated`, `Last actor`
   - Tick the task checkbox under `Milestones`
   - Update `Active task` to the next one
   - Update `Next 3 actions`
2. If a decision was made, append a `DEC-XXXX` entry to `docs/DECISIONS.md`
3. Commit with message format: `Mx.y: <one-line description>`
4. Push if explicit instructions allow

### Never do
- Never delete `STATUS.md`, `docs/AGENTS.md`, `docs/DECISIONS.md`, `docs/PRD.md`, `docs/ARD.md`, `docs/IMPLEMENTATION_PLAN_MVP.md`
- Never modify `wrangler.toml` or `next.config.ts` outside of explicit, planned tasks (these are infrastructure)
- Never commit `.dev.vars`, `.env`, or any file matching `.gitignore`
- Never bypass the `_middleware.ts` auth check in production handlers
- Never commit AI prompts that contain real user data
- Never enable the dev login route (`/api/tpmos/dev/login`) without `if (env.ENV !== 'local') return new Response('Not Found', { status: 404 })`. The repo is **public**.
- Never use `git push --force` to `main`
- Never amend a commit that's already pushed
- Never invoke real LLM APIs (cost) in tests — mock the AI provider
- Never make user-visible UI choices (color, layout, motion) without checking against the design language in `docs/PRD.md` § UX Requirements

### Git hygiene
- One task = one commit. Multiple commits per task is fine if they're logically separated.
- Commit message: `M{milestone}.{task}: <imperative one-line>`. Example: `M5.4: build VotePanel component`
- Body (optional): bullet list of files added/changed and why
- No co-authored-by lines. (Project owner preference.)
- If a hook fails, fix the underlying issue and commit again. Never `--no-verify`.

## Project conventions

### File structure
```
src/
  app/                      Next.js App Router routes (one per surface)
  components/tpmos/         All TPMOS UI components, grouped by domain
    shell/                  AppShell, sidebar, top-bar
    teams/                  Team CRUD components
    planner/                Drag-and-drop planner (the crown jewel)
    epic/                   Epic detail, vote, status
    capacity/               Capacity editor + bar
    progress/               Progress bars, risk feed
    intake/                 TPM intake interview UI (M10)
    ai/                     AI feature buttons (drafting, lint, synthesis)
    shared/                 Cross-cutting primitives (empty state, etc.)
  lib/tpmos/
    domain/                 Pure functions, fully tested, no React, no I/O
    schemas/                Zod schemas shared with functions
    api/                    Typed client wrappers around fetch
    hooks/                  React hooks (TanStack Query wrappers)
    auth/                   Client-side auth helpers
functions/
  api/tpmos/                Pages Functions (one file per route)
  _lib/
    db/                     D1 client + named queries
    domain/                 Server-side domain helpers
    auth/                   can() permission helper, JWT verification
    ai/                     AI provider abstraction (Workers AI / Anthropic / none)
migrations/                 D1 SQL migration files (numbered 0001_*.sql)
docs/                       All canonical project docs
```

### Naming
- Files: kebab-case (`vote-panel.tsx`)
- Components: PascalCase (`VotePanel`)
- Hooks: `use*` (`useCurrentUser`)
- Domain functions: camelCase (`computeWsjf`)
- Zod schemas: PascalCase + `Schema` suffix (`EpicSchema`)
- API routes: REST conventions (`/api/tpmos/epics/:id/votes`)
- Task IDs: `M{milestone}.{task}` (`M5.4`)

### Testing
- Domain functions: 100% branch coverage
- `can()` permission helper: full matrix coverage
- Zod schemas: round-trip parse tests
- API handlers: happy path test per endpoint via miniflare
- UI components: **no tests in MVP** — test the math and the contracts, not the React renders
- Manual QA checklist in `docs/QA.md` (created in M11)

### Comments
- Only comment what isn't obvious from the code itself
- Document *why*, not *what*
- Public domain functions get TSDoc with one-sentence description

## Surface placeholder convention

When a surface is in placeholder state (Phase 2 deferral), it must:

1. Render the standard `<PlaceholderSurface>` component
2. Show a "Coming in Phase 2" badge
3. List 3-5 bullet points of planned features pulled from `docs/PRD.md` § FR-X
4. Link to the GitHub issue tracking the surface (created in M0.6)
5. Be navigable from the sidebar (so the IA is locked from MVP)

This locks the information architecture from day 1. Phase 2 fills in pages, doesn't add nav items.

## AI feature conventions

- All LLM calls go through `functions/_lib/ai/provider.ts`
- Provider is selected by `AI_PROVIDER` env var: `workers-ai` (default) | `anthropic` | `none`
- When `none`, AI buttons hide gracefully — feature must work without AI
- Prompts live in `functions/_lib/ai/prompts/` as exported constants
- Never embed user data in tests
- Always show a "Drafted by AI — please review" indicator on AI-generated content
- Human always reviews before save

See `docs/AI_INTEGRATION.md` for the full hook catalog.

## Common runbook

### Add a new dependency
1. `npm install <pkg>`
2. Add a `DEC-XXXX` entry in `docs/DECISIONS.md` if it's not already covered by an existing decision
3. Update `STATUS.md` only if it changes the active task

### Add a new database column
1. Create a new migration: `migrations/000X_<name>.sql`
2. Update the relevant Zod schema in `src/lib/tpmos/schemas/`
3. Update the relevant query in `functions/_lib/db/queries/`
4. Run `npm run db:migrate:local` to verify
5. Update `docs/DATA_MODEL.md` if the change is structural

### Add a new API endpoint
1. Create handler in `functions/api/tpmos/<route>.ts`
2. Import shared Zod schema from `src/lib/tpmos/schemas/`
3. Use `_middleware.ts` for auth — never re-implement auth in a handler
4. Use `can(user, action, resource)` for authorization
5. Use prepared statements only — never string concat SQL
6. Add a typed client wrapper in `src/lib/tpmos/api/`
7. Add a happy-path test

### Add a new surface (rare; should match the 15-surface IA)
1. Confirm with the project owner that this is a new surface, not an extension
2. Add the route file under `src/app/`
3. Add the nav item in `src/components/tpmos/shell/sidebar.tsx`
4. Update `STATUS.md` § Surfaces table
5. Update `docs/PRD.md` § Required Pages

## When in doubt

- **Decision uncertain?** Check `docs/DECISIONS.md` first. If not covered, ask the project owner before deciding.
- **Architecture uncertain?** Re-read `docs/ARD.md`. If the answer isn't there, ask.
- **Scope uncertain?** Re-read `docs/PRD.md`. If the feature isn't in MVP scope, defer it.
- **Code uncertain?** Read 2 nearby files for the existing pattern. Match it.

## Repo metadata

- GitHub: `https://github.com/ItssooverWeRsoBack/TPMOS` (public)
- Owner: torfinn (`torfinnolsenpersonal` for personal commits)
- Branch model: `main` only for now; feature branches optional
- CI: GitHub Actions (lint + typecheck + test + build) — added in M0.8
- Deploy: Cloudflare Pages, custom domain `tpmos.torfinn.xyz` — set up in M0.9
