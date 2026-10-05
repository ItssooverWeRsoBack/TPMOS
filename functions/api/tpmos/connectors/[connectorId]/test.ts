import { getAuth } from "../../../../_lib/auth/context";
import { can } from "../../../../_lib/auth/can";
import { getConnectorById, toConnectorResponse } from "../../../../_lib/db/queries/connectors";
import { isDemoConnector } from "../../../../_lib/connectors/demo";
interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageUsers", {}, { userTeamIds })) return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  const row = await getConnectorById(context.env.DB, context.params.connectorId as string, user.orgId);
  if (!row) return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  if (!isDemoConnector(toConnectorResponse(row))) return Response.json({ error: { code: "DEMO_ONLY", message: "Only enabled demo connectors can be tested" } }, { status: 400 });
  return Response.json({ ok: true, mode: "demo", message: "Fixture contract validated; no provider contacted" });
};
