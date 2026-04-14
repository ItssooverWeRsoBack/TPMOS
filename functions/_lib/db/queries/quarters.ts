import { query, first, run } from "../client";

interface QuarterRow {
  id: string;
  org_id: string;
  label: string;
  start_date: string;
  end_date: string;
  state: string;
  created_at: string;
}

export async function listQuarters(db: D1Database, orgId: string) {
  return query<QuarterRow>(
    db,
    "SELECT * FROM quarters WHERE org_id = ? ORDER BY start_date DESC",
    orgId
  );
}

export async function getQuarterById(db: D1Database, quarterId: string) {
  return first<QuarterRow>(db, "SELECT * FROM quarters WHERE id = ?", quarterId);
}

export async function getActiveQuarter(db: D1Database, orgId: string) {
  return first<QuarterRow>(
    db,
    "SELECT * FROM quarters WHERE org_id = ? AND state = 'active' ORDER BY start_date DESC LIMIT 1",
    orgId
  );
}

export async function createQuarter(
  db: D1Database,
  orgId: string,
  input: { label: string; startDate: string; endDate: string; state?: string }
) {
  const id = `${orgId}:${input.label.replace(/\s+/g, "")}`;
  await run(
    db,
    "INSERT INTO quarters (id, org_id, label, start_date, end_date, state) VALUES (?, ?, ?, ?, ?, ?)",
    id, orgId, input.label, input.startDate, input.endDate, input.state ?? "planning"
  );
  return getQuarterById(db, id);
}

export async function updateQuarterState(db: D1Database, quarterId: string, state: string) {
  await run(db, "UPDATE quarters SET state = ? WHERE id = ?", state, quarterId);
  return getQuarterById(db, quarterId);
}

export function toQuarterResponse(row: QuarterRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    label: row.label,
    startDate: row.start_date,
    endDate: row.end_date,
    state: row.state,
    createdAt: row.created_at,
  };
}
