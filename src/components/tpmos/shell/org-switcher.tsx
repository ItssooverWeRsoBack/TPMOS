"use client";

import { useQuery } from "@tanstack/react-query";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import { Building2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Org {
  id: string;
  name: string;
}

async function fetchOrgs(): Promise<Org[]> {
  const res = await fetch(apiUrl("/orgs"), { credentials: "include" });
  return handleResponse<Org[]>(res);
}

export function OrgSwitcher() {
  const { data: orgs } = useQuery({ queryKey: ["orgs"], queryFn: fetchOrgs });
  const [open, setOpen] = useState(false);

  // For MVP multi-org, the current org is stored in localStorage
  const currentOrgId = typeof window !== "undefined" ? localStorage.getItem("tpmos_org") ?? "default" : "default";
  const currentOrg = orgs?.find((o) => o.id === currentOrgId) ?? orgs?.[0];

  if (!orgs || orgs.length <= 1) {
    // Single org — show name but no switcher
    return (
      <div className="flex items-center gap-2 px-1">
        <Building2 className="size-3.5 text-muted-foreground/50" />
        <span className="text-[11px] text-muted-foreground truncate">
          {currentOrg?.name ?? "Default"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Building2 className="size-3.5" />
        <span className="flex-1 truncate text-left">{currentOrg?.name ?? "Select org"}</span>
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-card py-1 shadow-lg">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                localStorage.setItem("tpmos_org", org.id);
                setOpen(false);
                window.location.reload(); // Simple reload to apply new org context
              }}
              className={cn(
                "w-full px-3 py-1.5 text-left text-[11px] hover:bg-muted",
                org.id === currentOrgId ? "text-primary font-semibold" : "text-foreground"
              )}
            >
              {org.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
