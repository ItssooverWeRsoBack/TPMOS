"use client";

import { cn } from "@/lib/utils";
import type { EpicStatus } from "@/lib/tpmos/schemas/epic";

const STATUS_OPTIONS: { value: EpicStatus; label: string; color: string }[] = [
  { value: "not_started", label: "Not Started", color: "bg-[var(--status-not-started)]" },
  { value: "in_progress", label: "In Progress", color: "bg-[var(--status-in-progress)]" },
  { value: "blocked", label: "Blocked", color: "bg-[var(--status-blocked)]" },
  { value: "at_risk", label: "At Risk", color: "bg-[var(--status-at-risk)]" },
  { value: "done", label: "Done", color: "bg-[var(--status-done)]" },
  { value: "cancelled", label: "Cancelled", color: "bg-muted-foreground/30" },
];

interface StatusPillProps {
  status: EpicStatus;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", className)}>
      <span className={cn("size-1.5 rounded-full", opt.color)} />
      {opt.label}
    </span>
  );
}

interface StatusSelectProps {
  value: EpicStatus;
  onChange: (status: EpicStatus) => void;
  className?: string;
}

export function StatusSelect({ value, onChange, className }: StatusSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EpicStatus)}
      className={cn(
        "rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none",
        className
      )}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
