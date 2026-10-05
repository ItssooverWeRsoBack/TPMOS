-- Demo identity is unique per connector, team and quarter; ordinary epics stay nullable.
ALTER TABLE epics ADD COLUMN connector_id TEXT REFERENCES connector_configs(id);
ALTER TABLE epics ADD COLUMN external_id TEXT;
CREATE UNIQUE INDEX idx_epics_external_identity
  ON epics(connector_id, team_id, quarter_id, external_id);

-- These are previews, never a queue for delivery.
CREATE TABLE connector_demo_artifacts (
  connector_id TEXT NOT NULL REFERENCES connector_configs(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  quarter_id TEXT NOT NULL REFERENCES quarters(id),
  kind TEXT NOT NULL CHECK (kind IN ('status', 'notification')),
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (connector_id, team_id, quarter_id, kind)
);
