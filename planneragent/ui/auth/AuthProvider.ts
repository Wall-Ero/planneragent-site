export type AccountSessionState = Readonly<{ status: "LOADING" } | { status: "ANONYMOUS" } | { status: "REGISTERED"; expires_at: string }>;
let currentSession: AccountSessionState = Object.freeze({ status: "LOADING" });
export const getSession = () => currentSession;
export function projectServerSession(value: unknown): AccountSessionState {
  if (value && typeof value === "object" && (value as any).status === "REGISTERED" && typeof (value as any).expires_at === "string") currentSession = Object.freeze({ status: "REGISTERED", expires_at: (value as any).expires_at });
  else currentSession = Object.freeze({ status: "ANONYMOUS" });
  return currentSession;
}
export const setAnonymousSession = () => (currentSession = Object.freeze({ status: "ANONYMOUS" }));
