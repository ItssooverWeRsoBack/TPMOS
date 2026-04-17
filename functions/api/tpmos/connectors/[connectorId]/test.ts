/**
 * POST /api/tpmos/connectors/:connectorId/test — test connector connection
 */

import { getAuth } from "../../../../_lib/auth/context";
import { can } from "../../../../_lib/auth/can";
import { getConnectorById, toConnectorResponse } from "../../../../_lib/db/queries/connectors";
import GitHubConnector from "../../../../_lib/connectors/github/connector";
import LinearConnector from "../../../../_lib/connectors/linear/connector";
import SlackConnector from "../../../../_lib/connectors/slack/connector";
import type { ConnectorConfig } from "../../../../_lib/connectors/types";

interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageUsers", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const connectorId = context.params.connectorId as string;
  const row = await getConnectorById(context.env.DB, connectorId);
  if (!row) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Connector not found" } }, { status: 404 });
  }

  const config = toConnectorResponse(row) as unknown as ConnectorConfig;

  const connectors = { github: GitHubConnector, linear: LinearConnector, slack: SlackConnector };
  const connector = connectors[config.type as keyof typeof connectors];
  if (!connector) {
    return Response.json({ error: { code: "NOT_FOUND", message: `Unknown connector type: ${config.type}` } }, { status: 400 });
  }

  const result = await connector.testConnection(config);
  return Response.json(result);
};
