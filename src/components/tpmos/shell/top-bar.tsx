"use client";

import { usePathname } from "next/navigation";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/teams": "Teams",
  "/quarters": "Quarters",
  "/risks": "Risks",
  "/intake": "TPM Intake",
  "/intake/themes": "Theme Clusters",
  "/goals": "Leadership Goals",
  "/initiatives": "Initiatives",
  "/dashboard": "Executive Dashboard",
  "/reports": "Reports",
  "/admin/users": "User Management",
  "/login": "Access",
};

function getTitle(pathname: string): string {
  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  // Check team routes
  if (pathname.startsWith("/teams/")) {
    if (pathname.endsWith("/plan")) return "Quarterly Plan";
    if (pathname.endsWith("/capacity")) return "Capacity";
    if (pathname.endsWith("/board")) return "Status Board";
    return "Team Detail";
  }
  if (pathname.startsWith("/intake/")) return "Interview Detail";
  return "TPMOS";
}

export function TopBar() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        {/* Quarter switcher placeholder — wired in M3 */}
        <div className="rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          Q2 2026
        </div>
      </div>
    </header>
  );
}
