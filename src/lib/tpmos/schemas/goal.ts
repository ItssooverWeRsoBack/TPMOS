import { z } from "zod/v4";

export const GoalStatusSchema = z.enum(["on_track", "at_risk", "off_track", "done"]);
export type GoalStatus = z.infer<typeof GoalStatusSchema>;

export const GoalSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  targetQuarterId: z.string().nullable(),
  ownerUserId: z.string().nullable(),
  status: GoalStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
  version: z.number(),
});

export type Goal = z.infer<typeof GoalSchema>;

export const CreateGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(3000).optional(),
  targetQuarterId: z.string().optional(),
  ownerUserId: z.string().optional(),
  status: GoalStatusSchema.default("on_track"),
});

export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;

export const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(3000).optional(),
  status: GoalStatusSchema.optional(),
  targetQuarterId: z.string().nullable().optional(),
  ownerUserId: z.string().nullable().optional(),
});

export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;

export const InitiativeStatusSchema = z.enum(["active", "completed", "paused", "cancelled"]);
export type InitiativeStatus = z.infer<typeof InitiativeStatusSchema>;

export const InitiativeSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: InitiativeStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
  version: z.number(),
});

export type Initiative = z.infer<typeof InitiativeSchema>;

export const CreateInitiativeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(3000).optional(),
  status: InitiativeStatusSchema.default("active"),
});

export type CreateInitiativeInput = z.infer<typeof CreateInitiativeSchema>;
