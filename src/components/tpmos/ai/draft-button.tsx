"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";

interface DraftResult {
  description: string;
  definitionOfDone: string;
  aiGenerated: boolean;
}

async function draftEpic(title: string, teamContext?: string): Promise<DraftResult> {
  const res = await fetch(apiUrl("/ai/draft-epic"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, teamContext }),
  });
  return handleResponse<DraftResult>(res);
}

interface DraftButtonProps {
  title: string;
  teamContext?: string;
  onAccept: (description: string, dod: string) => void;
  disabled?: boolean;
}

export function DraftButton({ title, teamContext, onAccept, disabled }: DraftButtonProps) {
  const [result, setResult] = useState<DraftResult | null>(null);

  const mutation = useMutation({
    mutationFn: () => draftEpic(title, teamContext),
    onSuccess: (data) => setResult(data),
  });

  if (mutation.isError) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-400">
        AI drafting unavailable. Write manually.
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="size-3" />
            AI Draft — Review before accepting
          </span>
          <button
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Regenerate
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase text-muted-foreground">Description</label>
          <p className="text-xs text-foreground/90">{result.description}</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase text-muted-foreground">Definition of Done</label>
          <p className="whitespace-pre-line text-xs text-foreground/90">{result.definitionOfDone}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              onAccept(result.description, result.definitionOfDone);
              setResult(null);
            }}
            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Accept
          </button>
          <button
            onClick={() => setResult(null)}
            className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={disabled || !title.trim() || mutation.isPending}
      className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {mutation.isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Sparkles className="size-3" />
      )}
      {mutation.isPending ? "Drafting..." : "Draft with AI"}
    </button>
  );
}
