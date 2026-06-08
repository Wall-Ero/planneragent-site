//core/src/cryptography/infrastructure/__tests__/cryptography.infrastructure.policy.runner.ts

// ============================================================
// PlannerAgent
// Infrastructure Policy Runner
// ============================================================

import {
  getInfrastructurePolicy,
} from "../cryptography.infrastructure.policy";


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
// POLICY
// ============================================================

const policy =
  getInfrastructurePolicy();


// ============================================================
// TEST 1
// Policy resolved
// ============================================================

assert(
  !!policy,
  "policy resolved"
);


// ============================================================
// TEST 2
// Managed KMS class approved
// ============================================================

assert(
  policy.approvedKmsProviderClasses.includes(
    "MANAGED_KMS"
  ),
  "managed kms class approved"
);


// ============================================================
// TEST 3
// Secret vault class approved
// ============================================================

assert(
  policy.approvedVaultProviderClasses.includes(
    "SECRET_VAULT"
  ),
  "secret vault class approved"
);


// ============================================================
// TEST 4
// Encrypted storage approved
// ============================================================

assert(
  policy.approvedStorageClasses.includes(
    "ENCRYPTED_STORAGE"
  ),
  "encrypted storage approved"
);


// ============================================================
// TEST 5
// RBAC approved
// ============================================================

assert(
  policy.approvedAccessControls.includes(
    "ROLE_BASED_ACCESS_CONTROL"
  ),
  "role based access control approved"
);


// ============================================================
// TEST 6
// Backup restore approved
// ============================================================

assert(
  policy.approvedRecoveryMechanisms.includes(
    "BACKUP_RESTORE"
  ),
  "backup restore approved"
);


// ============================================================
// TEST 7
// Policy summary preserved
// ============================================================

assert(
  policy.summary.includes(
    "infrastructure_policy"
  ),
  "policy summary preserved"
);


// ============================================================
// TEST 8
// Approved component classes defined
// ============================================================

assert(
  policy.summary.includes(
    "approved_component_classes_defined"
  ),
  "approved component classes defined"
);


// ============================================================
// TEST 9
// Vendor neutrality preserved
// ============================================================

assert(
  !policy.summary.includes(
    "vendor_selection"
  ),
  "vendor neutrality preserved"
);


// ============================================================
// TEST 10
// Policy never provisions
// ============================================================

assert(
  !("provisionInfrastructure" in policy),
  "policy never provisions"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "INFRASTRUCTURE POLICY AUDIT"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Approved Classes:"
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
  "✓ ROLE_BASED_ACCESS_CONTROL"
);

console.log(
  "✓ BACKUP_RESTORE"
);

console.log("");

console.log(
  "Boundary Verification:"
);

console.log(
  "✓ vendor neutral"
);

console.log(
  "✓ policy only"
);

console.log(
  "✓ no provisioning"
);

console.log("");

console.log(
  "================================"
);

console.log(
  "INFRASTRUCTURE POLICY VERIFIED"
);

console.log(
  "================================"
);