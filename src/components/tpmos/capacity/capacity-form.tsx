"use client";

import { useState, useEffect } from "react";
import { computeAvailableWeeks, memberCountToWeeks } from "@/lib/tpmos/domain/capacity";
import { CapacityBar } from "./capacity-bar";
import type { UpsertCapacityInput } from "@/lib/tpmos/schemas/capacity";

interface CapacityFormProps {
  initial?: {
    totalMemberWeeks: number;
    vacationWeeks: number;
    techDebtWeeks: number;
    otherOverheadWeeks: number;
    notes?: string | null;
  };
  onSubmit: (input: UpsertCapacityInput) => void;
  isLoading?: boolean;
}

export function CapacityForm({ initial, onSubmit, isLoading }: CapacityFormProps) {
  const [memberCount, setMemberCount] = useState(
    initial ? Math.round(initial.totalMemberWeeks / 13) : 4
  );
  const [vacationWeeks, setVacationWeeks] = useState(initial?.vacationWeeks ?? 0);
  const [techDebtWeeks, setTechDebtWeeks] = useState(initial?.techDebtWeeks ?? 0);
  const [otherOverhead, setOtherOverhead] = useState(initial?.otherOverheadWeeks ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const totalMemberWeeks = memberCountToWeeks(memberCount);
  const result = computeAvailableWeeks({
    totalMemberWeeks,
    vacationWeeks,
    techDebtWeeks,
    otherOverheadWeeks: otherOverhead,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      totalMemberWeeks,
      vacationWeeks,
      techDebtWeeks,
      otherOverheadWeeks: otherOverhead,
      notes: notes || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Summary bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Available Capacity
        </div>
        <div className="mb-2 text-3xl font-bold font-mono text-foreground">
          {result.availableWeeks.toFixed(1)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">weeks</span>
        </div>
        <CapacityBar
          committedWeeks={0}
          availableWeeks={result.availableWeeks}
          showLabel={false}
        />
        <div className="mt-2 flex gap-4 text-[11px] text-muted-foreground">
          <span>Total: {result.totalMemberWeeks}w</span>
          <span>Overhead: {result.totalOverheadWeeks}w ({result.overheadPercent.toFixed(0)}%)</span>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Team members"
          value={memberCount}
          onChange={setMemberCount}
          min={0}
          max={50}
          suffix="people"
          helpText={`× 13 weeks = ${totalMemberWeeks} member-weeks`}
        />
        <NumberField
          label="Vacation"
          value={vacationWeeks}
          onChange={setVacationWeeks}
          min={0}
          step={0.5}
          suffix="weeks"
          helpText="Team-wide vacation + holidays"
        />
        <NumberField
          label="Tech debt"
          value={techDebtWeeks}
          onChange={setTechDebtWeeks}
          min={0}
          step={0.5}
          suffix="weeks"
          helpText="Planned maintenance, upgrades, migrations"
        />
        <NumberField
          label="Other overhead"
          value={otherOverhead}
          onChange={setOtherOverhead}
          min={0}
          step={0.5}
          suffix="weeks"
          helpText="On-call, interviews, training, etc."
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Assumptions, known absences, etc."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? "Saving..." : "Save Capacity Plan"}
      </button>
    </form>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
  helpText,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  helpText?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {suffix && (
          <span className="text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
      {helpText && (
        <p className="text-[11px] text-muted-foreground/70">{helpText}</p>
      )}
    </div>
  );
}
