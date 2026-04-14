/**
 * Pages Functions middleware for all /api/tpmos/* routes.
 *
 * Responsibilities:
 * 1. Extract authenticated email (Cloudflare Access or dev cookie)
 * 2. Load user from DB, auto-create with role='pending' if new
 * 3. Attach user to context.data.user
 * 4. Reject unauthenticated requests with 401
 */

import { getAuthenticatedEmail } from "../../_lib/auth/middleware";
import { getUserByEmail, createUser, touchLastSeen, toUserResponse } from "../../_lib/db/queries/users";
import { getUserTeamIds } from "../../_lib/db/queries/teams";

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

  // Load user from D1, auto-create if new
  let userRow = await getUserByEmail(env.DB, email);
  if (!userRow) {
    userRow = await createUser(env.DB, "default", email, "pending");
    if (!userRow) {
      return Response.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to create user" } },
        { status: 500 }
      );
    }
  }

  // Touch last seen (fire and forget — don't block the request)
  context.waitUntil(touchLastSeen(env.DB, userRow.id));

  // Load team memberships for authorization
  const userTeamIds = await getUserTeamIds(env.DB, userRow.id);

  // Attach user + auth context for downstream handlers
  const user = toUserResponse(userRow);
  context.data.user = user;
  context.data.userTeamIds = userTeamIds;

  // Continue to the route handler
  const response = await next();

  return response;
};
