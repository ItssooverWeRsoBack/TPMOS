/**
 * POST /api/tpmos/ai/narrate-report — AI-generated executive narrative
 *
 * Hook B3. Takes structured report data, returns a polished narrative.
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { getProvider } from "../../../_lib/ai/provider";
import { buildNarrateMessages } from "../../../_lib/ai/prompts/narrate-report";
import { z } from "zod/v4";

const InputSchema = z.object({
  quarterLabel: z.string(),
  completion: z.number(),
  totalEpics: z.number(),
  doneCount: z.number(),
  atRiskCount: z.number(),
  totalWeeks: z.number(),
  teamSummaries: z.string(),
});

interface Env { DB: D1Database; AI: unknown; AI_PROVIDER: string; ANTHROPIC_API_KEY?: string; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "conductInterview", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const provider = getProvider(context.env);
  if (!provider.isAvailable()) {
    return Response.json({ error: { code: "AI_UNAVAILABLE", message: "AI features are disabled" } }, { status: 503 });
  }

  const body = InputSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input" } },
      { status: 400 }
    );
  }

  try {
    const messages = buildNarrateMessages(body.data);
    const narrative = await provider.draft(messages, { maxTokens: 512, temperature: 0.6 });
    return Response.json({ narrative, aiGenerated: true });
  } catch (err) {
    console.error("AI narrate-report failed:", err);
    return Response.json(
      { error: { code: "AI_UNAVAILABLE", message: "Narrative generation failed" } },
      { status: 503 }
    );
  }
};
