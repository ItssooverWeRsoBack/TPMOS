import type { User } from "@/lib/tpmos/schemas/user";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(apiUrl("/me"), { credentials: "include" });
  const data = await handleResponse<{ user: User }>(res);
  return data.user;
}
