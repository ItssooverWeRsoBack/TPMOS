"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "tpmos_onboarding_complete";
const TOTAL_STEPS = 4;

export function OnboardingWizard() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [dismissed, setDismissed] = useState(true); // Start hidden, show after check

  // Form state for each step
  const [teamName, setTeamName] = useState("");
  const [teamSlug, setTeamSlug] = useState("");
  const [memberCount, setMemberCount] = useState<number>(5);
  const [overhead, setOverhead] = useState<number>(20);
  const [epicTitle, setEpicTitle] = useState("");
  const [epicDescription, setEpicDescription] = useState("");

  // Track IDs created during the wizard
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);

  // Check if teams exist
  const { data: teams, isLoading: teamsLoading } = useQuery<{ id: string }[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/tpmos/teams");
      if (!res.ok) return [];
      const data = (await res.json()) as { id: string }[] | { teams: { id: string }[] };
      return Array.isArray(data) ? data : (data as { teams: { id: string }[] }).teams ?? [];
    },
  });

  // Determine if we should show the wizard
  useEffect(() => {
    if (teamsLoading) return;

    const alreadyComplete = localStorage.getItem(STORAGE_KEY) === "true";
    if (alreadyComplete) {
      setDismissed(true);
      return;
    }

    // Show when user exists, is not pending, and there are zero teams
    if (user && user.role !== "pending" && teams && teams.length === 0) {
      setDismissed(false);
    }
  }, [user, teams, teamsLoading]);

  // Create team mutation
  const createTeam = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tpmos/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName, slug: teamSlug }),
      });
      if (!res.ok) throw new Error("Failed to create team");
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: (data) => {
      setCreatedTeamId(data.id);
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setStep(2);
    },
  });

  // Update capacity mutation
  const updateCapacity = useMutation({
    mutationFn: async () => {
      if (!createdTeamId) return;
      const res = await fetch(`/api/tpmos/teams/${createdTeamId}/capacity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberCount,
          overheadPercent: overhead,
        }),
      });
      if (!res.ok) throw new Error("Failed to update capacity");
      return res.json();
    },
    onSuccess: () => setStep(3),
  });

  // Create epic mutation
  const createEpic = useMutation({
    mutationFn: async () => {
      if (!createdTeamId) return;
      const res = await fetch("/api/tpmos/epics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: createdTeamId,
          title: epicTitle,
          description: epicDescription || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create epic");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics"] });
      setStep(4);
    },
  });

  function handleComplete() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  function handleSkip() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    setTeamName(name);
    setTeamSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl">
        {/* Step indicator */}
        <div className="border-b border-border px-6 py-4">
          <div className="mb-2 text-sm font-semibold text-foreground">
            Getting Started
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i + 1 <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Create Your First Team
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Teams are the core unit of planning in TPMOS. Each team has
                  its own capacity, epics, and quarterly plan.
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Platform Engineering"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={teamSlug}
                    onChange={(e) => setTeamSlug(e.target.value)}
                    placeholder="platform-eng"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Set Up Capacity
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  How many engineers are on this team and what percentage of
                  time is spent on overhead (meetings, oncall, etc.)?
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Team Members
                  </label>
                  <input
                    type="number"
                    value={memberCount}
                    onChange={(e) => setMemberCount(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Overhead %
                  </label>
                  <input
                    type="number"
                    value={overhead}
                    onChange={(e) => setOverhead(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Typical range: 15-30%
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Create Your First Epic
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  An epic is a significant piece of work that takes 1-13 weeks
                  for one engineer.
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Title
                  </label>
                  <input
                    type="text"
                    value={epicTitle}
                    onChange={(e) => setEpicTitle(e.target.value)}
                    placeholder="e.g., Migrate auth to OAuth 2.0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Description (optional)
                  </label>
                  <textarea
                    value={epicDescription}
                    onChange={(e) => setEpicDescription(e.target.value)}
                    placeholder="What and why"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto size-12 text-green-500" />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  You're Ready!
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your team is set up and your first epic is created. Head to
                  the planner to start organizing your quarter.
                </p>
              </div>
              <Link
                href="/plan"
                onClick={handleComplete}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Go to Planner
              </Link>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <div>
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 4 && (
              <button
                onClick={handleSkip}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Skip
              </button>
            )}
            {step === 1 && (
              <button
                onClick={() => createTeam.mutate()}
                disabled={!teamName || !teamSlug || createTeam.isPending}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createTeam.isPending ? "Creating..." : "Create Team"}
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => updateCapacity.mutate()}
                disabled={updateCapacity.isPending}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {updateCapacity.isPending ? "Saving..." : "Next"}
              </button>
            )}
            {step === 3 && (
              <button
                onClick={() => createEpic.mutate()}
                disabled={!epicTitle || createEpic.isPending}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createEpic.isPending ? "Creating..." : "Create Epic"}
              </button>
            )}
            {step === 4 && (
              <button
                onClick={handleComplete}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
