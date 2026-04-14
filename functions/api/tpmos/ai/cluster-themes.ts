/**
 * POST /api/tpmos/ai/cluster-themes — cluster interview themes
 *
 * Hook B2. Groups suggested themes by semantic similarity.
 * MVP implementation: simple string-matching clustering without embeddings.
 * Phase 2: use embeddings from Workers AI bge-base-en for real vector clustering.
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { listInterviews } from "../../../_lib/db/queries/interviews";

interface Env { DB: D1Database; AI: unknown; AI_PROVIDER: string; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "conductInterview", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "TPM access required" } }, { status: 403 });
  }

  const interviews = await listInterviews(context.env.DB, user.orgId);

  // Collect all suggested themes from AI syntheses
  const themeCounts = new Map<string, { count: number; interviewIds: string[] }>();

  for (const interview of interviews) {
    if (!interview.ai_synthesis) continue;
    try {
      const synthesis = JSON.parse(interview.ai_synthesis) as { suggestedThemes?: string[] };
      if (!synthesis.suggestedThemes) continue;

      for (const theme of synthesis.suggestedThemes) {
        const normalized = theme.toLowerCase().trim();
        const existing = themeCounts.get(normalized);
        if (existing) {
          existing.count++;
          existing.interviewIds.push(interview.id);
        } else {
          themeCounts.set(normalized, { count: 1, interviewIds: [interview.id] });
        }
      }
    } catch {
      // Skip malformed synthesis
    }
  }

  // Convert to sorted array
  const clusters = Array.from(themeCounts.entries())
    .map(([label, data]) => ({
      label,
      count: data.count,
      interviewIds: data.interviewIds,
    }))
    .sort((a, b) => b.count - a.count);

  return Response.json({
    clusters,
    totalInterviews: interviews.length,
    totalWithSynthesis: interviews.filter((i) => i.ai_synthesis).length,
  });
};
