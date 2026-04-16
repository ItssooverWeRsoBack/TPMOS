/**
 * POST /api/tpmos/reports/snapshot — capture current quarter state
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { query } from "../../../_lib/db/client";
import { getActiveQuarter } from "../../../_lib/db/queries/quarters";
import { createReport, toReportResponse } from "../../../_lib/db/queries/reports";

interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "conductInterview", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "TPM or admin required" } }, { status: 403 });
  }

  const active = await getActiveQuarter(context.env.DB, user.orgId);
  if (!active) {
    return Response.json({ error: { code: "NOT_FOUND", message: "No active quarter" } }, { status: 404 });
  }

  // Capture current state
  const epics = await query<{
    title: string; status: string; percent_complete: number;
    at_risk: number; dri_committed_weeks: number; team_name: string;
  }>(
    context.env.DB,
    `SELECT e.title, e.status, e.percent_complete, e.at_risk, e.dri_committed_weeks, t.name as team_name
     FROM epics e JOIN teams t ON t.id = e.team_id
     WHERE e.quarter_id = ? AND t.org_id = ?
     ORDER BY t.name, e.sort_order`,
    active.id, user.orgId
  );

  const totalEpics = epics.length;
  const doneCount = epics.filter((e) => e.status === "done").length;
  const atRiskCount = epics.filter((e) => e.at_risk === 1).length;
  const totalWeeks = epics.reduce((s, e) => s + e.dri_committed_weeks, 0);
  const completedWeighted = epics.reduce((s, e) => s + (e.percent_complete * e.dri_committed_weeks), 0);
  const completion = totalWeeks > 0 ? completedWeighted / totalWeeks : 0;

  // Build markdown content
  const lines = [
    `# Weekly Report — ${active.label}`,
    `*Generated ${new Date().toISOString().split("T")[0]}*`,
    "",
    `## Quarter at a Glance`,
    `- **${totalEpics}** total epics | **${doneCount}** done | **${atRiskCount}** at risk`,
    `- **${completion.toFixed(0)}%** overall completion (weighted by effort)`,
    `- **${totalWeeks}** weeks of planned work`,
    "",
    `## Epics by Team`,
  ];

  let currentTeam = "";
  for (const epic of epics) {
    if (epic.team_name !== currentTeam) {
      currentTeam = epic.team_name;
      lines.push("", `### ${currentTeam}`);
    }
    const statusIcon = epic.status === "done" ? "✅" : epic.at_risk ? "⚠️" : epic.status === "blocked" ? "🔴" : "◻️";
    lines.push(`- ${statusIcon} **${epic.title}** — ${epic.percent_complete}% (${epic.dri_committed_weeks}w)`);
  }

  const content = lines.join("\n");
  const metadata = { totalEpics, doneCount, atRiskCount, totalWeeks, completion };

  const report = await createReport(context.env.DB, user.orgId, active.id, content, metadata, user.id);
  if (!report) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create snapshot" } }, { status: 500 });
  }

  return Response.json(toReportResponse(report), { status: 201 });
};
