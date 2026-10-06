import { receiveGitHub, type GitHubReceiverEnv } from "../functions/_lib/connectors/github-webhook-receiver";
export default { async fetch(request: Request, env: GitHubReceiverEnv) {
  try { return await receiveGitHub(request, env); }
  catch { return Response.json({ error: "Receiver temporarily unavailable" }, { status: 503 }); }
} };
