/**
 * GET    /api/tpmos/epics/:epicId — epic detail with votes + WSJF
 * PATCH  /api/tpmos/epics/:epicId — update epic
 * DELETE /api/tpmos/epics/:epicId — delete epic
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { getEpicById, updateEpic, deleteEpic, toEpicResponse } from "../../../_lib/db/queries/epics";
import { listVotesForEpic, toVoteResponse } from "../../../_lib/db/queries/votes";
import { UpdateEpicSchema } from "../../../../src/lib/tpmos/schemas/epic";
import { computeWsjf } from "../../../../src/lib/tpmos/domain/wsjf";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const epicId = context.params.epicId as string;
  const epic = await getEpicById(context.env.DB, epicId);
  if (!epic) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Epic not found" } }, { status: 404 });
  }

  const votes = (await listVotesForEpic(context.env.DB, epicId)).map(toVoteResponse);
  const wsjf = computeWsjf(votes, epic.dri_committed_weeks);

  return Response.json({ ...toEpicResponse(epic), votes, wsjf });
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const epicId = context.params.epicId as string;

  const epic = await getEpicById(context.env.DB, epicId);
  if (!epic) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Epic not found" } }, { status: 404 });
  }

  if (!can(user, "editEpic", { teamId: epic.team_id }, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Cannot edit this epic" } }, { status: 403 });
  }

  const body = UpdateEpicSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const ifMatch = context.request.headers.get("If-Match");
  const version = ifMatch ? Number(ifMatch) : epic.version;

  const result = await updateEpic(context.env.DB, epicId, body.data, user.id, version);
  if (!result) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Update failed" } }, { status: 500 });
  }
  if ("conflict" in result) {
    return Response.json(
      { error: { code: "VERSION_CONFLICT", message: "Epic was modified", currentVersion: result.current.version, currentState: toEpicResponse(result.current) } },
      { status: 409 }
    );
  }

  return Response.json(toEpicResponse(result));
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const epicId = context.params.epicId as string;

  const epic = await getEpicById(context.env.DB, epicId);
  if (!epic) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Epic not found" } }, { status: 404 });
  }

  if (!can(user, "editEpic", { teamId: epic.team_id }, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Cannot delete this epic" } }, { status: 403 });
  }

  await deleteEpic(context.env.DB, epicId);
  return Response.json({ ok: true });
};
