import { generateId } from "../db/client";
import type { GitHubConnectionRow } from "../db/queries/github-webhooks";
import { GitHubIssueEventSchema } from "../../../src/lib/tpmos/schemas/github-webhook";
import type { z } from "zod/v4";

/** Persist receipt and epic mutation together; unique delivery IDs prevent replayed writes. */
export async function storeGitHubDelivery(db: D1Database, connection: GitHubConnectionRow, deliveryId: string, event: string, payload: z.infer<typeof GitHubIssueEventSchema> | null, result: string) {
  const token = crypto.randomUUID(); const issue = payload?.issue;
  const statements = [db.prepare(`INSERT INTO github_webhook_receipts (connection_id, delivery_id, attempt_token, result)
    VALUES (?, ?, ?, ?) ON CONFLICT(connection_id, delivery_id) DO NOTHING`).bind(connection.connector_id, deliveryId, token, result),
    db.prepare(`INSERT INTO github_webhook_deliveries (connection_id, delivery_id, attempt_token, event, action, issue_number, result)
    SELECT ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM github_webhook_receipts WHERE connection_id = ? AND delivery_id = ? AND attempt_token = ?)
    ON CONFLICT(connection_id, delivery_id) DO NOTHING`).bind(connection.connector_id, deliveryId, token, event, payload?.action ?? null, issue?.number ?? null, result, connection.connector_id, deliveryId, token)];
  if (issue && result === "applied") {
    const externalId = `github:${connection.repository_id}#${issue.number}`;
    const status = issue.state === "closed" ? "done" : "not_started";
    statements.push(db.prepare(`INSERT INTO epics (id, team_id, quarter_id, title, description, dri_committed_weeks, sort_order, created_by, updated_by, connector_id, external_id, external_updated_at, status, percent_complete)
      SELECT ?, ?, ?, ?, ?, 0, COALESCE((SELECT MAX(sort_order) FROM epics WHERE team_id = ? AND quarter_id = ?), 0) + 1000, c.created_by, c.created_by, ?, ?, ?, ?, ?
      FROM connector_configs c WHERE c.id = ?
      AND EXISTS (SELECT 1 FROM github_webhook_connections h JOIN teams t ON t.id = h.team_id JOIN quarters q ON q.id = h.quarter_id
        WHERE h.connector_id = c.id AND h.enabled = 1 AND h.secret_version = ? AND t.archived = 0
        AND h.org_id = c.org_id AND t.org_id = c.org_id AND q.org_id = c.org_id AND q.state != 'closed')
      AND EXISTS (SELECT 1 FROM github_webhook_receipts WHERE connection_id = ? AND delivery_id = ? AND attempt_token = ?)
      ON CONFLICT(connector_id, team_id, quarter_id, external_id) DO UPDATE SET
        title = excluded.title, description = excluded.description, external_updated_at = excluded.external_updated_at,
        status = CASE WHEN excluded.status = 'done' THEN 'done' WHEN epics.status = 'done' THEN 'not_started' ELSE epics.status END,
        percent_complete = CASE WHEN excluded.status = 'done' THEN 100 WHEN epics.status = 'done' THEN 0 ELSE epics.percent_complete END,
        updated_at = datetime('now'), updated_by = excluded.updated_by, version = epics.version + 1
      WHERE epics.external_updated_at IS NULL OR julianday(excluded.external_updated_at) >= julianday(epics.external_updated_at)`)
      .bind(generateId("epic"), connection.team_id, connection.quarter_id, issue.title.slice(0, 200), `${(issue.body ?? "").slice(0, 4500)}\n\nGitHub: ${issue.html_url}`, connection.team_id, connection.quarter_id, connection.connector_id, externalId, issue.updated_at, status, issue.state === "closed" ? 100 : 0, connection.connector_id, connection.secret_version, connection.connector_id, deliveryId, token));
    statements.push(db.prepare(`UPDATE github_webhook_receipts SET result = CASE WHEN changes() = 0 THEN 'stale' ELSE 'applied' END
      WHERE connection_id = ? AND delivery_id = ? AND attempt_token = ?`).bind(connection.connector_id, deliveryId, token));
  }
  statements.push(db.prepare(`UPDATE github_webhook_deliveries SET result = (SELECT result FROM github_webhook_receipts WHERE connection_id = ? AND delivery_id = ?)
    WHERE connection_id = ? AND delivery_id = ? AND attempt_token = ?`).bind(connection.connector_id, deliveryId, connection.connector_id, deliveryId, token));
  statements.push(db.prepare(`DELETE FROM github_webhook_deliveries WHERE connection_id = ? AND delivery_id IN
    (SELECT delivery_id FROM github_webhook_deliveries WHERE connection_id = ? ORDER BY received_at DESC, rowid DESC LIMIT -1 OFFSET 100)`).bind(connection.connector_id, connection.connector_id));
  const outcomes = await db.batch(statements);
  const stored = await db.prepare("SELECT result FROM github_webhook_receipts WHERE connection_id = ? AND delivery_id = ?").bind(connection.connector_id, deliveryId).first<{ result: string }>();
  return { duplicate: outcomes[0].meta.changes === 0, result: stored?.result ?? result };
}
