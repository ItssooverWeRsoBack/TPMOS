import type { Team, CreateTeamInput, UpdateTeamInput, TeamMember, AddMemberInput } from "@/lib/tpmos/schemas/team";
import { apiUrl, handleResponse } from "./client";

export async function listTeams(): Promise<Team[]> {
  const res = await fetch(apiUrl("/teams"), { credentials: "include" });
  return handleResponse<Team[]>(res);
}

export async function getTeam(teamId: string): Promise<Team> {
  const res = await fetch(apiUrl(`/teams/${teamId}`), { credentials: "include" });
  return handleResponse<Team>(res);
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const res = await fetch(apiUrl("/teams"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Team>(res);
}

export async function updateTeam(teamId: string, input: UpdateTeamInput, version: number): Promise<Team> {
  const res = await fetch(apiUrl(`/teams/${teamId}`), {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "If-Match": String(version),
    },
    body: JSON.stringify(input),
  });
  return handleResponse<Team>(res);
}

export async function archiveTeam(teamId: string, version: number): Promise<Team> {
  return updateTeam(teamId, { archived: true }, version);
}

export async function listMembers(teamId: string): Promise<TeamMember[]> {
  const res = await fetch(apiUrl(`/teams/${teamId}/members`), { credentials: "include" });
  return handleResponse<TeamMember[]>(res);
}

export async function addMember(teamId: string, input: AddMemberInput): Promise<void> {
  const res = await fetch(apiUrl(`/teams/${teamId}/members`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await handleResponse<void>(res);
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  const res = await fetch(apiUrl(`/teams/${teamId}/members/${userId}`), {
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse<void>(res);
}
