import { getAuth } from "../auth/context";
import { can } from "../auth/can";
export interface GitHubAdminEnv { DB: D1Database; ENV: string; WEBHOOK_MASTER_KEY?: string; WEBHOOK_RECEIVER_URL?: string; }
export function githubAdmin(context: { data: Record<string, unknown>; env: GitHubAdminEnv }) {
  const auth = getAuth(context);
  if (!can(auth.user, "manageUsers", {}, { userTeamIds: auth.userTeamIds })) return { error: Response.json({ error: { code: "FORBIDDEN", message: "Administrator access required" } }, { status: 403 }) };
  if (!context.env.WEBHOOK_MASTER_KEY || context.env.WEBHOOK_MASTER_KEY.length < 32) return { error: Response.json({ error: { code: "NOT_CONFIGURED", message: "Webhook receiver has not been configured" } }, { status: 503 }) };
  return { auth, master: context.env.WEBHOOK_MASTER_KEY, receiver: context.env.WEBHOOK_RECEIVER_URL ?? "https://tpmos-github-webhooks.torfinnolsen.workers.dev" };
}
