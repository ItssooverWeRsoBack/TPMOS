import { GitHubIssueEventSchema, GitHubRepositorySchema } from "../../../src/lib/tpmos/schemas/github-webhook";
import { getGitHubConnection } from "../db/queries/github-webhooks";
import { boundedBody, deriveWebhookSecret, verifyGitHubSignature } from "./github-webhook-crypto";
import { storeGitHubDelivery } from "./github-webhook-store";
export interface GitHubReceiverEnv { DB: D1Database; WEBHOOK_MASTER_KEY?: string; }
export async function receiveGitHub(request: Request, env: GitHubReceiverEnv) {
  const match = new URL(request.url).pathname.match(/^\/github\/(ghhook-[a-z0-9]+)$/);
  if (!match) return Response.json({ error: "Not found" }, { status: 404 });
  if (request.method !== "POST") return Response.json({ error: "POST required" }, { status: 405, headers: { Allow: "POST" } });
  if (!env.WEBHOOK_MASTER_KEY || env.WEBHOOK_MASTER_KEY.length < 32) return Response.json({ error: "Receiver not configured" }, { status: 503 });
  const connection = await getGitHubConnection(env.DB, match[1]);
  if (!connection || !connection.enabled) return Response.json({ error: "Connection not found" }, { status: 404 });
  let raw: Uint8Array<ArrayBuffer>;
  try { raw = await boundedBody(request); } catch { return Response.json({ error: "Payload too large" }, { status: 413 }); }
  const secret = await deriveWebhookSecret(env.WEBHOOK_MASTER_KEY, connection.connector_id, connection.secret_version);
  if (!await verifyGitHubSignature(secret, raw, request.headers.get("X-Hub-Signature-256"))) return Response.json({ error: "Invalid signature" }, { status: 401 });
  const deliveryId = request.headers.get("X-GitHub-Delivery"), event = request.headers.get("X-GitHub-Event");
  if (!deliveryId || !/^[a-zA-Z0-9-]{1,100}$/.test(deliveryId) || !event || !/^[a-z_]{1,50}$/.test(event)) return Response.json({ error: "Delivery headers required" }, { status: 400 });
  let json: unknown; try { json = JSON.parse(new TextDecoder().decode(raw)); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const repository = GitHubRepositorySchema.safeParse((json as { repository?: unknown } | null)?.repository);
  if (!repository.success || repository.data.id !== connection.repository_id || repository.data.full_name.toLowerCase() !== connection.repository_name.toLowerCase()) return Response.json({ error: "Repository mismatch" }, { status: 403 });
  const parsed = event === "issues" ? GitHubIssueEventSchema.safeParse(json) : null;
  if (parsed && !parsed.success) return Response.json({ error: "Invalid issue payload" }, { status: 400 });
  const payload = parsed?.success ? parsed.data : null;
  const supported = !!payload && ["opened", "edited", "closed", "reopened"].includes(payload.action);
  if (payload) {
    const issueUrl = new URL(payload.issue.html_url);
    if (issueUrl.origin !== "https://github.com" || issueUrl.pathname.toLowerCase() !== `/${connection.repository_name.toLowerCase()}/issues/${payload.issue.number}`) return Response.json({ error: "Issue URL mismatch" }, { status: 400 });
  }
  const scope = await env.DB.prepare(`SELECT q.state FROM quarters q JOIN teams t ON t.id = ? WHERE q.id = ? AND q.org_id = ? AND t.org_id = ? AND t.archived = 0`).bind(connection.team_id, connection.quarter_id, connection.org_id, connection.org_id).first<{ state: string }>();
  if (!scope || (supported && scope.state === "closed")) return Response.json({ error: "Target team or quarter unavailable" }, { status: 409 });
  try {
    const outcome = await storeGitHubDelivery(env.DB, connection, deliveryId, event, payload, supported ? "applied" : event === "ping" ? "ping" : "ignored");
    return Response.json({ accepted: true, ...outcome }, { status: outcome.duplicate ? 200 : 202 });
  } catch { return Response.json({ error: "Persistence failed; redeliver this event" }, { status: 503 }); }
}
