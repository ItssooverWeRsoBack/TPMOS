import { z } from "zod/v4";

export const InterviewSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  leadUserId: z.string(),
  conductedByUserId: z.string(),
  conductedAt: z.string(),
  q1Scope: z.string().nullable(),
  q2Challenges: z.string().nullable(),
  q3MustKnow: z.string().nullable(),
  q4BlueSky: z.string().nullable(),
  aiSynthesis: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number(),
});

export type Interview = z.infer<typeof InterviewSchema>;

export const CreateInterviewSchema = z.object({
  leadUserId: z.string(),
  conductedAt: z.string(),
  q1Scope: z.string().max(5000).optional(),
  q2Challenges: z.string().max(5000).optional(),
  q3MustKnow: z.string().max(5000).optional(),
  q4BlueSky: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
});

export type CreateInterviewInput = z.infer<typeof CreateInterviewSchema>;

export const InterviewThemeSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  label: z.string(),
  description: z.string().nullable(),
});

export type InterviewTheme = z.infer<typeof InterviewThemeSchema>;
