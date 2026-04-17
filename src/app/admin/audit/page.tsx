"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import { cn } from "@/lib/utils";
import { History } from "lucide-react";

interface AuditEntry {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

const ENTITY_TYPES = ["all", "epic", "team", "quarter", "capacity", "goal", "initiative", "interview"] as const;

const ACTION_COLORS: Record<string, string> = {
  create: "text-emerald-400",
  update: "text-blue-400",
  delete: "text-red-400",
  lock: "text-amber-400",
  close: "text-muted-foreground",
};

async function fetchAudit(type?: string): Promise<AuditEntry[]> {
  const params = type && type !== "all" ? `?type=${type}` : "";
  const res = await fetch(apiUrl(`/admin/audit${params}`), { credentials: "include" });
  return handleResponse<AuditEntry[]>(res);
}

export default function AuditPage() {
  const [filter, setFilter] = useState("all");
  const { data: entries, isLoading } = useQuery({
    queryKey: ["audit", filter],
    queryFn: () => fetchAudit(filter),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" description="History of all changes across the organization." />

      {/* Filter tabs */}
      <div className="flex gap-1">
        {ENTITY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
              filter === type
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded border border-border bg-card" />
          ))}
        </div>
      )}

      {entries?.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <History className="mx-auto mb-2 size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No audit entries yet.</p>
        </div>
      )}

      {entries && entries.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-3 py-2 font-medium text-muted-foreground">When</th>
                <th className="px-3 py-2 font-medium text-muted-foreground">Who</th>
                <th className="px-3 py-2 font-medium text-muted-foreground">Action</th>
                <th className="px-3 py-2 font-medium text-muted-foreground">Entity</th>
                <th className="px-3 py-2 font-medium text-muted-foreground">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {entry.userName ?? entry.userEmail?.split("@")[0] ?? entry.userId}
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn("font-semibold uppercase", ACTION_COLORS[entry.action] ?? "text-foreground")}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground capitalize">{entry.entityType}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground/60 truncate max-w-[120px]">
                    {entry.entityId}
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
