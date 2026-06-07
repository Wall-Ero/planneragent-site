// ============================================================
// PlannerAgent — Key Lifecycle Policy Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/__tests__/
// cryptography.key.lifecycle.policy.runner.ts
//
// STATUS
// ------------------------------------------------------------
// TEST RUNNER
//
// PURPOSE
// ------------------------------------------------------------
// Verify canonical key lifecycle policy.
//
// DOES NOT:
//
// - create keys
// - rotate keys
// - revoke keys
// - access KMS
// - perform cryptographic operations
//
// DOES:
//
// - verify lifecycle governance policy
// - verify lifecycle requirements
// - verify evidence requirements
// - verify ledger requirements
// - verify audit requirements
//
// ============================================================

import {
  KEY_LIFECYCLE_POLICIES,
} from "../cryptography.key.lifecycle.policy";


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
// AUDIT
// ============================================================

console.log("");
console.log("================================");
console.log("KEY LIFECYCLE GOVERNANCE AUDIT");
console.log("================================");
console.log("");


// ============================================================
// TEST 1
// CREATE KEY
// INITIAL CREATION ALLOWED
// ============================================================

assert(

  KEY_LIFECYCLE_POLICIES.CREATE_KEY
    .allowedTriggers.includes(
      "INITIAL_CREATION"
    ),

  "create key initial creation allowed"

);


// ============================================================
// TEST 2
// ROTATE KEY
// ACTIVE ALLOWED
// ============================================================

assert(

  KEY_LIFECYCLE_POLICIES.ROTATE_KEY
    .allowedStatuses.includes(
      "ACTIVE"
    ),

  "rotate key active lifecycle allowed"

);


// ============================================================
// TEST 3
// ROTATE KEY
// SCHEDULED ROTATION ALLOWED
// ============================================================

assert(

  KEY_LIFECYCLE_POLICIES.ROTATE_KEY
    .allowedTriggers.includes(
      "SCHEDULED_ROTATION"
    ),

  "rotate key scheduled rotation allowed"

);


// ============================================================
// TEST 4
// REVOKE KEY
// COMPROMISE RESPONSE ALLOWED
// ============================================================

assert(

  KEY_LIFECYCLE_POLICIES.REVOKE_KEY
    .allowedTriggers.includes(
      "COMPROMISE_RESPONSE"
    ),

  "revoke key compromise response allowed"

);


// ============================================================
// TEST 5
// DISABLE KEY
// COMPROMISE RESPONSE ALLOWED
// ============================================================

assert(

  KEY_LIFECYCLE_POLICIES.DISABLE_KEY
    .allowedTriggers.includes(
      "COMPROMISE_RESPONSE"
    ),

  "disable key compromise response allowed"

);


// ============================================================
// TEST 6
// ENABLE KEY
// DISABLED REQUIRED
// ============================================================

assert(

  KEY_LIFECYCLE_POLICIES.ENABLE_KEY
    .allowedStatuses.includes(
      "DISABLED"
    ),

  "enable key disabled lifecycle required"

);


// ============================================================
// TEST 7
// ASSIGN CUSTODY
// CUSTODY TRANSFER ALLOWED
// ============================================================

assert(

  KEY_LIFECYCLE_POLICIES.ASSIGN_CUSTODY
    .allowedTriggers.includes(
      "CUSTODY_TRANSFER"
    ),

  "assign custody transfer allowed"

);


// ============================================================
// TEST 8
// TRANSFER OWNERSHIP
// OWNERSHIP TRANSFER ALLOWED
// ============================================================

assert(

  KEY_LIFECYCLE_POLICIES.TRANSFER_OWNERSHIP
    .allowedTriggers.includes(
      "OWNERSHIP_TRANSFER"
    ),

  "transfer ownership allowed"

);


// ============================================================
// TEST 9
// TRANSFER OWNERSHIP
// RESIDUAL RISK OWNER
// ============================================================

assert(

  KEY_LIFECYCLE_POLICIES.TRANSFER_OWNERSHIP
    .residualRiskOwner ===
      "APPROVAL_AUTHORITY",

  "transfer ownership residual risk assigned"

);


// ============================================================
// TEST 10
// GOVERNANCE EVIDENCE
// ============================================================

Object.values(
  KEY_LIFECYCLE_POLICIES
).forEach(policy => {

  assert(

    policy.governanceEvidenceRequired,

    `${policy.operation.toLowerCase()} evidence required`

  );

});


// ============================================================
// TEST 11
// LEDGER
// ============================================================

Object.values(
  KEY_LIFECYCLE_POLICIES
).forEach(policy => {

  assert(

    policy.ledgerRecordRequired,

    `${policy.operation.toLowerCase()} ledger required`

  );

});


// ============================================================
// TEST 12
// CRYPTOGRAPHIC AUDIT
// ============================================================

Object.values(
  KEY_LIFECYCLE_POLICIES
).forEach(policy => {

  assert(

    policy.cryptographicAuditRequired,

    `${policy.operation.toLowerCase()} audit required`

  );

});


// ============================================================
// TEST 13
// HUMAN APPROVAL
// ============================================================

Object.values(
  KEY_LIFECYCLE_POLICIES
).forEach(policy => {

  assert(

    policy.humanApprovalRequired,

    `${policy.operation.toLowerCase()} human approval required`

  );

});


// ============================================================
// TEST 14
// INDEPENDENT APPROVAL
// ============================================================

Object.values(
  KEY_LIFECYCLE_POLICIES
).forEach(policy => {

  assert(

    policy.independentApprovalRequired,

    `${policy.operation.toLowerCase()} independent approval required`

  );

});


// ============================================================
// VERIFIED
// ============================================================

console.log("");
console.log("================================");
console.log("KEY LIFECYCLE POLICY VERIFIED");
console.log("================================");
console.log("");