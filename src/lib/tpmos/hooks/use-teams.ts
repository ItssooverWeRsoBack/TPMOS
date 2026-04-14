"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as teamsApi from "@/lib/tpmos/api/teams";
import type { CreateTeamInput, UpdateTeamInput } from "@/lib/tpmos/schemas/team";

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: teamsApi.listTeams,
  });
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ["teamMembers", teamId],
    queryFn: () => teamsApi.listMembers(teamId!),
    enabled: !!teamId,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeamInput) => teamsApi.createTeam(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, input, version }: { teamId: string; input: UpdateTeamInput; version: number }) =>
      teamsApi.updateTeam(teamId, input, version),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useArchiveTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, version }: { teamId: string; version: number }) =>
      teamsApi.archiveTeam(teamId, version),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}
