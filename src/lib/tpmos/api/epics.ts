import type { Epic, CreateEpicInput, UpdateEpicInput, UpdateStatusInput } from "@/lib/tpmos/schemas/epic";
import type { WsjfResult, VoteInput } from "@/lib/tpmos/domain/wsjf";
import type { EpicVote } from "@/lib/tpmos/schemas/vote";
import { apiUrl, handleResponse } from "./client";

/** Vote data as returned by the API (includes userId, extends domain VoteInput) */
export type EpicVoteResponse = VoteInput & Pick<EpicVote, "userId" | "epicId" | "updatedAt">;

export interface EpicWithVotes extends Epic {
  votes: EpicVoteResponse[];
  wsjf: WsjfResult;
}

export async function listEpics(teamSlug: string, quarterId: string): Promise<EpicWithVotes[]> {
  const res = await fetch(
    apiUrl(`/epics?team=${encodeURIComponent(teamSlug)}&quarter=${encodeURIComponent(quarterId)}`),
    { credentials: "include" }
  );
  return handleResponse<EpicWithVotes[]>(res);
}

export async function getEpic(epicId: string): Promise<EpicWithVotes> {
  const res = await fetch(apiUrl(`/epics/${epicId}`), { credentials: "include" });
  return handleResponse<EpicWithVotes>(res);
}

export async function createEpic(input: CreateEpicInput): Promise<Epic> {
  const res = await fetch(apiUrl("/epics"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Epic>(res);
}

export async function updateEpic(epicId: string, input: UpdateEpicInput, version: number): Promise<Epic> {
  const res = await fetch(apiUrl(`/epics/${epicId}`), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", "If-Match": String(version) },
    body: JSON.stringify(input),
  });
  return handleResponse<Epic>(res);
}

export async function updateStatus(epicId: string, input: UpdateStatusInput): Promise<Epic> {
  const res = await fetch(apiUrl(`/epics/${epicId}/status`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Epic>(res);
}

export async function castVote(epicId: string, input: { value: number; timeCriticality: number; riskReduction: number; durationEstimateWeeks?: number }) {
  const res = await fetch(apiUrl(`/epics/${epicId}/votes`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<{ aggregates: import("@/lib/tpmos/domain/wsjf").WsjfResult }>(res);
}

export async function deleteEpic(epicId: string): Promise<void> {
  const res = await fetch(apiUrl(`/epics/${epicId}`), { method: "DELETE", credentials: "include" });
  await handleResponse<{ ok: boolean }>(res);
}
