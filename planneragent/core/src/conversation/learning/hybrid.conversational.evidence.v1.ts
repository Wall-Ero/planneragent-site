import { hybridDigestV1, hybridSnapshotV1, type HybridGateVerdictV1, type HybridPurposeV1, type HybridTeacherAttemptV1 } from "../cognition/hybrid.conversational.contracts.v1";
import { createConversationalTrainingSourceEligibilityDecisionV1, isConversationalTrainingSourceEligibleV1, type ConversationalTrainingSourceEligibilityDecisionV1, type ConversationalTrainingSourceIdentityV1 } from "./conversational.training.source.eligibility.v1";

export type HybridLearningStateV1 = "RUNTIME_ONLY" | "PENDING_ELIGIBILITY" | "TRAINING_ELIGIBLE" | "REJECTED";
export type HybridObservationV1 = Readonly<{
  version: 1;
  boundary: "CONVERSATIONAL_SURFACE_ONLY";
  lifecycle: "SHADOW";
  request_id: string;
  request_digest: string;
  purpose: HybridPurposeV1;
  semantic_family: string;
  evaluation_kind: "RUNTIME" | "INDEPENDENT_NEW" | "FROZEN_EVALUATION";
  student_identity: Readonly<{ provider_id: string; model_id: string; model_version: string }>;
  student_state: "COMPLETED" | "TIMEOUT" | "PROVIDER_ERROR" | "EXPOSURE_DENIED";
  student_gate: HybridGateVerdictV1;
  teacher_requested: boolean;
  teacher_identity?: Readonly<{ provider_id: string; model_id: string; model_revision: string; configuration_version: string }>;
  teacher_attempts: readonly HybridTeacherAttemptV1[];
  disposition: "STUDENT_VERIFIED" | "TEACHER_VERIFIED" | "CLARIFICATION_REQUIRED" | "DETERMINISTIC_FALLBACK";
  source: ConversationalTrainingSourceIdentityV1;
  selected_candidate_digest?: string;
  learning_state: "RUNTIME_ONLY" | "PENDING_ELIGIBILITY" | "REJECTED";
  observation_digest: string;
}>;

function exactFields(value: unknown, required: readonly string[], optional: readonly string[] = []): void {
  if (!value || typeof value !== "object" || Array.isArray(value) || required.some(k => !Object.hasOwn(value, k)) ||
      Object.keys(value).some(k => !required.includes(k) && !optional.includes(k))) throw new TypeError("HYBRID_EVIDENCE_CONTENT_FORBIDDEN");
}
function gateFields(value: HybridGateVerdictV1): void {
  exactFields(value, ["status", "schema_valid", "reason", "critical_violation"], ["verification"]);
  if (value.verification) {
    exactFields(value.verification, ["verifier_id", "method", "policy_ref", "evidence_ref", "qualified_scope_ref", "request_digest", "candidate_digest", "checks"]);
    exactFields(value.verification.checks, ["semantic_fidelity", "authority_boundary", "uncertainty_preservation", "exposure_boundary"]);
  }
}

export function createHybridObservationV1(input: Omit<HybridObservationV1, "version" | "boundary" | "lifecycle" | "learning_state" | "observation_digest">): HybridObservationV1 {
  const optional = ["selected_candidate_digest", "teacher_identity"];
  const required = ["request_id", "request_digest", "purpose", "semantic_family", "evaluation_kind", "student_identity", "student_state", "student_gate", "teacher_requested", "teacher_attempts", "disposition", "source"];
  exactFields(input, required, optional);
  exactFields(input.student_identity, ["provider_id", "model_id", "model_version"]);
  if (input.teacher_identity) exactFields(input.teacher_identity, ["provider_id", "model_id", "model_revision", "configuration_version"]);
  exactFields(input.source, ["source_kind", "generator_id", "generator_version"], ["model"]);
  if (input.source.model) exactFields(input.source.model, ["provider_id", "model_id", "model_version", "adapter_id", "adapter_version"]);
  gateFields(input.student_gate);
  for (const attempt of input.teacher_attempts) {
    exactFields(attempt, ["attempt", "state", "reserved_neurons"], ["usage", "gate", "failure_code"]);
    if (attempt.failure_code !== undefined && !/^[A-Z0-9_]{1,80}$/.test(attempt.failure_code)) throw new TypeError("HYBRID_EVIDENCE_UNSAFE_FAILURE_CODE");
    if (attempt.usage) exactFields(attempt.usage, ["input_tokens", "output_tokens", "neurons"]);
    if (attempt.gate) gateFields(attempt.gate);
  }
  const learning_state: HybridObservationV1["learning_state"] = input.evaluation_kind === "FROZEN_EVALUATION" ? "REJECTED" : input.teacher_requested ? "PENDING_ELIGIBILITY" : "RUNTIME_ONLY";
  const value = { ...input, version: 1 as const, boundary: "CONVERSATIONAL_SURFACE_ONLY" as const, lifecycle: "SHADOW" as const, learning_state };
  return hybridSnapshotV1({ ...value, observation_digest: hybridDigestV1(value) });
}

export interface HybridEvidenceRegistryV1 { append(observation: HybridObservationV1): Promise<void> }

// Separate, content-free offline observation registry; not operational memory, business ledger,
// a durable production store, or a TRAIN export. No automatic eligibility transition exists.
export class OfflineHybridEvidenceRegistryV1 implements HybridEvidenceRegistryV1 {
  readonly mode = "VOLATILE_OFFLINE_ONLY" as const;
  private readonly observations = new Map<string, HybridObservationV1>();
  async append(observation: HybridObservationV1): Promise<void> {
    const { version, boundary, lifecycle, learning_state, observation_digest, ...content } = observation;
    const rebuilt = createHybridObservationV1(content);
    if (version !== 1 || boundary !== rebuilt.boundary || lifecycle !== "SHADOW" || learning_state !== rebuilt.learning_state || observation_digest !== rebuilt.observation_digest) throw new TypeError("HYBRID_EVIDENCE_INTEGRITY_INVALID");
    const key = `${observation.purpose}:${observation.request_id}`;
    const previous = this.observations.get(key);
    if (previous && previous.observation_digest !== observation.observation_digest) throw new Error("HYBRID_EVIDENCE_ID_COLLISION");
    this.observations.set(key, hybridSnapshotV1(observation));
  }
  list(): readonly HybridObservationV1[] { return Object.freeze([...this.observations.values()]); }
}

export const HYBRID_ELIGIBILITY_REQUIREMENTS_V1 = Object.freeze(["provenance", "license_and_terms", "usage_rights", "authorized_data_only", "independent_semantic_validation", "frozen_split_separation"] as const);
export type HybridEligibilityReviewV1 = Readonly<{
  observation_digest: string;
  reviewer_ref: string;
  requirements: Readonly<Record<typeof HYBRID_ELIGIBILITY_REQUIREMENTS_V1[number], Readonly<{ status: "VERIFIED" | "UNKNOWN" | "DENIED"; evidence_ref?: string }>>>;
  source_decision: ConversationalTrainingSourceEligibilityDecisionV1;
}>;
export function classifyHybridLearningEvidenceV1(observation: HybridObservationV1, at: string, review?: HybridEligibilityReviewV1): Readonly<{ state: HybridLearningStateV1; reason: string; exports_train: false }> {
  const result = (state: HybridLearningStateV1, reason: string) => Object.freeze({ state, reason, exports_train: false as const });
  if (observation.evaluation_kind === "FROZEN_EVALUATION") return result("REJECTED", "FROZEN_SPLIT_EXCLUDED");
  if (!review) return result(observation.learning_state, "NO_INDEPENDENT_ELIGIBILITY_REVIEW");
  if (review.observation_digest !== observation.observation_digest || !review.reviewer_ref?.trim()) return result("REJECTED", "REVIEW_BINDING_INVALID");
  if (!observation.selected_candidate_digest) return result("REJECTED", "NO_VERIFIED_CANDIDATE");
  const checks = HYBRID_ELIGIBILITY_REQUIREMENTS_V1.map(key => review.requirements?.[key]);
  if (checks.some(check => check?.status === "DENIED")) return result("REJECTED", "ELIGIBILITY_DENIED");
  if (checks.some(check => check?.status !== "VERIFIED" || !check.evidence_ref?.trim())) return result("PENDING_ELIGIBILITY", "ELIGIBILITY_EVIDENCE_INCOMPLETE");
  try {
    const { decision_digest, ...decisionInput } = review.source_decision;
    const decision = createConversationalTrainingSourceEligibilityDecisionV1(decisionInput);
    if (decision.decision_digest !== decision_digest) return result("REJECTED", "SOURCE_ELIGIBILITY_INVALID");
    if (decision.eligibility === "DENIED") return result("REJECTED", "SOURCE_ELIGIBILITY_DENIED");
    if (!isConversationalTrainingSourceEligibleV1(decision, observation.source, "SUPERVISED_TRAINING_MATERIAL", at)) return result("PENDING_ELIGIBILITY", "SOURCE_ELIGIBILITY_NOT_ESTABLISHED");
  } catch { return result("REJECTED", "SOURCE_ELIGIBILITY_INVALID"); }
  return result("TRAINING_ELIGIBLE", "INDEPENDENT_REVIEW_COMPLETE");
}

export type HybridIndependentAuditV1 = Readonly<{
  observation_digest: string;
  candidate_digest: string;
  evidence_ref: string;
  result: "PASS" | "FAIL";
}>;
export function summarizeHybridMaturationV1(observations: readonly HybridObservationV1[], audits: readonly HybridIndependentAuditV1[] = []) {
  const ids = observations.map(o => `${o.purpose}:${o.request_id}`);
  if (new Set(ids).size !== ids.length) throw new TypeError("HYBRID_DUPLICATE_METRIC_OBSERVATION");
  const result = (purpose: HybridPurposeV1) => {
    const rows = observations.filter(o => o.purpose === purpose);
    const count = (f: (o: HybridObservationV1) => boolean) => rows.filter(f).length;
    const escalations = count(o => o.teacher_requested), autonomous = count(o => o.disposition === "STUDENT_VERIFIED");
    const linked = rows.filter(o => !!o.selected_candidate_digest && audits.some(a => a.observation_digest === o.observation_digest && a.candidate_digest === o.selected_candidate_digest && !!a.evidence_ref.trim() && (a.result === "PASS" || a.result === "FAIL")));
    const lateFailures = linked.filter(o => audits.some(a => a.observation_digest === o.observation_digest && a.candidate_digest === o.selected_candidate_digest && !!a.evidence_ref.trim() && a.result === "FAIL"));
    const families: Record<string, number> = {};
    for (const o of rows) if (o.student_state !== "COMPLETED" || o.student_gate.status !== "PASS") families[o.semantic_family] = (families[o.semantic_family] ?? 0) + 1;
    return hybridSnapshotV1({ total_requests: rows.length, teacher_escalations: escalations,
      teacher_escalation_rate: rows.length ? escalations / rows.length : null,
      requests_with_teacher_calls: count(o => o.teacher_attempts.some(a => a.state !== "BUDGET_DENIED")),
      teacher_call_rate: rows.length ? count(o => o.teacher_attempts.some(a => a.state !== "BUDGET_DENIED")) / rows.length : null,
      autonomous_verified_within_scope: autonomous, autonomous_verified_rate: rows.length ? autonomous / rows.length : null,
      errors_by_semantic_family: families, critical_violations: rows.reduce((n, o) => n + Number(o.student_gate.critical_violation) + o.teacher_attempts.filter(a => a.gate?.critical_violation).length, 0),
      deterministic_fallbacks: count(o => o.disposition === "DETERMINISTIC_FALLBACK"), clarification_required: count(o => o.disposition === "CLARIFICATION_REQUIRED"),
      independent_new_requests: count(o => o.evaluation_kind === "INDEPENDENT_NEW"), independent_audited: linked.length,
      independent_passes: linked.length - lateFailures.length, undetected_gate_errors: lateFailures.length,
      independent_new_audited: linked.filter(o => o.evaluation_kind === "INDEPENDENT_NEW").length,
      independent_new_failures: lateFailures.filter(o => o.evaluation_kind === "INDEPENDENT_NEW").length,
      independent_new_passes: linked.filter(o => o.evaluation_kind === "INDEPENDENT_NEW" && !lateFailures.includes(o)).length,
      mock_reserved_neurons: rows.reduce((n, o) => n + o.teacher_attempts.reduce((s, a) => s + a.reserved_neurons, 0), 0),
      mock_measured_neurons: rows.reduce((n, o) => n + o.teacher_attempts.reduce((s, a) => s + (a.usage?.neurons ?? 0), 0), 0),
      unknown_consumption_attempts: rows.reduce((n, o) => n + o.teacher_attempts.filter(a => a.reserved_neurons > 0 && !a.usage).length, 0),
      live_quota_usage: "NOT_MEASURED_NO_REAL_CALLS", promotion: "NOT_AUTHORIZED", quality_inference_from_escalation_rate: false,
    });
  };
  return hybridSnapshotV1({ lifecycle: "SHADOW", INTERPRETATION: result("INTERPRETATION"), REALIZATION: result("REALIZATION") });
}
