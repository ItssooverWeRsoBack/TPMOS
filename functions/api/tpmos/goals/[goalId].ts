/**
 * GET   /api/tpmos/goals/:goalId — goal detail with mapped initiatives
 * PATCH /api/tpmos/goals/:goalId — update goal
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { getGoalById, updateGoal, getGoalInitiatives, toGoalResponse, toInitiativeResponse } from "../../../_lib/db/queries/goals";
import { UpdateGoalSchema } from "../../../../src/lib/tpmos/schemas/goal";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const goalId = context.params.goalId as string;
  const goal = await getGoalById(context.env.DB, goalId);
  if (!goal) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Goal not found" } }, { status: 404 });
  }

  const initiatives = await getGoalInitiatives(context.env.DB, goalId);

  return Response.json({
    ...toGoalResponse(goal),
    initiatives: initiatives.map(toInitiativeResponse),
  });
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const goalId = context.params.goalId as string;

  if (!can(user, "manageGoals", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "TPM or admin access required" } }, { status: 403 });
  }

  const goal = await getGoalById(context.env.DB, goalId);
  if (!goal) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Goal not found" } }, { status: 404 });
  }

  const body = UpdateGoalSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const ifMatch = context.request.headers.get("If-Match");
  const version = ifMatch ? Number(ifMatch) : goal.version;

  const result = await updateGoal(context.env.DB, goalId, body.data, user.id, version);
  if (!result) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Update failed" } }, { status: 500 });
  }
  if ("conflict" in result) {
    return Response.json(
      { error: { code: "VERSION_CONFLICT", message: "Goal was modified", currentVersion: result.current.version } },
      { status: 409 }
    );
  }

  return Response.json(toGoalResponse(result));
};
