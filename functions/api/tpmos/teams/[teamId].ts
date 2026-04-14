/**
 * GET    /api/tpmos/teams/:teamId — team detail
 * PATCH  /api/tpmos/teams/:teamId — update team
 * DELETE /api/tpmos/teams/:teamId — archive team
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { getTeamById, updateTeam, toTeamResponse } from "../../../_lib/db/queries/teams";
import { UpdateTeamSchema } from "../../../../src/lib/tpmos/schemas/team";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const teamId = context.params.teamId as string;
  const team = await getTeamById(context.env.DB, teamId);

  if (!team) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Team not found" } }, { status: 404 });
  }

  return Response.json(toTeamResponse(team));
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const teamId = context.params.teamId as string;

  const team = await getTeamById(context.env.DB, teamId);
  if (!team) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Team not found" } }, { status: 404 });
  }

  if (!can(user, "editTeam", { teamId }, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Cannot edit this team" } }, { status: 403 });
  }

  const body = UpdateTeamSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const ifMatch = context.request.headers.get("If-Match");
  const version = ifMatch ? Number(ifMatch) : team.version;

  const result = await updateTeam(context.env.DB, teamId, body.data, user.id, version);
  if (!result) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Update failed" } }, { status: 500 });
  }
  if ("conflict" in result) {
    return Response.json(
      { error: { code: "VERSION_CONFLICT", message: "Team was modified", currentVersion: result.current.version, currentState: toTeamResponse(result.current) } },
      { status: 409 }
    );
  }

  return Response.json(toTeamResponse(result));
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const teamId = context.params.teamId as string;

  const team = await getTeamById(context.env.DB, teamId);
  if (!team) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Team not found" } }, { status: 404 });
  }

  if (!can(user, "archiveTeam", { teamId }, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Cannot archive this team" } }, { status: 403 });
  }

  const ifMatch = context.request.headers.get("If-Match");
  const version = ifMatch ? Number(ifMatch) : team.version;

  const result = await updateTeam(context.env.DB, teamId, { archived: true }, user.id, version);
  if (!result || "conflict" in result) {
    return Response.json({ error: { code: "VERSION_CONFLICT", message: "Team was modified" } }, { status: 409 });
  }

  return Response.json(toTeamResponse(result));
};
