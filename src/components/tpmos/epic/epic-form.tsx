"use client";

import { useState } from "react";
import type { CreateEpicInput } from "@/lib/tpmos/schemas/epic";
import { DraftButton } from "@/components/tpmos/ai/draft-button";
import { DodLintBadge } from "@/components/tpmos/ai/dod-lint-badge";

interface EpicFormProps {
  teamId: string;
  quarterId: string;
  onSubmit: (input: CreateEpicInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EpicForm({ teamId, quarterId, onSubmit, onCancel, isLoading }: EpicFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dod, setDod] = useState("");
  const [weeks, setWeeks] = useState<number | "">(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      teamId,
      quarterId,
      title,
      description: description || undefined,
      definitionOfDone: dod || undefined,
      driCommittedWeeks: typeof weeks === "number" ? weeks : 0,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Migrate auth to OAuth 2.0"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <DraftButton
          title={title}
          onAccept={(desc, dodDraft) => {
            setDescription(desc);
            setDod(dodDraft);
          }}
          disabled={!title.trim()}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What and why"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Definition of Done (optional)</label>
        <textarea
          value={dod}
          onChange={(e) => setDod(e.target.value)}
          placeholder="How do we know this is complete?"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {dod && <DodLintBadge definitionOfDone={dod} />}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Duration estimate</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={weeks}
            onChange={(e) => setWeeks(e.target.value === "" ? "" : Number(e.target.value))}
            min={0}
            step={0.5}
            className="w-20 rounded-md border border-input bg-background px-2 py-1.5 text-sm font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">weeks (single person)</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !title}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Epic"}
        </button>
      </div>
    </form>
  );
}
