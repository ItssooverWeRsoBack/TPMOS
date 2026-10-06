"use client";
import { useQuery } from "@tanstack/react-query";
import { apiUrl, handleResponse } from "../api/client";
import { TeamPlanningContextSchema } from "../schemas/planning-context";
import { resolvePlanningQuarter } from "../domain/planning-context";
export function usePlanningContext(teamSlug: string | null, requestedQuarter: string | null = null) {
  const query = useQuery({
    queryKey: ["planning-context", teamSlug],
    queryFn: async () => TeamPlanningContextSchema.parse(await handleResponse(await fetch(apiUrl(`/planning-context?${new URLSearchParams({ team: teamSlug! })}`), { credentials: "include" }))),
    enabled: !!teamSlug,
  });
  const quarters = query.data?.quarters ?? [];
  const effectiveQuarterId = resolvePlanningQuarter(quarters, requestedQuarter);
  return { ...query, quarters, effectiveQuarterId, currentQuarter: quarters.find(q => q.id === effectiveQuarterId) };
}
