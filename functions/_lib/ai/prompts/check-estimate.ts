/**
 * AI Hook C1 — Estimate sanity check.
 *
 * Compares a new epic's duration estimate against historical epics
 * with similar titles to flag potential over/under-estimation.
 */

import type { AIMessage } from "../provider";

const SYSTEM = `You are an experienced engineering program manager reviewing an epic duration estimate.

You are given:
1. A new epic title and its estimated duration (in weeks).
2. A list of historical completed epics with their titles, estimated durations, and actual durations (when available).

Your job:
- Compare the new estimate to historical data for similar work.
- Flag if the estimate seems significantly too high or too low compared to similar past work.
- Consider that actual durations typically exceed estimates by 20-40% (planning fallacy).
- Be concise: 2-3 sentences maximum.

Respond in JSON format:
{"warning": true/false, "message": "Your analysis here"}

Rules:
- warning=true only if the estimate is >50% different from what history suggests
- Be specific: reference relevant historical epics by name
- If the work seems genuinely novel with no good comparisons, say so and set warning=false
- Never suggest a specific number — just flag the concern`;

interface HistoricalEpic {
  title: string;
  weeks: number;
  actual?: number;
}

export function buildCheckEstimateMessages(
  newTitle: string,
  newWeeks: number,
  historicalEpics: HistoricalEpic[]
): AIMessage[] {
  const historyText = historicalEpics
    .map((ep) => {
      const actualStr =
        ep.actual !== undefined ? `, actual: ${ep.actual} weeks` : "";
      return `- "${ep.title}" (estimated: ${ep.weeks} weeks${actualStr})`;
    })
    .join("\n");

  const userContent = `New epic: "${newTitle}"
Estimated duration: ${newWeeks} weeks

Historical completed epics:
${historyText}

Analyze whether the estimate for the new epic seems reasonable given the historical data.`;

  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: userContent },
  ];
}
