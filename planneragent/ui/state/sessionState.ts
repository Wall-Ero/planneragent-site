// planneragent/ui/state/sessionState.ts

export type SessionRole =
  | "ANONYMOUS"
  | "USER"
  | "FOUNDER";

export type SessionState = {
  role: SessionRole;
  authenticated: boolean;
};

export function getSessionState(): SessionState {
  // stub locale — in P8 NON ESISTE auth vera
  return {
    role: "ANONYMOUS",
    authenticated: false,
  };
}