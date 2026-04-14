/**
 * POST /api/tpmos/quarters/:quarterId/close — close the quarter (read-only)
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

  if (!can(user, "closeQuarter", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Only TPMs and admins can close quarters" } }, { status: 403 });
  }

  if (quarter.state === "closed") {
    return Response.json({ error: { code: "QUARTER_LOCKED", message: "Quarter is already closed" } }, { status: 409 });
  }

  const updated = await updateQuarterState(context.env.DB, quarterId, "closed");
  if (!updated) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to close" } }, { status: 500 });
  }

  return Response.json(toQuarterResponse(updated));
};
