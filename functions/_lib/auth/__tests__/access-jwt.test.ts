import { it, expect, vi, afterEach } from "vitest";
import { verifyAccessJwt } from "../jwks";
import { getAuthenticatedEmail } from "../middleware";
import { generateKeyPairSync, createSign } from "node:crypto";
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = publicKey.export({ format: "jwk" });
const now = Math.floor(Date.now() / 1000);
function token(overrides: object = {}, badSignature = false) {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test-key" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ email: "admin@example.com", iss: "https://test-team.cloudflareaccess.com", aud: ["app-audience"], exp: now + 600, ...overrides })).toString("base64url");
  const input = `${header}.${payload}`; const signature = createSign("RSA-SHA256").update(input).sign(privateKey).toString("base64url");
  return `${input}.${badSignature ? signature.slice(0, -4) + "aaaa" : signature}`;
}
afterEach(() => vi.unstubAllGlobals());
it("verifies signature, audience, issuer, expiry and not-before", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ keys: [{ ...jwk, kid: "test-key" }] })));
  expect(await verifyAccessJwt(token(), "test-team", "app-audience")).toEqual({ email: "admin@example.com" });
  for (const overrides of [{ aud: ["other-app"] }, { iss: "https://other-team.cloudflareaccess.com" }, { exp: now - 1 }, { exp: undefined }, { nbf: now + 1000 }]) expect(await verifyAccessJwt(token(overrides), "test-team", "app-audience")).toBeNull();
  expect(await verifyAccessJwt(token({}, true), "test-team", "app-audience")).toBeNull();
});
it("production rejects identity headers and unsigned cookies but accepts verified assertions", async () => {
  const env = { ENV: "production", CLOUDFLARE_ACCESS_TEAM: "test-team", CLOUDFLARE_ACCESS_AUD: "app-audience" };
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ keys: [{ ...jwk, kid: "test-key" }] })));
  expect(await getAuthenticatedEmail(new Request("https://app", { headers: { "Cf-Access-Authenticated-User-Email": "admin@example.com" } }), env)).toBeNull();
  expect(await getAuthenticatedEmail(new Request("https://app", { headers: { Cookie: `CF_Authorization=${token({}, true)}` } }), env)).toBeNull();
  expect(await getAuthenticatedEmail(new Request("https://app", { headers: { "Cf-Access-Jwt-Assertion": token() } }), env)).toBe("admin@example.com");
});
