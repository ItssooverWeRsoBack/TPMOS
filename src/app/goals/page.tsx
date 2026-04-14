"use client";

import { PlaceholderSurface } from "@/components/tpmos/shared/placeholder-surface";

export default function GoalsPage() {
  return (
    <PlaceholderSurface
      title="Leadership Goals"
      phase="Phase 2"
      prdSection="phase-2-fr-12-leadership-goals--initiative-mapping"
      plannedFeatures={[
        "Create and manage leadership OKRs and big rocks",
        "Map goals to initiatives and products",
        "Track progress rollups from team-level epics",
        "Gap detector for unmapped goals",
        "AI-suggested goal-to-epic mapping (B4)",
      ]}
    />
  );
}
