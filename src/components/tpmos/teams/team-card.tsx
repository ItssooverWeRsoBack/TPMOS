"use client";

import { cn } from "@/lib/utils";
import { Users, Archive } from "lucide-react";
import type { Team } from "@/lib/tpmos/schemas/team";

interface TeamCardProps {
  team: Team;
  memberCount?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TeamCard({ team, memberCount, isSelected, onClick }: TeamCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm",
        isSelected && "border-primary/60 ring-1 ring-primary/20",
        team.archived && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{team.name}</h3>
            {team.archived && (
              <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <Archive className="size-3" />
                Archived
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{team.slug}</p>
        </div>
        {memberCount !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            {memberCount}
          </div>
        )}
      </div>
      {team.charter && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/80">
          {team.charter}
        </p>
      )}
    </button>
  );
}
