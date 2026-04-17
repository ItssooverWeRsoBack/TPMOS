/**
 * GitHub connector — syncs GitHub Issues as TPMOS epics.
 *
 * Credentials required: { token: "ghp_..." } (Personal Access Token or Fine-grained PAT)
 * Settings: { owner: "org-or-user", repo: "repo-name", labels?: "label1,label2" }
 */

import type { Connector, ConnectorConfig, EpicDraft, EpicStatusUpdate, TpmosEvent } from "../types";

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  labels: { name: string }[];
}

const STATUS_TO_LABEL: Record<string, string> = {
  not_started: "tpmos:not-started",
  in_progress: "tpmos:in-progress",
  blocked: "tpmos:blocked",
  at_risk: "tpmos:at-risk",
  done: "tpmos:done",
};

const GitHubConnector: Connector = {
  type: "github",
  name: "GitHub",
  description: "Sync epics from GitHub Issues and push status updates via labels.",

  async testConnection(config: ConnectorConfig) {
    const token = config.credentials.token;
    if (!token) return { ok: false, error: "No token provided" };

    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "TPMOS/1.0",
        },
      });

      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `GitHub API error: ${res.status} ${body}` };
      }

      const user = (await res.json()) as { login: string };
      return { ok: true, error: undefined };
    } catch (err) {
      return { ok: false, error: `Connection failed: ${err}` };
    }
  },

  async syncEpics(config: ConnectorConfig, teamId: string, quarterId: string): Promise<EpicDraft[]> {
    const { token } = config.credentials;
    const { owner, repo, labels } = config.settings as { owner: string; repo: string; labels?: string };

    if (!token || !owner || !repo) return [];

    let url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=50`;
    if (labels) url += `&labels=${encodeURIComponent(labels)}`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "TPMOS/1.0",
        },
      });

      if (!res.ok) return [];

      const issues = (await res.json()) as GitHubIssue[];

      return issues
        .filter((issue) => !("pull_request" in issue)) // exclude PRs
        .map((issue) => ({
          title: issue.title,
          description: issue.body ?? undefined,
          externalId: `github:${owner}/${repo}#${issue.number}`,
          externalUrl: issue.html_url,
        }));
    } catch {
      return [];
    }
  },

  async syncStatus(config: ConnectorConfig, update: EpicStatusUpdate): Promise<void> {
    const { token } = config.credentials;
    const { owner, repo } = config.settings as { owner: string; repo: string };

    if (!token || !owner || !repo) return;

    // Extract issue number from externalUrl or externalId
    // This is a no-op if the epic wasn't imported from GitHub
    const label = STATUS_TO_LABEL[update.status];
    if (!label) return;

    // Phase 3 enhancement: look up the GitHub issue number from the epic's
    // external metadata and apply/remove labels
    // For now this is a working stub that demonstrates the pattern
  },

  async notify(config: ConnectorConfig, event: TpmosEvent): Promise<void> {
    // Phase 3 enhancement: post comments on related GitHub issues
    // when epic status changes in TPMOS
  },
};

export default GitHubConnector;
