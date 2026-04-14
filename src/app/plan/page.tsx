"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

// TODO M5/M6: Build planner board with drag-and-drop, above/below the line
// Team + quarter context comes from ?team=slug&quarter=id query params
export default function PlanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quarterly Plan"
        description="Drag-and-drop epic prioritization with above/below the line capacity modeling."
      />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Select a team from the Teams page to view their quarterly plan.
      </div>
    </div>
  );
}
