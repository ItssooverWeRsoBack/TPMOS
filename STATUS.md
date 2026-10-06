# TPMOS Build Status

> Single source of truth for build progress.

**Last updated:** 2026-10-05
**Last actor:** Codex
**Current phase:** ALL PHASES COMPLETE (MVP + Phase 2 + Phase 3)
**Version:** v0.3.0

## All 15+ Surfaces — FUNCTIONAL

| # | Surface | Phase |
|---|---|---|
| 1 | Auth / Login | MVP |
| 2 | Home (activity feed + risk alerts) | MVP + P2 |
| 3 | Teams Directory | MVP |
| 4 | Team Detail | MVP |
| 5 | Quarterly Planning (drag-and-drop planner) | MVP |
| 6 | Epic Detail (sliding panel) | MVP + P3 |
| 7 | Quarter Management | MVP |
| 8 | Leadership Goals (gap detection) | P2 |
| 9 | Initiative Mapping (goals↔epics) | P2 |
| 10 | Executive Dashboard (rollups, heatmap) | P2 |
| 11 | TPM Intake (AI synthesis) | MVP |
| 12 | Reporting/Export (AI narrative) | P2 |
| 13 | Capacity Planning | MVP |
| 14 | Risks Feed | MVP |
| 15 | Admin + Audit Log | MVP + P2 |
| 16 | Integrations (GitHub/Linear/Slack) | P3 |
| 17 | Onboarding Wizard | P3 |

## All Milestones — COMPLETE

### MVP (v0.1.0) — 12 milestones
M0-M11: Bootstrap through polish

### Phase 2 (v0.2.0) — 6 milestones
P2-M1 Goals, P2-M2 Initiatives, P2-M3 Dashboard, P2-M4 Reports, P2-M5 Enhancements, P2-M6 Integration stubs

### Phase 3 (v0.3.0) — 10 milestones
P3-M1 GitHub connector, P3-M2 Linear connector, P3-M3 Slack connector,
P3-M4 Multi-org, P3-M5 Vector embeddings, P3-M6 Epic detail panel,
P3-M7 Estimate AI (C1), P3-M8 Mobile responsive, P3-M9 Onboarding wizard,
P3-M10 JWKS JWT verification

## Final Stats

| Metric | Count |
|---|---|
| Surfaces | 17 |
| Files | ~200 |
| Tests | 194 |
| Migrations | 8 |
| API endpoints | 40+ |
| AI hooks | 6 (A1, A2, B1, B2, B3, C1) |
| Connectors | 3 (GitHub, Linear, Slack) |
| Domain functions | 5 + embeddings |
| Phases completed | 3 |
| Milestones completed | 28 |

## M12.1 — Demo integration completion

- [x] Shared runtime-validated GitHub/Linear/Slack demo contracts and UI.
- [x] Admin-only fixture tests/imports; reject live and disabled connectors.
- [x] Scoped connector/team/quarter access; closed quarters reject imports.
- [x] Unique external identity; repeated imports retain local epic edits.
- [x] Persist simulated status and Slack artifacts; no outbound delivery.
- [x] Credential-free creation and responses, dotted-email local auth repair, atomic epic PATCH version predicate.

**Active task:** M12.1 complete — hosted demo implementation published.
**Deployment:** Migrations 0008 and 0009 were applied to hosted D1 on 2026-10-05. Validation: 202 tests pass, typecheck passes, lint has no errors, production export passes, and 26 local HTTP requests / 36 collection assertions pass. Hosted deployment: commit 39f3bd8 deployed to Cloudflare Pages production (4c9ced74-1835-458f-95dc-0a31f9b5e1f3).
**Next 3 actions:** Use hosted demos with an approved administrator account; collect walkthrough feedback; consider live provider delivery only under a new explicit decision.

Historical Phase 3 completion above does not establish live provider readiness. DEC-0016 supersedes live integration work; current application test/sync routes run fixtures only. Existing provider adapters remain available for source review and mock tests. At the M12.1 snapshot, production auth still trusted the Access identity header and had a decode-only fallback; M12.2 below removes those production fallbacks.

**Live checks:** Hosted /admin/connectors/ serves the new UI; custom-domain requests redirect to Access. Unauthenticated API requests return 401; production /dev/login returns 404. No signed-in production demo mutations were run from this session. The primary user path is https://tpmos.torfinn.xyz/admin/connectors/ and the companion guide is https://torfinn.xyz/architectures/tpmos.

**Migration reconciliation:** Production already contained the exact table/constraint definitions for migrations 0006 and 0007 but lacked their history rows. Saved a private pre-release D1 backup, verified schema equality, ensured their indexes, and recorded those migrations before applying 0008/0009. Existing planning records were preserved.

## M12.2 — Hosted GitHub issue webhooks

- [x] Separate signed Cloudflare receiver and scoped repository/team/quarter connections.
- [x] Atomic issue upsert + persistent receipt ledger; stale timestamps and duplicate protection.
- [x] Hosted setup, delivery log, disable/enable and versioned secret rotation.
- [x] Fail-closed production Access signature/issuer/audience validation.
- [x] Dedicated docs/GITHUB_WEBHOOKS.md linked from the main README.
- [x] 212 unit/integration tests pass, including real SQLite transactions.

**Active task:** M12.2 complete — hosted GitHub webhooks and README-linked usage guide published.
**Deployment:** Migration 0010 applied; separate tpmos-github-webhooks Worker deployed with shared secret; Pages commit f4bc147 deployed. Practice repository ItssooverWeRsoBack/webhook-practice is connected to the separate Webhook Practice team/quarter. GitHub ping/open/edit/close/reopen deliveries update the same epic; replay returns 200 without advancing its version.
**Validation:** 212 tests, typecheck, production build, receiver bundle and actual Miniflare D1 transaction checks pass. GitHub CI succeeds. Hosted pages.dev rejects header-only identity with 401; production dev login is 404.
**Cost:** No paid subscription, queue, scheduler or AI call was enabled. Workers/D1 features support Free quotas; current credential cannot read subscriptions, so account billing must be checked in the Cloudflare dashboard before asserting a guaranteed $0 bill.
**Next 3 actions:** Practice through the hosted repository/plan; add further repository connections as needed; confirm account Workers Free status in the billing dashboard.


## M12.3 — Repository setup form usability

- [x] Shared schema accepts owner/repository or a full GitHub repository page URL.
- [x] Human-readable inline field validation replaces raw Zod regex JSON errors.
- [x] Existing connection guidance and local duplicate detection prevent unnecessary reconnect attempts.
- [x] Schema regression tests cover normalization, hostile URLs and connection fields.

**Active task:** M12.3 complete — repository setup usability deployed.
**Validation:** 215 tests, typecheck and production build pass; lint has no errors (existing warnings remain). Commit 99d3b5e deployed successfully through Cloudflare Pages, with successful GitHub CI. The hosted input accepts owner/repository or a full GitHub URL and shows readable field errors; the existing practice connection remains active.
**Companion:** The current systems design workflow, JSON examples/schema, optional signed client and 17-stop pinned code tour are published at https://torfinn.xyz/architectures/tpmos.
**Next action:** Use the existing practice repository and plan to exercise issue events; no reconnection is required.
