-- 0008_connectors.sql — Connector configurations for external integrations
-- Phase 3: stores credentials and settings for GitHub, Linear, Slack connectors.

CREATE TABLE connector_configs (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  type TEXT NOT NULL CHECK (type IN ('github','linear','slack','notion')),
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  credentials TEXT NOT NULL DEFAULT '{}',
  settings TEXT NOT NULL DEFAULT '{}',
  last_sync_at TEXT,
  last_sync_status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE(org_id, type, name)
);
CREATE INDEX idx_connectors_org ON connector_configs(org_id, type);
