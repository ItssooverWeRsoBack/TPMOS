"use client";

import { useState } from "react";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { TeamCard } from "@/components/tpmos/teams/team-card";
import { TeamForm } from "@/components/tpmos/teams/team-form";
import { MemberList } from "@/components/tpmos/teams/member-list";
import { useTeams, useTeamMembers, useCreateTeam } from "@/lib/tpmos/hooks/use-teams";
import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import { Plus, X, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function TeamsPage() {
  const { data: user } = useCurrentUser();
  const { data: teams, isLoading } = useTeams();
  const [showForm, setShowForm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const createTeam = useCreateTeam();
  const { data: members } = useTeamMembers(selectedTeamId);

  const canCreate = user && (user.role === "admin" || user.role === "tpm");
  const selectedTeam = teams?.find((t) => t.id === selectedTeamId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Manage teams and their members."
        action={
          canCreate && !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" />
              New Team
            </button>
          ) : undefined
        }
      />

      {showForm && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Create Team</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <TeamForm
            onSubmit={(input) => {
              createTeam.mutate(input, {
                onSuccess: () => setShowForm(false),
              });
            }}
            onCancel={() => setShowForm(false)}
            isLoading={createTeam.isPending}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Team list */}
        <div className="space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-card" />
              ))}
            </div>
          )}
          {teams?.length === 0 && !isLoading && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No teams yet.</p>
              {canCreate && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-2 text-xs text-primary underline underline-offset-4"
                >
                  Create your first team
                </button>
              )}
            </div>
          )}
          {teams?.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isSelected={team.id === selectedTeamId}
              onClick={() => setSelectedTeamId(team.id === selectedTeamId ? null : team.id)}
            />
          ))}
        </div>

        {/* Selected team detail panel */}
        {selectedTeam && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{selectedTeam.name}</h3>
              <div className="flex gap-1.5">
                <Link
                  href={`/plan?team=${selectedTeam.slug}`}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Plan <ChevronRight className="size-3" />
                </Link>
                <Link
                  href={`/board?team=${selectedTeam.slug}`}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Board <ChevronRight className="size-3" />
                </Link>
                <Link
                  href={`/capacity?team=${selectedTeam.slug}`}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Capacity <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>

            {selectedTeam.charter && (
              <p className="text-xs text-muted-foreground">{selectedTeam.charter}</p>
            )}

            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Members
              </h4>
              <MemberList members={members ?? []} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
