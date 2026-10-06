"use client";
import { z } from "zod/v4";
import { CreateGitHubWebhookSchema, type CreateGitHubWebhookInput } from "@/lib/tpmos/schemas/github-webhook";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTeams } from "@/lib/tpmos/hooks/use-teams";
import { useQuarters } from "@/lib/tpmos/hooks/use-quarters";
import { listGitHubWebhooks, createGitHubWebhook, updateGitHubWebhook, getGitHubWebhook } from "@/lib/tpmos/api/github-webhooks";
const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
export function GitHubWebhooks() {
  const qc = useQueryClient(); const teams = useTeams(); const quarters = useQuarters();
  const list = useQuery({ queryKey: ["github-webhooks"], queryFn: listGitHubWebhooks });
  const [repository, setRepository] = useState(""); const [repositoryId, setRepositoryId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [teamId, setTeam] = useState(""); const [quarterId, setQuarter] = useState("");
  const [selectedId, setSelected] = useState(""); const [secret, setSecret] = useState<{ id: string; value: string } | null>(null);
  const detail = useQuery({ queryKey: ["github-webhook", selectedId], queryFn: () => getGitHubWebhook(selectedId), enabled: !!selectedId });
  const create = useMutation({ mutationFn: (input: CreateGitHubWebhookInput) => createGitHubWebhook(input), onSuccess: data => { setSecret({ id: data.connection.id, value: data.secret }); setSelected(data.connection.id); qc.invalidateQueries({ queryKey: ["github-webhooks"] }); } });
  const update = useMutation({ mutationFn: ({ id, version, rotate, enabled }: { id: string; version: number; rotate?: boolean; enabled?: boolean }) => updateGitHubWebhook(id, version, rotate ? { rotateSecret: true } : { enabled }), onSuccess: data => { if (data.secret) setSecret({ id: data.connection.id, value: data.secret }); else setSecret(null); qc.invalidateQueries({ queryKey: ["github-webhooks"] }); qc.invalidateQueries({ queryKey: ["github-webhook"] }); } });
  function submit() {
    create.reset();
    const parsed = CreateGitHubWebhookSchema.safeParse({ repository, repositoryId: Number(repositoryId), teamId, quarterId });
    if (!parsed.success) { setFieldErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message]))); return; }
    setRepository(parsed.data.repository);
    const existing = list.data?.find(c => c.repositoryId === parsed.data.repositoryId && c.teamId === teamId && c.quarterId === quarterId);
    if (existing) { setSelected(existing.id); setFieldErrors({ repository: "This repository is already connected to that team and quarter. Use its existing connection below." }); return; }
    setFieldErrors({}); create.mutate(parsed.data);
  }
  function errorMessage(err: unknown) {
    if (err instanceof z.ZodError) return err.issues.map(issue => issue.message).join(" ");
    return err instanceof Error ? err.message : "Request failed";
  }
  return <section className="space-y-4 rounded-lg border border-border bg-card p-4">
    <h2 className="text-lg font-semibold">GitHub webhooks</h2>
    <p className="text-sm text-muted-foreground">Connect repository issue changes to a team’s plan. Opening, editing, closing, or reopening an issue updates its linked epic. Refresh the planner to see incoming changes.</p>
    <a className="text-xs text-primary underline" href="https://github.com/ItssooverWeRsoBack/TPMOS/blob/main/docs/GITHUB_WEBHOOKS.md">Setup guide and practice exercises</a>
    {list.data && list.data.length > 0 && <p className="text-sm text-muted-foreground">Connections listed below are already set up. To practice with a receiving repository, change an issue in GitHub and refresh the plan; connecting it again is unnecessary.</p>}
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); submit(); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs">Repository name or GitHub URL<input className={field} aria-invalid={!!fieldErrors.repository} aria-describedby="github-repository-help" required placeholder="owner/repository or https://github.com/owner/repository" value={repository} onChange={e => { setRepository(e.target.value); setFieldErrors({}); create.reset(); }} /><span id="github-repository-help" className="block text-muted-foreground">Example: ItssooverWeRsoBack/webhook-practice. Full repository URLs work too.</span>{fieldErrors.repository && <p role="alert" className="text-red-400">{fieldErrors.repository}</p>}</label>
        <label className="space-y-1 text-xs">Repository numeric ID<input className={field} required type="number" min="1" step="1" aria-invalid={!!fieldErrors.repositoryId} value={repositoryId} onChange={e => { setRepositoryId(e.target.value); setFieldErrors({}); create.reset(); }} /><span className="text-muted-foreground">Find it in the repository’s GitHub API response; see the guide.</span>{fieldErrors.repositoryId && <p role="alert" className="text-red-400">{fieldErrors.repositoryId}</p>}</label>
        <label className="space-y-1 text-xs">Team<select className={field} required aria-invalid={!!fieldErrors.teamId} value={teamId} onChange={e => { setTeam(e.target.value); setFieldErrors({}); create.reset(); }}><option value="">Choose a team</option>{teams.data?.filter(t => !t.archived).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>{fieldErrors.teamId && <p role="alert" className="text-red-400">{fieldErrors.teamId}</p>}</label>
        <label className="space-y-1 text-xs">Quarter<select className={field} required aria-invalid={!!fieldErrors.quarterId} value={quarterId} onChange={e => { setQuarter(e.target.value); setFieldErrors({}); create.reset(); }}><option value="">Choose an open quarter</option>{quarters.data?.filter(q => q.state !== "closed").map(q => <option key={q.id} value={q.id}>{q.label}</option>)}</select>{fieldErrors.quarterId && <p role="alert" className="text-red-400">{fieldErrors.quarterId}</p>}</label>
      </div>
      <button className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-50" disabled={create.isPending}>Connect repository</button>
    </form>
    {[list.error, teams.error, quarters.error, create.error, update.error, detail.error].filter(Boolean).map((err, i) => <p key={i} role="alert" className="text-sm text-red-400">{errorMessage(err)}</p>)}
    {list.isLoading && <div className="h-20 animate-pulse rounded-md bg-muted" />}
    {list.data?.map(connection => <div key={connection.id} className="space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><button className="text-sm font-medium text-primary underline" onClick={() => { setSelected(connection.id); qc.invalidateQueries({ queryKey: ["github-webhook", connection.id] }); }}>{connection.repository}</button><span className="text-xs text-muted-foreground">{connection.enabled ? "Receiving events" : "Disabled"}</span></div>
      <label className="block space-y-1 text-xs">GitHub payload URL<input className={field} readOnly value={connection.webhookUrl} onFocus={e => e.currentTarget.select()} /></label>
      {secret?.id === connection.id && <div className="space-y-2 rounded-md border border-primary/30 p-3"><label className="block space-y-1 text-xs">Secret — copy into GitHub now<input className={field} readOnly type="text" value={secret.value} onFocus={e => e.currentTarget.select()} /></label><p className="text-xs text-muted-foreground">Shown only after creation or rotation. Keep it private. Rotating immediately invalidates the previous secret.</p><button className="text-xs underline" onClick={() => setSecret(null)}>Dismiss secret</button></div>}
      <div className="flex flex-wrap gap-3 text-xs"><button disabled={update.isPending} onClick={() => update.mutate({ id: connection.id, version: connection.version, enabled: !connection.enabled })}>{connection.enabled ? "Disable" : "Enable"}</button><button disabled={update.isPending} onClick={() => { if (window.confirm("Rotate the secret? GitHub deliveries will fail until you replace the secret in its webhook settings.")) update.mutate({ id: connection.id, version: connection.version, rotate: true }); }}>Rotate secret</button><button onClick={() => { setSelected(connection.id); qc.invalidateQueries({ queryKey: ["github-webhook", connection.id] }); }}>Refresh deliveries</button></div>
      {selectedId === connection.id && detail.data && <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{["Received", "Event", "Issue", "Result", "Delivery ID"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{detail.data.deliveries.map(d => <tr key={d.deliveryId}><td className="p-2">{new Date(d.receivedAt).toLocaleString()}</td><td className="p-2">{d.event} {d.action}</td><td className="p-2">{d.issueNumber ?? "—"}</td><td className="p-2">{d.result}</td><td className="p-2 font-mono">{d.deliveryId}</td></tr>)}</tbody></table>{detail.data.deliveries.length === 0 && <p className="py-2 text-muted-foreground">No verified deliveries yet. Save the webhook in GitHub to send a ping.</p>}</div>}
    </div>)}
  </section>;
}
