"use client";
import { GitHubWebhooks } from "@/components/tpmos/connectors/github-webhooks";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/tpmos/shared/page-header";
import { fetchConnectors, createDemoConnector, testDemoConnector, runDemoConnector } from "@/lib/tpmos/api/connectors";
import { useTeams } from "@/lib/tpmos/hooks/use-teams";
import { useQuarters } from "@/lib/tpmos/hooks/use-quarters";
import { ConnectorTypeSchema } from "@/lib/tpmos/schemas/connector";

const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
export default function ConnectorsPage() {
  const qc = useQueryClient();
  const { data: connectors, isLoading, error } = useQuery({ queryKey: ["connectors"], queryFn: fetchConnectors });
  const [type, setType] = useState<"github" | "linear" | "slack">("github");
  const [name, setName] = useState("");
  const teams = useTeams();
  const quarters = useQuarters();
  const [selectedTeam, setTeam] = useState("");
  const [selectedQuarter, setQuarter] = useState("");
  const team = selectedTeam || teams.data?.find(t => !t.archived)?.slug || "";
  const quarter = selectedQuarter || quarters.data?.find(q => q.state === "active")?.id || quarters.data?.find(q => q.state === "planning")?.id || "";
  const create = useMutation({ mutationFn: () => createDemoConnector({ type, name, credentials: {}, settings: { mode: "demo" } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["connectors"] }); setName(""); } });
  const test = useMutation({ mutationFn: testDemoConnector });
  const run = useMutation({ mutationFn: (id: string) => runDemoConnector(id, team, quarter), onSuccess: () => { qc.invalidateQueries({ queryKey: ["connectors"] }); qc.invalidateQueries({ queryKey: ["epics"] }); } });
  return <div className="space-y-6">
    <PageHeader title="Integrations" description="Import GitHub or Linear fixtures and preview status updates or Slack messages. Runs use your selected team and quarter. No provider credentials are needed." />
    <GitHubWebhooks />
    <form onSubmit={e => { e.preventDefault(); create.mutate(); }} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Add a demo connector</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs">Provider<select className={inputClass} value={type} onChange={e => setType(ConnectorTypeSchema.parse(e.target.value))}><option value="github">GitHub</option><option value="linear">Linear</option><option value="slack">Slack</option></select></label>
        <label className="space-y-1 text-xs">Name<input className={inputClass} value={name} onChange={e => setName(e.target.value)} maxLength={100} required /></label>
      </div>
      <button disabled={create.isPending || !name.trim()} className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-50">{create.isPending ? "Saving…" : "Add demo connector"}</button>
    </form>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-xs">Team<select className={inputClass} value={team} onChange={e => setTeam(e.target.value)}><option value="">Choose a team</option>{teams.data?.filter(t => !t.archived).map(t => <option key={t.id} value={t.slug}>{t.name}</option>)}</select></label>
      <label className="space-y-1 text-xs">Quarter<select className={inputClass} value={quarter} onChange={e => setQuarter(e.target.value)}><option value="">Choose an open quarter</option>{quarters.data?.filter(q => q.state !== "closed").map(q => <option key={q.id} value={q.id}>{q.label} · {q.state}</option>)}</select></label>
    </div>
    {[error, teams.error, quarters.error, create.error, test.error, run.error].filter(Boolean).map((err, i) => <p key={i} role="alert" className="text-sm text-red-400">{err instanceof Error ? err.message : "Request failed"}</p>)}
    {isLoading && <div className="h-20 animate-pulse rounded-lg border bg-card" />}
    {!teams.isLoading && !quarters.isLoading && (!team || !quarter) && <p className="text-sm text-muted-foreground">Create a team and an open quarter before running a demo.</p>}
    {connectors?.length === 0 && <p className="text-sm text-muted-foreground">Add a connector to start a demo.</p>}
    {connectors?.filter(conn => conn.settings.mode !== "webhook").map(conn => <div key={conn.id} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">{conn.name} · {conn.type}</h2><p className="text-xs text-muted-foreground">{conn.settings.mode === "demo" ? "Demo" : "Live connector disabled"} · {conn.lastSyncStatus ?? "No demo run yet"}</p></div>
        <div className="flex gap-2"><button disabled={test.isPending || !conn.enabled || conn.settings.mode !== "demo"} onClick={() => test.mutate(conn.id)} className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-50">Test fixture</button><button disabled={run.isPending || !team || !quarter || !conn.enabled || conn.settings.mode !== "demo"} onClick={() => run.mutate(conn.id)} className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-50">{conn.type === "slack" ? "Preview message" : "Import & preview status"}</button></div>
      </div>
      {test.variables === conn.id && test.data && <p role="status" className="text-xs text-muted-foreground">{test.data.message}</p>}
      {run.variables === conn.id && run.data && <div role="status" className="space-y-2"><p className="text-xs">{run.data.synced} imported · {run.data.existing} already present · Preview saved, nothing delivered</p><pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(run.data.artifacts, null, 2)}</pre></div>}
    </div>)}
  </div>;
}
