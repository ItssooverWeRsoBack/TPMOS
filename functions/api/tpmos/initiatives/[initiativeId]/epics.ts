/**
 * POST   /api/tpmos/initiatives/:initiativeId/epics — link epic
 * DELETE /api/tpmos/initiatives/:initiativeId/epics?epicId=... — unlink
 */

import { getAuth } from "../../../../_lib/auth/context";
import { can } from "../../../../_lib/auth/can";
import { linkInitiativeEpic, unlinkInitiativeEpic, getInitiativeEpics } from "../../../../_lib/db/queries/goals";
import { z } from "zod/v4";

interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageGoals", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const initiativeId = context.params.initiativeId as string;
  const body = z.object({ epicId: z.string() }).safeParse(await context.request.json());
  if (!body.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "epicId required" } }, { status: 400 });
  }

  await linkInitiativeEpic(context.env.DB, initiativeId, body.data.epicId);
  const epics = await getInitiativeEpics(context.env.DB, initiativeId);
  return Response.json(epics, { status: 201 });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageGoals", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const initiativeId = context.params.initiativeId as string;
  const url = new URL(context.request.url);
  const epicId = url.searchParams.get("epicId");
  if (!epicId) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "epicId required" } }, { status: 400 });
  }

  await unlinkInitiativeEpic(context.env.DB, initiativeId, epicId);
  return Response.json({ ok: true });
};
