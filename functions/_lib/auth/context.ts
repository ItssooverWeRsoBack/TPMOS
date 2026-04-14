/**
 * Extract typed auth data from Pages Function context.
 * context.data is Record<string, unknown> by default — this helper adds type safety.
 */

export interface AuthUser {
  id: string;
  orgId: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface AuthContext {
  user: AuthUser;
  userTeamIds: string[];
}

export function getAuth(context: { data: Record<string, unknown> }): AuthContext {
  return {
    user: context.data.user as AuthUser,
    userTeamIds: (context.data.userTeamIds as string[]) ?? [],
  };
}
