"use client";

import { cn } from "@/lib/utils";

interface WsjfBadgeProps {
  score: number | null;
  className?: string;
}

export function WsjfBadge({ score, className }: WsjfBadgeProps) {
  if (score === null) {
    return (
      <span className={cn("rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground", className)}>
        —
      </span>
    );
  }

  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold",
        score >= 8 ? "bg-emerald-500/15 text-emerald-400" :
        score >= 4 ? "bg-primary/15 text-primary" :
        score >= 2 ? "bg-amber-500/15 text-amber-400" :
        "bg-muted text-muted-foreground",
        className
      )}
    >
      {score.toFixed(1)}
    </span>
  );
}
