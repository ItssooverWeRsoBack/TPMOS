"use client";

import { cn } from "@/lib/utils";
import { getCapacityState } from "@/lib/tpmos/domain/capacity";

interface LineDividerProps {
  committedWeeks: number;
  availableWeeks: number;
  className?: string;
}

export function LineDivider({ committedWeeks, availableWeeks, className }: LineDividerProps) {
  const state = getCapacityState(committedWeeks, availableWeeks);
  const remaining = Math.max(0, availableWeeks - committedWeeks);

  return (
    <div className={cn("relative my-1", className)}>
      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
      <div className="relative mx-auto w-fit rounded-full border border-border bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
        <span
          className={cn(
            state === "over" && "text-red-400",
            state === "tight" && "text-amber-400",
            state === "healthy" && "text-emerald-400",
            state === "under" && "text-muted-foreground"
          )}
        >
          {remaining > 0
            ? `${remaining.toFixed(1)}w remaining`
            : state === "over"
            ? `${(committedWeeks - availableWeeks).toFixed(1)}w over`
            : "At capacity"}
        </span>
        <span className="ml-2 text-muted-foreground/50">— the line —</span>
      </div>
    </div>
  );
}
