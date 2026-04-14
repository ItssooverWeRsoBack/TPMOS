/**
 * GET /api/tpmos/capacity?team=...&quarter=... — read capacity plan
 * PUT /api/tpmos/capacity?team=...&quarter=... — upsert capacity plan
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { getCapacityPlan, upsertCapacityPlan, toCapacityResponse } from "../../../_lib/db/queries/capacity";
import { getTeamBySlug } from "../../../_lib/db/queries/teams";
import { UpsertCapacitySchema } from "../../../../src/lib/tpmos/schemas/capacity";

interface Env { DB: D1Database; ENV: string; }

function getParams(request: Request) {
  const url = new URL(request.url);
  return {
    teamSlug: url.searchParams.get("team"),
    quarterId: url.searchParams.get("quarter"),
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user } = getAuth(context);
  const { teamSlug, quarterId } = getParams(context.request);

  if (!teamSlug || !quarterId) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "team and quarter query params required" } },
      { status: 400 }
    );
  }

  const team = await getTeamBySlug(context.env.DB, user.orgId, teamSlug);
  if (!team) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Team not found" } }, { status: 404 });
  }

  const plan = await getCapacityPlan(context.env.DB, team.id, quarterId);
  if (!plan) {
    return Response.json(null); // No capacity plan yet — client shows empty state
  }

  return Response.json(toCapacityResponse(plan));
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const { teamSlug, quarterId } = getParams(context.request);

  if (!teamSlug || !quarterId) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "team and quarter query params required" } },
      { status: 400 }
    );
  }

  const team = await getTeamBySlug(context.env.DB, user.orgId, teamSlug);
  if (!team) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Team not found" } }, { status: 404 });
  }

  if (!can(user, "editCapacity", { teamId: team.id }, { userTeamIds })) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Cannot edit this team's capacity" } },
      { status: 403 }
    );
  }

  const body = UpsertCapacitySchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const plan = await upsertCapacityPlan(context.env.DB, team.id, quarterId, body.data, user.id);
  if (!plan) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to save" } }, { status: 500 });
  }

  return Response.json(toCapacityResponse(plan));
};
