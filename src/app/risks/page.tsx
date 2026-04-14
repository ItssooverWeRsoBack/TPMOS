"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { RiskFeed } from "@/components/tpmos/progress/risk-feed";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import type { Epic } from "@/lib/tpmos/schemas/epic";

type RiskEpic = Epic & { teamName?: string; teamSlug?: string };

async function fetchRisks(): Promise<RiskEpic[]> {
  const res = await fetch(apiUrl("/risks"), { credentials: "include" });
  return handleResponse<RiskEpic[]>(res);
}

export default function RisksPage() {
  const { data: epics, isLoading } = useQuery({
    queryKey: ["risks"],
    queryFn: fetchRisks,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risks"
        description="At-risk and blocked epics across all teams."
      />

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      )}

      {epics && (
        <RiskFeed
          epics={epics.map((e) => ({
            id: e.id,
            title: e.title,
            status: e.status,
            percentComplete: e.percentComplete,
            atRisk: e.atRisk,
            driCommittedWeeks: e.driCommittedWeeks,
            teamName: e.teamName,
            teamSlug: e.teamSlug,
            updatedAt: e.updatedAt,
          }))}
        />
      )}
    </div>
  );
}
