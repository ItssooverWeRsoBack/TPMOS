-- 0006_goals_initiatives.sql — Leadership Goals + Initiatives + Mapping
-- Phase 2: Strategic layer connecting leadership OKRs to team execution.

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
  created_by TEXT NOT NULL REFERENCES users(id),
  updated_by TEXT NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_goals_org ON goals(org_id);
CREATE INDEX idx_goals_quarter ON goals(target_quarter_id);

CREATE TABLE initiatives (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','paused','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL REFERENCES users(id),
  updated_by TEXT NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_initiatives_org ON initiatives(org_id);

CREATE TABLE goal_initiative_map (
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  initiative_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (goal_id, initiative_id)
);

CREATE TABLE initiative_epic_map (
  initiative_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  epic_id TEXT NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (initiative_id, epic_id)
);
