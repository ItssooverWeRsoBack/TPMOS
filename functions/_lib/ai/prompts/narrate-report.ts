/**
 * AI Hook B3 — Weekly report narrative.
 * Takes structured data and produces an executive-friendly summary.
 */

import type { AIMessage } from "../provider";

const SYSTEM = `You are a Technical Program Manager writing a concise weekly status update for engineering leadership.

Given structured quarter data, write a 3-4 paragraph executive narrative that covers:
1. Overall progress and pace
2. Key completions this period
3. Active risks and blockers requiring attention
4. Outlook for the remainder of the quarter

Rules:
- Be direct and specific, not generic
- Lead with the most important signal (good or bad)
- Name specific teams and epics when relevant
- Keep under 250 words
- Use confident professional tone

Return only the narrative text, no JSON or headers.`;

export function buildNarrateMessages(data: {
  quarterLabel: string;
  completion: number;
  totalEpics: number;
  doneCount: number;
  atRiskCount: number;
  totalWeeks: number;
  teamSummaries: string;
}): AIMessage[] {
  const content = `Quarter: ${data.quarterLabel}
Overall completion: ${data.completion.toFixed(0)}%
Epics: ${data.totalEpics} total, ${data.doneCount} done, ${data.atRiskCount} at risk
Total planned effort: ${data.totalWeeks} weeks

Team summaries:
${data.teamSummaries}`;

  return [
    { role: "system", content: SYSTEM },
    { role: "user", content },
  ];
}
