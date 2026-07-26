import { createHash } from "node:crypto";
import type {
  P9XSignatureAuthenticityCertificationResult,
} from "./P9X.signature.authenticity.certification";

export interface P9XAuthenticityEvidenceAuditRecord {
  readonly evidenceId: string;
  readonly auditRecordId: string;
  readonly certificateId: string;
  readonly certificateDigest: string;
  readonly certificateDigestAlgorithm: "SHA-256";
  readonly certificateJson: string;
  readonly cryptographicOperationId: string;
  readonly cryptographicContextId: string;
  readonly providerKeyReference: string;
  readonly persistedAt: string;
  readonly auditEvent: "P9X_AUTHENTICITY_CERTIFICATE_PERSISTED";
  readonly auditRecordDigest: string;
  readonly auditRecordDigestAlgorithm: "SHA-256";
}

export interface P9XAuthenticityEvidenceAuditStore {
  appendIfAbsent(
    record: P9XAuthenticityEvidenceAuditRecord,
  ): Promise<boolean>;
}

export type P9XAuthenticityEvidenceAuditPersistenceResult =
  | Readonly<{
      persisted: true;
      record: Readonly<P9XAuthenticityEvidenceAuditRecord>;
    }>
  | Readonly<{
      persisted: false;
      denialReason:
        | "P9X_CERTIFICATE_REQUIRED"
        | "P9X_EVIDENCE_IDENTITY_INVALID"
        | "P9X_EVIDENCE_TIME_INVALID"
        | "P9X_EVIDENCE_ALREADY_EXISTS"
        | "P9X_EVIDENCE_PERSISTENCE_FAILED";
    }>;

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const deny = (
  denialReason: Extract<P9XAuthenticityEvidenceAuditPersistenceResult, {
    persisted: false;
  }>["denialReason"],
): P9XAuthenticityEvidenceAuditPersistenceResult =>
  Object.freeze({ persisted: false, denialReason });

export async function persistP9XAuthenticityEvidenceAndAudit(
  certification: P9XSignatureAuthenticityCertificationResult,
  evidenceId: string,
  auditRecordId: string,
  persistedAt: string,
  store: P9XAuthenticityEvidenceAuditStore,
): Promise<P9XAuthenticityEvidenceAuditPersistenceResult> {
  if (!certification.certified) return deny("P9X_CERTIFICATE_REQUIRED");
  if (!UUID_V4.test(evidenceId) || !UUID_V4.test(auditRecordId)) {
    return deny("P9X_EVIDENCE_IDENTITY_INVALID");
  }
  if (
    !TIME.test(persistedAt) ||
    !Number.isFinite(Date.parse(persistedAt)) ||
    new Date(persistedAt).toISOString() !== persistedAt ||
    Date.parse(persistedAt) < Date.parse(
      certification.certificate.certifiedAt,
    )
  ) return deny("P9X_EVIDENCE_TIME_INVALID");

  const certificateJson = JSON.stringify(certification.certificate);
  const auditMaterial = [
    auditRecordId,
    evidenceId,
    certification.certificate.certificateId,
    certification.certificateDigest,
    certification.certificate.cryptographicOperationId,
    certification.certificate.cryptographicContextId,
    certification.certificate.providerKeyReference,
    persistedAt,
  ].join("\u001f");
  const record: P9XAuthenticityEvidenceAuditRecord = Object.freeze({
    evidenceId,
    auditRecordId,
    certificateId: certification.certificate.certificateId,
    certificateDigest: certification.certificateDigest,
    certificateDigestAlgorithm: "SHA-256",
    certificateJson,
    cryptographicOperationId:
      certification.certificate.cryptographicOperationId,
    cryptographicContextId:
      certification.certificate.cryptographicContextId,
    providerKeyReference: certification.certificate.providerKeyReference,
    persistedAt,
    auditEvent: "P9X_AUTHENTICITY_CERTIFICATE_PERSISTED",
    auditRecordDigest:
      createHash("sha256").update(auditMaterial, "utf8").digest("hex"),
    auditRecordDigestAlgorithm: "SHA-256",
  });
  try {
    if (!(await store.appendIfAbsent(record))) {
      return deny("P9X_EVIDENCE_ALREADY_EXISTS");
    }
  } catch {
    return deny("P9X_EVIDENCE_PERSISTENCE_FAILED");
  }
  return Object.freeze({ persisted: true, record });
}

export interface P9XEvidenceAuditD1Database {
  prepare(sql: string): {
    bind(...values: unknown[]): unknown;
  };
  batch(
    statements: readonly unknown[],
  ): Promise<readonly { meta?: { changes?: number } }[]>;
}

export class P9XEvidenceAuditD1Store
implements P9XAuthenticityEvidenceAuditStore {
  constructor(private readonly db: P9XEvidenceAuditD1Database) {}

  async appendIfAbsent(
    record: P9XAuthenticityEvidenceAuditRecord,
  ): Promise<boolean> {
    const evidence = this.db.prepare(`
      INSERT INTO p9x_authenticity_evidence (
        evidence_id, certificate_id, certificate_digest,
        certificate_digest_algorithm, certificate_json,
        cryptographic_operation_id, cryptographic_context_id,
        provider_key_reference, persisted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(certificate_id) DO NOTHING
    `).bind(
      record.evidenceId,
      record.certificateId,
      record.certificateDigest,
      record.certificateDigestAlgorithm,
      record.certificateJson,
      record.cryptographicOperationId,
      record.cryptographicContextId,
      record.providerKeyReference,
      record.persistedAt,
    );
    const audit = this.db.prepare(`
      INSERT INTO p9x_authenticity_audit_records (
        audit_record_id, evidence_id, certificate_id, audit_event,
        audit_record_digest, audit_record_digest_algorithm, persisted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(certificate_id) DO NOTHING
    `).bind(
      record.auditRecordId,
      record.evidenceId,
      record.certificateId,
      record.auditEvent,
      record.auditRecordDigest,
      record.auditRecordDigestAlgorithm,
      record.persistedAt,
    );
    const results = await this.db.batch([evidence, audit]);
    return results.length === 2 &&
      results.every(result => result.meta?.changes === 1);
  }
}
