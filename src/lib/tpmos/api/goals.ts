import type { Goal, CreateGoalInput, UpdateGoalInput, Initiative } from "@/lib/tpmos/schemas/goal";
import { apiUrl, handleResponse } from "./client";

export type GoalWithCounts = Goal & { initiativeCount?: number; epicCount?: number };
export type GoalDetail = Goal & { initiatives: Initiative[] };

export async function listGoals(): Promise<GoalWithCounts[]> {
  const res = await fetch(apiUrl("/goals"), { credentials: "include" });
  return handleResponse<GoalWithCounts[]>(res);
}

export async function listGoalGaps(): Promise<Goal[]> {
  const res = await fetch(apiUrl("/goals?gaps=true"), { credentials: "include" });
  return handleResponse<Goal[]>(res);
}

export async function getGoal(goalId: string): Promise<GoalDetail> {
  const res = await fetch(apiUrl(`/goals/${goalId}`), { credentials: "include" });
  return handleResponse<GoalDetail>(res);
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const res = await fetch(apiUrl("/goals"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Goal>(res);
}

export async function updateGoal(goalId: string, input: UpdateGoalInput, version: number): Promise<Goal> {
  const res = await fetch(apiUrl(`/goals/${goalId}`), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", "If-Match": String(version) },
    body: JSON.stringify(input),
  });
  return handleResponse<Goal>(res);
}

export async function linkGoalInitiative(goalId: string, initiativeId: string) {
  const res = await fetch(apiUrl(`/goals/${goalId}/initiatives`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initiativeId }),
  });
  return handleResponse<Initiative[]>(res);
}

export async function unlinkGoalInitiative(goalId: string, initiativeId: string) {
  const res = await fetch(apiUrl(`/goals/${goalId}/initiatives?initiativeId=${initiativeId}`), {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse<{ ok: boolean }>(res);
}
