"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { apiUrl, handleResponse } from "@/lib/tpmos/api/client";
import { cn } from "@/lib/utils";
import { Plus, X, CheckCircle2, XCircle, Loader2, Plug, GitBranch } from "lucide-react";

interface ConnectorConfig {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  credentials: Record<string, string>;
  settings: Record<string, unknown>;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
}

async function fetchConnectors(): Promise<ConnectorConfig[]> {
  const res = await fetch(apiUrl("/connectors"), { credentials: "include" });
  return handleResponse<ConnectorConfig[]>(res);
}

async function createConnector(input: { type: string; name: string; credentials: Record<string, string>; settings: Record<string, unknown> }) {
  const res = await fetch(apiUrl("/connectors"), {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<ConnectorConfig>(res);
}

async function testConnector(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(apiUrl(`/connectors/${id}/test`), { method: "POST", credentials: "include" });
  return handleResponse<{ ok: boolean; error?: string }>(res);
}

const CONNECTOR_TYPES = [
  { type: "github", label: "GitHub", icon: GitBranch, description: "Sync issues as epics" },
  { type: "linear", label: "Linear", icon: Plug, description: "Sync Linear issues" },
  { type: "slack", label: "Slack", icon: Plug, description: "Post notifications" },
];

export default function ConnectorsPage() {
  const qc = useQueryClient();
  const { data: connectors, isLoading } = useQuery({ queryKey: ["connectors"], queryFn: fetchConnectors });
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("github");
  const [formName, setFormName] = useState("");
  const [formToken, setFormToken] = useState("");
  const [formOwner, setFormOwner] = useState("");
  const [formRepo, setFormRepo] = useState("");

  const createMutation = useMutation({
    mutationFn: () => createConnector({
      type: formType,
      name: formName || `${formType}-default`,
      credentials: { token: formToken },
      settings: { owner: formOwner, repo: formRepo },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connectors"] });
      setShowForm(false);
      setFormToken(""); setFormOwner(""); setFormRepo(""); setFormName("");
    },
  });

  const testMutation = useMutation({ mutationFn: testConnector });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect external tools to sync epics and send notifications."
        action={
          !showForm ? (
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="size-3.5" /> Add Connector
            </button>
          ) : undefined
        }
      />

      {showForm && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">New Connector</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          </div>

          <div className="flex gap-2">
            {CONNECTOR_TYPES.map((ct) => (
              <button key={ct.type} onClick={() => setFormType(ct.type)}
                className={cn("rounded-md border px-3 py-2 text-xs font-medium", formType === ct.type ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                {ct.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Name</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., my-github" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">API Token</label>
              <input type="password" value={formToken} onChange={(e) => setFormToken(e.target.value)} placeholder="ghp_... or lin_api_..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            {(formType === "github" || formType === "linear") && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">{formType === "github" ? "Owner (org or user)" : "Workspace"}</label>
                  <input value={formOwner} onChange={(e) => setFormOwner(e.target.value)} placeholder="e.g., my-org" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">{formType === "github" ? "Repository" : "Project"}</label>
                  <input value={formRepo} onChange={(e) => setFormRepo(e.target.value)} placeholder="e.g., my-repo" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formToken}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {createMutation.isPending ? "Saving..." : "Save Connector"}
            </button>
          </div>
        </div>
      )}

      {isLoading && [1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />
      ))}

      {connectors?.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Plug className="mx-auto mb-2 size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No connectors configured.</p>
        </div>
      )}

      {connectors?.map((conn) => (
        <div key={conn.id} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-muted">
            {conn.type === "github" ? <GitBranch className="size-5 text-muted-foreground" /> : <Plug className="size-5 text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{conn.name}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">{conn.type}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", conn.enabled ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground")}>
                {conn.enabled ? "Active" : "Disabled"}
              </span>
            </div>
            {conn.lastSyncAt && (
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                Last sync: {new Date(conn.lastSyncAt).toLocaleString()} — {conn.lastSyncStatus}
              </div>
            )}
          </div>
          <button
            onClick={() => testMutation.mutate(conn.id)}
            disabled={testMutation.isPending}
            className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
          >
            {testMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : "Test"}
          </button>
          {testMutation.data && testMutation.variables === conn.id && (
            testMutation.data.ok
              ? <CheckCircle2 className="size-4 text-emerald-400" />
              : <span className="text-[11px] text-red-400">{testMutation.data.error}</span>
          )}
        </div>
      ))}
    </div>
  );
}
