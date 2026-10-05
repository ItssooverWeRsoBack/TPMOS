import { z } from "zod/v4";

export const ConnectorTypeSchema = z.enum(["github", "linear", "slack"]);
export const DemoSettingsSchema = z.object({ mode: z.literal("demo") }).strict();
export const CreateConnectorSchema = z.object({
  type: ConnectorTypeSchema,
  name: z.string().trim().min(1).max(100),
  credentials: z.object({}).strict().default({}),
  settings: DemoSettingsSchema,
}).strict();
export type CreateConnectorInput = z.infer<typeof CreateConnectorSchema>;

export const ConnectorResponseSchema = z.object({
  id: z.string(), orgId: z.string(), type: z.string(), name: z.string(),
  enabled: z.boolean(), credentials: z.object({}).strict(),
  settings: z.record(z.string(), z.unknown()),
  lastSyncAt: z.string().nullable(), lastSyncStatus: z.string().nullable(),
  createdAt: z.string(), updatedAt: z.string(), createdBy: z.string(), version: z.number(),
});
export type ConnectorResponse = z.infer<typeof ConnectorResponseSchema>;
export const DemoArtifactSchema = z.object({
  kind: z.enum(["status", "notification"]),
  payload: z.record(z.string(), z.unknown()),
});
export const DemoSyncResponseSchema = z.object({
  mode: z.literal("demo"), synced: z.number().int().nonnegative(),
  existing: z.number().int().nonnegative(), artifacts: z.array(DemoArtifactSchema),
});
export type DemoSyncResponse = z.infer<typeof DemoSyncResponseSchema>;
