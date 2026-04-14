import { query, first, run, generateId } from "../client";

interface UserRow {
  id: string;
  org_id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
  last_seen_at: string | null;
}

export async function getUserByEmail(db: D1Database, email: string) {
  return first<UserRow>(db, "SELECT * FROM users WHERE email = ?", email);
}

export async function getUserById(db: D1Database, id: string) {
  return first<UserRow>(db, "SELECT * FROM users WHERE id = ?", id);
}

export async function listUsers(db: D1Database, orgId: string) {
  return query<UserRow>(db, "SELECT * FROM users WHERE org_id = ? ORDER BY created_at", orgId);
}

export async function listUsersByRole(db: D1Database, orgId: string, role: string) {
  return query<UserRow>(db, "SELECT * FROM users WHERE org_id = ? AND role = ? ORDER BY created_at", orgId, role);
}

export async function createUser(db: D1Database, orgId: string, email: string, role: string = "pending") {
  const id = generateId("user");
  await run(
    db,
    "INSERT INTO users (id, org_id, email, display_name, role) VALUES (?, ?, ?, ?, ?)",
    id, orgId, email, email.split("@")[0], role
  );
  return getUserById(db, id);
}

export async function updateUserRole(db: D1Database, userId: string, role: string) {
  await run(db, "UPDATE users SET role = ? WHERE id = ?", role, userId);
  return getUserById(db, userId);
}

export async function touchLastSeen(db: D1Database, userId: string) {
  await run(db, "UPDATE users SET last_seen_at = datetime('now') WHERE id = ?", userId);
}

/** Convert a DB row to the camelCase shape the client expects. */
export function toUserResponse(row: UserRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}
