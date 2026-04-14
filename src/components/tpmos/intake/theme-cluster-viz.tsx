"use client";

import { cn } from "@/lib/utils";

interface Cluster {
  label: string;
  count: number;
  interviewIds: string[];
}

interface ThemeClusterVizProps {
  clusters: Cluster[];
  totalInterviews: number;
  className?: string;
}

export function ThemeClusterViz({ clusters, totalInterviews, className }: ThemeClusterVizProps) {
  if (clusters.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No themes discovered yet. Synthesize some interviews first.
      </div>
    );
  }

  const maxCount = Math.max(...clusters.map((c) => c.count));

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-xs text-muted-foreground">
        {clusters.length} themes across {totalInterviews} interviews
      </div>

      {/* Bubble-style visualization */}
      <div className="flex flex-wrap gap-2">
        {clusters.map((cluster) => {
          const ratio = cluster.count / maxCount;
          const size = Math.max(60, ratio * 140);
          return (
            <div
              key={cluster.label}
              className={cn(
                "flex items-center justify-center rounded-2xl border text-center transition-all hover:border-primary/40",
                ratio >= 0.7
                  ? "border-primary/30 bg-primary/10"
                  : ratio >= 0.4
                  ? "border-border bg-muted/50"
                  : "border-border/50 bg-card"
              )}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                padding: "8px",
              }}
            >
              <div>
                <div
                  className={cn(
                    "font-medium leading-tight",
                    ratio >= 0.7 ? "text-primary text-xs" : "text-foreground/80 text-[10px]"
                  )}
                >
                  {cluster.label}
                </div>
                <div className="mt-0.5 text-[9px] font-mono text-muted-foreground">
                  ×{cluster.count}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* List view */}
      <div className="space-y-1">
        {clusters.map((cluster) => (
          <div
            key={cluster.label}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">{cluster.label}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="font-mono">{cluster.count} mention{cluster.count !== 1 ? "s" : ""}</span>
              <div className="h-1.5 w-16 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(cluster.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
