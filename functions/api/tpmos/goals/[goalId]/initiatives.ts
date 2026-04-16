/**
 * POST   /api/tpmos/goals/:goalId/initiatives — link initiative to goal
 * DELETE /api/tpmos/goals/:goalId/initiatives?initiativeId=... — unlink
 */

import { getAuth } from "../../../../_lib/auth/context";
import { can } from "../../../../_lib/auth/can";
import { linkGoalInitiative, unlinkGoalInitiative, getGoalInitiatives, toInitiativeResponse } from "../../../../_lib/db/queries/goals";
import { z } from "zod/v4";

interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageGoals", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const goalId = context.params.goalId as string;
  const body = z.object({ initiativeId: z.string() }).safeParse(await context.request.json());
  if (!body.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "initiativeId required" } }, { status: 400 });
  }

  await linkGoalInitiative(context.env.DB, goalId, body.data.initiativeId);
  const initiatives = await getGoalInitiatives(context.env.DB, goalId);
  return Response.json(initiatives.map(toInitiativeResponse), { status: 201 });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageGoals", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const goalId = context.params.goalId as string;
  const url = new URL(context.request.url);
  const initiativeId = url.searchParams.get("initiativeId");
  if (!initiativeId) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "initiativeId required" } }, { status: 400 });
  }

  await unlinkGoalInitiative(context.env.DB, goalId, initiativeId);
  return Response.json({ ok: true });
};
