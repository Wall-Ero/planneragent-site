import { createHash } from "node:crypto";
import type { ConversationalInterpretationResultV1, ConversationalProviderDescriptorV1, SealedConversationalInterpretationRequestV1, SealedConversationalRealizationRequestV1 } from "./conversational.cognition.contracts.v1";
import type { RealizationEnvelopeV1 } from "../cognitive.realization.envelope.v1";

export const HYBRID_SURFACE_BOUNDARY_V1 = "CONVERSATIONAL_SURFACE_ONLY" as const;
export const HYBRID_FOUNDATION_STATE_V1 = "HYBRID_CONVERSATIONAL_FOUNDATION_OFFLINE" as const;
export const HYBRID_LIFECYCLE_V1 = Object.freeze(["SHADOW", "SUPERVISED", "MATURING", "SOVEREIGN"] as const);
export type HybridPurposeV1 = "INTERPRETATION" | "REALIZATION";
export type HybridLifecycleV1 = typeof HYBRID_LIFECYCLE_V1[number];
export type HybridRequestV1 =
  | Readonly<{ purpose: "INTERPRETATION"; payload: SealedConversationalInterpretationRequestV1 }>
  | Readonly<{ purpose: "REALIZATION"; payload: SealedConversationalRealizationRequestV1<unknown> }>;
export type HybridCandidateV1 = ConversationalInterpretationResultV1 | RealizationEnvelopeV1;
export type HybridCheckV1 = "PASS" | "FAIL" | "INCONCLUSIVE";
export const HYBRID_CHECKS_V1 = Object.freeze(["semantic_fidelity", "authority_boundary", "uncertainty_preservation", "exposure_boundary"] as const);

// Host policy/review evidence, never a confidence field returned by a model.
export type HybridIndependentVerificationV1 = Readonly<{
  verifier_id: string;
  method: "DETERMINISTIC_POLICY" | "INDEPENDENT_REVIEW";
  policy_ref: string;
  evidence_ref: string;
  qualified_scope_ref: string;
  request_digest: string;
  candidate_digest: string;
  checks: Readonly<Record<typeof HYBRID_CHECKS_V1[number], HybridCheckV1>>;
}>;
export type HybridGateVerdictV1 = Readonly<{
  status: HybridCheckV1;
  schema_valid: boolean;
  reason: "VERIFIED_WITHIN_SCOPE" | "INVALID_CONTRACT" | "VERIFICATION_UNAVAILABLE" | "VERIFICATION_INCONCLUSIVE" | "CONSTRAINT_VIOLATION";
  critical_violation: boolean;
  verification?: HybridIndependentVerificationV1;
}>;
export type HybridExposureAdmissionV1 = Readonly<{
  boundary: typeof HYBRID_SURFACE_BOUNDARY_V1;
  classification: "PUBLIC_SAFE" | "SYNTHETIC_FIXTURE";
  request_digest: string;
  evidence_ref: string;
}>;
export type HybridUsageV1 = Readonly<{ input_tokens: number; output_tokens: number; neurons: number }>;
// Sanitized host error, not provider text. Optional usage is independently metered
// transport evidence; an LLM assertion cannot establish consumption or retry safety.
export class HybridTeacherProviderErrorV1 extends Error {
  readonly usage?: HybridUsageV1;
  constructor(readonly code: string, readonly retryable: boolean, readonly consumption_unknown = false, usage?: HybridUsageV1) {
    if (!/^[A-Z0-9_]{1,80}$/.test(code)) throw new TypeError("HYBRID_INVALID_PROVIDER_ERROR_CODE");
    super(code);
    this.name = "HybridTeacherProviderErrorV1";
    if (usage) this.usage = hybridSnapshotV1(usage);
  }
}
export type HybridTeacherLimitsV1 = Readonly<{
  max_input_bytes: number; max_input_tokens: number; max_output_tokens: number;
  max_neurons_per_attempt: number; timeout_ms: number; max_retries: number;
}>;
export type HybridTeacherRequestV1 = Readonly<{
  version: 1;
  boundary: typeof HYBRID_SURFACE_BOUNDARY_V1;
  purpose: HybridPurposeV1;
  request_id: string;
  request_digest: string;
  model: string;
  model_revision: string;
  configuration_version: string;
  contracts: Readonly<{ interpretation: 1; realization: 1; teacher: 1 }>;
  exposure: HybridExposureAdmissionV1;
  surface: HybridRequestV1;
  limits: HybridTeacherLimitsV1;
  escalation_reason: string;
  attempt: number;
  state: "RESERVED";
}>;
export interface HybridTeacherProviderV1 {
  readonly mode: "MOCK_ONLY";
  readonly provider_id: "CLOUDFLARE_WORKERS_AI";
  readonly model: string;
  readonly model_revision: string;
  readonly configuration_version: string;
  complete(request: HybridTeacherRequestV1, signal: AbortSignal): Promise<Readonly<{ candidate: unknown; usage: HybridUsageV1 }>>;
}
export interface HybridStudentV1 {
  readonly descriptor: ConversationalProviderDescriptorV1;
  propose(request: HybridRequestV1, signal: AbortSignal): Promise<unknown>;
}
export type HybridTeacherAttemptV1 = Readonly<{
  attempt: number;
  state: "VERIFIED" | "REJECTED" | "TIMEOUT" | "PROVIDER_ERROR" | "METERING_INVALID" | "BUDGET_DENIED";
  reserved_neurons: number;
  usage?: HybridUsageV1;
  gate?: HybridGateVerdictV1;
  failure_code?: string;
}>;

export function hybridCanonicalV1(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(hybridCanonicalV1).join(",")}]`;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${hybridCanonicalV1((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  throw new TypeError("HYBRID_NON_JSON_VALUE");
}
export const hybridDigestV1 = (value: unknown): string => `sha256:${createHash("sha256").update(hybridCanonicalV1(value)).digest("hex")}`;
export function hybridSnapshotV1<T>(value: T): Readonly<T> {
  const copy = JSON.parse(hybridCanonicalV1(value));
  function freeze(v: any): any { if (v && typeof v === "object") { Object.values(v).forEach(freeze); Object.freeze(v); } return v; }
  return freeze(copy);
}

// No transition authority or promotion thresholds are introduced in STEP 13A.
export function assessHybridLifecycleV1(requested: HybridLifecycleV1) {
  return Object.freeze({ state: "SHADOW" as const, teacher_live_enabled: false as const,
    transition_allowed: false as const, formal_qualification_required: true as const,
    reason: requested === "SHADOW" ? "INITIAL_OFFLINE_STATE" : "STEP13A_TRANSITION_BLOCKED",
    regression_action: "DISABLE_TEACHER_AND_RETURN_TO_SHADOW" as const });
}
