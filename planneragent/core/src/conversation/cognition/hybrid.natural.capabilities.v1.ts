import { createPlannerAgentPublicCapabilityProjectionV1 } from "../planneragent.public.capabilities.v1";
import { createPlannerAgentVoiceProfileV1 } from "../planneragent.voice.profile.v1";
import { parseRealizationEnvelopeV1 } from "../cognitive.realization.envelope.v1";
import { CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1, parseConversationalInterpretationResultV1, sealConversationalInterpretationRequestV1 } from "./conversational.cognition.contracts.v1";
import { hybridCanonicalV1, hybridDigestV1, hybridSnapshotV1, type HybridCheckV1, type HybridRequestV1 } from "./hybrid.conversational.contracts.v1";
import type { OfflineHybridDependenciesV1 } from "./hybrid.conversational.supervision.v1";

export const NATURAL_CAPABILITIES_SCOPE_V1 = "ANONYMOUS_VISION_GENERAL_CAPABILITIES_EN_V1";
export const NATURAL_CAPABILITIES_POLICY_V1 = "natural-capabilities:grammar-renderer-v1";
export const NATURAL_CAPABILITIES_PRESENTATIONS_V1 = ["PARAGRAPHS", "BULLETS"] as const;
export type NaturalCapabilitiesPresentationV1 = typeof NATURAL_CAPABILITIES_PRESENTATIONS_V1[number];

// Bounded compositional grammar, NOT general semantic understanding. Every token
// must be consumed. No arbitrary slots for names, data, history or instructions.
export function admitNaturalCapabilitiesV1(message: unknown) {
  const denied = Object.freeze({ decision: "DENY" as const, reason: "OUTSIDE_QUALIFIED_ENGLISH_GRAMMAR" as const });
  if (typeof message !== "string" || message.length > 160 || !/^[A-Za-z '?!.]+$/.test(message)) return denied;
  const tokens = message.trim().toLowerCase().replace(/[?.!]$/, "").trim().split(/ +/);
  let cursor = 0;
  const take = (...values: string[]) => values.includes(tokens[cursor]) ? (cursor++, true) : false;
  const noun = () => { take("general"); return take("capabilities", "capability"); };
  const subject = () => take("planneragent");
  const object = () => {
    const start = cursor;
    if (take("planneragent", "planneragent's") && noun()) return true;
    cursor = start;
    take("the");
    return noun() && take("of") && subject();
  };
  take("please");
  const start = cursor;
  const productions = [
    () => take("what") && take("can", "does") && subject() && take("do"),
    () => take("what", "which") && noun() && take("does", "do", "can") && subject() && take("have", "offer", "provide"),
    () => take("what") && take("are", "is") && object(),
    () => take("how") && take("can", "does") && subject() && take("help"),
    () => take("can", "could", "would") && take("you") && (take("please"), true) && take("explain", "describe", "summarize") && object(),
    () => take("explain", "describe", "summarize") && object(),
    () => take("tell") && take("me") && take("about") && object(),
  ];
  const matched = productions.some(production => {
    cursor = start;
    if (!production()) return false;
    if (tokens[cursor] === "in" && tokens[cursor + 1] === "general") cursor += 2;
    take("please");
    return cursor === tokens.length;
  });
  return matched ? Object.freeze({ decision: "ADMIT" as const, interaction: "PRODUCT_QUESTION" as const,
    product_focus: "GENERAL_CAPABILITIES" as const, grammar_version: 1 as const }) : denied;
}

// Source-bound wording rules for exact existing public source values, NOT another
// capability catalog. Source drift blocks rendering pending wording review.
const wordingRules = [
  { id: "PURPOSE", path: "purpose", source: "Operational planning support that helps people understand plan, reality, and governed action boundaries.",
    text: "PlannerAgent provides operational planning support, helping people understand plans, operational reality and the boundaries for governed action." },
  { id: "DOMAINS", path: "supported_planning_domains", source: ["supply_chain", "production", "logistics", "finance", "general"],
    text: "PlannerAgent's architecture identifies five planning domains: supply chain, production, logistics, finance and general planning. This list alone does not establish that every domain is implemented, qualified or publicly available." },
  { id: "VISION", path: "vision", source: { observation_only: true, execution_allowed: false },
    text: "VISION is observation-only and cannot execute actions." },
  { id: "ANONYMOUS_BOUNDARY", path: "limitations.1", source: "Anonymous conversation cannot introduce data, access organizations, monitor participants, or execute actions.",
    text: "In this anonymous conversation, you cannot introduce data, access organizations, monitor participants or execute actions." },
  { id: "EVIDENCE_LIMIT", path: "limitations.0", source: "No user-specific operational claim is made until appropriate data is admitted.",
    text: "No claim about your own operations is made until appropriate data has been admitted." },
  { id: "CAPABILITY_BOUNDARY", path: "limitations.2", source: "Capabilities not represented in this public projection must not be claimed.",
    text: "Capabilities outside the public capability description used for this answer must not be claimed." },
] as const;

export function createNaturalCapabilitiesAnswerPlanV1() {
  const projection = createPlannerAgentPublicCapabilityProjectionV1();
  const mandatory_elements = wordingRules.map(rule => {
    let value: unknown = projection;
    for (const key of rule.path.split(".")) value = (value as Record<string, unknown>)[key];
    if (hybridCanonicalV1(value) !== hybridCanonicalV1(rule.source)) throw new Error("NATURAL_CAPABILITIES_SOURCE_REVIEW_REQUIRED");
    return { id: rule.id, source_path: rule.path, source_value: value, approved_text: rule.text };
  });
  if (projection.limitations.length !== 3) throw new Error("NATURAL_CAPABILITIES_SOURCE_REVIEW_REQUIRED");
  return hybridSnapshotV1({ version: 1, scope: NATURAL_CAPABILITIES_SCOPE_V1,
    provenance: { source: "planneragent.public.capabilities.v1", source_version: projection.version,
      source_digest: hybridDigestV1(projection), wording_version: 1 },
    allowed_facts: { purpose: projection.purpose, supported_planning_domains: projection.supported_planning_domains },
    mandatory_elements, qualifications_and_limits: projection.limitations,
    binding_negations: { vision_execution_allowed: projection.vision.execution_allowed,
      anonymous_restrictions: projection.limitations[1], operational_claim_condition: projection.limitations[0] },
    forbidden_capability_claims: { vision_execution: !projection.vision.execution_allowed,
      unrepresented_capabilities: projection.limitations[2] },
    voice_profile: createPlannerAgentVoiceProfileV1(), grants_authority: false, grants_execution: false });
}
export type NaturalCapabilitiesAnswerPlanV1 = ReturnType<typeof createNaturalCapabilitiesAnswerPlanV1>;

export function renderNaturalCapabilitiesV1(plan: NaturalCapabilitiesAnswerPlanV1, presentation: NaturalCapabilitiesPresentationV1 = "PARAGRAPHS") {
  if (hybridCanonicalV1(plan) !== hybridCanonicalV1(createNaturalCapabilitiesAnswerPlanV1()) ||
      !NATURAL_CAPABILITIES_PRESENTATIONS_V1.includes(presentation)) throw new Error("NATURAL_CAPABILITIES_UNTRUSTED_PLAN");
  const parts = plan.mandatory_elements.map(element => element.approved_text);
  const text = presentation === "BULLETS" ? parts.map(part => `- ${part}`).join("\n") :
    [parts.slice(0, 2).join(" "), parts.slice(2, 4).join(" "), parts.slice(4).join(" ")].join("\n\n");
  // Evidence remains host-side, never embedded in the human-facing text.
  return hybridSnapshotV1({ text, plan_digest: hybridDigestV1(plan), presentation,
    coverage: plan.mandatory_elements.map(element => ({ id: element.id, source_path: element.source_path,
      start: text.indexOf(element.approved_text), end: text.indexOf(element.approved_text) + element.approved_text.length })) });
}

export function prepareNaturalCapabilitiesRealizationV1(): HybridRequestV1 {
  return hybridSnapshotV1({ purpose: "REALIZATION", payload: { version: 1,
    current_user_message: "What can PlannerAgent do?", governed_meaning: createNaturalCapabilitiesAnswerPlanV1(),
    voice_profile: createPlannerAgentVoiceProfileV1(), required_output_contract: "REALIZATION_ENVELOPE_V1" as const } });
}

function qualifiedSurface(request: HybridRequestV1): boolean {
  if (request.purpose === "REALIZATION") return hybridCanonicalV1(request) === hybridCanonicalV1(prepareNaturalCapabilitiesRealizationV1());
  return request.purpose === "INTERPRETATION" && admitNaturalCapabilitiesV1(request.payload.raw_user_message).decision === "ADMIT" &&
    hybridCanonicalV1(request) === hybridCanonicalV1({ purpose: "INTERPRETATION", payload: sealConversationalInterpretationRequestV1(request.payload.raw_user_message) });
}

export function verifyNaturalCapabilitiesCandidateV1(request: HybridRequestV1, candidate: unknown): HybridCheckV1 {
  try {
    if (!qualifiedSurface(request)) return "INCONCLUSIVE";
    if (request.purpose === "INTERPRETATION") {
      const parsed = parseConversationalInterpretationResultV1(candidate);
      if (!parsed) return "FAIL";
      return hybridCanonicalV1(parsed) === hybridCanonicalV1({ version: 1, interaction: "PRODUCT_QUESTION", product_focus: "GENERAL_CAPABILITIES",
        resolution: "CLEAR", ...CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1 }) ? "PASS" : "FAIL";
    }
    const parsed = parseRealizationEnvelopeV1(JSON.stringify(candidate));
    if (!parsed) return "FAIL";
    const plan = createNaturalCapabilitiesAnswerPlanV1();
    // The WHOLE prose must equal a source-bound approved rendering. Claim IDs,
    // schema and confidence cannot prove fidelity of arbitrary prose.
    return NATURAL_CAPABILITIES_PRESENTATIONS_V1.some(style => parsed.answer === renderNaturalCapabilitiesV1(plan, style).text) ? "PASS" : "INCONCLUSIVE";
  } catch { return "INCONCLUSIVE"; }
}

export const authorizeNaturalCapabilitiesExposureV1: NonNullable<OfflineHybridDependenciesV1["authorize_exposure"]> = async (request, digest) => {
  try {
    if (digest !== hybridDigestV1(request) || !qualifiedSurface(request)) return undefined;
    return { boundary: "CONVERSATIONAL_SURFACE_ONLY", classification: "PUBLIC_SAFE", request_digest: digest, evidence_ref: NATURAL_CAPABILITIES_POLICY_V1 };
  } catch { return undefined; }
};

// Separate external-exposure decision: the vertical never exposes the original
// wording to an Interpretation Teacher, even when local observation is admitted.
export const authorizeNaturalCapabilitiesTeacherExposureV1: NonNullable<OfflineHybridDependenciesV1["authorize_exposure"]> = async (request, digest) =>
  request.purpose === "REALIZATION" ? authorizeNaturalCapabilitiesExposureV1(request, digest) : undefined;

export const verifyNaturalCapabilitiesBindingV1: NonNullable<OfflineHybridDependenciesV1["verify"]> = async binding => {
  let exposed = false;
  let status: HybridCheckV1 = "INCONCLUSIVE";
  try {
    exposed = binding.request_digest === hybridDigestV1(binding.request) && binding.candidate_digest === hybridDigestV1(binding.candidate) && qualifiedSurface(binding.request);
    if (exposed) status = verifyNaturalCapabilitiesCandidateV1(binding.request, binding.candidate);
  } catch { /* Unknown source or malformed binding stays inconclusive. */ }
  return { verifier_id: "host-natural-capabilities-renderer-v1", method: "DETERMINISTIC_POLICY", policy_ref: NATURAL_CAPABILITIES_POLICY_V1,
    evidence_ref: "source-bound-rendering:v1", qualified_scope_ref: NATURAL_CAPABILITIES_SCOPE_V1,
    request_digest: binding.request_digest, candidate_digest: binding.candidate_digest,
    checks: { semantic_fidelity: status, authority_boundary: status, uncertainty_preservation: status, exposure_boundary: exposed ? "PASS" : "INCONCLUSIVE" } };
};
