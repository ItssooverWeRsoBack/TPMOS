/**
 * GitHub connector stub — Phase 3 implementation.
 *
 * Will sync GitHub Issues as epic drafts and push status updates.
 * Requires: GitHub App or PAT with repo access.
 */

import type { Connector, ConnectorConfig, EpicDraft, EpicStatusUpdate, TpmosEvent } from "../types";

const GitHubConnector: Connector = {
  type: "github",
  name: "GitHub",
  description: "Sync epics from GitHub Issues and push status updates.",

  async testConnection(config: ConnectorConfig) {
    // Phase 3: validate GitHub PAT or App token
    // const res = await fetch("https://api.github.com/user", {
    //   headers: { Authorization: `Bearer ${config.credentials.token}` },
    // });
    // return { ok: res.ok };
    return { ok: false, error: "GitHub connector not yet implemented (Phase 3)" };
  },

  async syncEpics(config: ConnectorConfig, teamId: string, quarterId: string): Promise<EpicDraft[]> {
    // Phase 3: fetch issues from configured repo, map to EpicDraft
    // const issues = await fetchGitHubIssues(config.credentials.token, config.settings.repo);
    // return issues.map(issueToEpicDraft);
    return [];
  },

  async syncStatus(config: ConnectorConfig, update: EpicStatusUpdate): Promise<void> {
    // Phase 3: update GitHub issue labels/status based on epic status
    // await updateGitHubIssue(config.credentials.token, update);
  },

  async notify(config: ConnectorConfig, event: TpmosEvent): Promise<void> {
    // Phase 3: post comment on related issue
  },
};

export default GitHubConnector;
