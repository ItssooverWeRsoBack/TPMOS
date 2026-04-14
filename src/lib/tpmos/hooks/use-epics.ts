"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as epicsApi from "@/lib/tpmos/api/epics";
import type { CreateEpicInput, UpdateEpicInput } from "@/lib/tpmos/schemas/epic";

export function useEpics(teamSlug: string | null, quarterId: string | null) {
  return useQuery({
    queryKey: ["epics", teamSlug, quarterId],
    queryFn: () => epicsApi.listEpics(teamSlug!, quarterId!),
    enabled: !!teamSlug && !!quarterId,
  });
}

export function useCreateEpic(teamSlug: string | null, quarterId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEpicInput) => epicsApi.createEpic(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["epics", teamSlug, quarterId] }),
  });
}

export function useUpdateEpic(teamSlug: string | null, quarterId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ epicId, input, version }: { epicId: string; input: UpdateEpicInput; version: number }) =>
      epicsApi.updateEpic(epicId, input, version),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["epics", teamSlug, quarterId] }),
  });
}

export function useCastVote(teamSlug: string | null, quarterId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ epicId, ...input }: { epicId: string; value: number; timeCriticality: number; riskReduction: number; durationEstimateWeeks?: number }) =>
      epicsApi.castVote(epicId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["epics", teamSlug, quarterId] }),
  });
}
