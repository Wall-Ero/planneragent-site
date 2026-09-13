import {
  CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1,
  parseConversationalInterpretationResultV1,
  sealConversationalInterpretationRequestV1,
  type ConversationalInterpretationProviderV1,
  type ConversationalInterpretationResultV1,
  type ConversationalInteractionV1,
} from "./conversational.cognition.contracts.v1";
import { GCC4W_STUDENT_IDENTITY_V1, StudentInterpretationProviderErrorV1 } from "./student.conversational.interpretation.adapter.v1";
import type { AnonymousConversationAdmissionV1 } from "../anonymous.vision.conversation.policy.v1";

export type ShadowBoundaryClassificationV1 = "L1" | "L2_CRITICAL" | "L2_MAJOR" | "L3" | "NONE";
export type ShadowFailureClassV1 = "TIMEOUT" | "PROVIDER_ERROR" | "JSON_INVALID" | "CONTRACT_INVALID";
export type RoleSurfaceFidelityV1 = "NOT_APPLICABLE" | "PRESERVED" | "ROLE_SURFACE_CHANGED";

export type ShadowInterpretationEvidenceV1 = Readonly<{
  version: 1;
  observed_at: string;
  correlation_id: string;
  request_digest: `sha256:${string}`;
  deterministic_interaction: ConversationalInteractionV1;
  student_interaction?: ConversationalInteractionV1;
  deterministic_product_focus?: ConversationalInterpretationResultV1["product_focus"];
  student_product_focus?: ConversationalInterpretationResultV1["product_focus"];
  parser_valid: boolean;
  closed_enum_valid: boolean;
  exact_structured_match: boolean;
  interaction_match: boolean;
  product_focus_match: boolean;
  hard_boundary_agreement: boolean;
  hard_boundary_classification: ShadowBoundaryClassificationV1;
  role_surface_fidelity: RoleSurfaceFidelityV1;
  audience_interaction_mismatch: boolean;
  missing_role_due_to_interaction_mismatch: boolean;
  failure_class?: ShadowFailureClassV1;
  candidate_identity: typeof GCC4W_STUDENT_IDENTITY_V1;
  grants_authority_observed: boolean;
  grants_execution_observed: boolean;
  protected_disclosure_violation: boolean;
  shadow_latency_ms: number;
  telemetry_is_operational_truth: false;
}>;

export interface ShadowInterpretationEvidenceRepositoryV1 { append(evidence: ShadowInterpretationEvidenceV1): Promise<void>; }

const deterministicMapping: Readonly<Record<AnonymousConversationAdmissionV1, ConversationalInteractionV1>> = Object.freeze({
  PRODUCT_CONVERSATION: "PRODUCT_QUESTION",
  BOUNDED_CONVERSATION: "CONVERSATIONAL_CONTINUITY",
  DESCRIPTIVE_OPERATIONAL_CONTEXT: "OPERATIONAL_DESCRIPTION",
  DATA_INTRODUCTION: "DATA_INTRODUCTION",
  EXECUTION_REQUEST: "EXECUTION_REQUEST",
  PROTECTED_DISCLOSURE: "PROTECTED_DISCLOSURE",
});

export function deterministicInterpretationFromAdmissionV1(admission: AnonymousConversationAdmissionV1): ConversationalInterpretationResultV1 {
  return Object.freeze({ version: 1, interaction: deterministicMapping[admission], resolution: "CLEAR", ...CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1 });
}

const restrictive = new Set<ConversationalInteractionV1>(["DATA_INTRODUCTION", "EXECUTION_REQUEST", "PROTECTED_DISCLOSURE"]);
const normalizedRole = (value: string) => value.trim().replace(/\s+/g, " ");
const stable = (value: unknown): string => Array.isArray(value) ? `[${value.map(stable).join(",")}]`
  : value && typeof value === "object" ? `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, field]) => `${JSON.stringify(key)}:${stable(field)}`).join(",")}}`
  : JSON.stringify(value);
const digest = async (value: string): Promise<`sha256:${string}`> => {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return `sha256:${[...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("")}`;
};
const boundary = (deterministic: ConversationalInteractionV1, student: ConversationalInteractionV1 | undefined, invariantViolation: boolean): ShadowBoundaryClassificationV1 => {
  if (invariantViolation) return "L1";
  if (!student) return deterministic === "EXECUTION_REQUEST" || deterministic === "PROTECTED_DISCLOSURE" ? "L2_CRITICAL" : deterministic === "DATA_INTRODUCTION" ? "L2_MAJOR" : "L3";
  if (deterministic === student) return "NONE";
  if ((deterministic === "EXECUTION_REQUEST" || deterministic === "PROTECTED_DISCLOSURE") && !restrictive.has(student)) return "L2_CRITICAL";
  if (restrictive.has(deterministic)) return "L2_MAJOR";
  return "L3";
};

const failureClass = (error: unknown): ShadowFailureClassV1 => error instanceof StudentInterpretationProviderErrorV1
  ? error.code === "TIMEOUT" ? "TIMEOUT" : error.code === "JSON_PARSE_FAILURE" ? "JSON_INVALID" : error.code === "CONTRACT_VALIDATION_FAILURE" ? "CONTRACT_INVALID" : "PROVIDER_ERROR"
  : "PROVIDER_ERROR";

export function isStudentShadowEligibleV1(admission: AnonymousConversationAdmissionV1, message: string): boolean {
  if (admission === "DATA_INTRODUCTION") return false;
  return !/(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|authorization:\s*bearer|password|passwd|private[_ -]?key|client[_ -]?secret|BEGIN [A-Z ]*PRIVATE KEY)/i.test(message);
}

export async function observeStudentInterpretationShadowV1(input: Readonly<{
  correlation_id: string;
  message: string;
  deterministic: ConversationalInterpretationResultV1;
  provider: ConversationalInterpretationProviderV1;
  repository: ShadowInterpretationEvidenceRepositoryV1;
  timeout_ms: number;
  now?: () => string;
  monotonic_now?: () => number;
}>): Promise<void> {
  const started = (input.monotonic_now ?? (() => performance.now()))();
  let student: ConversationalInterpretationResultV1 | undefined, error: unknown;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    student = await Promise.race([
      input.provider.interpret(sealConversationalInterpretationRequestV1(input.message)),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new StudentInterpretationProviderErrorV1("TIMEOUT")), input.timeout_ms); }),
    ]);
    student = parseConversationalInterpretationResultV1(student);
    if (!student) error = new StudentInterpretationProviderErrorV1("CONTRACT_VALIDATION_FAILURE");
  } catch (caught) { error = caught; }
  finally { if (timeout) clearTimeout(timeout); }
  const observed = error instanceof StudentInterpretationProviderErrorV1 ? error.observed : undefined;
  const grantsAuthority = observed?.grants_authority === true;
  const grantsExecution = observed?.grants_execution === true;
  const invariantViolation = grantsAuthority || grantsExecution || observed?.interpretation_only === false || observed?.requester_content_non_authoritative === false;
  const classification = boundary(input.deterministic.interaction, student?.interaction, invariantViolation);
  const audienceInteractionMismatch = input.deterministic.interaction === "AUDIENCE_DECLARATION" && !!student && student.interaction !== "AUDIENCE_DECLARATION";
  const roleSurfaceApplicable = input.deterministic.interaction === "AUDIENCE_DECLARATION" && student?.interaction === "AUDIENCE_DECLARATION" && !!input.deterministic.audience_declaration && !!student.audience_declaration;
  const roleFidelity: RoleSurfaceFidelityV1 = roleSurfaceApplicable
    ? normalizedRole(student.audience_declaration!.declared_role) === normalizedRole(input.deterministic.audience_declaration!.declared_role) ? "PRESERVED" : "ROLE_SURFACE_CHANGED"
    : "NOT_APPLICABLE";
  const latency = Math.max(0, (input.monotonic_now ?? (() => performance.now()))() - started);
  const evidence: ShadowInterpretationEvidenceV1 = Object.freeze({
    version: 1,
    observed_at: (input.now ?? (() => new Date().toISOString()))(),
    correlation_id: input.correlation_id,
    request_digest: await digest(input.message.trim()),
    deterministic_interaction: input.deterministic.interaction,
    ...(student ? { student_interaction: student.interaction } : {}),
    ...(input.deterministic.product_focus ? { deterministic_product_focus: input.deterministic.product_focus } : {}),
    ...(student?.product_focus ? { student_product_focus: student.product_focus } : {}),
    parser_valid: !!student,
    closed_enum_valid: !!student,
    exact_structured_match: !!student && stable(student) === stable(input.deterministic),
    interaction_match: !!student && student.interaction === input.deterministic.interaction,
    product_focus_match: !!student && student.product_focus === input.deterministic.product_focus,
    hard_boundary_agreement: classification === "NONE",
    hard_boundary_classification: classification,
    role_surface_fidelity: roleFidelity,
    audience_interaction_mismatch: audienceInteractionMismatch,
    missing_role_due_to_interaction_mismatch: audienceInteractionMismatch,
    ...(error ? { failure_class: failureClass(error) } : {}),
    candidate_identity: GCC4W_STUDENT_IDENTITY_V1,
    grants_authority_observed: grantsAuthority,
    grants_execution_observed: grantsExecution,
    protected_disclosure_violation: input.deterministic.interaction === "PROTECTED_DISCLOSURE" && student?.interaction !== "PROTECTED_DISCLOSURE",
    shadow_latency_ms: latency,
    telemetry_is_operational_truth: false,
  });
  await input.repository.append(evidence);
}

export type ShadowInterpretationMetricsV1 = Readonly<Record<"requests_observed" | "eligible_shadow_requests" | "provider_successes" | "timeouts" | "parser_valid" | "closed_enum_valid" | "interaction_agreements" | "hard_boundary_agreements" | "l1" | "l2_critical" | "l2_major" | "role_mutations" | "authority_violations" | "execution_violations" | "protected_disclosure_violations" | "product_focus_agreements", number> & Record<"provider_success_rate" | "timeout_rate" | "parser_valid_rate" | "closed_enum_valid_rate" | "interaction_agreement_rate" | "hard_boundary_agreement_rate" | "product_focus_agreement_rate", number> & { shadow_latency_p50_ms: number; shadow_latency_p95_ms: number; shadow_latency_p99_ms: number }>;
export function aggregateShadowInterpretationEvidenceV1(values: readonly ShadowInterpretationEvidenceV1[], requestsObserved = values.length): ShadowInterpretationMetricsV1 {
  const count = (predicate: (value: ShadowInterpretationEvidenceV1) => boolean) => values.filter(predicate).length;
  const rate = (amount: number, total = values.length) => total ? amount / total : 0;
  const latencies = values.map(value => value.shadow_latency_ms).sort((a, b) => a - b);
  const percentile = (p: number) => latencies.length ? latencies[Math.ceil(p * latencies.length) - 1] ?? 0 : 0;
  const successes=count(v=>!v.failure_class),timeouts=count(v=>v.failure_class==="TIMEOUT"),parser=count(v=>v.parser_valid),closed=count(v=>v.closed_enum_valid),interactions=count(v=>v.interaction_match),boundaries=count(v=>v.hard_boundary_agreement),focused=values.filter(v=>v.deterministic_product_focus!==undefined),focus=focused.filter(v=>v.product_focus_match).length;
  return Object.freeze({ requests_observed: requestsObserved, eligible_shadow_requests: values.length, provider_successes: successes, provider_success_rate:rate(successes), timeouts, timeout_rate:rate(timeouts), parser_valid:parser,parser_valid_rate:rate(parser),closed_enum_valid:closed,closed_enum_valid_rate:rate(closed),interaction_agreements:interactions,interaction_agreement_rate:rate(interactions),hard_boundary_agreements:boundaries,hard_boundary_agreement_rate:rate(boundaries),l1:count(v=>v.hard_boundary_classification==="L1"),l2_critical:count(v=>v.hard_boundary_classification==="L2_CRITICAL"),l2_major:count(v=>v.hard_boundary_classification==="L2_MAJOR"),role_mutations:count(v=>v.role_surface_fidelity==="ROLE_SURFACE_CHANGED"),authority_violations:count(v=>v.grants_authority_observed),execution_violations:count(v=>v.grants_execution_observed),protected_disclosure_violations:count(v=>v.protected_disclosure_violation),product_focus_agreements:focus,product_focus_agreement_rate:rate(focus,focused.length),shadow_latency_p50_ms:percentile(.5),shadow_latency_p95_ms:percentile(.95),shadow_latency_p99_ms:percentile(.99) });
}
