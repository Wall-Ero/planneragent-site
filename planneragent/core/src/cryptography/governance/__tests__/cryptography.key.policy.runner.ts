// ============================================================
// PlannerAgent — Key Authority Policy Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/__tests__/
// cryptography.key.policy.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL TEST RUNNER
//
// PURPOSE
// ------------------------------------------------------------
// Verify canonical key authority model.
//
// ============================================================

import {

  KEY_AUTHORITY_POLICIES,

  KEY_AUTHORITY_SEPARATION_RULES,

  getKeyAuthorityPolicy,

} from "../cryptography.key.policy";

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

console.log("");
console.log("================================");
console.log("KEY AUTHORITY GOVERNANCE AUDIT");
console.log("================================");
console.log("");


// ============================================================
// TEST 1
// ALL OPERATIONS GOVERNED
// ============================================================

assert(

  Object.keys(
    KEY_AUTHORITY_POLICIES
  ).length === 7,

  "all key operations governed"

);


// ============================================================
// TEST 2
// CREATE KEY POLICY
// ============================================================

const createKeyPolicy =
  getKeyAuthorityPolicy(
    "CREATE_KEY"
  );

assert(

  createKeyPolicy.requiredRoles.includes(
    "KEY_CREATOR"
  ),

  "create key requires creator"

);

assert(

  createKeyPolicy.requiredRoles.includes(
    "KEY_OWNER"
  ),

  "create key requires owner"

);

assert(

  createKeyPolicy.requiredRoles.includes(
    "AUTHORITY_OWNER"
  ),

  "create key requires authority owner"

);


// ============================================================
// TEST 3
// INDEPENDENT APPROVAL REQUIRED
// ============================================================

assert(

  createKeyPolicy
    .independentApprovalRequired,

  "independent approval required"

);


// ============================================================
// TEST 4
// SEPARATION RULES DEFINED
// ============================================================

assert(

  KEY_AUTHORITY_SEPARATION_RULES.includes(
    "KEY_CREATOR_NOT_KEY_OWNER"
  ),

  "creator separated from owner"

);

assert(

  KEY_AUTHORITY_SEPARATION_RULES.includes(
    "KEY_OWNER_NOT_KEY_CUSTODIAN"
  ),

  "owner separated from custodian"

);

assert(

  KEY_AUTHORITY_SEPARATION_RULES.includes(
    "KEY_CUSTODIAN_NOT_APPROVAL_AUTHORITY"
  ),

  "custodian separated from approval authority"

);

assert(

  KEY_AUTHORITY_SEPARATION_RULES.includes(
    "APPROVAL_AUTHORITY_INDEPENDENT_FROM_KEY_CUSTODY"
  ),

  "approval authority independent from custody"

);

assert(

  KEY_AUTHORITY_SEPARATION_RULES.includes(
    "NO_SINGLE_CRYPTOGRAPHIC_ACTOR_OWNS_FULL_AUTHORITY_CHAIN"
  ),

  "full authority chain prohibited"

);


// ============================================================
// TEST 5
// EVIDENCE REQUIRED
// ============================================================

for (
  const policy
  of Object.values(
    KEY_AUTHORITY_POLICIES
  )
) {

  assert(

    policy
      .governanceEvidenceRequired,

    `${policy.operation.toLowerCase()} evidence required`

  );

}


// ============================================================
// TEST 6
// LEDGER REQUIRED
// ============================================================

for (
  const policy
  of Object.values(
    KEY_AUTHORITY_POLICIES
  )
) {

  assert(

    policy
      .ledgerRecordRequired,

    `${policy.operation.toLowerCase()} ledger required`

  );

}


// ============================================================
// TEST 7
// CRYPTOGRAPHIC AUDIT REQUIRED
// ============================================================

for (
  const policy
  of Object.values(
    KEY_AUTHORITY_POLICIES
  )
) {

  assert(

    policy
      .cryptographicAuditRequired,

    `${policy.operation.toLowerCase()} audit required`

  );

}


// ============================================================
// TEST 8
// TRANSFER OWNERSHIP GOVERNED
// ============================================================

const transferPolicy =
  getKeyAuthorityPolicy(
    "TRANSFER_OWNERSHIP"
  );

assert(

  transferPolicy
    .independentApprovalRequired,

  "transfer ownership requires approval"

);

assert(

  transferPolicy.allowedApprovers.includes(
    "APPROVAL_AUTHORITY"
  ),

  "transfer ownership approval authority defined"

);


// ============================================================
// TEST 9
// RESIDUAL RISK OWNER DEFINED
// ============================================================

for (
  const policy
  of Object.values(
    KEY_AUTHORITY_POLICIES
  )
) {

  assert(

    policy.residualRiskOwner !==
      "UNASSIGNED",

    `${policy.operation.toLowerCase()} residual risk owner defined`

  );

}


console.log("");
console.log("================================");
console.log("KEY AUTHORITY MODEL VERIFIED");
console.log("================================");
console.log("");