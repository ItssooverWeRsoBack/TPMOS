/**
 * POST /api/tpmos/quarters/:quarterId/lock — lock the plan (transition to active)
 */

import { getAuth } from "../../../../_lib/auth/context";
import { can } from "../../../../_lib/auth/can";
import { getQuarterById, updateQuarterState, toQuarterResponse } from "../../../../_lib/db/queries/quarters";

interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const quarterId = context.params.quarterId as string;

  const quarter = await getQuarterById(context.env.DB, quarterId);
  if (!quarter) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Quarter not found" } }, { status: 404 });
  }

  if (quarter.state === "closed") {
    return Response.json(
      { error: { code: "QUARTER_LOCKED", message: "Quarter is already closed" } },
      { status: 409 }
    );
  }

  if (!can(user, "lockPlan", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Cannot lock this plan" } }, { status: 403 });
  }

  const updated = await updateQuarterState(context.env.DB, quarterId, "active");
  if (!updated) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to lock" } }, { status: 500 });
  }

  return Response.json(toQuarterResponse(updated));
};
