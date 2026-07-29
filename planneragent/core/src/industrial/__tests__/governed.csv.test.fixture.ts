import { createHash } from "node:crypto";
import type {
  GovernedUploadVerificationResultV1,
} from "../../operational-identity/verification";
import type {
  CsvInterpretationConfiguration,
  VerifiedCsvContent,
} from "../interpretation/governed.csv.interpretation";
import {
  assembleCanonicalGovernedUploadProvenanceV1,
  createVerifiedGovernedInterpretationInputV1,
  type VerifiedGovernedInterpretationInputV1,
} from "../provenance";

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export function governedCsvInput(
  bytes: Uint8Array,
  configuration: CsvInterpretationConfiguration,
  readBytes: Uint8Array = bytes,
): VerifiedGovernedInterpretationInputV1<
  VerifiedCsvContent,
  CsvInterpretationConfiguration
> {
  const byteDigest = createHash("sha256").update(bytes).digest("hex");
  const verification = freeze({
    version: 1,
    outcome: "VERIFIED",
    admitted_object_id: "admitted-object-csv-001",
    acquisition_id: "acquisition-csv-001",
    upload_id: "upload-001",
    principal_id: "principal-001",
    session_id: "session-001",
    membership_id: "membership-001",
    company_id: "company-001",
    tenant_id: "tenant-001",
    ownership_reference: "ownership-001",
    authorization_decision_id: "authorization:001",
    consumption_reference: "governed-upload:upload-001:wu8:authorization:001",
    resource: "governed-upload:industrial-file",
    purpose: "operational-planning",
    permission: "UPLOAD_DATA",
    policy_version: "upload-policy-v1",
    byte_digest: byteDigest,
    byte_length: bytes.byteLength,
    acquisition_profile: "UNIVERSAL_SECURE_FILE_ACQUISITION_V1",
    interpretation_registry_version: "1",
    quarantine_reference: "quarantine:001",
    inspection_id: "inspection:001",
    malware_scan_id: "scan:001",
    detected_format: "CSV",
    admitted_at: "2026-07-27T10:00:00.000Z",
    correlation_id: "correlation-001",
    audit_lineage: ["audit-001"],
    current_state: {
      principal: "ACTIVE",
      session: "ACTIVE",
      membership: "ACTIVE",
      company: "ACTIVE",
      tenant: "ACTIVE",
      drifted: false,
    },
  }) as GovernedUploadVerificationResultV1;
  const admission = freeze({
    processed: true,
    disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION",
    reference: {
      acquisitionProfile: verification.acquisition_profile,
      interpretationRegistryVersion:
        verification.interpretation_registry_version,
      uploadId: verification.upload_id,
      tenantId: verification.tenant_id,
      companyId: verification.company_id,
      authorizationReference: verification.authorization_decision_id,
      quarantineReference: verification.quarantine_reference,
      inspectionId: verification.inspection_id,
      malwareScanId: verification.malware_scan_id,
      detectedFormat: "CSV",
      byteDigestAlgorithm: "SHA-256",
      byteDigest,
      byteLength: bytes.byteLength,
      admittedAt: verification.admitted_at,
    },
  });
  const assembled = assembleCanonicalGovernedUploadProvenanceV1(verification);
  if (!assembled.assembled) throw new Error(assembled.failure);
  const created = createVerifiedGovernedInterpretationInputV1({
    version: 1,
    admission: admission as any,
    verification,
    provenance: assembled.provenance,
    content_reader: {
      async readVerifiedContent() {
        return { bytes: readBytes };
      },
    },
    adapter_configuration: configuration,
  });
  if (!created.created) throw new Error(created.failure);
  return created.input;
}
