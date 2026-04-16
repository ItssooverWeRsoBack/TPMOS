/**
 * GET /api/tpmos/reports?quarter=... — list report snapshots
 */

import { getAuth } from "../../../_lib/auth/context";
import { listReports, toReportResponse } from "../../../_lib/db/queries/reports";
import { getActiveQuarter } from "../../../_lib/db/queries/quarters";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user } = getAuth(context);
  const url = new URL(context.request.url);
  let quarterId = url.searchParams.get("quarter");

  if (!quarterId) {
    const active = await getActiveQuarter(context.env.DB, user.orgId);
    quarterId = active?.id ?? null;
  }

  if (!quarterId) {
    return Response.json([]);
  }

  const reports = await listReports(context.env.DB, user.orgId, quarterId);
  return Response.json(reports.map(toReportResponse));
};
