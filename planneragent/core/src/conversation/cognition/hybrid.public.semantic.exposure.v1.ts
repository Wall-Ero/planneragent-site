import { createPlannerAgentPublicCapabilityProjectionV1 } from "../planneragent.public.capabilities.v1";
import { createPlannerAgentVoiceProfileV1 } from "../planneragent.voice.profile.v1";
import { parseRealizationEnvelopeV1 } from "../cognitive.realization.envelope.v1";
import { CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1, parseConversationalInterpretationResultV1, sealConversationalInterpretationRequestV1, type ConversationalProductFocusV1 } from "./conversational.cognition.contracts.v1";
import { hybridCanonicalV1, hybridDigestV1, hybridSnapshotV1, type HybridCheckV1, type HybridRequestV1 } from "./hybrid.conversational.contracts.v1";
import type { OfflineHybridDependenciesV1 } from "./hybrid.conversational.supervision.v1";

export const PUBLIC_SEMANTIC_SCOPE_V1 = "ANONYMOUS_VISION_PUBLIC_PRODUCT_QUESTION_V1";
export const PUBLIC_SEMANTIC_POLICY_V1 = "public-semantic-exposure:closed-v1";

// A closed, reviewed public language, NOT a classifier or a secret detector.
// No normalization: additions, invisible characters and paraphrases fail closed.
const questions: Readonly<Record<string, ConversationalProductFocusV1>> = Object.freeze({
  "What can PlannerAgent do?": "GENERAL_CAPABILITIES",
  "Cosa può fare PlannerAgent?": "GENERAL_CAPABILITIES",
  "What are PlannerAgent's authority levels?": "TIER",
  "Quali sono i livelli di autorità di PlannerAgent?": "TIER",
  "Which planning domains does PlannerAgent support?": "DOMAIN",
  "Quali domini supporta PlannerAgent?": "DOMAIN",
  "What are PlannerAgent's limitations?": "LIMITATION",
  "Quali sono i limiti di PlannerAgent?": "LIMITATION",
  "How do I get started with PlannerAgent?": "GETTING_STARTED",
  "Come posso iniziare con PlannerAgent?": "GETTING_STARTED",
});

export function admitPublicQuestionV1(text: unknown) {
  const focus = typeof text === "string" && Object.hasOwn(questions, text) ? questions[text] : undefined;
  return focus ? Object.freeze({ decision: "ALLOW" as const, focus }) : Object.freeze({ decision: "DENY" as const });
}

function meaning(focus: ConversationalProductFocusV1) {
  const p = createPlannerAgentPublicCapabilityProjectionV1();
  // Mandatory boundaries travel with every topic. No organization-specific facts.
  return hybridSnapshotV1({ scope: PUBLIC_SEMANTIC_SCOPE_V1, focus,
    vision: p.vision, limitations: p.limitations,
    ...(focus === "GENERAL_CAPABILITIES" ? { purpose: p.purpose, supported_data_categories: p.supported_data_categories } : {}),
    ...(focus === "TIER" ? { tiers: p.tiers } : {}),
    ...(focus === "DOMAIN" ? { supported_planning_domains: p.supported_planning_domains } : {}),
    ...(focus === "GETTING_STARTED" ? { data_introduction: p.data_introduction } : {}),
  });
}

export function preparePublicInterpretationV1(text: unknown): HybridRequestV1 | undefined {
  return admitPublicQuestionV1(text).decision === "ALLOW" ? hybridSnapshotV1({ purpose: "INTERPRETATION", payload: sealConversationalInterpretationRequestV1(text as string) }) : undefined;
}

export function preparePublicRealizationV1(text: unknown): HybridRequestV1 | undefined {
  const admission = admitPublicQuestionV1(text);
  if (admission.decision !== "ALLOW") return undefined;
  return hybridSnapshotV1({ purpose: "REALIZATION", payload: { version: 1,
    // A host-selected public topic replaces the original message. No history or interpretation.
    current_user_message: admission.focus, governed_meaning: meaning(admission.focus),
    voice_profile: createPlannerAgentVoiceProfileV1(), required_output_contract: "REALIZATION_ENVELOPE_V1" as const } });
}

function focusOf(request: HybridRequestV1): ConversationalProductFocusV1 | undefined {
  // Compare the ENTIRE surface, including sealed metadata, with host-built payloads.
  // A valid PRODUCT_QUESTION label alone never grants admission.
  for (const text of Object.keys(questions)) {
    const expected = request.purpose === "INTERPRETATION" ? preparePublicInterpretationV1(text) :
      request.purpose === "REALIZATION" ? preparePublicRealizationV1(text) : undefined;
    if (expected && hybridCanonicalV1(request) === hybridCanonicalV1(expected)) return questions[text];
  }
  return undefined;
}

// Controlled rendering: field labels + complete canonical values, no inferred prose.
// execution_possible_by_tier is explicitly a possibility, never present authority.
export function renderPublicMeaningV1(request: HybridRequestV1): string | undefined {
  try {
    const focus = focusOf(request);
    if (!focus || request.purpose !== "REALIZATION") return undefined;
    return `PlannerAgent public facts (tier execution possibility grants no authority):\n${hybridCanonicalV1(meaning(focus))}`;
  } catch { return undefined; }
}

export function verifyPublicCandidateV1(request: HybridRequestV1, candidate: unknown): HybridCheckV1 {
  try {
    const focus = focusOf(request);
    if (!focus) return "INCONCLUSIVE";
    if (request.purpose === "INTERPRETATION") {
      const parsed = parseConversationalInterpretationResultV1(candidate);
      if (!parsed) return "FAIL";
      const expected = { version: 1, interaction: "PRODUCT_QUESTION", product_focus: focus, resolution: "CLEAR", ...CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1 };
      return hybridCanonicalV1(parsed) === hybridCanonicalV1(expected) ? "PASS" : "FAIL";
    }
    const parsed = parseRealizationEnvelopeV1(JSON.stringify(candidate));
    if (!parsed) return "FAIL";
    // Equality proves membership in this complete canonical rendering only.
    // Any other free text, even plausible or partly true, is unverified.
    return parsed.answer === renderPublicMeaningV1(request) ? "PASS" : "INCONCLUSIVE";
  } catch { return "INCONCLUSIVE"; }
}

export const authorizePublicExposureV1: NonNullable<OfflineHybridDependenciesV1["authorize_exposure"]> = async (request, digest) => {
  try {
    if (!focusOf(request) || digest !== hybridDigestV1(request)) return undefined;
    return Object.freeze({ boundary: "CONVERSATIONAL_SURFACE_ONLY", classification: "PUBLIC_SAFE", request_digest: digest, evidence_ref: PUBLIC_SEMANTIC_POLICY_V1 });
  } catch { return undefined; }
};

export const verifyPublicBindingV1: NonNullable<OfflineHybridDependenciesV1["verify"]> = async binding => {
  const bound = binding.request_digest === hybridDigestV1(binding.request) && binding.candidate_digest === hybridDigestV1(binding.candidate);
  const status = bound ? verifyPublicCandidateV1(binding.request, binding.candidate) : "INCONCLUSIVE";
  return hybridSnapshotV1({ verifier_id: "host-public-canonical-verifier-v1", method: "DETERMINISTIC_POLICY",
    policy_ref: PUBLIC_SEMANTIC_POLICY_V1, evidence_ref: `canonical-projection:${hybridDigestV1(createPlannerAgentPublicCapabilityProjectionV1()).slice(7)}`,
    qualified_scope_ref: PUBLIC_SEMANTIC_SCOPE_V1, request_digest: binding.request_digest, candidate_digest: binding.candidate_digest,
    checks: { semantic_fidelity: status, authority_boundary: status, uncertainty_preservation: status,
      exposure_boundary: bound && focusOf(binding.request) ? "PASS" : "INCONCLUSIVE" } });
};
