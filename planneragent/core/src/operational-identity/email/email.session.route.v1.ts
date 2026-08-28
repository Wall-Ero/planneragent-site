import type { Env } from "../../types/env";
import { identifier } from "../contracts/identifiers.v1";
import { D1OperationalIdentityRepositories } from "../persistence";

const json = (body: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
const cookieSession = (request: Request) => request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith("planneragent_session="))?.slice("planneragent_session=".length);
const clearCookie = (production: boolean) => `planneragent_session=; Path=/; HttpOnly; SameSite=Lax${production ? "; Secure" : ""}; Max-Age=0`;

export async function emailSessionRouteV1(request: Request, env: Pick<Env, "POLICIES_DB" | "ENVIRONMENT">): Promise<Response> {
  const path = new URL(request.url).pathname, production = env.ENVIRONMENT === "production";
  if ((path === "/identity/session" && request.method !== "GET") || (path === "/identity/logout" && request.method !== "POST")) return json({ version: 1, error: "METHOD_NOT_ALLOWED" }, 405);
  if (path !== "/identity/session" && path !== "/identity/logout") return json({ version: 1, error: "NOT_FOUND" }, 404);
  const raw = cookieSession(request);
  if (!raw) return path === "/identity/logout" ? json({ version: 1, status: "ANONYMOUS" }, 200, { "set-cookie": clearCookie(production) }) : json({ version: 1, status: "ANONYMOUS" });
  let sessionId;
  try { sessionId = identifier("SessionId", decodeURIComponent(raw)); } catch { return json({ version: 1, status: "ANONYMOUS" }, 200, path === "/identity/logout" ? { "set-cookie": clearCookie(production) } : {}); }
  const repositories = new D1OperationalIdentityRepositories(env.POLICIES_DB), session = await repositories.sessions.find(sessionId);
  if (path === "/identity/logout") {
    if (session?.lifecycle_state === "ACTIVE") await repositories.sessions.logout(sessionId, "browser-session");
    return json({ version: 1, status: "ANONYMOUS" }, 200, { "set-cookie": clearCookie(production) });
  }
  if (!session || session.lifecycle_state !== "ACTIVE") return json({ version: 1, status: "ANONYMOUS" });
  if (Date.parse(session.expires_at) <= Date.now()) { await repositories.sessions.expire(sessionId, "EXPIRED:browser-session"); return json({ version: 1, status: "ANONYMOUS" }); }
  const principal = await repositories.principals.find(session.principal_id);
  if (!principal || principal.lifecycle_state !== "ACTIVE") return json({ version: 1, status: "ANONYMOUS" });
  return json({ version: 1, status: "REGISTERED", expires_at: session.expires_at });
}
