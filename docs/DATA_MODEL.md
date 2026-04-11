# DATA_MODEL.md — TPMOS Database Schema

> Cloudflare D1 (SQLite). Migrations live in `migrations/` and are applied with `wrangler d1 migrations apply`. Schema is portable to Postgres if migration becomes necessary.

## Design principles

1. **`org_id` everywhere from day 1.** MVP is single-org (hardcoded `default`), but every table is namespaced for trivial multi-org expansion.
2. **Optimistic concurrency.** Mutable entities have a `version INTEGER` column. Updates use `If-Match` header; mismatches return 409.
3. **Audit columns.** Every mutable entity has `created_at`, `updated_at`, `created_by`, `updated_by`. Read-only entities (votes, theme tags) have `updated_at` only.
4. **Soft archive over hard delete.** Teams use `archived` flag. Epics use `cancelled` status. Hard deletes only via admin.
5. **Carry-forward provenance.** Carried epics retain `carried_from_epic_id` for historical traceability.
6. **Business rules in domain layer, not DB.** D1 enforces types and CHECKs. Capacity overcommit, WSJF computation, role-based authorization all live in `functions/_lib/domain/` and `functions/_lib/auth/can.ts`.

## Migration order

| Migration | Adds | Milestone |
|---|---|---|
| `0001_init.sql` | orgs, users, teams, team_members, quarters | M2 |
| `0002_capacity.sql` | capacity_plans | M4 |
| `0003_epics.sql` | epics, epic_votes | M5 |
| `0004_intake.sql` | interviews, interview_themes, interview_theme_tags | M10 |
| `0005_audit.sql` | audit_log (write-only in MVP) | M11 |

Phase 2 will add: `goals`, `initiatives`, `goal_initiative_map`, `initiative_epic_map`, `report_snapshots`, `connectors`.

## Full schema (MVP)

```sql
-- ============================================================
-- 0001_init.sql — orgs, users, teams, quarters
-- ============================================================

CREATE TABLE orgs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed the default org for single-tenant MVP
INSERT INTO orgs (id, name) VALUES ('default', 'Default Organization');

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin','tpm','em','ic','exec','pending')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT
);
CREATE INDEX idx_users_org ON users(org_id);

CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  charter TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL REFERENCES users(id),
  updated_by TEXT NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE(org_id, slug)
);
CREATE INDEX idx_teams_org_archived ON teams(org_id, archived);

CREATE TABLE team_members (
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  team_role TEXT NOT NULL CHECK (team_role IN ('lead','member')),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (team_id, user_id)
);
CREATE INDEX idx_team_members_user ON team_members(user_id);

CREATE TABLE quarters (
  id TEXT PRIMARY KEY,           -- format: 'default:2026Q2'
  org_id TEXT NOT NULL REFERENCES orgs(id),
  label TEXT NOT NULL,           -- '2026 Q2'
  start_date TEXT NOT NULL,      -- '2026-04-01'
  end_date TEXT NOT NULL,        -- '2026-06-30'
  state TEXT NOT NULL CHECK (state IN ('planning','active','closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(org_id, label)
);
CREATE INDEX idx_quarters_org_state ON quarters(org_id, state);

-- ============================================================
-- 0002_capacity.sql
-- ============================================================

CREATE TABLE capacity_plans (
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  quarter_id TEXT NOT NULL REFERENCES quarters(id),
  total_member_weeks REAL NOT NULL,    -- members * 13 (or fiscal weeks/quarter)
  vacation_weeks REAL NOT NULL DEFAULT 0,
  tech_debt_weeks REAL NOT NULL DEFAULT 0,
  other_overhead_weeks REAL NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (team_id, quarter_id)
);

-- ============================================================
-- 0003_epics.sql
-- ============================================================

CREATE TABLE epics (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  quarter_id TEXT NOT NULL REFERENCES quarters(id),
  title TEXT NOT NULL,
  description TEXT,
  definition_of_done TEXT,
  dri_user_id TEXT REFERENCES users(id),         -- nullable, optional per FR-5
  dri_committed_weeks REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','blocked','at_risk','done','cancelled')),
  percent_complete INTEGER NOT NULL DEFAULT 0
    CHECK (percent_complete BETWEEN 0 AND 100),
  at_risk INTEGER NOT NULL DEFAULT 0,
  sort_order REAL NOT NULL,                       -- fractional for cheap reorder
  carried_from_epic_id TEXT REFERENCES epics(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL REFERENCES users(id),
  updated_by TEXT NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_epics_team_quarter ON epics(team_id, quarter_id, sort_order);
CREATE INDEX idx_epics_at_risk ON epics(at_risk) WHERE at_risk = 1;
CREATE INDEX idx_epics_status ON epics(quarter_id, status);

CREATE TABLE epic_votes (
  epic_id TEXT NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  value INTEGER CHECK (value BETWEEN 1 AND 10),
  time_criticality INTEGER CHECK (time_criticality BETWEEN 1 AND 10),
  risk_reduction INTEGER CHECK (risk_reduction BETWEEN 1 AND 10),
  duration_estimate_weeks REAL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (epic_id, user_id)
);

-- ============================================================
-- 0004_intake.sql — TPM Intake interviews and theme clustering
-- ============================================================

CREATE TABLE interviews (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  lead_user_id TEXT NOT NULL REFERENCES users(id),
  conducted_by_user_id TEXT NOT NULL REFERENCES users(id),
  conducted_at TEXT NOT NULL,
  q1_scope TEXT,
  q2_challenges TEXT,
  q3_must_know TEXT,
  q4_blue_sky TEXT,
  ai_synthesis TEXT,                  -- structured JSON from B1 hook
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_interviews_org_lead ON interviews(org_id, lead_user_id);

CREATE TABLE interview_themes (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  label TEXT NOT NULL,
  description TEXT,
  embedding BLOB,                     -- vector from B2 clustering (768d for bge-base-en)
  UNIQUE(org_id, label)
);

CREATE TABLE interview_theme_tags (
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL REFERENCES interview_themes(id) ON DELETE CASCADE,
  question TEXT NOT NULL CHECK (question IN ('q1','q2','q3','q4')),
  tagged_by_user_id TEXT REFERENCES users(id),
  tagged_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (interview_id, theme_id, question)
);

-- ============================================================
-- 0005_audit.sql — write-only in MVP, UI surfaced in Phase 2
-- ============================================================

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,                 -- 'create','update','delete','lock','close'
  entity_type TEXT NOT NULL,            -- 'team','epic','vote','quarter','capacity'
  entity_id TEXT NOT NULL,
  payload TEXT,                         -- JSON diff
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_org_created ON audit_log(org_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
```

## Phase 2 schema additions (sketch)

```sql
-- 0006_goals_initiatives.sql

CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  title TEXT NOT NULL,
  description TEXT,
  target_quarter_id TEXT REFERENCES quarters(id),
  owner_user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'on_track'
    CHECK (status IN ('on_track','at_risk','off_track','done')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE initiatives (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE goal_initiative_map (
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  initiative_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  PRIMARY KEY (goal_id, initiative_id)
);

CREATE TABLE initiative_epic_map (
  initiative_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  epic_id TEXT NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
  PRIMARY KEY (initiative_id, epic_id)
);

-- 0007_reports.sql
CREATE TABLE report_snapshots (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  quarter_id TEXT NOT NULL REFERENCES quarters(id),
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  generated_by TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,                -- markdown body
  metadata TEXT                          -- JSON: completion %, deltas, etc.
);
```

## Entity relationships (text diagram)

```
orgs ─┬─ users
      ├─ teams ─┬─ team_members ──── users
      │         └─ epics ──── epic_votes ──── users
      │             │
      │             └─ epics.dri_user_id ──── users
      │             └─ epics.carried_from_epic_id ─→ epics (self-ref)
      │
      ├─ quarters ──┬─ epics
      │             └─ capacity_plans (composite key with teams)
      │
      └─ interviews ─┬─ users (lead, conductor)
                     └─ interview_theme_tags ──── interview_themes
```

## Business rules (enforced in domain layer, NOT in DB)

| Rule | Where enforced |
|---|---|
| WSJF = (avg(value) + avg(time_criticality) + avg(risk_reduction)) / dri_committed_weeks | `src/lib/tpmos/domain/wsjf.ts` |
| Available capacity = total_member_weeks − vacation_weeks − tech_debt_weeks − other_overhead_weeks | `src/lib/tpmos/domain/capacity.ts` |
| Above-the-line = epics where cumulative dri_committed_weeks ≤ available_weeks | `src/lib/tpmos/domain/planner-line.ts` |
| Behind-pace = percent_complete + 15 < time_elapsed_pct | `src/lib/tpmos/domain/progress.ts` (M7) |
| Carry-forward clones title/description/DoD/duration; resets votes, status, percent_complete | `src/lib/tpmos/domain/carry-forward.ts` |
| Closed quarters reject all writes | `_middleware.ts` + handler-level check |
| ICs can edit epics for their own team only | `functions/_lib/auth/can.ts` |

## Permission matrix

| Action | admin | tpm | em (own team) | ic (own team) | ic (other team) | exec |
|---|---|---|---|---|---|---|
| Create team | ✓ | ✓ | | | | |
| Edit team | ✓ | ✓ | ✓ | | | |
| Archive team | ✓ | ✓ | | | | |
| Add member | ✓ | ✓ | ✓ | | | |
| Create epic | ✓ | ✓ | ✓ | ✓ | | |
| Edit epic (all fields) | ✓ | ✓ | ✓ | ✓ | | |
| Set DRI committed weeks | ✓ | ✓ | ✓ | DRI only | | |
| Vote | ✓ | ✓ | ✓ | ✓ | | |
| Update status | ✓ | ✓ | ✓ | ✓ | | |
| Lock plan | ✓ | ✓ | ✓ | | | |
| Close quarter | ✓ | ✓ | | | | |
| Reopen quarter | ✓ | | | | | |
| Edit capacity | ✓ | ✓ | ✓ | | | |
| View teams | ✓ | ✓ | ✓ | ✓ | ✓ (read) | ✓ |
| Manage users | ✓ | | | | | |
| Conduct interview | ✓ | ✓ | | | | |
| Manage goals (Phase 2) | ✓ | ✓ | | | | |

This matrix is the test specification for `src/lib/tpmos/domain/__tests__/can.test.ts`.
