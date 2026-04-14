import { query, first, run, generateId } from "../client";

interface EpicRow {
  id: string;
  team_id: string;
  quarter_id: string;
  title: string;
  description: string | null;
  definition_of_done: string | null;
  dri_user_id: string | null;
  dri_committed_weeks: number;
  status: string;
  percent_complete: number;
  at_risk: number;
  sort_order: number;
  carried_from_epic_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  version: number;
}

export async function listEpics(db: D1Database, teamId: string, quarterId: string) {
  return query<EpicRow>(
    db,
    "SELECT * FROM epics WHERE team_id = ? AND quarter_id = ? ORDER BY sort_order ASC",
    teamId, quarterId
  );
}

export async function getEpicById(db: D1Database, epicId: string) {
  return first<EpicRow>(db, "SELECT * FROM epics WHERE id = ?", epicId);
}

export async function getMaxSortOrder(db: D1Database, teamId: string, quarterId: string): Promise<number> {
  const row = await first<{ max_sort: number | null }>(
    db,
    "SELECT MAX(sort_order) as max_sort FROM epics WHERE team_id = ? AND quarter_id = ?",
    teamId, quarterId
  );
  return row?.max_sort ?? 0;
}

export async function createEpic(
  db: D1Database,
  input: {
    teamId: string;
    quarterId: string;
    title: string;
    description?: string;
    definitionOfDone?: string;
    driUserId?: string;
    driCommittedWeeks: number;
    carriedFromEpicId?: string;
  },
  actorId: string
) {
  const id = generateId("epic");
  const maxSort = await getMaxSortOrder(db, input.teamId, input.quarterId);
  const sortOrder = maxSort + 1000; // leave gaps for reordering

  await run(
    db,
    `INSERT INTO epics (id, team_id, quarter_id, title, description, definition_of_done, dri_user_id, dri_committed_weeks, sort_order, carried_from_epic_id, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, input.teamId, input.quarterId, input.title,
    input.description ?? null, input.definitionOfDone ?? null,
    input.driUserId ?? null, input.driCommittedWeeks,
    sortOrder, input.carriedFromEpicId ?? null,
    actorId, actorId
  );
  return getEpicById(db, id);
}

export async function updateEpic(
  db: D1Database,
  epicId: string,
  input: {
    title?: string;
    description?: string;
    definitionOfDone?: string;
    driUserId?: string | null;
    driCommittedWeeks?: number;
  },
  actorId: string,
  expectedVersion: number
) {
  const epic = await getEpicById(db, epicId);
  if (!epic) return null;
  if (epic.version !== expectedVersion) return { conflict: true, current: epic };

  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.title !== undefined) { updates.push("title = ?"); params.push(input.title); }
  if (input.description !== undefined) { updates.push("description = ?"); params.push(input.description); }
  if (input.definitionOfDone !== undefined) { updates.push("definition_of_done = ?"); params.push(input.definitionOfDone); }
  if (input.driUserId !== undefined) { updates.push("dri_user_id = ?"); params.push(input.driUserId); }
  if (input.driCommittedWeeks !== undefined) { updates.push("dri_committed_weeks = ?"); params.push(input.driCommittedWeeks); }

  if (updates.length === 0) return epic;

  updates.push("updated_at = datetime('now')");
  updates.push("updated_by = ?"); params.push(actorId);
  updates.push("version = version + 1");
  params.push(epicId);

  await run(db, `UPDATE epics SET ${updates.join(", ")} WHERE id = ?`, ...params);
  return getEpicById(db, epicId);
}

export async function updateEpicStatus(
  db: D1Database,
  epicId: string,
  status: string,
  percentComplete: number | undefined,
  atRisk: boolean | undefined,
  actorId: string
) {
  const updates: string[] = ["status = ?", "updated_at = datetime('now')", "updated_by = ?"];
  const params: unknown[] = [status];

  if (percentComplete !== undefined) { updates.push("percent_complete = ?"); params.push(percentComplete); }
  if (atRisk !== undefined) { updates.push("at_risk = ?"); params.push(atRisk ? 1 : 0); }

  params.push(actorId);
  updates.push("version = version + 1");
  params.push(epicId);

  await run(db, `UPDATE epics SET ${updates.join(", ")} WHERE id = ?`, ...params);
  return getEpicById(db, epicId);
}

export async function deleteEpic(db: D1Database, epicId: string) {
  await run(db, "DELETE FROM epics WHERE id = ?", epicId);
}

export async function reorderEpics(db: D1Database, epicIds: string[]) {
  const statements = epicIds.map((id, index) => ({
    sql: "UPDATE epics SET sort_order = ?, updated_at = datetime('now') WHERE id = ?",
    params: [(index + 1) * 1000, id] as unknown[],
  }));

  const prepared = statements.map((s) => db.prepare(s.sql).bind(...s.params));
  await db.batch(prepared);
}

export async function listAtRiskEpics(db: D1Database, orgId: string) {
  return query<EpicRow & { team_name: string; team_slug: string }>(
    db,
    `SELECT e.*, t.name as team_name, t.slug as team_slug
     FROM epics e
     JOIN teams t ON t.id = e.team_id
     WHERE t.org_id = ? AND (e.at_risk = 1 OR e.status = 'blocked')
     ORDER BY e.updated_at DESC`,
    orgId
  );
}

export function toEpicResponse(row: EpicRow & { team_name?: string; team_slug?: string }) {
  return {
    id: row.id,
    teamId: row.team_id,
    quarterId: row.quarter_id,
    title: row.title,
    description: row.description,
    definitionOfDone: row.definition_of_done,
    driUserId: row.dri_user_id,
    driCommittedWeeks: row.dri_committed_weeks,
    status: row.status,
    percentComplete: row.percent_complete,
    atRisk: row.at_risk === 1,
    sortOrder: row.sort_order,
    carriedFromEpicId: row.carried_from_epic_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    version: row.version,
    ...(row.team_name && { teamName: row.team_name }),
    ...(row.team_slug && { teamSlug: row.team_slug }),
  };
}
