# PRD — TPMOS

**Version:** 1.0 (locked after refinement on 2026-04-11)
**Status:** Active for MVP
**Owner:** Project owner (torfinn)
**Last updated:** 2026-04-11

> This is the source-of-truth Product Requirements Document. Architectural decisions live in [`ARD.md`](ARD.md). Build sequence lives in [`IMPLEMENTATION_PLAN_MVP.md`](IMPLEMENTATION_PLAN_MVP.md). Changes to this doc require an entry in [`DECISIONS.md`](DECISIONS.md).

---

## Executive Summary

TPMOS is a sub-application of `torfinn.xyz` deployed at `tpmos.torfinn.xyz` that gives a Technical Program Manager and engineering leaders a Linear-quality operating environment for landing in a new organization, running quarterly planning, tracking execution, and reporting to leadership. It is built as a client-side SPA backed by Cloudflare Pages Functions + D1, authenticated via Cloudflare Access. MVP is a coherent vertical slice through the planning loop (teams → epics → votes → capacity → above/below-the-line → status) plus TPM intake. 4 surfaces ship as well-designed placeholders that lock the information architecture for Phase 2.

## Product Vision

A TPM should be able to walk into any engineering organization on day 1, open TPMOS, and within 30 days have:

- A clear map of every team and what they own
- A captured, themed view of every lead's biggest pains and wishes
- A current-quarter view of what each team committed to, what fits, what doesn't, and what's at risk
- A goal-coverage view (Phase 2) that tells leadership which strategic priorities are actually being executed against

The product should feel like Linear, not Jira.

## Problem Statement

TPMs and engineering leaders manage organizational planning with spreadsheets, Confluence pages, and ad-hoc Notion docs. The result: capacity vs commitment is invisible until it's late, votes are taken in meetings and forgotten, leadership goals exist on slides nobody maps to actual work, and a TPM joining a new org spends 90 days assembling context that should take 30.

## Goals

1. Make capacity vs commitment a 5-second visual answer for any team in any quarter.
2. Make team voting on quarterly priorities frictionless (5 minutes per IC) and consensus/divergence visible.
3. Make TPM intake of a new org structured and queryable, not a folder of Google Docs.
4. Make goal-to-execution mapping a first-class data model, not a quarterly slide-rebuild exercise.
5. Ship a credible demo on free infrastructure with a clear path to 1000+ users.

## Non-Goals (MVP)

- Replacing Jira/Linear/GitHub Issues for individual ticket tracking
- Real-time multi-cursor collaboration
- Mobile-first UX (responsive yes, mobile-optimized no)
- Custom workflow engines or automation rules
- AI-driven authoritative decisions (voting, capacity, status — humans only)
- Multi-tenant SaaS (single org per deployment in MVP, schema-ready for multi-tenancy)
- Time tracking, individual TODO lists, sprint boards
- Real-time websockets / live cursors

---

## Personas

| Persona | Primary need | Frequency |
|---|---|---|
| **TPM** | Org legibility, planning facilitation, leadership reporting | Daily |
| **Engineering Manager** | Quarterly planning, capacity modeling, status tracking | Weekly during planning, daily at quarter start, weekly mid-quarter |
| **Engineering IC** | Voting, capacity declaration, status updates | 2-3 times per quarter |
| **Executive** | Goal coverage, cross-team progress, risk concentration | Weekly *(Phase 2)* |
| **Admin** | User management, team setup, role assignment | Rarely |

---

## User Workflows

### W1: TPM lands in a new org

1. Admin invites TPM via Cloudflare Access policy
2. TPM creates teams, assigns leads
3. TPM schedules and conducts lead interviews; enters responses to 4 structured questions per lead
4. TPM uses AI synthesis (B1) to extract scope summary, top challenges, suggested theme tags
5. TPM tags themes; system clusters repeated themes across leads via embedding similarity (B2)
6. TPM views theme cluster visualization; identifies top 3 organizational pains
7. *(Phase 2)* TPM exports a "first 30 days" report for leadership

### W2: Quarterly planning (T-3 weeks before EOQ)

1. EM opens team's Quarterly Planning page for next quarter
2. System shows incomplete epics from current quarter pre-loaded as "carry-forward candidates"
3. EM enters new epics: title, description, DoD, DRI, single-person duration estimate
   - Optional: clicks "Draft with AI" (A1) to populate description/DoD from title
   - DoD lint (A2) flags weak language inline
4. EM declares capacity: members × weeks − vacation weeks − tech debt weeks
5. EM invites team to vote (system surfaces in app, no notification system in MVP)
6. Each IC votes on each epic at any time: user value (1–10), time criticality (1–10), risk reduction (1–10), optionally a duration estimate
7. System computes WSJF = (avg(value) + avg(criticality) + avg(risk)) / DRI-committed duration
8. EM opens the above/below-the-line planner; epics are sorted by WSJF by default
9. EM drags epics; the line is fixed at total capacity weeks; epics above the line are committed; epics below are stretch
10. EM reviews the consensus heatmap to spot epics with high disagreement (a yellow flag)
11. EM marks plan "locked" at quarter start; system snapshots it for historical comparison

### W3: Mid-quarter status updates

1. IC or EM opens an epic, sets status (Not Started / In Progress / Blocked / At Risk / Done) and percent complete
2. EM views team page; sees completion % bar overlaid with quarter time-elapsed bar
3. If completion lags time-elapsed by >15%, the team is flagged "behind pace"
4. At-risk epics surface in the TPM's risk feed
5. TPM holds weekly check-in; flags new risks; *(Phase 2)* leadership sees rollups

### W4: End of quarter

1. System detects quarter end
2. EM marks remaining epics as Done, Carry-forward, or Cancelled
3. Carry-forward epics auto-create in next quarter with a "carried from QX" tag
4. Historical snapshot of the closed quarter is preserved (read-only)

### W5: Executive review *(Phase 2)*

1. Exec opens Visualizer page
2. Sees goal coverage map: each leadership goal → contributing initiatives → contributing teams → progress %
3. Spots gaps (goals with no execution) and overlaps (multiple teams duplicating)
4. Spots risk concentration (which teams have the most at-risk work)

---

## Functional Requirements

### FR-1: Authentication & Authorization

- FR-1.1 Users authenticate via Cloudflare Access (production) or signed dev cookie (local)
- FR-1.2 Pages Functions read `Cf-Access-Authenticated-User-Email` from request headers
- FR-1.3 First-time users land on a "request access" screen until an Admin assigns them a role
- FR-1.4 Roles: `admin`, `tpm`, `em`, `ic`, `exec`, `pending` (6 total)
- FR-1.5 Team-scoped permissions: ICs can edit epics for their own team only; EMs same; TPMs all teams; Execs read-only on all
- FR-1.6 Dev login route MUST be hard-gated by `env.ENV === 'local'` and return 404 in production (repo is public)

### FR-2: Teams

- FR-2.1 Create / edit / archive teams
- FR-2.2 Assign members with team role (lead / member)
- FR-2.3 Team has: name, slug, charter (markdown), archived flag, created/updated audit
- FR-2.4 Archived teams hidden from default views

### FR-3: Quarters

- FR-3.1 System auto-creates calendar quarters by date (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec)
- FR-3.2 Users can switch between quarters via top-bar dropdown
- FR-3.3 Quarter has states: `planning` (T-3 weeks before start), `active`, `closed`
- FR-3.4 Closed quarters are read-only; reopen requires admin
- FR-3.5 At quarter close, incomplete epics offered for carry-forward in bulk

### FR-4: Capacity Plans

- FR-4.1 One CapacityPlan per (team, quarter)
- FR-4.2 Fields: total_member_weeks, vacation_weeks, tech_debt_weeks, other_overhead_weeks
- FR-4.3 Computed: available_weeks = total_member_weeks − vacation_weeks − tech_debt_weeks − other_overhead_weeks
- FR-4.4 Per-IC capacity entry optional in MVP — defaults to 13 weeks/quarter minus declared overhead
- FR-4.5 Available weeks updates the planner line in real time

### FR-5: Epics

- FR-5.1 Fields: title, description (markdown), definition_of_done (markdown), team_id, quarter_id, dri_user_id (nullable), dri_committed_weeks, status, percent_complete, at_risk (bool), carried_from_epic_id, sort_order, created_by, updated_by, version
- FR-5.2 Status enum: `not_started`, `in_progress`, `blocked`, `at_risk`, `done`, `cancelled`
- FR-5.3 EM/TPM/DRI can edit; ICs can edit description and DoD on their team's epics
- FR-5.4 Drag-and-drop reordering persists `sort_order`; epics above the line are committed
- FR-5.5 Editing the DRI committed duration recomputes WSJF and capacity totals immediately
- FR-5.6 DRI is optional; capacity math and planner work without DRI; WSJF only computed when DRI sets committed weeks

### FR-6: Voting (WSJF)

- FR-6.1 Each user votes on each epic on 3 dimensions (value, time_criticality, risk_reduction), 1–10
- FR-6.2 Optional: each user votes a duration estimate
- FR-6.3 System shows running averages, count of votes, and per-dimension variance
- FR-6.4 WSJF = (avg(value) + avg(time_criticality) + avg(risk_reduction)) / dri_committed_weeks
- FR-6.5 Epics sortable by WSJF; default order in planner is WSJF DESC
- FR-6.6 Consensus heatmap: per-epic, per-dimension cell colored by variance (low = green, high = red)
- FR-6.7 Voting is always open — no fixed window. Late votes accepted at any time.
- FR-6.8 Vote upserts on `(epic_id, user_id)` — last vote wins; `updated_at` captured

### FR-7: Above/Below the Line Planner

- FR-7.1 Drag-and-drop list of epics, sorted by `sort_order`
- FR-7.2 Persistent visual line at the row where cumulative `dri_committed_weeks` equals `available_weeks`
- FR-7.3 Dragging an epic above the line auto-displaces lower-priority epics below
- FR-7.4 Live capacity bar at top: committed / available with color states (green ≤90%, yellow 90–100%, red >100%)
- FR-7.5 Epics below the line are styled muted with "stretch" badge
- FR-7.6 Lock button freezes plan and snapshots state for the active quarter
- FR-7.7 Drag-and-drop must feel frame-perfect (60fps, no layout shift)

### FR-8: Status Tracking

- FR-8.1 Epic status updatable from epic detail and from team board
- FR-8.2 Color coding (defined in `globals.css` as CSS variables):
  - `--color-status-not-started` (neutral)
  - `--color-status-in-progress` (blue)
  - `--color-status-blocked` (red)
  - `--color-status-at-risk` (amber)
  - `--color-status-done` (green)
- FR-8.3 Team progress bar: sum(percent_complete × dri_committed_weeks) / sum(dri_committed_weeks of committed epics)
- FR-8.4 Time-elapsed bar overlaid on progress bar; deviation > 15% triggers a "behind pace" badge
- FR-8.5 At-risk epics appear in a global "Risks" feed visible to TPM/Exec/EM

### FR-9: Carry-Forward

- FR-9.1 At quarter close, incomplete epics (any non-done, non-cancelled) appear in a carry-forward dialog
- FR-9.2 EM selects which to carry; selected epics are cloned into next quarter with `carried_from_epic_id`
- FR-9.3 Original carries `cancelled` or stays `not_done` based on user choice
- FR-9.4 Carried epics show a small badge in the new quarter
- FR-9.5 Carry-forward clones title/description/DoD/duration/DRI; resets status, percent_complete, votes

### FR-10: Historical Quarters

- FR-10.1 All closed quarters remain queryable
- FR-10.2 Quarter switcher shows all quarters from earliest to latest
- FR-10.3 Read-only views render the same components in disabled mode

### FR-11: TPM Intake Interviews *(MVP — pulled from Phase 2)*

- FR-11.1 Interview = (lead_user_id, conducted_by_user_id, conducted_at, q1_scope, q2_challenges, q3_must_know, q4_blue_sky, ai_synthesis, notes)
- FR-11.2 Four standard questions; responses are markdown
- FR-11.3 Theme tags can be applied to any response; tags are user-defined and clustered
- FR-11.4 AI synthesis (hook B1) extracts scope, challenges, suggested themes, recommended actions
- FR-11.5 Theme clustering (hook B2) uses embedding similarity to group themes across interviews
- FR-11.6 Visualization is a force-directed bubble chart of clustered themes

### *(Phase 2)* FR-12: Leadership Goals & Initiative Mapping

- FR-12.1 Goals: title, description, target_quarter, owner, status
- FR-12.2 Initiatives (cross-team products/programs): title, description, contributing_teams, contributing_goals
- FR-12.3 Many-to-many: goal ↔ initiative ↔ epic
- FR-12.4 Coverage map: each goal shows mapped epic count and rolled-up progress
- FR-12.5 Gap detector: goals with zero mapped epics flagged
- FR-12.6 Goal-to-epic AI mapping suggestions (hook B4)

### *(Phase 2)* FR-13: Executive Visualizer

- FR-13.1 Multi-team progress dashboard
- FR-13.2 Risk concentration heatmap by team
- FR-13.3 Goal coverage rollup
- FR-13.4 Variance / consensus visual across all epics in a quarter
- FR-13.5 AI-generated risk narrative (hook B5)

### *(Phase 2)* FR-14: Reporting / Export

- FR-14.1 Generate weekly markdown report from quarter state
- FR-14.2 Diff against last week: new completions, new risks, completion delta
- FR-14.3 AI-generated report narrative (hook B3) — TPM must approve before send
- FR-14.4 Export as markdown, copy as image, or PDF (Phase 3)

### FR-15: Admin

- FR-15.1 List all users with role, last seen, team memberships
- FR-15.2 Promote pending users to a role
- FR-15.3 Edit any user's role
- FR-15.4 Admin role is required for user management

### FR-16: AI Hooks (MVP)

- FR-16.1 A1 — Epic description/DoD drafting (M9)
- FR-16.2 A2 — Weak DoD lint (M9)
- FR-16.3 B1 — Interview synthesis (M10)
- FR-16.4 B2 — Theme clustering (M10)
- FR-16.5 All AI features hide gracefully when `AI_PROVIDER=none`
- FR-16.6 Human review required before any AI-generated content is saved
- FR-16.7 Provider abstraction supports `workers-ai` (default), `anthropic`, `none`

See [`AI_INTEGRATION.md`](AI_INTEGRATION.md) for full hook catalog.

---

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | P95 page load (after auth) ≤ 2s on cold cache, ≤ 500ms on warm cache |
| NFR-2 | Voting and status update mutations P95 ≤ 300ms (Pages Function + D1) |
| NFR-3 | Drag-and-drop reorder feels frame-perfect (60fps, no layout shift) |
| NFR-4 | All interactive elements keyboard-navigable; planner supports arrow-key reorder as fallback |
| NFR-5 | Color contrast meets WCAG AA in both light and dark mode |
| NFR-6 | Responsive ≥ 1024px (desktop-first); functional ≥ 768px; degraded but readable on mobile |
| NFR-7 | Last-write-wins concurrency with `version` field; conflicting writes return 409 with current state |
| NFR-8 | Every mutable entity has `created_by`, `updated_by`, `created_at`, `updated_at` |
| NFR-9 | Database schema supports `org_id` from day 1 (hardcoded `default` until multi-tenant) |
| NFR-10 | Seed script populates a credible demo org for instant first-run |
| NFR-11 | Concept site (`torfinn.xyz`) MUST continue to build and deploy unchanged after TPMOS launches |
| NFR-12 | TPMOS bundle MUST NOT load on non-TPMOS routes (separate Pages project ensures this) |
| NFR-13 | Public repo: dev login route MUST return 404 in production |
| NFR-14 | All AI features must work without LLM (`AI_PROVIDER=none`) |
| NFR-15 | $0 cost to run MVP demo on free tiers |

---

## Permissions Matrix

| Action | Admin | TPM | EM | IC | Exec |
|---|---|---|---|---|---|
| Manage users / roles | ✓ | | | | |
| Create / archive teams | ✓ | ✓ | | | |
| Edit team metadata | ✓ | ✓ | own | | |
| Add/remove members | ✓ | ✓ | own | | |
| Create epic | ✓ | ✓ | own | own | |
| Edit epic (all fields) | ✓ | ✓ | own | own | |
| Set DRI committed weeks | ✓ | ✓ | own | DRI of epic | |
| Vote on epic | ✓ | ✓ | own | own | |
| Update epic status | ✓ | ✓ | own | DRI / own | |
| Lock plan | ✓ | ✓ | own | | |
| Reopen closed quarter | ✓ | | | | |
| Manage capacity plan | ✓ | ✓ | own | | |
| View all teams | ✓ | ✓ | ✓ | read all | ✓ |
| View executive dashboard *(P2)* | ✓ | ✓ | ✓ | | ✓ |
| Conduct intake interviews | ✓ | ✓ | | | |
| *(Phase 2)* Manage goals | ✓ | ✓ | | | |

Full matrix lives in [`DATA_MODEL.md`](DATA_MODEL.md) and is the test specification for `functions/_lib/auth/can.test.ts`.

---

## Data Requirements

Entities required for MVP:
**Org, User, Role, Team, TeamMembership, Quarter, CapacityPlan, Epic, EpicVote, Interview, InterviewTheme, InterviewThemeTag, AuditLog.**

Phase 2 adds:
**Goal, Initiative, GoalInitiativeMap, InitiativeEpicMap, ReportSnapshot, Connector.**

Full schema, indexes, and constraints in [`DATA_MODEL.md`](DATA_MODEL.md).

---

## UX Requirements

### Visual language

- **Theme:** Dark-first. Light mode exists for parity.
- **Accent color:** Indigo / violet (`oklch(0.7 0.2 280)` in dark mode) — distinct from the existing concept site's blue
- **Density:** Tight, Linear-like. Generous whitespace within cards but compact typography
- **Typography:** Inter for UI, JetBrains Mono for numeric/tabular data
- **Surfaces:** Subtle borders, low-chroma backgrounds, no heavy shadows

### Interaction

- **Motion:** framer-motion for layout transitions, drag overlays, and toasts. No flashy entrance animations.
- **Empty states:** Every surface gets a designed empty state with a single primary action
- **Loading states:** Skeleton placeholders, never spinners on mounted content
- **Error states:** Inline errors next to fields; non-blocking toasts for transient errors
- **Keyboard:** `cmd-k` opens command palette, `j/k` navigate epic lists, `e` opens edit, `v` opens vote modal, `?` shows shortcuts

### Components

- **Tables:** Sticky headers, no virtualization in MVP (won't be needed at MVP scale)
- **Drag-and-drop:** dnd-kit with custom drag overlay matching epic card style; haptic feel via `transform: scale` and shadow elevation
- **Forms:** React Hook Form + Zod resolver, inline validation
- **Toasts:** Bottom-right, dismissible, max 3 stacked

---

## Reporting Requirements *(Phase 2)*

- Weekly markdown report generator
- Sections: Quarter at a Glance, Completions This Week, New Risks, Off-Pace Teams, Goal Alignment Notes
- Numeric deltas vs prior week computed from snapshots
- AI-narrated executive summary (hook B3) with explicit human approval gate

---

## MVP Acceptance Criteria

| Surface | Acceptance |
|---|---|
| **Auth** | An authorized user can land on `tpmos.torfinn.xyz`, see their role, and be redirected to the right home view. Unauthorized users see "Request Access". Dev login route returns 404 in production. |
| **Teams Directory** | I can create a team, add 5 members with roles, and archive it. Archived teams hidden by default. |
| **Quarter Planning** | I can create 10 epics, declare a capacity of 30 weeks, drag-reorder them, and the line correctly partitions committed vs stretch based on cumulative duration. |
| **Voting** | 3 ICs can vote on 10 epics in <5 minutes each. WSJF score updates in real time. Heatmap renders per-epic per-dimension variance. |
| **Status** | I can update an epic to in_progress 50%; the team progress bar updates; an at-risk flag surfaces in the risk feed. |
| **Carry-Forward** | Closing Q1 with 3 incomplete epics offers carry-forward; selecting all 3 creates 3 new epics in Q2 tagged "carried from Q1". |
| **Quarter History** | Switching to a closed quarter renders the planner read-only with the locked sort order. |
| **TPM Intake** | I can create an interview, get AI synthesis with one click, see suggested theme tags, accept tags, and view the resulting cluster across multiple interviews. |
| **AI hooks** | "Draft with AI" populates a credible epic description + DoD in <3s. DoD lint flags "ship feature" as weak. AI features disappear cleanly when `AI_PROVIDER=none`. |
| **Existing site** | All concept site routes (`/concepts`, `/databases`, `/architectures`, `/scale-lab`, `/studio`) build and render identically. New TPMOS sidebar link works. |

---

## Required Pages / Surfaces

15 surfaces total. 11 functional in MVP, 4 placeholders.

| # | Surface | Route | State in MVP |
|---|---|---|---|
| 1 | Auth / Login | `/login` | ✓ functional |
| 2 | TPMOS Home (lite) | `/` | ✓ role-based redirect |
| 3 | Teams Directory | `/teams` | ✓ functional |
| 4 | Team Detail | `/teams/[slug]` | ✓ functional |
| 5 | Quarterly Planning | `/teams/[slug]/plan` | ✓ functional (M5+M6) |
| 6 | Epic Detail | `/teams/[slug]/plan/[epicId]` | ✓ functional (modal-routable) |
| 7 | Quarter Management | `/quarters` | ✓ functional |
| 8 | Leadership Goals | `/goals` | 📦 placeholder |
| 9 | Initiative / Product Mapping | `/initiatives` | 📦 placeholder |
| 10 | Executive Visualizer | `/dashboard` | 📦 placeholder |
| 11 | TPM Intake / Interviews | `/intake` | ✓ functional |
| 12 | Reporting / Export | `/reports` | 📦 placeholder |
| 13 | Capacity | `/teams/[slug]/capacity` | ✓ functional |
| 14 | Risks Feed | `/risks` | ✓ functional |
| 15 | Admin / User management | `/admin/users` | ✓ functional |

Placeholder surfaces use a `<PlaceholderSurface>` component showing "Coming in Phase 2", planned features pulled from this PRD, and a link to the tracking GitHub issue. This locks the IA from MVP.

---

## Success Metrics

| Metric | Target |
|---|---|
| Time for a TPM to enter first interview | < 5 minutes |
| Time for an EM to plan a quarter end-to-end | < 30 minutes |
| Time for an IC to vote on 10 epics | < 5 minutes |
| P95 page load (warm) | < 500ms |
| P95 mutation latency | < 300ms |
| MVP demo cost | $0/month |
| Crash-free user sessions | > 99% |

---

## Risks / Open Questions

1. **Cloudflare Access pricing past 50 users.** Free tier covers MVP. Above 50 users moves to Cloudflare Zero Trust paid (~$3/user/month). Mitigation: swap to magic-link auth via Resend (free 3K/month) at one auth boundary file.
2. **D1 free tier ceiling.** 100K writes/day. A 50-person org doing voting + status updates will use ~5K writes/day. Comfortable headroom. Beyond 200 active users we'd revisit Postgres.
3. **Drag-and-drop with displacement logic.** Risk of jank if implemented naively. Mitigation: spike in M6.1.
4. **dnd-kit with React 19.** dnd-kit v6 supports React 19 but is still relatively new. Test in repo before committing.
5. **Wrangler Pages Functions integration with Next.js 16 static export.** Should work but should be validated in M0.10 deploy.
6. **Workers AI quality for B1/B2.** Llama 3.1 8B is good but not Claude-good. Mitigation: provider abstraction lets us swap to Claude Haiku via env var if quality is insufficient.
7. **Public repo + dev login route.** Hard-gate must be in code, verified by CI, called out in AGENTS.md.
