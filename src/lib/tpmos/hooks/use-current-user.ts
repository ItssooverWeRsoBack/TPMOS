"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/lib/tpmos/auth/client";
import type { User } from "@/lib/tpmos/schemas/user";

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60_000, // user doesn't change often
    retry: false,
  });
}
