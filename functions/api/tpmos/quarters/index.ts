/**
 * GET  /api/tpmos/quarters — list quarters
 * POST /api/tpmos/quarters — create quarter
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { listQuarters, createQuarter, toQuarterResponse } from "../../../_lib/db/queries/quarters";
import { CreateQuarterSchema } from "../../../../src/lib/tpmos/schemas/quarter";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user } = getAuth(context);
  const quarters = await listQuarters(context.env.DB, user.orgId);
  return Response.json(quarters.map(toQuarterResponse));
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);

  if (!can(user, "closeQuarter", {}, { userTeamIds })) {
    // Reusing closeQuarter as proxy for "can manage quarters" — TPM+ only
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Only TPMs and admins can create quarters" } },
      { status: 403 }
    );
  }

  const body = CreateQuarterSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const quarter = await createQuarter(context.env.DB, user.orgId, body.data);
  if (!quarter) {
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create quarter" } },
      { status: 500 }
    );
  }

  return Response.json(toQuarterResponse(quarter), { status: 201 });
};
