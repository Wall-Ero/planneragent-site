// ui/auth/AuthProvider.ts

import type { AuthSession } from "./AuthSession";

let currentSession: AuthSession = {
  authenticated: false,
};

export function getSession(): AuthSession {
  return currentSession;
}

export function setAnonymousSession() {
  currentSession = {
    authenticated: false,
  };
}

export function setAuthenticatedSession(input: {
  user_id: string;
  is_founder?: boolean;
}) {
  currentSession = {
    authenticated: true,
    user_id: input.user_id,
    is_founder: input.is_founder ?? false,
  };
}