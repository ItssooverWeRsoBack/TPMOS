"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

// TODO: M10 — Build Theme Clusters
export default function ThemeClustersPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Theme Clusters" description="View clustered themes from interviews." />
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Theme clusters will be built in M10.
      </div>
    </div>
  );
}
