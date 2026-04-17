/**
 * GET  /api/tpmos/connectors — list connector configs
 * POST /api/tpmos/connectors — create connector config
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { listConnectors, createConnector, toConnectorResponse } from "../../../_lib/db/queries/connectors";
import { z } from "zod/v4";

const CreateSchema = z.object({
  type: z.enum(["github", "linear", "slack", "notion"]),
  name: z.string().min(1).max(100),
  credentials: z.record(z.string(), z.string()),
  settings: z.record(z.string(), z.unknown()),
});

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageUsers", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  }
  const connectors = await listConnectors(context.env.DB, user.orgId);
  // Mask credentials in response
  return Response.json(connectors.map((c) => {
    const resp = toConnectorResponse(c);
    resp.credentials = Object.fromEntries(
      Object.entries(resp.credentials).map(([k, v]) => [k, typeof v === "string" && v.length > 8 ? `${v.slice(0, 4)}...${v.slice(-4)}` : "****"])
    );
    return resp;
  }));
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageUsers", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  }

  const body = CreateSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const connector = await createConnector(context.env.DB, user.orgId, body.data, user.id);
  if (!connector) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create" } }, { status: 500 });
  }

  return Response.json(toConnectorResponse(connector), { status: 201 });
};
