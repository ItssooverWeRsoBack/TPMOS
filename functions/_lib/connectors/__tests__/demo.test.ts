import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { CreateConnectorSchema, ConnectorResponseSchema } from "../../../../src/lib/tpmos/schemas/connector";
import { syncDemo, isDemoConnector } from "../demo";
import { createConnector, toConnectorResponse } from "../../db/queries/connectors";
import { updateEpic } from "../../db/queries/epics";
import { onRequestPost as testConnector } from "../../../api/tpmos/connectors/[connectorId]/test";
import { onRequestPost as runConnector } from "../../../api/tpmos/connectors/[connectorId]/sync";
import { onRequestPost as createRoute } from "../../../api/tpmos/connectors/index";
import { onRequestPatch } from "../../../api/tpmos/epics/[epicId]";

// Exercise actual SQLite migrations and SQL, rather than matching SQL strings in mocks.
const { DatabaseSync } = require("node:sqlite");
let sqlite: InstanceType<typeof DatabaseSync>;
let db: D1Database;
beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  for (const file of readdirSync(resolve("migrations")).filter(f => /^\d+.*\.sql$/.test(f)).sort()) sqlite.exec(readFileSync(resolve("migrations", file), "utf8"));
  sqlite.exec(readFileSync(resolve("migrations/seed.sql"), "utf8"));
  db = { prepare(sql: string) {
    let params: unknown[] = [];
    const statement = {
      bind(...values: unknown[]) { params = values; return statement; },
      async first() { return sqlite.prepare(sql).get(...params) ?? null; },
      async all() { return { results: sqlite.prepare(sql).all(...params) }; },
      async run() { const result = sqlite.prepare(sql).run(...params); return { success: true, meta: { changes: Number(result.changes) } }; },
    }; return statement;
  }, async batch(statements: { run(): Promise<unknown> }[]) {
    sqlite.exec("BEGIN");
    try { const results = []; for (const s of statements) results.push(await s.run()); sqlite.exec("COMMIT"); return results; }
    catch (err) { sqlite.exec("ROLLBACK"); throw err; }
  } } as unknown as D1Database;
});
afterEach(() => { sqlite.close(); vi.unstubAllGlobals(); });
async function connector(type = "github", settings = { mode: "demo" }) {
  return (await createConnector(db, "default", { type, name: `${type}-demo`, credentials: {}, settings }, "user-admin"))!;
}
function context(id: string, path: string, orgId = "default", role = "admin", body?: string) {
  return { params: { connectorId: id, epicId: id }, env: { DB: db, ENV: "local" },
    request: new Request(`http://localhost${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body }),
    data: { user: { id: "user-admin", orgId, role }, userTeamIds: [] },
  } as unknown as Parameters<typeof testConnector>[0];
}

describe("demo integration boundaries", () => {
  it("accepts all three demo providers and round-trips the public contract", async () => {
    for (const type of ["github", "linear", "slack"]) {
      const input = CreateConnectorSchema.parse({ type, name: type, settings: { mode: "demo" } });
      expect(CreateConnectorSchema.parse(input)).toEqual(input);
      const row = await createConnector(db, "default", input, "user-admin");
      expect(ConnectorResponseSchema.parse(toConnectorResponse(row!)).credentials).toEqual({});
    }
    for (const input of [
      { type: "github", name: "live", settings: { mode: "live" } },
      { type: "github", name: "secret", settings: { mode: "demo" }, credentials: { token: "secret" } },
      { type: "notion", name: "unsupported", settings: { mode: "demo" } },
      { type: "slack", name: " ", settings: { mode: "demo" } },
    ]) expect(CreateConnectorSchema.safeParse(input).success).toBe(false);
  });
  it("deduplicates imports and preserves local edits, with zero outbound fetches", async () => {
    const fetch = vi.fn(() => { throw new Error("Unexpected provider request"); }); vi.stubGlobal("fetch", fetch);
    for (const type of ["github", "linear"]) {
      const row = await connector(type);
      const first = await syncDemo(db, row, "team-platform", "default:2026Q2", "user-admin");
      expect(first.synced).toBe(2);
      const epic = sqlite.prepare("SELECT * FROM epics WHERE connector_id = ? LIMIT 1").get(row.id);
      await updateEpic(db, epic.id, { title: "Local edit" }, "user-admin", epic.version);
      const second = await syncDemo(db, row, "team-platform", "default:2026Q2", "user-admin");
      expect(second).toMatchObject({ synced: 0, existing: 2 });
      expect(sqlite.prepare("SELECT title FROM epics WHERE id = ?").get(epic.id).title).toBe("Local edit");
      expect(second.artifacts[0].payload.delivered).toBe(false);
    }
    const slack = await connector("slack");
    const result = await syncDemo(db, slack, "team-platform", "default:2026Q2", "user-admin");
    expect(result).toMatchObject({ synced: 0, artifacts: [{ kind: "notification", payload: { delivered: false } }] });
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM connector_demo_artifacts").get().n).toBe(3);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("validates JSON, rejects credentials, and never returns stored secrets", async () => {
    const malformed = await createRoute(context("", "/api/tpmos/connectors", "default", "admin", "{"));
    expect(malformed.status).toBe(400);
    const response = await createRoute(context("", "/api/tpmos/connectors", "default", "admin", JSON.stringify({ type: "github", name: "created", settings: { mode: "demo" } })));
    expect(response.status).toBe(201); expect((await response.json() as { credentials: object }).credentials).toEqual({});
    const legacy = await createConnector(db, "default", { type: "linear", name: "legacy", credentials: { apiKey: "sensitive" }, settings: {} }, "user-admin");
    expect(JSON.stringify(toConnectorResponse(legacy!))).not.toContain("sensitive");
  });
  it("rejects unauthorized, other-organization, disabled, and live connectors", async () => {
    const row = await connector();
    expect((await testConnector(context(row.id, "/test", "default", "ic"))).status).toBe(403);
    expect((await testConnector(context(row.id, "/test", "other"))).status).toBe(404);
    expect((await testConnector(context(row.id, "/test"))).status).toBe(200);
    sqlite.prepare("UPDATE connector_configs SET enabled = 0 WHERE id = ?").run(row.id);
    expect((await testConnector(context(row.id, "/test"))).status).toBe(400);
    expect(isDemoConnector({ type: "github", enabled: true, settings: {} })).toBe(false);
    const live = await connector("linear", { mode: "live" });
    expect((await testConnector(context(live.id, "/test"))).status).toBe(400);
    expect((await runConnector(context(live.id, "/sync?team=platform&quarter=default:2026Q2"))).status).toBe(400);
  });
  it("validates scope and closed quarters before writes and runs the handler happy path", async () => {
    const row = await connector();
    expect((await runConnector(context(row.id, "/sync"))).status).toBe(400);
    expect((await runConnector(context(row.id, "/sync?team=missing&quarter=default:2026Q2"))).status).toBe(404);
    expect((await runConnector(context(row.id, "/sync?team=platform&quarter=default:2026Q1"))).status).toBe(409);
    sqlite.exec("INSERT INTO orgs(id, name) VALUES ('other', 'Other'); INSERT INTO quarters(id, org_id, label, start_date, end_date, state) VALUES ('other:Q2', 'other', 'Q2', '2026-04-01', '2026-06-30', 'active')");
    expect((await runConnector(context(row.id, "/sync?team=platform&quarter=other:Q2"))).status).toBe(404);
    const success = await runConnector(context(row.id, "/sync?team=platform&quarter=default:2026Q2"));
    expect(success.status).toBe(200); expect(await success.json()).toMatchObject({ mode: "demo", synced: 2 });
  });
  it("one concurrent epic update wins and the stale writer returns conflict", async () => {
    const epic = sqlite.prepare("SELECT * FROM epics LIMIT 1").get();
    const results = await Promise.all([updateEpic(db, epic.id, { title: "Writer A" }, "user-admin", epic.version), updateEpic(db, epic.id, { title: "Writer B" }, "user-admin", epic.version)]);
    expect(results.filter(r => r && "conflict" in r)).toHaveLength(1);
    expect(sqlite.prepare("SELECT version FROM epics WHERE id = ?").get(epic.id).version).toBe(epic.version + 1);
  });
  it("requires an explicit valid version for PATCH", async () => {
    const epic = sqlite.prepare("SELECT * FROM epics LIMIT 1").get();
    const ctx = context(epic.id, `/api/tpmos/epics/${epic.id}`, "default", "admin", JSON.stringify({ title: "Patch" }));
    expect((await onRequestPatch(ctx)).status).toBe(428);
  });
});
