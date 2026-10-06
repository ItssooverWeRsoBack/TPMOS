/**
 * Auth helpers for Pages Functions middleware.
 *
 * Production: reads the CF_Authorization JWT cookie set by Cloudflare Access,
 *   verifies signature, issuer, audience and expiration. Unverified headers are rejected.
 * Local dev: reads a signed HMAC cookie set by /api/tpmos/dev/login.
 */

import { verifyAccessJwt } from "./jwks";

const COOKIE_NAME = "tpmos_dev_auth";
const ENCODER = new TextEncoder();

/** Extract the authenticated user's email from the request. */
export async function getAuthenticatedEmail(
  request: Request,
  env: { ENV: string; AUTH_SECRET?: string; CLOUDFLARE_ACCESS_TEAM?: string; CLOUDFLARE_ACCESS_AUD?: string }
): Promise<string | null> {
  if (env.ENV === "local") {
    const fixture = request.headers.get("Cf-Access-Authenticated-User-Email");
    return fixture || verifyDevCookie(request, env.AUTH_SECRET ?? "dev-secret-not-for-production");
  }
  if (!env.CLOUDFLARE_ACCESS_TEAM || !env.CLOUDFLARE_ACCESS_AUD) return null;
  const token = request.headers.get("Cf-Access-Jwt-Assertion") || parseCookies(request.headers.get("Cookie") ?? "")["CF_Authorization"];
  if (!token) return null;
  return (await verifyAccessJwt(token, env.CLOUDFLARE_ACCESS_TEAM, env.CLOUDFLARE_ACCESS_AUD))?.email ?? null;
}

/** Sign a dev auth cookie value: email.timestamp.hmac */
export async function signDevCookie(
  email: string,
  secret: string
): Promise<string> {
  const timestamp = Date.now().toString();
  const payload = `${email}.${timestamp}`;
  const hmac = await computeHmac(payload, secret);
  return `${payload}.${hmac}`;
}

/** Verify a dev auth cookie and return the email, or null if invalid/expired. */
async function verifyDevCookie(
  request: Request,
  secret: string
): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  const value = cookies[COOKIE_NAME];
  if (!value) return null;

  // Emails can contain periods; only the final two segments are metadata.
  const parts = value.split(".");
  if (parts.length < 3) return null;
  const hmac = parts.pop()!;
  const timestamp = parts.pop()!;
  const email = parts.join(".");
  if (!email.includes("@") || !/^\d+$/.test(timestamp)) return null;
  const payload = `${email}.${timestamp}`;

  // Verify HMAC
  const expectedHmac = await computeHmac(payload, secret);
  if (hmac !== expectedHmac) return null;

  // Check expiry (24 hours)
  const issued = parseInt(timestamp, 10);
  if (isNaN(issued) || issued > Date.now() || Date.now() - issued > 24 * 60 * 60 * 1000) return null;

  return email;
}

async function computeHmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, ENCODER.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseCookies(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key) result[key.trim()] = rest.join("=").trim();
  }
  return result;
}

export const DEV_COOKIE_NAME = COOKIE_NAME;
