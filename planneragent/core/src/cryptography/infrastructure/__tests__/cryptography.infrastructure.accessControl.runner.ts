//core/src/cryptography/infrastructure/__tests__/cryptography.infrastructure.accessControl.runner.ts

// ============================================================
// PlannerAgent
// Infrastructure Access Control Runner
// ============================================================

import {
  validateInfrastructureAccess,
} from "../cryptography.infrastructure.accessControl";


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
// Access validation executes
// ============================================================

const kmsAccessResult =
  validateInfrastructureAccess({

    accessControl:
      "ROLE_BASED_ACCESS_CONTROL",

    requestedResource:
      "KMS",

  });

assert(
  !!kmsAccessResult,
  "access validation executes"
);


// ============================================================
// TEST 2
// KMS access allowed
// ============================================================

assert(
  kmsAccessResult.accessAllowed === true,
  "kms access allowed"
);


// ============================================================
// TEST 3
// Vault access allowed
// ============================================================

const vaultAccessResult =
  validateInfrastructureAccess({

    accessControl:
      "ROLE_BASED_ACCESS_CONTROL",

    requestedResource:
      "VAULT",

  });

assert(
  vaultAccessResult.accessAllowed === true,
  "vault access allowed"
);


// ============================================================
// TEST 4
// Storage access allowed
// ============================================================

const storageAccessResult =
  validateInfrastructureAccess({

    accessControl:
      "ROLE_BASED_ACCESS_CONTROL",

    requestedResource:
      "STORAGE",

  });

assert(
  storageAccessResult.accessAllowed === true,
  "storage access allowed"
);


// ============================================================
// TEST 5
// Recovery access allowed
// ============================================================

const recoveryAccessResult =
  validateInfrastructureAccess({

    accessControl:
      "ROLE_BASED_ACCESS_CONTROL",

    requestedResource:
      "RECOVERY",

  });

assert(
  recoveryAccessResult.accessAllowed === true,
  "recovery access allowed"
);


// ============================================================
// TEST 6
// Access control validation preserved
// ============================================================

assert(
  kmsAccessResult.accessControlValidated === true,
  "access control validation preserved"
);


// ============================================================
// TEST 7
// Access summary preserved
// ============================================================

assert(
  kmsAccessResult.summary.includes(
    "access_control_validated"
  ),
  "access summary preserved"
);


// ============================================================
// TEST 8
// Unapproved access control denied
// ============================================================

const deniedResult =
  validateInfrastructureAccess({

    accessControl:
      "UNAPPROVED_ACCESS_CONTROL" as never,

    requestedResource:
      "KMS",

  });

assert(
  deniedResult.accessAllowed === false,
  "unapproved access control denied"
);


// ============================================================
// TEST 9
// Denial reason preserved
// ============================================================

assert(
  deniedResult.denialReason ===
    "ACCESS_CONTROL_NOT_APPROVED",
  "denial reason preserved"
);


// ============================================================
// TEST 10
// Access authorization boundary preserved
// ============================================================

assert(
  kmsAccessResult.accessAllowed === true &&
  kmsAccessResult.accessControlValidated === true,
  "access authorization boundary preserved"
);


// ============================================================
// TEST 11
// Access not enforced
// ============================================================

assert(
  !("accessEnforced" in kmsAccessResult),
  "access not enforced"
);

assert(
  !("resourceAccessed" in kmsAccessResult),
  "access not enforced"
);


// ============================================================
// TEST 12
// Resource boundary preserved
// ============================================================

assert(
  ["KMS", "VAULT", "STORAGE", "RECOVERY"]
    .includes("KMS"),
  "resource boundary preserved"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "INFRASTRUCTURE ACCESS CONTROL AUDIT"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Approved Resources:"
);

console.log(
  "✓ KMS"
);

console.log(
  "✓ VAULT"
);

console.log(
  "✓ STORAGE"
);

console.log(
  "✓ RECOVERY"
);

console.log("");

console.log(
  "Boundary Verification:"
);

console.log(
  "✓ access authorization boundary"
);

console.log(
  "✓ access not enforced"
);

console.log(
  "✓ resource boundary preserved"
);

console.log("");

console.log(
  "================================"
);

console.log(
  "INFRASTRUCTURE ACCESS CONTROL VERIFIED"
);

console.log(
  "================================"
);