/**
 * Connector interface — the abstraction layer for external integrations.
 *
 * Each connector lives in its own directory under connectors/.
 * Phase 2 provides the interface + stubs. Phase 3 implements them.
 *
 * Connectors are triggered by:
 * - Manual invocation from the UI
 * - Cloudflare Cron Triggers (Phase 3)
 * - Webhook receivers (Phase 3)
 */

export interface EpicDraft {
  title: string;
  description?: string;
  definitionOfDone?: string;
  externalId: string;
  externalUrl: string;
  estimatedWeeks?: number;
}

export interface EpicStatusUpdate {
  epicId: string;
  status: "not_started" | "in_progress" | "blocked" | "at_risk" | "done";
  percentComplete?: number;
  externalUrl?: string;
}

export interface TpmosEvent {
  type:
    | "epic.created"
    | "epic.updated"
    | "epic.statusChanged"
    | "epic.atRisk"
    | "quarter.locked"
    | "quarter.closed"
    | "team.created"
    | "risk.flagged";
  timestamp: string;
  actor: { id: string; email: string };
  payload: Record<string, unknown>;
}

export interface ConnectorConfig {
  id: string;
  type: ConnectorType;
  enabled: boolean;
  credentials: Record<string, string>;
  settings: Record<string, unknown>;
}

export type ConnectorType = "github" | "linear" | "notion" | "slack";

export interface Connector {
  type: ConnectorType;
  name: string;
  description: string;

  /** Test that the connector's credentials are valid */
  testConnection(config: ConnectorConfig): Promise<{ ok: boolean; error?: string }>;

  /** Import epics from the external system */
  syncEpics?(config: ConnectorConfig, teamId: string, quarterId: string): Promise<EpicDraft[]>;

  /** Push status updates to the external system */
  syncStatus?(config: ConnectorConfig, update: EpicStatusUpdate): Promise<void>;

  /** Send a notification to the external system */
  notify?(config: ConnectorConfig, event: TpmosEvent): Promise<void>;
}

/** Registry of available connectors */
export function getConnector(type: ConnectorType): Connector {
  switch (type) {
    case "github":
      return require("./github/connector").default;
    case "linear":
      return require("./linear/connector").default;
    case "slack":
      return require("./slack/connector").default;
    default:
      throw new Error(`Unknown connector type: ${type}`);
  }
}
