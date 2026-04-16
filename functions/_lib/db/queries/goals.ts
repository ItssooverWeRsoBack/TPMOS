import { query, first, run, generateId } from "../client";

interface GoalRow {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  target_quarter_id: string | null;
  owner_user_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  version: number;
}

interface InitiativeRow {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  version: number;
}

export async function listGoals(db: D1Database, orgId: string) {
  return query<GoalRow & { initiative_count: number; epic_count: number }>(
    db,
    `SELECT g.*,
       (SELECT COUNT(*) FROM goal_initiative_map gim WHERE gim.goal_id = g.id) as initiative_count,
       (SELECT COUNT(DISTINCT iem.epic_id) FROM goal_initiative_map gim2
         JOIN initiative_epic_map iem ON iem.initiative_id = gim2.initiative_id
         WHERE gim2.goal_id = g.id) as epic_count
     FROM goals g WHERE g.org_id = ? ORDER BY g.created_at DESC`,
    orgId
  );
}

export async function getGoalById(db: D1Database, id: string) {
  return first<GoalRow>(db, "SELECT * FROM goals WHERE id = ?", id);
}

export async function createGoal(
  db: D1Database,
  orgId: string,
  input: { title: string; description?: string; targetQuarterId?: string; ownerUserId?: string; status?: string },
  actorId: string
) {
  const id = generateId("goal");
  await run(
    db,
    `INSERT INTO goals (id, org_id, title, description, target_quarter_id, owner_user_id, status, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, orgId, input.title, input.description ?? null,
    input.targetQuarterId ?? null, input.ownerUserId ?? null,
    input.status ?? "on_track", actorId, actorId
  );
  return getGoalById(db, id);
}

export async function updateGoal(
  db: D1Database,
  goalId: string,
  input: { title?: string; description?: string; status?: string; targetQuarterId?: string | null; ownerUserId?: string | null },
  actorId: string,
  expectedVersion: number
) {
  const goal = await getGoalById(db, goalId);
  if (!goal) return null;
  if (goal.version !== expectedVersion) return { conflict: true, current: goal };

  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.title !== undefined) { updates.push("title = ?"); params.push(input.title); }
  if (input.description !== undefined) { updates.push("description = ?"); params.push(input.description); }
  if (input.status !== undefined) { updates.push("status = ?"); params.push(input.status); }
  if (input.targetQuarterId !== undefined) { updates.push("target_quarter_id = ?"); params.push(input.targetQuarterId); }
  if (input.ownerUserId !== undefined) { updates.push("owner_user_id = ?"); params.push(input.ownerUserId); }

  if (updates.length === 0) return goal;

  updates.push("updated_at = datetime('now')");
  updates.push("updated_by = ?"); params.push(actorId);
  updates.push("version = version + 1");
  params.push(goalId);

  await run(db, `UPDATE goals SET ${updates.join(", ")} WHERE id = ?`, ...params);
  return getGoalById(db, goalId);
}

export async function listInitiatives(db: D1Database, orgId: string) {
  return query<InitiativeRow & { goal_count: number; epic_count: number; team_names: string }>(
    db,
    `SELECT i.*,
       (SELECT COUNT(*) FROM goal_initiative_map gim WHERE gim.initiative_id = i.id) as goal_count,
       (SELECT COUNT(*) FROM initiative_epic_map iem WHERE iem.initiative_id = i.id) as epic_count,
       (SELECT GROUP_CONCAT(DISTINCT t.name) FROM initiative_epic_map iem2
         JOIN epics e ON e.id = iem2.epic_id
         JOIN teams t ON t.id = e.team_id
         WHERE iem2.initiative_id = i.id) as team_names
     FROM initiatives i WHERE i.org_id = ? ORDER BY i.created_at DESC`,
    orgId
  );
}

export async function getInitiativeById(db: D1Database, id: string) {
  return first<InitiativeRow>(db, "SELECT * FROM initiatives WHERE id = ?", id);
}

export async function createInitiative(
  db: D1Database,
  orgId: string,
  input: { title: string; description?: string; status?: string },
  actorId: string
) {
  const id = generateId("init");
  await run(
    db,
    `INSERT INTO initiatives (id, org_id, title, description, status, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, orgId, input.title, input.description ?? null, input.status ?? "active", actorId, actorId
  );
  return getInitiativeById(db, id);
}

// Mapping operations
export async function linkGoalInitiative(db: D1Database, goalId: string, initiativeId: string) {
  await run(db, "INSERT OR IGNORE INTO goal_initiative_map (goal_id, initiative_id) VALUES (?, ?)", goalId, initiativeId);
}

export async function unlinkGoalInitiative(db: D1Database, goalId: string, initiativeId: string) {
  await run(db, "DELETE FROM goal_initiative_map WHERE goal_id = ? AND initiative_id = ?", goalId, initiativeId);
}

export async function linkInitiativeEpic(db: D1Database, initiativeId: string, epicId: string) {
  await run(db, "INSERT OR IGNORE INTO initiative_epic_map (initiative_id, epic_id) VALUES (?, ?)", initiativeId, epicId);
}

export async function unlinkInitiativeEpic(db: D1Database, initiativeId: string, epicId: string) {
  await run(db, "DELETE FROM initiative_epic_map WHERE initiative_id = ? AND epic_id = ?", initiativeId, epicId);
}

export async function getGoalInitiatives(db: D1Database, goalId: string) {
  return query<InitiativeRow>(
    db,
    `SELECT i.* FROM initiatives i
     JOIN goal_initiative_map gim ON gim.initiative_id = i.id
     WHERE gim.goal_id = ?
     ORDER BY i.title`,
    goalId
  );
}

export async function getInitiativeEpics(db: D1Database, initiativeId: string) {
  return query<{ epic_id: string; title: string; status: string; percent_complete: number; team_name: string; dri_committed_weeks: number }>(
    db,
    `SELECT e.id as epic_id, e.title, e.status, e.percent_complete, t.name as team_name, e.dri_committed_weeks
     FROM epics e
     JOIN initiative_epic_map iem ON iem.epic_id = e.id
     JOIN teams t ON t.id = e.team_id
     WHERE iem.initiative_id = ?
     ORDER BY t.name, e.title`,
    initiativeId
  );
}

/** Goals with zero mapped initiatives — coverage gaps */
export async function findGoalGaps(db: D1Database, orgId: string) {
  return query<GoalRow>(
    db,
    `SELECT g.* FROM goals g
     WHERE g.org_id = ? AND g.status != 'done'
     AND NOT EXISTS (SELECT 1 FROM goal_initiative_map gim WHERE gim.goal_id = g.id)
     ORDER BY g.title`,
    orgId
  );
}

export function toGoalResponse(row: GoalRow & { initiative_count?: number; epic_count?: number }) {
  return {
    id: row.id,
    orgId: row.org_id,
    title: row.title,
    description: row.description,
    targetQuarterId: row.target_quarter_id,
    ownerUserId: row.owner_user_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    version: row.version,
    ...(row.initiative_count !== undefined && { initiativeCount: row.initiative_count }),
    ...(row.epic_count !== undefined && { epicCount: row.epic_count }),
  };
}

export function toInitiativeResponse(row: InitiativeRow & { goal_count?: number; epic_count?: number; team_names?: string }) {
  return {
    id: row.id,
    orgId: row.org_id,
    title: row.title,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    version: row.version,
    ...(row.goal_count !== undefined && { goalCount: row.goal_count }),
    ...(row.epic_count !== undefined && { epicCount: row.epic_count }),
    ...(row.team_names !== undefined && { teamNames: row.team_names?.split(",").filter(Boolean) ?? [] }),
  };
}
