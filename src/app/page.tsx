"use client";

import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import Link from "next/link";
import { Users, CalendarRange, AlertTriangle, ClipboardList, Shield, BarChart3 } from "lucide-react";

const QUICK_LINKS = [
  { label: "Teams", href: "/teams", icon: Users, description: "View and manage teams" },
  { label: "Quarters", href: "/quarters", icon: CalendarRange, description: "Planning quarters" },
  { label: "Risks", href: "/risks", icon: AlertTriangle, description: "Cross-team risk feed" },
  { label: "Intake", href: "/intake", icon: ClipboardList, description: "TPM lead interviews", roles: ["admin", "tpm"] },
  { label: "Admin", href: "/admin/users", icon: Shield, description: "User management", roles: ["admin"] },
] as const;

export default function HomePage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <BarChart3 className="mx-auto mb-2 size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Activity feed and role-specific summaries coming in Phase 2.
        </p>
      </div>
    </div>
  );
}
