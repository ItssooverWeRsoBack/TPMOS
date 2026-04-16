/**
 * GET /api/tpmos/dashboard?quarter=... — aggregate dashboard data
 *
 * Returns multi-team progress, risk counts, goal coverage, and quarter stats.
 */

import { getAuth } from "../../../_lib/auth/context";
import { query } from "../../../_lib/db/client";
import { listGoals, toGoalResponse } from "../../../_lib/db/queries/goals";
import { getActiveQuarter } from "../../../_lib/db/queries/quarters";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user } = getAuth(context);
  const url = new URL(context.request.url);
  const quarterId = url.searchParams.get("quarter");

  // Get active quarter if not specified
  let effectiveQuarterId = quarterId;
  if (!effectiveQuarterId) {
    const active = await getActiveQuarter(context.env.DB, user.orgId);
    effectiveQuarterId = active?.id ?? null;
  }

  if (!effectiveQuarterId) {
    return Response.json({ error: { code: "NOT_FOUND", message: "No active quarter" } }, { status: 404 });
  }

  // Team progress rollups
  const teamProgress = await query<{
    team_id: string;
    team_name: string;
    team_slug: string;
    total_epics: number;
    done_count: number;
    in_progress_count: number;
    blocked_count: number;
    at_risk_count: number;
    not_started_count: number;
    total_weeks: number;
    completed_weighted: number;
  }>(
    context.env.DB,
    `SELECT
       t.id as team_id, t.name as team_name, t.slug as team_slug,
       COUNT(e.id) as total_epics,
       SUM(CASE WHEN e.status = 'done' THEN 1 ELSE 0 END) as done_count,
       SUM(CASE WHEN e.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
       SUM(CASE WHEN e.status = 'blocked' THEN 1 ELSE 0 END) as blocked_count,
       SUM(CASE WHEN e.at_risk = 1 THEN 1 ELSE 0 END) as at_risk_count,
       SUM(CASE WHEN e.status = 'not_started' THEN 1 ELSE 0 END) as not_started_count,
       SUM(e.dri_committed_weeks) as total_weeks,
       SUM(e.percent_complete * e.dri_committed_weeks) as completed_weighted
     FROM teams t
     LEFT JOIN epics e ON e.team_id = t.id AND e.quarter_id = ?
     WHERE t.org_id = ? AND t.archived = 0
     GROUP BY t.id
     ORDER BY t.name`,
    effectiveQuarterId, user.orgId
  );

  // Goal coverage
  const goals = await listGoals(context.env.DB, user.orgId);

  // Quarter summary
  const totalEpics = teamProgress.reduce((s, t) => s + t.total_epics, 0);
  const totalDone = teamProgress.reduce((s, t) => s + t.done_count, 0);
  const totalAtRisk = teamProgress.reduce((s, t) => s + t.at_risk_count, 0);
  const totalBlocked = teamProgress.reduce((s, t) => s + t.blocked_count, 0);
  const totalWeeks = teamProgress.reduce((s, t) => s + t.total_weeks, 0);
  const completedWeighted = teamProgress.reduce((s, t) => s + t.completed_weighted, 0);
  const overallCompletion = totalWeeks > 0 ? completedWeighted / totalWeeks : 0;

  const behindPaceTeams = teamProgress.filter((t) => {
    if (t.total_weeks === 0) return false;
    const completion = t.completed_weighted / t.total_weeks;
    return completion < 30; // rough heuristic for mid-quarter
  });

  return Response.json({
    quarterId: effectiveQuarterId,
    summary: {
      totalEpics,
      totalDone,
      totalAtRisk,
      totalBlocked,
      totalWeeks,
      overallCompletion,
      teamCount: teamProgress.length,
      behindPaceCount: behindPaceTeams.length,
    },
    teams: teamProgress.map((t) => ({
      teamId: t.team_id,
      teamName: t.team_name,
      teamSlug: t.team_slug,
      totalEpics: t.total_epics,
      doneCount: t.done_count,
      inProgressCount: t.in_progress_count,
      blockedCount: t.blocked_count,
      atRiskCount: t.at_risk_count,
      notStartedCount: t.not_started_count,
      totalWeeks: t.total_weeks,
      completion: t.total_weeks > 0 ? t.completed_weighted / t.total_weeks : 0,
    })),
    goals: goals.map((g) => {
      const resp = toGoalResponse(g);
      return {
        id: resp.id,
        title: resp.title,
        status: resp.status,
        initiativeCount: resp.initiativeCount ?? 0,
        epicCount: resp.epicCount ?? 0,
        hasGap: (resp.initiativeCount ?? 0) === 0,
      };
    }),
  });
};
