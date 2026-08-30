import type { Env } from "../types/env";
import type { AnonymousVisionConversationFailureV1, AnonymousVisionConversationResponseV1 } from "./anonymous.vision.conversation.contracts.v1";
import { runAnonymousVisionConversationV1 } from "./anonymous.vision.conversation.runtime.v1";
import { StudentConversationalInterpretationAdapterV1 } from "./cognition/student.conversational.interpretation.adapter.v1";
import type { ConversationalInterpretationProviderV1 } from "./cognition/conversational.cognition.contracts.v1";
import type { ShadowInterpretationEvidenceRepositoryV1 } from "./cognition/conversational.interpretation.shadow.runtime.v1";

type ConversationResult = AnonymousVisionConversationResponseV1 | AnonymousVisionConversationFailureV1;
type ConversationRunner = typeof runAnonymousVisionConversationV1;

const json = (body: ConversationResult, status: number) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function anonymousVisionConversationRouteV1(
  request: Request,
  env: Pick<Env, "OPENROUTER_API_KEY" | "INTERPRETATION_STUDENT_SHADOW_ENABLED" | "INTERPRETATION_STUDENT_ENDPOINT" | "INTERPRETATION_STUDENT_AUTHORIZATION" | "INTERPRETATION_STUDENT_TIMEOUT_MS">,
  dependencies: Readonly<{ run?: ConversationRunner; fetch?: typeof fetch; wait_until?: (task: Promise<void>) => void; shadow_provider?: ConversationalInterpretationProviderV1; shadow_repository?: ShadowInterpretationEvidenceRepositoryV1 }> = {},
): Promise<Response> {
  if (request.method !== "POST") return json({ version: 1, request_id: "unadmitted", error: "REQUEST_NOT_ADMITTED" }, 405);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ version: 1, request_id: "unadmitted", error: "REQUEST_NOT_ADMITTED" }, 400); }
  const clientKey = request.headers.get("cf-connecting-ip")?.trim() || "edge-client-unavailable";
  let result: ConversationResult;
  try {
    const timeoutMs = Number(env.INTERPRETATION_STUDENT_TIMEOUT_MS ?? "1500");
    const shadowEnabled = env.INTERPRETATION_STUDENT_SHADOW_ENABLED === "true" && !!dependencies.wait_until;
    let interpretationShadow: Parameters<ConversationRunner>[0]["interpretation_shadow"];
    if (shadowEnabled) try {
      const provider = dependencies.shadow_provider ?? (env.INTERPRETATION_STUDENT_ENDPOINT && env.INTERPRETATION_STUDENT_AUTHORIZATION
        ? new StudentConversationalInterpretationAdapterV1({ endpoint: env.INTERPRETATION_STUDENT_ENDPOINT, authorization: env.INTERPRETATION_STUDENT_AUTHORIZATION, timeout_ms: timeoutMs, fetch: dependencies.fetch })
        : undefined);
      const repository = dependencies.shadow_repository ?? { append: async (evidence: unknown) => { console.log("CONVERSATIONAL_INTERPRETATION_SHADOW_V1", JSON.stringify(evidence)); } };
      if (provider) interpretationShadow = { provider, repository, timeout_ms: timeoutMs, schedule: dependencies.wait_until! };
    } catch { interpretationShadow = undefined; }
    result = await (dependencies.run ?? runAnonymousVisionConversationV1)({
      request: body,
      client_key: clientKey,
      api_key: env.OPENROUTER_API_KEY ?? "",
      fetch: dependencies.fetch ?? ((...args) => globalThis.fetch(...args)),
      ...(interpretationShadow ? { interpretation_shadow: interpretationShadow } : {}),
    });
  } catch {
    return json({ version: 1, request_id: typeof (body as any)?.request_id === "string" ? (body as any).request_id : "unadmitted", error: "SERVICE_UNAVAILABLE" }, 503);
  }
  const status = "error" in result ? result.error === "RATE_LIMITED" ? 429 : result.error === "SERVICE_UNAVAILABLE" ? 503 : 400 : 200;
  return json(result, status);
}
