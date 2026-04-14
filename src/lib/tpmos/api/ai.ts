import { apiUrl, handleResponse } from "./client";

export interface DraftEpicResult {
  description: string;
  definitionOfDone: string;
  aiGenerated: boolean;
}

export interface LintDoDResult {
  issues: string[];
  suggestion: string | null;
  source: string;
}

export async function draftEpic(
  title: string,
  teamContext?: string
): Promise<DraftEpicResult> {
  const res = await fetch(apiUrl("/ai/draft-epic"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, teamContext }),
  });
  return handleResponse<DraftEpicResult>(res);
}

export async function lintDoD(
  definitionOfDone: string
): Promise<LintDoDResult> {
  const res = await fetch(apiUrl("/ai/lint-dod"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ definitionOfDone }),
  });
  return handleResponse<LintDoDResult>(res);
}
