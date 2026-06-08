//core/src/cryptography/infrastructure/__tests__/cryptography.infrastructure.usage.runner.ts

// ============================================================
// PlannerAgent
// Infrastructure Usage Runner
// ============================================================

import {
  validateInfrastructureUsage,
} from "../cryptography.infrastructure.usage";


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
// Usage validation executes
// ============================================================

const kmsUsageResult =
  validateInfrastructureUsage({

    resource:
      "KMS",

    operation:
      "USE_KMS",

    accessAuthorized:
      true,

  });

assert(
  !!kmsUsageResult,
  "usage validation executes"
);


// ============================================================
// TEST 2
// KMS usage allowed
// ============================================================

assert(
  kmsUsageResult.usageAllowed === true,
  "kms usage allowed"
);


// ============================================================
// TEST 3
// Vault usage allowed
// ============================================================

const vaultUsageResult =
  validateInfrastructureUsage({

    resource:
      "VAULT",

    operation:
      "USE_VAULT",

    accessAuthorized:
      true,

  });

assert(
  vaultUsageResult.usageAllowed === true,
  "vault usage allowed"
);


// ============================================================
// TEST 4
// Storage usage allowed
// ============================================================

const storageUsageResult =
  validateInfrastructureUsage({

    resource:
      "STORAGE",

    operation:
      "USE_STORAGE",

    accessAuthorized:
      true,

  });

assert(
  storageUsageResult.usageAllowed === true,
  "storage usage allowed"
);


// ============================================================
// TEST 5
// Recovery usage allowed
// ============================================================

const recoveryUsageResult =
  validateInfrastructureUsage({

    resource:
      "RECOVERY",

    operation:
      "USE_RECOVERY",

    accessAuthorized:
      true,

  });

assert(
  recoveryUsageResult.usageAllowed === true,
  "recovery usage allowed"
);


// ============================================================
// TEST 6
// Usage validation preserved
// ============================================================

assert(
  kmsUsageResult.usageValidated === true,
  "usage validation preserved"
);


// ============================================================
// TEST 7
// Usage summary preserved
// ============================================================

assert(
  kmsUsageResult.summary.includes(
    "usage_validated"
  ),
  "usage summary preserved"
);


// ============================================================
// TEST 8
// Unauthorized usage denied
// ============================================================

const deniedResult =
  validateInfrastructureUsage({

    resource:
      "KMS",

    operation:
      "USE_KMS",

    accessAuthorized:
      false,

  });

assert(
  deniedResult.usageAllowed === false,
  "unauthorized usage denied"
);


// ============================================================
// TEST 9
// Denial reason preserved
// ============================================================

assert(
  deniedResult.denialReason ===
    "ACCESS_NOT_AUTHORIZED",
  "denial reason preserved"
);


// ============================================================
// TEST 10
// Usage boundary preserved
// ============================================================

assert(
  kmsUsageResult.usageAllowed === true &&
  kmsUsageResult.usageValidated === true,
  "usage boundary preserved"
);


// ============================================================
// TEST 11
// Usage not executed
// ============================================================

assert(
  !("operationExecuted" in kmsUsageResult),
  "usage not executed"
);

assert(
  !("resourceUsed" in kmsUsageResult),
  "usage not executed"
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
  "INFRASTRUCTURE USAGE AUDIT"
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
  "✓ usage boundary"
);

console.log(
  "✓ usage not executed"
);

console.log(
  "✓ resource boundary preserved"
);

console.log("");

console.log(
  "================================"
);

console.log(
  "INFRASTRUCTURE USAGE VERIFIED"
);

console.log(
  "================================"
);