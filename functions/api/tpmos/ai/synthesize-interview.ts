/**
 * POST /api/tpmos/ai/synthesize-interview — AI synthesis of interview responses
 *
 * Hook B1. Extracts themes, challenges, and actions from raw interview notes.
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { getProvider } from "../../../_lib/ai/provider";
import { buildSynthesizeMessages } from "../../../_lib/ai/prompts/synthesize-interview";
import { getInterviewById, updateInterviewSynthesis } from "../../../_lib/db/queries/interviews";
import { z } from "zod/v4";

const InputSchema = z.object({
  interviewId: z.string(),
});

interface Env { DB: D1Database; AI: unknown; AI_PROVIDER: string; ANTHROPIC_API_KEY?: string; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "conductInterview", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "TPM access required" } }, { status: 403 });
  }

  const provider = getProvider(context.env);
  if (!provider.isAvailable()) {
    return Response.json({ error: { code: "AI_UNAVAILABLE", message: "AI features are disabled" } }, { status: 503 });
  }

  const body = InputSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "interviewId required" } },
      { status: 400 }
    );
  }

  const interview = await getInterviewById(context.env.DB, body.data.interviewId);
  if (!interview) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Interview not found" } }, { status: 404 });
  }

  try {
    const messages = buildSynthesizeMessages({
      q1Scope: interview.q1_scope,
      q2Challenges: interview.q2_challenges,
      q3MustKnow: interview.q3_must_know,
      q4BlueSky: interview.q4_blue_sky,
    });

    const raw = await provider.draft(messages, { maxTokens: 512, temperature: 0.5 });
    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    // Store synthesis on the interview
    await updateInterviewSynthesis(context.env.DB, body.data.interviewId, jsonStr);

    return Response.json({
      interviewId: body.data.interviewId,
      synthesis: parsed,
      aiGenerated: true,
    });
  } catch (err) {
    console.error("AI synthesize-interview failed:", err);
    return Response.json(
      { error: { code: "AI_UNAVAILABLE", message: "Synthesis failed. Try again." } },
      { status: 503 }
    );
  }
};
