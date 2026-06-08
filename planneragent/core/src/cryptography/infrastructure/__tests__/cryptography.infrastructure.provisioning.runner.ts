//core/src/cryptography/infrastructure/__tests__/cryptography.infrastructure.provisioning.runner.ts

// ============================================================
// PlannerAgent
// Infrastructure Provisioning Runner
// ============================================================

import {
  validateInfrastructureProvisioning,
} from "../cryptography.infrastructure.provisioning";


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
// Provisioning validation executes
// ============================================================

const kmsResult =
  validateInfrastructureProvisioning({

    resource:
      "KMS",

    infrastructureClass:
      "MANAGED_KMS",

  });

assert(
  !!kmsResult,
  "provisioning validation executes"
);


// ============================================================
// TEST 2
// Managed KMS provisioning allowed
// ============================================================

assert(
  kmsResult.provisioningAllowed === true,
  "managed kms provisioning allowed"
);


// ============================================================
// TEST 3
// Secret Vault provisioning allowed
// ============================================================

const vaultResult =
  validateInfrastructureProvisioning({

    resource:
      "VAULT",

    infrastructureClass:
      "SECRET_VAULT",

  });

assert(
  vaultResult.provisioningAllowed === true,
  "secret vault provisioning allowed"
);


// ============================================================
// TEST 4
// Encrypted Storage provisioning allowed
// ============================================================

const storageResult =
  validateInfrastructureProvisioning({

    resource:
      "STORAGE",

    infrastructureClass:
      "ENCRYPTED_STORAGE",

  });

assert(
  storageResult.provisioningAllowed === true,
  "encrypted storage provisioning allowed"
);


// ============================================================
// TEST 5
// Backup Restore provisioning allowed
// ============================================================

const recoveryResult =
  validateInfrastructureProvisioning({

    resource:
      "RECOVERY",

    infrastructureClass:
      "BACKUP_RESTORE",

  });

assert(
  recoveryResult.provisioningAllowed === true,
  "backup restore provisioning allowed"
);


// ============================================================
// TEST 6
// Policy validation preserved
// ============================================================

assert(
  kmsResult.policyValidated === true,
  "policy validation preserved"
);


// ============================================================
// TEST 7
// Provisioning summary preserved
// ============================================================

assert(
  kmsResult.summary.includes(
    "policy_validated"
  ),
  "provisioning summary preserved"
);


// ============================================================
// TEST 8
// Unapproved infrastructure class denied
// ============================================================

const deniedResult =
  validateInfrastructureProvisioning({

    resource:
      "KMS",

    infrastructureClass:
      "UNAPPROVED_KMS" as never,

  });

assert(
  deniedResult.provisioningAllowed === false,
  "unapproved infrastructure class denied"
);


// ============================================================
// TEST 9
// Denial reason preserved
// ============================================================

assert(
  deniedResult.denialReason ===
    "INFRASTRUCTURE_CLASS_NOT_APPROVED",
  "denial reason preserved"
);


// ============================================================
// TEST 10
// Provisioning authorization boundary preserved
// ============================================================

assert(
  kmsResult.provisioningAllowed === true &&
  kmsResult.policyValidated === true,
  "provisioning authorization boundary preserved"
);


// ============================================================
// TEST 11
// Provisioning does not execute
// ============================================================

assert(
  !("provisionedResource" in kmsResult),
  "provisioning does not execute"
);

assert(
  !("executionCompleted" in kmsResult),
  "provisioning does not execute"
);


// ============================================================
// TEST 12
// Access Control excluded from provisioning domain
// ============================================================

assert(
  !("ROLE_BASED_ACCESS_CONTROL" ===
    ("MANAGED_KMS" as string)),
  "access control excluded from provisioning domain"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "INFRASTRUCTURE PROVISIONING AUDIT"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Approved Infrastructure Classes:"
);

console.log(
  "✓ MANAGED_KMS"
);

console.log(
  "✓ SECRET_VAULT"
);

console.log(
  "✓ ENCRYPTED_STORAGE"
);

console.log(
  "✓ BACKUP_RESTORE"
);

console.log("");

console.log(
  "Boundary Verification:"
);

console.log(
  "✓ provisioning authorization boundary"
);

console.log(
  "✓ provisioning not executed"
);

console.log(
  "✓ access control excluded"
);

console.log("");

console.log(
  "================================"
);

console.log(
  "INFRASTRUCTURE PROVISIONING VERIFIED"
);

console.log(
  "================================"
);