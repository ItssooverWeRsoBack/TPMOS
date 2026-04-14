"use client";

import { cn } from "@/lib/utils";
import type { WsjfResult } from "@/lib/tpmos/domain/wsjf";

interface ConsensusHeatmapProps {
  /** Array of { epicTitle, wsjf } for each epic */
  epics: { id: string; title: string; wsjf: WsjfResult }[];
  className?: string;
}

const DIMENSIONS = [
  { key: "value" as const, label: "Value" },
  { key: "criticality" as const, label: "Criticality" },
  { key: "risk" as const, label: "Risk Reduction" },
];

/**
 * Heatmap showing per-epic, per-dimension variance.
 * Low variance (consensus) = green, high variance (disagreement) = red.
 */
export function ConsensusHeatmap({ epics, className }: ConsensusHeatmapProps) {
  if (epics.length === 0) return null;

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Epic</th>
            {DIMENSIONS.map((d) => (
              <th key={d.key} className="px-3 py-2 text-center font-medium text-muted-foreground">
                {d.label}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-medium text-muted-foreground">Votes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {epics.map((epic) => (
            <tr key={epic.id} className="hover:bg-muted/20">
              <td className="max-w-[200px] truncate px-3 py-2 text-foreground">
                {epic.title}
              </td>
              {DIMENSIONS.map((d) => {
                const variance = epic.wsjf.perDimensionVariance[d.key];
                const avg = epic.wsjf.perDimensionAvg[d.key];
                return (
                  <td key={d.key} className="px-3 py-2 text-center">
                    <VarianceCell variance={variance} avg={avg} />
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center font-mono text-muted-foreground">
                {epic.wsjf.voteCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VarianceCell({ variance, avg }: { variance: number | null; avg: number | null }) {
  if (avg === null) {
    return <span className="text-muted-foreground/40">—</span>;
  }

  // No variance data (single voter)
  if (variance === null) {
    return (
      <span className="font-mono text-foreground">
        {avg.toFixed(1)}
      </span>
    );
  }

  // Color by variance: 0-2 = green (consensus), 2-6 = yellow, 6+ = red (disagreement)
  const bg = variance <= 2
    ? "bg-emerald-500/20 text-emerald-300"
    : variance <= 6
    ? "bg-amber-500/20 text-amber-300"
    : "bg-red-500/20 text-red-300";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono", bg)}>
      {avg.toFixed(1)}
      <span className="text-[9px] opacity-60">σ²{variance.toFixed(1)}</span>
    </span>
  );
}
