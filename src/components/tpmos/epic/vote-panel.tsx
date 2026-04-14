"use client";

import { useState } from "react";

interface VotePanelProps {
  onSubmit: (vote: { value: number; timeCriticality: number; riskReduction: number; durationEstimateWeeks?: number }) => void;
  isLoading?: boolean;
  existingVote?: { value: number; timeCriticality: number; riskReduction: number; durationEstimateWeeks?: number | null };
}

export function VotePanel({ onSubmit, isLoading, existingVote }: VotePanelProps) {
  const [value, setValue] = useState(existingVote?.value ?? 5);
  const [criticality, setCriticality] = useState(existingVote?.timeCriticality ?? 5);
  const [risk, setRisk] = useState(existingVote?.riskReduction ?? 5);
  const [duration, setDuration] = useState<number | "">(existingVote?.durationEstimateWeeks ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      value,
      timeCriticality: criticality,
      riskReduction: risk,
      ...(duration !== "" && { durationEstimateWeeks: duration }),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <VoteSlider label="User Value" value={value} onChange={setValue} description="Impact on users and business" />
      <VoteSlider label="Time Criticality" value={criticality} onChange={setCriticality} description="Cost of delay" />
      <VoteSlider label="Risk Reduction" value={risk} onChange={setRisk} description="Risk reduced or opportunity enabled" />

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Duration estimate (optional)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))}
            min={0}
            step={0.5}
            placeholder="—"
            className="w-20 rounded-md border border-input bg-background px-2 py-1.5 text-sm font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">weeks (single person)</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? "Submitting..." : existingVote ? "Update Vote" : "Cast Vote"}
      </button>
    </form>
  );
}

function VoteSlider({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  description: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-sm font-mono font-bold text-primary">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>1 Low</span>
        <span className="text-muted-foreground/50">{description}</span>
        <span>10 High</span>
      </div>
    </div>
  );
}
