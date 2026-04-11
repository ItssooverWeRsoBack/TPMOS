# TPMOS Build Status

> This file is the single source of truth for build progress. It is updated after every meaningful task. A new LLM session reads this file first, before any other docs.

**Last updated:** 2026-04-11
**Last actor:** claude-opus-4-6
**Current phase:** MVP
**Current milestone:** M0 — Repo bootstrap, docs, CI
**Resume here:** Task M0.6 (GitHub Issue templates + labels) — see `docs/IMPLEMENTATION_PLAN_MVP.md` § M0

## Quick links for new sessions

1. **Start here:** [`docs/AGENTS.md`](docs/AGENTS.md) — briefing for any LLM picking up the project
2. **Plan:** [`docs/IMPLEMENTATION_PLAN_MVP.md`](docs/IMPLEMENTATION_PLAN_MVP.md) — milestones and task IDs
3. **Decisions:** [`docs/DECISIONS.md`](docs/DECISIONS.md) — append-only architecture log
4. **Product spec:** [`docs/PRD.md`](docs/PRD.md)
5. **Architecture spec:** [`docs/ARD.md`](docs/ARD.md)
6. **Data model:** [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)
7. **AI integration:** [`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md)
8. **Local dev:** [`docs/DEV.md`](docs/DEV.md)
9. **Deploy:** [`docs/DEPLOY.md`](docs/DEPLOY.md)

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
| 15 | Admin | ⏳ planned | M3 | PRD § FR-1 |

**Legend:** ✅ shipped | 🚧 in progress | ⏳ planned | 📦 placeholder | ❌ blocked

## Milestones

- [ ] **M0 — Bootstrap, docs, CI** (current)
  - [x] M0.1 git init + remote
  - [x] M0.2 Next.js scaffold (matching concept site stack)
  - [x] M0.3 Design tokens (indigo accent)
  - [x] M0.4 wrangler.toml with D1 + AI bindings
  - [x] M0.5 All canonical docs in `docs/`
  - [ ] M0.6 GitHub issue templates + labels + project board
  - [ ] M0.7 Vitest config + first passing test
  - [ ] M0.8 GitHub Actions (lint + typecheck + test + build)
  - [ ] M0.9 Cloudflare Pages project (manual one-time setup)
  - [ ] M0.10 First deploy verified at tpmos.torfinn.xyz
- [ ] M1 — Auth + AppShell + 15 route placeholders
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

**M0.6** — Create GitHub issue templates, labels, and Project board.
- Reference: `docs/IMPLEMENTATION_PLAN_MVP.md` § M0.6
- Files to add: `.github/ISSUE_TEMPLATE/*.yml`, `.github/labels.yml` (or `gh label create` commands)
- Acceptance: Repo has issue templates for `feature`, `bug`, `chore`, `doc`. Labels exist matching the scheme in `docs/AGENTS.md`. Project board created with Backlog/Ready/In-Progress/Review/Done columns.

## Blocked

(none)

## Next 3 actions

1. M0.6 — Issue templates + labels (above)
2. M0.7 — Vitest config + first passing test (`src/lib/tpmos/domain/__tests__/smoke.test.ts`)
3. M0.8 — GitHub Actions CI

## Recent decisions (full log in `docs/DECISIONS.md`)

- 2026-04-11 DEC-0010 Use Workers AI as default LLM provider, Anthropic Claude Haiku via env-var swap
- 2026-04-11 DEC-0009 Scaffold all 15 surfaces in MVP; 11 functional + 4 placeholders
- 2026-04-11 DEC-0008 Pull TPM Intake into MVP because B1+B2 AI hooks add high value there
- 2026-04-10 DEC-0007 Use dnd-kit over react-beautiful-dnd (React 19 compat)
- 2026-04-10 DEC-0006 Separate repo at `~/src/TPMOS/`, deployed to `tpmos.torfinn.xyz` (flipped from earlier colocation plan)
- 2026-04-10 DEC-0005 Cloudflare D1 (SQLite) for MVP, Postgres path via Hyperdrive if needed
- 2026-04-10 DEC-0004 Cloudflare Access for production auth, signed dev cookie for local
- 2026-04-10 DEC-0003 Modular monolith on Cloudflare Pages Functions, NOT k8s microservices
- 2026-04-10 DEC-0002 Static SPA + Pages Functions architecture (preserves Next.js static export)
- 2026-04-10 DEC-0001 Build TPMOS as a separate product from the existing concept site

## How to update this file

After completing any meaningful task:

1. Update `Last updated`, `Last actor`
2. Update `Current milestone` and `Resume here`
3. Tick the completed task checkbox under `Milestones`
4. Update the `Active task`, `Blocked`, and `Next 3 actions` sections
5. If a decision was made, append it to `docs/DECISIONS.md` and add the line here
6. Commit with message format: `Mx.y: <description>`
