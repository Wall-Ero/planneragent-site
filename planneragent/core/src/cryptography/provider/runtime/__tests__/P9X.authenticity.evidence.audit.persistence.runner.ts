import { certifyP9XSignatureAuthenticity } from "../P9X.signature.authenticity.certification";
import {
  persistP9XAuthenticityEvidenceAndAudit,
  type P9XAuthenticityEvidenceAuditRecord,
  type P9XAuthenticityEvidenceAuditStore,
} from "../P9X.authenticity.evidence.audit.persistence";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
class Store implements P9XAuthenticityEvidenceAuditStore {
  records: P9XAuthenticityEvidenceAuditRecord[] = [];
  async appendIfAbsent(record: P9XAuthenticityEvidenceAuditRecord) {
    if (this.records.some(value =>
      value.certificateId === record.certificateId
    )) return false;
    this.records.push(record);
    return true;
  }
}
const certificate = certifyP9XSignatureAuthenticity({
  integrated: true, attestationId: "attestation-1",
  cryptographicOperationId: "operation-1",
  cryptographicContextId: "context-1",
  providerKeyReference: "arn:kms:key",
  targetBindingDigest: "a".repeat(64),
  signatureArtifactDigest: "b".repeat(64),
  verificationMaterialDigest: "c".repeat(64),
  mathematicallyVerified: true,
  verifiedAt: "2026-07-26T10:00:02.000Z",
}, "d0000000-0000-4000-8000-000000000001",
"2026-07-26T10:00:03.000Z");

async function run() {
  const store = new Store();
  const persisted = await persistP9XAuthenticityEvidenceAndAudit(
    certificate,
    "f0000000-0000-4000-8000-000000000001",
    "f0000000-0000-4000-8000-000000000002",
    "2026-07-26T10:00:04.000Z",
    store,
  );
  assert(persisted.persisted, "P9X certificate persists as immutable evidence");
  assert(persisted.persisted &&
    persisted.record.auditEvent === "P9X_AUTHENTICITY_CERTIFICATE_PERSISTED" &&
    /^[0-9a-f]{64}$/.test(persisted.record.auditRecordDigest),
    "P9X persistence creates deterministic audit record");
  assert(persisted.persisted && Object.isFrozen(persisted.record),
    "P9X evidence/audit record is immutable");
  const replay = await persistP9XAuthenticityEvidenceAndAudit(
    certificate,
    "f0000000-0000-4000-8000-000000000003",
    "f0000000-0000-4000-8000-000000000004",
    "2026-07-26T10:00:04.000Z",
    store,
  );
  assert(!replay.persisted &&
    replay.denialReason === "P9X_EVIDENCE_ALREADY_EXISTS",
    "duplicate certificate persistence fails closed");
  console.log("P9X authenticity evidence/audit persistence runner completed.");
}
run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
