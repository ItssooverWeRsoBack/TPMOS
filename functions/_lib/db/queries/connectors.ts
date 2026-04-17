import { query, first, run, generateId } from "../client";

interface ConnectorRow {
  id: string;
  org_id: string;
  type: string;
  name: string;
  enabled: number;
  credentials: string;
  settings: string;
  last_sync_at: string | null;
  last_sync_status: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  version: number;
}

export async function listConnectors(db: D1Database, orgId: string) {
  return query<ConnectorRow>(
    db,
    "SELECT * FROM connector_configs WHERE org_id = ? ORDER BY type, name",
    orgId
  );
}

export async function getConnectorById(db: D1Database, id: string) {
  return first<ConnectorRow>(db, "SELECT * FROM connector_configs WHERE id = ?", id);
}

export async function createConnector(
  db: D1Database,
  orgId: string,
  input: { type: string; name: string; credentials: Record<string, string>; settings: Record<string, unknown> },
  actorId: string
) {
  const id = generateId("conn");
  await run(
    db,
    `INSERT INTO connector_configs (id, org_id, type, name, credentials, settings, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, orgId, input.type, input.name,
    JSON.stringify(input.credentials), JSON.stringify(input.settings), actorId
  );
  return getConnectorById(db, id);
}

export async function updateConnector(
  db: D1Database,
  id: string,
  input: { enabled?: boolean; credentials?: Record<string, string>; settings?: Record<string, unknown> },
  actorId: string
) {
  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.enabled !== undefined) { updates.push("enabled = ?"); params.push(input.enabled ? 1 : 0); }
  if (input.credentials) { updates.push("credentials = ?"); params.push(JSON.stringify(input.credentials)); }
  if (input.settings) { updates.push("settings = ?"); params.push(JSON.stringify(input.settings)); }

  if (updates.length === 0) return getConnectorById(db, id);

  updates.push("updated_at = datetime('now')");
  updates.push("version = version + 1");
  params.push(id);

  await run(db, `UPDATE connector_configs SET ${updates.join(", ")} WHERE id = ?`, ...params);
  return getConnectorById(db, id);
}

export async function updateSyncStatus(db: D1Database, id: string, status: string) {
  await run(
    db,
    "UPDATE connector_configs SET last_sync_at = datetime('now'), last_sync_status = ? WHERE id = ?",
    status, id
  );
}

export function toConnectorResponse(row: ConnectorRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    type: row.type,
    name: row.name,
    enabled: row.enabled === 1,
    credentials: JSON.parse(row.credentials),
    settings: JSON.parse(row.settings),
    lastSyncAt: row.last_sync_at,
    lastSyncStatus: row.last_sync_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    version: row.version,
  };
}
