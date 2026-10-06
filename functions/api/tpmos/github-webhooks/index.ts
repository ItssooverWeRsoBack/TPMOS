import { CreateGitHubWebhookSchema } from "../../../../src/lib/tpmos/schemas/github-webhook";
import { githubAdmin, type GitHubAdminEnv } from "../../../_lib/connectors/github-webhook-admin";
import { deriveWebhookSecret } from "../../../_lib/connectors/github-webhook-crypto";
import { listGitHubConnections, createGitHubConnection, connectionResponse } from "../../../_lib/db/queries/github-webhooks";
export const onRequestGet: PagesFunction<GitHubAdminEnv> = async context => {
  const admin = githubAdmin(context); if (admin.error) return admin.error;
  return Response.json((await listGitHubConnections(context.env.DB, admin.auth.user.orgId)).map(row => connectionResponse(row, admin.receiver)));
};
export const onRequestPost: PagesFunction<GitHubAdminEnv> = async context => {
  const admin = githubAdmin(context); if (admin.error) return admin.error;
  const input = CreateGitHubWebhookSchema.safeParse(await context.request.json().catch(() => null));
  if (!input.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Repository name, numeric repository ID, team and quarter are required" } }, { status: 400 });
  const { user } = admin.auth;
  const scope = await context.env.DB.prepare("SELECT q.state FROM quarters q JOIN teams t ON t.id = ? WHERE q.id = ? AND q.org_id = ? AND t.org_id = ? AND t.archived = 0").bind(input.data.teamId, input.data.quarterId, user.orgId, user.orgId).first<{ state: string }>();
  if (!scope) return Response.json({ error: { code: "NOT_FOUND", message: "Team or quarter not found" } }, { status: 404 });
  if (scope.state === "closed") return Response.json({ error: { code: "QUARTER_CLOSED", message: "Choose an open quarter" } }, { status: 409 });
  const duplicate = (await listGitHubConnections(context.env.DB, user.orgId)).some(c => c.repository_id === input.data.repositoryId && c.team_id === input.data.teamId && c.quarter_id === input.data.quarterId);
  if (duplicate) return Response.json({ error: { code: "DUPLICATE", message: "This repository is already connected to that plan" } }, { status: 409 });
  const row = await createGitHubConnection(context.env.DB, user.orgId, input.data, user.id);
  return Response.json({ connection: connectionResponse(row, admin.receiver), secret: await deriveWebhookSecret(admin.master, row.connector_id, row.secret_version) }, { status: 201, headers: { "Cache-Control": "no-store" } });
};
