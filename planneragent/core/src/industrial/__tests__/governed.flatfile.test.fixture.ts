import { createHash } from "node:crypto";
import type {
  GovernedUploadVerificationResultV1,
} from "../../operational-identity/verification";
import type {
  TxtDatInterpretationConfiguration,
  VerifiedGovernedTxtDatInterpretationInputV1,
} from "../interpretation/governed.flatfile.interpretation";
import {
  assembleCanonicalGovernedUploadProvenanceV1,
  createVerifiedGovernedInterpretationInputV1,
} from "../provenance";

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export function governedTxtDatInput(
  bytes: Uint8Array,
  configuration: TxtDatInterpretationConfiguration,
  readBytes: Uint8Array = bytes,
): VerifiedGovernedTxtDatInterpretationInputV1 {
  const byteDigest = createHash("sha256").update(bytes).digest("hex");
  const verification = freeze({
    version: 1,
    outcome: "VERIFIED",
    admitted_object_id: "admitted-object-txt-dat-001",
    acquisition_id: "acquisition-txt-dat-001",
    upload_id: "upload-010",
    principal_id: "principal-001",
    session_id: "session-001",
    membership_id: "membership-001",
    company_id: "company-001",
    tenant_id: "tenant-001",
    ownership_reference: "ownership-001",
    authorization_decision_id: "authorization:010",
    consumption_reference: "governed-upload:upload-010:wu8:authorization:010",
    resource: "governed-upload:industrial-file",
    purpose: "operational-planning",
    permission: "UPLOAD_DATA",
    policy_version: "upload-policy-v1",
    byte_digest: byteDigest,
    byte_length: bytes.byteLength,
    acquisition_profile: "UNIVERSAL_SECURE_FILE_ACQUISITION_V1",
    interpretation_registry_version: "1",
    quarantine_reference: "quarantine:010",
    inspection_id: "inspection:010",
    malware_scan_id: "scan:010",
    detected_format: "TXT_DAT",
    admitted_at: "2026-07-27T20:00:00.000Z",
    correlation_id: "correlation-010",
    audit_lineage: ["audit-010"],
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
      detectedFormat: "TXT_DAT",
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
