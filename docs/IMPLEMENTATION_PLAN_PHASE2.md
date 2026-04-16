# IMPLEMENTATION_PLAN_PHASE2.md

**Status:** Active
**Phase:** Phase 2 — Strategic mapping, executive surfaces, enhancements
**Last updated:** 2026-04-16

> Inherits all conventions from [`IMPLEMENTATION_PLAN_MVP.md`](IMPLEMENTATION_PLAN_MVP.md). Read [`AGENTS.md`](AGENTS.md) for operating rules.

---

## Milestones overview

| ID | Goal | Approx sessions |
|---|---|---|
| **P2-M1** | Leadership Goals — schema, API, UI, goal detail | 2 |
| **P2-M2** | Initiative/Product Mapping — many-to-many, gap/overlap detection | 2 |
| **P2-M3** | Executive Dashboard — rollups, heatmap, charts | 2 |
| **P2-M4** | Reporting/Export — snapshots, deltas, AI narrative, markdown | 2 |
| **P2-M5** | MVP enhancements — audit log UI, epic detail panel, home feed, command palette | 2 |
| **P2-M6** | Integration scaffolding — connector interface, stubs | 1 |

---

## P2-M1 — Leadership Goals

**Goal:** Goals CRUD with status tracking. Goal detail shows mapped initiatives and rolled-up progress from epics.

### Tasks
- P2-M1.1 Migration `0006_goals_initiatives.sql`: goals, initiatives, goal_initiative_map, initiative_epic_map tables
- P2-M1.2 Zod schemas: GoalSchema, CreateGoalSchema, InitiativeSchema, CreateInitiativeSchema
- P2-M1.3 DB queries: goals.ts, initiatives.ts (CRUD + mapping queries)
- P2-M1.4 API handlers: GET/POST/PATCH /api/tpmos/goals, GET /api/tpmos/goals/:id (with rollup)
- P2-M1.5 API client wrappers + TanStack Query hooks
- P2-M1.6 GoalCard, GoalForm components
- P2-M1.7 Goals page (replaces placeholder): list + create + status badges
- P2-M1.8 Goal detail: mapped initiatives, contributing teams, rolled-up progress bar
- P2-M1.9 Update STATUS.md

**Definition of Done:** Create 3 goals, see them listed with status. Click a goal to see its detail page (mapped initiatives placeholder until P2-M2).

---

## P2-M2 — Initiative / Product Mapping

**Goal:** Cross-cutting initiatives that bridge goals and team epics. Gap and overlap detection.

### Tasks
- P2-M2.1 API handlers: GET/POST/PATCH /api/tpmos/initiatives, GET /api/tpmos/initiatives/:id
- P2-M2.2 Mapping endpoints: POST/DELETE /api/tpmos/goals/:id/initiatives (link/unlink), POST/DELETE /api/tpmos/initiatives/:id/epics (link/unlink)
- P2-M2.3 Coverage query: goals with zero mapped epics (gap detection)
- P2-M2.4 Overlap query: epics mapped to multiple initiatives (overlap detection)
- P2-M2.5 InitiativeCard, InitiativeForm, MappingSelector components
- P2-M2.6 Initiatives page (replaces placeholder): list with contributing teams + epic count
- P2-M2.7 Initiative detail: mapped goals (up), mapped epics (down), contributing team badges
- P2-M2.8 Goal detail enhanced: shows linked initiatives with progress rollup
- P2-M2.9 Gap/overlap indicators on Goals and Initiatives pages
- P2-M2.10 Update STATUS.md

**Definition of Done:** Map 2 goals → 3 initiatives → 6 epics. See coverage gaps flagged. See one epic mapped to 2 initiatives flagged as overlap.

---

## P2-M3 — Executive Dashboard

**Goal:** Single-screen operational intelligence for leadership. Beautiful, dense, decision-useful.

### Tasks
- P2-M3.1 Dashboard data API: GET /api/tpmos/dashboard (aggregates across all teams for a quarter)
- P2-M3.2 Multi-team progress rollup component (stacked bar per team)
- P2-M3.3 Risk concentration heatmap (teams × risk count, color-coded)
- P2-M3.4 Goal coverage map (goals → % covered by mapped epics)
- P2-M3.5 Quarter summary stats (total epics, % done, at-risk count, behind-pace teams)
- P2-M3.6 Dashboard page (replaces placeholder): composed from above components
- P2-M3.7 AI hook B5: risk narrative endpoint + display
- P2-M3.8 Update STATUS.md

**Definition of Done:** Dashboard renders with real data from seed. All 4 visualizations display. Looks executive-presentable.

---

## P2-M4 — Reporting / Export

**Goal:** Weekly leadership reports with deltas and AI narrative.

### Tasks
- P2-M4.1 Migration `0007_reports.sql`: report_snapshots table
- P2-M4.2 Snapshot API: POST /api/tpmos/reports/snapshot (captures current quarter state as JSON)
- P2-M4.3 Report generation: GET /api/tpmos/reports/generate?quarter=...&format=md (builds markdown from latest snapshot + delta vs previous)
- P2-M4.4 AI hook B3: POST /api/tpmos/ai/narrate-report (takes structured data, returns executive narrative)
- P2-M4.5 AI prompt: prompts/narrate-report.ts
- P2-M4.6 ReportPreview component (rendered markdown with sections)
- P2-M4.7 Reports page (replaces placeholder): generate, preview, copy-as-markdown
- P2-M4.8 Update STATUS.md

**Definition of Done:** Generate a report for Q2 with seed data. Shows completions, risks, deltas. AI narrative renders. Copy-as-markdown works.

---

## P2-M5 — MVP Enhancements

**Goal:** Polish the existing surfaces based on gaps identified during MVP build.

### Tasks
- P2-M5.1 Audit log writes: add audit logging to epic create/update/delete, quarter lock/close, team create/archive
- P2-M5.2 Audit log UI: /admin/audit page with filterable log table
- P2-M5.3 Home page activity feed: recent epic updates, new risks, quarter events
- P2-M5.4 Epic detail side panel: sliding sheet for full epic view/edit without leaving planner
- P2-M5.5 Command palette: wire cmdk to real navigation (all surfaces) + epic search
- P2-M5.6 Theme clustering upgrade: embeddings via Workers AI bge-base-en instead of string matching
- P2-M5.7 Update STATUS.md

**Definition of Done:** Audit log shows recent actions. Home page has activity feed. Epic detail opens in a panel from the planner. Cmd-K navigates to any surface.

---

## P2-M6 — Integration Scaffolding

**Goal:** Connector interface and stubs ready for future implementation.

### Tasks
- P2-M6.1 Connector interface: functions/_lib/connectors/types.ts
- P2-M6.2 GitHub connector stub: sync epics from GitHub Issues
- P2-M6.3 Linear connector stub: sync epics from Linear projects
- P2-M6.4 Slack notification stub: post to channel on epic status change
- P2-M6.5 Connector registry and config table
- P2-M6.6 Update STATUS.md

**Definition of Done:** Interface defined. Stubs exist. No runtime dependencies — just the scaffolding for Phase 3 implementation.

---

## API endpoints added in Phase 2

| Method | Route | Milestone |
|---|---|---|
| GET POST | `/api/tpmos/goals` | P2-M1 |
| GET PATCH | `/api/tpmos/goals/:id` | P2-M1 |
| GET POST | `/api/tpmos/initiatives` | P2-M2 |
| GET PATCH | `/api/tpmos/initiatives/:id` | P2-M2 |
| POST DELETE | `/api/tpmos/goals/:id/initiatives` | P2-M2 |
| POST DELETE | `/api/tpmos/initiatives/:id/epics` | P2-M2 |
| GET | `/api/tpmos/dashboard` | P2-M3 |
| POST | `/api/tpmos/reports/snapshot` | P2-M4 |
| GET | `/api/tpmos/reports/generate` | P2-M4 |
| POST | `/api/tpmos/ai/narrate-report` | P2-M4 |
| GET | `/api/tpmos/admin/audit` | P2-M5 |
