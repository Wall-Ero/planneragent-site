import { createHash } from "node:crypto";
import type {
  GovernedUploadVerificationResultV1,
} from "../../operational-identity/verification";

export const CANONICAL_PROVENANCE_VERSION = 1 as const;
export const CANONICAL_PROVENANCE_DIGEST_ALGORITHM = "SHA-256" as const;
export const CANONICAL_PROVENANCE_ATTESTATION_PROFILE =
  "PLANNERAGENT_CANONICAL_PROVENANCE_ATTESTATION_V1" as const;

export type CanonicalProvenanceAttestationKind =
  | "OPERATIONAL_IDENTITY"
  | "AUTHORIZATION"
  | "ACQUISITION"
  | "INTERPRETATION"
  | "DATASET"
  | "CANONICAL_FACT";

interface CanonicalAttestationBaseV1 {
  readonly version: typeof CANONICAL_PROVENANCE_VERSION;
  readonly kind: CanonicalProvenanceAttestationKind;
  readonly attestation_id: string;
  readonly attestation_profile:
    typeof CANONICAL_PROVENANCE_ATTESTATION_PROFILE;
  readonly digest_algorithm: typeof CANONICAL_PROVENANCE_DIGEST_ALGORITHM;
  readonly previous_attestation_id: string | null;
}

export interface OperationalIdentityProvenanceAttestationV1
  extends CanonicalAttestationBaseV1 {
  readonly kind: "OPERATIONAL_IDENTITY";
  readonly previous_attestation_id: null;
  readonly facts: Readonly<{
    principal_id: string;
    session_id: string;
    membership_id: string;
    company_id: string;
    tenant_id: string;
    ownership_reference: string;
  }>;
}

export interface AuthorizationProvenanceAttestationV1
  extends CanonicalAttestationBaseV1 {
  readonly kind: "AUTHORIZATION";
  readonly previous_attestation_id: string;
  readonly previous: OperationalIdentityProvenanceAttestationV1;
  readonly facts: Readonly<{
    authorization_decision_id: string;
    consumption_reference: string;
    permission: string;
    resource: string;
    purpose: string;
    policy_version: string;
  }>;
}

export interface AcquisitionProvenanceAttestationV1
  extends CanonicalAttestationBaseV1 {
  readonly kind: "ACQUISITION";
  readonly previous_attestation_id: string;
  readonly previous: AuthorizationProvenanceAttestationV1;
  readonly facts: Readonly<{
    admitted_object_id: string;
    acquisition_id: string;
    upload_id: string;
    acquisition_profile: string;
    interpretation_registry_version: string;
    quarantine_reference: string;
    inspection_id: string;
    malware_scan_id: string;
    detected_format: string;
    admitted_at: string;
    byte_length: number;
    source_byte_digest: Readonly<{
      subject: "ACQUIRED_SOURCE_BYTES";
      algorithm: "SHA-256";
      value: string;
    }>;
  }>;
}

export interface InterpretationProvenanceAttestationV1
  extends CanonicalAttestationBaseV1 {
  readonly kind: "INTERPRETATION";
  readonly previous_attestation_id: string;
  readonly previous: AcquisitionProvenanceAttestationV1;
  readonly facts: Readonly<{
    interpretation_id: string;
    interpretation_profile: string;
    interpretation_version: string;
  }>;
}

export interface DatasetProvenanceAttestationV1
  extends CanonicalAttestationBaseV1 {
  readonly kind: "DATASET";
  readonly previous_attestation_id: string;
  readonly previous: InterpretationProvenanceAttestationV1;
  readonly facts: Readonly<{
    dataset_id: string;
    dataset_digest: Readonly<{
      subject: "INTERPRETED_DATASET";
      algorithm: string;
      profile: string;
      value: string;
    }>;
  }>;
}

export interface CanonicalFactProvenanceAttestationV1
  extends CanonicalAttestationBaseV1 {
  readonly kind: "CANONICAL_FACT";
  readonly previous_attestation_id: string;
  readonly previous: DatasetProvenanceAttestationV1;
  readonly facts: Readonly<{
    canonical_fact_id: string;
    canonical_schema_version: string;
    transformation_id: string;
    transformation_version: string;
    canonical_fact_digest: Readonly<{
      subject: "CANONICAL_FACT";
      algorithm: string;
      profile: string;
      value: string;
    }>;
  }>;
}

export interface CanonicalGovernedUploadProvenanceV1 {
  readonly version: typeof CANONICAL_PROVENANCE_VERSION;
  readonly chain_head: AcquisitionProvenanceAttestationV1;
  readonly verification_observation: Readonly<{
    outcome: "VERIFIED";
    correlation_id: string;
    audit_lineage: readonly string[];
    current_state: GovernedUploadVerificationResultV1["current_state"];
    historical_attestation_affected: false;
  }>;
}

export type CanonicalGovernedUploadProvenanceFailureCode =
  | "PROVENANCE_VERIFICATION_REQUIRED"
  | "PROVENANCE_INPUT_INVALID"
  | "PROVENANCE_LINEAGE_INVALID";

export type CanonicalGovernedUploadProvenanceAssemblyResult =
  | Readonly<{
      assembled: true;
      provenance: CanonicalGovernedUploadProvenanceV1;
    }>
  | Readonly<{
      assembled: false;
      failure: CanonicalGovernedUploadProvenanceFailureCode;
    }>;

const HEX_256 = /^[0-9a-f]{64}$/;
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function text(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 2048;
}

function canonicalTime(value: unknown): value is string {
  return text(value) && TIME.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function attestationId(
  kind: CanonicalProvenanceAttestationKind,
  previousAttestationId: string | null,
  facts: object,
): string {
  const canonical = JSON.stringify({
    version: CANONICAL_PROVENANCE_VERSION,
    attestation_profile: CANONICAL_PROVENANCE_ATTESTATION_PROFILE,
    digest_algorithm: CANONICAL_PROVENANCE_DIGEST_ALGORITHM,
    kind,
    previous_attestation_id: previousAttestationId,
    facts,
  });
  const digest = createHash("sha256").update(canonical, "utf8").digest("hex");
  return `provenance-attestation:${kind.toLowerCase()}:sha256:${digest}`;
}

function base(
  kind: CanonicalProvenanceAttestationKind,
  previousAttestationId: string | null,
  facts: object,
) {
  return {
    version: CANONICAL_PROVENANCE_VERSION,
    kind,
    attestation_id: attestationId(kind, previousAttestationId, facts),
    attestation_profile: CANONICAL_PROVENANCE_ATTESTATION_PROFILE,
    digest_algorithm: CANONICAL_PROVENANCE_DIGEST_ALGORITHM,
    previous_attestation_id: previousAttestationId,
  } as const;
}

function validInput(
  input: GovernedUploadVerificationResultV1,
): CanonicalGovernedUploadProvenanceFailureCode | null {
  if (!input || input.version !== 1 || input.outcome !== "VERIFIED") {
    return "PROVENANCE_VERIFICATION_REQUIRED";
  }
  const values = [
    input.admitted_object_id, input.acquisition_id, input.upload_id,
    input.principal_id, input.session_id, input.membership_id,
    input.company_id, input.tenant_id, input.ownership_reference,
    input.authorization_decision_id, input.consumption_reference,
    input.resource, input.purpose, input.permission, input.policy_version,
    input.acquisition_profile, input.interpretation_registry_version,
    input.quarantine_reference, input.inspection_id, input.malware_scan_id,
    input.detected_format, input.correlation_id,
  ];
  if (
    values.some(value => !text(value)) ||
    !HEX_256.test(input.byte_digest) ||
    !Number.isSafeInteger(input.byte_length) ||
    input.byte_length < 1 ||
    !canonicalTime(input.admitted_at) ||
    !Array.isArray(input.audit_lineage) ||
    !input.audit_lineage.every(text) ||
    !input.current_state ||
    typeof input.current_state.drifted !== "boolean" ||
    ["principal", "session", "membership", "company", "tenant"].some(field => {
      const value = input.current_state[field as keyof typeof input.current_state];
      return value !== null && !text(value);
    })
  ) return "PROVENANCE_INPUT_INVALID";
  if (
    input.permission !== "UPLOAD_DATA" ||
    input.authorization_decision_id === input.consumption_reference ||
    input.admitted_object_id === input.acquisition_id
  ) return "PROVENANCE_LINEAGE_INVALID";
  return null;
}

export function assembleCanonicalGovernedUploadProvenanceV1(
  input: GovernedUploadVerificationResultV1,
): CanonicalGovernedUploadProvenanceAssemblyResult {
  const failure = validInput(input);
  if (failure) return Object.freeze({ assembled: false, failure });

  const identityFacts = {
    principal_id: input.principal_id,
    session_id: input.session_id,
    membership_id: input.membership_id,
    company_id: input.company_id,
    tenant_id: input.tenant_id,
    ownership_reference: input.ownership_reference,
  };
  const identity = deepFreeze({
    ...base("OPERATIONAL_IDENTITY", null, identityFacts),
    kind: "OPERATIONAL_IDENTITY" as const,
    previous_attestation_id: null,
    facts: identityFacts,
  }) as OperationalIdentityProvenanceAttestationV1;

  const authorizationFacts = {
    authorization_decision_id: input.authorization_decision_id,
    consumption_reference: input.consumption_reference,
    permission: input.permission,
    resource: input.resource,
    purpose: input.purpose,
    policy_version: input.policy_version,
  };
  const authorization = deepFreeze({
    ...base("AUTHORIZATION", identity.attestation_id, authorizationFacts),
    kind: "AUTHORIZATION" as const,
    previous_attestation_id: identity.attestation_id,
    previous: identity,
    facts: authorizationFacts,
  }) as AuthorizationProvenanceAttestationV1;

  const acquisitionFacts = {
    admitted_object_id: input.admitted_object_id,
    acquisition_id: input.acquisition_id,
    upload_id: input.upload_id,
    acquisition_profile: input.acquisition_profile,
    interpretation_registry_version: input.interpretation_registry_version,
    quarantine_reference: input.quarantine_reference,
    inspection_id: input.inspection_id,
    malware_scan_id: input.malware_scan_id,
    detected_format: input.detected_format,
    admitted_at: input.admitted_at,
    byte_length: input.byte_length,
    source_byte_digest: {
      subject: "ACQUIRED_SOURCE_BYTES" as const,
      algorithm: "SHA-256" as const,
      value: input.byte_digest,
    },
  };
  const acquisition = deepFreeze({
    ...base("ACQUISITION", authorization.attestation_id, acquisitionFacts),
    kind: "ACQUISITION" as const,
    previous_attestation_id: authorization.attestation_id,
    previous: authorization,
    facts: acquisitionFacts,
  }) as AcquisitionProvenanceAttestationV1;

  return deepFreeze({
    assembled: true,
    provenance: {
      version: CANONICAL_PROVENANCE_VERSION,
      chain_head: acquisition,
      verification_observation: {
        outcome: "VERIFIED" as const,
        correlation_id: input.correlation_id,
        audit_lineage: [...input.audit_lineage],
        current_state: { ...input.current_state },
        historical_attestation_affected: false as const,
      },
    },
  }) as CanonicalGovernedUploadProvenanceAssemblyResult;
}
