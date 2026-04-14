-- 0001_init.sql — Core entities: orgs, users, teams, team_members, quarters
-- Applied in M2. See docs/DATA_MODEL.md for full schema documentation.

CREATE TABLE orgs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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
CREATE INDEX idx_users_email ON users(email);

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
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  label TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('planning','active','closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(org_id, label)
);
CREATE INDEX idx_quarters_org_state ON quarters(org_id, state);
