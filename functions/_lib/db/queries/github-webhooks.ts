import { first, query, generateId } from "../client";
import type { CreateGitHubWebhookInput } from "../../../../src/lib/tpmos/schemas/github-webhook";
export interface GitHubConnectionRow {
  connector_id: string; org_id: string; repository_id: number; repository_name: string;
  team_id: string; quarter_id: string; enabled: number; secret_version: number; version: number; created_at: string;
}
export async function getGitHubConnection(db: D1Database, id: string) {
  return first<GitHubConnectionRow>(db, "SELECT * FROM github_webhook_connections WHERE connector_id = ?", id);
}
export async function listGitHubConnections(db: D1Database, orgId: string) {
  return query<GitHubConnectionRow>(db, "SELECT * FROM github_webhook_connections WHERE org_id = ? ORDER BY created_at DESC", orgId);
}
export function connectionResponse(row: GitHubConnectionRow, receiverUrl: string) {
  return { id: row.connector_id, repository: row.repository_name, repositoryId: row.repository_id, teamId: row.team_id, quarterId: row.quarter_id, enabled: row.enabled === 1, version: row.version, webhookUrl: `${receiverUrl.replace(/\/$/, "")}/github/${row.connector_id}`, createdAt: row.created_at };
}
export async function createGitHubConnection(db: D1Database, orgId: string, input: CreateGitHubWebhookInput, actorId: string) {
  const id = generateId("ghhook");
  await db.batch([
    db.prepare("INSERT INTO connector_configs (id, org_id, type, name, credentials, settings, created_by) VALUES (?, ?, 'github', ?, '{}', '{\"mode\":\"webhook\"}', ?)").bind(id, orgId, `${input.repository} · ${id}`, actorId),
    db.prepare("INSERT INTO github_webhook_connections (connector_id, org_id, repository_id, repository_name, team_id, quarter_id) VALUES (?, ?, ?, ?, ?, ?)").bind(id, orgId, input.repositoryId, input.repository, input.teamId, input.quarterId),
  ]);
  return (await getGitHubConnection(db, id))!;
}
export async function listGitHubDeliveries(db: D1Database, id: string) {
  const rows = await query<{ delivery_id: string; event: string; action: string | null; issue_number: number | null; result: string; received_at: string }>(db, "SELECT delivery_id, event, action, issue_number, result, received_at FROM github_webhook_deliveries WHERE connection_id = ? ORDER BY received_at DESC LIMIT 50", id);
  return rows.map(r => ({ deliveryId: r.delivery_id, event: r.event, action: r.action, issueNumber: r.issue_number, result: r.result, receivedAt: r.received_at }));
}
