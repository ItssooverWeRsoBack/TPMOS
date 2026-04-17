/**
 * Slack connector stub — Phase 3 implementation.
 *
 * Will post notifications to Slack channels on TPMOS events.
 * Requires: Slack Bot Token with chat:write scope.
 */

import type { Connector, ConnectorConfig, TpmosEvent } from "../types";

const SlackConnector: Connector = {
  type: "slack",
  name: "Slack",
  description: "Post notifications to Slack channels on epic status changes and risks.",

  async testConnection(config: ConnectorConfig) {
    // Phase 3: validate Slack Bot Token
    // const res = await fetch("https://slack.com/api/auth.test", {
    //   headers: { Authorization: `Bearer ${config.credentials.botToken}` },
    // });
    // const body = await res.json();
    // return { ok: body.ok, error: body.ok ? undefined : body.error };
    return { ok: false, error: "Slack connector not yet implemented (Phase 3)" };
  },

  async notify(config: ConnectorConfig, event: TpmosEvent): Promise<void> {
    // Phase 3: format event as Slack Block Kit message, post to channel
    // const message = formatSlackMessage(event);
    // await fetch("https://slack.com/api/chat.postMessage", {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${config.credentials.botToken}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     channel: config.settings.channel,
    //     ...message,
    //   }),
    // });
  },
};

export default SlackConnector;
