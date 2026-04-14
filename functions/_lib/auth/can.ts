/**
 * Authorization helper — single enforcement point for all permission checks.
 *
 * Implements the permissions matrix from docs/DATA_MODEL.md.
 * This function is the test specification: every (role, action, ownership) combo
 * must have a corresponding test case in __tests__/can.test.ts.
 */

export type Action =
  | "createTeam"
  | "editTeam"
  | "archiveTeam"
  | "addMember"
  | "removeMember"
  | "createEpic"
  | "editEpic"
  | "setDriWeeks"
  | "voteOnEpic"
  | "updateStatus"
  | "lockPlan"
  | "closeQuarter"
  | "reopenQuarter"
  | "editCapacity"
  | "viewTeam"
  | "manageUsers"
  | "conductInterview"
  | "manageGoals";

interface AuthUser {
  role: string;
  id: string;
}

interface Resource {
  teamId?: string;
  driUserId?: string;
}

interface AuthContext {
  /** Team IDs the user is a member of */
  userTeamIds: string[];
}

function isOrgWide(role: string): boolean {
  return role === "admin" || role === "tpm";
}

function isOnTeam(ctx: AuthContext, teamId?: string): boolean {
  if (!teamId) return false;
  return ctx.userTeamIds.includes(teamId);
}

/**
 * Check if a user can perform an action on a resource.
 *
 * @param user - The authenticated user
 * @param action - The action to check
 * @param resource - Optional resource context (team, DRI)
 * @param ctx - Auth context with user's team memberships
 */
export function can(
  user: AuthUser,
  action: Action,
  resource: Resource = {},
  ctx: AuthContext = { userTeamIds: [] }
): boolean {
  const { role } = user;

  // Pending users can do nothing
  if (role === "pending") return false;

  // Admin can do everything
  if (role === "admin") return true;

  switch (action) {
    case "createTeam":
    case "archiveTeam":
      return isOrgWide(role);

    case "editTeam":
    case "addMember":
    case "removeMember":
      return isOrgWide(role) || (role === "em" && isOnTeam(ctx, resource.teamId));

    case "createEpic":
    case "editEpic":
    case "voteOnEpic":
    case "updateStatus":
      return isOrgWide(role) ||
        ((role === "em" || role === "ic") && isOnTeam(ctx, resource.teamId));

    case "setDriWeeks":
      return isOrgWide(role) ||
        (role === "em" && isOnTeam(ctx, resource.teamId)) ||
        (role === "ic" && resource.driUserId === user.id);

    case "lockPlan":
      return isOrgWide(role) || (role === "em" && isOnTeam(ctx, resource.teamId));

    case "closeQuarter":
      return isOrgWide(role);

    case "reopenQuarter":
      // Only admin (handled above)
      return false;

    case "editCapacity":
      return isOrgWide(role) || (role === "em" && isOnTeam(ctx, resource.teamId));

    case "viewTeam":
      // Everyone can view all teams (full transparency)
      return true;

    case "manageUsers":
      // Only admin (handled above)
      return false;

    case "conductInterview":
    case "manageGoals":
      return isOrgWide(role);

    default:
      return false;
  }
}
