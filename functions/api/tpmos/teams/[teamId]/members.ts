/**
 * GET    /api/tpmos/teams/:teamId/members — list team members
 * POST   /api/tpmos/teams/:teamId/members — add member
 * DELETE /api/tpmos/teams/:teamId/members?userId=... — remove member
 */

import { getAuth } from "../../../../_lib/auth/context";
import { can } from "../../../../_lib/auth/can";
import { getTeamById, listTeamMembers, addTeamMember, removeTeamMember, toMemberResponse } from "../../../../_lib/db/queries/teams";
import { getUserById } from "../../../../_lib/db/queries/users";
import { AddMemberSchema } from "../../../../../src/lib/tpmos/schemas/team";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const teamId = context.params.teamId as string;
  const team = await getTeamById(context.env.DB, teamId);
  if (!team) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Team not found" } }, { status: 404 });
  }

  const members = await listTeamMembers(context.env.DB, teamId);
  return Response.json(members.map(toMemberResponse));
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const teamId = context.params.teamId as string;

  const team = await getTeamById(context.env.DB, teamId);
  if (!team) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Team not found" } }, { status: 404 });
  }

  if (!can(user, "addMember", { teamId }, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Cannot add members to this team" } }, { status: 403 });
  }

  const body = AddMemberSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  // Verify target user exists
  const targetUser = await getUserById(context.env.DB, body.data.userId);
  if (!targetUser) {
    return Response.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  }

  await addTeamMember(context.env.DB, teamId, body.data.userId, body.data.teamRole);
  const members = await listTeamMembers(context.env.DB, teamId);
  return Response.json(members.map(toMemberResponse), { status: 201 });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const teamId = context.params.teamId as string;
  const url = new URL(context.request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "userId query param required" } },
      { status: 400 }
    );
  }

  const team = await getTeamById(context.env.DB, teamId);
  if (!team) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Team not found" } }, { status: 404 });
  }

  if (!can(user, "removeMember", { teamId }, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Cannot remove members from this team" } }, { status: 403 });
  }

  await removeTeamMember(context.env.DB, teamId, userId);
  return Response.json({ ok: true });
};
