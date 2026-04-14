/**
 * GET /api/tpmos/me
 *
 * Returns the authenticated user's profile and role.
 * User is attached by _middleware.ts.
 */

interface Env {
  DB: D1Database;
  ENV: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = context.data.user;

  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  return Response.json({ user });
};
