import type { Env } from "../types/env";
import type { AnonymousVisionConversationFailureV1, AnonymousVisionConversationResponseV1 } from "./anonymous.vision.conversation.contracts.v1";
import { runAnonymousVisionConversationV1 } from "./anonymous.vision.conversation.runtime.v1";

type ConversationResult = AnonymousVisionConversationResponseV1 | AnonymousVisionConversationFailureV1;
type ConversationRunner = typeof runAnonymousVisionConversationV1;

const json = (body: ConversationResult, status: number) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function anonymousVisionConversationRouteV1(
  request: Request,
  env: Pick<Env, "OPENROUTER_API_KEY">,
  dependencies: Readonly<{ run?: ConversationRunner; fetch?: typeof fetch }> = {},
): Promise<Response> {
  if (request.method !== "POST") return json({ version: 1, request_id: "unadmitted", error: "REQUEST_NOT_ADMITTED" }, 405);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ version: 1, request_id: "unadmitted", error: "REQUEST_NOT_ADMITTED" }, 400); }
  const clientKey = request.headers.get("cf-connecting-ip")?.trim() || "edge-client-unavailable";
  let result: ConversationResult;
  try {
    result = await (dependencies.run ?? runAnonymousVisionConversationV1)({
      request: body,
      client_key: clientKey,
      api_key: env.OPENROUTER_API_KEY ?? "",
      fetch: dependencies.fetch ?? ((...args) => globalThis.fetch(...args)),
    });
  } catch {
    return json({ version: 1, request_id: typeof (body as any)?.request_id === "string" ? (body as any).request_id : "unadmitted", error: "SERVICE_UNAVAILABLE" }, 503);
  }
  const status = "error" in result ? result.error === "RATE_LIMITED" ? 429 : result.error === "SERVICE_UNAVAILABLE" ? 503 : 400 : 200;
  return json(result, status);
}
