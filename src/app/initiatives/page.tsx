"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { StatusPill } from "@/components/tpmos/epic/status-control";
import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import * as initiativesApi from "@/lib/tpmos/api/initiatives";
import type { CreateInitiativeInput } from "@/lib/tpmos/schemas/goal";
import type { EpicStatus } from "@/lib/tpmos/schemas/epic";
import { cn } from "@/lib/utils";
import { Plus, X, Network, Users } from "lucide-react";

export default function InitiativesPage() {
  const { data: user } = useCurrentUser();
  const qc = useQueryClient();
  const { data: initiatives, isLoading } = useQuery({ queryKey: ["initiatives"], queryFn: initiativesApi.listInitiatives });
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (input: CreateInitiativeInput) => initiativesApi.createInitiative(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["initiatives"] }); setShowForm(false); },
  });

  const canManage = user && (user.role === "admin" || user.role === "tpm");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Initiatives & Products"
        description="Cross-team programs that bridge leadership goals to team execution."
        action={
          canManage && !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" />
              New Initiative
            </button>
          ) : undefined
        }
      />

      {showForm && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">New Initiative</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMutation.mutate({
                title: fd.get("title") as string,
                description: (fd.get("description") as string) || undefined,
                status: "active",
              });
            }}
            className="space-y-3"
          >
            <input name="title" required placeholder="e.g., Mobile App v2" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            <textarea name="description" placeholder="Description (optional)" rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {createMutation.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          {isLoading && [1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />
          ))}

          {initiatives?.length === 0 && !isLoading && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Network className="mx-auto mb-2 size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No initiatives yet.</p>
            </div>
          )}

          {initiatives?.map((init) => (
            <button
              key={init.id}
              onClick={() => setSelectedId(selectedId === init.id ? null : init.id)}
              className={cn(
                "w-full rounded-lg border bg-card p-4 text-left transition-all hover:border-primary/40",
                selectedId === init.id && "border-primary/60 ring-1 ring-primary/20"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">{init.title}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {init.status}
                    </span>
                  </div>
                  {init.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{init.description}</p>
                  )}
                  {init.teamNames && init.teamNames.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="size-3 text-muted-foreground/50" />
                      <span className="text-[11px] text-muted-foreground">{init.teamNames.join(", ")}</span>
                    </div>
                  )}
                </div>
                <div className="ml-3 flex flex-col items-end gap-1 text-[11px] text-muted-foreground shrink-0">
                  <span>{init.goalCount ?? 0} goals</span>
                  <span>{init.epicCount ?? 0} epics</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedId && <InitiativeDetailPanel initiativeId={selectedId} />}
      </div>
    </div>
  );
}

function InitiativeDetailPanel({ initiativeId }: { initiativeId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["initiatives", initiativeId],
    queryFn: () => initiativesApi.getInitiative(initiativeId),
  });

  if (isLoading) return <div className="h-48 animate-pulse rounded-lg border border-border bg-card" />;
  if (!data) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{data.title}</h3>
        {data.description && <p className="mt-1 text-xs text-muted-foreground">{data.description}</p>}
      </div>

      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Contributing to Goals ({data.goals.length})
        </h4>
        {data.goals.length > 0 ? (
          <div className="space-y-1">
            {data.goals.map((g) => (
              <div key={g.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                <span className="flex-1 text-xs font-medium text-foreground">{g.title}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">{g.status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/70">Not linked to any goals yet.</p>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Team Epics ({data.epics.length})
        </h4>
        {data.epics.length > 0 ? (
          <div className="space-y-1">
            {data.epics.map((e) => (
              <div key={e.epic_id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-medium text-foreground">{e.title}</span>
                    <StatusPill status={e.status as EpicStatus} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{e.team_name} · {e.dri_committed_weeks}w</span>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{e.percent_complete}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/70">No epics linked yet.</p>
        )}
      </div>
    </div>
  );
}
