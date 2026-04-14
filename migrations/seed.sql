-- seed.sql — Comprehensive demo data for local development.
-- Run with: npm run db:seed:local
-- Idempotent: uses INSERT OR IGNORE.
-- Creates a realistic org with 14 users, 3 teams, 3 quarters, 18 epics,
-- capacity plans, votes, and 3 TPM intake interviews.

-- ============================================================
-- Org + Users
-- ============================================================
INSERT OR IGNORE INTO orgs (id, name) VALUES ('default', 'Default Organization');

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

-- ============================================================
-- Teams + Memberships
-- ============================================================
INSERT OR IGNORE INTO teams (id, org_id, slug, name, charter, created_by, updated_by) VALUES
  ('team-platform', 'default', 'platform', 'Platform', 'Core infrastructure, auth, APIs, and developer tooling.', 'user-admin', 'user-admin'),
  ('team-growth', 'default', 'growth', 'Growth', 'User acquisition, onboarding, activation, and retention.', 'user-admin', 'user-admin'),
  ('team-ml', 'default', 'ml-infra', 'ML Infrastructure', 'Training pipelines, model serving, feature stores, and MLOps.', 'user-admin', 'user-admin');

INSERT OR IGNORE INTO team_members (team_id, user_id, team_role) VALUES
  ('team-platform', 'user-em-plat', 'lead'),
  ('team-platform', 'user-ic1', 'member'),
  ('team-platform', 'user-ic2', 'member'),
  ('team-platform', 'user-ic3', 'member'),
  ('team-growth', 'user-em-growth', 'lead'),
  ('team-growth', 'user-ic4', 'member'),
  ('team-growth', 'user-ic5', 'member'),
  ('team-ml', 'user-em-ml', 'lead'),
  ('team-ml', 'user-ic6', 'member'),
  ('team-ml', 'user-ic7', 'member'),
  ('team-ml', 'user-ic8', 'member');

-- ============================================================
-- Quarters
-- ============================================================
INSERT OR IGNORE INTO quarters (id, org_id, label, start_date, end_date, state) VALUES
  ('default:2026Q1', 'default', '2026 Q1', '2026-01-01', '2026-03-31', 'closed'),
  ('default:2026Q2', 'default', '2026 Q2', '2026-04-01', '2026-06-30', 'active'),
  ('default:2026Q3', 'default', '2026 Q3', '2026-07-01', '2026-09-30', 'planning');

-- ============================================================
-- Capacity Plans
-- ============================================================
INSERT OR IGNORE INTO capacity_plans (team_id, quarter_id, total_member_weeks, vacation_weeks, tech_debt_weeks, other_overhead_weeks, updated_by) VALUES
  ('team-platform', 'default:2026Q1', 52, 4, 5, 3, 'user-em-plat'),
  ('team-platform', 'default:2026Q2', 52, 3, 4, 2, 'user-em-plat'),
  ('team-growth', 'default:2026Q1', 39, 3, 3, 2, 'user-em-growth'),
  ('team-growth', 'default:2026Q2', 39, 2, 4, 3, 'user-em-growth'),
  ('team-ml', 'default:2026Q1', 52, 4, 6, 2, 'user-em-ml'),
  ('team-ml', 'default:2026Q2', 52, 3, 5, 3, 'user-em-ml');

-- ============================================================
-- Q1 Epics (closed quarter — mix of done and carried forward)
-- ============================================================
INSERT OR IGNORE INTO epics (id, team_id, quarter_id, title, description, definition_of_done, dri_user_id, dri_committed_weeks, status, percent_complete, sort_order, created_by, updated_by) VALUES
  ('epic-q1-p1', 'team-platform', 'default:2026Q1', 'Migrate auth to OAuth 2.0', 'Replace legacy session tokens with OAuth 2.0 for SSO support.', '- All services use OAuth tokens\n- SSO works with Google\n- Latency < 100ms p99', 'user-ic1', 6, 'done', 100, 1000, 'user-em-plat', 'user-em-plat'),
  ('epic-q1-p2', 'team-platform', 'default:2026Q1', 'API rate limiting v2', 'Implement per-user rate limiting with Redis sliding window.', '- Rate limits enforced per-user\n- Dashboard shows usage\n- 429 responses under 5ms', 'user-ic2', 4, 'done', 100, 2000, 'user-em-plat', 'user-em-plat'),
  ('epic-q1-p3', 'team-platform', 'default:2026Q1', 'Database connection pooling', 'Reduce connection overhead with PgBouncer.', '- PgBouncer in production\n- Connection count < 50\n- No query timeout increase', 'user-ic3', 3, 'in_progress', 60, 3000, 'user-em-plat', 'user-em-plat'),
  ('epic-q1-g1', 'team-growth', 'default:2026Q1', 'Onboarding flow redesign', 'Reduce time-to-value for new users.', '- Activation rate > 40%\n- Time to first action < 5min', 'user-ic4', 5, 'done', 100, 1000, 'user-em-growth', 'user-em-growth'),
  ('epic-q1-g2', 'team-growth', 'default:2026Q1', 'Email drip campaign', 'Automated 7-day email sequence for new signups.', '- 7 emails configured\n- Open rate > 25%\n- Unsubscribe rate < 2%', 'user-ic5', 3, 'in_progress', 40, 2000, 'user-em-growth', 'user-em-growth'),
  ('epic-q1-m1', 'team-ml', 'default:2026Q1', 'Feature store v1', 'Centralized feature store for training and serving.', '- Features available in < 100ms\n- 50+ features registered\n- Training pipeline integrated', 'user-ic6', 8, 'done', 100, 1000, 'user-em-ml', 'user-em-ml'),
  ('epic-q1-m2', 'team-ml', 'default:2026Q1', 'Model monitoring dashboard', 'Real-time drift detection and alerting.', '- Drift alerts within 15min\n- Dashboard shows last 30 days\n- PagerDuty integration', 'user-ic7', 5, 'blocked', 30, 2000, 'user-em-ml', 'user-em-ml');

-- ============================================================
-- Q2 Epics (active quarter — varied statuses)
-- ============================================================
INSERT OR IGNORE INTO epics (id, team_id, quarter_id, title, description, definition_of_done, dri_user_id, dri_committed_weeks, status, percent_complete, at_risk, sort_order, carried_from_epic_id, created_by, updated_by) VALUES
  ('epic-q2-p1', 'team-platform', 'default:2026Q2', 'Database connection pooling', 'Carried from Q1. Reduce connection overhead with PgBouncer.', '- PgBouncer in production\n- Connection count < 50', 'user-ic3', 3, 'in_progress', 70, 0, 1000, 'epic-q1-p3', 'user-em-plat', 'user-em-plat'),
  ('epic-q2-p2', 'team-platform', 'default:2026Q2', 'GraphQL gateway', 'Unified GraphQL layer for mobile clients.', '- All mobile endpoints migrated\n- Latency < 150ms p95\n- Schema published', 'user-ic1', 8, 'in_progress', 35, 0, 2000, NULL, 'user-em-plat', 'user-em-plat'),
  ('epic-q2-p3', 'team-platform', 'default:2026Q2', 'CI/CD pipeline optimization', 'Reduce build times from 12min to under 5min.', '- Build time < 5min p95\n- Flaky test rate < 1%\n- Deploy frequency up 2x', 'user-ic2', 4, 'not_started', 0, 0, 3000, NULL, 'user-em-plat', 'user-em-plat'),
  ('epic-q2-p4', 'team-platform', 'default:2026Q2', 'Secrets management migration', 'Move from env vars to Vault.', '- All secrets in Vault\n- Rotation automated\n- Zero env var secrets in prod', NULL, 5, 'not_started', 0, 0, 4000, NULL, 'user-em-plat', 'user-em-plat'),
  ('epic-q2-p5', 'team-platform', 'default:2026Q2', 'OpenTelemetry instrumentation', 'Add distributed tracing across all services.', '- Traces for all RPC calls\n- Jaeger dashboard\n- p99 latency visible', NULL, 6, 'not_started', 0, 0, 5000, NULL, 'user-em-plat', 'user-em-plat'),
  ('epic-q2-g1', 'team-growth', 'default:2026Q2', 'Email drip campaign', 'Carried from Q1. Complete the 7-day sequence.', '- 7 emails live\n- Open rate > 25%', 'user-ic5', 3, 'in_progress', 80, 0, 1000, 'epic-q1-g2', 'user-em-growth', 'user-em-growth'),
  ('epic-q2-g2', 'team-growth', 'default:2026Q2', 'A/B testing framework', 'Self-serve experimentation for product teams.', '- SDK integrated\n- 3+ experiments running\n- Results dashboard', 'user-ic4', 6, 'in_progress', 20, 1, 2000, NULL, 'user-em-growth', 'user-em-growth'),
  ('epic-q2-g3', 'team-growth', 'default:2026Q2', 'Referral program v2', 'Two-sided incentive system.', '- Referral flow live\n- 5% of signups via referral\n- Fraud rate < 0.5%', NULL, 4, 'not_started', 0, 0, 3000, NULL, 'user-em-growth', 'user-em-growth'),
  ('epic-q2-m1', 'team-ml', 'default:2026Q2', 'Model monitoring dashboard', 'Carried from Q1. Complete drift detection.', '- Drift alerts within 15min\n- PagerDuty integration', 'user-ic7', 5, 'in_progress', 50, 0, 1000, 'epic-q1-m2', 'user-em-ml', 'user-em-ml'),
  ('epic-q2-m2', 'team-ml', 'default:2026Q2', 'GPU training cluster autoscaling', 'Auto-scale GPU nodes based on training queue depth.', '- Cluster scales 2-16 nodes\n- Queue wait < 10min\n- Cost < $50k/month', 'user-ic6', 7, 'at_risk', 15, 1, 2000, NULL, 'user-em-ml', 'user-em-ml'),
  ('epic-q2-m3', 'team-ml', 'default:2026Q2', 'Inference optimization', 'Reduce model serving latency by 40%.', '- p99 latency < 50ms\n- Throughput > 1000 req/s\n- No accuracy regression', 'user-ic8', 4, 'not_started', 0, 0, 3000, NULL, 'user-em-ml', 'user-em-ml');

-- ============================================================
-- Votes (Q2 epics — varied consensus)
-- ============================================================
INSERT OR IGNORE INTO epic_votes (epic_id, user_id, value, time_criticality, risk_reduction, duration_estimate_weeks) VALUES
  -- Platform: connection pooling (high consensus)
  ('epic-q2-p1', 'user-em-plat', 7, 8, 6, 3),
  ('epic-q2-p1', 'user-ic1', 8, 7, 7, 4),
  ('epic-q2-p1', 'user-ic2', 7, 8, 6, 3),
  ('epic-q2-p1', 'user-ic3', 8, 7, 7, 3),
  -- Platform: GraphQL (moderate consensus)
  ('epic-q2-p2', 'user-em-plat', 9, 6, 3, 8),
  ('epic-q2-p2', 'user-ic1', 7, 4, 2, 10),
  ('epic-q2-p2', 'user-ic2', 8, 7, 4, 7),
  -- Platform: CI/CD (high disagreement on value)
  ('epic-q2-p3', 'user-em-plat', 9, 5, 8, 4),
  ('epic-q2-p3', 'user-ic1', 4, 3, 9, 3),
  ('epic-q2-p3', 'user-ic2', 8, 7, 7, 5),
  ('epic-q2-p3', 'user-ic3', 3, 4, 6, 4),
  -- Growth: A/B testing (high value consensus)
  ('epic-q2-g2', 'user-em-growth', 9, 8, 7, 6),
  ('epic-q2-g2', 'user-ic4', 10, 7, 8, 5),
  ('epic-q2-g2', 'user-ic5', 8, 8, 6, 7),
  -- ML: GPU autoscaling (at-risk, high urgency)
  ('epic-q2-m2', 'user-em-ml', 8, 10, 9, 8),
  ('epic-q2-m2', 'user-ic6', 9, 9, 8, 7),
  ('epic-q2-m2', 'user-ic7', 7, 10, 7, 9),
  ('epic-q2-m2', 'user-ic8', 8, 9, 8, 6);

-- ============================================================
-- TPM Intake Interviews
-- ============================================================
INSERT OR IGNORE INTO interviews (id, org_id, lead_user_id, conducted_by_user_id, conducted_at, q1_scope, q2_challenges, q3_must_know, q4_blue_sky, ai_synthesis) VALUES
  ('intv-1', 'default', 'user-em-plat', 'user-tpm', '2026-04-02',
   'I manage the Platform team — 4 engineers. We own auth, APIs, developer tooling, and the CI/CD pipeline. Everything other teams build on top of.',
   '1. Technical debt in the auth system is slowing every feature team. 2. Our CI pipeline takes 12 minutes and developers lose focus. 3. Cross-team API contracts are informal — we get broken by downstream changes constantly.',
   '1. The auth migration is the single most important project this quarter. 2. Developer experience is a force multiplier — small improvements here affect everyone. 3. We are chronically under-staffed relative to our scope.',
   'I wish a TPM could help us formalize API contracts across teams so we stop breaking each other. A lightweight API governance process would save hundreds of engineering hours per quarter.',
   '{"scopeSummary":"Platform team owns core infrastructure including auth, APIs, developer tooling, and CI/CD for 4 engineers.","topChallenges":["Auth system technical debt blocking feature teams","CI pipeline too slow (12min) causing developer focus loss","Informal cross-team API contracts causing breakage"],"suggestedThemes":["technical debt","developer experience","cross-team coordination","API governance","understaffing"],"recommendedActions":["Prioritize auth migration as Q2 blocker","Investigate CI pipeline bottlenecks","Propose lightweight API contract process"]}'),

  ('intv-2', 'default', 'user-em-growth', 'user-tpm', '2026-04-03',
   'Growth team — 3 engineers. We handle user acquisition, onboarding, activation, and retention. Our north star is activation rate.',
   '1. We don''t have a proper experimentation framework so we can''t measure impact of changes. 2. Cross-team dependencies on Platform for API changes slow us down by weeks. 3. Our onboarding data is unreliable — we make decisions on gut feel.',
   '1. The team is highly motivated but frustrated by tooling gaps. 2. We ship fast but can''t prove what works. 3. The referral program is a leadership priority but we haven''t started.',
   'A TPM who could broker faster API turnaround with Platform would immediately unblock 2-3 of our Q2 initiatives.',
   '{"scopeSummary":"Growth team of 3 engineers focused on acquisition, onboarding, activation, and retention with activation rate as north star.","topChallenges":["No experimentation framework prevents measuring impact","Cross-team dependency on Platform causes multi-week delays","Unreliable onboarding data forces gut-feel decisions"],"suggestedThemes":["experimentation","cross-team coordination","data quality","tooling gaps","leadership priorities"],"recommendedActions":["Fast-track A/B testing framework as force multiplier","Negotiate SLA with Platform for API change requests","Audit onboarding data pipeline for reliability"]}'),

  ('intv-3', 'default', 'user-em-ml', 'user-tpm', '2026-04-04',
   'ML Infrastructure — 4 engineers. We build and maintain training pipelines, model serving infrastructure, feature stores, and MLOps tooling.',
   '1. GPU costs are spiraling — we need autoscaling but it''s complex. 2. Model serving latency is too high for real-time use cases. 3. The monitoring dashboard from Q1 is still incomplete because we got pulled into firefighting.',
   '1. This team has deep technical expertise but poor project estimation. Our Q1 estimates were off by 40%. 2. We depend on Platform''s infrastructure but our needs are different from web services. 3. The feature store launch was a major win — protect it.',
   'I''d love a TPM to help us build better estimation practices. Our team consistently underestimates and then feels demoralized when things slip.',
   '{"scopeSummary":"ML Infrastructure team of 4 engineers managing training pipelines, model serving, feature stores, and MLOps.","topChallenges":["GPU costs spiraling without autoscaling","Model serving latency too high for real-time","Q1 monitoring dashboard incomplete due to firefighting"],"suggestedThemes":["cost management","estimation accuracy","technical debt","cross-team coordination","firefighting"],"recommendedActions":["Support GPU autoscaling as cost-critical initiative","Help team adopt estimation improvement practices","Shield team from ad-hoc firefighting requests"]}');

-- ============================================================
-- Interview Themes
-- ============================================================
INSERT OR IGNORE INTO interview_themes (id, org_id, label, description) VALUES
  ('theme-1', 'default', 'cross-team coordination', 'Multiple teams cite dependency delays and informal contracts'),
  ('theme-2', 'default', 'technical debt', 'Legacy systems blocking new feature development'),
  ('theme-3', 'default', 'developer experience', 'Slow CI, poor tooling affecting velocity'),
  ('theme-4', 'default', 'estimation accuracy', 'Teams consistently underestimate effort'),
  ('theme-5', 'default', 'data quality', 'Unreliable metrics undermining decision-making');
