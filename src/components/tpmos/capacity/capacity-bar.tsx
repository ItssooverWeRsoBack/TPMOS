"use client";

import { cn } from "@/lib/utils";
import { getCapacityState, type CapacityState } from "@/lib/tpmos/domain/capacity";

const STATE_COLORS: Record<CapacityState, string> = {
  under: "bg-muted-foreground/30",
  healthy: "bg-emerald-500",
  tight: "bg-amber-500",
  over: "bg-red-500",
};

const STATE_LABELS: Record<CapacityState, string> = {
  under: "Under-committed",
  healthy: "Healthy",
  tight: "Tight",
  over: "Over-committed",
};

interface CapacityBarProps {
  committedWeeks: number;
  availableWeeks: number;
  className?: string;
  showLabel?: boolean;
}

export function CapacityBar({
  committedWeeks,
  availableWeeks,
  className,
  showLabel = true,
}: CapacityBarProps) {
  const state = getCapacityState(committedWeeks, availableWeeks);
  const percent = availableWeeks > 0
    ? Math.min(100, (committedWeeks / availableWeeks) * 100)
    : committedWeeks > 0 ? 100 : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-mono text-muted-foreground">
          {committedWeeks.toFixed(1)} / {availableWeeks.toFixed(1)} weeks
        </span>
        {showLabel && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              state === "over" && "bg-red-500/15 text-red-400",
              state === "tight" && "bg-amber-500/15 text-amber-400",
              state === "healthy" && "bg-emerald-500/15 text-emerald-400",
              state === "under" && "bg-muted text-muted-foreground"
            )}
          >
            {STATE_LABELS[state]}
          </span>
        )}
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-300", STATE_COLORS[state])}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}
