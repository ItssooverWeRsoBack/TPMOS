import { query, first, run, generateId } from "../client";

interface ReportRow {
  id: string;
  org_id: string;
  quarter_id: string;
  generated_at: string;
  generated_by: string;
  content: string;
  metadata: string | null;
}

export async function listReports(db: D1Database, orgId: string, quarterId: string) {
  return query<ReportRow>(
    db,
    "SELECT * FROM report_snapshots WHERE org_id = ? AND quarter_id = ? ORDER BY generated_at DESC",
    orgId, quarterId
  );
}

export async function getLatestReport(db: D1Database, orgId: string, quarterId: string) {
  return first<ReportRow>(
    db,
    "SELECT * FROM report_snapshots WHERE org_id = ? AND quarter_id = ? ORDER BY generated_at DESC LIMIT 1",
    orgId, quarterId
  );
}

export async function createReport(
  db: D1Database,
  orgId: string,
  quarterId: string,
  content: string,
  metadata: Record<string, unknown>,
  actorId: string
) {
  const id = generateId("rpt");
  await run(
    db,
    "INSERT INTO report_snapshots (id, org_id, quarter_id, content, metadata, generated_by) VALUES (?, ?, ?, ?, ?, ?)",
    id, orgId, quarterId, content, JSON.stringify(metadata), actorId
  );
  return first<ReportRow>(db, "SELECT * FROM report_snapshots WHERE id = ?", id);
}

export function toReportResponse(row: ReportRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    quarterId: row.quarter_id,
    generatedAt: row.generated_at,
    generatedBy: row.generated_by,
    content: row.content,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}
