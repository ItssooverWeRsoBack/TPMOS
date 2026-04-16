"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { useCurrentUser } from "@/lib/tpmos/hooks/use-current-user";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import { Camera, Copy, CheckCircle2, FileText, Sparkles, Loader2 } from "lucide-react";

interface Report {
  id: string;
  quarterId: string;
  generatedAt: string;
  content: string;
  metadata: { totalEpics: number; doneCount: number; atRiskCount: number; completion: number } | null;
}

async function fetchReports(): Promise<Report[]> {
  const res = await fetch(apiUrl("/reports"), { credentials: "include" });
  return handleResponse<Report[]>(res);
}

async function createSnapshot(): Promise<Report> {
  const res = await fetch(apiUrl("/reports/snapshot"), { method: "POST", credentials: "include" });
  return handleResponse<Report>(res);
}

export default function ReportsPage() {
  const { data: user } = useCurrentUser();
  const qc = useQueryClient();
  const { data: reports, isLoading } = useQuery({ queryKey: ["reports"], queryFn: fetchReports });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const snapshotMutation = useMutation({
    mutationFn: createSnapshot,
    onSuccess: (report) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      setSelectedId(report.id);
    },
  });

  const canGenerate = user && (user.role === "admin" || user.role === "tpm");
  const selectedReport = reports?.find((r) => r.id === selectedId) ?? reports?.[0];

  function handleCopy() {
    if (selectedReport) {
      navigator.clipboard.writeText(selectedReport.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Export"
        description="Weekly leadership reports with quarter snapshots."
        action={
          canGenerate ? (
            <button
              onClick={() => snapshotMutation.mutate()}
              disabled={snapshotMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {snapshotMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
              {snapshotMutation.isPending ? "Generating..." : "Take Snapshot"}
            </button>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
        {/* Report list */}
        <div className="space-y-1">
          {isLoading && [1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-card" />
          ))}

          {reports?.length === 0 && !isLoading && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <FileText className="mx-auto mb-2 size-6 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No snapshots yet.</p>
              {canGenerate && (
                <p className="mt-1 text-xs text-muted-foreground/70">Click "Take Snapshot" to generate your first report.</p>
              )}
            </div>
          )}

          {reports?.map((report) => {
            const isSelected = (selectedReport?.id === report.id);
            return (
              <button
                key={report.id}
                onClick={() => setSelectedId(report.id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                  isSelected ? "border-primary/60 bg-primary/5" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="text-xs font-medium text-foreground">
                  {new Date(report.generatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </div>
                {report.metadata && (
                  <div className="mt-0.5 flex gap-2 text-[10px] text-muted-foreground">
                    <span>{report.metadata.completion.toFixed(0)}%</span>
                    <span>{report.metadata.doneCount}/{report.metadata.totalEpics} done</span>
                    {report.metadata.atRiskCount > 0 && (
                      <span className="text-amber-400">{report.metadata.atRiskCount} risk</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Report preview */}
        {selectedReport ? (
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-xs text-muted-foreground">
                Generated {new Date(selectedReport.generatedAt).toLocaleString()}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {copied ? <CheckCircle2 className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy Markdown"}
              </button>
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap text-xs text-foreground/90 font-mono leading-relaxed">
                {selectedReport.content}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-12">
            <p className="text-sm text-muted-foreground">Select a report to preview.</p>
          </div>
        )}
      </div>
    </div>
  );
}
