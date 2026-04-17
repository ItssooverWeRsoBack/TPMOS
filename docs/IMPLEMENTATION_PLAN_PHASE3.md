# IMPLEMENTATION_PLAN_PHASE3.md

**Status:** Active
**Phase:** Phase 3 — Integrations, scale, polish
**Last updated:** 2026-04-17

---

## Milestones

| ID | Goal | Key deliverables |
|---|---|---|
| **P3-M1** | GitHub connector | Issue sync, status push, PAT auth, connector settings UI |
| **P3-M2** | Linear connector | GraphQL sync, status push, API key auth |
| **P3-M3** | Slack connector | Event notifications via Block Kit, bot token auth |
| **P3-M4** | Multi-org | Org switcher, org creation, invite flow, data isolation |
| **P3-M5** | Vector embeddings | Workers AI bge-base-en, cosine similarity clustering |
| **P3-M6** | Epic detail panel | Sliding sheet from planner with full edit/view |
| **P3-M7** | Estimate AI (C1) | Historical comparison, outlier detection |
| **P3-M8** | Mobile responsive | Sidebar collapse, touch drag, stacked layouts |
| **P3-M9** | Onboarding wizard | Guided first-run: team → interview → quarter |
| **P3-M10** | JWT verification | JWKS-based CF_Authorization signature verification |

---

## P3-M1 — GitHub Connector

### Tasks
- P3-M1.1 Migration `0008_connectors.sql`: connector_configs table
- P3-M1.2 Connector settings API: GET/POST/PATCH /api/tpmos/connectors
- P3-M1.3 Implement GitHubConnector.testConnection (validate PAT)
- P3-M1.4 Implement GitHubConnector.syncEpics (fetch issues → EpicDraft[])
- P3-M1.5 Implement GitHubConnector.syncStatus (update issue labels)
- P3-M1.6 Connector settings page in admin: configure repo, PAT, sync triggers
- P3-M1.7 "Import from GitHub" button on plan page

### DoD
Connect a public repo, import 5 issues as epic drafts, verify status sync back.

---

## P3-M2 — Linear Connector

### Tasks
- P3-M2.1 Implement LinearConnector.testConnection (GraphQL viewer query)
- P3-M2.2 Implement LinearConnector.syncEpics (query project issues)
- P3-M2.3 Implement LinearConnector.syncStatus (update issue state)
- P3-M2.4 Linear config in connector settings page

### DoD
Connect Linear workspace, import issues from one project, verify bidirectional status.

---

## P3-M3 — Slack Connector

### Tasks
- P3-M3.1 Implement SlackConnector.testConnection (auth.test)
- P3-M3.2 Implement SlackConnector.notify (Block Kit message formatter)
- P3-M3.3 Event dispatch: add notify calls to epic status change, quarter lock/close, risk flagged
- P3-M3.4 Slack config in connector settings page

### DoD
Configure a Slack channel. Epic status change posts a formatted message within 5s.

---

## P3-M4 — Multi-Org Support

### Tasks
- P3-M4.1 Org creation API: POST /api/tpmos/orgs
- P3-M4.2 Org switcher component in sidebar
- P3-M4.3 Middleware reads org from cookie/header instead of hardcoded "default"
- P3-M4.4 All queries already namespace by org_id — verify isolation
- P3-M4.5 Invite flow: generate invite link, accept creates user in target org

### DoD
Create a second org, switch between them, verify complete data isolation.

---

## P3-M5 — Vector Embeddings

### Tasks
- P3-M5.1 Embed interview responses using Workers AI bge-base-en-v1.5
- P3-M5.2 Store embeddings in interview_themes.embedding column (BLOB)
- P3-M5.3 Cosine similarity function for clustering
- P3-M5.4 Agglomerative clustering with configurable similarity threshold
- P3-M5.5 Update cluster-themes endpoint to use real embeddings
- P3-M5.6 Update ThemeClusterViz to show similarity-based layout

### DoD
3 interviews with different wording for the same theme cluster together automatically.

---

## P3-M6 — Epic Detail Panel

### Tasks
- P3-M6.1 EpicDetailSheet component: sliding panel (right side)
- P3-M6.2 Full epic form with all fields (title, desc, DoD, DRI, duration, status)
- P3-M6.3 Vote summary + cast vote inline
- P3-M6.4 AI draft button inline
- P3-M6.5 Wire into PlannerBoard: click epic card opens panel
- P3-M6.6 Wire into Board page: click row opens panel

### DoD
Click an epic in the planner, panel slides in with full edit. Save updates the planner in real time.

---

## P3-M7 — Estimate Sanity Check (AI C1)

### Tasks
- P3-M7.1 Historical epic query: find completed epics with similar titles
- P3-M7.2 AI prompt: compare new estimate against historical data
- P3-M7.3 POST /api/tpmos/ai/check-estimate endpoint
- P3-M7.4 Inline warning in EpicForm when estimate deviates significantly
- P3-M7.5 Requires 2+ quarters of history to be useful

### DoD
Enter a 2-week estimate for something that historically took 6 weeks → warning appears.

---

## P3-M8 — Mobile Responsive

### Tasks
- P3-M8.1 Sidebar: collapsible with hamburger toggle, overlay on mobile
- P3-M8.2 Tables: horizontal scroll or card view below 768px
- P3-M8.3 Planner: simplified list view (no drag on touch, reorder via buttons)
- P3-M8.4 Forms: full-width inputs, stacked layouts
- P3-M8.5 Dashboard: single-column card stack on mobile

### DoD
All 15 surfaces usable on a 375px viewport. No horizontal overflow.

---

## P3-M9 — Onboarding Wizard

### Tasks
- P3-M9.1 First-run detection: user has no teams and no interviews
- P3-M9.2 Multi-step wizard component: step indicator, back/next, skip
- P3-M9.3 Step 1: Create your first team + add yourself as lead
- P3-M9.4 Step 2: Conduct your first interview (prefilled questions)
- P3-M9.5 Step 3: Create the current quarter + declare capacity
- P3-M9.6 Step 4: Create your first epic
- P3-M9.7 Completion: redirect to planner with congratulations toast

### DoD
New TPM user lands on wizard, completes 4 steps in < 5 minutes, lands on populated planner.

---

## P3-M10 — JWKS JWT Verification

### Tasks
- P3-M10.1 Fetch JWKS from `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`
- P3-M10.2 Cache JWKS keys (1 hour TTL)
- P3-M10.3 Verify JWT signature using Web Crypto API
- P3-M10.4 Verify claims: aud, iss, exp
- P3-M10.5 Replace decode-only with verify-then-decode in middleware
- P3-M10.6 Add team domain to wrangler.toml vars

### DoD
Forged JWT cookie is rejected. Valid JWT passes. Expired JWT is rejected.
