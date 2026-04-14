"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { EpicForm } from "@/components/tpmos/epic/epic-form";
import { VotePanel } from "@/components/tpmos/epic/vote-panel";
import { ConsensusHeatmap } from "@/components/tpmos/epic/consensus-heatmap";
import { PlannerBoard } from "@/components/tpmos/planner/planner-board";
import { CapacityBar } from "@/components/tpmos/capacity/capacity-bar";
import { useEpics, useCreateEpic, useCastVote } from "@/lib/tpmos/hooks/use-epics";
import { useQuarters } from "@/lib/tpmos/hooks/use-quarters";
import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as capacityApi from "@/lib/tpmos/api/capacity";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import { computeAvailableWeeks } from "@/lib/tpmos/domain/capacity";
import { Plus, X, AlertCircle, ChevronDown, ChevronUp, Lock } from "lucide-react";

async function reorderEpicsApi(teamSlug: string, quarterId: string, epicIds: string[]) {
  const res = await fetch(apiUrl("/epics/reorder"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamSlug, quarterId, epicIds }),
  });
  return handleResponse<{ reordered: number }>(res);
}

function PlanPageInner() {
  const searchParams = useSearchParams();
  const teamSlug = searchParams.get("team");
  const quarterId = searchParams.get("quarter");
  const { data: user } = useCurrentUser();
  const { data: quarters } = useQuarters();
  const qc = useQueryClient();
  const activeQuarter = quarters?.find((q) => q.state === "active");
  const effectiveQuarterId = quarterId ?? activeQuarter?.id ?? null;
  const currentQuarter = quarters?.find((q) => q.id === effectiveQuarterId);
  const isReadOnly = currentQuarter?.state === "closed";

  const { data: epics, isLoading } = useEpics(teamSlug, effectiveQuarterId);
  const createEpic = useCreateEpic(teamSlug, effectiveQuarterId);
  const castVote = useCastVote(teamSlug, effectiveQuarterId);

  const reorderMutation = useMutation({
    mutationFn: (epicIds: string[]) =>
      reorderEpicsApi(teamSlug!, effectiveQuarterId!, epicIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["epics", teamSlug, effectiveQuarterId] }),
  });

  const lockMutation = useMutation({
    mutationFn: () =>
      fetch(apiUrl(`/quarters/${effectiveQuarterId}/lock`), {
        method: "POST",
        credentials: "include",
      }).then((r) => handleResponse(r)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quarters"] }),
  });

  const { data: capacityPlan } = useQuery({
    queryKey: ["capacity", teamSlug, effectiveQuarterId],
    queryFn: () => capacityApi.getCapacityPlan(teamSlug!, effectiveQuarterId!),
    enabled: !!teamSlug && !!effectiveQuarterId,
  });

  const [showForm, setShowForm] = useState(false);
  const [votingEpicId, setVotingEpicId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  if (!teamSlug) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quarterly Plan" />
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          <AlertCircle className="size-4 shrink-0" />
          Navigate to Teams → select a team → click Plan.
        </div>
      </div>
    );
  }

  const capacity = capacityPlan
    ? computeAvailableWeeks({
        totalMemberWeeks: capacityPlan.totalMemberWeeks,
        vacationWeeks: capacityPlan.vacationWeeks,
        techDebtWeeks: capacityPlan.techDebtWeeks,
        otherOverheadWeeks: capacityPlan.otherOverheadWeeks,
      })
    : null;

  const availableWeeks = capacity?.availableWeeks ?? 0;
  const committedWeeks = epics?.reduce((sum, e) => sum + e.driCommittedWeeks, 0) ?? 0;
  const votingEpic = epics?.find((e) => e.id === votingEpicId);
  const myVote = votingEpic?.votes.find((v) => v.userId === user?.id);
  const teamId = epics?.[0]?.teamId;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quarterly Plan"
        description={`${teamSlug}${isReadOnly ? " (read-only)" : ""}`}
        action={
          <div className="flex gap-2">
            {!isReadOnly && currentQuarter?.state === "planning" && (
              <button
                onClick={() => lockMutation.mutate()}
                disabled={lockMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Lock className="size-3" />
                {lockMutation.isPending ? "Locking..." : "Lock Plan"}
              </button>
            )}
            {!isReadOnly && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
                {showForm ? "Cancel" : "New Epic"}
              </button>
            )}
          </div>
        }
      />

      {/* Capacity bar */}
      {capacity && (
        <CapacityBar committedWeeks={committedWeeks} availableWeeks={availableWeeks} />
      )}
      {!capacityPlan && teamSlug && (
        <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
          No capacity plan set.{" "}
          <a href={`/capacity?team=${teamSlug}&quarter=${effectiveQuarterId}`} className="text-primary underline underline-offset-4">
            Set capacity
          </a>
        </div>
      )}

      {/* Create epic form */}
      {showForm && teamId && effectiveQuarterId && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">New Epic</h3>
          <EpicForm
            teamId={teamId}
            quarterId={effectiveQuarterId}
            onSubmit={(input) => {
              createEpic.mutate(input, { onSuccess: () => setShowForm(false) });
            }}
            onCancel={() => setShowForm(false)}
            isLoading={createEpic.isPending}
          />
        </div>
      )}

      {/* Planner board with drag-and-drop */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      )}

      {epics && (
        <PlannerBoard
          epics={epics}
          availableWeeks={availableWeeks}
          onReorder={(ids) => reorderMutation.mutate(ids)}
          onVoteClick={(id) => setVotingEpicId(votingEpicId === id ? null : id)}
          isReordering={reorderMutation.isPending}
          readOnly={isReadOnly}
        />
      )}

      {/* Vote panel */}
      {votingEpic && (
        <div className="rounded-lg border border-primary/30 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Vote: {votingEpic.title}</h3>
            <button onClick={() => setVotingEpicId(null)} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <VotePanel
            existingVote={myVote ? {
              value: myVote.value ?? 5,
              timeCriticality: myVote.timeCriticality ?? 5,
              riskReduction: myVote.riskReduction ?? 5,
              durationEstimateWeeks: myVote.durationEstimateWeeks,
            } : undefined}
            onSubmit={(vote) => {
              castVote.mutate({ epicId: votingEpic.id, ...vote }, {
                onSuccess: () => setVotingEpicId(null),
              });
            }}
            isLoading={castVote.isPending}
          />
        </div>
      )}

      {/* Consensus heatmap */}
      {epics && epics.length > 0 && (
        <div>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {showHeatmap ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            Consensus Heatmap
          </button>
          {showHeatmap && (
            <div className="mt-3 rounded-lg border border-border bg-card p-3">
              <ConsensusHeatmap epics={epics.map((e) => ({ id: e.id, title: e.title, wsjf: e.wsjf }))} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-lg border border-border bg-card" />}>
      <PlanPageInner />
    </Suspense>
  );
}
