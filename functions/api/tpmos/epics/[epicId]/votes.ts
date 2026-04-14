/**
 * POST /api/tpmos/epics/:epicId/votes — cast or update vote
 *
 * Returns the updated vote list + aggregates so the client can update immediately.
 */

import { getAuth } from "../../../../_lib/auth/context";
import { can } from "../../../../_lib/auth/can";
import { getEpicById } from "../../../../_lib/db/queries/epics";
import { upsertVote, toVoteResponse } from "../../../../_lib/db/queries/votes";
import { CastVoteSchema } from "../../../../../src/lib/tpmos/schemas/vote";
import { computeWsjf } from "../../../../../src/lib/tpmos/domain/wsjf";

interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  const epicId = context.params.epicId as string;

  const epic = await getEpicById(context.env.DB, epicId);
  if (!epic) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Epic not found" } }, { status: 404 });
  }

  if (!can(user, "voteOnEpic", { teamId: epic.team_id }, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Cannot vote on this epic" } }, { status: 403 });
  }

  const body = CastVoteSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid vote", details: body.error.format() } },
      { status: 400 }
    );
  }

  const allVotes = (await upsertVote(context.env.DB, epicId, user.id, body.data)).map(toVoteResponse);
  const wsjf = computeWsjf(allVotes, epic.dri_committed_weeks);

  return Response.json({
    epicId,
    userId: user.id,
    ...body.data,
    votes: allVotes,
    aggregates: wsjf,
  });
};
