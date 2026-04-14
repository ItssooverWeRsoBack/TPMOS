/**
 * POST /api/tpmos/epics/:epicId/status — update epic status + percent complete
 */

import { getAuth } from "../../../../_lib/auth/context";
import { can } from "../../../../_lib/auth/can";
import { getEpicById, updateEpicStatus, toEpicResponse } from "../../../../_lib/db/queries/epics";
import { UpdateStatusSchema } from "../../../../../src/lib/tpmos/schemas/epic";

interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const epicId = context.params.epicId as string;

  const epic = await getEpicById(context.env.DB, epicId);
  if (!epic) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Epic not found" } }, { status: 404 });
  }

  if (!can(user, "updateStatus", { teamId: epic.team_id }, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Cannot update status" } }, { status: 403 });
  }

  const body = UpdateStatusSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const updated = await updateEpicStatus(
    context.env.DB, epicId, body.data.status,
    body.data.percentComplete, body.data.atRisk, user.id
  );

  if (!updated) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Update failed" } }, { status: 500 });
  }

  return Response.json(toEpicResponse(updated));
};
