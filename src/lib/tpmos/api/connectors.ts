import { apiUrl, handleResponse } from "./client";
import { CreateConnectorSchema, ConnectorResponseSchema, DemoSyncResponseSchema, type CreateConnectorInput } from "../schemas/connector";
import { z } from "zod/v4";
export async function fetchConnectors() {
  return z.array(ConnectorResponseSchema).parse(await handleResponse(await fetch(apiUrl("/connectors"), { credentials: "include" })));
}
export async function createDemoConnector(input: CreateConnectorInput) {
  return ConnectorResponseSchema.parse(await handleResponse(await fetch(apiUrl("/connectors"), { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(CreateConnectorSchema.parse(input)) })));
}
export async function testDemoConnector(id: string) {
  return z.object({ ok: z.boolean(), mode: z.literal("demo"), message: z.string() }).parse(await handleResponse(await fetch(apiUrl(`/connectors/${encodeURIComponent(id)}/test`), { method: "POST", credentials: "include" })));
}
export async function runDemoConnector(id: string, team: string, quarter: string) {
  const query = new URLSearchParams({ team, quarter });
  return DemoSyncResponseSchema.parse(await handleResponse(await fetch(apiUrl(`/connectors/${encodeURIComponent(id)}/sync?${query}`), { method: "POST", credentials: "include" })));
}
