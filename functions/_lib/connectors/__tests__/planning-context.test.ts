import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { onRequestGet as planningContext } from "../../../api/tpmos/planning-context";
import { onRequestPost as addMember, onRequestGet as getMembers } from "../../../api/tpmos/teams/[teamId]/members";
import { resolvePlanningQuarter } from "../../../../src/lib/tpmos/domain/planning-context";
import type { PlanningQuarter } from "../../../../src/lib/tpmos/schemas/planning-context";
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

function context(orgId = "default", role = "admin", targetUser?: string) {
  return { env: { DB: db, ENV: "local" }, params: { teamId: "team-platform" }, data: { user: { id: "user-admin", orgId, role }, userTeamIds: [] }, request: new Request("http://localhost/api/tpmos/planning-context?team=platform", { method: targetUser ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: targetUser ? JSON.stringify({ userId: targetUser, teamRole: "member" }) : undefined }) } as unknown as Parameters<typeof planningContext>[0];
}
it("reproduces the saved-capacity versus webhook-quarter mismatch and selects the imported-issue target", async () => {
  sqlite.exec(`INSERT INTO connector_configs(id,org_id,type,name,created_by) VALUES ('ghhook-test','default','github','test','user-admin');
    INSERT INTO github_webhook_connections(connector_id,org_id,repository_id,repository_name,team_id,quarter_id) VALUES ('ghhook-test','default',42,'owner/repo','team-platform','default:2026Q3');
    INSERT INTO epics(id,team_id,quarter_id,title,sort_order,created_by,updated_by) VALUES ('imported','team-platform','default:2026Q3','Webhook demo issue',1,'user-admin','user-admin');`);
  const response = await planningContext(context()); expect(response.status).toBe(200);
  const result = await response.json() as { teamId: string; quarters: PlanningQuarter[] };
  expect(result.teamId).toBe("team-platform");
  expect(result.quarters.find(q => q.id === "default:2026Q2")).toMatchObject({ hasCapacity: true, hasWebhook: false });
  expect(result.quarters.find(q => q.id === "default:2026Q3")).toMatchObject({ hasWebhook: true, epicCount: 1 });
  expect(resolvePlanningQuarter(result.quarters, null)).toBe("default:2026Q3");
  expect(resolvePlanningQuarter(result.quarters, "default:2026Q2")).toBe("default:2026Q2");
});
it("scopes context and membership reads to the authenticated organization and rejects pending users", async () => {
  expect((await planningContext(context("other"))).status).toBe(404);
  expect((await planningContext(context("default", "pending"))).status).toBe(403);
  expect((await getMembers(context("other"))).status).toBe(404);
  expect((await getMembers(context("default", "pending"))).status).toBe(403);
});
it("lets an administrator add their existing account without creating a new user or changing capacity", async () => {
  const count = sqlite.prepare("SELECT COUNT(*) n FROM users").get().n;
  const capacity = sqlite.prepare("SELECT * FROM capacity_plans WHERE team_id='team-platform' AND quarter_id='default:2026Q2'").get();
  const response = await addMember(context("default", "admin", "user-admin")); expect(response.status).toBe(201);
  expect(sqlite.prepare("SELECT COUNT(*) n FROM users").get().n).toBe(count);
  expect(sqlite.prepare("SELECT * FROM capacity_plans WHERE team_id='team-platform' AND quarter_id='default:2026Q2'").get()).toEqual(capacity);
  expect(sqlite.prepare("SELECT user_id FROM team_members WHERE team_id='team-platform' AND user_id='user-admin'").get().user_id).toBe("user-admin");
});
it("rejects unauthorized additions and target accounts belonging to another organization", async () => {
  expect((await addMember(context("default", "ic", "user-admin"))).status).toBe(403);
  sqlite.exec("INSERT INTO orgs(id,name) VALUES ('other','Other'); INSERT INTO users(id,org_id,email,role) VALUES ('other-user','other','other@example.test','ic')");
  expect((await addMember(context("default", "admin", "other-user"))).status).toBe(404);
  expect((await addMember(context("other", "admin", "user-admin"))).status).toBe(404);
});
