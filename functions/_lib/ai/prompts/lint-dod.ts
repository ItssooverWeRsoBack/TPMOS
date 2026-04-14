/**
 * AI Hook A2 — Definition of Done linting.
 * Version 1. Changes require a DEC-XXXX entry.
 *
 * Two-stage: regex check first (fast, free), LLM only if regex passes.
 */

import type { AIMessage } from "../provider";

/** Fast regex-based checks. Returns issues found, or empty array if clean. */
export function regexLintDoD(dod: string): string[] {
  const issues: string[] = [];
  const lower = dod.toLowerCase();

  // Vague language patterns
  const vaguePatterns = [
    { pattern: /\bship\s+(it|the|this|feature)\b/i, issue: "Vague: 'ship feature' — what does shipped mean? Define the deployment target and verification." },
    { pattern: /\bmake\s+(it\s+)?better\b/i, issue: "Vague: 'make it better' — better by what measurable criteria?" },
    { pattern: /\bfinish\s+(the\s+)?work\b/i, issue: "Vague: 'finish the work' — specify what 'finished' looks like." },
    { pattern: /\bcomplete\s+(the\s+)?(task|epic|story)\b/i, issue: "Vague: 'complete the task' — the DoD should define what complete means, not restate it." },
    { pattern: /\bdone\s+when\s+(ready|done)\b/i, issue: "Circular: the DoD references itself. Define concrete criteria." },
    { pattern: /\bwhen\s+we\'re\s+happy\b/i, issue: "Subjective: 'when we're happy' — define observable success criteria." },
    { pattern: /\bget\s+it\s+working\b/i, issue: "Vague: 'get it working' — working means what? Define the behavior." },
  ];

  for (const { pattern, issue } of vaguePatterns) {
    if (pattern.test(dod)) {
      issues.push(issue);
    }
  }

  // Check for lack of measurability
  if (dod.length > 20 && !/\d/.test(dod) && !/percent|latency|error rate|uptime|sla|coverage|metric/i.test(dod)) {
    issues.push("No measurable criteria found. Consider adding metrics (latency, error rate, coverage, etc.).");
  }

  // Very short DoD
  if (dod.trim().length < 20) {
    issues.push("Very short DoD. A good Definition of Done typically has 3-5 specific criteria.");
  }

  return issues;
}

const SYSTEM = `You are reviewing a Definition of Done (DoD) for a quarterly engineering epic.

Evaluate it for:
1. Specificity — are criteria concrete or vague?
2. Measurability — can an engineer verify each item objectively?
3. Completeness — are obvious verification steps missing?

Return JSON:
{"issues": ["issue 1", "issue 2"], "suggestion": "improved version of the DoD"}

If the DoD is good, return: {"issues": [], "suggestion": null}

Be concise. Max 3 issues. Suggestion should be under 100 words.`;

export function buildLintDoDMessages(dod: string): AIMessage[] {
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Definition of Done:\n${dod}` },
  ];
}
