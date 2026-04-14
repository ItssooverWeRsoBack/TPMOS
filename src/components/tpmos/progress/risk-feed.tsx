"use client";

import { StatusPill } from "@/components/tpmos/epic/status-control";
import { AlertTriangle, Clock } from "lucide-react";
import type { EpicStatus } from "@/lib/tpmos/schemas/epic";

interface RiskEpic {
  id: string;
  title: string;
  status: string;
  percentComplete: number;
  atRisk: boolean;
  driCommittedWeeks: number;
  teamName?: string;
  teamSlug?: string;
  updatedAt: string;
}

interface RiskFeedProps {
  epics: RiskEpic[];
}

export function RiskFeed({ epics }: RiskFeedProps) {
  if (epics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <AlertTriangle className="mx-auto mb-2 size-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No at-risk or blocked epics.</p>
        <p className="mt-1 text-xs text-muted-foreground/70">This is a good sign.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {epics.map((epic) => (
        <div
          key={epic.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
            <AlertTriangle className="size-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">{epic.title}</span>
              <StatusPill status={epic.status as EpicStatus} />
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
              {epic.teamName && <span>{epic.teamName}</span>}
              <span className="font-mono">{epic.driCommittedWeeks}w</span>
              <span>{epic.percentComplete}% done</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {new Date(epic.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
