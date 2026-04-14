/**
 * GET  /api/tpmos/interviews — list interviews
 * POST /api/tpmos/interviews — create interview
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { listInterviews, createInterview, toInterviewResponse } from "../../../_lib/db/queries/interviews";
import { CreateInterviewSchema } from "../../../../src/lib/tpmos/schemas/interview";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "conductInterview", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "TPM access required" } }, { status: 403 });
  }
  const interviews = await listInterviews(context.env.DB, user.orgId);
  return Response.json(interviews.map(toInterviewResponse));
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "conductInterview", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "TPM access required" } }, { status: 403 });
  }

  const body = CreateInterviewSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const interview = await createInterview(context.env.DB, user.orgId, body.data, user.id);
  if (!interview) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create" } }, { status: 500 });
  }

  return Response.json(toInterviewResponse(interview), { status: 201 });
};
