"use client";

import { PlaceholderSurface } from "@/components/tpmos/shared/placeholder-surface";

export default function DashboardPage() {
  return (
    <PlaceholderSurface
      title="Executive Dashboard"
      phase="Phase 2"
      prdSection="phase-2-fr-13-executive-visualizer"
      plannedFeatures={[
        "Multi-team progress dashboard",
        "Risk concentration heatmap by team",
        "Goal coverage rollup visualization",
        "Consensus and variance visuals across epics",
        "AI-generated risk narrative (B5)",
      ]}
    />
  );
}
