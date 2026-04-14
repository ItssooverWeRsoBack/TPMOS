"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

// TODO: M3 — Build Quarter Management
export default function QuartersPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Quarters" description="Manage planning quarters." />
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Quarter management will be built in M3.
      </div>
    </div>
  );
}
