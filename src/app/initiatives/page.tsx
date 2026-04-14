"use client";

import { PlaceholderSurface } from "@/components/tpmos/shared/placeholder-surface";

export default function InitiativesPage() {
  return (
    <PlaceholderSurface
      title="Initiative & Product Mapping"
      phase="Phase 2"
      prdSection="phase-2-fr-12-leadership-goals--initiative-mapping"
      plannedFeatures={[
        "Map initiatives to leadership goals (many-to-many)",
        "Associate team epics to initiatives",
        "Detect coverage gaps and duplicate efforts",
        "Cross-team contribution visualization",
      ]}
    />
  );
}
