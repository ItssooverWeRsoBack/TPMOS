# IMPLEMENTATION_PLAN_MVP.md

**Version:** 1.0 (locked after refinement on 2026-04-11)
**Phase:** MVP
**Owner:** Project owner (torfinn)
**Last updated:** 2026-04-11

> This document is the **build playbook**. It is the working artifact that drives every coding session. After MVP ships, a `POSTMORTEM_MVP.md` will be written and a separate `IMPLEMENTATION_PLAN_PHASE2.md` will be created. Read [`STATUS.md`](../STATUS.md) first to know which task is active.

---

## How to use this document

1. Read [`STATUS.md`](../STATUS.md) to find the active task ID (e.g., `M5.4`)
2. Find that task in this document
3. Implement it, making no scope drift
4. Update `STATUS.md` (tick checkbox, advance active task, update next 3)
5. If a decision was made, append to [`DECISIONS.md`](DECISIONS.md)
6. Commit with `Mx.y: <description>`

Each task has:
- **File(s):** what to create or modify
- **Depends on:** other task IDs
- **Blocks:** task IDs that need this first
- **Acceptance:** what "done" looks like
- **Tests:** what to add (if anything)

---

## Tracking & resumability mechanism

The file-based status mechanism is the backbone of LLM resumability:

- **`STATUS.md`** at repo root — current state, active task, next 3 actions. Updated after every task. **Read first by every new session.**
- **`docs/AGENTS.md`** — briefing for new LLM sessions. Repo conventions, operating rules, safety gates.
- **`docs/DECISIONS.md`** — append-only architecture decision log. Append before changing architecture.
- **`docs/IMPLEMENTATION_PLAN_MVP.md`** — this document. Task IDs and acceptance criteria.
- **GitHub Issues** with structured labels — visible in `gh issue list --label "milestone:m5"`. Every task has an issue. Project board with Backlog/Ready/In-Progress/Review/Done columns.
- **Commit message format:** `Mx.y: <description>`. Enables `git log --grep="M5\."` to retrieve all M5 work.

A new LLM session in 6 months can:
1. Read `AGENTS.md` (5 min) → knows the project
2. Read `STATUS.md` (1 min) → knows where to resume
3. Open `IMPLEMENTATION_PLAN_MVP.md` to the active task → knows exactly what to build
4. Reference `DECISIONS.md` only when about to make a decision

This is sufficient for full resumability.

---

## Milestones overview

| ID | Goal | Approx sessions |
|---|---|---|
| **M0** | Repo bootstrap, all docs, CI | 1 |
| **M1** | Auth + AppShell + 15 route placeholders | 2 |
| **M2** | Data layer foundation (D1 schema, queries, can() helper) | 2 |
| **M3** | Teams + Quarters + Admin + Home | 3 |
| **M4** | Capacity planning | 1 |
| **M5** | Epics + Voting (WSJF) | 3 |
| **M6** | Planner board (above/below the line) | 3 |
| **M7** | Status tracking + Risks feed | 2 |
| **M8** | Carry-forward + Quarter close | 1 |
| **M9** | AI hooks A1 + A2 (epic drafting + DoD lint) | 2 |
| **M10** | TPM Intake + AI hooks B1 + B2 | 3 |
| **M11** | Polish + Seed + Demo + Final QA | 2 |

Each milestone is independently shippable to a Cloudflare Pages preview.

---

## M0 — Repo bootstrap, docs, CI

**Goal:** New repo exists with all process artifacts and zero functional code. A new LLM session reading `STATUS.md` can begin M1 immediately.

### M0.1 — git init + remote
- **Cmd:** `git init -b main && git remote add origin https://github.com/ItssooverWeRsoBack/TPMOS.git`
- **Acceptance:** Local `.git` exists with origin set
- **Status:** ✅ done

### M0.2 — Next.js scaffold
- **Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`
- **Acceptance:** `npm install && npm run build` succeeds
- **Note:** Manual scaffold (not `create-next-app`) to match companion site exactly
- **Status:** ✅ done

### M0.3 — Design tokens
- **File:** `src/app/globals.css`
- **Acceptance:** Tailwind v4 with `oklch` design tokens, indigo accent, dark-first theme, status colors defined as CSS variables
- **Status:** ✅ done

### M0.4 — wrangler.toml with D1 + AI bindings
- **File:** `wrangler.toml`
- **Acceptance:** Has `pages_build_output_dir = "./out"`, D1 binding placeholder (real ID added in DEPLOY), Workers AI binding, env vars for `ENV` and `AI_PROVIDER`
- **Status:** ✅ done

### M0.5 — All canonical docs
- **Files:** `docs/PRD.md`, `docs/ARD.md`, `docs/IMPLEMENTATION_PLAN_MVP.md`, `docs/DECISIONS.md`, `docs/DATA_MODEL.md`, `docs/AI_INTEGRATION.md`, `docs/DEV.md`, `docs/DEPLOY.md`, `docs/AGENTS.md`, `STATUS.md`, `README.md`
- **Acceptance:** All docs exist with full content, cross-linked
- **Status:** ✅ done

### M0.6 — GitHub Issue templates + labels + Project board
- **Files:** `.github/ISSUE_TEMPLATE/feature.yml`, `bug.yml`, `chore.yml`, `doc.yml`, `.github/labels.yml` (or `gh label create` commands)
- **Cmd:** `gh label create` for each label, `gh project create` for the board
- **Labels to create:**
  - `phase:mvp`, `phase:p2`, `phase:p3`
  - `milestone:m0` … `milestone:m11`
  - `surface:auth`, `surface:teams`, `surface:planner`, `surface:epic`, `surface:capacity`, `surface:quarters`, `surface:risks`, `surface:intake`, `surface:admin`, `surface:home`, `surface:goals`, `surface:initiatives`, `surface:dashboard`, `surface:reports`
  - `type:feature`, `type:bug`, `type:doc`, `type:chore`, `type:spike`
  - `status:blocked`, `status:in-progress`
  - `ai:a1`, `ai:a2`, `ai:b1`, `ai:b2`
  - `good-llm-session`
- **Acceptance:** All labels exist, issue templates work in `gh issue create`, project board has 5 columns
- **Tests:** none

### M0.7 — Vitest config + first passing test
- **Files:** `vitest.config.ts`, `src/lib/tpmos/domain/__tests__/smoke.test.ts`
- **Acceptance:** `npm test` runs and passes one trivial test
- **Tests:** the smoke test itself

### M0.8 — GitHub Actions CI
- **Files:** `.github/workflows/ci.yml`
- **Steps:** install, lint, typecheck, test, build
- **Acceptance:** PR checks run on push
- **Tests:** none (CI is the test)

### M0.9 — Cloudflare Pages project (manual one-time)
- **Action:** Create Pages project in Cloudflare dashboard, connect to GitHub repo, set framework preset = Next.js Static, configure env vars, save
- **Document:** Steps go in `docs/DEPLOY.md` (already done)
- **Acceptance:** Pages project exists and builds successfully on push to main

### M0.10 — First deploy verified
- **Action:** Push to main, wait for Pages build, verify `tpmos.torfinn.xyz` returns the M0 placeholder page
- **Acceptance:** `curl -I https://tpmos.torfinn.xyz` returns 200 (or 302 if Access is already configured)

**M0 Definition of Done:** `tpmos.torfinn.xyz` returns 200. STATUS.md exists and is current. All docs exist. CI green.

---

## M1 — Auth + AppShell + 15 route placeholders

**Goal:** Every surface exists as a route. Auth gate works. Sidebar nav reflects all 15 items. Placeholder surfaces are designed, not blank.

### M1.1 — Pages Functions middleware
- **File:** `functions/api/tpmos/_middleware.ts`
- **Behavior:** Reads `Cf-Access-Authenticated-User-Email` (prod) or HMAC dev cookie (local). Loads user from D1 by email. Attaches to `context.data.user`. Rejects with 401 if not found. Skips auth for `/api/tpmos/dev/login` (which itself is gated by ENV).
- **Depends on:** M2 (users table) — for now, return a hardcoded user object until M2 lands. Tag with `// TODO M2` comment.
- **Tests:** none in M1

### M1.2 — `GET /api/tpmos/me`
- **File:** `functions/api/tpmos/me.ts`
- **Returns:** `{ user: { id, email, displayName, role } }` from middleware context
- **Acceptance:** Authenticated request returns user JSON; unauthenticated returns 401

### M1.3 — `useCurrentUser` hook + auth context
- **Files:** `src/lib/tpmos/hooks/use-current-user.ts`, `src/lib/tpmos/auth/client.ts`
- **Behavior:** TanStack Query wrapper around `/api/tpmos/me`. Provides `{ user, isLoading, isError }`.
- **Acceptance:** Components can call `const { user } = useCurrentUser()` and re-render on login change

### M1.4 — TPMOS AppShell
- **Files:** `src/components/tpmos/shell/app-shell.tsx`, `sidebar.tsx`, `top-bar.tsx`, `command-palette.tsx`, `role-badge.tsx`
- **Layout:** Left sidebar with all 15 nav items, top bar with quarter switcher placeholder + role badge + theme toggle
- **Source:** Port from companion site `src/components/layout/`, adapt for TPMOS nav structure
- **Acceptance:** Renders on every route, sidebar items are clickable

### M1.5 — Create all 15 route files
- **Files:** all 20 route files listed in ARD § "Route map" (some surfaces have sub-routes)
- **Content:** Each functional-but-deferred surface uses `<PlaceholderSurface phase="m3" />`. Placeholder-forever surfaces use `<PlaceholderSurface phase="p2" />`.
- **Acceptance:** Clicking any sidebar item navigates without 404

### M1.6 — `<PlaceholderSurface>` component
- **File:** `src/components/tpmos/shared/placeholder-surface.tsx`
- **Props:** `{ title, phase: 'mX' | 'p2', plannedFeatures: string[], prdSection?: string, githubIssueUrl?: string }`
- **Visual:** Centered card with title, phase badge, bullet list of planned features, two links (PRD section, GH issue)
- **Acceptance:** Renders cleanly on every placeholder route

### M1.7 — Sidebar nav with role-aware visibility
- **File:** `src/components/tpmos/shell/sidebar.tsx`
- **Behavior:** Items include all 15. Admin link only visible to admin. Reports/Dashboard hidden if exec-only and user is IC.
- **Acceptance:** Visibility correct per role

### M1.8 — "Request Access" screen for `role=pending`
- **File:** `src/app/login/page.tsx`
- **Behavior:** Shows when middleware returns user with `role=pending`. Friendly message + admin contact link.
- **Acceptance:** Pending users see this; promoted users skip to home

### M1.9 — Dev login route
- **File:** `functions/api/tpmos/dev/login.ts`
- **Behavior:** **HARD GATE:** `if (env.ENV !== 'local') return new Response('Not Found', { status: 404 })`. Otherwise, accepts `?email=` query, validates with Zod, sets HMAC-signed cookie.
- **CRITICAL:** Public repo. Hard gate verified by code review and CI smoke test.
- **Acceptance:** Local: works. Production: returns 404.
- **Tests:** vitest test that calls handler with `env.ENV='production'` and asserts 404

### M1.10 — Concept site coordination: add TPMOS sidebar link
- **File (cross-repo):** `~/src/systems-design-interview/src/components/layout/sidebar.tsx`
- **Action:** Add a single nav item "TPMOS" with `external-link` icon → `https://tpmos.torfinn.xyz`
- **Commit (in companion repo):** Single commit, separate from TPMOS commits
- **GUARD:** Pause and confirm with project owner before making this cross-repo edit
- **Acceptance:** Companion site has the new link, builds cleanly, deploys

### M1.11 — Update STATUS.md
- Mark M1 complete; advance to M2.1

**M1 Definition of Done:** Authenticated user lands on `/`, sees all 15 sidebar items, can navigate to each. Placeholder surfaces render correctly. Companion site has the new TPMOS link.

---

## M2 — Data layer foundation

**Goal:** D1 schema for users/teams/quarters. Typed query layer. Permission helper. TanStack Query setup.

### M2.1 — Migration `0001_init.sql`
- **File:** `migrations/0001_init.sql`
- **Content:** orgs, users, teams, team_members, quarters (see DATA_MODEL.md)
- **Apply:** `npm run db:migrate:local`
- **Acceptance:** Tables exist, default org seeded

### M2.2 — D1 client helper
- **File:** `functions/_lib/db/client.ts`
- **Behavior:** Wraps `env.DB.prepare()` with type helpers. Exports `query<T>`, `first<T>`, `run`, `batch`.
- **Acceptance:** Used by query files; no string concat

### M2.3 — Query files
- **Files:** `functions/_lib/db/queries/users.ts`, `teams.ts`, `quarters.ts`
- **Behavior:** Named query functions per entity. Return typed results.
- **Acceptance:** Each query is a single function with explicit input + return type

### M2.4 — Zod schemas
- **Files:** `src/lib/tpmos/schemas/user.ts`, `team.ts`, `team-membership.ts`, `quarter.ts`
- **Acceptance:** Each schema has `Schema`, `Input`, and inferred `T` exports. Imported by both client and functions.

### M2.5 — `can()` permission helper
- **File:** `functions/_lib/auth/can.ts`
- **Behavior:** `can(user, action: ActionName, resource?: Resource): boolean`
- **Action enum:** matches the permissions matrix in DATA_MODEL.md
- **Tests:** **100% matrix coverage** in `__tests__/can.test.ts`
- **Acceptance:** Tests pass for every (role, action, ownership) combination

### M2.6 — TanStack Query provider
- **File:** `src/app/layout.tsx` (wrap children) + `src/lib/tpmos/api/query-client.ts`
- **Acceptance:** Query devtools work in dev; queries stale-time set to 30s default

### M2.7 — Typed API client wrappers
- **Files:** `src/lib/tpmos/api/teams.ts`, `quarters.ts`
- **Acceptance:** Each function takes typed input, returns `Promise<T>`, handles error responses

### M2.8 — Seed script
- **File:** `migrations/seed.sql`
- **Content:** Default org, 1 admin, 1 TPM, 3 teams, 8 ICs, current quarter
- **Apply:** `npm run db:seed:local`
- **Acceptance:** Local DB has demo data after seeding

### M2.9 — Wire `_middleware.ts` to real user lookup
- **File:** `functions/api/tpmos/_middleware.ts`
- **Action:** Replace M1.1's hardcoded user with actual D1 lookup
- **Acceptance:** Authenticated users resolve correctly; new users auto-create with `role=pending`

### M2.10 — Update STATUS.md

**M2 Definition of Done:** `wrangler d1 execute tpmos-local --command "select * from teams"` returns seed teams. `can()` tests pass at 100%. `useCurrentUser()` returns real data from D1.

---

## M3 — Teams + Quarters + Admin + Home

**Goal:** Functional CRUD on teams, members, quarters. Admin can manage users. Home is a working role-based redirect.

### Tasks
- M3.1 GET/POST/PATCH/DELETE `/api/tpmos/teams` handlers
- M3.2 GET/POST/DELETE `/api/tpmos/teams/:id/members`
- M3.3 GET/POST/PATCH `/api/tpmos/quarters` + auto-create logic for current calendar quarter
- M3.4 GET/PATCH `/api/tpmos/admin/users` (admin only)
- M3.5 Build `<TeamCard>`, `<TeamForm>`, `<MemberList>`, `<MemberRow>` components
- M3.6 Teams Directory page (functional)
- M3.7 Team Detail page with tabs (Overview / Plan / Capacity / Board); only Overview functional
- M3.8 Quarter switcher in top bar — global quarter context via URL state
- M3.9 Quarter Management page (functional: list, create next, switch active)
- M3.10 Admin user management page (functional)
- M3.11 Home page: role-based redirect (TPM→risks placeholder until M7, EM→own team, IC→own team, Exec→placeholder dashboard)
- M3.12 Update STATUS.md

**M3 Definition of Done:** Can create a team via UI, add 5 members, switch quarter via top bar, promote a pending user to TPM role.

---

## M4 — Capacity planning

**Goal:** Capacity plans CRUD with the math right.

### Tasks
- M4.1 Migration `0002_capacity.sql`: capacity_plans table
- M4.2 GET/PUT `/api/tpmos/capacity/:teamId/:quarterId`
- M4.3 Pure domain function `src/lib/tpmos/domain/capacity.ts`:
  ```ts
  function computeAvailableWeeks(input: {
    memberCount: number;
    weeksInQuarter: number;
    vacationWeeks: number;
    techDebtWeeks: number;
    otherOverhead: number;
  }): { availableWeeks: number; totalMemberWeeks: number; }
  ```
- M4.4 Vitest tests for `computeAvailableWeeks` covering: zero members, negative inputs (clamp to 0), all overhead consumes capacity, normal case
- M4.5 `<CapacityForm>` component with React Hook Form + Zod
- M4.6 Capacity Plan editor surface (functional, lives at `/teams/[slug]/capacity`)
- M4.7 `<CapacityBar>` component reusable in planner (M6)
- M4.8 Update STATUS.md

**M4 Definition of Done:** Editing capacity inputs updates `available_weeks` in real time. Saved values persist across page reloads. Tests for capacity math pass.

---

## M5 — Epics + Voting (WSJF)

**Goal:** Epics CRUD with voting and WSJF computation.

### Tasks
- M5.1 Migration `0003_epics.sql`: epics, epic_votes
- M5.2 GET/POST/PATCH/DELETE `/api/tpmos/epics`
- M5.3 POST `/api/tpmos/epics/:id/votes` (upsert by user)
- M5.4 Pure domain function `src/lib/tpmos/domain/wsjf.ts`:
  ```ts
  function computeWsjf(votes: EpicVote[], committedWeeks: number): {
    score: number | null;       // null if committedWeeks <= 0 or no votes
    perDimensionAvg: { value: number; criticality: number; risk: number };
    perDimensionVariance: { value: number; criticality: number; risk: number };
    voteCount: number;
  }
  ```
- M5.5 Vitest tests for `computeWsjf`: no votes, single voter, multi-voter consensus, multi-voter divergence, zero committed weeks, missing dimensions
- M5.6 `<EpicForm>`, `<EpicDetailSheet>`, `<VotePanel>`, `<ConsensusHeatmap>` components
- M5.7 Epic Detail surface (functional, modal-routable side sheet from team plan page)
- M5.8 Epic list view inside Team Detail → Plan tab (table view, no drag yet — drag is M6)
- M5.9 Update STATUS.md

**M5 Definition of Done:** Create 5 epics, three users vote on each, WSJF computes correctly, heatmap renders, variance highlights disagreement.

---

## M6 — Planner board (the crown jewel)

**Goal:** Above/below-the-line drag-and-drop planner.

### Tasks
- M6.1 **SPIKE:** Add dnd-kit deps, build a one-component sortable list spike, verify React 19 compat, delete spike
- M6.2 Pure domain function `src/lib/tpmos/domain/planner-line.ts`:
  ```ts
  function computeLine(epics: { id: string; weeks: number }[], availableWeeks: number): {
    aboveLineIds: string[];
    belowLineIds: string[];
    lineIndex: number;          // index where cumulative > available
    cumulativeWeeks: number[];  // running sum, parallel to epics array
    overcommitWeeks: number;    // 0 if not over
  }
  ```
- M6.3 Pure domain function `reorderWithDisplacement(epics, fromIndex, toIndex, availableWeeks)` — handles "drag above the line auto-displaces lower priority below"
- M6.4 Vitest tests for both functions: empty list, single epic, exact fit, undercommit, overcommit, drag-above, drag-below, drag-into-overcommit
- M6.5 `<PlannerBoard>` component using `@dnd-kit/sortable`
- M6.6 `<EpicCard>` with WSJF badge, status pill, DRI avatar
- M6.7 `<LineDivider>` — sticky visual separator with capacity remaining
- M6.8 POST `/api/tpmos/epics/reorder` — bulk update sort_order with version checks
- M6.9 Wire planner to live capacity bar from M4
- M6.10 Lock plan flow: POST `/api/tpmos/quarters/:id/lock`
- M6.11 Quarterly Planning surface (functional) — replaces table view in Team Detail Plan tab
- M6.12 Update STATUS.md

**M6 Definition of Done:** Drag any epic; line moves correctly; cumulative capacity bar updates live; lock button freezes the plan.

---

## M7 — Status tracking + Risks feed

**Goal:** Status updates flow end-to-end. Risks surface across teams.

### Tasks
- M7.1 PATCH `/api/tpmos/epics/:id/status` with status enum + percent_complete + at_risk
- M7.2 `<StatusControl>` component (dropdown + percent slider + at-risk toggle)
- M7.3 `<ProgressBar>` with time-elapsed overlay; "behind pace" detector at 15% lag (pure domain function `progress.ts` with tests)
- M7.4 GET `/api/tpmos/risks?org=current` — returns at_risk and blocked epics across all teams
- M7.5 Risks Feed surface (functional, surface 14)
- M7.6 Team Detail → Board tab (kanban-ish view by status)
- M7.7 Update STATUS.md

**M7 Definition of Done:** Mark an epic at-risk on Team A; it appears in the Risks feed visible to TPM and Exec.

---

## M8 — Carry-forward + Quarter close

**Goal:** Quarter end ceremony. History preserved.

### Tasks
- M8.1 POST `/api/tpmos/quarters/:id/close` — transitions state to closed, makes read-only
- M8.2 POST `/api/tpmos/quarters/:id/carry-forward` with array of epic IDs to clone
- M8.3 Pure domain function `src/lib/tpmos/domain/carry-forward.ts`:
  ```ts
  function buildCarryForwardEpics(
    sourceEpics: Epic[],
    selectedIds: string[],
    targetQuarterId: string,
    actor: User
  ): Epic[]
  ```
- M8.4 Vitest tests
- M8.5 `<CarryForwardDialog>` component
- M8.6 Read-only mode for closed quarters (UI conditional based on quarter state)
- M8.7 "Carried from QX" badge on cloned epics
- M8.8 Update STATUS.md

**M8 Definition of Done:** Close a quarter with 3 incomplete epics; carry forward 2; verify Q+1 contains 2 cloned epics with the badge; verify closed quarter is read-only.

---

## M9 — AI hooks A1 + A2

**Goal:** Epic drafting and DoD lint with provider abstraction.

### Tasks
- M9.1 Add Workers AI binding in `wrangler.toml` (already added in M0.4 — verify)
- M9.2 Build `functions/_lib/ai/provider.ts` interface (see AI_INTEGRATION.md)
- M9.3 Implement `WorkersAIProvider`, `AnthropicProvider`, `NullProvider`
- M9.4 POST `/api/tpmos/ai/draft-epic` — takes title, returns `{ description, definitionOfDone }`
- M9.5 POST `/api/tpmos/ai/lint-dod` — takes DoD, returns `{ issues, suggestion? }` (regex first, LLM only if regex passes)
- M9.6 `<DraftButton>` component in EpicForm with loading + accept/regenerate/cancel UX
- M9.7 `<DodLintBadge>` inline lint badge on epic save (non-blocking)
- M9.8 Verify graceful degradation: set `AI_PROVIDER=none`, confirm AI buttons hide
- M9.9 Document prompts in `functions/_lib/ai/prompts/draft-epic.ts` and `lint-dod.ts`
- M9.10 Add eval harness `functions/_lib/ai/__tests__/draft-epic.eval.ts` (gated by `AI_EVAL=true`)
- M9.11 Update STATUS.md

**M9 Definition of Done:** Type "Migrate auth to OAuth" → click Draft with AI → see a credible description + DoD suggestion in <3s. DoD lint flags "ship feature" as weak.

---

## M10 — TPM Intake + AI hooks B1 + B2

**Goal:** Interview capture, synthesis, theme clustering. Surface 11 becomes functional.

### Tasks
- M10.1 Migration `0004_intake.sql`: interviews, interview_themes, interview_theme_tags
- M10.2 GET/POST/PATCH `/api/tpmos/interviews`
- M10.3 GET/POST `/api/tpmos/interview-themes`
- M10.4 POST `/api/tpmos/ai/synthesize-interview` — extracts scope summary, top challenges, suggested theme tags, recommended actions
- M10.5 POST `/api/tpmos/ai/cluster-themes` — embeddings via Workers AI bge-base-en, agglomerative clustering, returns canonical theme groups
- M10.6 `<InterviewForm>`, `<InterviewDetail>`, `<ThemeChip>`, `<ThemeClusterViz>` components
- M10.7 TPM Intake surface (functional list + create + detail)
- M10.8 Themes view (sub-page of Intake) showing clustered themes with bubble chart
- M10.9 Update STATUS.md

**M10 Definition of Done:** Conduct 3 interviews, get AI synthesis on each, theme clustering identifies 2-3 repeated themes across them.

---

## M11 — Polish + Seed + Demo + Final QA

**Goal:** Demo-ready.

### Tasks
- M11.1 Empty states for every surface (designed, not blank)
- M11.2 Loading skeletons (no spinners on mounted content)
- M11.3 Error toasts (non-blocking) and inline form errors
- M11.4 Keyboard shortcuts: cmd-k (palette), j/k (epic list nav), e (edit), v (vote), ? (shortcut help)
- M11.5 Demo seed script: 1 org, 1 admin, 1 TPM, 3 teams, 8 ICs, 2 quarters (one closed, one active), 18 epics with realistic distributions, votes, statuses, 3 interviews
- M11.6 Final accessibility pass: tab order, focus rings, color contrast
- M11.7 Final responsive pass: ≥1024 polished, ≥768 functional
- M11.8 Update README with quickstart
- M11.9 Update DEPLOY.md with production checklist
- M11.10 Tag v0.1.0 release
- M11.11 Migration `0005_audit.sql` — write-only audit log (UI surface in Phase 2)
- M11.12 Update STATUS.md to reflect MVP complete; create draft `IMPLEMENTATION_PLAN_PHASE2.md` with surface 8/9/10/12 work

**M11 Definition of Done:** A new visitor lands on `tpmos.torfinn.xyz`, logs in via Cloudflare Access as the seeded TPM, and within 5 minutes can credibly demo the planning loop end-to-end including TPM intake with AI synthesis.

---

## API Map (full MVP)

| Method | Route | Milestone |
|---|---|---|
| GET | `/api/tpmos/me` | M1 |
| POST | `/api/tpmos/dev/login` *(local only)* | M1 |
| GET POST | `/api/tpmos/teams` | M3 |
| GET PATCH DELETE | `/api/tpmos/teams/:id` | M3 |
| GET POST DELETE | `/api/tpmos/teams/:id/members` | M3 |
| GET POST | `/api/tpmos/quarters` | M3 |
| POST | `/api/tpmos/quarters/:id/lock` | M6 |
| POST | `/api/tpmos/quarters/:id/close` | M8 |
| POST | `/api/tpmos/quarters/:id/carry-forward` | M8 |
| GET PUT | `/api/tpmos/capacity/:teamId/:quarterId` | M4 |
| GET POST | `/api/tpmos/epics` | M5 |
| GET PATCH DELETE | `/api/tpmos/epics/:id` | M5 |
| POST | `/api/tpmos/epics/reorder` | M6 |
| POST | `/api/tpmos/epics/:id/status` | M7 |
| POST | `/api/tpmos/epics/:id/votes` | M5 |
| GET | `/api/tpmos/risks` | M7 |
| GET POST | `/api/tpmos/interviews` | M10 |
| GET PATCH | `/api/tpmos/interviews/:id` | M10 |
| GET POST | `/api/tpmos/interview-themes` | M10 |
| GET PATCH | `/api/tpmos/admin/users` | M3 |
| POST | `/api/tpmos/ai/draft-epic` | M9 |
| POST | `/api/tpmos/ai/lint-dod` | M9 |
| POST | `/api/tpmos/ai/synthesize-interview` | M10 |
| POST | `/api/tpmos/ai/cluster-themes` | M10 |

---

## Test plan

| Layer | Tool | Coverage | Milestone added |
|---|---|---|---|
| `can()` permission helper | Vitest | **100% matrix** | M2 |
| `capacity.ts` domain | Vitest | 100% branch | M4 |
| `wsjf.ts` domain | Vitest | 100% branch | M5 |
| `planner-line.ts` domain | Vitest | 100% branch | M6 |
| `progress.ts` domain | Vitest | 100% branch | M7 |
| `carry-forward.ts` domain | Vitest | 100% branch | M8 |
| Zod schemas | Vitest | round-trip parse | each milestone |
| API handlers | Vitest + miniflare | happy path per endpoint | each milestone |
| AI providers | Vitest | mocked | M9 |
| UI components | None for MVP | — | — |
| End-to-end | Manual checklist `docs/QA.md` | All 11 functional surfaces | M11 |

---

## Seed plan

```
1 org "Default"
1 admin (admin@example.com)
1 TPM (tpm@example.com)
3 teams: Platform, Growth, ML Infra
8 ICs distributed across teams
3 leads (one per team) with role=em
2 quarters: 2026Q1 (closed), 2026Q2 (active)
18 epics: 5-7 per team across both quarters
  - mix of statuses: not_started/in_progress/blocked/at_risk/done
  - mix of percent_complete
  - 2 carry-forward examples from Q1 to Q2
Capacity plans for each (team, quarter)
Realistic vote distributions (3-5 voters per epic, varying consensus)
3 TPM intake interviews with sample responses and theme tags
```

A new visitor logs in as `tpm@example.com` and sees a fully-populated demo within 30 seconds.

---

## Definition of Done for MVP

- [ ] All 15 routes exist; 11 functional, 4 well-designed placeholders
- [ ] All MVP acceptance criteria from PRD pass on the seeded demo
- [ ] All domain function tests pass with 100% branch coverage
- [ ] `wrangler pages dev` runs the full app + functions + D1 locally
- [ ] Production deploy at `tpmos.torfinn.xyz` works through Cloudflare Access
- [ ] Concept site sidebar has the TPMOS link
- [ ] STATUS.md reflects MVP complete
- [ ] All docs committed and current
- [ ] `docs/IMPLEMENTATION_PLAN_PHASE2.md` exists as a draft
- [ ] CI green on the v0.1.0 tag
- [ ] Dev login route returns 404 in production (CI verifies)
