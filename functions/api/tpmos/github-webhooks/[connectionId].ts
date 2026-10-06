import { UpdateGitHubWebhookSchema } from "../../../../src/lib/tpmos/schemas/github-webhook";
import { githubAdmin, type GitHubAdminEnv } from "../../../_lib/connectors/github-webhook-admin";
import { deriveWebhookSecret } from "../../../_lib/connectors/github-webhook-crypto";
import { getGitHubConnection, connectionResponse, listGitHubDeliveries } from "../../../_lib/db/queries/github-webhooks";
export const onRequestGet: PagesFunction<GitHubAdminEnv> = async context => {
  const admin = githubAdmin(context); if (admin.error) return admin.error;
  const row = await getGitHubConnection(context.env.DB, context.params.connectionId as string);
  if (!row || row.org_id !== admin.auth.user.orgId) return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return Response.json({ connection: connectionResponse(row, admin.receiver), deliveries: await listGitHubDeliveries(context.env.DB, row.connector_id) }, { headers: { "Cache-Control": "no-store" } });
};
export const onRequestPatch: PagesFunction<GitHubAdminEnv> = async context => {
  const admin = githubAdmin(context); if (admin.error) return admin.error;
  const version = context.request.headers.get("If-Match");
  if (!version || !/^[1-9]\d*$/.test(version) || !Number.isSafeInteger(Number(version))) return Response.json({ error: { code: "PRECONDITION_REQUIRED", message: "If-Match is required" } }, { status: 428 });
  const input = UpdateGitHubWebhookSchema.safeParse(await context.request.json().catch(() => null));
  if (!input.success) return Response.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
  const row = await getGitHubConnection(context.env.DB, context.params.connectionId as string);
  if (!row || row.org_id !== admin.auth.user.orgId) return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  const outcome = await context.env.DB.prepare("UPDATE github_webhook_connections SET enabled = ?, secret_version = secret_version + ?, version = version + 1 WHERE connector_id = ? AND org_id = ? AND version = ?").bind(input.data.enabled === undefined ? row.enabled : Number(input.data.enabled), input.data.rotateSecret ? 1 : 0, row.connector_id, row.org_id, Number(version)).run();
  if (!outcome.meta.changes) return Response.json({ error: { code: "VERSION_CONFLICT", message: "Refresh the connection and retry" } }, { status: 409 });
  const updated = (await getGitHubConnection(context.env.DB, row.connector_id))!;
  return Response.json({ connection: connectionResponse(updated, admin.receiver), ...(input.data.rotateSecret ? { secret: await deriveWebhookSecret(admin.master, updated.connector_id, updated.secret_version) } : {}) }, { headers: { "Cache-Control": "no-store" } });
};
