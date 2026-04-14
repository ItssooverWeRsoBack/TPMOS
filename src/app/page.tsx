"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

export default function HomePage() {
  // TODO M3: Replace with role-based redirect (TPM→risks, EM→own team, IC→own team)
  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome to TPMOS"
        description="Technical Program Management Operating System"
      />
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Select a section from the sidebar to get started. Home will show role-specific
          content after M3 ships.
        </p>
      </div>
    </div>
  );
}
