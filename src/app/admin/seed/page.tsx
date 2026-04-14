"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

// TODO: M11 — Build Demo Seed (dev only)
export default function DemoSeedPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Demo Seed" description="Seed database with demo data (dev only)." />
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Demo seed will be built in M11.
      </div>
    </div>
  );
}
