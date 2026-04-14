/**
 * GET  /api/tpmos/interview-themes — list themes
 * POST /api/tpmos/interview-themes — create theme
 */

import { getAuth } from "../../../_lib/auth/context";
import { can } from "../../../_lib/auth/can";
import { listThemes, createTheme, toThemeResponse } from "../../../_lib/db/queries/interviews";
import { z } from "zod/v4";

const CreateThemeSchema = z.object({
  label: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

interface Env { DB: D1Database; ENV: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { user } = getAuth(context);
  const themes = await listThemes(context.env.DB, user.orgId);
  return Response.json(themes.map(toThemeResponse));
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { user, userTeamIds } = getAuth(context);
  if (!can(user, "conductInterview", {}, { userTeamIds })) {
    return Response.json({ error: { code: "FORBIDDEN", message: "TPM access required" } }, { status: 403 });
  }

  const body = CreateThemeSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: body.error.format() } },
      { status: 400 }
    );
  }

  const theme = await createTheme(context.env.DB, user.orgId, body.data.label, body.data.description);
  if (!theme) {
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create" } }, { status: 500 });
  }

  return Response.json(toThemeResponse(theme), { status: 201 });
};
