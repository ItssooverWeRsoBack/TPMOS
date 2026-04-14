"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { CapacityForm } from "@/components/tpmos/capacity/capacity-form";
import { useQuarters } from "@/lib/tpmos/hooks/use-quarters";
import * as capacityApi from "@/lib/tpmos/api/capacity";
import type { UpsertCapacityInput } from "@/lib/tpmos/schemas/capacity";
import { AlertCircle } from "lucide-react";

function CapacityPageInner() {
  const searchParams = useSearchParams();
  const teamSlug = searchParams.get("team");
  const quarterId = searchParams.get("quarter");
  const { data: quarters } = useQuarters();
  const qc = useQueryClient();

  // Default to active quarter if not specified
  const activeQuarter = quarters?.find((q) => q.state === "active");
  const effectiveQuarterId = quarterId ?? activeQuarter?.id;

  const { data: plan, isLoading } = useQuery({
    queryKey: ["capacity", teamSlug, effectiveQuarterId],
    queryFn: () => capacityApi.getCapacityPlan(teamSlug!, effectiveQuarterId!),
    enabled: !!teamSlug && !!effectiveQuarterId,
  });

  const mutation = useMutation({
    mutationFn: (input: UpsertCapacityInput) =>
      capacityApi.upsertCapacityPlan(teamSlug!, effectiveQuarterId!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["capacity", teamSlug, effectiveQuarterId] });
    },
  });

  if (!teamSlug) {
    return (
      <div className="space-y-6">
        <PageHeader title="Capacity Plan" description="Declare team capacity for the quarter." />
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          <AlertCircle className="size-4 shrink-0" />
          Select a team from the Teams page, then navigate to Capacity.
        </div>
      </div>
    );
  }

  if (!effectiveQuarterId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Capacity Plan" description={`Team: ${teamSlug}`} />
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No active quarter found. Create a quarter first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capacity Plan"
        description={`Team: ${teamSlug}`}
      />

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
      ) : (
        <CapacityForm
          initial={plan ?? undefined}
          onSubmit={(input) => mutation.mutate(input)}
          isLoading={mutation.isPending}
        />
      )}

      {mutation.isError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          Failed to save capacity plan. Please try again.
        </div>
      )}

      {mutation.isSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          Capacity plan saved.
        </div>
      )}
    </div>
  );
}

export default function CapacityPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-lg border border-border bg-card" />}>
      <CapacityPageInner />
    </Suspense>
  );
}
