import type { OperationalSignalScopeTypeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import type { CanonicalDecisionPressureDimensionIdentityV1 } from "./canonical.decision.pressure.dimension.v1";

export type CanonicalDecisionPressureProjectionModeV1 = "CONTINUOUS" | "ORDINAL";
export type ImpactOrdinalV1 = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type UrgencyOrdinalV1 = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type CostOfWaitingOrdinalV1 = "NEGLIGIBLE" | "LIMITED" | "MATERIAL" | "SEVERE";
export type CanonicalDecisionPressureOrdinalV1 = ImpactOrdinalV1 | UrgencyOrdinalV1 | CostOfWaitingOrdinalV1;

type CertificationBaseV1 = Readonly<{
  version: 1;
  dimension: CanonicalDecisionPressureDimensionIdentityV1;
  producer_id: string;
  producer_version: string;
  normalization_policy_id: string;
  normalization_policy_version: string;
  domain_profile_id: string;
  domain_profile_version: string;
  supported_scope_kinds: readonly OperationalSignalScopeTypeV1[];
  endpoint_semantics: "CANONICAL_PRESSURE_DIMENSION_ENDPOINTS_V1";
  monotonicity: "NON_DECREASING_CANONICAL_MAGNITUDE";
  reference_basis_semantics: string;
  evidence_requirement_refs: readonly string[];
  qualification_requirement_refs: readonly string[];
  composition_restriction: "DOMAIN_SCOPED_PROJECTION_NO_GENERIC_CHILD_COMPOSITION";
  provenance_required: true;
  causal_lineage_required: true;
}>;

export type ContinuousDimensionProducerCertificationInputV1 = CertificationBaseV1 & Readonly<{
  projection_mode: "CONTINUOUS";
  precision_policy: Readonly<{ kind: "DECIMAL_PLACES"; decimal_places: number }>;
}>;

export type OrdinalDimensionProducerCertificationInputV1 = CertificationBaseV1 & Readonly<{
  projection_mode: "ORDINAL";
  ordinal_vocabulary: readonly CanonicalDecisionPressureOrdinalV1[];
}>;

export type CanonicalDecisionPressureProducerCertificationInputV1 =
  | ContinuousDimensionProducerCertificationInputV1
  | OrdinalDimensionProducerCertificationInputV1;

export type CanonicalDecisionPressureProducerCertificationV1 =
  CanonicalDecisionPressureProducerCertificationInputV1 & Readonly<{
    certification_id: string;
    certification_digest: string;
    digest_algorithm: "SHA-256";
    grants_execution: false;
    grants_authority: false;
    grants_remediation: false;
    observational_only: true;
  }>;

const dimensions = new Set(["IMPACT", "URGENCY", "COST_OF_WAITING"]);
const scopes = new Set(["REQUEST_DATASET", "ENTITY", "PATH"]);
const vocabularies: Record<CanonicalDecisionPressureDimensionIdentityV1, readonly string[]> = {
  IMPACT: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
  URGENCY: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
  COST_OF_WAITING: ["NEGLIGIBLE", "LIMITED", "MATERIAL", "SEVERE"],
};

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
  const normalized = [...new Set(values.map((value) => reference(value, code)))].sort();
  if (!normalized.length) throw new Error(code);
  return normalized;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function digest(value: unknown): Promise<string> {
  const result = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalJson(value)));
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export function ordinalVocabularyForDimensionV1(
  dimension: CanonicalDecisionPressureDimensionIdentityV1,
): readonly CanonicalDecisionPressureOrdinalV1[] {
  if (!dimensions.has(dimension)) throw new Error("PRESSURE_CERTIFICATION_DIMENSION_INVALID");
  return vocabularies[dimension] as readonly CanonicalDecisionPressureOrdinalV1[];
}

export async function createCanonicalDecisionPressureProducerCertificationV1(
  input: CanonicalDecisionPressureProducerCertificationInputV1,
): Promise<CanonicalDecisionPressureProducerCertificationV1> {
  if (input.version !== 1) throw new Error("PRESSURE_CERTIFICATION_VERSION_UNSUPPORTED");
  if (!dimensions.has(input.dimension)) throw new Error("PRESSURE_CERTIFICATION_DIMENSION_INVALID");
  const supported_scope_kinds = [...new Set(input.supported_scope_kinds)].sort();
  if (!supported_scope_kinds.length || supported_scope_kinds.some((scope) => !scopes.has(scope))) {
    throw new Error("PRESSURE_CERTIFICATION_SCOPE_INVALID");
  }
  if (input.endpoint_semantics !== "CANONICAL_PRESSURE_DIMENSION_ENDPOINTS_V1" ||
      input.monotonicity !== "NON_DECREASING_CANONICAL_MAGNITUDE" ||
      input.composition_restriction !== "DOMAIN_SCOPED_PROJECTION_NO_GENERIC_CHILD_COMPOSITION" ||
      input.provenance_required !== true || input.causal_lineage_required !== true) {
    throw new Error("PRESSURE_CERTIFICATION_INVARIANT_INVALID");
  }

  const projection = input.projection_mode === "CONTINUOUS"
    ? (() => {
      const places = input.precision_policy?.decimal_places;
      if (!Number.isSafeInteger(places) || places < 0) {
        throw new Error("PRESSURE_CERTIFICATION_PRECISION_INVALID");
      }
      return { projection_mode: "CONTINUOUS" as const,
        precision_policy: { kind: "DECIMAL_PLACES" as const, decimal_places: places } };
    })()
    : (() => {
      const expected = ordinalVocabularyForDimensionV1(input.dimension);
      if (input.ordinal_vocabulary.length !== expected.length ||
          input.ordinal_vocabulary.some((item, index) => item !== expected[index])) {
        throw new Error("PRESSURE_CERTIFICATION_ORDINAL_VOCABULARY_INVALID");
      }
      return { projection_mode: "ORDINAL" as const, ordinal_vocabulary: [...expected] };
    })();

  const semantic = {
    version: 1 as const, dimension: input.dimension,
    producer_id: reference(input.producer_id, "PRESSURE_CERTIFICATION_PRODUCER_REQUIRED"),
    producer_version: required(input.producer_version, "PRESSURE_CERTIFICATION_PRODUCER_VERSION_REQUIRED"),
    normalization_policy_id: reference(input.normalization_policy_id, "PRESSURE_CERTIFICATION_POLICY_REQUIRED"),
    normalization_policy_version: required(input.normalization_policy_version, "PRESSURE_CERTIFICATION_POLICY_VERSION_REQUIRED"),
    domain_profile_id: reference(input.domain_profile_id, "PRESSURE_CERTIFICATION_DOMAIN_PROFILE_REQUIRED"),
    domain_profile_version: required(input.domain_profile_version, "PRESSURE_CERTIFICATION_DOMAIN_PROFILE_VERSION_REQUIRED"),
    supported_scope_kinds: supported_scope_kinds as readonly OperationalSignalScopeTypeV1[],
    endpoint_semantics: input.endpoint_semantics, monotonicity: input.monotonicity,
    reference_basis_semantics: required(input.reference_basis_semantics, "PRESSURE_CERTIFICATION_REFERENCE_BASIS_REQUIRED"),
    evidence_requirement_refs: references(input.evidence_requirement_refs, "PRESSURE_CERTIFICATION_EVIDENCE_REQUIREMENTS_REQUIRED"),
    qualification_requirement_refs: references(input.qualification_requirement_refs, "PRESSURE_CERTIFICATION_QUALIFICATION_REQUIREMENTS_REQUIRED"),
    composition_restriction: input.composition_restriction,
    provenance_required: true as const, causal_lineage_required: true as const,
    ...projection,
  };
  const certification_digest = await digest(semantic);
  return freeze({ ...semantic,
    certification_id: `canonical-pressure-producer-certification:sha256:${certification_digest}`,
    certification_digest, digest_algorithm: "SHA-256" as const, grants_execution: false as const,
    grants_authority: false as const, grants_remediation: false as const, observational_only: true as const,
  }) as CanonicalDecisionPressureProducerCertificationV1;
}

export async function verifyCanonicalDecisionPressureProducerCertificationV1(
  certification: CanonicalDecisionPressureProducerCertificationV1,
): Promise<void> {
  const rebuilt = await createCanonicalDecisionPressureProducerCertificationV1(certification);
  if (rebuilt.certification_id !== certification.certification_id ||
      rebuilt.certification_digest !== certification.certification_digest) {
    throw new Error("PRESSURE_CERTIFICATION_DIGEST_MISMATCH");
  }
}
