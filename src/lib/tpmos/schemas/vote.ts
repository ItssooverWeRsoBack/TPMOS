import { z } from "zod/v4";

export const EpicVoteSchema = z.object({
  epicId: z.string(),
  userId: z.string(),
  value: z.number().min(1).max(10).nullable(),
  timeCriticality: z.number().min(1).max(10).nullable(),
  riskReduction: z.number().min(1).max(10).nullable(),
  durationEstimateWeeks: z.number().min(0).nullable(),
  updatedAt: z.string(),
});

export type EpicVote = z.infer<typeof EpicVoteSchema>;

export const CastVoteSchema = z.object({
  value: z.number().min(1).max(10),
  timeCriticality: z.number().min(1).max(10),
  riskReduction: z.number().min(1).max(10),
  durationEstimateWeeks: z.number().min(0).optional(),
});

export type CastVoteInput = z.infer<typeof CastVoteSchema>;
