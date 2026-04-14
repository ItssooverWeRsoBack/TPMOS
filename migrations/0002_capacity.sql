-- 0002_capacity.sql — Capacity plans per (team, quarter)
-- See docs/DATA_MODEL.md for schema documentation.

CREATE TABLE capacity_plans (
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  quarter_id TEXT NOT NULL REFERENCES quarters(id),
  total_member_weeks REAL NOT NULL,
  vacation_weeks REAL NOT NULL DEFAULT 0,
  tech_debt_weeks REAL NOT NULL DEFAULT 0,
  other_overhead_weeks REAL NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (team_id, quarter_id)
);
