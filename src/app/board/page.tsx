"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

// TODO M7: Build status board with kanban-ish view by status
// Team + quarter context comes from ?team=slug&quarter=id query params
export default function BoardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Status Board"
        description="Track epic status, completion, and risks."
      />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Select a team from the Teams page to view their status board.
      </div>
    </div>
  );
}
