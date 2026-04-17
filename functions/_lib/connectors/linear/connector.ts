/**
 * Linear connector stub — Phase 3 implementation.
 *
 * Will sync Linear issues as epic drafts and push status updates.
 * Requires: Linear API key with read/write access.
 */

import type { Connector, ConnectorConfig, EpicDraft, EpicStatusUpdate, TpmosEvent } from "../types";

const LinearConnector: Connector = {
  type: "linear",
  name: "Linear",
  description: "Sync epics from Linear projects and push status updates.",

  async testConnection(config: ConnectorConfig) {
    // Phase 3: validate Linear API key
    // const res = await fetch("https://api.linear.app/graphql", {
    //   method: "POST",
    //   headers: { Authorization: config.credentials.apiKey, "Content-Type": "application/json" },
    //   body: JSON.stringify({ query: "{ viewer { id name } }" }),
    // });
    // return { ok: res.ok };
    return { ok: false, error: "Linear connector not yet implemented (Phase 3)" };
  },

  async syncEpics(config: ConnectorConfig, teamId: string, quarterId: string): Promise<EpicDraft[]> {
    // Phase 3: query Linear projects/cycles, map issues to EpicDraft
    return [];
  },

  async syncStatus(config: ConnectorConfig, update: EpicStatusUpdate): Promise<void> {
    // Phase 3: update Linear issue state based on epic status
  },

  async notify(config: ConnectorConfig, event: TpmosEvent): Promise<void> {
    // Phase 3: create Linear comment or update
  },
};

export default LinearConnector;
