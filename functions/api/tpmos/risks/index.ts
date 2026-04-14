/**
 * GET /api/tpmos/risks — list at-risk and blocked epics across all teams
 */

import { getAuth } from "../../../_lib/auth/context";
import { listAtRiskEpics, toEpicResponse } from "../../../_lib/db/queries/epics";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user } = getAuth(context);
  const epics = await listAtRiskEpics(context.env.DB, user.orgId);
  return Response.json(epics.map(toEpicResponse));
};
