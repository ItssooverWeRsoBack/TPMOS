"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Clock, Target, Users, BarChart3 } from "lucide-react";

interface DashboardData {
  quarterId: string;
  summary: {
    totalEpics: number;
    totalDone: number;
    totalAtRisk: number;
    totalBlocked: number;
    totalWeeks: number;
    overallCompletion: number;
    teamCount: number;
    behindPaceCount: number;
  };
  teams: {
    teamId: string;
    teamName: string;
    teamSlug: string;
    totalEpics: number;
    doneCount: number;
    inProgressCount: number;
    blockedCount: number;
    atRiskCount: number;
    notStartedCount: number;
    totalWeeks: number;
    completion: number;
  }[];
  goals: {
    id: string;
    title: string;
    status: string;
    initiativeCount: number;
    epicCount: number;
    hasGap: boolean;
  }[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(apiUrl("/dashboard"), { credentials: "include" });
  return handleResponse<DashboardData>(res);
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Executive Dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { summary, teams, goals } = data;

  return (
    <div className="space-y-8">
      <PageHeader title="Executive Dashboard" description="Operational intelligence across all teams." />

      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BarChart3} label="Overall Completion" value={`${summary.overallCompletion.toFixed(0)}%`} sublabel={`${summary.totalDone}/${summary.totalEpics} epics done`} />
        <StatCard icon={AlertTriangle} label="At Risk" value={String(summary.totalAtRisk)} sublabel={`${summary.totalBlocked} blocked`} variant={summary.totalAtRisk > 0 ? "warning" : "default"} />
        <StatCard icon={Users} label="Teams" value={String(summary.teamCount)} sublabel={`${summary.behindPaceCount} behind pace`} variant={summary.behindPaceCount > 0 ? "warning" : "default"} />
        <StatCard icon={Target} label="Goals" value={String(goals.length)} sublabel={`${goals.filter((g) => g.hasGap).length} coverage gaps`} variant={goals.some((g) => g.hasGap) ? "warning" : "default"} />
      </div>

      {/* Team progress */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Team Progress</h3>
        <div className="space-y-2">
          {teams.map((team) => (
            <div key={team.teamId} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{team.teamName}</span>
                  {team.atRiskCount > 0 && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                      {team.atRiskCount} at risk
                    </span>
                  )}
                  {team.blockedCount > 0 && (
                    <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                      {team.blockedCount} blocked
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm text-foreground">{team.completion.toFixed(0)}%</span>
              </div>

              {/* Stacked bar */}
              <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                {team.totalEpics > 0 && (
                  <>
                    <div className="bg-emerald-500" style={{ width: `${(team.doneCount / team.totalEpics) * 100}%` }} />
                    <div className="bg-blue-500" style={{ width: `${(team.inProgressCount / team.totalEpics) * 100}%` }} />
                    <div className="bg-red-500" style={{ width: `${(team.blockedCount / team.totalEpics) * 100}%` }} />
                    <div className="bg-amber-500" style={{ width: `${(team.atRiskCount / team.totalEpics) * 100}%` }} />
                  </>
                )}
              </div>

              <div className="mt-1.5 flex gap-4 text-[10px] text-muted-foreground">
                <span>{team.doneCount} done</span>
                <span>{team.inProgressCount} in progress</span>
                <span>{team.notStartedCount} not started</span>
                <span className="font-mono">{team.totalWeeks}w planned</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk concentration */}
      {teams.some((t) => t.atRiskCount > 0 || t.blockedCount > 0) && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Risk Concentration</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {teams
              .filter((t) => t.atRiskCount > 0 || t.blockedCount > 0)
              .sort((a, b) => (b.atRiskCount + b.blockedCount) - (a.atRiskCount + a.blockedCount))
              .map((team) => (
                <div
                  key={team.teamId}
                  className={cn(
                    "rounded-lg border p-3",
                    (team.atRiskCount + team.blockedCount) >= 3
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-amber-500/30 bg-amber-500/5"
                  )}
                >
                  <div className="text-sm font-medium text-foreground">{team.teamName}</div>
                  <div className="mt-1 flex gap-3 text-[11px]">
                    {team.atRiskCount > 0 && <span className="text-amber-400">{team.atRiskCount} at risk</span>}
                    {team.blockedCount > 0 && <span className="text-red-400">{team.blockedCount} blocked</span>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Goal coverage */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Goal Coverage</h3>
        <div className="space-y-1.5">
          {goals.map((goal) => {
            const statusColors: Record<string, string> = {
              on_track: "text-emerald-400",
              at_risk: "text-amber-400",
              off_track: "text-red-400",
              done: "text-primary",
            };
            return (
              <div key={goal.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm text-foreground">{goal.title}</span>
                    {goal.hasGap && (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-400">Gap</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
                  <span>{goal.initiativeCount} init</span>
                  <span>{goal.epicCount} epics</span>
                  <span className={cn("font-semibold uppercase", statusColors[goal.status] ?? "text-muted-foreground")}>
                    {goal.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            );
          })}
          {goals.length === 0 && (
            <p className="text-xs text-muted-foreground">No goals defined yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  variant = "default",
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  sublabel: string;
  variant?: "default" | "warning";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "flex size-8 items-center justify-center rounded-md",
          variant === "warning" ? "bg-amber-500/10" : "bg-muted"
        )}>
          <Icon className={cn("size-4", variant === "warning" ? "text-amber-400" : "text-muted-foreground")} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sublabel}</div>
    </div>
  );
}
