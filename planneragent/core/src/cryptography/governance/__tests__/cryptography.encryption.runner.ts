// ============================================================
// PlannerAgent — Encryption Governance Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/__tests__/
// cryptography.encryption.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL TEST RUNNER
//
// PURPOSE
// ------------------------------------------------------------
// Verify:
//
// Encryption Request
// ↓
// Payload Policy
// ↓
// Authority Validation
// ↓
// Approval Validation
// ↓
// Encryption Decision
//
// ============================================================

import {
evaluateEncryptionRequest,
} from "../cryptography.encryption.runtime";

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

console.log(
'✅ ${label}'
);

console.log("");
console.log("================================");
console.log("ENCRYPTION GOVERNANCE AUDIT");
console.log("================================");
console.log("");

// ============================================================
// TEST 1
// VALID REQUEST
// ↓
// ALLOWED
// ============================================================

const validDecision =
evaluateEncryptionRequest({

payloadClass:
  "TENANT_DATA",

authority:
  "SYSTEM",

approvalProvided:
  true,

});

assert(
validDecision.status ===
"ALLOWED",
"valid encryption request allowed"
);

assert(
validDecision.encryptionEligible,
"valid encryption eligible"
);

// ============================================================
// TEST 2
// AUTHORITY INVALID
// ↓
// DENIED
// ↓
// AUTHORITY_INVALID
// ============================================================

const invalidAuthorityDecision =
evaluateEncryptionRequest({

payloadClass:
  "OAG",

authority:
  "SYSTEM",

approvalProvided:
  true,

});

assert(
invalidAuthorityDecision.status ===
"DENIED",
"authority invalid request denied"
);

assert(
invalidAuthorityDecision.denialReason ===
"AUTHORITY_INVALID",
"authority invalid denial reason preserved"
);

// ============================================================
// TEST 3
// APPROVAL MISSING
// ↓
// APPROVAL_REQUIRED
// ============================================================

const approvalMissingDecision =
evaluateEncryptionRequest({

payloadClass:
  "CHARTER",

authority:
  "CHARTER",

approvalProvided:
  false,

});

assert(
approvalMissingDecision.status ===
"APPROVAL_REQUIRED",
"approval required request blocked"
);

assert(
!approvalMissingDecision
.approvalValidated,
"approval validation failed"
);

// ============================================================
// TEST 4
// PAYLOAD POLICY MISSING
// ↓
// DENIED
// ↓
// FAIL_CLOSED
// ============================================================

const failClosedDecision =
evaluateEncryptionRequest({

payloadClass:
  "UNKNOWN_PAYLOAD" as any,

authority:
  "SYSTEM",

approvalProvided:
  false,

});

assert(
failClosedDecision.status ===
"DENIED",
"missing policy denied"
);

assert(
failClosedDecision.denialReason ===
"FAIL_CLOSED",
"missing policy fails closed"
);

// ============================================================
// TEST 5
// GOVERNANCE EVIDENCE PROPAGATION
// ============================================================

assert(
validDecision
.governanceEvidenceRequired,
"governance evidence propagated"
);

// ============================================================
// TEST 6
// LEDGER REQUIREMENT PROPAGATION
// ============================================================

assert(
validDecision
.ledgerRecordRequired,
"governance ledger requirement propagated"
);

// ============================================================
// TEST 7
// CRYPTOGRAPHIC AUDIT REQUIREMENT
// PROPAGATION
// ============================================================

assert(
validDecision
.cryptographicAuditRequired,
"cryptographic audit requirement propagated"
);

console.log("");
console.log("================================");
console.log("ENCRYPTION RUNTIME VERIFIED");
console.log("================================");
console.log("");