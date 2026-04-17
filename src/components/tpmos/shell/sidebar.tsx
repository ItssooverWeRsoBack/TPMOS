"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import { RoleBadge } from "./role-badge";
import { OrgSwitcher } from "./org-switcher";
import type { UserRole } from "@/lib/tpmos/schemas/user";
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  Columns3,
  ListChecks,
  AlertTriangle,
  ClipboardList,
  Target,
  Network,
  BarChart3,
  FileText,
  Shield,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles that can see this item. undefined = all authenticated. */
  visibleTo?: UserRole[];
  /** Badge shown next to label */
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Teams", href: "/teams", icon: Users },
  { label: "Plan", href: "/plan", icon: Columns3 },
  { label: "Capacity", href: "/capacity", icon: ListChecks },
  { label: "Board", href: "/board", icon: Columns3 },
  { label: "Quarters", href: "/quarters", icon: CalendarRange },
  { label: "Risks", href: "/risks", icon: AlertTriangle },
  { label: "Intake", href: "/intake", icon: ClipboardList, visibleTo: ["admin", "tpm"] },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Initiatives", href: "/initiatives", icon: Network },
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileText, visibleTo: ["admin", "tpm"] },
  // Admin section
  { label: "Admin", href: "/admin/users", icon: Shield, visibleTo: ["admin"] },
  { label: "Audit Log", href: "/admin/audit", icon: Shield, visibleTo: ["admin", "tpm"] },
  { label: "Integrations", href: "/admin/connectors", icon: Shield, visibleTo: ["admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.visibleTo) return true;
    if (!user) return false;
    return item.visibleTo.includes(user.role);
  });

  return (
    <aside className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo / brand */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary">
          <span className="text-xs font-bold text-primary-foreground">T</span>
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">TPMOS</span>
      </div>

      {/* Org switcher */}
      <div className="border-b border-sidebar-border px-3 py-2">
        <OrgSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* External link back to concept site */}
      <div className="border-t border-sidebar-border px-2 py-2">
        <a
          href="https://torfinn.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-sidebar-foreground/50 hover:text-sidebar-foreground/70"
        >
          <ExternalLink className="size-3.5" />
          torfinn.xyz
        </a>
      </div>

      {/* User footer */}
      {user && (
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
              {(user.displayName ?? user.email)[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-[12px] font-medium text-sidebar-foreground">
                {user.displayName ?? user.email.split("@")[0]}
              </div>
              <RoleBadge role={user.role} className="mt-0.5" />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
