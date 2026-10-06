import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { receiveGitHub } from "../github-webhook-receiver";
import { deriveWebhookSecret } from "../github-webhook-crypto";
import { createGitHubConnection } from "../../db/queries/github-webhooks";
import { onRequestPost as createHook, onRequestGet as listHooks } from "../../../api/tpmos/github-webhooks/index";
import { onRequestGet as getHook, onRequestPatch as patchHook } from "../../../api/tpmos/github-webhooks/[connectionId]";
import { createHmac } from "node:crypto";

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

const master = "test-master-key-at-least-thirty-two-characters";
async function connection() { return createGitHubConnection(db, "default", { repository: "example/practice", repositoryId: 42, teamId: "team-platform", quarterId: "default:2026Q2" }, "user-admin"); }
function event(action = "opened", title = "GitHub task", updatedAt = "2026-10-05T12:00:00Z") {
  return { action, repository: { id: 42, full_name: "example/practice" }, issue: { number: 7, title, body: "Acceptance criteria", state: action === "closed" ? "closed" : "open", updated_at: updatedAt, html_url: "https://github.com/example/practice/issues/7" } };
}
async function deliver(id: string, payload: unknown, deliveryId: string, eventName = "issues", overrideSecret?: string) {
  const secret = overrideSecret ?? await deriveWebhookSecret(master, id, 1); const raw = JSON.stringify(payload);
  return receiveGitHub(new Request(`https://receiver.example/github/${id}`, { method: "POST", headers: { "X-Hub-Signature-256": `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`, "X-GitHub-Delivery": deliveryId, "X-GitHub-Event": eventName }, body: raw }), { DB: db, WEBHOOK_MASTER_KEY: master });
}
function context(id = "", method = "GET", orgId = "default", role = "admin", body?: unknown, version?: number) {
  return { params: { connectionId: id }, env: { DB: db, ENV: "local", WEBHOOK_MASTER_KEY: master }, data: { user: { id: "user-admin", orgId, role }, userTeamIds: [] }, request: new Request("http://localhost/api/tpmos/github-webhooks", { method, headers: { "Content-Type": "application/json", ...(version ? { "If-Match": String(version) } : {}) }, body: body ? JSON.stringify(body) : undefined }) } as unknown as Parameters<typeof createHook>[0];
}
it("ping, issue creation, edits, close and reopen update one epic and preserve effort/ownership", async () => {
  const c = await connection();
  expect((await deliver(c.connector_id, { repository: event().repository }, "ping-1", "ping")).status).toBe(202);
  expect((await deliver(c.connector_id, event(), "event-1")).status).toBe(202);
  const epic = sqlite.prepare("SELECT * FROM epics WHERE connector_id = ?").get(c.connector_id);
  expect(epic).toMatchObject({ title: "GitHub task", status: "not_started", external_id: "github:42#7" });
  sqlite.prepare("UPDATE epics SET dri_committed_weeks = 5, dri_user_id = 'user-ic1' WHERE id = ?").run(epic.id);
  await deliver(c.connector_id, event("edited", "Renamed", "2026-10-05T12:01:00Z"), "event-2");
  await deliver(c.connector_id, event("closed", "Renamed", "2026-10-05T12:02:00Z"), "event-3");
  expect(sqlite.prepare("SELECT status, percent_complete FROM epics WHERE id = ?").get(epic.id)).toMatchObject({ status: "done", percent_complete: 100 });
  await deliver(c.connector_id, event("reopened", "Renamed", "2026-10-05T12:03:00Z"), "event-4");
  expect(sqlite.prepare("SELECT * FROM epics WHERE id = ?").get(epic.id)).toMatchObject({ title: "Renamed", status: "not_started", percent_complete: 0, dri_committed_weeks: 5, dri_user_id: "user-ic1" });
  expect(sqlite.prepare("SELECT COUNT(*) n FROM epics WHERE connector_id = ?").get(c.connector_id).n).toBe(1);
});
it("duplicate delivery does not increment epic version; older timestamps cannot overwrite", async () => {
  const c = await connection(); await deliver(c.connector_id, event(), "same-id");
  const replay = await deliver(c.connector_id, event(), "same-id"); expect(await replay.json()).toMatchObject({ duplicate: true });
  expect(sqlite.prepare("SELECT version FROM epics WHERE connector_id = ?").get(c.connector_id).version).toBe(1);
  await deliver(c.connector_id, event("edited", "New", "2026-10-05T13:00:00Z"), "new-id");
  const stale = await deliver(c.connector_id, event("closed", "Old", "2026-10-05T11:00:00Z"), "old-id");
  expect(await stale.json()).toMatchObject({ result: "stale" });
  expect(sqlite.prepare("SELECT title, status, version FROM epics WHERE connector_id = ?").get(c.connector_id)).toMatchObject({ title: "New", status: "not_started", version: 2 });
});
it("rejects invalid signatures, raw body changes, malformed payloads, mismatched repos, and disabled connections", async () => {
  const c = await connection();
  expect((await deliver(c.connector_id, event(), "bad-signature", "issues", "wrong")).status).toBe(401);
  expect((await deliver(c.connector_id, { ...event(), repository: { id: 99, full_name: "example/practice" } }, "wrong-repo")).status).toBe(403);
  expect((await deliver(c.connector_id, { ...event(), issue: {} }, "bad-json")).status).toBe(400);
  const raw = JSON.stringify(event()); const secret = await deriveWebhookSecret(master, c.connector_id, 1);
  const req = new Request(`https://receiver/github/${c.connector_id}`, { method: "POST", body: raw + " ", headers: { "X-Hub-Signature-256": `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}` } });
  expect((await receiveGitHub(req, { DB: db, WEBHOOK_MASTER_KEY: master })).status).toBe(401);
  sqlite.prepare("UPDATE github_webhook_connections SET enabled = 0 WHERE connector_id = ?").run(c.connector_id);
  expect((await deliver(c.connector_id, event(), "disabled")).status).toBe(404);
  expect(sqlite.prepare("SELECT COUNT(*) n FROM epics WHERE connector_id = ?").get(c.connector_id).n).toBe(0);
});
it("caps the request size, ignores unsupported events/actions, and restricts closed or foreign quarters", async () => {
  const c = await connection();
  expect((await deliver(c.connector_id, { repository: event().repository }, "push-1", "push")).status).toBe(202);
  expect((await deliver(c.connector_id, event("labeled"), "label-1")).status).toBe(202);
  const oversized = new Request(`https://receiver/github/${c.connector_id}`, { method: "POST", body: "x".repeat(262145) });
  expect((await receiveGitHub(oversized, { DB: db, WEBHOOK_MASTER_KEY: master })).status).toBe(413);
  sqlite.prepare("UPDATE quarters SET state = 'closed' WHERE id = 'default:2026Q2'").run();
  expect((await deliver(c.connector_id, event(), "closed-quarter")).status).toBe(409);
  expect(sqlite.prepare("SELECT COUNT(*) n FROM epics WHERE connector_id = ?").get(c.connector_id).n).toBe(0);
});
it("failed persistence rolls back the receipt, allowing successful redelivery", async () => {
  const c = await connection();
  sqlite.exec("CREATE TRIGGER fail_issue BEFORE INSERT ON epics BEGIN SELECT RAISE(ABORT, 'simulated failure'); END");
  expect((await deliver(c.connector_id, event(), "retry-id")).status).toBe(503);
  expect(sqlite.prepare("SELECT COUNT(*) n FROM github_webhook_deliveries WHERE connection_id = ?").get(c.connector_id).n).toBe(0);
  sqlite.exec("DROP TRIGGER fail_issue"); expect((await deliver(c.connector_id, event(), "retry-id")).status).toBe(202);
});
it("keeps the latest 100 summaries without storing raw payloads", async () => {
  const c = await connection();
  for (let i = 0; i < 105; i++) await deliver(c.connector_id, { repository: event().repository }, `ping-${i}`, "ping");
  expect(sqlite.prepare("SELECT COUNT(*) n FROM github_webhook_deliveries WHERE connection_id = ?").get(c.connector_id).n).toBe(100);
  expect(sqlite.prepare("SELECT COUNT(*) n FROM github_webhook_receipts WHERE connection_id = ?").get(c.connector_id).n).toBe(105);
  expect(await (await deliver(c.connector_id, { repository: event().repository }, "ping-0", "ping")).json()).toMatchObject({ duplicate: true });
  const response = await getHook(context(c.connector_id)); expect(response.status).toBe(200);
  const body = await response.json() as { deliveries: object[] }; expect(body.deliveries.length).toBe(50); expect(JSON.stringify(body)).not.toContain("secret_version");
});
it("admin creation and read contracts enforce organization scope and never redisplay secrets", async () => {
  const input = { repository: "example/practice", repositoryId: 42, teamId: "team-platform", quarterId: "default:2026Q2" };
  expect((await createHook(context("", "POST", "default", "ic", input))).status).toBe(403);
  expect((await createHook(context("", "POST", "other", "admin", input))).status).toBe(404);
  const created = await createHook(context("", "POST", "default", "admin", input)); expect(created.status).toBe(201);
  const setup = await created.json() as { connection: { id: string }; secret: string }; expect(setup.secret).toHaveLength(64);
  expect((await createHook(context("", "POST", "default", "admin", input))).status).toBe(409);
  expect((await getHook(context(setup.connection.id, "GET", "other"))).status).toBe(404);
  expect(JSON.stringify(await (await listHooks(context())).json())).not.toContain(setup.secret);
});
it("rotation and disabling require a matching version; old signatures fail", async () => {
  const c = await connection();
  expect((await patchHook(context(c.connector_id, "PATCH", "default", "admin", { rotateSecret: true }))).status).toBe(428);
  expect((await patchHook(context(c.connector_id, "PATCH", "default", "admin", { rotateSecret: true }, 1))).status).toBe(200);
  expect((await deliver(c.connector_id, event(), "old-secret")).status).toBe(401);
  expect((await patchHook(context(c.connector_id, "PATCH", "default", "admin", { enabled: false }, 1))).status).toBe(409);
  const newSecret = await deriveWebhookSecret(master, c.connector_id, 2);
  expect((await deliver(c.connector_id, event(), "rotated", "issues", newSecret)).status).toBe(202);
  expect((await patchHook(context(c.connector_id, "PATCH", "default", "admin", { enabled: false }, 2))).status).toBe(200);
});
