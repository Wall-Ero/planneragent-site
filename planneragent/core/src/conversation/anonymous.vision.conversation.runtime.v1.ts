import { CognitiveTransportError, CognitiveTransportMediatorV1, sealPublicCognitiveExposureV1, type PublicCognitiveTransportEvidenceRepositoryV1, type PublicCognitiveTransportEvidenceV1 } from "../governance/knowledge-exposure/transport";
import { ANONYMOUS_VISION_CONVERSATION_MAX_OUTPUT_TOKENS_V1, type AnonymousVisionConversationFailureV1, type AnonymousVisionConversationResponseV1 } from "./anonymous.vision.conversation.contracts.v1";
import { admitAnonymousVisionConversationV1, PLANNERAGENT_PUBLIC_CONVERSATION_INSTRUCTION_V1 } from "./anonymous.vision.conversation.policy.v1";
import { createPlannerAgentPublicCapabilityProjectionV1 } from "./planneragent.public.capabilities.v1";
import { AnonymousVisionConversationRateGuardV1 } from "./anonymous.vision.conversation.rate.v1";
import { resolveLlmProviders } from "../sandbox/llm/registry";
import { resolveSovereigntyPolicyV1 } from "../sandbox/llm/sovereignty";

class RequestLocalPublicEvidenceV1 implements PublicCognitiveTransportEvidenceRepositoryV1 {
  private used = false;
  readonly events: PublicCognitiveTransportEvidenceV1[] = [];
  async reserve() { if (this.used) return false; this.used = true; return true; }
  async append(event: PublicCognitiveTransportEvidenceV1) { this.events.push(event); }
}

const bounded = (request_id: string, posture: AnonymousVisionConversationResponseV1["posture"], text: string): AnonymousVisionConversationResponseV1 => Object.freeze({ version: 1, request_id, posture, text });
const defaultRateGuard = new AnonymousVisionConversationRateGuardV1();

export async function runAnonymousVisionConversationV1(input: Readonly<{
  request: unknown;
  client_key: string;
  api_key: string;
  fetch: typeof fetch;
  now?: () => string;
  rate_guard?: AnonymousVisionConversationRateGuardV1;
  resolve_providers?: typeof resolveLlmProviders;
}>): Promise<AnonymousVisionConversationResponseV1 | AnonymousVisionConversationFailureV1> {
  const admitted = admitAnonymousVisionConversationV1(input.request);
  const requestId = admitted?.request.request_id ?? "unadmitted";
  if (!admitted) return Object.freeze({ version: 1, request_id: requestId, error: "REQUEST_NOT_ADMITTED" });
  const guard = input.rate_guard ?? defaultRateGuard;
  if (!guard.admit({ client_key: input.client_key, message_length: admitted.request.message.length, max_output_tokens: ANONYMOUS_VISION_CONVERSATION_MAX_OUTPUT_TOKENS_V1 })) return Object.freeze({ version: 1, request_id: requestId, error: "RATE_LIMITED" });
  if (admitted.admission === "PROTECTED_DISCLOSURE") return bounded(requestId, "PROTECTED_INFORMATION", "I can explain PlannerAgent's public capabilities and safeguards at a high level, but I cannot disclose hidden instructions, proprietary implementation, credentials, or sensitive security details.");
  if (admitted.admission === "DATA_INTRODUCTION") return bounded(requestId, "REGISTRATION_REQUIRED", "You can discuss PlannerAgent anonymously. Simple registration is required before introducing a file, dataset, API, or connected data source.");
  if (admitted.admission === "EXECUTION_REQUEST") return bounded(requestId, "EXECUTION_UNAVAILABLE", "VISION is observation-only and cannot execute actions. Execution-capable use requires an eligible higher tier and separately governed authority.");
  const sovereignty = resolveSovereigntyPolicyV1({ plan: "VISION", budgetRemainingEur: 0, intelligenceMode: "EFFICIENT", inferenceSource: "FREE" });
  const candidate = (input.resolve_providers ?? resolveLlmProviders)("VISION", 0, sovereignty)[0];
  if (!candidate || candidate.id !== "openrouter" || candidate.model !== "openrouter/free" || candidate.economicClass !== "free" || candidate.estimatedCostEur !== 0) {
    return Object.freeze({ version: 1, request_id: requestId, error: "SERVICE_UNAVAILABLE" });
  }
  const provider = candidate.id, model = candidate.model;
  const publicEvidence = new RequestLocalPublicEvidenceV1();
  const projection = JSON.stringify({
    PUBLIC_INSTRUCTION: PLANNERAGENT_PUBLIC_CONVERSATION_INSTRUCTION_V1,
    PUBLIC_CAPABILITIES: createPlannerAgentPublicCapabilityProjectionV1(),
    USER_MESSAGE: admitted.request.message,
  });
  const sealed = sealPublicCognitiveExposureV1({ version: 1, trust_domain: "PUBLIC", scope: "REQUEST_BOUND", organizational_status: "NON_ORGANIZATIONAL", retention: "NO_RETENTION", purpose: "PUBLIC_PRODUCT_CONVERSATION", request_id: requestId, consumption_id: `public-conversation:${requestId}`, provider, model, projection: { classification: "PUBLIC_SAFE", content: projection } });
  try {
    const result = await new CognitiveTransportMediatorV1({ fetch: input.fetch, evidence: { reserve: async () => false, append: async () => undefined }, publicEvidence, now: input.now ?? (() => new Date().toISOString()) }).dispatchPublic({ sealed, provider, model, api_key: input.api_key, max_tokens: ANONYMOUS_VISION_CONVERSATION_MAX_OUTPUT_TOKENS_V1, temperature: 0.2 });
    if (!result.text.trim()) throw new CognitiveTransportError("COGNITIVE_PROVIDER_RESPONSE_INVALID");
    return bounded(requestId, "PUBLIC_PRODUCT_ANSWER", result.text);
  } catch {
    return Object.freeze({ version: 1, request_id: requestId, error: "SERVICE_UNAVAILABLE" });
  }
}
