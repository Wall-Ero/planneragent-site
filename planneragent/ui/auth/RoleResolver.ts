// ui/auth/RoleResolver.ts

import type { AuthSession } from "./AuthSession";

export type UiRole = "ANONYMOUS" | "USER" | "FOUNDER";

export function resolveRoleFromSession(
  session: AuthSession
): UiRole {
  if (!session.authenticated) {
    return "ANONYMOUS";
  }

  if (session.is_founder) {
    return "FOUNDER";
  }

  return "USER";
}