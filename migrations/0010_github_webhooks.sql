CREATE TABLE github_webhook_connections (
  connector_id TEXT PRIMARY KEY REFERENCES connector_configs(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES orgs(id), repository_id INTEGER NOT NULL,
  repository_name TEXT NOT NULL COLLATE NOCASE,
  team_id TEXT NOT NULL REFERENCES teams(id), quarter_id TEXT NOT NULL REFERENCES quarters(id),
  enabled INTEGER NOT NULL DEFAULT 1, secret_version INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(org_id, repository_id, team_id, quarter_id)
);
CREATE INDEX idx_github_connections_org ON github_webhook_connections(org_id);
ALTER TABLE epics ADD COLUMN external_updated_at TEXT;
CREATE TABLE github_webhook_deliveries (
  connection_id TEXT NOT NULL REFERENCES github_webhook_connections(connector_id) ON DELETE CASCADE,
  delivery_id TEXT NOT NULL, attempt_token TEXT NOT NULL,
  event TEXT NOT NULL, action TEXT, issue_number INTEGER,
  result TEXT NOT NULL, received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY(connection_id, delivery_id)
);
CREATE INDEX idx_github_delivery_recent ON github_webhook_deliveries(connection_id, received_at DESC);

-- Compact identity ledger outlives the bounded display log, so old deliveries stay idempotent.
CREATE TABLE github_webhook_receipts (
  connection_id TEXT NOT NULL REFERENCES github_webhook_connections(connector_id) ON DELETE CASCADE,
  delivery_id TEXT NOT NULL, attempt_token TEXT NOT NULL, result TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(connection_id, delivery_id)
);
