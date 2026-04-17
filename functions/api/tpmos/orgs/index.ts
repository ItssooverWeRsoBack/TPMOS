/**
 * GET  /api/tpmos/orgs — list orgs the user belongs to
 * POST /api/tpmos/orgs — create a new org (admin only)
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { getUserOrgs, createOrg, toOrgResponse } from "../../../_lib/db/queries/orgs";
import { createUser, toUserResponse } from "../../../_lib/db/queries/users";
import { z } from "zod/v4";

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user } = getAuth(context);
  const orgs = await getUserOrgs(context.env.DB, user.id);
  return Response.json(orgs.map(toOrgResponse));
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "manageUsers", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  }

  const body = z.object({ name: z.string().min(1).max(100) }).safeParse(await context.request.json());
  if (!body.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "name required" } }, { status: 400 });
  }

  const org = await createOrg(context.env.DB, body.data.name);
  if (!org) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create org" } }, { status: 500 });
  }

  // Create the current user in the new org as admin
  await createUser(context.env.DB, org.id, user.email, "admin");

  return Response.json(toOrgResponse(org), { status: 201 });
};
