/**
 * Slack connector — posts notifications to Slack channels.
 *
 * Credentials: { botToken: "xoxb-..." }
 * Settings: { channel: "#tpmos-updates", events: ["epic.statusChanged", "risk.flagged"] }
 */

import type { Connector, ConnectorConfig, TpmosEvent } from "../types";

const EVENT_EMOJIS: Record<string, string> = {
  "epic.created": "📝",
  "epic.statusChanged": "🔄",
  "epic.atRisk": "⚠️",
  "quarter.locked": "🔒",
  "quarter.closed": "✅",
  "risk.flagged": "🚨",
};

const SlackConnector: Connector = {
  type: "slack",
  name: "Slack",
  description: "Post notifications to Slack channels on epic status changes and risks.",

  async testConnection(config: ConnectorConfig) {
    const botToken = config.credentials.botToken;
    if (!botToken) return { ok: false, error: "No bot token provided" };

    try {
      const res = await fetch("https://slack.com/api/auth.test", {
        method: "POST",
        headers: { Authorization: `Bearer ${botToken}` },
      });
      const body = (await res.json()) as { ok: boolean; error?: string };
      return body.ok ? { ok: true } : { ok: false, error: body.error ?? "Auth failed" };
    } catch (err) {
      return { ok: false, error: `Connection failed: ${err}` };
    }
  },

  async notify(config: ConnectorConfig, event: TpmosEvent): Promise<void> {
    const botToken = config.credentials.botToken;
    const channel = (config.settings as { channel?: string }).channel;
    const allowedEvents = (config.settings as { events?: string[] }).events;

    if (!botToken || !channel) return;
    if (allowedEvents && !allowedEvents.includes(event.type)) return;

    const emoji = EVENT_EMOJIS[event.type] ?? "📋";
    const text = formatEvent(event);

    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${botToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        text: `${emoji} ${text}`,
        blocks: [
          { type: "section", text: { type: "mrkdwn", text: `${emoji} *${event.type}*\n${text}` } },
          { type: "context", elements: [{ type: "mrkdwn", text: `By ${event.actor.email} • ${new Date(event.timestamp).toLocaleString()}` }] },
        ],
      }),
    });
  },
};

function formatEvent(event: TpmosEvent): string {
  const p = event.payload;
  switch (event.type) {
    case "epic.created": return `New epic: *${p.title ?? ""}*`;
    case "epic.statusChanged": return `*${p.title ?? ""}* → *${p.status ?? ""}*`;
    case "epic.atRisk": return `⚠️ *${p.title ?? ""}* flagged at-risk`;
    case "quarter.locked": return `Quarter *${p.label ?? ""}* locked`;
    case "quarter.closed": return `Quarter *${p.label ?? ""}* closed`;
    case "risk.flagged": return `Risk: *${p.title ?? ""}*`;
    default: return `${event.type}`;
  }
}

export default SlackConnector;
