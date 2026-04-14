import type { CapacityPlan, UpsertCapacityInput } from "@/lib/tpmos/schemas/capacity";
import { apiUrl, handleResponse } from "./client";

export async function getCapacityPlan(teamSlug: string, quarterId: string): Promise<CapacityPlan | null> {
  const res = await fetch(
    apiUrl(`/capacity?team=${encodeURIComponent(teamSlug)}&quarter=${encodeURIComponent(quarterId)}`),
    { credentials: "include" }
  );
  return handleResponse<CapacityPlan | null>(res);
}

export async function upsertCapacityPlan(
  teamSlug: string,
  quarterId: string,
  input: UpsertCapacityInput
): Promise<CapacityPlan> {
  const res = await fetch(
    apiUrl(`/capacity?team=${encodeURIComponent(teamSlug)}&quarter=${encodeURIComponent(quarterId)}`),
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  return handleResponse<CapacityPlan>(res);
}
