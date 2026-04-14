import { z } from "zod/v4";

export const EpicStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "blocked",
  "at_risk",
  "done",
  "cancelled",
]);

export type EpicStatus = z.infer<typeof EpicStatusSchema>;

export const EpicSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  quarterId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  definitionOfDone: z.string().nullable(),
  driUserId: z.string().nullable(),
  driCommittedWeeks: z.number(),
  status: EpicStatusSchema,
  percentComplete: z.number(),
  atRisk: z.boolean(),
  sortOrder: z.number(),
  carriedFromEpicId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
  version: z.number(),
});

export type Epic = z.infer<typeof EpicSchema>;

export const CreateEpicSchema = z.object({
  teamId: z.string(),
  quarterId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  definitionOfDone: z.string().max(3000).optional(),
  driUserId: z.string().optional(),
  driCommittedWeeks: z.number().min(0).default(0),
});

export type CreateEpicInput = z.infer<typeof CreateEpicSchema>;

export const UpdateEpicSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  definitionOfDone: z.string().max(3000).optional(),
  driUserId: z.string().nullable().optional(),
  driCommittedWeeks: z.number().min(0).optional(),
});

export type UpdateEpicInput = z.infer<typeof UpdateEpicSchema>;

export const UpdateStatusSchema = z.object({
  status: EpicStatusSchema,
  percentComplete: z.number().min(0).max(100).optional(),
  atRisk: z.boolean().optional(),
});

export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
