"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface LintResult {
  issues: string[];
  suggestion: string | null;
  source: string;
}

async function lintDoD(definitionOfDone: string): Promise<LintResult> {
  const res = await fetch(apiUrl("/ai/lint-dod"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ definitionOfDone }),
  });
  return handleResponse<LintResult>(res);
}

interface DodLintBadgeProps {
  definitionOfDone: string;
  /** Only lint after this many characters */
  minLength?: number;
}

export function DodLintBadge({ definitionOfDone, minLength = 10 }: DodLintBadgeProps) {
  const [result, setResult] = useState<LintResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const mutation = useMutation({
    mutationFn: () => lintDoD(definitionOfDone),
    onSuccess: setResult,
  });

  // Auto-lint when DoD changes (debounced effect handled by caller saving)
  useEffect(() => {
    if (definitionOfDone.length >= minLength) {
      const timer = setTimeout(() => mutation.mutate(), 800);
      return () => clearTimeout(timer);
    } else {
      setResult(null);
    }
  }, [definitionOfDone]);

  if (!result || mutation.isPending) return null;

  if (result.issues.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
        <CheckCircle2 className="size-3" />
        DoD looks good
      </span>
    );
  }

  return (
    <div className="mt-1 rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-[11px] font-medium text-amber-400"
      >
        <span className="flex items-center gap-1">
          <AlertTriangle className="size-3" />
          {result.issues.length} suggestion{result.issues.length !== 1 ? "s" : ""} to strengthen this DoD
        </span>
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {result.issues.map((issue, i) => (
            <p key={i} className="text-[11px] text-muted-foreground">• {issue}</p>
          ))}
          {result.suggestion && (
            <div className="mt-2 rounded bg-muted/50 p-2">
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Suggested rewrite</p>
              <p className="mt-1 whitespace-pre-line text-[11px] text-foreground/80">{result.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
