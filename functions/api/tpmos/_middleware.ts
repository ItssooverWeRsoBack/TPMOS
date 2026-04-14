/**
 * Pages Functions middleware for all /api/tpmos/* routes.
 *
 * Responsibilities:
 * 1. Extract authenticated email (Cloudflare Access or dev cookie)
 * 2. Load user from DB (M2; hardcoded for M1)
 * 3. Attach user to context.data.user
 * 4. Reject unauthenticated requests with 401
 * 5. Add CORS headers for same-origin requests
 */

import { getAuthenticatedEmail, getHardcodedUser } from "../../_lib/auth/middleware";

interface Env {
  DB: D1Database;
  AI: Ai;
  ENV: string;
  AUTH_SECRET?: string;
  AI_PROVIDER: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;

  // Skip auth for the dev login endpoint itself
  const url = new URL(request.url);
  if (url.pathname.endsWith("/dev/login")) {
    return next();
  }

  // Extract email from auth headers
  const email = await getAuthenticatedEmail(request, env);
  if (!email) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  // TODO M2: Replace getHardcodedUser with real D1 lookup:
  // const user = await getUserByEmail(env.DB, email);
  // if (!user) { auto-create with role='pending' }
  const user = getHardcodedUser(email);

  // Attach user to context for downstream handlers
  context.data.user = user;

  // Continue to the route handler
  const response = await next();

  // Add standard headers
  response.headers.set("X-TPMOS-User", email);

  return response;
};
