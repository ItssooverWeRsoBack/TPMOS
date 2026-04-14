"use client";

import { RoleBadge } from "@/components/tpmos/shell/role-badge";
import { UserMinus } from "lucide-react";
import type { UserRole } from "@/lib/tpmos/schemas/user";

interface Member {
  userId: string;
  teamRole: string;
  email?: string;
  displayName?: string | null;
  role?: string;
}

interface MemberListProps {
  members: Member[];
  canRemove?: boolean;
  onRemove?: (userId: string) => void;
}

export function MemberList({ members, canRemove, onRemove }: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No members yet. Add team members to get started.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {members.map((member) => (
        <div
          key={member.userId}
          className="flex items-center gap-3 px-4 py-2.5"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
            {(member.displayName ?? member.email ?? "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {member.displayName ?? member.email?.split("@")[0] ?? member.userId}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                {member.teamRole}
              </span>
              {member.role && (
                <RoleBadge role={member.role as UserRole} />
              )}
            </div>
            {member.email && (
              <p className="truncate text-[11px] text-muted-foreground">{member.email}</p>
            )}
          </div>
          {canRemove && onRemove && (
            <button
              onClick={() => onRemove(member.userId)}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Remove member"
            >
              <UserMinus className="size-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
