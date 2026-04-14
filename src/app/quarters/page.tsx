"use client";

import { PageHeader } from "@/components/tpmos/shared/page-header";
import { useQuarters } from "@/lib/tpmos/hooks/use-quarters";
import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import { CalendarRange, Lock, Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STATE_CONFIG = {
  planning: { icon: Clock, label: "Planning", className: "text-amber-400 bg-amber-400/10" },
  active: { icon: Play, label: "Active", className: "text-emerald-400 bg-emerald-400/10" },
  closed: { icon: Lock, label: "Closed", className: "text-muted-foreground bg-muted" },
} as const;

export default function QuartersPage() {
  const { data: user } = useCurrentUser();
  const { data: quarters, isLoading } = useQuarters();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quarters"
        description="View and manage planning quarters."
      />

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      )}

      {quarters?.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <CalendarRange className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No quarters configured yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Quarters are auto-created from seed data or by a TPM/Admin.</p>
        </div>
      )}

      <div className="space-y-2">
        {quarters?.map((q) => {
          const config = STATE_CONFIG[q.state as keyof typeof STATE_CONFIG] ?? STATE_CONFIG.planning;
          const Icon = config.icon;

          return (
            <div
              key={q.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", config.className)}>
                <Icon className="size-3" />
                {config.label}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{q.label}</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {q.startDate} — {q.endDate}
                </div>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground/60">
                {q.id}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
