import type { Quarter, CreateQuarterInput } from "@/lib/tpmos/schemas/quarter";
import { apiUrl, handleResponse } from "./client";

export async function listQuarters(): Promise<Quarter[]> {
  const res = await fetch(apiUrl("/quarters"), { credentials: "include" });
  return handleResponse<Quarter[]>(res);
}

export async function getQuarter(quarterId: string): Promise<Quarter> {
  const res = await fetch(apiUrl(`/quarters/${quarterId}`), { credentials: "include" });
  return handleResponse<Quarter>(res);
}

export async function createQuarter(input: CreateQuarterInput): Promise<Quarter> {
  const res = await fetch(apiUrl("/quarters"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Quarter>(res);
}

export async function lockQuarter(quarterId: string): Promise<Quarter> {
  const res = await fetch(apiUrl(`/quarters/${quarterId}/lock`), {
    method: "POST",
    credentials: "include",
  });
  return handleResponse<Quarter>(res);
}
