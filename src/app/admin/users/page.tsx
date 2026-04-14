"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";

// TODO: M3 — Build Admin User Management
export default function UserManagementPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="User Management" description="Manage users, roles, and permissions." />
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        User management will be built in M3.
      </div>
    </div>
  );
}
