import { getAuth } from "../../_lib/auth/context";
import { can } from "../../_lib/auth/can";
import { getTeamBySlug } from "../../_lib/db/queries/teams";
import { TeamPlanningContextSchema } from "../../../src/lib/tpmos/schemas/planning-context";
interface Env { DB: D1Database; ENV: string; }
export const onRequestGet: PagesFunction<Env> = async context => {
  const { user, userTeamIds } = getAuth(context);
  const slug = new URL(context.request.url).searchParams.get("team");
  if (!slug) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Choose a team" } }, { status: 400 });
  const team = await getTeamBySlug(context.env.DB, user.orgId, slug);
  if (!team) return Response.json({ error: { code: "NOT_FOUND", message: "Team not found" } }, { status: 404 });
  if (!can(user, "viewTeam", { teamId: team.id }, { userTeamIds })) return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  const result = await context.env.DB.prepare(`SELECT q.id,q.label,q.state,q.start_date,q.end_date,
    (SELECT COUNT(*) FROM epics e WHERE e.team_id = ? AND e.quarter_id = q.id) AS epic_count,
    EXISTS(SELECT 1 FROM capacity_plans c WHERE c.team_id = ? AND c.quarter_id = q.id) AS has_capacity,
    EXISTS(SELECT 1 FROM github_webhook_connections h WHERE h.team_id = ? AND h.quarter_id = q.id AND h.org_id = q.org_id AND h.enabled = 1) AS has_webhook
    FROM quarters q WHERE q.org_id = ? ORDER BY q.start_date DESC, q.created_at DESC, q.id`)
    .bind(team.id, team.id, team.id, user.orgId).all<{ id: string; label: string; state: string; start_date: string; end_date: string; epic_count: number; has_capacity: number; has_webhook: number }>();
  return Response.json(TeamPlanningContextSchema.parse({ teamId: team.id, quarters: result.results.map(q => ({ id: q.id, label: q.label, state: q.state, startDate: q.start_date, endDate: q.end_date, epicCount: q.epic_count, hasCapacity: q.has_capacity === 1, hasWebhook: q.has_webhook === 1 })) }), { headers: { "Cache-Control": "no-store" } });
};
