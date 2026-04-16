/**
 * GET  /api/tpmos/initiatives — list initiatives with counts
 * POST /api/tpmos/initiatives — create initiative
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { listInitiatives, createInitiative, toInitiativeResponse } from "../../../_lib/db/queries/goals";
import { CreateInitiativeSchema } from "../../../../src/lib/tpmos/schemas/goal";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user } = getAuth(context);
  const initiatives = await listInitiatives(context.env.DB, user.orgId);
  return Response.json(initiatives.map(toInitiativeResponse));
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);

  if (!can(user, "manageGoals", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "TPM or admin access required" } }, { status: 403 });
  }

  const body = CreateInitiativeSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const initiative = await createInitiative(context.env.DB, user.orgId, body.data, user.id);
  if (!initiative) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create" } }, { status: 500 });
  }

  return Response.json(toInitiativeResponse(initiative), { status: 201 });
};
