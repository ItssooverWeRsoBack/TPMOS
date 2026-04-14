/**
 * GET  /api/tpmos/teams — list teams
 * POST /api/tpmos/teams — create team
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { listTeams, createTeam, toTeamResponse } from "../../../_lib/db/queries/teams";
import { CreateTeamSchema } from "../../../../src/lib/tpmos/schemas/team";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user } = getAuth(context);
  const teams = await listTeams(context.env.DB, user.orgId);
  return Response.json(teams.map(toTeamResponse));
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);

  if (!can(user, "createTeam", {}, { userTeamIds })) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "You cannot create teams" } },
      { status: 403 }
    );
  }

  const body = CreateTeamSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const team = await createTeam(context.env.DB, user.orgId, body.data, user.id);
  if (!team) {
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create team" } },
      { status: 500 }
    );
  }

  return Response.json(toTeamResponse(team), { status: 201 });
};
