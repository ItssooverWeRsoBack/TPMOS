"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlanningContext } from "@/lib/tpmos/hooks/use-planning-context";
export function TeamPlanningNavigation({ teamSlug, quarterId = null, navigateOnChange = false }: { teamSlug: string; quarterId?: string | null; navigateOnChange?: boolean }) {
  const router = useRouter(); const [choice, setChoice] = useState<string | null>(null);
  const context = usePlanningContext(teamSlug, quarterId ?? choice);
  const { effectiveQuarterId, currentQuarter } = context;
  const otherCapacity = context.quarters.filter(q => q.hasCapacity && q.id !== effectiveQuarterId);
  function select(value: string) {
    if (!navigateOnChange) { setChoice(value); return; }
    const url = new URL(window.location.href); url.searchParams.set("team", teamSlug); url.searchParams.set("quarter", value);
    router.replace(`${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  }
  return <div className="space-y-3 rounded-lg border border-border bg-card p-3">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <label className="min-w-48 space-y-1 text-xs">Planning quarter<select value={effectiveQuarterId ?? ""} onChange={e => select(e.target.value)} disabled={context.isLoading} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
        <option value="" disabled>Choose a quarter</option>{context.quarters.map(q => <option key={q.id} value={q.id}>{q.label} · {q.state}{q.hasWebhook ? " · GitHub connected" : ""}{q.hasCapacity ? " · capacity saved" : ""} · {q.epicCount} epics</option>)}
      </select></label>
      {effectiveQuarterId && <nav aria-label="Team planning views" className="flex gap-2">{[["plan", "Plan"], ["board", "Board"], ["capacity", "Capacity"]].map(([path,label]) => <Link key={path} href={`/${path}/?${new URLSearchParams({ team: teamSlug, quarter: effectiveQuarterId })}`} className="rounded-md border px-3 py-2 text-xs">{label}</Link>)}</nav>}
    </div>
    {context.error && <p role="alert" className="text-sm text-red-400">{context.error instanceof Error ? context.error.message : "Failed to load planning context"}</p>}
    {!context.isLoading && quarterId && !effectiveQuarterId && <p role="alert" className="text-sm text-muted-foreground">That quarter is unavailable. Select a quarter above.</p>}
    {currentQuarter?.hasWebhook && <p className="text-xs text-muted-foreground">GitHub issues for this team arrive in {currentQuarter.label}. Refresh the plan or board after an issue changes.</p>}
    {currentQuarter && !currentQuarter.hasCapacity && otherCapacity.length > 0 && <p className="text-xs text-muted-foreground">Capacity is saved in {otherCapacity.map(q => q.label).join(", ")}. Each quarter has its own capacity plan; select that quarter to review it.</p>}
  </div>;
}
