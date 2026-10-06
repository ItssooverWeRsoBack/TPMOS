import type { PlanningQuarter } from "../schemas/planning-context";
/** Preserve an explicit selection; otherwise prefer a sole open webhook target. */
export function resolvePlanningQuarter(quarters: PlanningQuarter[], requested: string | null): string | null {
  if (requested !== null) return quarters.some(q => q.id === requested) ? requested : null;
  const targets = quarters.filter(q => q.hasWebhook && q.state !== "closed");
  if (targets.length === 1) return targets[0].id;
  return quarters.find(q => q.state === "active")?.id
    ?? quarters.find(q => q.state === "planning")?.id
    ?? quarters[0]?.id ?? null;
}
