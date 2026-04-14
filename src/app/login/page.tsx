"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

// TODO: M1.8 — Build full "Request Access" flow
export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Request Access" />
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Your account is pending approval. Contact an admin.
      </div>
    </div>
  );
}
