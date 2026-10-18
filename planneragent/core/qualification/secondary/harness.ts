import { isDeepStrictEqual } from "node:util";
import { anonymousVisionConversationRouteV1 } from "../../src/conversation/anonymous.vision.conversation.route.v1";
import { runAnonymousVisionConversationV1 } from "../../src/conversation/anonymous.vision.conversation.runtime.v1";
import { AnonymousVisionConversationRateGuardV1 } from "../../src/conversation/anonymous.vision.conversation.rate.v1";
import { createPlannerAgentPublicCapabilityProjectionV1 } from "../../src/conversation/planneragent.public.capabilities.v1";
import { GCC4W_STUDENT_IDENTITY_V1 } from "../../src/conversation/cognition/student.conversational.interpretation.adapter.v1";
import { canonicalizeConversationalInterpretationProviderResultV1 } from "../../src/conversation/cognition/conversational.interpretation.provider.protocol.v1";
import { createConversationalProviderDescriptorV1, parseConversationalInterpretationResultV1, sealConversationalInterpretationRequestV1, type ConversationalInterpretationResultV1, type SealedConversationalRealizationRequestV1 } from "../../src/conversation/cognition/conversational.cognition.contracts.v1";
import type { SecondaryInterpretationEnvV1 } from "../../src/conversation/cognition/secondary.interpretation.runtime.v1";

export const QUALIFICATION_MESSAGE = "What can PlannerAgent do?";
export const FIXED_ENVELOPE = '{"version":1,"answer":"SECONDARY boundary capture complete."}';
const descriptor = createConversationalProviderDescriptorV1({ version: 1, provider_id: "qualification-capture", adapter_id: "realization-input-capture", adapter_version: "1", model_id: "fixed-envelope", model_version: "1", capabilities: ["REALIZATION"], deployment_class: "LOCAL_TEST_ONLY", retention_privacy_class: "IN_MEMORY_ONLY" });
type CapturedInput = SealedConversationalRealizationRequestV1<ReturnType<typeof createPlannerAgentPublicCapabilityProjectionV1>>;

export function emptyEvidence() {
  return { SECONDARY_RESOLVED: "NO", IDENTITY_VERIFIED: "NO", INTERPRET_COMPLETED: "NO", INTERACTION: "NONE", RESOLUTION: "NONE", PRODUCT_FOCUS: "NONE", GRANTS_AUTHORITY: "UNKNOWN", GRANTS_EXECUTION: "UNKNOWN", SEMANTIC_INTERPRETATION_CONSUMED: "NO", GOVERNED_MEANING_PRESERVED: "NO", HTTP_STATUS: 0 };
}

// No storage bindings, shadow scheduler, production credentials, or remote
// realization provider are supplied. All capture remains in this invocation.
export async function qualifySecondaryBoundary(options: {
  env: SecondaryInterpretationEnvV1;
  studentFetch: typeof fetch;
  message?: string;
}) {
  const evidence = emptyEvidence();
  const calls: string[] = [];
  const studentRequests: unknown[] = [];
  const captures: CapturedInput[] = [];
  let observedResult: ConversationalInterpretationResultV1 | undefined;
  let identityMatches = false;
  let sealedMessageMatches = false;
  const message = options.message ?? QUALIFICATION_MESSAGE;
  let endpoint: URL | undefined;
  try { endpoint = new URL(options.env.INTERPRETATION_STUDENT_ENDPOINT ?? ""); } catch { /* Resolver handles invalid configuration. */ }
  const guardedFetch: typeof fetch = async (url, init) => {
    const target = new URL(String(url));
    const stage = target.pathname === "/v1/identity" ? "identity" : target.pathname === "/v1/interpret" ? "interpret" : undefined;
    // Fail before dispatch on any unexpected destination or repeated request.
    if (!endpoint || target.origin !== endpoint.origin || target.search || target.hash || target.username || target.password || !stage || calls.includes(stage) || (stage === "identity" ? calls.length !== 0 : calls.join() !== "identity")) throw new Error("QUALIFICATION_NETWORK_BOUNDARY");
    calls.push(stage);
    if (stage === "interpret") {
      try {
        const body = JSON.parse(String(init?.body));
        studentRequests.push(body);
        sealedMessageMatches = isDeepStrictEqual(body, sealConversationalInterpretationRequestV1(message));
      } catch { sealedMessageMatches = false; }
      if (identityMatches) evidence.IDENTITY_VERIFIED = "YES";
    }
    const response = await options.studentFetch(url, init);
    if (response.ok) {
      try {
        const body = await response.clone().json();
        if (stage === "identity") {
          identityMatches = !!body && Object.entries(GCC4W_STUDENT_IDENTITY_V1).every(([key, value]) => body[key] === value) && body.effective_dtype === "bf16" && body.protocol_version === "PA_STUDENT_HTTP_V1";
        } else {
          observedResult = parseConversationalInterpretationResultV1(canonicalizeConversationalInterpretationProviderResultV1(body));
        }
      } catch { /* Actual adapter still receives and validates the original response. */ }
    }
    return response;
  };
  const response = await anonymousVisionConversationRouteV1(new Request("https://qualification.invalid/conversation", {
    method: "POST", body: JSON.stringify({ version: 1, request_id: "secondary-boundary-qualification", message }),
  }), { ...options.env, OPENROUTER_API_KEY: "" }, {
    fetch: guardedFetch,
    run: input => {
      evidence.SECONDARY_RESOLVED = input.interpretation_secondary ? "YES" : "NO";
      return runAnonymousVisionConversationV1({ ...input, rate_guard: new AnonymousVisionConversationRateGuardV1(), create_realization_provider: () => ({
        descriptor,
        async realize(realizationInput) {
          captures.push(realizationInput); // Exact object received from the actual runtime.
          return FIXED_ENVELOPE;
        },
      }) });
    },
  });
  evidence.HTTP_STATUS = response.status;
  const captured = captures[0];
  const consumed = captured?.semantic_interpretation;
  if (observedResult && sealedMessageMatches && evidence.IDENTITY_VERIFIED === "YES") {
    evidence.INTERPRET_COMPLETED = "YES";
    evidence.INTERACTION = observedResult.interaction;
    evidence.RESOLUTION = observedResult.resolution;
    evidence.PRODUCT_FOCUS = observedResult.product_focus ?? "NONE";
    evidence.GRANTS_AUTHORITY = String(observedResult.grants_authority);
    evidence.GRANTS_EXECUTION = String(observedResult.grants_execution);
  }
  if (captures.length === 1 && consumed && observedResult && observedResult.interaction === "PRODUCT_QUESTION" && observedResult.resolution === "CLEAR" && isDeepStrictEqual(consumed, observedResult) && evidence.INTERPRET_COMPLETED === "YES") evidence.SEMANTIC_INTERPRETATION_CONSUMED = "YES";
  if (captures.length === 1 && isDeepStrictEqual(captured.governed_meaning, createPlannerAgentPublicCapabilityProjectionV1())) evidence.GOVERNED_MEANING_PRESERVED = "YES";
  return { evidence, response, captures, calls, studentRequests };
}

export function qualificationPassed(e: ReturnType<typeof emptyEvidence>) {
  return e.SECONDARY_RESOLVED === "YES" && e.IDENTITY_VERIFIED === "YES" && e.INTERPRET_COMPLETED === "YES" && e.INTERACTION === "PRODUCT_QUESTION" && e.RESOLUTION === "CLEAR" && e.GRANTS_AUTHORITY === "false" && e.GRANTS_EXECUTION === "false" && e.SEMANTIC_INTERPRETATION_CONSUMED === "YES" && e.GOVERNED_MEANING_PRESERVED === "YES" && e.HTTP_STATUS === 200;
}
