/**
 * POST /api/tpmos/epics/reorder — bulk reorder epics (planner drag)
 *
 * Accepts ordered array of epic IDs. Updates sort_order atomically.
 * Returns the new line computation.
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { reorderEpics, listEpics, toEpicResponse } from "../../../_lib/db/queries/epics";
import { getTeamBySlug } from "../../../_lib/db/queries/teams";
import { getCapacityPlan } from "../../../_lib/db/queries/capacity";
import { computeLine } from "../../../../src/lib/tpmos/domain/planner-line";
import { computeAvailableWeeks } from "../../../../src/lib/tpmos/domain/capacity";
import { z } from "zod/v4";

const ReorderSchema = z.object({
  teamSlug: z.string(),
  quarterId: z.string(),
  epicIds: z.array(z.string()).min(1),
});

interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);

  const body = ReorderSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const team = await getTeamBySlug(context.env.DB, user.orgId, body.data.teamSlug);
  if (!team) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Team not found" } }, { status: 404 });
  }

  if (!can(user, "editEpic", { teamId: team.id }, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Cannot reorder epics" } }, { status: 403 });
  }

  // Perform atomic reorder
  await reorderEpics(context.env.DB, body.data.epicIds);

  // Reload and compute line
  const epics = await listEpics(context.env.DB, team.id, body.data.quarterId);
  const capacityRow = await getCapacityPlan(context.env.DB, team.id, body.data.quarterId);

  let availableWeeks = 0;
  if (capacityRow) {
    const cap = computeAvailableWeeks({
      totalMemberWeeks: capacityRow.total_member_weeks,
      vacationWeeks: capacityRow.vacation_weeks,
      techDebtWeeks: capacityRow.tech_debt_weeks,
      otherOverheadWeeks: capacityRow.other_overhead_weeks,
    });
    availableWeeks = cap.availableWeeks;
  }

  const line = computeLine(
    epics.map((e) => ({ id: e.id, weeks: e.dri_committed_weeks })),
    availableWeeks
  );

  return Response.json({
    reordered: body.data.epicIds.length,
    ...line,
    epics: epics.map(toEpicResponse),
  });
};
