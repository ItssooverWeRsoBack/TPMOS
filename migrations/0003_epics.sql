-- 0003_epics.sql — Epics and votes
-- See docs/DATA_MODEL.md for schema documentation.

CREATE TABLE epics (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  quarter_id TEXT NOT NULL REFERENCES quarters(id),
  title TEXT NOT NULL,
  description TEXT,
  definition_of_done TEXT,
  dri_user_id TEXT REFERENCES users(id),
  dri_committed_weeks REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','blocked','at_risk','done','cancelled')),
  percent_complete INTEGER NOT NULL DEFAULT 0
    CHECK (percent_complete BETWEEN 0 AND 100),
  at_risk INTEGER NOT NULL DEFAULT 0,
  sort_order REAL NOT NULL,
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
