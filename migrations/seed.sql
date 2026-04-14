-- seed.sql — Demo data for local development and first-time setup.
-- Run with: npm run db:seed:local
-- Idempotent: uses INSERT OR IGNORE.

-- Default org (already created by 0001_init.sql, but safe to re-insert)
INSERT OR IGNORE INTO orgs (id, name) VALUES ('default', 'Default Organization');

-- Users
INSERT OR IGNORE INTO users (id, org_id, email, display_name, role) VALUES
  ('user-admin', 'default', 'admin@example.com', 'Admin User', 'admin'),
  ('user-tpm', 'default', 'tpm@example.com', 'Sarah Chen', 'tpm'),
  ('user-em-plat', 'default', 'em-platform@example.com', 'Marcus Johnson', 'em'),
  ('user-em-growth', 'default', 'em-growth@example.com', 'Priya Patel', 'em'),
  ('user-em-ml', 'default', 'em-ml@example.com', 'David Kim', 'em'),
  ('user-ic1', 'default', 'ic1@example.com', 'Alex Rivera', 'ic'),
  ('user-ic2', 'default', 'ic2@example.com', 'Jordan Lee', 'ic'),
  ('user-ic3', 'default', 'ic3@example.com', 'Taylor Brooks', 'ic'),
  ('user-ic4', 'default', 'ic4@example.com', 'Morgan Chen', 'ic'),
  ('user-ic5', 'default', 'ic5@example.com', 'Casey Williams', 'ic'),
  ('user-ic6', 'default', 'ic6@example.com', 'Riley Thompson', 'ic'),
  ('user-ic7', 'default', 'ic7@example.com', 'Sam Nakamura', 'ic'),
  ('user-ic8', 'default', 'ic8@example.com', 'Jamie Park', 'ic'),
  ('user-exec', 'default', 'exec@example.com', 'VP Engineering', 'exec');

-- Teams
INSERT OR IGNORE INTO teams (id, org_id, slug, name, charter, created_by, updated_by) VALUES
  ('team-platform', 'default', 'platform', 'Platform', 'Core infrastructure, auth, APIs, and developer tooling.', 'user-admin', 'user-admin'),
  ('team-growth', 'default', 'growth', 'Growth', 'User acquisition, onboarding, activation, and retention.', 'user-admin', 'user-admin'),
  ('team-ml', 'default', 'ml-infra', 'ML Infrastructure', 'Training pipelines, model serving, feature stores, and MLOps.', 'user-admin', 'user-admin');

-- Team memberships
INSERT OR IGNORE INTO team_members (team_id, user_id, team_role) VALUES
  -- Platform team
  ('team-platform', 'user-em-plat', 'lead'),
  ('team-platform', 'user-ic1', 'member'),
  ('team-platform', 'user-ic2', 'member'),
  ('team-platform', 'user-ic3', 'member'),
  -- Growth team
  ('team-growth', 'user-em-growth', 'lead'),
  ('team-growth', 'user-ic4', 'member'),
  ('team-growth', 'user-ic5', 'member'),
  -- ML Infra team
  ('team-ml', 'user-em-ml', 'lead'),
  ('team-ml', 'user-ic6', 'member'),
  ('team-ml', 'user-ic7', 'member'),
  ('team-ml', 'user-ic8', 'member');

-- Quarters
INSERT OR IGNORE INTO quarters (id, org_id, label, start_date, end_date, state) VALUES
  ('default:2026Q1', 'default', '2026 Q1', '2026-01-01', '2026-03-31', 'closed'),
  ('default:2026Q2', 'default', '2026 Q2', '2026-04-01', '2026-06-30', 'active'),
  ('default:2026Q3', 'default', '2026 Q3', '2026-07-01', '2026-09-30', 'planning');
