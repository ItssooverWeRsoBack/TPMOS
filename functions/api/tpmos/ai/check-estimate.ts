/**
 * POST /api/tpmos/ai/check-estimate — AI-assisted estimate sanity check
 *
 * Hook C1. Compares a new epic estimate against historical completed epics.
 * Returns 503 if AI unavailable or fewer than 5 historical epics.
 */

import { getProvider } from "../../../_lib/ai/provider";
import { buildCheckEstimateMessages } from "../../../_lib/ai/prompts/check-estimate";
import { z } from "zod/v4";

const InputSchema = z.object({
  title: z.string().min(1).max(200),
  estimateWeeks: z.number().min(0).max(200),
});

interface Env {
  DB: D1Database;
  AI: unknown;
  AI_PROVIDER: string;
  ANTHROPIC_API_KEY?: string;
  ENV: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const provider = getProvider(context.env);

  if (!provider.isAvailable()) {
    return Response.json(
      {
        error: {
          code: "AI_UNAVAILABLE",
          message: "AI features are disabled",
        },
      },
      { status: 503 }
    );
  }

  const body = InputSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: body.error.format(),
        },
      },
      { status: 400 }
    );
  }

  const { title, estimateWeeks } = body.data;

  // Query historical completed epics
  const historicalResult = await context.env.DB.prepare(
    `SELECT title, dri_committed_weeks as weeks, actual_weeks as actual
     FROM epics
     WHERE status = 'done'
     ORDER BY updated_at DESC
     LIMIT 50`
  ).all<{ title: string; weeks: number; actual: number | null }>();

  const historicalEpics = (historicalResult.results ?? []).map((row) => ({
    title: row.title,
    weeks: row.weeks,
    actual: row.actual ?? undefined,
  }));

  // Only meaningful with 5+ historical epics
  if (historicalEpics.length < 5) {
    return Response.json({
      warning: false,
      message:
        "Not enough historical data to compare estimates. At least 5 completed epics are needed.",
      historicalAvg: 0,
    });
  }

  // Compute historical average
  const totalWeeks = historicalEpics.reduce(
    (sum, ep) => sum + (ep.actual ?? ep.weeks),
    0
  );
  const historicalAvg =
    Math.round((totalWeeks / historicalEpics.length) * 10) / 10;

  try {
    const messages = buildCheckEstimateMessages(
      title,
      estimateWeeks,
      historicalEpics
    );
    const raw = await provider.draft(messages, {
      maxTokens: 256,
      temperature: 0.3,
    });

    // Parse JSON from response (may be wrapped in markdown code block)
    const jsonStr = raw
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(jsonStr) as {
      warning: boolean;
      message: string;
    };

    return Response.json({
      warning: parsed.warning ?? false,
      message: parsed.message ?? "",
      historicalAvg,
    });
  } catch (err) {
    console.error("AI check-estimate failed:", err);
    return Response.json(
      {
        error: {
          code: "AI_UNAVAILABLE",
          message: "AI estimate check failed. Try again later.",
        },
      },
      { status: 503 }
    );
  }
};
