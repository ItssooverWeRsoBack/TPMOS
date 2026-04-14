"use client";

import { useState } from "react";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { RoleBadge } from "@/components/tpmos/shell/role-badge";
import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import type { User, UserRole } from "@/lib/tpmos/schemas/user";
import { Shield } from "lucide-react";

const ROLES: UserRole[] = ["admin", "tpm", "em", "ic", "exec", "pending"];

async function fetchUsers(): Promise<User[]> {
  const res = await fetch(apiUrl("/admin/users"), { credentials: "include" });
  return handleResponse<User[]>(res);
}

async function updateRole(userId: string, role: string): Promise<User> {
  const res = await fetch(apiUrl("/admin/users"), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role }),
  });
  return handleResponse<User>(res);
}

export default function UserManagementPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: users, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers, enabled: currentUser?.role === "admin" });
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Manage users and roles." />

      {isLoading && (
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded border border-border bg-card" />
          ))}
        </div>
      )}

      {users && (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">User</th>
                <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-foreground font-medium">
                    {u.displayName ?? u.email.split("@")[0]}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                    {u.email}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={u.role}
                      onChange={(e) => mutation.mutate({ userId: u.id, role: e.target.value })}
                      disabled={u.id === currentUser?.id}
                      className="rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r.toUpperCase()}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-muted-foreground">
                    {u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
