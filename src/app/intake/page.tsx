"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

// TODO: M10 — Build TPM Intake list
export default function IntakePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="TPM Intake Interviews" description="Manage intake interviews." />
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        TPM intake list will be built in M10.
      </div>
    </div>
  );
}
