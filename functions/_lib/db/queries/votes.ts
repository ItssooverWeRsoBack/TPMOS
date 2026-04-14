import { query, run } from "../client";

interface VoteRow {
  epic_id: string;
  user_id: string;
  value: number | null;
  time_criticality: number | null;
  risk_reduction: number | null;
  duration_estimate_weeks: number | null;
  updated_at: string;
}

export async function listVotesForEpic(db: D1Database, epicId: string) {
  return query<VoteRow>(
    db,
    "SELECT * FROM epic_votes WHERE epic_id = ? ORDER BY updated_at",
    epicId
  );
}

export async function listVotesForTeamQuarter(db: D1Database, teamId: string, quarterId: string) {
  return query<VoteRow>(
    db,
    `SELECT ev.* FROM epic_votes ev
     JOIN epics e ON e.id = ev.epic_id
     WHERE e.team_id = ? AND e.quarter_id = ?
     ORDER BY ev.epic_id, ev.updated_at`,
    teamId, quarterId
  );
}

export async function upsertVote(
  db: D1Database,
  epicId: string,
  userId: string,
  input: {
    value: number;
    timeCriticality: number;
    riskReduction: number;
    durationEstimateWeeks?: number;
  }
) {
  await run(
    db,
    `INSERT INTO epic_votes (epic_id, user_id, value, time_criticality, risk_reduction, duration_estimate_weeks)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (epic_id, user_id) DO UPDATE SET
       value = excluded.value,
       time_criticality = excluded.time_criticality,
       risk_reduction = excluded.risk_reduction,
       duration_estimate_weeks = excluded.duration_estimate_weeks,
       updated_at = datetime('now')`,
    epicId, userId,
    input.value, input.timeCriticality, input.riskReduction,
    input.durationEstimateWeeks ?? null
  );
  return listVotesForEpic(db, epicId);
}

export function toVoteResponse(row: VoteRow) {
  return {
    epicId: row.epic_id,
    userId: row.user_id,
    value: row.value,
    timeCriticality: row.time_criticality,
    riskReduction: row.risk_reduction,
    durationEstimateWeeks: row.duration_estimate_weeks,
    updatedAt: row.updated_at,
  };
}
