"use client";

import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/tpmos/epic/status-control";
import { WsjfBadge } from "./wsjf-badge";
import { GripVertical, Vote, AlertTriangle } from "lucide-react";
import type { EpicStatus } from "@/lib/tpmos/schemas/epic";
import type { WsjfResult } from "@/lib/tpmos/domain/wsjf";
import { forwardRef } from "react";

interface EpicCardProps {
  id: string;
  title: string;
  weeks: number;
  status: EpicStatus;
  wsjfScore: number | null;
  voteCount: number;
  atRisk: boolean;
  carried: boolean;
  belowLine: boolean;
  cumulativeWeeks: number;
  dragHandleProps?: Record<string, unknown>;
  onVoteClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export const EpicCard = forwardRef<HTMLDivElement, EpicCardProps>(
  function EpicCard(
    {
      title,
      weeks,
      status,
      wsjfScore,
      voteCount,
      atRisk,
      carried,
      belowLine,
      cumulativeWeeks,
      dragHandleProps,
      onVoteClick,
      style,
      className,
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 transition-all",
          belowLine
            ? "border-border/50 opacity-60"
            : "border-border hover:border-primary/30",
          className
        )}
      >
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("truncate text-sm font-medium", belowLine ? "text-muted-foreground" : "text-foreground")}>
              {title}
            </span>
            <StatusPill status={status} />
            {carried && (
              <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[9px] font-semibold uppercase text-amber-400">
                Carried
              </span>
            )}
            {atRisk && (
              <AlertTriangle className="size-3 text-amber-400" />
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] text-muted-foreground">
            {weeks}w
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/50">
            Σ{cumulativeWeeks.toFixed(1)}
          </span>
          <WsjfBadge score={wsjfScore} />
          {onVoteClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onVoteClick(); }}
              className="rounded border border-border p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Vote className="size-3" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
