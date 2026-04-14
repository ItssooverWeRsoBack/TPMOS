-- 0004_intake.sql — TPM Intake interviews and theme clustering
-- See docs/DATA_MODEL.md for schema documentation.

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
  ai_synthesis TEXT,
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
