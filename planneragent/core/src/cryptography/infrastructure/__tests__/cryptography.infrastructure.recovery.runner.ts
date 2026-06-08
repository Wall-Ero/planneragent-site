//core/src/cryptography/infrastructure/__tests__/cryptography.infrastructure.recovery.runner.ts

// ============================================================
// PlannerAgent
// Infrastructure Recovery Runner
// ============================================================

import {
  validateInfrastructureRecovery,
} from "../cryptography.infrastructure.recovery";


// ============================================================
// ASSERT
// ============================================================

function assert(
  condition: boolean,
  message: string
): void {

  if (!condition) {

    throw new Error(
      `❌ ${message}`
    );

  }

  console.log(
    `✅ ${message}`
  );

}


// ============================================================
// TEST 1
// Recovery validation executes
// ============================================================

const recoveryResult =
  validateInfrastructureRecovery({

    resource:
      "RECOVERY",

    recoveryMechanism:
      "BACKUP_RESTORE",

    operation:
      "REQUEST_BACKUP_RESTORE",

    usageAuthorized:
      true,

  });

assert(
  !!recoveryResult,
  "recovery validation executes"
);


// ============================================================
// TEST 2
// Recovery allowed
// ============================================================

assert(
  recoveryResult.recoveryAllowed === true,
  "recovery allowed"
);


// ============================================================
// TEST 3
// Recovery validation preserved
// ============================================================

assert(
  recoveryResult.recoveryValidated === true,
  "recovery validation preserved"
);


// ============================================================
// TEST 4
// Recovery mechanism validation preserved
// ============================================================

assert(
  recoveryResult.recoveryMechanismValidated === true,
  "recovery mechanism validation preserved"
);


// ============================================================
// TEST 5
// Recovery summary preserved
// ============================================================

assert(
  recoveryResult.summary.includes(
    "recovery_allowed"
  ),
  "recovery summary preserved"
);


// ============================================================
// TEST 6
// Usage authorization required
// ============================================================

const unauthorizedResult =
  validateInfrastructureRecovery({

    resource:
      "RECOVERY",

    recoveryMechanism:
      "BACKUP_RESTORE",

    operation:
      "REQUEST_BACKUP_RESTORE",

    usageAuthorized:
      false,

  });

assert(
  unauthorizedResult.recoveryAllowed === false,
  "usage authorization required"
);


// ============================================================
// TEST 7
// Usage authorization denial preserved
// ============================================================

assert(
  unauthorizedResult.denialReason ===
    "USAGE_NOT_AUTHORIZED",
  "usage authorization denial preserved"
);


// ============================================================
// TEST 8
// Unapproved recovery mechanism denied
// ============================================================

const invalidMechanismResult =
  validateInfrastructureRecovery({

    resource:
      "RECOVERY",

    recoveryMechanism:
      "UNAPPROVED_RECOVERY" as never,

    operation:
      "REQUEST_BACKUP_RESTORE",

    usageAuthorized:
      true,

  });

assert(
  invalidMechanismResult.recoveryAllowed === false,
  "unapproved recovery mechanism denied"
);


// ============================================================
// TEST 9
// Recovery mechanism denial preserved
// ============================================================

assert(
  invalidMechanismResult.denialReason ===
    "RECOVERY_MECHANISM_NOT_APPROVED",
  "recovery mechanism denial preserved"
);


// ============================================================
// TEST 10
// Recovery authorization boundary preserved
// ============================================================

assert(
  recoveryResult.recoveryAllowed === true &&
  recoveryResult.recoveryValidated === true,
  "recovery authorization boundary preserved"
);


// ============================================================
// TEST 11
// Recovery not executed
// ============================================================

assert(
  !("backupRestored" in recoveryResult),
  "recovery not executed"
);

assert(
  !("snapshotRestored" in recoveryResult),
  "recovery not executed"
);

assert(
  !("recoveryExecuted" in recoveryResult),
  "recovery not executed"
);


// ============================================================
// TEST 12
// Recovery depends on usage boundary
// ============================================================

assert(
  unauthorizedResult.recoveryAllowed === false,
  "recovery depends on usage boundary"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "INFRASTRUCTURE RECOVERY AUDIT"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Approved Recovery Mechanisms:"
);

console.log(
  "✓ BACKUP_RESTORE"
);

console.log("");

console.log(
  "Boundary Verification:"
);

console.log(
  "✓ recovery authorization boundary"
);

console.log(
  "✓ recovery not executed"
);

console.log(
  "✓ usage authorization required"
);

console.log("");

console.log(
  "================================"
);

console.log(
  "INFRASTRUCTURE RECOVERY VERIFIED"
);

console.log(
  "================================"
);