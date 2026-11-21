import { ANONYMOUS_VISION_CONVERSATION_MESSAGE_MAX_LENGTH_V1 } from "./anonymous.vision.conversation.contracts.v1";
import { interpretAnonymousVisionIntentV1 } from "./anonymous.vision.conversation.intent.v1";
import { createPlannerAgentPublicCapabilityProjectionV1 } from "./planneragent.public.capabilities.v1";
import { CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1 } from "./cognition/conversational.cognition.contracts.v1";
import { hybridCanonicalV1, hybridDigestV1, hybridSnapshotV1 } from "./cognition/hybrid.conversational.contracts.v1";

// A bounded public repair surface, not historical-reference resolution or a
// replacement for admission. Previously admitted requests always keep their path.
const grammar = [
  ["MISSING_SUBJECT", /^can it execute actions[.!?]?$/i],
  ["MISSING_DOMAINS", /^explain those domains[.!?]?$/i],
  ["MISSING_LIST_ITEM", /^(?:and|explain) the (?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth) one[.!?]?$/i],
  ["MISSING_AVAILABILITY_REFERENT", /^which of those are publicly available[.!?]?$/i],
  ["MISSING_COMPARISON", /^what changed since my previous message[.!?]?$/i],
  ["MISSING_CAPABILITY_REFERENTS", /^can it do that[.!?]?$/i],
  ["MISSING_OPERATIONAL_CONTEXT", /^what should i do now[.!?]?$/i],
  ["MISSING_ACTION_REFERENT", /^do that[.!?]?$/i],
] as const;
export type AnonymousVisionClarificationReasonV1 = typeof grammar[number][0];

export function admitAnonymousVisionClarificationV1(message: unknown): AnonymousVisionClarificationReasonV1 | undefined {
  if (typeof message !== "string" || message.length > ANONYMOUS_VISION_CONVERSATION_MESSAGE_MAX_LENGTH_V1) return undefined;
  // Includes the existing normalized hard boundaries, with their original
  // precedence. Never consume even an incomplete request already admitted there.
  if (interpretAnonymousVisionIntentV1(message)) return undefined;
  const text = message.trim().replace(/\s+/g, " ");
  return grammar.find(([, production]) => production.test(text))?.[0];
}

// Approved wording has no arbitrary requester slots. Context limitations follow
// the exact V1 request schema (one current message, no history), not inferred memory.
const questions: Readonly<Record<AnonymousVisionClarificationReasonV1, string>> = Object.freeze({
  MISSING_SUBJECT: "I don't have the earlier context needed to identify 'it'. Which product or system are you asking about?",
  MISSING_DOMAINS: "I don't have the earlier list of domains. Which domains would you like explained?",
  MISSING_LIST_ITEM: "I don't have the earlier list. Which item do you mean? Please name it or include the list.",
  MISSING_AVAILABILITY_REFERENT: "I don't have the earlier list. Which items are you asking about for public availability?",
  MISSING_COMPARISON: "I don't have your previous message to compare. Could you include the earlier and current descriptions?",
  MISSING_CAPABILITY_REFERENTS: "What do 'it' and 'that' refer to? Please name the subject and the capability or action you mean.",
  MISSING_OPERATIONAL_CONTEXT: "What operational situation would you like to understand? Please describe the observable issue.",
  MISSING_ACTION_REFERENT: "What action does 'that' refer to? Please describe it; this does not authorize execution.",
});
const reviewedPublicMeaning = Object.freeze({
  product: "PlannerAgent",
  vision: { observation_only: true, execution_allowed: false },
  limitations: [
    "No user-specific operational claim is made until appropriate data is admitted.",
    "Anonymous conversation cannot introduce data, access organizations, monitor participants, or execute actions.",
    "Capabilities not represented in this public projection must not be claimed.",
  ],
});
const approvedBoundaryText = "VISION is observation-only and cannot execute actions. In this anonymous conversation, you cannot introduce data, access organizations, monitor participants or execute actions.";

export function createAnonymousVisionClarificationPlanV1(reason: AnonymousVisionClarificationReasonV1) {
  if (!Object.hasOwn(questions, reason)) throw new Error("CLARIFICATION_REASON_NOT_ADMITTED");
  const projection = createPlannerAgentPublicCapabilityProjectionV1();
  const source = { product: projection.product, vision: projection.vision, limitations: projection.limitations };
  if (projection.version !== 1 || hybridCanonicalV1(source) !== hybridCanonicalV1(reviewedPublicMeaning)) throw new Error("CLARIFICATION_SOURCE_REVIEW_REQUIRED");
  return hybridSnapshotV1({
    version: 1, scope: "ANONYMOUS_VISION_CLARIFICATION_EN_V1", reason,
    provenance: { source: "planneragent.public.capabilities.v1", source_version: projection.version,
      source_digest: hybridDigestV1(source), wording_version: 1,
      context_contract: "AnonymousVisionConversationRequestV1", context_contract_version: 1 },
    source, context: { scope: "CURRENT_REQUEST_ONLY", previous_turns_available: false, referent_resolved: false },
    interpretation: { version: 1, interaction: "AMBIGUOUS", resolution: "AMBIGUOUS", ...CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1 },
    question: questions[reason], boundary_text: approvedBoundaryText,
    grants_authority: false, grants_execution: false,
  });
}
export type AnonymousVisionClarificationPlanV1 = ReturnType<typeof createAnonymousVisionClarificationPlanV1>;

export function renderAnonymousVisionClarificationV1(plan: AnonymousVisionClarificationPlanV1) {
  if (!plan || hybridCanonicalV1(plan) !== hybridCanonicalV1(createAnonymousVisionClarificationPlanV1(plan.reason))) {
    throw new Error("CLARIFICATION_UNTRUSTED_PLAN");
  }
  const text = `${plan.question} ${plan.boundary_text}`;
  if (text.length > 700) throw new Error("CLARIFICATION_OUTPUT_LIMIT");
  return hybridSnapshotV1({ text, plan_digest: hybridDigestV1(plan) });
}
