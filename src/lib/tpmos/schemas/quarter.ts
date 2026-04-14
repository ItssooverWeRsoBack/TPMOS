import { z } from "zod/v4";

export const QuarterStateSchema = z.enum(["planning", "active", "closed"]);
export type QuarterState = z.infer<typeof QuarterStateSchema>;

export const QuarterSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  label: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  state: QuarterStateSchema,
  createdAt: z.string(),
});

export type Quarter = z.infer<typeof QuarterSchema>;

export const CreateQuarterSchema = z.object({
  label: z.string().min(1).max(20),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  state: QuarterStateSchema.default("planning"),
});

export type CreateQuarterInput = z.infer<typeof CreateQuarterSchema>;
