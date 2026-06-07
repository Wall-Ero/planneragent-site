// ============================================================
// PlannerAgent — Payload Encryption Policy Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/__tests__/
// cryptography.payload.policy.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL TEST RUNNER
//
// PURPOSE
// ------------------------------------------------------------
// Verify canonical payload encryption policy.
//
// DOES NOT:
//
// - encrypt payloads
// - decrypt payloads
// - access KMS
// - access secrets
//
// DOES:
//
// - verify policy definitions
// - verify protected payload classes
// - verify governance requirements
// - verify ledger requirements
// - verify audit requirements
//
// ============================================================

import {
  getPayloadEncryptionPolicy,
  PAYLOAD_ENCRYPTION_POLICIES,
} from "../cryptography.payload.policy";


// ============================================================
// ASSERT
// ============================================================

function assert(
  condition: boolean,
  label: string
): void {

  if (!condition) {

    throw new Error(
      `FAILED: ${label}`
    );

  }

  console.log(
    `✅ ${label}`
  );

}


// ============================================================
// START
// ============================================================

console.log("");
console.log("================================");
console.log("CRYPTOGRAPHY PAYLOAD POLICY REVIEW");
console.log("================================");
console.log("");


// ============================================================
// TEST 1
// ALL PAYLOAD CLASSES DEFINED
// ============================================================

assert(
  Object.keys(
    PAYLOAD_ENCRYPTION_POLICIES
  ).length === 10,
  "all protected payload classes defined"
);


// ============================================================
// TEST 2
// TENANT DATA
// ============================================================

const tenantData =
  getPayloadEncryptionPolicy(
    "TENANT_DATA"
  );

assert(
  tenantData.encryptionMandatory,
  "tenant data encryption mandatory"
);

assert(
  tenantData.cryptographicAuditRequired,
  "tenant data audit required"
);


// ============================================================
// TEST 3
// GOVERNANCE EVIDENCE
// ============================================================

const governanceEvidence =
  getPayloadEncryptionPolicy(
    "GOVERNANCE_EVIDENCE"
  );

assert(
  governanceEvidence
    .governanceEvidenceRequired,
  "governance evidence preserved"
);

assert(
  governanceEvidence
    .ledgerRecordRequired,
  "governance evidence ledger preserved"
);


// ============================================================
// TEST 4
// AUDIT LEDGER
// ============================================================

const auditLedger =
  getPayloadEncryptionPolicy(
    "AUDIT_LEDGER"
  );

assert(
  auditLedger.encryptionMandatory,
  "audit ledger protected"
);


// ============================================================
// TEST 5
// OAG
// ============================================================

const oag =
  getPayloadEncryptionPolicy(
    "OAG"
  );

assert(
  oag.encryptionMandatory,
  "oag encryption mandatory"
);

assert(
  oag.authorityRequired ===
    "CHARTER",
  "oag protected by charter authority"
);

assert(
  oag.humanApprovalRequired,
  "oag requires human approval"
);


// ============================================================
// TEST 6
// CHARTER
// ============================================================

const charter =
  getPayloadEncryptionPolicy(
    "CHARTER"
  );

assert(
  charter.encryptionMandatory,
  "charter encryption mandatory"
);

assert(
  charter.authorityRequired ===
    "CHARTER",
  "charter protected by charter authority"
);

assert(
  charter.humanApprovalRequired,
  "charter requires human approval"
);


// ============================================================
// TEST 7
// SECRET
// ============================================================

const secret =
  getPayloadEncryptionPolicy(
    "SECRET"
  );

assert(
  secret.encryptionMandatory,
  "secret encryption mandatory"
);

assert(
  secret.authorityRequired ===
    "PRINCIPAL",
  "secret authority defined"
);


// ============================================================
// TEST 8
// API CREDENTIAL
// ============================================================

const credential =
  getPayloadEncryptionPolicy(
    "API_CREDENTIAL"
  );

assert(
  credential.encryptionMandatory,
  "api credential encryption mandatory"
);

assert(
  credential.cryptographicAuditRequired,
  "api credential audit required"
);


// ============================================================
// TEST 9
// RECOVERY ARTIFACT
// ============================================================

const recoveryArtifact =
  getPayloadEncryptionPolicy(
    "RECOVERY_ARTIFACT"
  );

assert(
  recoveryArtifact
    .governanceEvidenceRequired,
  "recovery artifact evidence required"
);

assert(
  recoveryArtifact
    .ledgerRecordRequired,
  "recovery artifact ledger required"
);


// ============================================================
// TEST 10
// ALL POLICIES REQUIRE AUDIT
// ============================================================

for (
  const policy of Object.values(
    PAYLOAD_ENCRYPTION_POLICIES
  )
) {

  assert(
    policy.cryptographicAuditRequired,
    `${policy.payloadClass.toLowerCase()} audit required`
  );

}


// ============================================================
// TEST 11
// ALL POLICIES REQUIRE LEDGER
// ============================================================

for (
  const policy of Object.values(
    PAYLOAD_ENCRYPTION_POLICIES
  )
) {

  assert(
    policy.ledgerRecordRequired,
    `${policy.payloadClass.toLowerCase()} ledger required`
  );

}


// ============================================================
// TEST 12
// ALL POLICIES REQUIRE EVIDENCE
// ============================================================

for (
  const policy of Object.values(
    PAYLOAD_ENCRYPTION_POLICIES
  )
) {

  assert(
    policy.governanceEvidenceRequired,
    `${policy.payloadClass.toLowerCase()} evidence required`
  );

}


// ============================================================
// END
// ============================================================

console.log("");
console.log("================================");
console.log("PAYLOAD ENCRYPTION POLICY VERIFIED");
console.log("================================");
console.log("");