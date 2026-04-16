"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import * as goalsApi from "@/lib/tpmos/api/goals";
import type { CreateGoalInput, GoalStatus } from "@/lib/tpmos/schemas/goal";
import { cn } from "@/lib/utils";
import { Plus, X, Target, AlertTriangle, ChevronRight } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  on_track: { label: "On Track", className: "bg-emerald-500/15 text-emerald-400" },
  at_risk: { label: "At Risk", className: "bg-amber-500/15 text-amber-400" },
  off_track: { label: "Off Track", className: "bg-red-500/15 text-red-400" },
  done: { label: "Done", className: "bg-primary/15 text-primary" },
};

export default function GoalsPage() {
  const { data: user } = useCurrentUser();
  const qc = useQueryClient();
  const { data: goals, isLoading } = useQuery({ queryKey: ["goals"], queryFn: goalsApi.listGoals });
  const { data: gaps } = useQuery({ queryKey: ["goals", "gaps"], queryFn: goalsApi.listGoalGaps });
  const [showForm, setShowForm] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (input: CreateGoalInput) => goalsApi.createGoal(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); setShowForm(false); },
  });

  const canManage = user && (user.role === "admin" || user.role === "tpm");
  const selectedGoal = goals?.find((g) => g.id === selectedGoalId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leadership Goals"
        description="Strategic priorities mapped to team execution."
        action={
          canManage && !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" />
              New Goal
            </button>
          ) : undefined
        }
      />

      {/* Coverage gap alert */}
      {gaps && gaps.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            <strong>{gaps.length} goal{gaps.length !== 1 ? "s" : ""}</strong> with no mapped initiatives — execution gap detected.
          </span>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">New Goal</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <GoalForm
            onSubmit={(input) => createMutation.mutate(input)}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending}
          />
        </div>
      )}

      {/* Goals grid */}
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          {isLoading && [1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />
          ))}

          {goals?.length === 0 && !isLoading && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Target className="mx-auto mb-2 size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No goals defined yet.</p>
            </div>
          )}

          {goals?.map((goal) => {
            const config = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.on_track;
            const isGap = gaps?.some((g) => g.id === goal.id);
            const selected = selectedGoalId === goal.id;

            return (
              <button
                key={goal.id}
                onClick={() => setSelectedGoalId(selected ? null : goal.id)}
                className={cn(
                  "w-full rounded-lg border bg-card p-4 text-left transition-all hover:border-primary/40",
                  selected && "border-primary/60 ring-1 ring-primary/20",
                  isGap && "border-amber-500/30"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{goal.title}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", config.className)}>
                        {config.label}
                      </span>
                      {isGap && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-400">
                          Gap
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{goal.description}</p>
                    )}
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-1 text-[11px] text-muted-foreground shrink-0">
                    <span>{goal.initiativeCount ?? 0} initiatives</span>
                    <span>{goal.epicCount ?? 0} epics</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Goal detail panel */}
        {selectedGoal && (
          <GoalDetailPanel goalId={selectedGoal.id} />
        )}
      </div>
    </div>
  );
}

function GoalDetailPanel({ goalId }: { goalId: string }) {
  const { data: goal, isLoading } = useQuery({
    queryKey: ["goals", goalId],
    queryFn: () => goalsApi.getGoal(goalId),
  });

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-lg border border-border bg-card" />;
  }

  if (!goal) return null;

  const config = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.on_track;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-foreground">{goal.title}</h3>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", config.className)}>
            {config.label}
          </span>
        </div>
        {goal.description && (
          <p className="text-xs text-muted-foreground">{goal.description}</p>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Linked Initiatives ({goal.initiatives?.length ?? 0})
        </h4>
        {goal.initiatives && goal.initiatives.length > 0 ? (
          <div className="space-y-1">
            {goal.initiatives.map((init) => (
              <div key={init.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                <span className="flex-1 text-xs font-medium text-foreground">{init.title}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">
                  {init.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No initiatives linked. Map initiatives in the Initiatives page.
          </div>
        )}
      </div>
    </div>
  );
}

function GoalForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (input: CreateGoalInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, description: description || undefined, status: "on_track" });
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Goal title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Reduce customer onboarding time by 50%"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why this goal matters and how we'll measure success"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">Cancel</button>
        <button type="submit" disabled={isLoading || !title} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {isLoading ? "Creating..." : "Create Goal"}
        </button>
      </div>
    </form>
  );
}
