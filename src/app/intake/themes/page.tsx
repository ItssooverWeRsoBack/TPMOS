"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { ThemeClusterViz } from "@/components/tpmos/intake/theme-cluster-viz";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import { RefreshCw, Loader2 } from "lucide-react";

interface ClusterResponse {
  clusters: { label: string; count: number; interviewIds: string[] }[];
  totalInterviews: number;
  totalWithSynthesis: number;
}

async function fetchClusters(): Promise<ClusterResponse> {
  const res = await fetch(apiUrl("/ai/cluster-themes"), {
    method: "POST",
    credentials: "include",
  });
  return handleResponse<ClusterResponse>(res);
}

export default function ThemeClustersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["theme-clusters"],
    queryFn: fetchClusters,
  });

  const qc = useQueryClient();
  const refreshMutation = useMutation({
    mutationFn: fetchClusters,
    onSuccess: (newData) => qc.setQueryData(["theme-clusters"], newData),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theme Clusters"
        description="Recurring themes across lead interviews."
        action={
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {refreshMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
            Refresh
          </button>
        }
      />

      {data && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{data.totalInterviews} total interviews</span>
          <span>{data.totalWithSynthesis} with AI synthesis</span>
          <span>{data.clusters.length} themes discovered</span>
        </div>
      )}

      {isLoading && (
        <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
      )}

      {data && (
        <ThemeClusterViz
          clusters={data.clusters}
          totalInterviews={data.totalInterviews}
        />
      )}
    </div>
  );
}
