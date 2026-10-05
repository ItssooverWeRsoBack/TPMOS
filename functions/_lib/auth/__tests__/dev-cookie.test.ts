import { it, expect } from "vitest";
import { signDevCookie, getAuthenticatedEmail, DEV_COOKIE_NAME } from "../middleware";
it("authenticates dotted emails with the local signed cookie and rejects tampering", async () => {
  const value = await signDevCookie("first.last@example.com", "test-secret");
  const request = (cookie: string) => new Request("http://localhost/api/tpmos/me", { headers: { Cookie: `${DEV_COOKIE_NAME}=${cookie}` } });
  expect(await getAuthenticatedEmail(request(value), { ENV: "local", AUTH_SECRET: "test-secret" })).toBe("first.last@example.com");
  expect(await getAuthenticatedEmail(request(value + "x"), { ENV: "local", AUTH_SECRET: "test-secret" })).toBeNull();
  expect(await getAuthenticatedEmail(request(value), { ENV: "production", AUTH_SECRET: "test-secret" })).toBeNull();
});
