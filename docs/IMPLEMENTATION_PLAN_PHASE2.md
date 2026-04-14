# IMPLEMENTATION_PLAN_PHASE2.md — Draft

**Status:** Draft — not yet active. Written at MVP completion. Will be refined after MVP usage feedback.

> This plan covers the 4 placeholder surfaces (Goals, Initiatives, Dashboard, Reports) plus Phase 2 enhancements to MVP surfaces. It inherits all conventions from [`IMPLEMENTATION_PLAN_MVP.md`](IMPLEMENTATION_PLAN_MVP.md).

---

## Phase 2 Milestones (proposed)

### P2-M1 — Leadership Goals
- Migration `0006_goals_initiatives.sql` (goals, initiatives, goal_initiative_map, initiative_epic_map)
- Goal CRUD API with status tracking
- Goal management page (replaces placeholder)
- Goal detail page with mapped initiatives
- AI hook B4: goal-to-epic mapping suggestions

### P2-M2 — Initiative / Product Mapping
- Initiative CRUD API
- Many-to-many mapping: goals ↔ initiatives ↔ epics
- Initiative page with contributing teams + epics
- Coverage gap detector: goals with no mapped execution
- Overlap detector: multiple teams working on same thing

### P2-M3 — Executive Dashboard
- Multi-team progress rollup
- Risk concentration heatmap by team
- Goal coverage visualization
- Quarter-over-quarter trend charts
- AI hook B5: risk narrative generation

### P2-M4 — Reporting / Export
- Migration `0007_reports.sql` (report_snapshots)
- Weekly report generator from quarter state
- Delta computation vs prior week's snapshot
- AI hook B3: narrated executive summary
- Markdown export, copy-as-image

### P2-M5 — Enhancements to MVP surfaces
- Audit log UI (reads from audit_log table, M11 writes only)
- Improved home page with activity feed
- Team detail with tabbed view (overview + links to plan/board/capacity)
- Epic detail side sheet (full edit in a sliding panel)
- Command palette wired to real navigation + search
- Theme clustering with real embeddings (Workers AI bge-base-en)

### P2-M6 — Integration scaffolding
- Connector interface implementation
- GitHub connector stub
- Linear connector stub
- Slack notification stub
- Cloudflare Cron Trigger for periodic sync

---

## Prerequisites
- MVP shipped and stable
- At least 2 weeks of real usage to validate planning loop UX
- User feedback on which Phase 2 surface is most wanted (prioritize accordingly)

## How to activate this plan
1. Rename this file to `IMPLEMENTATION_PLAN_PHASE2_ACTIVE.md`
2. Create tasks in GitHub Issues with `phase:p2` label
3. Update `STATUS.md` to reference Phase 2 milestone
4. Follow the same conventions as MVP (see `AGENTS.md`)
