/**
 * Auth helpers for Pages Functions middleware.
 *
 * Production: reads Cf-Access-Authenticated-User-Email header (set by Cloudflare Access).
 * Local dev:  reads a signed HMAC cookie set by /api/tpmos/dev/login.
 */

import type { User } from "../../../src/lib/tpmos/schemas/user";

const COOKIE_NAME = "tpmos_dev_auth";
const ENCODER = new TextEncoder();

/** Extract the authenticated user's email from the request. */
export async function getAuthenticatedEmail(
  request: Request,
  env: { ENV: string; AUTH_SECRET?: string }
): Promise<string | null> {
  // Production: Cloudflare Access injects this header after JWT verification
  const accessEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (accessEmail) return accessEmail;

  // Local dev: read signed HMAC cookie
  if (env.ENV === "local") {
    return verifyDevCookie(request, env.AUTH_SECRET ?? "dev-secret-not-for-production");
  }

  return null;
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

  const parts = value.split(".");
  if (parts.length !== 3) return null;

  const [email, timestamp, hmac] = parts;
  const payload = `${email}.${timestamp}`;

  // Verify HMAC
  const expectedHmac = await computeHmac(payload, secret);
  if (hmac !== expectedHmac) return null;

  // Check expiry (24 hours)
  const issued = parseInt(timestamp, 10);
  if (isNaN(issued) || Date.now() - issued > 24 * 60 * 60 * 1000) return null;

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

/**
 * Hardcoded user for M1 — replaced with real D1 lookup in M2.
 * TODO M2: Replace with actual DB query.
 */
export function getHardcodedUser(email: string): User {
  return {
    id: "dev-user-1",
    orgId: "default",
    email,
    displayName: email.split("@")[0],
    role: "tpm",
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };
}
