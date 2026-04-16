import type { Initiative, CreateInitiativeInput } from "@/lib/tpmos/schemas/goal";
import { apiUrl, handleResponse } from "./client";

export type InitiativeWithCounts = Initiative & {
  goalCount?: number;
  epicCount?: number;
  teamNames?: string[];
};

export type InitiativeDetail = Initiative & {
  goals: { id: string; title: string; status: string }[];
  epics: { epic_id: string; title: string; status: string; percent_complete: number; team_name: string; dri_committed_weeks: number }[];
};

export async function listInitiatives(): Promise<InitiativeWithCounts[]> {
  const res = await fetch(apiUrl("/initiatives"), { credentials: "include" });
  return handleResponse<InitiativeWithCounts[]>(res);
}

export async function getInitiative(id: string): Promise<InitiativeDetail> {
  const res = await fetch(apiUrl(`/initiatives/${id}`), { credentials: "include" });
  return handleResponse<InitiativeDetail>(res);
}

export async function createInitiative(input: CreateInitiativeInput): Promise<Initiative> {
  const res = await fetch(apiUrl("/initiatives"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Initiative>(res);
}

export async function linkEpic(initiativeId: string, epicId: string) {
  const res = await fetch(apiUrl(`/initiatives/${initiativeId}/epics`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ epicId }),
  });
  return handleResponse<unknown>(res);
}

export async function unlinkEpic(initiativeId: string, epicId: string) {
  const res = await fetch(apiUrl(`/initiatives/${initiativeId}/epics?epicId=${epicId}`), {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse<{ ok: boolean }>(res);
}
