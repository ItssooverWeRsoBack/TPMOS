import { query, first, run, generateId } from "../client";

interface InterviewRow {
  id: string;
  org_id: string;
  lead_user_id: string;
  conducted_by_user_id: string;
  conducted_at: string;
  q1_scope: string | null;
  q2_challenges: string | null;
  q3_must_know: string | null;
  q4_blue_sky: string | null;
  ai_synthesis: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

interface ThemeRow {
  id: string;
  org_id: string;
  label: string;
  description: string | null;
}

export async function listInterviews(db: D1Database, orgId: string) {
  return query<InterviewRow & { lead_name: string | null; lead_email: string }>(
    db,
    `SELECT i.*, u.display_name as lead_name, u.email as lead_email
     FROM interviews i
     JOIN users u ON u.id = i.lead_user_id
     WHERE i.org_id = ?
     ORDER BY i.conducted_at DESC`,
    orgId
  );
}

export async function getInterviewById(db: D1Database, id: string) {
  return first<InterviewRow>(db, "SELECT * FROM interviews WHERE id = ?", id);
}

export async function createInterview(
  db: D1Database,
  orgId: string,
  input: {
    leadUserId: string;
    conductedAt: string;
    q1Scope?: string;
    q2Challenges?: string;
    q3MustKnow?: string;
    q4BlueSky?: string;
    notes?: string;
  },
  actorId: string
) {
  const id = generateId("intv");
  await run(
    db,
    `INSERT INTO interviews (id, org_id, lead_user_id, conducted_by_user_id, conducted_at, q1_scope, q2_challenges, q3_must_know, q4_blue_sky, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, orgId, input.leadUserId, actorId, input.conductedAt,
    input.q1Scope ?? null, input.q2Challenges ?? null,
    input.q3MustKnow ?? null, input.q4BlueSky ?? null,
    input.notes ?? null
  );
  return getInterviewById(db, id);
}

export async function updateInterviewSynthesis(db: D1Database, id: string, synthesis: string) {
  await run(
    db,
    "UPDATE interviews SET ai_synthesis = ?, updated_at = datetime('now') WHERE id = ?",
    synthesis, id
  );
  return getInterviewById(db, id);
}

export async function listThemes(db: D1Database, orgId: string) {
  return query<ThemeRow>(db, "SELECT * FROM interview_themes WHERE org_id = ? ORDER BY label", orgId);
}

export async function createTheme(db: D1Database, orgId: string, label: string, description?: string) {
  const id = generateId("theme");
  await run(
    db,
    "INSERT OR IGNORE INTO interview_themes (id, org_id, label, description) VALUES (?, ?, ?, ?)",
    id, orgId, label, description ?? null
  );
  return first<ThemeRow>(db, "SELECT * FROM interview_themes WHERE org_id = ? AND label = ?", orgId, label);
}

export async function tagInterviewTheme(
  db: D1Database,
  interviewId: string,
  themeId: string,
  question: string,
  userId: string
) {
  await run(
    db,
    "INSERT OR IGNORE INTO interview_theme_tags (interview_id, theme_id, question, tagged_by_user_id) VALUES (?, ?, ?, ?)",
    interviewId, themeId, question, userId
  );
}

export async function getInterviewThemeTags(db: D1Database, interviewId: string) {
  return query<{ theme_id: string; question: string; label: string }>(
    db,
    `SELECT itt.theme_id, itt.question, it.label
     FROM interview_theme_tags itt
     JOIN interview_themes it ON it.id = itt.theme_id
     WHERE itt.interview_id = ?`,
    interviewId
  );
}

export function toInterviewResponse(row: InterviewRow & { lead_name?: string | null; lead_email?: string }) {
  return {
    id: row.id,
    orgId: row.org_id,
    leadUserId: row.lead_user_id,
    conductedByUserId: row.conducted_by_user_id,
    conductedAt: row.conducted_at,
    q1Scope: row.q1_scope,
    q2Challenges: row.q2_challenges,
    q3MustKnow: row.q3_must_know,
    q4BlueSky: row.q4_blue_sky,
    aiSynthesis: row.ai_synthesis,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    ...(row.lead_name !== undefined && { leadName: row.lead_name }),
    ...(row.lead_email !== undefined && { leadEmail: row.lead_email }),
  };
}

export function toThemeResponse(row: ThemeRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    label: row.label,
    description: row.description,
  };
}
