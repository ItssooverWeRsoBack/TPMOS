"use client";

import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { StatusPill } from "@/components/tpmos/epic/status-control";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import Link from "next/link";
import type { EpicStatus } from "@/lib/tpmos/schemas/epic";
import {
  Users, CalendarRange, AlertTriangle, ClipboardList, Shield,
  BarChart3, Target, Network, FileText, Activity,
} from "lucide-react";

const QUICK_LINKS = [
  { label: "Teams", href: "/teams", icon: Users, description: "View and manage teams" },
  { label: "Plan", href: "/plan", icon: CalendarRange, description: "Quarterly planning" },
  { label: "Dashboard", href: "/dashboard", icon: BarChart3, description: "Executive overview" },
  { label: "Risks", href: "/risks", icon: AlertTriangle, description: "Cross-team risk feed" },
  { label: "Goals", href: "/goals", icon: Target, description: "Leadership priorities" },
  { label: "Intake", href: "/intake", icon: ClipboardList, description: "TPM lead interviews", roles: ["admin", "tpm"] },
  { label: "Reports", href: "/reports", icon: FileText, description: "Weekly snapshots", roles: ["admin", "tpm"] },
  { label: "Admin", href: "/admin/users", icon: Shield, description: "User management", roles: ["admin"] },
] as const;

interface RiskEpic {
  id: string;
  title: string;
  status: string;
  atRisk: boolean;
  teamName?: string;
  updatedAt: string;
}

async function fetchRisks(): Promise<RiskEpic[]> {
  const res = await fetch(apiUrl("/risks"), { credentials: "include" });
  return handleResponse<RiskEpic[]>(res);
}

export default function HomePage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: risks } = useQuery({ queryKey: ["risks-home"], queryFn: fetchRisks });

  if (userLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const greeting = user
    ? `Welcome, ${user.displayName ?? user.email.split("@")[0]}`
    : "Welcome to TPMOS";

  const visible = QUICK_LINKS.filter((link) => {
    if (!("roles" in link) || !link.roles) return true;
    return user && (link.roles as readonly string[]).includes(user.role);
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={greeting}
        description="Technical Program Management Operating System"
      />

      {/* Quick links grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted group-hover:bg-primary/10">
                  <Icon className="size-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{link.label}</div>
                  <div className="text-xs text-muted-foreground">{link.description}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Active risks feed */}
      {risks && risks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-amber-400" />
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Active Risks ({risks.length})
            </h3>
          </div>
          <div className="space-y-1">
            {risks.slice(0, 5).map((epic) => (
              <div key={epic.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
                <AlertTriangle className="size-3.5 shrink-0 text-amber-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm text-foreground">{epic.title}</span>
                    <StatusPill status={epic.status as EpicStatus} />
                  </div>
                  {epic.teamName && (
                    <span className="text-[11px] text-muted-foreground">{epic.teamName}</span>
                  )}
                </div>
              </div>
            ))}
            {risks.length > 5 && (
              <Link href="/risks" className="block text-center text-xs text-primary underline underline-offset-4">
                View all {risks.length} risks
              </Link>
            )}
          </div>
        </div>
      )}

      {(!risks || risks.length === 0) && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <AlertTriangle className="mx-auto mb-2 size-6 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground">No active risks. Looking good.</p>
        </div>
      )}
    </div>
  );
}
