import { z } from "zod/v4";

export const TeamSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  slug: z.string(),
  name: z.string(),
  charter: z.string().nullable(),
  archived: z.number().transform((v) => v === 1),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
  version: z.number(),
});

export type Team = z.infer<typeof TeamSchema>;

export const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  charter: z.string().max(2000).optional(),
});

export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export const UpdateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  charter: z.string().max(2000).optional(),
  archived: z.boolean().optional(),
});

export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;

export const TeamMemberSchema = z.object({
  teamId: z.string(),
  userId: z.string(),
  teamRole: z.enum(["lead", "member"]),
  joinedAt: z.string(),
});

export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const AddMemberSchema = z.object({
  userId: z.string(),
  teamRole: z.enum(["lead", "member"]).default("member"),
});

export type AddMemberInput = z.infer<typeof AddMemberSchema>;
