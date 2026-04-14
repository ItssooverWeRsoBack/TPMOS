/**
 * GET /api/tpmos/me
 *
 * Returns the authenticated user's profile, role, and team memberships.
 * User is attached by _middleware.ts from D1.
 */

import { getAuth } from "../../_lib/auth/context";

interface Env {
  DB: D1Database;
  ENV: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);

  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  return Response.json({ user, teamIds: userTeamIds });
};
