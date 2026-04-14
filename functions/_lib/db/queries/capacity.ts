import { first, run } from "../client";

interface CapacityRow {
  team_id: string;
  quarter_id: string;
  total_member_weeks: number;
  vacation_weeks: number;
  tech_debt_weeks: number;
  other_overhead_weeks: number;
  notes: string | null;
  updated_at: string;
  updated_by: string;
  version: number;
}

export async function getCapacityPlan(db: D1Database, teamId: string, quarterId: string) {
  return first<CapacityRow>(
    db,
    "SELECT * FROM capacity_plans WHERE team_id = ? AND quarter_id = ?",
    teamId, quarterId
  );
}

export async function upsertCapacityPlan(
  db: D1Database,
  teamId: string,
  quarterId: string,
  input: {
    totalMemberWeeks: number;
    vacationWeeks: number;
    techDebtWeeks: number;
    otherOverheadWeeks: number;
    notes?: string;
  },
  actorId: string
) {
  await run(
    db,
    `INSERT INTO capacity_plans (team_id, quarter_id, total_member_weeks, vacation_weeks, tech_debt_weeks, other_overhead_weeks, notes, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (team_id, quarter_id) DO UPDATE SET
       total_member_weeks = excluded.total_member_weeks,
       vacation_weeks = excluded.vacation_weeks,
       tech_debt_weeks = excluded.tech_debt_weeks,
       other_overhead_weeks = excluded.other_overhead_weeks,
       notes = excluded.notes,
       updated_at = datetime('now'),
       updated_by = excluded.updated_by,
       version = capacity_plans.version + 1`,
    teamId, quarterId,
    input.totalMemberWeeks, input.vacationWeeks,
    input.techDebtWeeks, input.otherOverheadWeeks,
    input.notes ?? null, actorId
  );
  return getCapacityPlan(db, teamId, quarterId);
}

export function toCapacityResponse(row: CapacityRow) {
  return {
    teamId: row.team_id,
    quarterId: row.quarter_id,
    totalMemberWeeks: row.total_member_weeks,
    vacationWeeks: row.vacation_weeks,
    techDebtWeeks: row.tech_debt_weeks,
    otherOverheadWeeks: row.other_overhead_weeks,
    notes: row.notes,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    version: row.version,
  };
}
