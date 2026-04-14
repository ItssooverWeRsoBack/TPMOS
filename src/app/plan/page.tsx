"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { EpicForm } from "@/components/tpmos/epic/epic-form";
import { VotePanel } from "@/components/tpmos/epic/vote-panel";
import { ConsensusHeatmap } from "@/components/tpmos/epic/consensus-heatmap";
import { StatusPill } from "@/components/tpmos/epic/status-control";
import { WsjfBadge } from "@/components/tpmos/planner/wsjf-badge";
import { CapacityBar } from "@/components/tpmos/capacity/capacity-bar";
import { useEpics, useCreateEpic, useCastVote } from "@/lib/tpmos/hooks/use-epics";
import { useQuarters } from "@/lib/tpmos/hooks/use-quarters";
import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import { useQuery } from "@tanstack/react-query";
import * as capacityApi from "@/lib/tpmos/api/capacity";
import { computeAvailableWeeks } from "@/lib/tpmos/domain/capacity";
import { Plus, X, Vote, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { EpicWithVotes } from "@/lib/tpmos/api/epics";
import type { EpicStatus } from "@/lib/tpmos/schemas/epic";

function PlanPageInner() {
  const searchParams = useSearchParams();
  const teamSlug = searchParams.get("team");
  const quarterId = searchParams.get("quarter");
  const { data: user } = useCurrentUser();
  const { data: quarters } = useQuarters();
  const activeQuarter = quarters?.find((q) => q.state === "active");
  const effectiveQuarterId = quarterId ?? activeQuarter?.id ?? null;

  const { data: epics, isLoading } = useEpics(teamSlug, effectiveQuarterId);
  const createEpic = useCreateEpic(teamSlug, effectiveQuarterId);
  const castVote = useCastVote(teamSlug, effectiveQuarterId);

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

  // Compute capacity
  const capacity = capacityPlan
    ? computeAvailableWeeks({
        totalMemberWeeks: capacityPlan.totalMemberWeeks,
        vacationWeeks: capacityPlan.vacationWeeks,
        techDebtWeeks: capacityPlan.techDebtWeeks,
        otherOverheadWeeks: capacityPlan.otherOverheadWeeks,
      })
    : null;

  const committedWeeks = epics?.reduce((sum, e) => sum + e.driCommittedWeeks, 0) ?? 0;
  const votingEpic = epics?.find((e) => e.id === votingEpicId);
  const myVote = votingEpic?.votes.find((v) => v.userId === user?.id);

  // Find the team ID from the first epic (needed for creating new epics)
  const teamId = epics?.[0]?.teamId;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quarterly Plan"
        description={`Team: ${teamSlug}`}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
            {showForm ? "Cancel" : "New Epic"}
          </button>
        }
      />

      {/* Capacity bar */}
      {capacity && (
        <CapacityBar
          committedWeeks={committedWeeks}
          availableWeeks={capacity.availableWeeks}
        />
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

      {/* Epic list */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      )}

      {epics?.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No epics yet for this quarter.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-xs text-primary underline underline-offset-4"
          >
            Create your first epic
          </button>
        </div>
      )}

      {epics && epics.length > 0 && (
        <div className="space-y-1">
          {epics.map((epic, index) => (
            <EpicRow
              key={epic.id}
              epic={epic}
              index={index}
              isVoting={votingEpicId === epic.id}
              onToggleVote={() => setVotingEpicId(votingEpicId === epic.id ? null : epic.id)}
            />
          ))}
        </div>
      )}

      {/* Vote panel (shown when an epic is selected for voting) */}
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

      {/* Consensus heatmap toggle */}
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

function EpicRow({
  epic,
  index,
  isVoting,
  onToggleVote,
}: {
  epic: EpicWithVotes;
  index: number;
  isVoting: boolean;
  onToggleVote: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:border-border/80">
      <span className="w-6 text-center text-[11px] font-mono text-muted-foreground">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{epic.title}</span>
          <StatusPill status={epic.status as EpicStatus} />
          {epic.carriedFromEpicId && (
            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-400">
              Carried
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="font-mono">{epic.driCommittedWeeks}w</span>
          {epic.wsjf.voteCount > 0 && (
            <span>{epic.wsjf.voteCount} vote{epic.wsjf.voteCount !== 1 ? "s" : ""}</span>
          )}
          {epic.atRisk && (
            <span className="font-semibold text-amber-400">At Risk</span>
          )}
        </div>
      </div>
      <WsjfBadge score={epic.wsjf.score} />
      <button
        onClick={onToggleVote}
        className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
          isVoting
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Vote className="inline size-3 mr-1" />
        Vote
      </button>
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
