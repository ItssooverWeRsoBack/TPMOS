import { query, first, run, generateId } from "../client";

interface OrgRow {
  id: string;
  name: string;
  created_at: string;
}

export async function listOrgs(db: D1Database) {
  return query<OrgRow>(db, "SELECT * FROM orgs ORDER BY name");
}

export async function getOrgById(db: D1Database, id: string) {
  return first<OrgRow>(db, "SELECT * FROM orgs WHERE id = ?", id);
}

export async function createOrg(db: D1Database, name: string) {
  const id = generateId("org");
  await run(db, "INSERT INTO orgs (id, name) VALUES (?, ?)", id, name);
  return getOrgById(db, id);
}

export async function getUserOrgs(db: D1Database, userId: string) {
  // A user can see orgs where they have a user record
  return query<OrgRow>(
    db,
    `SELECT DISTINCT o.* FROM orgs o
     JOIN users u ON u.org_id = o.id
     WHERE u.id = ?
     ORDER BY o.name`,
    userId
  );
}

export function toOrgResponse(row: OrgRow) {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}
