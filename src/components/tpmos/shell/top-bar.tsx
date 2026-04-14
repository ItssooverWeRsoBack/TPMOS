"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useQuarters } from "@/lib/tpmos/hooks/use-quarters";
import { CalendarRange } from "lucide-react";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/teams": "Teams",
  "/plan": "Quarterly Plan",
  "/capacity": "Capacity Plan",
  "/board": "Status Board",
  "/quarters": "Quarters",
  "/risks": "Risks",
  "/intake": "TPM Intake",
  "/intake/themes": "Theme Clusters",
  "/goals": "Leadership Goals",
  "/initiatives": "Initiatives",
  "/dashboard": "Executive Dashboard",
  "/reports": "Reports",
  "/admin/users": "User Management",
  "/admin/seed": "Demo Seed",
  "/login": "Access",
};

export function TopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: quarters } = useQuarters();

  const title = ROUTE_TITLES[pathname] ?? "TPMOS";
  const teamSlug = searchParams.get("team");
  const currentQuarterId = searchParams.get("quarter");

  // Find the active quarter as default
  const activeQuarter = quarters?.find((q) => q.state === "active");
  const selectedQuarter = quarters?.find((q) => q.id === currentQuarterId) ?? activeQuarter;

  function handleQuarterChange(quarterId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("quarter", quarterId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        {teamSlug && (
          <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
            {teamSlug}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {quarters && quarters.length > 0 && (
          <div className="flex items-center gap-1.5">
            <CalendarRange className="size-3.5 text-muted-foreground" />
            <select
              value={selectedQuarter?.id ?? ""}
              onChange={(e) => handleQuarterChange(e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {quarters.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label} {q.state === "active" ? "●" : q.state === "closed" ? "✓" : "◦"}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </header>
  );
}
