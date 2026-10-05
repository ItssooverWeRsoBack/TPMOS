import { DemoSettingsSchema, ConnectorTypeSchema, DemoArtifactSchema } from "../../../src/lib/tpmos/schemas/connector";
import { listEpics } from "../db/queries/epics";
import { generateId } from "../db/client";

export const DEMO_ISSUES = [
  { number: 42, title: "Improve planner validation", weeks: 2 },
  { number: 43, title: "Document quarterly planning API", weeks: 1 },
] as const;

export function isDemoConnector(config: { type: string; enabled: boolean; settings: unknown }) {
  return config.enabled && ConnectorTypeSchema.safeParse(config.type).success && DemoSettingsSchema.safeParse(config.settings).success;
}

/** Import bounded fixtures atomically; retain local edits on repeated imports. */
export async function syncDemo(db: D1Database, config: { id: string; type: string }, teamId: string, quarterId: string, actorId: string) {
  const statements: D1PreparedStatement[] = [];
  if (config.type !== "slack") {
    for (const issue of DEMO_ISSUES) {
      const externalId = `${config.type}:example/demo#${issue.number}`;
      statements.push(db.prepare(`INSERT INTO epics
        (id, team_id, quarter_id, title, description, dri_committed_weeks, sort_order, created_by, updated_by, connector_id, external_id)
        VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1000 FROM epics WHERE team_id = ? AND quarter_id = ?), ?, ?, ?, ?)
        ON CONFLICT(connector_id, team_id, quarter_id, external_id) DO NOTHING`)
        .bind(generateId("epic"), teamId, quarterId, issue.title, `Demo fixture ${externalId}. No provider request was made.`, issue.weeks, teamId, quarterId, actorId, actorId, config.id, externalId));
    }
  }
  const results = statements.length ? await db.batch(statements) : [];
  const synced = results.reduce((total, result) => total + result.meta.changes, 0);
  const epics = await listEpics(db, teamId, quarterId);
  const artifact = DemoArtifactSchema.parse(config.type === "slack"
    ? { kind: "notification", payload: { channel: "demo-planning", text: `Planning snapshot: ${epics.length} epics in ${quarterId}`, delivered: false } }
    : { kind: "status", payload: { provider: config.type, updates: epics.filter(e => e.connector_id === config.id).map(e => ({ externalId: e.external_id, status: e.status, percentComplete: e.percent_complete })), delivered: false } });
  await db.prepare(`INSERT INTO connector_demo_artifacts (connector_id, team_id, quarter_id, kind, payload)
    VALUES (?, ?, ?, ?, ?) ON CONFLICT(connector_id, team_id, quarter_id, kind)
    DO UPDATE SET payload = excluded.payload, updated_at = datetime('now')`)
    .bind(config.id, teamId, quarterId, artifact.kind, JSON.stringify(artifact.payload)).run();
  return { mode: "demo" as const, synced, existing: statements.length - synced, artifacts: [artifact] };
}
