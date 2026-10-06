import { z } from "zod/v4";
export const CreateGitHubWebhookSchema = z.object({
  repository: z.string().trim().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/).max(201),
  repositoryId: z.number().int().positive().safe(),
  teamId: z.string().min(1), quarterId: z.string().min(1),
}).strict();
export const UpdateGitHubWebhookSchema = z.object({ enabled: z.boolean().optional(), rotateSecret: z.literal(true).optional() }).strict().refine(v => v.enabled !== undefined || v.rotateSecret, "Choose an update");
export const GitHubRepositorySchema = z.object({ id: z.number().int().positive().safe(), full_name: z.string().min(3).max(201) });
export const GitHubIssueEventSchema = z.object({
  action: z.string().max(40), repository: GitHubRepositorySchema,
  issue: z.object({ number: z.number().int().positive().safe(), title: z.string().min(1).max(1024), body: z.string().max(65536).nullable().optional(), state: z.enum(["open", "closed"]), updated_at: z.string().datetime(), html_url: z.string().url().max(2048) }),
});
export const GitHubWebhookConnectionSchema = z.object({
  id: z.string(), repository: z.string(), repositoryId: z.number(), teamId: z.string(), quarterId: z.string(),
  enabled: z.boolean(), version: z.number(), webhookUrl: z.string().url(), createdAt: z.string(),
});
export const GitHubWebhookSetupSchema = z.object({ connection: GitHubWebhookConnectionSchema, secret: z.string() });
export type GitHubWebhookConnection = z.infer<typeof GitHubWebhookConnectionSchema>;
export type CreateGitHubWebhookInput = z.infer<typeof CreateGitHubWebhookSchema>;
export type UpdateGitHubWebhookInput = z.infer<typeof UpdateGitHubWebhookSchema>;
export const GitHubDeliverySchema = z.object({ deliveryId: z.string(), event: z.string(), action: z.string().nullable(), issueNumber: z.number().nullable(), result: z.string(), receivedAt: z.string() });
export type GitHubDelivery = z.infer<typeof GitHubDeliverySchema>;
