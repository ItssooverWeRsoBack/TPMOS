import { z } from "zod/v4";
import { apiUrl, handleResponse } from "./client";
import { GitHubWebhookConnectionSchema, GitHubWebhookSetupSchema, GitHubDeliverySchema, CreateGitHubWebhookSchema, UpdateGitHubWebhookSchema, type CreateGitHubWebhookInput, type UpdateGitHubWebhookInput } from "../schemas/github-webhook";
export async function listGitHubWebhooks() {
  return z.array(GitHubWebhookConnectionSchema).parse(await handleResponse(await fetch(apiUrl("/github-webhooks"), { credentials: "include" })));
}
export async function createGitHubWebhook(input: CreateGitHubWebhookInput) {
  return GitHubWebhookSetupSchema.parse(await handleResponse(await fetch(apiUrl("/github-webhooks"), { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(CreateGitHubWebhookSchema.parse(input)) })));
}
export async function updateGitHubWebhook(id: string, version: number, input: UpdateGitHubWebhookInput) {
  return z.object({ connection: GitHubWebhookConnectionSchema, secret: z.string().optional() }).parse(await handleResponse(await fetch(apiUrl(`/github-webhooks/${encodeURIComponent(id)}`), { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", "If-Match": String(version) }, body: JSON.stringify(UpdateGitHubWebhookSchema.parse(input)) })));
}
export async function getGitHubWebhook(id: string) {
  return z.object({ connection: GitHubWebhookConnectionSchema, deliveries: z.array(GitHubDeliverySchema) }).parse(await handleResponse(await fetch(apiUrl(`/github-webhooks/${encodeURIComponent(id)}`), { credentials: "include" })));
}
