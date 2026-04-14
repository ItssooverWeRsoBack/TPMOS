/**
 * POST /api/tpmos/dev/login?email=tpm@example.com
 *
 * SECURITY: This route is HARD-GATED to ENV=local.
 * It returns 404 in production. The repo is PUBLIC.
 * Do NOT weaken this gate under any circumstances.
 *
 * Sets a signed HMAC cookie for local development auth.
 */

import { signDevCookie, DEV_COOKIE_NAME } from "../../../_lib/auth/middleware";

interface Env {
  ENV: string;
  AUTH_SECRET?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // HARD GATE — production returns 404, no exceptions
  if (context.env.ENV !== "local") {
    return new Response("Not Found", { status: 404 });
  }

  const url = new URL(context.request.url);
  const email = url.searchParams.get("email");

  if (!email || !email.includes("@")) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Valid email required as ?email= query param" } },
      { status: 400 }
    );
  }

  const secret = context.env.AUTH_SECRET ?? "dev-secret-not-for-production";
  const cookieValue = await signDevCookie(email, secret);

  return new Response(JSON.stringify({ ok: true, email }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${DEV_COOKIE_NAME}=${cookieValue}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
    },
  });
};

// Also support GET for easy browser-bar usage in dev
export const onRequestGet: PagesFunction<Env> = onRequestPost;
