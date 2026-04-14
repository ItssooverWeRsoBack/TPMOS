import { query, first, run, generateId } from "../client";

interface TeamRow {
  id: string;
  org_id: string;
  slug: string;
  name: string;
  charter: string | null;
  archived: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  version: number;
}

interface TeamMemberRow {
  team_id: string;
  user_id: string;
  team_role: string;
  joined_at: string;
  // joined columns from users table
  email?: string;
  display_name?: string | null;
  role?: string;
}

export async function listTeams(db: D1Database, orgId: string, includeArchived = false) {
  const sql = includeArchived
    ? "SELECT * FROM teams WHERE org_id = ? ORDER BY name"
    : "SELECT * FROM teams WHERE org_id = ? AND archived = 0 ORDER BY name";
  return query<TeamRow>(db, sql, orgId);
}

export async function getTeamById(db: D1Database, teamId: string) {
  return first<TeamRow>(db, "SELECT * FROM teams WHERE id = ?", teamId);
}

export async function getTeamBySlug(db: D1Database, orgId: string, slug: string) {
  return first<TeamRow>(db, "SELECT * FROM teams WHERE org_id = ? AND slug = ?", orgId, slug);
}

export async function createTeam(
  db: D1Database,
  orgId: string,
  input: { name: string; slug: string; charter?: string },
  actorId: string
) {
  const id = generateId("team");
  await run(
    db,
    `INSERT INTO teams (id, org_id, slug, name, charter, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, orgId, input.slug, input.name, input.charter ?? null, actorId, actorId
  );
  return getTeamById(db, id);
}

export async function updateTeam(
  db: D1Database,
  teamId: string,
  input: { name?: string; charter?: string; archived?: boolean },
  actorId: string,
  expectedVersion: number
) {
  const team = await getTeamById(db, teamId);
  if (!team) return null;
  if (team.version !== expectedVersion) return { conflict: true, current: team };

  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) { updates.push("name = ?"); params.push(input.name); }
  if (input.charter !== undefined) { updates.push("charter = ?"); params.push(input.charter); }
  if (input.archived !== undefined) { updates.push("archived = ?"); params.push(input.archived ? 1 : 0); }

  updates.push("updated_at = datetime('now')");
  updates.push("updated_by = ?"); params.push(actorId);
  updates.push("version = version + 1");

  params.push(teamId);
  await run(db, `UPDATE teams SET ${updates.join(", ")} WHERE id = ?`, ...params);
  return getTeamById(db, teamId);
}

export async function listTeamMembers(db: D1Database, teamId: string) {
  return query<TeamMemberRow>(
    db,
    `SELECT tm.*, u.email, u.display_name, u.role
     FROM team_members tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = ?
     ORDER BY tm.team_role DESC, u.display_name`,
    teamId
  );
}

export async function addTeamMember(db: D1Database, teamId: string, userId: string, teamRole: string) {
  await run(
    db,
    "INSERT OR REPLACE INTO team_members (team_id, user_id, team_role) VALUES (?, ?, ?)",
    teamId, userId, teamRole
  );
}

export async function removeTeamMember(db: D1Database, teamId: string, userId: string) {
  await run(db, "DELETE FROM team_members WHERE team_id = ? AND user_id = ?", teamId, userId);
}

export async function getUserTeamIds(db: D1Database, userId: string): Promise<string[]> {
  const rows = await query<{ team_id: string }>(
    db,
    "SELECT team_id FROM team_members WHERE user_id = ?",
    userId
  );
  return rows.map((r) => r.team_id);
}

export function toTeamResponse(row: TeamRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    slug: row.slug,
    name: row.name,
    charter: row.charter,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    version: row.version,
  };
}

export function toMemberResponse(row: TeamMemberRow) {
  return {
    teamId: row.team_id,
    userId: row.user_id,
    teamRole: row.team_role,
    joinedAt: row.joined_at,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  };
}
