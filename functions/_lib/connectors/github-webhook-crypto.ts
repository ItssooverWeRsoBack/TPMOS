const encoder = new TextEncoder();
async function key(secret: string, usages: KeyUsage[]) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);
}
export async function deriveWebhookSecret(master: string, connectionId: string, version: number) {
  const signature = await crypto.subtle.sign("HMAC", await key(master, ["sign"]), encoder.encode(`github-webhook:${connectionId}:${version}`));
  return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, "0")).join("");
}
export async function verifyGitHubSignature(secret: string, raw: Uint8Array<ArrayBuffer>, signature: string | null) {
  if (!signature || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;
  const bytes = Uint8Array.from(signature.slice(7).match(/../g)!, pair => parseInt(pair, 16));
  return crypto.subtle.verify("HMAC", await key(secret, ["verify"]), bytes, raw);
}
export async function boundedBody(request: Request, limit = 262144) {
  if (Number(request.headers.get("content-length")) > limit) throw new Error("Payload too large");
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
  try {
    for (;;) { const { value, done } = await reader.read(); if (done) break; total += value.length; if (total > limit) throw new Error("Payload too large"); chunks.push(value); }
  } catch (err) { await reader.cancel(); throw err; }
  const result = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; } return result;
}
