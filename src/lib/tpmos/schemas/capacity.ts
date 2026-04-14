import { z } from "zod/v4";

export const CapacityPlanSchema = z.object({
  teamId: z.string(),
  quarterId: z.string(),
  totalMemberWeeks: z.number(),
  vacationWeeks: z.number(),
  techDebtWeeks: z.number(),
  otherOverheadWeeks: z.number(),
  notes: z.string().nullable(),
  updatedAt: z.string(),
  updatedBy: z.string(),
  version: z.number(),
});

export type CapacityPlan = z.infer<typeof CapacityPlanSchema>;

export const UpsertCapacitySchema = z.object({
  totalMemberWeeks: z.number().min(0),
  vacationWeeks: z.number().min(0).default(0),
  techDebtWeeks: z.number().min(0).default(0),
  otherOverheadWeeks: z.number().min(0).default(0),
  notes: z.string().max(1000).optional(),
});

export type UpsertCapacityInput = z.infer<typeof UpsertCapacitySchema>;
