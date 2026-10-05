import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { listConnectors, createConnector, toConnectorResponse } from "../../../_lib/db/queries/connectors";
import { CreateConnectorSchema } from "../../../../src/lib/tpmos/schemas/connector";
interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageUsers", {}, { userTeamIds })) return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  return Response.json((await listConnectors(context.env.DB, user.orgId)).map(toConnectorResponse));
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageUsers", {}, { userTeamIds })) return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  const body = CreateConnectorSchema.safeParse(await context.request.json().catch(() => null));
  if (!body.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Choose a demo connector without credentials", details: body.error.format() } }, { status: 400 });
  const duplicate = (await listConnectors(context.env.DB, user.orgId)).some(c => c.type === body.data.type && c.name === body.data.name);
  if (duplicate) return Response.json({ error: { code: "DUPLICATE", message: "Connector name already exists" } }, { status: 409 });
  const connector = await createConnector(context.env.DB, user.orgId, body.data, user.id);
  return connector ? Response.json(toConnectorResponse(connector), { status: 201 }) : Response.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
};
