"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import { RoleBadge } from "./role-badge";
import type { UserRole } from "@/lib/tpmos/schemas/user";
import {
  Menu,
  X,
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  visibleTo?: UserRole[];
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
  { label: "Admin", href: "/admin/users", icon: Shield, visibleTo: ["admin"] },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: user } = useCurrentUser();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.visibleTo) return true;
    if (!user) return false;
    return item.visibleTo.includes(user.role);
  });

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, handleKeyDown]);

  // Close on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Full-screen overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop — close on click */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu panel */}
          <div className="relative flex h-full w-72 max-w-[80vw] flex-col bg-background shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary">
                  <span className="text-xs font-bold text-primary-foreground">
                    T
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  TPMOS
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close navigation menu"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Nav items */}
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
                          "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/70 hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User footer */}
            {user && (
              <div className="border-t border-border px-3 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                    {(user.displayName ?? user.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-[12px] font-medium text-foreground">
                      {user.displayName ?? user.email.split("@")[0]}
                    </div>
                    <RoleBadge role={user.role} className="mt-0.5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
