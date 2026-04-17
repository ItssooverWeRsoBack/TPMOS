/**
 * POST /api/tpmos/connectors/:connectorId/sync?team=...&quarter=... — sync epics from connector
 */

import { getAuth } from "../../../../_lib/auth/context";
import { can } from "../../../../_lib/auth/can";
import { getConnectorById, updateSyncStatus, toConnectorResponse } from "../../../../_lib/db/queries/connectors";
import { getTeamBySlug } from "../../../../_lib/db/queries/teams";
import { createEpic, toEpicResponse } from "../../../../_lib/db/queries/epics";
import GitHubConnector from "../../../../_lib/connectors/github/connector";
import LinearConnector from "../../../../_lib/connectors/linear/connector";
import type { ConnectorConfig } from "../../../../_lib/connectors/types";

interface Env { DB: D1Database; ENV: string; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageUsers", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const connectorId = context.params.connectorId as string;
  const url = new URL(context.request.url);
  const teamSlug = url.searchParams.get("team");
  const quarterId = url.searchParams.get("quarter");

  if (!teamSlug || !quarterId) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "team and quarter required" } }, { status: 400 });
  }

  const row = await getConnectorById(context.env.DB, connectorId);
  if (!row) {
    return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  const team = await getTeamBySlug(context.env.DB, user.orgId, teamSlug);
  if (!team) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Team not found" } }, { status: 404 });
  }

  const config = toConnectorResponse(row) as unknown as ConnectorConfig;
  const connectors = { github: GitHubConnector, linear: LinearConnector };
  const connector = connectors[config.type as keyof typeof connectors];

  if (!connector?.syncEpics) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Connector does not support epic sync" } }, { status: 400 });
  }

  try {
    const drafts = await connector.syncEpics(config, team.id, quarterId);
    const created = [];

    for (const draft of drafts) {
      const epic = await createEpic(
        context.env.DB,
        {
          teamId: team.id,
          quarterId,
          title: draft.title,
          description: draft.description ? `${draft.description}\n\n_Imported from [${draft.externalId}](${draft.externalUrl})_` : `_Imported from [${draft.externalId}](${draft.externalUrl})_`,
          driCommittedWeeks: draft.estimatedWeeks ?? 0,
        },
        user.id
      );
      if (epic) created.push(toEpicResponse(epic));
    }

    await updateSyncStatus(context.env.DB, connectorId, `synced ${created.length} epics`);

    return Response.json({
      synced: created.length,
      epics: created,
    });
  } catch (err) {
    await updateSyncStatus(context.env.DB, connectorId, `error: ${err}`);
    return Response.json({ error: { code: "INTERNAL_ERROR", message: `Sync failed: ${err}` } }, { status: 500 });
  }
};
