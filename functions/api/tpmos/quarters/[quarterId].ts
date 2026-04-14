/**
 * GET /api/tpmos/quarters/:quarterId — quarter detail
 */

import { getQuarterById, toQuarterResponse } from "../../../_lib/db/queries/quarters";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const quarterId = context.params.quarterId as string;
  const quarter = await getQuarterById(context.env.DB, quarterId);

  if (!quarter) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Quarter not found" } },
      { status: 404 }
    );
  }

  return Response.json(toQuarterResponse(quarter));
};
