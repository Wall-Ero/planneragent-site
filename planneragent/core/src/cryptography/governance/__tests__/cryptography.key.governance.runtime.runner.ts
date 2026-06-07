// ============================================================
// PlannerAgent — Key Governance Runtime Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/__tests__/
// cryptography.key.governance.runtime.runner.ts
//
// STATUS
// ------------------------------------------------------------
// TEST RUNNER
//
// ============================================================

import {
  evaluateKeyGovernanceRequest,
} from "../cryptography.key.governance.runtime";

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
console.log("KEY GOVERNANCE RUNTIME AUDIT");
console.log("================================");
console.log("");


// ============================================================
// TEST 1
// VALID REQUEST
// ↓
// ALLOWED
// ============================================================

const validDecision =
  evaluateKeyGovernanceRequest({

    operation:
      "CREATE_KEY",

    authorityRole:
      "KEY_CREATOR",

    lifecycleStatus:
      "ACTIVE",

    approvalProvided:
      true,

  });

assert(
  validDecision.status ===
    "ALLOWED",

  "valid request allowed"
);

assert(
  validDecision.authorityValidated,

  "authority validated"
);

assert(
  validDecision.lifecycleValidated,

  "lifecycle validated"
);

assert(
  validDecision.approvalValidated,

  "approval validated"
);


// ============================================================
// TEST 2
// AUTHORITY INVALID
// ↓
// DENIED
// ↓
// AUTHORITY_INVALID
// ============================================================

const authorityDenied =
  evaluateKeyGovernanceRequest({

    operation:
      "CREATE_KEY",

    authorityRole:
      "KEY_CUSTODIAN",

    lifecycleStatus:
      "ACTIVE",

    approvalProvided:
      true,

  });

assert(
  authorityDenied.status ===
    "DENIED",

  "authority invalid denied"
);

assert(
  authorityDenied.denialReason ===
    "AUTHORITY_INVALID",

  "authority invalid reason preserved"
);


// ============================================================
// TEST 3
// LIFECYCLE INVALID
// ↓
// DENIED
// ↓
// LIFECYCLE_INVALID
// ============================================================

const lifecycleDenied =
  evaluateKeyGovernanceRequest({

    operation:
      "ENABLE_KEY",

    authorityRole:
      "KEY_OWNER",

    lifecycleStatus:
      "ACTIVE",

    approvalProvided:
      true,

  });

assert(
  lifecycleDenied.status ===
    "DENIED",

  "lifecycle invalid denied"
);

assert(
  lifecycleDenied.denialReason ===
    "LIFECYCLE_INVALID",

  "lifecycle invalid reason preserved"
);


// ============================================================
// TEST 4
// APPROVAL MISSING
// ↓
// APPROVAL_REQUIRED
// ============================================================

const approvalRequired =
  evaluateKeyGovernanceRequest({

    operation:
      "ROTATE_KEY",

    authorityRole:
      "KEY_OWNER",

    lifecycleStatus:
      "ACTIVE",

    approvalProvided:
      false,

  });

assert(
  approvalRequired.status ===
    "APPROVAL_REQUIRED",

  "approval required returned"
);

assert(
  !approvalRequired.approvalValidated,

  "approval validation failed"
);


// ============================================================
// TEST 5
// EVIDENCE PROPAGATION
// ============================================================

assert(
  validDecision
    .governanceEvidenceRequired,

  "governance evidence propagated"
);


// ============================================================
// TEST 6
// LEDGER PROPAGATION
// ============================================================

assert(
  validDecision
    .ledgerRecordRequired,

  "ledger requirement propagated"
);


// ============================================================
// TEST 7
// AUDIT PROPAGATION
// ============================================================

assert(
  validDecision
    .cryptographicAuditRequired,

  "cryptographic audit propagated"
);


// ============================================================
// VERIFIED
// ============================================================

console.log("");
console.log("================================");
console.log("KEY GOVERNANCE RUNTIME VERIFIED");
console.log("================================");
console.log("");