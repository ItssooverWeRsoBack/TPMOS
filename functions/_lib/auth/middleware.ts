/**
 * Auth helpers for Pages Functions middleware.
 *
 * Production: reads the CF_Authorization JWT cookie set by Cloudflare Access,
 *   decodes it to extract the user's email. Also checks the
 *   Cf-Access-Authenticated-User-Email header as a fallback.
 * Local dev: reads a signed HMAC cookie set by /api/tpmos/dev/login.
 */

import type { User } from "../../../src/lib/tpmos/schemas/user";
import { verifyAccessJwt } from "./jwks";

const COOKIE_NAME = "tpmos_dev_auth";
const ENCODER = new TextEncoder();

/** Extract the authenticated user's email from the request. */
export async function getAuthenticatedEmail(
  request: Request,
  env: { ENV: string; AUTH_SECRET?: string; CLOUDFLARE_ACCESS_TEAM?: string }
): Promise<string | null> {
  // Method 1: Cloudflare Access header (may not be present on Pages)
  const accessEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (accessEmail) return accessEmail;

  // Method 1.5: JWKS-verified CF_Authorization JWT (defense in depth)
  // Only attempted when CLOUDFLARE_ACCESS_TEAM env var is set and CF_Authorization cookie exists
  if (env.CLOUDFLARE_ACCESS_TEAM) {
    const cookieHeader = request.headers.get("Cookie");
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const cfToken = cookies["CF_Authorization"];
      if (cfToken) {
        try {
          const verified = await verifyAccessJwt(cfToken, env.CLOUDFLARE_ACCESS_TEAM);
          if (verified?.email) return verified.email;
        } catch {
          // Graceful degradation: fall through to decode-only approach
        }
      }
    }
  }

  // Method 2: Decode the CF_Authorization JWT cookie (set by Cloudflare Access)
  const cfAuthEmail = extractEmailFromAccessJwt(request);
  if (cfAuthEmail) return cfAuthEmail;

  // Method 3: Local dev — signed HMAC cookie
  if (env.ENV === "local") {
    return verifyDevCookie(request, env.AUTH_SECRET ?? "dev-secret-not-for-production");
  }

  return null;
}

/**
 * Extract email from the CF_Authorization JWT cookie.
 *
 * Cloudflare Access sets this cookie on every authenticated request.
 * The JWT payload contains an `email` field. We decode (but don't
 * cryptographically verify) because Cloudflare Access has already
 * verified the token at the edge — if the cookie exists and the
 * request reached our function, Access has approved it.
 *
 * For additional security, you can verify the JWT signature against
 * the Access JWKS endpoint. Skipped for MVP because Access is the
 * sole gateway — no other path reaches the function.
 */
function extractEmailFromAccessJwt(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  const token = cookies["CF_Authorization"];
  if (!token) return null;

  try {
    // JWT is three base64url segments: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode the payload (middle segment)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      email?: string;
      sub?: string;
      iat?: number;
      exp?: number;
    };

    // Check expiry
    if (payload.exp && payload.exp < Date.now() / 1000) return null;

    return payload.email ?? null;
  } catch {
    return null;
  }
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
