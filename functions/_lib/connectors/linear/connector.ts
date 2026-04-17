/**
 * Linear connector — syncs Linear issues as TPMOS epics.
 *
 * Credentials: { apiKey: "lin_api_..." }
 * Settings: { teamId: "linear-team-uuid" }
 */

import type { Connector, ConnectorConfig, EpicDraft, EpicStatusUpdate, TpmosEvent } from "../types";

interface LinearIssue {
  id: string;
  title: string;
  description: string | null;
  url: string;
  state: { name: string };
  estimate: number | null;
}

const LinearConnector: Connector = {
  type: "linear",
  name: "Linear",
  description: "Sync epics from Linear projects and push status updates.",

  async testConnection(config: ConnectorConfig) {
    const apiKey = config.credentials.apiKey;
    if (!apiKey) return { ok: false, error: "No API key provided" };

    try {
      const res = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: { Authorization: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ query: "{ viewer { id name email } }" }),
      });

      if (!res.ok) return { ok: false, error: `Linear API error: ${res.status}` };
      const body = (await res.json()) as { data?: { viewer?: { name: string } } };
      if (!body.data?.viewer) return { ok: false, error: "Invalid API key" };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: `Connection failed: ${err}` };
    }
  },

  async syncEpics(config: ConnectorConfig, teamId: string, quarterId: string): Promise<EpicDraft[]> {
    const apiKey = config.credentials.apiKey;
    const linearTeamId = (config.settings as { teamId?: string }).teamId;
    if (!apiKey || !linearTeamId) return [];

    try {
      const res = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: { Authorization: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query { team(id: "${linearTeamId}") { issues(first: 50, filter: { state: { type: { nin: ["completed", "canceled"] } } }) { nodes { id title description url state { name } estimate } } } }`,
        }),
      });

      if (!res.ok) return [];
      const body = (await res.json()) as { data?: { team?: { issues?: { nodes: LinearIssue[] } } } };
      return (body.data?.team?.issues?.nodes ?? []).map((issue) => ({
        title: issue.title,
        description: issue.description ?? undefined,
        externalId: `linear:${issue.id}`,
        externalUrl: issue.url,
        estimatedWeeks: issue.estimate ? issue.estimate / 5 : undefined,
      }));
    } catch {
      return [];
    }
  },

  async syncStatus(config: ConnectorConfig, update: EpicStatusUpdate): Promise<void> {},
  async notify(config: ConnectorConfig, event: TpmosEvent): Promise<void> {},
};

export default LinearConnector;
