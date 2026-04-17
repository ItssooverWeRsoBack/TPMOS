import { query, run, generateId } from "../client";

interface AuditRow {
  id: string;
  org_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: string | null;
  created_at: string;
}

/** Write an audit log entry. Fire-and-forget — never blocks the request. */
export async function writeAudit(
  db: D1Database,
  orgId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  payload?: Record<string, unknown>
) {
  const id = generateId("aud");
  await run(
    db,
    "INSERT INTO audit_log (id, org_id, user_id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?, ?, ?)",
    id, orgId, userId, action, entityType, entityId,
    payload ? JSON.stringify(payload) : null
  );
}

export async function listAuditLog(
  db: D1Database,
  orgId: string,
  opts?: { entityType?: string; limit?: number; offset?: number }
) {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  if (opts?.entityType) {
    return query<AuditRow & { user_email: string; user_name: string | null }>(
      db,
      `SELECT a.*, u.email as user_email, u.display_name as user_name
       FROM audit_log a JOIN users u ON u.id = a.user_id
       WHERE a.org_id = ? AND a.entity_type = ?
       ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
      orgId, opts.entityType, limit, offset
    );
  }

  return query<AuditRow & { user_email: string; user_name: string | null }>(
    db,
    `SELECT a.*, u.email as user_email, u.display_name as user_name
     FROM audit_log a JOIN users u ON u.id = a.user_id
     WHERE a.org_id = ?
     ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    orgId, limit, offset
  );
}

export function toAuditResponse(row: AuditRow & { user_email?: string; user_name?: string | null }) {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    payload: row.payload ? JSON.parse(row.payload) : null,
    createdAt: row.created_at,
  };
}
