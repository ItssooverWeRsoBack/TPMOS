"use client";

import { useState } from "react";
import { StatusPill } from "@/components/tpmos/epic/status-control";
import type { EpicStatus } from "@/lib/tpmos/schemas/epic";
import { ArrowRight, Check } from "lucide-react";

interface CarryEpic {
  id: string;
  title: string;
  status: string;
  percentComplete: number;
  driCommittedWeeks: number;
  teamId: string;
}

interface CarryForwardDialogProps {
  epics: CarryEpic[];
  targetQuarterLabel: string;
  onConfirm: (epicIds: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CarryForwardDialog({
  epics,
  targetQuarterLabel,
  onConfirm,
  onCancel,
  isLoading,
}: CarryForwardDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(epics.map((e) => e.id)));

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === epics.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(epics.map((e) => e.id)));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowRight className="size-4" />
        Carry incomplete epics to <span className="font-semibold text-foreground">{targetQuarterLabel}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleAll}
          className="text-xs text-primary underline underline-offset-4"
        >
          {selected.size === epics.length ? "Deselect all" : "Select all"}
        </button>
        <span className="text-xs text-muted-foreground">
          {selected.size} of {epics.length} selected
        </span>
      </div>

      <div className="max-h-64 space-y-1 overflow-y-auto">
        {epics.map((epic) => (
          <label
            key={epic.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted/30"
          >
            <input
              type="checkbox"
              checked={selected.has(epic.id)}
              onChange={() => toggle(epic.id)}
              className="size-4 accent-primary"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm text-foreground">{epic.title}</span>
                <StatusPill status={epic.status as EpicStatus} />
              </div>
              <div className="mt-0.5 flex gap-3 text-[11px] text-muted-foreground">
                <span className="font-mono">{epic.driCommittedWeeks}w</span>
                <span>{epic.percentComplete}% done</span>
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(Array.from(selected))}
          disabled={isLoading || selected.size === 0}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Check className="size-3" />
          {isLoading ? "Carrying..." : `Carry ${selected.size} epic${selected.size !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
