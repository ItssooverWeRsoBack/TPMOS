/**
 * GET /api/tpmos/admin/audit?type=...&limit=...&offset=... — audit log
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { listAuditLog, toAuditResponse } from "../../../_lib/db/queries/audit";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);

  // Audit log visible to admin and TPM
  if (!can(user, "conductInterview", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Admin or TPM access required" } }, { status: 403 });
  }

  const url = new URL(context.request.url);
  const entityType = url.searchParams.get("type") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const entries = await listAuditLog(context.env.DB, user.orgId, { entityType, limit, offset });
  return Response.json(entries.map(toAuditResponse));
};
