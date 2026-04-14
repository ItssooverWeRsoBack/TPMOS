/**
 * AI Hook B1 — Interview synthesis.
 * Extracts scope summary, top challenges, suggested theme tags, and actions.
 */

import type { AIMessage } from "../provider";

const SYSTEM = `You are an experienced Technical Program Manager synthesizing an engineering lead interview.

Given responses to 4 standard intake questions, extract:
1. scopeSummary — one sentence describing the team's scope
2. topChallenges — 3-5 specific challenges (not generic, drawn from their words)
3. suggestedThemes — 3-7 canonical theme labels that could group with other interviews (e.g., "cross-team handoffs", "technical debt", "hiring pipeline")
4. recommendedActions — 2-3 concrete actions the TPM could take based on this interview

Format as JSON:
{
  "scopeSummary": "...",
  "topChallenges": ["...", "..."],
  "suggestedThemes": ["...", "..."],
  "recommendedActions": ["...", "..."]
}

Be concise. Total response under 300 words.`;

export function buildSynthesizeMessages(interview: {
  q1Scope: string | null;
  q2Challenges: string | null;
  q3MustKnow: string | null;
  q4BlueSky: string | null;
}): AIMessage[] {
  const content = [
    `Q1 — What team do you manage and what is your scope?\n${interview.q1Scope ?? "(no answer)"}`,
    `Q2 — What are your 3 biggest challenges right now?\n${interview.q2Challenges ?? "(no answer)"}`,
    `Q3 — What are 3 things a TPM should know immediately?\n${interview.q3MustKnow ?? "(no answer)"}`,
    `Q4 — If you could blue-sky one thing a TPM should achieve, what would it be?\n${interview.q4BlueSky ?? "(no answer)"}`,
  ].join("\n\n");

  return [
    { role: "system", content: SYSTEM },
    { role: "user", content },
  ];
}
