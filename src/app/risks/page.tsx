"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

// TODO: M7 — Build Risks Feed
export default function RisksPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Risks" description="View and manage project risks." />
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Risks feed will be built in M7.
      </div>
    </div>
  );
}
