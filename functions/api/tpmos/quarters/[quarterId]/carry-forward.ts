/**
 * POST /api/tpmos/quarters/:quarterId/carry-forward
 *
 * Clones selected incomplete epics into the next quarter.
 * Body: { epicIds: string[], targetQuarterId: string }
 */

import { getAuth } from "../../../../_lib/auth/context";
import { can } from "../../../../_lib/auth/can";
import { getQuarterById } from "../../../../_lib/db/queries/quarters";
import { listEpics, createEpic, getEpicById, toEpicResponse } from "../../../../_lib/db/queries/epics";
import { buildCarryForwardDrafts } from "../../../../../src/lib/tpmos/domain/carry-forward";
import { z } from "zod/v4";

const CarryForwardSchema = z.object({
  epicIds: z.array(z.string()).min(1),
  targetQuarterId: z.string(),
});

interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const sourceQuarterId = context.params.quarterId as string;

  const body = CarryForwardSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  // Verify source quarter exists
  const sourceQuarter = await getQuarterById(context.env.DB, sourceQuarterId);
  if (!sourceQuarter) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Source quarter not found" } }, { status: 404 });
  }

  // Verify target quarter exists
  const targetQuarter = await getQuarterById(context.env.DB, body.data.targetQuarterId);
  if (!targetQuarter) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Target quarter not found" } }, { status: 404 });
  }

  // Load all source epics across all teams for this quarter
  // We need to check each epic's team for authorization
  const createdEpics = [];

  for (const epicId of body.data.epicIds) {
    const sourceEpic = await getEpicById(context.env.DB, epicId);
    if (!sourceEpic) continue;

    // Check authorization for this team
    if (!can(user, "createEpic", { teamId: sourceEpic.team_id }, { userTeamIds })) {
      continue; // Skip epics the user can't create in
    }

    // Build the draft
    const drafts = buildCarryForwardDrafts(
      [{
        id: sourceEpic.id,
        title: sourceEpic.title,
        description: sourceEpic.description,
        definitionOfDone: sourceEpic.definition_of_done,
        driUserId: sourceEpic.dri_user_id,
        driCommittedWeeks: sourceEpic.dri_committed_weeks,
        status: sourceEpic.status,
        percentComplete: sourceEpic.percent_complete,
      }],
      [epicId]
    );

    for (const draft of drafts) {
      const newEpic = await createEpic(
        context.env.DB,
        {
          teamId: sourceEpic.team_id,
          quarterId: body.data.targetQuarterId,
          title: draft.title,
          description: draft.description ?? undefined,
          definitionOfDone: draft.definitionOfDone ?? undefined,
          driUserId: draft.driUserId ?? undefined,
          driCommittedWeeks: draft.driCommittedWeeks,
          carriedFromEpicId: draft.carriedFromEpicId,
        },
        user.id
      );
      if (newEpic) {
        createdEpics.push(toEpicResponse(newEpic));
      }
    }
  }

  return Response.json({
    carried: createdEpics.length,
    epics: createdEpics,
  }, { status: 201 });
};
