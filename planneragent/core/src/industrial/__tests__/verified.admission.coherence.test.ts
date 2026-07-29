import { describe, expect, it } from "vitest";
import type { SecureFileAcquisitionResult } from "../acquisition/secure.file.acquisition";
import type {
  GovernedUploadVerificationResultV1,
} from "../../operational-identity/verification";
import {
  assembleCanonicalGovernedUploadProvenanceV1,
  verifyAdmissionCoherenceV1,
  type CanonicalGovernedUploadProvenanceV1,
} from "../provenance";

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function verification(
  overrides: Record<string, unknown> = {},
): GovernedUploadVerificationResultV1 {
  return freeze({
    version: 1,
    outcome: "VERIFIED",
    admitted_object_id: "admitted-object-002",
    acquisition_id: "acquisition-002",
    upload_id: "upload-002",
    principal_id: "principal-002",
    session_id: "session-002",
    membership_id: "membership-002",
    company_id: "company-002",
    tenant_id: "tenant-002",
    ownership_reference: "ownership-002",
    authorization_decision_id: "authorization-002",
    consumption_reference: "governed-upload:upload-002:wu8:authorization-002",
    resource: "governed-upload:industrial-file",
    purpose: "operational-planning",
    permission: "UPLOAD_DATA",
    policy_version: "upload-policy-v1",
    byte_digest: "d".repeat(64),
    byte_length: 128,
    acquisition_profile: "UNIVERSAL_SECURE_FILE_ACQUISITION_V1",
    interpretation_registry_version: "1",
    quarantine_reference: "quarantine-002",
    inspection_id: "inspection-002",
    malware_scan_id: "scan-002",
    detected_format: "CSV",
    admitted_at: "2026-07-29T11:01:00.000Z",
    correlation_id: "correlation-002",
    audit_lineage: ["authentication-audit-002", "authorization-audit-002"],
    current_state: {
      principal: "ACTIVE",
      session: "ACTIVE",
      membership: "ACTIVE",
      company: "ACTIVE",
      tenant: "ACTIVE",
      drifted: false,
    },
    ...overrides,
  }) as GovernedUploadVerificationResultV1;
}

function admission(
  overrides: Record<string, unknown> = {},
): Extract<SecureFileAcquisitionResult, {
  disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION";
}> {
  return freeze({
    processed: true,
    disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION",
    reference: {
      acquisitionProfile: "UNIVERSAL_SECURE_FILE_ACQUISITION_V1",
      interpretationRegistryVersion: "1",
      uploadId: "upload-002",
      tenantId: "tenant-002",
      companyId: "company-002",
      authorizationReference: "authorization-002",
      quarantineReference: "quarantine-002",
      inspectionId: "inspection-002",
      malwareScanId: "scan-002",
      detectedFormat: "CSV",
      byteDigestAlgorithm: "SHA-256",
      byteDigest: "d".repeat(64),
      byteLength: 128,
      admittedAt: "2026-07-29T11:01:00.000Z",
      ...overrides,
    },
  }) as Extract<SecureFileAcquisitionResult, {
    disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION";
  }>;
}

function provenance(
  value = verification(),
): CanonicalGovernedUploadProvenanceV1 {
  const result = assembleCanonicalGovernedUploadProvenanceV1(value);
  if (!result.assembled) throw new Error(result.failure);
  return result.provenance;
}

function input(
  admissionValue = admission(),
  verificationValue = verification(),
  provenanceValue = provenance(verificationValue),
) {
  return {
    version: 1 as const,
    admission: admissionValue,
    verification: verificationValue,
    provenance: provenanceValue,
  };
}

function altered(
  mutate: (value: any) => void,
): CanonicalGovernedUploadProvenanceV1 {
  const value = structuredClone(provenance());
  mutate(value);
  return freeze(value);
}

describe("WU10B-2 verified admission coherence boundary", () => {
  it("verifies one coherent frozen WU8/WU6A/provenance triple", () => {
    const result = verifyAdmissionCoherenceV1(input());
    expect(result).toMatchObject({
      coherent: true,
      version: 1,
      admitted_object_id: "admitted-object-002",
      acquisition_id: "acquisition-002",
      upload_id: "upload-002",
      authorization_decision_id: "authorization-002",
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("is deterministic and does not mutate any input", () => {
    const value = input();
    const before = JSON.stringify(value);
    expect(verifyAdmissionCoherenceV1(value))
      .toEqual(verifyAdmissionCoherenceV1(value));
    expect(JSON.stringify(value)).toBe(before);
  });

  it.each([
    ["upload", "uploadId", "other-upload", "COHERENCE_UPLOAD_SUBSTITUTED"],
    ["tenant", "tenantId", "other-tenant", "COHERENCE_TENANT_SUBSTITUTED"],
    ["company", "companyId", "other-company", "COHERENCE_COMPANY_SUBSTITUTED"],
    ["authorization", "authorizationReference", "other-authorization",
      "COHERENCE_AUTHORIZATION_SUBSTITUTED"],
    ["profile", "acquisitionProfile", "OTHER_PROFILE",
      "COHERENCE_ACQUISITION_EVIDENCE_SUBSTITUTED"],
    ["registry", "interpretationRegistryVersion", "2",
      "COHERENCE_ACQUISITION_EVIDENCE_SUBSTITUTED"],
    ["quarantine", "quarantineReference", "other-quarantine",
      "COHERENCE_ACQUISITION_EVIDENCE_SUBSTITUTED"],
    ["inspection", "inspectionId", "other-inspection",
      "COHERENCE_ACQUISITION_EVIDENCE_SUBSTITUTED"],
    ["scan", "malwareScanId", "other-scan",
      "COHERENCE_ACQUISITION_EVIDENCE_SUBSTITUTED"],
    ["format", "detectedFormat", "TXT_DAT",
      "COHERENCE_ACQUISITION_EVIDENCE_SUBSTITUTED"],
    ["digest algorithm", "byteDigestAlgorithm", "SHA-512",
      "COHERENCE_DIGEST_SUBSTITUTED"],
    ["digest", "byteDigest", "e".repeat(64), "COHERENCE_DIGEST_SUBSTITUTED"],
    ["byte length", "byteLength", 129, "COHERENCE_DIGEST_SUBSTITUTED"],
    ["admission time", "admittedAt", "2026-07-29T11:02:00.000Z",
      "COHERENCE_ADMISSION_TIME_SUBSTITUTED"],
  ])("rejects WU8 %s substitution", (_label, field, value, failure) => {
    expect(verifyAdmissionCoherenceV1(input(admission({ [field]: value }))))
      .toEqual({ coherent: false, failure });
  });

  it("rejects non-admitted WU8 results", () => {
    const denied = freeze({ processed: false, denial: "MALWARE_DETECTED" });
    expect(verifyAdmissionCoherenceV1({
      ...input(), admission: denied,
    } as any)).toEqual({
      coherent: false,
      failure: "COHERENCE_ADMISSION_NOT_ADMITTED",
    });
  });

  it.each([
    ["identity facts", (value: any) =>
      value.chain_head.previous.previous.facts.principal_id = "other",
      "COHERENCE_IDENTITY_ATTESTATION_SUBSTITUTED"],
    ["authorization facts", (value: any) =>
      value.chain_head.previous.facts.purpose = "other",
      "COHERENCE_AUTHORIZATION_ATTESTATION_SUBSTITUTED"],
    ["acquisition facts", (value: any) =>
      value.chain_head.facts.acquisition_id = "other",
      "COHERENCE_ACQUISITION_ATTESTATION_SUBSTITUTED"],
    ["identity link", (value: any) =>
      value.chain_head.previous.previous.previous_attestation_id = "other",
      "COHERENCE_ATTESTATION_CHAIN_INVALID"],
    ["authorization link", (value: any) =>
      value.chain_head.previous.previous_attestation_id = "other",
      "COHERENCE_ATTESTATION_CHAIN_INVALID"],
    ["acquisition link", (value: any) =>
      value.chain_head.previous_attestation_id = "other",
      "COHERENCE_ATTESTATION_CHAIN_INVALID"],
    ["verification observation", (value: any) =>
      value.verification_observation.correlation_id = "other",
      "COHERENCE_VERIFICATION_OBSERVATION_SUBSTITUTED"],
    ["identity attestation id", (value: any) =>
      value.chain_head.previous.previous.attestation_id = "other",
      "COHERENCE_ATTESTATION_CHAIN_INVALID"],
    ["authorization attestation id", (value: any) => {
      value.chain_head.previous.attestation_id = "other";
      value.chain_head.previous_attestation_id = "other";
    }, "COHERENCE_PROVENANCE_NONCANONICAL"],
    ["acquisition attestation id", (value: any) =>
      value.chain_head.attestation_id = "other",
      "COHERENCE_PROVENANCE_NONCANONICAL"],
  ])("rejects substituted %s", (_label, mutate, failure) => {
    expect(verifyAdmissionCoherenceV1(input(
      admission(), verification(), altered(mutate),
    ))).toEqual({ coherent: false, failure });
  });

  it("rejects mutable admission, verification, and provenance independently", () => {
    const mutableAdmission = structuredClone(admission());
    const mutableVerification = structuredClone(verification());
    const mutableProvenance = structuredClone(provenance());
    for (const value of [
      input(mutableAdmission as any, verification(), provenance()),
      input(admission(), mutableVerification as any, provenance()),
      input(admission(), verification(), mutableProvenance),
    ]) expect(verifyAdmissionCoherenceV1(value)).toEqual({
      coherent: false,
      failure: "COHERENCE_INPUT_MUTABLE",
    });
  });

  it("accepts historical coherence when current-state drift is attested consistently", () => {
    const drifted = verification({
      current_state: {
        principal: "ACTIVE",
        session: "REVOKED",
        membership: "SUSPENDED",
        company: "ACTIVE",
        tenant: "ACTIVE",
        drifted: true,
      },
    });
    expect(verifyAdmissionCoherenceV1(input(
      admission(), drifted, provenance(drifted),
    ))).toMatchObject({ coherent: true });
  });

  it("rejects invalid input and unverified WU6A-shaped results", () => {
    expect(verifyAdmissionCoherenceV1(null as any)).toEqual({
      coherent: false, failure: "COHERENCE_INPUT_INVALID",
    });
    const unverified = freeze({ ...structuredClone(verification()), outcome: "DENIED" });
    expect(verifyAdmissionCoherenceV1({
      ...input(), verification: unverified,
    } as any)).toEqual({
      coherent: false, failure: "COHERENCE_VERIFICATION_INVALID",
    });
  });
});
