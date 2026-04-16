/**
 * GET  /api/tpmos/goals — list goals with initiative/epic counts
 * POST /api/tpmos/goals — create goal
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { listGoals, createGoal, findGoalGaps, toGoalResponse } from "../../../_lib/db/queries/goals";
import { CreateGoalSchema } from "../../../../src/lib/tpmos/schemas/goal";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user } = getAuth(context);
  const url = new URL(context.request.url);
  const showGaps = url.searchParams.get("gaps") === "true";

  if (showGaps) {
    const gaps = await findGoalGaps(context.env.DB, user.orgId);
    return Response.json(gaps.map(toGoalResponse));
  }

  const goals = await listGoals(context.env.DB, user.orgId);
  return Response.json(goals.map(toGoalResponse));
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);

  if (!can(user, "manageGoals", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "TPM or admin access required" } }, { status: 403 });
  }

  const body = CreateGoalSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const goal = await createGoal(context.env.DB, user.orgId, body.data, user.id);
  if (!goal) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create goal" } }, { status: 500 });
  }

  return Response.json(toGoalResponse(goal), { status: 201 });
};
