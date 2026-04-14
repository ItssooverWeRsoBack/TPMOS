"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { ProgressBar } from "@/components/tpmos/progress/progress-bar";
import { StatusPill, StatusSelect } from "@/components/tpmos/epic/status-control";
import { useEpics } from "@/lib/tpmos/hooks/use-epics";
import { useQuarters } from "@/lib/tpmos/hooks/use-quarters";
import { computeProgress } from "@/lib/tpmos/domain/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as epicsApi from "@/lib/tpmos/api/epics";
import type { EpicStatus } from "@/lib/tpmos/schemas/epic";
import { AlertCircle } from "lucide-react";

function BoardPageInner() {
  const searchParams = useSearchParams();
  const teamSlug = searchParams.get("team");
  const quarterId = searchParams.get("quarter");
  const { data: quarters } = useQuarters();
  const qc = useQueryClient();
  const activeQuarter = quarters?.find((q) => q.state === "active");
  const effectiveQuarterId = quarterId ?? activeQuarter?.id ?? null;
  const currentQuarter = quarters?.find((q) => q.id === effectiveQuarterId);

  const { data: epics, isLoading } = useEpics(teamSlug, effectiveQuarterId);

  const statusMutation = useMutation({
    mutationFn: ({ epicId, status, percentComplete, atRisk }: {
      epicId: string; status: EpicStatus; percentComplete?: number; atRisk?: boolean;
    }) => epicsApi.updateStatus(epicId, { status, percentComplete, atRisk }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["epics", teamSlug, effectiveQuarterId] }),
  });

  if (!teamSlug) {
    return (
      <div className="space-y-6">
        <PageHeader title="Status Board" />
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          <AlertCircle className="size-4 shrink-0" />
          Navigate to Teams → select a team → click Board.
        </div>
      </div>
    );
  }

  const progress = epics && currentQuarter
    ? computeProgress(
        epics.map((e) => ({
          driCommittedWeeks: e.driCommittedWeeks,
          percentComplete: e.percentComplete,
          status: e.status,
        })),
        currentQuarter.startDate,
        currentQuarter.endDate
      )
    : null;

  const STATUS_ORDER: EpicStatus[] = ["blocked", "at_risk", "in_progress", "not_started", "done", "cancelled"];

  return (
    <div className="space-y-6">
      <PageHeader title="Status Board" description={`Team: ${teamSlug}`} />

      {progress && <ProgressBar progress={progress} />}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      )}

      {epics && epics.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Epic</th>
                <th className="w-32 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="w-24 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">% Done</th>
                <th className="w-16 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Weeks</th>
                <th className="w-20 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">At Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {epics
                .slice()
                .sort((a, b) => STATUS_ORDER.indexOf(a.status as EpicStatus) - STATUS_ORDER.indexOf(b.status as EpicStatus))
                .map((epic) => (
                  <tr key={epic.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">{epic.title}</span>
                        {epic.carriedFromEpicId && (
                          <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[9px] font-semibold uppercase text-amber-400">
                            Carried
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusSelect
                        value={epic.status as EpicStatus}
                        onChange={(status) =>
                          statusMutation.mutate({
                            epicId: epic.id,
                            status,
                            percentComplete: status === "done" ? 100 : undefined,
                            atRisk: status === "at_risk" ? true : status === "done" ? false : undefined,
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={epic.percentComplete}
                        onChange={(e) =>
                          statusMutation.mutate({
                            epicId: epic.id,
                            status: epic.status as EpicStatus,
                            percentComplete: Number(e.target.value),
                          })
                        }
                        className="w-16 rounded border border-border bg-background px-2 py-0.5 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      {epic.driCommittedWeeks}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={epic.atRisk}
                        onChange={(e) =>
                          statusMutation.mutate({
                            epicId: epic.id,
                            status: epic.status as EpicStatus,
                            atRisk: e.target.checked,
                          })
                        }
                        className="size-4 accent-amber-500"
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {epics?.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No epics for this quarter.
        </div>
      )}
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-lg border border-border bg-card" />}>
      <BoardPageInner />
    </Suspense>
  );
}
