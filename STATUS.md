# TPMOS Build Status

> This file is the single source of truth for build progress. It is updated after every meaningful task. A new LLM session reads this file first, before any other docs.

**Last updated:** 2026-04-13
**Last actor:** claude-opus-4-6
**Current phase:** MVP
**Current milestone:** M1 — Auth + AppShell + 15 route placeholders
**Resume here:** Task M1.1 (Pages Functions middleware) — see `docs/IMPLEMENTATION_PLAN_MVP.md` § M1

## Quick links for new sessions

1. **Start here:** [`docs/AGENTS.md`](docs/AGENTS.md) — briefing for any LLM picking up the project
2. **Plan:** [`docs/IMPLEMENTATION_PLAN_MVP.md`](docs/IMPLEMENTATION_PLAN_MVP.md) — milestones and task IDs
3. **Decisions:** [`docs/DECISIONS.md`](docs/DECISIONS.md) — append-only architecture log
4. **Product spec:** [`docs/PRD.md`](docs/PRD.md)
5. **Architecture spec:** [`docs/ARD.md`](docs/ARD.md)
6. **API design:** [`docs/API_DESIGN.md`](docs/API_DESIGN.md) — endpoint catalog and rationale
7. **Data model:** [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)
8. **AI integration:** [`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md)
9. **Local dev:** [`docs/DEV.md`](docs/DEV.md)
10. **Deploy:** [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Surfaces (15 total)

| # | Surface | State | Last touched | Owner doc |
|---|---|---|---|---|
| 1 | Auth / Login | ⏳ planned | M1 | PRD § FR-1 |
| 2 | Home (lite) | ⏳ planned | M3 | PRD § W1-W5 |
| 3 | Teams Directory | ⏳ planned | M3 | PRD § FR-2 |
| 4 | Team Detail | ⏳ planned | M3 | PRD § FR-2 |
| 5 | Quarterly Planning | ⏳ planned | M5/M6 | PRD § FR-5, FR-7 |
| 6 | Epic Detail | ⏳ planned | M5 | PRD § FR-5, FR-6 |
| 7 | Quarter Management | ⏳ planned | M3 | PRD § FR-3 |
| 8 | Leadership Goals | 📦 placeholder | M1 | PRD § FR-12 (Phase 2) |
| 9 | Initiative Mapping | 📦 placeholder | M1 | PRD § FR-12 (Phase 2) |
| 10 | Executive Visualizer | 📦 placeholder | M1 | PRD § FR-13 (Phase 2) |
| 11 | TPM Intake | ⏳ planned | M10 | PRD § FR-11 |
| 12 | Reporting/Export | 📦 placeholder | M1 | PRD § FR-14 (Phase 2) |
| 13 | Capacity | ⏳ planned | M4 | PRD § FR-4 |
| 14 | Risks Feed | ⏳ planned | M7 | PRD § FR-8 |
| 15 | Admin | ⏳ planned | M3 | PRD § FR-15 |

**Legend:** ✅ shipped | 🚧 in progress | ⏳ planned | 📦 placeholder | ❌ blocked

## Milestones

- [x] **M0 — Bootstrap, docs, CI** ✅
  - [x] M0.1 git init + remote
  - [x] M0.2 Next.js scaffold
  - [x] M0.3 Design tokens (indigo accent, oklch, status colors)
  - [x] M0.4 wrangler.toml with D1 + AI bindings
  - [x] M0.5 All canonical docs (PRD, ARD, IMPL_PLAN, DECISIONS, DATA_MODEL, AI_INTEGRATION, DEV, DEPLOY, AGENTS, API_DESIGN)
  - [x] M0.6 GitHub issue templates (4) + 40 labels (project board deferred to manual)
  - [x] M0.7 Vitest config + smoke test passing
  - [x] M0.8 GitHub Actions CI (lint + typecheck + test + build) — green
  - [x] M0.9 Cloudflare Pages project (created by owner, builds succeeding)
  - [x] M0.10 First deploy verified — Pages build green
- [ ] **M1 — Auth + AppShell + 15 route placeholders** (next)
- [ ] M2 — Data layer foundation (D1 schema, queries, can() helper)
- [ ] M3 — Teams + Quarters + Admin + Home
- [ ] M4 — Capacity planning
- [ ] M5 — Epics + Voting (WSJF)
- [ ] M6 — Planner board (above/below the line, dnd-kit)
- [ ] M7 — Status tracking + Risks feed
- [ ] M8 — Carry-forward + Quarter close
- [ ] M9 — AI hooks A1 + A2 (epic drafting + DoD lint)
- [ ] M10 — TPM Intake + AI hooks B1 + B2
- [ ] M11 — Polish + Seed + Demo + Final QA

## Active task

**M1.1** — Build Pages Functions middleware (`_middleware.ts`)
- File: `functions/api/tpmos/_middleware.ts`
- Reads Cf-Access-Authenticated-User-Email (prod) or HMAC dev cookie (local)
- Loads user from D1, attaches to context.data.user, rejects 401
- Spec: `docs/IMPLEMENTATION_PLAN_MVP.md` § M1.1
- Depends on: M2 for real user lookup (use hardcoded user until M2)

## Blocked

(none)

## Next 3 actions

1. M1.1 — Pages Functions middleware (auth boundary)
2. M1.2 — GET /api/tpmos/me endpoint
3. M1.4 — Build TPMOS AppShell (sidebar, top-bar, command palette)

## Recent decisions (full log in `docs/DECISIONS.md`)

- 2026-04-13 DEC-0013 No API versioning for MVP; URL prefix if external consumers appear
- 2026-04-13 DEC-0012 REST chosen over tRPC/GraphQL — justified by static-export constraint
- 2026-04-11 DEC-0011 Public repo: dev login route hard-gated to ENV=local
- 2026-04-11 DEC-0010 Workers AI default, Anthropic Claude Haiku via env-var swap
- 2026-04-11 DEC-0009 All 15 surfaces scaffolded; 11 functional + 4 placeholders

## How to update this file

After completing any meaningful task:

1. Update `Last updated`, `Last actor`
2. Update `Current milestone` and `Resume here`
3. Tick the completed task checkbox under `Milestones`
4. Update the `Active task`, `Blocked`, and `Next 3 actions` sections
5. If a decision was made, append it to `docs/DECISIONS.md` and add the line here
6. Commit with message format: `Mx.y: <description>`
