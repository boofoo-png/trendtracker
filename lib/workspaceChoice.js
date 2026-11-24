// Which workspace (business) is active, when a user belongs to more than one.
// Remembered in a cookie so the browser and the server agree. It isn't a secret:
// every read is still limited by RLS to workspaces the user is a member of.

export const WORKSPACE_COOKIE = "tt-workspace";

/** memberships: [{ workspace_id, ... }] oldest first. Returns the chosen row or null. */
export function pickMembership(memberships, preferredId) {
  if (!memberships?.length) return null;
  return memberships.find((m) => m.workspace_id === preferredId) ?? memberships[0];
}
