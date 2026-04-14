"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

// TODO M4: Build capacity form and bar
// Team + quarter context comes from ?team=slug&quarter=id query params
export default function CapacityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Capacity Plan"
        description="Declare team capacity: members, vacation, tech debt, and other overhead."
      />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Select a team from the Teams page to view their capacity plan.
      </div>
    </div>
  );
}
