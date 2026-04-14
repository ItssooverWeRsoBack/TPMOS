/**
 * POST /api/tpmos/ai/draft-epic — AI-assisted epic description + DoD drafting
 *
 * Hook A1. Uses provider abstraction. Returns 503 if AI unavailable.
 */

import { getAuth } from "../../../_lib/auth/context";
import { getProvider } from "../../../_lib/ai/provider";
import { buildDraftEpicMessages } from "../../../_lib/ai/prompts/draft-epic";
import { z } from "zod/v4";

const InputSchema = z.object({
  title: z.string().min(1).max(200),
  teamContext: z.string().max(500).optional(),
});

interface Env { DB: D1Database; AI: unknown; AI_PROVIDER: string; ANTHROPIC_API_KEY?: string; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const provider = getProvider(context.env);

  if (!provider.isAvailable()) {
    return Response.json(
      { error: { code: "AI_UNAVAILABLE", message: "AI features are disabled" } },
      { status: 503 }
    );
  }

  const body = InputSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  try {
    const messages = buildDraftEpicMessages(body.data.title, body.data.teamContext);
    const raw = await provider.draft(messages, { maxTokens: 512, temperature: 0.7 });

    // Parse JSON from response (may be wrapped in markdown code block)
    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr) as { description: string; definitionOfDone: string };

    return Response.json({
      description: parsed.description ?? "",
      definitionOfDone: parsed.definitionOfDone ?? "",
      aiGenerated: true,
    });
  } catch (err) {
    console.error("AI draft-epic failed:", err);
    return Response.json(
      { error: { code: "AI_UNAVAILABLE", message: "AI generation failed. Try again or write manually." } },
      { status: 503 }
    );
  }
};
