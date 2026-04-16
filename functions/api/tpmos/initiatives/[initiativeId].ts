/**
 * GET /api/tpmos/initiatives/:initiativeId — detail with mapped goals + epics
 */

import { getInitiativeById, getInitiativeEpics, toInitiativeResponse } from "../../../_lib/db/queries/goals";
import { query } from "../../../_lib/db/client";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const initiativeId = context.params.initiativeId as string;
  const initiative = await getInitiativeById(context.env.DB, initiativeId);
  if (!initiative) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Initiative not found" } }, { status: 404 });
  }

  const epics = await getInitiativeEpics(context.env.DB, initiativeId);

  // Get linked goals
  const goals = await query<{ id: string; title: string; status: string }>(
    context.env.DB,
    `SELECT g.id, g.title, g.status FROM goals g
     JOIN goal_initiative_map gim ON gim.goal_id = g.id
     WHERE gim.initiative_id = ?
     ORDER BY g.title`,
    initiativeId
  );

  return Response.json({
    ...toInitiativeResponse(initiative),
    goals,
    epics,
  });
};
