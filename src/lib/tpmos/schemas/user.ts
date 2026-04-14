import { z } from "zod/v4";

export const UserRoleSchema = z.enum([
  "admin",
  "tpm",
  "em",
  "ic",
  "exec",
  "pending",
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  role: UserRoleSchema,
  createdAt: z.string(),
  lastSeenAt: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

/** Roles that can manage teams and planning across the org */
export const ORG_WIDE_ROLES: readonly UserRole[] = ["admin", "tpm"] as const;

/** Roles that can view all data but not edit */
export const READ_ALL_ROLES: readonly UserRole[] = [
  "admin",
  "tpm",
  "em",
  "ic",
  "exec",
] as const;
