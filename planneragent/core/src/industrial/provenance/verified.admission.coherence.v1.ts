import type { SecureFileAcquisitionResult } from "../acquisition/secure.file.acquisition";
import type {
  GovernedUploadVerificationResultV1,
} from "../../operational-identity/verification";
import {
  assembleCanonicalGovernedUploadProvenanceV1,
  CANONICAL_PROVENANCE_ATTESTATION_PROFILE,
  CANONICAL_PROVENANCE_DIGEST_ALGORITHM,
  CANONICAL_PROVENANCE_VERSION,
  type CanonicalGovernedUploadProvenanceV1,
} from "./canonical.governed-upload.provenance.v1";

type AdmittedUpload = Extract<SecureFileAcquisitionResult, {
  processed: true;
  disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION";
}>;

export interface VerifiedAdmissionCoherenceInputV1 {
  readonly version: 1;
  readonly admission: AdmittedUpload;
  readonly verification: GovernedUploadVerificationResultV1;
  readonly provenance: CanonicalGovernedUploadProvenanceV1;
}

export type VerifiedAdmissionCoherenceFailureCode =
  | "COHERENCE_INPUT_INVALID"
  | "COHERENCE_INPUT_MUTABLE"
  | "COHERENCE_ADMISSION_NOT_ADMITTED"
  | "COHERENCE_VERIFICATION_INVALID"
  | "COHERENCE_UPLOAD_SUBSTITUTED"
  | "COHERENCE_TENANT_SUBSTITUTED"
  | "COHERENCE_COMPANY_SUBSTITUTED"
  | "COHERENCE_AUTHORIZATION_SUBSTITUTED"
  | "COHERENCE_ACQUISITION_EVIDENCE_SUBSTITUTED"
  | "COHERENCE_DIGEST_SUBSTITUTED"
  | "COHERENCE_ADMISSION_TIME_SUBSTITUTED"
  | "COHERENCE_IDENTITY_ATTESTATION_SUBSTITUTED"
  | "COHERENCE_AUTHORIZATION_ATTESTATION_SUBSTITUTED"
  | "COHERENCE_ACQUISITION_ATTESTATION_SUBSTITUTED"
  | "COHERENCE_ATTESTATION_CHAIN_INVALID"
  | "COHERENCE_VERIFICATION_OBSERVATION_SUBSTITUTED"
  | "COHERENCE_PROVENANCE_NONCANONICAL";

export type VerifiedAdmissionCoherenceResultV1 =
  | Readonly<{
      coherent: true;
      version: 1;
      admitted_object_id: string;
      acquisition_id: string;
      upload_id: string;
      authorization_decision_id: string;
      chain_head_attestation_id: string;
    }>
  | Readonly<{
      coherent: false;
      failure: VerifiedAdmissionCoherenceFailureCode;
    }>;

function denied(
  failure: VerifiedAdmissionCoherenceFailureCode,
): VerifiedAdmissionCoherenceResultV1 {
  return Object.freeze({ coherent: false, failure });
}

function deeplyFrozen(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  if (!Object.isFrozen(value)) return false;
  return Object.values(value as Record<string, unknown>).every(deeplyFrozen);
}

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validAttestationBase(
  value: Record<string, unknown>,
  kind: string,
): boolean {
  return value.version === CANONICAL_PROVENANCE_VERSION &&
    value.kind === kind &&
    value.attestation_profile === CANONICAL_PROVENANCE_ATTESTATION_PROFILE &&
    value.digest_algorithm === CANONICAL_PROVENANCE_DIGEST_ALGORITHM &&
    typeof value.attestation_id === "string" &&
    value.attestation_id.length > 0;
}

export function verifyAdmissionCoherenceV1(
  input: VerifiedAdmissionCoherenceInputV1,
): VerifiedAdmissionCoherenceResultV1 {
  if (!input || input.version !== 1 ||
    !input.admission || !input.verification || !input.provenance) {
    return denied("COHERENCE_INPUT_INVALID");
  }
  if (!deeplyFrozen(input.admission) ||
    !deeplyFrozen(input.verification) ||
    !deeplyFrozen(input.provenance)) {
    return denied("COHERENCE_INPUT_MUTABLE");
  }
  if (input.admission.processed !== true ||
    input.admission.disposition !== "ADMITTED_FOR_GOVERNED_INTERPRETATION") {
    return denied("COHERENCE_ADMISSION_NOT_ADMITTED");
  }
  if (input.verification.version !== 1 ||
    input.verification.outcome !== "VERIFIED") {
    return denied("COHERENCE_VERIFICATION_INVALID");
  }

  const admission = input.admission.reference;
  const verification = input.verification;
  if (admission.uploadId !== verification.upload_id) {
    return denied("COHERENCE_UPLOAD_SUBSTITUTED");
  }
  if (admission.tenantId !== verification.tenant_id) {
    return denied("COHERENCE_TENANT_SUBSTITUTED");
  }
  if (admission.companyId !== verification.company_id) {
    return denied("COHERENCE_COMPANY_SUBSTITUTED");
  }
  if (admission.authorizationReference !==
    verification.authorization_decision_id) {
    return denied("COHERENCE_AUTHORIZATION_SUBSTITUTED");
  }
  if (
    admission.acquisitionProfile !== verification.acquisition_profile ||
    admission.interpretationRegistryVersion !==
      verification.interpretation_registry_version ||
    admission.quarantineReference !== verification.quarantine_reference ||
    admission.inspectionId !== verification.inspection_id ||
    admission.malwareScanId !== verification.malware_scan_id ||
    admission.detectedFormat !== verification.detected_format
  ) return denied("COHERENCE_ACQUISITION_EVIDENCE_SUBSTITUTED");
  if (
    admission.byteDigestAlgorithm !== "SHA-256" ||
    admission.byteDigest !== verification.byte_digest ||
    admission.byteLength !== verification.byte_length
  ) return denied("COHERENCE_DIGEST_SUBSTITUTED");
  if (admission.admittedAt !== verification.admitted_at) {
    return denied("COHERENCE_ADMISSION_TIME_SUBSTITUTED");
  }

  const expected = assembleCanonicalGovernedUploadProvenanceV1(verification);
  if (!expected.assembled) return denied("COHERENCE_VERIFICATION_INVALID");
  const actual = input.provenance;
  const expectedProvenance = expected.provenance;
  const actualAcquisition = actual.chain_head;
  const actualAuthorization = actualAcquisition?.previous;
  const actualIdentity = actualAuthorization?.previous;
  if (!actualIdentity || !validAttestationBase(
    actualIdentity as unknown as Record<string, unknown>,
    "OPERATIONAL_IDENTITY",
  ) || !same(actualIdentity.facts,
    expectedProvenance.chain_head.previous.previous.facts)) {
    return denied("COHERENCE_IDENTITY_ATTESTATION_SUBSTITUTED");
  }
  if (!actualAuthorization || !validAttestationBase(
    actualAuthorization as unknown as Record<string, unknown>,
    "AUTHORIZATION",
  ) || !same(actualAuthorization.facts,
    expectedProvenance.chain_head.previous.facts)) {
    return denied("COHERENCE_AUTHORIZATION_ATTESTATION_SUBSTITUTED");
  }
  if (!actualAcquisition || !validAttestationBase(
    actualAcquisition as unknown as Record<string, unknown>,
    "ACQUISITION",
  ) || !same(actualAcquisition.facts, expectedProvenance.chain_head.facts)) {
    return denied("COHERENCE_ACQUISITION_ATTESTATION_SUBSTITUTED");
  }
  if (
    actualIdentity.previous_attestation_id !== null ||
    actualAuthorization.previous_attestation_id !== actualIdentity.attestation_id ||
    actualAcquisition.previous_attestation_id !== actualAuthorization.attestation_id ||
    actualAuthorization.previous !== actualIdentity ||
    actualAcquisition.previous !== actualAuthorization
  ) return denied("COHERENCE_ATTESTATION_CHAIN_INVALID");
  if (!same(actual.verification_observation,
    expectedProvenance.verification_observation)) {
    return denied("COHERENCE_VERIFICATION_OBSERVATION_SUBSTITUTED");
  }
  if (!same(actual, expectedProvenance)) {
    return denied("COHERENCE_PROVENANCE_NONCANONICAL");
  }
  return Object.freeze({
    coherent: true,
    version: 1,
    admitted_object_id: verification.admitted_object_id,
    acquisition_id: verification.acquisition_id,
    upload_id: verification.upload_id,
    authorization_decision_id: verification.authorization_decision_id,
    chain_head_attestation_id: actualAcquisition.attestation_id,
  });
}
