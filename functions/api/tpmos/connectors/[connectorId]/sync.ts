import { getAuth } from "../../../../_lib/auth/context";
import { can } from "../../../../_lib/auth/can";
import { getConnectorById, updateSyncStatus, toConnectorResponse } from "../../../../_lib/db/queries/connectors";
import { getTeamBySlug } from "../../../../_lib/db/queries/teams";
import { getQuarterById } from "../../../../_lib/db/queries/quarters";
import { isDemoConnector, syncDemo } from "../../../../_lib/connectors/demo";
interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageUsers", {}, { userTeamIds })) return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  const url = new URL(context.request.url);
  const teamSlug = url.searchParams.get("team"), quarterId = url.searchParams.get("quarter");
  if (!teamSlug || !quarterId) return Response.json({ error: { code: "VALIDATION_ERROR", message: "team and quarter required" } }, { status: 400 });
  const row = await getConnectorById(context.env.DB, context.params.connectorId as string, user.orgId);
  if (!row) return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  const config = toConnectorResponse(row);
  if (!isDemoConnector(config)) return Response.json({ error: { code: "DEMO_ONLY", message: "Only enabled demo connectors can run" } }, { status: 400 });
  const team = await getTeamBySlug(context.env.DB, user.orgId, teamSlug);
  const quarter = await getQuarterById(context.env.DB, quarterId);
  if (!team || team.archived || !quarter || quarter.org_id !== user.orgId) return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  if (quarter.state === "closed") return Response.json({ error: { code: "QUARTER_CLOSED" } }, { status: 409 });
  try {
    const result = await syncDemo(context.env.DB, config, team.id, quarterId, user.id);
    await updateSyncStatus(context.env.DB, config.id, `demo: ${result.synced} imported, ${result.existing} existing; preview only`);
    return Response.json(result);
  } catch {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Demo failed; retry after checking the local database migrations" } }, { status: 500 });
  }
};
