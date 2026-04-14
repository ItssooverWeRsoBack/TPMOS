/**
 * GET  /api/tpmos/epics?team=slug&quarter=id — list epics
 * POST /api/tpmos/epics — create epic
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { getTeamBySlug } from "../../../_lib/db/queries/teams";
import { listEpics, createEpic, toEpicResponse } from "../../../_lib/db/queries/epics";
import { listVotesForTeamQuarter, toVoteResponse } from "../../../_lib/db/queries/votes";
import { CreateEpicSchema } from "../../../../src/lib/tpmos/schemas/epic";
import { computeWsjf } from "../../../../src/lib/tpmos/domain/wsjf";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user } = getAuth(context);
  const url = new URL(context.request.url);
  const teamSlug = url.searchParams.get("team");
  const quarterId = url.searchParams.get("quarter");

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

  const epics = await listEpics(context.env.DB, team.id, quarterId);
  const allVotes = await listVotesForTeamQuarter(context.env.DB, team.id, quarterId);

  // Group votes by epic and compute WSJF
  const epicResponses = epics.map((epic) => {
    const epicVotes = allVotes
      .filter((v) => v.epic_id === epic.id)
      .map(toVoteResponse);
    const wsjf = computeWsjf(epicVotes, epic.dri_committed_weeks);

    return {
      ...toEpicResponse(epic),
      votes: epicVotes,
      wsjf,
    };
  });

  return Response.json(epicResponses);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);

  const body = CreateEpicSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  if (!can(user, "createEpic", { teamId: body.data.teamId }, { userTeamIds })) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Cannot create epics for this team" } },
      { status: 403 }
    );
  }

  const epic = await createEpic(context.env.DB, body.data, user.id);
  if (!epic) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create epic" } }, { status: 500 });
  }

  return Response.json(toEpicResponse(epic), { status: 201 });
};
