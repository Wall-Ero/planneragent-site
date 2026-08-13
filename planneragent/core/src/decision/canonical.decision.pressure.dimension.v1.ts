import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";

export type CanonicalDecisionPressureDimensionIdentityV1 =
  | "IMPACT"
  | "URGENCY"
  | "COST_OF_WAITING";

export type CanonicalDecisionPressureDimensionInputV1 = Readonly<{
  version: 1;
  dimension: CanonicalDecisionPressureDimensionIdentityV1;
  value: number;
  request_id: string;
  company_id: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  evidence_as_of: string;
  evaluated_at: string;
  producer_id: string;
  producer_version: string;
  evidence_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  qualification_refs: readonly string[];
}>;

export type CanonicalDecisionPressureDimensionV1 =
  CanonicalDecisionPressureDimensionInputV1 & Readonly<{
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

function required(value: string, code: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function reference(value: string, code: string): string {
  const normalized = required(value, code);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(normalized)) throw new Error(code);
  return normalized;
}

function references(values: readonly string[], code: string): readonly string[] {
  const normalized = [...new Set(values.map((value) => reference(value, code)))]
    .sort((a, b) => a.localeCompare(b));
  if (!normalized.length) throw new Error(code);
  return normalized;
}

function timestamp(value: string, code: string): string {
  if (!Number.isFinite(Date.parse(value))) throw new Error(code);
  return value;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalJson(value)),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export async function createCanonicalDecisionPressureDimensionV1(
  input: CanonicalDecisionPressureDimensionInputV1,
): Promise<CanonicalDecisionPressureDimensionV1> {
  if (input.version !== 1) throw new Error("PRESSURE_DIMENSION_VERSION_UNSUPPORTED");
  if (!dimensions.has(input.dimension)) throw new Error("PRESSURE_DIMENSION_IDENTITY_INVALID");
  if (!Number.isFinite(input.value) || input.value < 0 || input.value > 1) {
    throw new Error("PRESSURE_DIMENSION_VALUE_INVALID");
  }

  await verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope, input);
  if (input.evaluation_scope.scope.request_id !== input.request_id) {
    throw new Error("PRESSURE_DIMENSION_REQUEST_MISMATCH");
  }
  if (input.evaluation_scope.scope.company_id !== input.company_id) {
    throw new Error("PRESSURE_DIMENSION_COMPANY_MISMATCH");
  }

  const evidence_as_of = timestamp(input.evidence_as_of, "PRESSURE_DIMENSION_AS_OF_INVALID");
  const evaluated_at = timestamp(input.evaluated_at, "PRESSURE_DIMENSION_EVALUATED_AT_INVALID");
  if (evidence_as_of !== input.evaluation_scope.evidence_as_of ||
      evaluated_at !== input.evaluation_scope.evaluated_at) {
    throw new Error("PRESSURE_DIMENSION_TIME_BINDING_MISMATCH");
  }
  if (Date.parse(evidence_as_of) > Date.parse(evaluated_at)) {
    throw new Error("PRESSURE_DIMENSION_TIME_ORDER_INVALID");
  }

  const semantic = {
    version: 1 as const,
    dimension: input.dimension,
    value: input.value,
    request_id: required(input.request_id, "PRESSURE_DIMENSION_REQUEST_REQUIRED"),
    company_id: required(input.company_id, "PRESSURE_DIMENSION_COMPANY_REQUIRED"),
    scope_id: input.evaluation_scope.scope.scope_id,
    scope_digest: input.evaluation_scope.scope.scope_digest,
    evidence_as_of,
    evaluated_at,
    producer_id: reference(input.producer_id, "PRESSURE_DIMENSION_PRODUCER_REQUIRED"),
    producer_version: required(input.producer_version, "PRESSURE_DIMENSION_PRODUCER_VERSION_REQUIRED"),
    evidence_refs: references(input.evidence_refs, "PRESSURE_DIMENSION_EVIDENCE_REQUIRED"),
    provenance_refs: references(input.provenance_refs, "PRESSURE_DIMENSION_PROVENANCE_REQUIRED"),
    causal_lineage_refs: references(input.causal_lineage_refs, "PRESSURE_DIMENSION_LINEAGE_REQUIRED"),
    qualification_refs: references(input.qualification_refs, "PRESSURE_DIMENSION_QUALIFICATION_REQUIRED"),
  };
  const dimension_digest = await sha256(semantic);

  return freeze({
    ...input,
    ...semantic,
    dimension_id: `canonical-decision-pressure-dimension:sha256:${dimension_digest}`,
    dimension_digest,
    digest_algorithm: "SHA-256" as const,
    company_global_claim: false as const,
    grants_execution: false as const,
    grants_authority: false as const,
    grants_remediation: false as const,
    observational_only: true as const,
  }) as CanonicalDecisionPressureDimensionV1;
}
