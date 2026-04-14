"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { ProgressResult } from "@/lib/tpmos/domain/progress";

interface ProgressBarProps {
  progress: ProgressResult;
  className?: string;
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  const { weightedCompletion, timeElapsed, behindPace, totalCommitted, totalDone } = progress;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-foreground">
            {weightedCompletion.toFixed(0)}% complete
          </span>
          <span className="text-muted-foreground">
            ({totalDone}/{totalCommitted} done)
          </span>
          {behindPace && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
              <AlertTriangle className="size-3" />
              Behind pace
            </span>
          )}
        </div>
        <span className="font-mono text-muted-foreground">
          {timeElapsed.toFixed(0)}% of quarter elapsed
        </span>
      </div>

      {/* Dual progress bar */}
      <div className="relative h-3 rounded-full bg-muted">
        {/* Time elapsed (background reference) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/15"
          style={{ width: `${Math.min(100, timeElapsed)}%` }}
        />
        {/* Completion (foreground) */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
            behindPace ? "bg-amber-500" : "bg-emerald-500"
          )}
          style={{ width: `${Math.min(100, weightedCompletion)}%` }}
        />
        {/* Time marker */}
        <div
          className="absolute top-0 h-full w-px bg-foreground/30"
          style={{ left: `${Math.min(100, timeElapsed)}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Quarter start</span>
        <span>Quarter end</span>
      </div>
    </div>
  );
}
