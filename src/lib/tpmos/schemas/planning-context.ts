import { z } from "zod/v4";
import { QuarterStateSchema } from "./quarter";
export const PlanningQuarterSchema = z.object({
  id: z.string(), label: z.string(), state: QuarterStateSchema,
  startDate: z.string(), endDate: z.string(),
  epicCount: z.number().int().nonnegative(), hasCapacity: z.boolean(), hasWebhook: z.boolean(),
});
export type PlanningQuarter = z.infer<typeof PlanningQuarterSchema>;
export const TeamPlanningContextSchema = z.object({ teamId: z.string(), quarters: z.array(PlanningQuarterSchema) });
