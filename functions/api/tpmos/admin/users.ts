/**
 * GET   /api/tpmos/admin/users — list all users
 * PATCH /api/tpmos/admin/users?userId=...&role=... — update user role
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { listUsers, updateUserRole, toUserResponse } from "../../../_lib/db/queries/users";
import { UserRoleSchema } from "../../../../src/lib/tpmos/schemas/user";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);

  if (!can(user, "manageUsers", {}, { userTeamIds })) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 }
    );
  }

  const users = await listUsers(context.env.DB, user.orgId);
  return Response.json(users.map(toUserResponse));
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);

  if (!can(user, "manageUsers", {}, { userTeamIds })) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 }
    );
  }

  const body = (await context.request.json()) as { userId?: string; role?: string };

  if (!body.userId || !body.role) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "userId and role required" } },
      { status: 400 }
    );
  }

  const roleResult = UserRoleSchema.safeParse(body.role);
  if (!roleResult.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid role" } },
      { status: 400 }
    );
  }

  const updated = await updateUserRole(context.env.DB, body.userId, roleResult.data);
  if (!updated) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }

  return Response.json(toUserResponse(updated));
};
