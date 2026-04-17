/**
 * JWKS-based JWT verification for Cloudflare Access tokens.
 *
 * Fetches the JWKS from the Access certs endpoint, caches keys for 1 hour,
 * and verifies RS256 JWT signatures using the Web Crypto API.
 */

interface JWK {
  kty: string;
  n: string;
  e: string;
  kid: string;
  alg?: string;
  use?: string;
}

interface JWKSResponse {
  keys: JWK[];
}

interface JWTPayload {
  email?: string;
  sub?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string[];
  [key: string]: unknown;
}

// Module-level cache for JWKS keys
let cachedKeys: Map<string, CryptoKey> = new Map();
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Verify a Cloudflare Access JWT and return the decoded payload.
 *
 * @param token - The raw JWT string (from CF_Authorization cookie)
 * @param teamDomain - The Cloudflare Access team domain (e.g., "mycompany")
 * @returns The decoded payload with email, or null if verification fails
 */
export async function verifyAccessJwt(
  token: string,
  teamDomain: string
): Promise<{ email: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode header to get kid
    const header = JSON.parse(base64UrlDecode(headerB64)) as {
      alg?: string;
      kid?: string;
    };

    if (header.alg !== "RS256") return null;
    if (!header.kid) return null;

    // Get the signing key
    const key = await getSigningKey(header.kid, teamDomain);
    if (!key) return null;

    // Verify signature
    const signedInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToArrayBuffer(signatureB64);

    const valid = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      signature,
      signedInput
    );

    if (!valid) return null;

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as JWTPayload;

    // Verify expiry
    if (payload.exp && payload.exp < Date.now() / 1000) return null;

    if (!payload.email) return null;

    return { email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Get a cached CryptoKey by kid, fetching JWKS if needed.
 */
async function getSigningKey(
  kid: string,
  teamDomain: string
): Promise<CryptoKey | null> {
  // Check cache
  if (Date.now() < cacheExpiry) {
    const cached = cachedKeys.get(kid);
    if (cached) return cached;
  }

  // Fetch fresh JWKS
  const jwksUrl = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;

  try {
    const res = await fetch(jwksUrl);
    if (!res.ok) return null;

    const jwks = (await res.json()) as JWKSResponse;
    if (!jwks.keys || !Array.isArray(jwks.keys)) return null;

    // Import all RSA keys
    const newKeys = new Map<string, CryptoKey>();

    for (const jwk of jwks.keys) {
      if (jwk.kty !== "RSA" || !jwk.kid) continue;

      try {
        const cryptoKey = await crypto.subtle.importKey(
          "jwk",
          {
            kty: jwk.kty,
            n: jwk.n,
            e: jwk.e,
            alg: "RS256",
            ext: true,
          },
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false,
          ["verify"]
        );
        newKeys.set(jwk.kid, cryptoKey);
      } catch {
        // Skip keys that fail to import
      }
    }

    // Update cache
    cachedKeys = newKeys;
    cacheExpiry = Date.now() + CACHE_TTL_MS;

    return newKeys.get(kid) ?? null;
  } catch {
    return null;
  }
}

/** Decode a base64url-encoded string to a UTF-8 string. */
function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

/** Decode a base64url-encoded string to an ArrayBuffer. */
function base64UrlToArrayBuffer(input: string): ArrayBuffer {
  const binary = base64UrlDecode(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
