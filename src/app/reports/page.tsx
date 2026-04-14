"use client";

import { PlaceholderSurface } from "@/components/tpmos/shared/placeholder-surface";

export default function ReportsPage() {
  return (
    <PlaceholderSurface
      title="Reports & Export"
      phase="Phase 2"
      prdSection="phase-2-fr-14-reporting--export"
      plannedFeatures={[
        "Weekly markdown report generator",
        "Completion deltas vs prior week",
        "AI-narrated executive summary (B3)",
        "Export as markdown or copy as image",
      ]}
    />
  );
}
