-- 0007_reports.sql — Report snapshots for weekly deltas
-- Phase 2: captures quarter state for comparison over time.

CREATE TABLE report_snapshots (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  quarter_id TEXT NOT NULL REFERENCES quarters(id),
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  generated_by TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  metadata TEXT,
  PRIMARY KEY (id)
);
CREATE INDEX idx_reports_org_quarter ON report_snapshots(org_id, quarter_id, generated_at DESC);
