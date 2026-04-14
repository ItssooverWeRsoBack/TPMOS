"use client";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/tpmos/schemas/user";

const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-red-500/15 text-red-400 border-red-500/25" },
  tpm: { label: "TPM", className: "bg-primary/15 text-primary border-primary/25" },
  em: { label: "EM", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  ic: { label: "IC", className: "bg-sky-500/15 text-sky-400 border-sky-500/25" },
  exec: { label: "Exec", className: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground border-border" },
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const config = ROLE_CONFIG[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
