/**
 * POST /api/tpmos/ai/lint-dod — Lint a Definition of Done for quality
 *
 * Hook A2. Two-stage: regex first (free), LLM only if regex passes.
 */

import { getProvider } from "../../../_lib/ai/provider";
import { regexLintDoD, buildLintDoDMessages } from "../../../_lib/ai/prompts/lint-dod";
import { z } from "zod/v4";

const InputSchema = z.object({
  definitionOfDone: z.string().min(1).max(3000),
});

interface Env { DB: D1Database; AI: unknown; AI_PROVIDER: string; ANTHROPIC_API_KEY?: string; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = InputSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const dod = body.data.definitionOfDone;

  // Stage 1: fast regex check
  const regexIssues = regexLintDoD(dod);
  if (regexIssues.length > 0) {
    return Response.json({
      issues: regexIssues,
      suggestion: null,
      source: "regex",
    });
  }

  // Stage 2: LLM check (if available)
  const provider = getProvider(context.env);
  if (!provider.isAvailable()) {
    // No issues from regex and no AI — assume it's fine
    return Response.json({ issues: [], suggestion: null, source: "regex-only" });
  }

  try {
    const messages = buildLintDoDMessages(dod);
    const raw = await provider.draft(messages, { maxTokens: 256, temperature: 0.3 });

    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr) as { issues: string[]; suggestion: string | null };

    return Response.json({
      issues: parsed.issues ?? [],
      suggestion: parsed.suggestion ?? null,
      source: "llm",
    });
  } catch (err) {
    console.error("AI lint-dod failed:", err);
    // Graceful degradation: regex passed, LLM failed — report no issues
    return Response.json({ issues: [], suggestion: null, source: "regex-only" });
  }
};
