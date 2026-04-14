"use client";

import { useState } from "react";
import type { CreateInterviewInput } from "@/lib/tpmos/schemas/interview";

const QUESTIONS = [
  { key: "q1Scope" as const, label: "Q1 — What team do you manage and what is your scope?" },
  { key: "q2Challenges" as const, label: "Q2 — What are your 3 biggest challenges right now?" },
  { key: "q3MustKnow" as const, label: "Q3 — What are 3 things a TPM should know immediately?" },
  { key: "q4BlueSky" as const, label: "Q4 — Blue sky: what would you want a TPM to achieve?" },
];

interface InterviewFormProps {
  users: { id: string; displayName: string | null; email: string }[];
  onSubmit: (input: CreateInterviewInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InterviewForm({ users, onSubmit, onCancel, isLoading }: InterviewFormProps) {
  const [leadUserId, setLeadUserId] = useState("");
  const [conductedAt, setConductedAt] = useState(new Date().toISOString().split("T")[0]);
  const [answers, setAnswers] = useState({
    q1Scope: "",
    q2Challenges: "",
    q3MustKnow: "",
    q4BlueSky: "",
  });
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      leadUserId,
      conductedAt,
      q1Scope: answers.q1Scope || undefined,
      q2Challenges: answers.q2Challenges || undefined,
      q3MustKnow: answers.q3MustKnow || undefined,
      q4BlueSky: answers.q4BlueSky || undefined,
      notes: notes || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Engineering Lead</label>
          <select
            value={leadUserId}
            onChange={(e) => setLeadUserId(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a lead...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName ?? u.email.split("@")[0]} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Date</label>
          <input
            type="date"
            value={conductedAt}
            onChange={(e) => setConductedAt(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {QUESTIONS.map((q) => (
        <div key={q.key} className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">{q.label}</label>
          <textarea
            value={answers[q.key]}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
            rows={3}
            placeholder="Enter their response..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      ))}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Your observations..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !leadUserId}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Interview"}
        </button>
      </div>
    </form>
  );
}
