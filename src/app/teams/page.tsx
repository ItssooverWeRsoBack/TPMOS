"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

// TODO: M3 — Build Teams Directory
export default function TeamsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Teams" description="Manage teams and their members." />
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Teams directory will be built in M3.
      </div>
    </div>
  );
}
