"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard, Users, CalendarRange, AlertTriangle, ClipboardList,
  Target, Network, BarChart3, FileText, Shield, Columns3, ListChecks,
  Search, History,
} from "lucide-react";

const ROUTES = [
  { label: "Home", href: "/", icon: LayoutDashboard, keywords: "home dashboard welcome" },
  { label: "Teams", href: "/teams", icon: Users, keywords: "teams directory members" },
  { label: "Quarterly Plan", href: "/plan", icon: Columns3, keywords: "plan epics planner drag" },
  { label: "Capacity", href: "/capacity", icon: ListChecks, keywords: "capacity weeks members overhead" },
  { label: "Status Board", href: "/board", icon: Columns3, keywords: "board status progress kanban" },
  { label: "Quarters", href: "/quarters", icon: CalendarRange, keywords: "quarters q1 q2 q3 q4" },
  { label: "Risks", href: "/risks", icon: AlertTriangle, keywords: "risks blocked at-risk" },
  { label: "Goals", href: "/goals", icon: Target, keywords: "goals okr strategy leadership" },
  { label: "Initiatives", href: "/initiatives", icon: Network, keywords: "initiatives products programs mapping" },
  { label: "Dashboard", href: "/dashboard", icon: BarChart3, keywords: "dashboard executive overview charts" },
  { label: "Reports", href: "/reports", icon: FileText, keywords: "reports export snapshot weekly" },
  { label: "TPM Intake", href: "/intake", icon: ClipboardList, keywords: "intake interviews leads themes" },
  { label: "Theme Clusters", href: "/intake/themes", icon: ClipboardList, keywords: "themes clusters patterns" },
  { label: "Admin Users", href: "/admin/users", icon: Shield, keywords: "admin users roles permissions" },
  { label: "Audit Log", href: "/admin/audit", icon: History, keywords: "audit log history changes" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command dialog */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        <Command className="flex flex-col" loop>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="size-4 text-muted-foreground" />
            <Command.Input
              placeholder="Search pages..."
              className="flex-1 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Pages" className="px-1 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {ROUTES.map((route) => {
                const Icon = route.icon;
                return (
                  <Command.Item
                    key={route.href}
                    value={`${route.label} ${route.keywords}`}
                    onSelect={() => {
                      router.push(route.href);
                      setOpen(false);
                    }}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {route.label}
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>

          <div className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
            <span className="mr-3">↑↓ Navigate</span>
            <span className="mr-3">↵ Open</span>
            <span>ESC Close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
