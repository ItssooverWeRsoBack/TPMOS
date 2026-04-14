"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { InterviewForm } from "@/components/tpmos/intake/interview-form";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import type { Interview, CreateInterviewInput } from "@/lib/tpmos/schemas/interview";
import type { User } from "@/lib/tpmos/schemas/user";
import { Plus, X, Sparkles, Loader2, MessageSquare } from "lucide-react";

type InterviewResponse = Interview & { leadName?: string; leadEmail?: string };

async function fetchInterviews(): Promise<InterviewResponse[]> {
  const res = await fetch(apiUrl("/interviews"), { credentials: "include" });
  return handleResponse<InterviewResponse[]>(res);
}

async function createInterview(input: CreateInterviewInput): Promise<Interview> {
  const res = await fetch(apiUrl("/interviews"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Interview>(res);
}

async function fetchUsers(): Promise<User[]> {
  const res = await fetch(apiUrl("/admin/users"), { credentials: "include" });
  return handleResponse<User[]>(res);
}

async function synthesize(interviewId: string) {
  const res = await fetch(apiUrl("/ai/synthesize-interview"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewId }),
  });
  return handleResponse<{ synthesis: Record<string, unknown> }>(res);
}

export default function IntakePage() {
  const qc = useQueryClient();
  const { data: interviews, isLoading } = useQuery({ queryKey: ["interviews"], queryFn: fetchInterviews });
  const { data: users } = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createInterview,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["interviews"] }); setShowForm(false); },
  });

  const synthMutation = useMutation({
    mutationFn: synthesize,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interviews"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="TPM Intake Interviews"
        description="Structured lead interviews for organizational discovery."
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
            {showForm ? "Cancel" : "New Interview"}
          </button>
        }
      />

      {showForm && users && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Conduct Interview</h3>
          <InterviewForm
            users={users.map((u) => ({ id: u.id, displayName: u.displayName, email: u.email }))}
            onSubmit={(input) => createMutation.mutate(input)}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending}
          />
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      )}

      {interviews?.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <MessageSquare className="mx-auto mb-2 size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No interviews yet.</p>
        </div>
      )}

      {interviews?.map((interview) => {
        const expanded = expandedId === interview.id;
        const hasSynthesis = !!interview.aiSynthesis;
        let synthesis: { topChallenges?: string[]; suggestedThemes?: string[]; recommendedActions?: string[]; scopeSummary?: string } | null = null;
        try { if (interview.aiSynthesis) synthesis = JSON.parse(interview.aiSynthesis); } catch { /* skip */ }

        return (
          <div key={interview.id} className="rounded-lg border border-border bg-card">
            <button
              onClick={() => setExpandedId(expanded ? null : interview.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/20"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {interview.leadName ?? interview.leadEmail ?? interview.leadUserId}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(interview.conductedAt).toLocaleDateString()}
                  </span>
                  {hasSynthesis && (
                    <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                      <Sparkles className="size-2.5" />
                      Synthesized
                    </span>
                  )}
                </div>
                {synthesis?.scopeSummary && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{synthesis.scopeSummary}</p>
                )}
              </div>
            </button>

            {expanded && (
              <div className="border-t border-border px-4 py-3 space-y-3">
                {interview.q1Scope && <QA label="Q1 — Scope" answer={interview.q1Scope} />}
                {interview.q2Challenges && <QA label="Q2 — Challenges" answer={interview.q2Challenges} />}
                {interview.q3MustKnow && <QA label="Q3 — Must Know" answer={interview.q3MustKnow} />}
                {interview.q4BlueSky && <QA label="Q4 — Blue Sky" answer={interview.q4BlueSky} />}

                {!hasSynthesis && (
                  <button
                    onClick={() => synthMutation.mutate(interview.id)}
                    disabled={synthMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10"
                  >
                    {synthMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                    Synthesize with AI
                  </button>
                )}

                {synthesis && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      AI Synthesis
                    </span>
                    {synthesis.topChallenges && (
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase">Top Challenges</p>
                        <ul className="mt-1 space-y-0.5">
                          {synthesis.topChallenges.map((c, i) => (
                            <li key={i} className="text-xs text-foreground/80">• {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {synthesis.suggestedThemes && (
                      <div className="flex flex-wrap gap-1">
                        {synthesis.suggestedThemes.map((t, i) => (
                          <span key={i} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-foreground/70">{t}</span>
                        ))}
                      </div>
                    )}
                    {synthesis.recommendedActions && (
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase">Recommended Actions</p>
                        <ul className="mt-1 space-y-0.5">
                          {synthesis.recommendedActions.map((a, i) => (
                            <li key={i} className="text-xs text-foreground/80">→ {a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QA({ label, answer }: { label: string; answer: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-pre-line text-xs text-foreground/80">{answer}</p>
    </div>
  );
}
