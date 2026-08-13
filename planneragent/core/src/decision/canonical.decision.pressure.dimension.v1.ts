import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import type {
  CanonicalDecisionPressureOrdinalV1,
  CanonicalDecisionPressureProducerCertificationV1,
} from "./canonical.decision.pressure.normalization.policy.v1";
import {
  ordinalVocabularyForDimensionV1,
  verifyCanonicalDecisionPressureProducerCertificationV1,
} from "./canonical.decision.pressure.normalization.policy.v1";

export type CanonicalDecisionPressureDimensionIdentityV1 = "IMPACT" | "URGENCY" | "COST_OF_WAITING";

type DimensionBaseV1 = Readonly<{
  version: 1;
  dimension: CanonicalDecisionPressureDimensionIdentityV1;
  request_id: string;
  company_id: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  evidence_as_of: string;
  evaluated_at: string;
  producer_certification: CanonicalDecisionPressureProducerCertificationV1;
  normalization_input_refs: readonly string[];
  evidence_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  qualification_refs: readonly string[];
  decision_opportunity_status?: "USEFUL_DECISION_REMAINS";
}>;

export type ContinuousDecisionPressureDimensionInputV1 = DimensionBaseV1 & Readonly<{
  projection_mode: "CONTINUOUS";
  value: number;
  numerator_ref: string;
  denominator_ref: string;
  precision_decimal_places: number;
}>;

export type OrdinalDecisionPressureDimensionInputV1 = DimensionBaseV1 & Readonly<{
  projection_mode: "ORDINAL";
  ordinal_state: CanonicalDecisionPressureOrdinalV1;
}>;

export type CanonicalDecisionPressureDimensionInputV1 =
  | ContinuousDecisionPressureDimensionInputV1
  | OrdinalDecisionPressureDimensionInputV1;

export type CanonicalDecisionPressureDimensionV1 =
  CanonicalDecisionPressureDimensionInputV1 & Readonly<{
    producer_id: string;
    producer_version: string;
    normalization_policy_id: string;
    normalization_policy_version: string;
    dimension_id: string;
    dimension_digest: string;
    scope_id: string;
    scope_digest: string;
    digest_algorithm: "SHA-256";
    company_global_claim: false;
    grants_execution: false;
    grants_authority: false;
    grants_remediation: false;
    observational_only: true;
  }>;

const dimensions = new Set<string>(["IMPACT", "URGENCY", "COST_OF_WAITING"]);
function required(value: string, code: string): string { const v = value?.trim(); if (!v) throw new Error(code); return v; }
function reference(value: string, code: string): string { const v = required(value, code); if (!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(v)) throw new Error(code); return v; }
function references(values: readonly string[], code: string): readonly string[] { const v = [...new Set(values.map((x) => reference(x, code)))].sort(); if (!v.length) throw new Error(code); return v; }
function timestamp(value: string, code: string): string { if (!Number.isFinite(Date.parse(value))) throw new Error(code); return value; }
function canonicalJson(value: unknown): string { if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`; if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).filter(([,v]) => v !== undefined).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`; return JSON.stringify(value); }
async function sha256(value: unknown): Promise<string> { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalJson(value))); return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2,"0")).join(""); }
function freeze<T>(value: T): Readonly<T> { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value as Record<string, unknown>).forEach(freeze); Object.freeze(value); } return value; }

export async function createCanonicalDecisionPressureDimensionV1(
  input: CanonicalDecisionPressureDimensionInputV1,
): Promise<CanonicalDecisionPressureDimensionV1> {
  if (input.version !== 1) throw new Error("PRESSURE_DIMENSION_VERSION_UNSUPPORTED");
  if (!dimensions.has(input.dimension)) throw new Error("PRESSURE_DIMENSION_IDENTITY_INVALID");
  for (const forbidden of ["reversibilityScore", "irreversibility", "novelty", "responsibility",
    "plan", "plan_state", "reality", "reality_state", "max", "sum", "average", "child_values"]) {
    if (forbidden in (input as unknown as Record<string, unknown>)) {
      throw new Error("PRESSURE_DIMENSION_UNSUPPORTED_SHORTCUT");
    }
  }
  await verifyCanonicalDecisionPressureProducerCertificationV1(input.producer_certification);
  const certification = input.producer_certification;
  if (certification.dimension !== input.dimension || certification.projection_mode !== input.projection_mode) {
    throw new Error("PRESSURE_DIMENSION_CERTIFICATION_MISMATCH");
  }
  if (!certification.supported_scope_kinds.includes(input.evaluation_scope.scope.scope_type)) {
    throw new Error("PRESSURE_DIMENSION_SCOPE_NOT_CERTIFIED");
  }
  await verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope, input);
  const evidence_as_of = timestamp(input.evidence_as_of, "PRESSURE_DIMENSION_AS_OF_INVALID");
  const evaluated_at = timestamp(input.evaluated_at, "PRESSURE_DIMENSION_EVALUATED_AT_INVALID");
  if (evidence_as_of !== input.evaluation_scope.evidence_as_of || evaluated_at !== input.evaluation_scope.evaluated_at) {
    throw new Error("PRESSURE_DIMENSION_TIME_BINDING_MISMATCH");
  }
  if (Date.parse(evidence_as_of) > Date.parse(evaluated_at)) throw new Error("PRESSURE_DIMENSION_TIME_ORDER_INVALID");
  if (input.dimension === "URGENCY" && input.decision_opportunity_status !== "USEFUL_DECISION_REMAINS") {
    throw new Error("PRESSURE_URGENCY_USEFUL_DECISION_REQUIRED");
  }

  let projection: object;
  if (input.projection_mode === "CONTINUOUS") {
    if (!Number.isFinite(input.value) || input.value < 0 || input.value > 1) throw new Error("PRESSURE_DIMENSION_VALUE_INVALID");
    if (certification.projection_mode !== "CONTINUOUS" || input.precision_decimal_places !== certification.precision_policy.decimal_places) {
      throw new Error("PRESSURE_DIMENSION_PRECISION_POLICY_MISMATCH");
    }
    const factor = 10 ** input.precision_decimal_places;
    if (Math.abs(input.value * factor - Math.round(input.value * factor)) > Number.EPSILON * factor) {
      throw new Error("PRESSURE_DIMENSION_PRECISION_INVALID");
    }
    projection = { projection_mode: "CONTINUOUS", value: input.value,
      numerator_ref: reference(input.numerator_ref, "PRESSURE_DIMENSION_NUMERATOR_REQUIRED"),
      denominator_ref: reference(input.denominator_ref, "PRESSURE_DIMENSION_DENOMINATOR_REQUIRED"),
      precision_decimal_places: input.precision_decimal_places };
  } else {
    if ((input as unknown as { value?: unknown }).value !== undefined) throw new Error("PRESSURE_ORDINAL_NUMERIC_VALUE_FORBIDDEN");
    const allowed = ordinalVocabularyForDimensionV1(input.dimension);
    if (!allowed.includes(input.ordinal_state)) throw new Error("PRESSURE_DIMENSION_ORDINAL_STATE_INVALID");
    projection = { projection_mode: "ORDINAL", ordinal_state: input.ordinal_state };
  }

  const semantic = { version: 1 as const, dimension: input.dimension,
    request_id: required(input.request_id, "PRESSURE_DIMENSION_REQUEST_REQUIRED"),
    company_id: required(input.company_id, "PRESSURE_DIMENSION_COMPANY_REQUIRED"),
    scope_id: input.evaluation_scope.scope.scope_id, scope_digest: input.evaluation_scope.scope.scope_digest,
    evidence_as_of, evaluated_at, certification_id: certification.certification_id,
    producer_id: certification.producer_id, producer_version: certification.producer_version,
    normalization_policy_id: certification.normalization_policy_id,
    normalization_policy_version: certification.normalization_policy_version,
    normalization_input_refs: references(input.normalization_input_refs, "PRESSURE_DIMENSION_NORMALIZATION_INPUT_REQUIRED"),
    evidence_refs: references(input.evidence_refs, "PRESSURE_DIMENSION_EVIDENCE_REQUIRED"),
    provenance_refs: references(input.provenance_refs, "PRESSURE_DIMENSION_PROVENANCE_REQUIRED"),
    causal_lineage_refs: references(input.causal_lineage_refs, "PRESSURE_DIMENSION_LINEAGE_REQUIRED"),
    qualification_refs: references(input.qualification_refs, "PRESSURE_DIMENSION_QUALIFICATION_REQUIRED"),
    ...(input.dimension === "URGENCY" ? { decision_opportunity_status: input.decision_opportunity_status } : {}),
    ...projection };
  const dimension_digest = await sha256(semantic);
  return freeze({ ...input, ...semantic,
    dimension_id: `canonical-decision-pressure-dimension:sha256:${dimension_digest}`,
    dimension_digest, digest_algorithm: "SHA-256" as const, company_global_claim: false as const,
    grants_execution: false as const, grants_authority: false as const,
    grants_remediation: false as const, observational_only: true as const,
  }) as CanonicalDecisionPressureDimensionV1;
}
