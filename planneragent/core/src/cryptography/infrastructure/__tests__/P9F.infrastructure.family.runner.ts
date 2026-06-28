// ============================================================
// PlannerAgent
// P9F Infrastructure Family Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/infrastructure/__tests__/
// P9F.infrastructure.family.runner.ts
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9F.3 Infrastructure Family
// as a complete architectural chain:
//
// Policy
// ↓
// Provisioning
// ↓
// Access Control
// ↓
// Usage
// ↓
// Recovery
//
// This runner verifies domain contracts.
//
// This runner does not reinterpret
// previous domains.
//
// ============================================================

import {
  resolveKeyRotationInfrastructurePolicy,
} from "../P9F.key.rotation.infrastructure.policy";

import {
  authorizeKeyRotationInfrastructureProvisioning,
} from "../P9F.key.rotation.infrastructure.provisioning";

import {
  authorizeKeyRotationInfrastructureAccess,
} from "../P9F.key.rotation.infrastructure.access";

import {
  authorizeKeyRotationInfrastructureUsage,
} from "../P9F.key.rotation.infrastructure.usage";

import {
  authorizeKeyRotationInfrastructureRecovery,
} from "../P9F.key.rotation.infrastructure.recovery";


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
  resolveKeyRotationInfrastructurePolicy();

assert(
  policy.approvedInfrastructure.includes(
    "MANAGED_KMS"
  ),
  "approved infrastructure"
);

assert(
  policy.approvedEncryptedStorage.includes(
    "DATABASE"
  ),
  "approved storage"
);

assert(
  policy.approvedRecoveryCapabilities.includes(
    "KEY_RECOVERY"
  ),
  "approved recovery"
);


// ============================================================
// PROVISIONING
// ============================================================

const authorizedProvisioning =
  authorizeKeyRotationInfrastructureProvisioning({

    resource:
      "KEY_ROTATION_INFRASTRUCTURE",

    infrastructureClass:
      "MANAGED_KMS",

  });

assert(
  authorizedProvisioning.provisioningStatus ===
    "PROVISIONING_AUTHORIZED",
  "provisioning authorized"
);

assert(
  authorizedProvisioning.provisioningAuthorized ===
    true,
  "provisioning authorization preserved"
);

const deniedProvisioning =
  authorizeKeyRotationInfrastructureProvisioning({

    resource:
      "KEY_ROTATION_INFRASTRUCTURE",

    infrastructureClass:
      "DATABASE",

  });

assert(
  deniedProvisioning.provisioningStatus ===
    "PROVISIONING_DENIED",
  "provisioning denied"
);

assert(
  deniedProvisioning.denialReason ===
    "INFRASTRUCTURE_CLASS_RESOURCE_MISMATCH",
  "resource/class mismatch"
);

const unapprovedProvisioning =
  authorizeKeyRotationInfrastructureProvisioning({

    resource:
      "KEY_ROTATION_INFRASTRUCTURE",

    infrastructureClass:
      "UNAPPROVED_INFRASTRUCTURE" as never,

  });

assert(
  unapprovedProvisioning.provisioningStatus ===
    "PROVISIONING_DENIED",
  "infrastructure class not approved"
);

assert(
  unapprovedProvisioning.denialReason ===
    "INFRASTRUCTURE_CLASS_NOT_APPROVED",
  "unapproved infrastructure denial preserved"
);

assert(
  !("infrastructureProvisioned" in authorizedProvisioning),
  "provisioning does not execute infrastructure"
);


// ============================================================
// ACCESS CONTROL
// ============================================================

const accessGranted =
  authorizeKeyRotationInfrastructureAccess({

    provisioning:
      authorizedProvisioning,

    accessDecision:
      "ALLOW_ACCESS",

  });

assert(
  accessGranted.accessStatus ===
    "ACCESS_GRANTED",
  "access granted"
);

assert(
  accessGranted.accessGranted === true,
  "access grant preserved"
);

const accessDeniedByProvisioning =
  authorizeKeyRotationInfrastructureAccess({

    provisioning:
      deniedProvisioning,

    accessDecision:
      "ALLOW_ACCESS",

  });

assert(
  accessDeniedByProvisioning.accessStatus ===
    "ACCESS_DENIED",
  "access denied by provisioning"
);

assert(
  accessDeniedByProvisioning.denialReason ===
    "PROVISIONING_NOT_AUTHORIZED",
  "access provisioning denial preserved"
);

const accessDeniedByDecision =
  authorizeKeyRotationInfrastructureAccess({

    provisioning:
      authorizedProvisioning,

    accessDecision:
      "DENY_ACCESS",

  });

assert(
  accessDeniedByDecision.accessStatus ===
    "ACCESS_DENIED",
  "access denied by decision"
);

assert(
  accessDeniedByDecision.denialReason ===
    "ACCESS_NOT_ALLOWED",
  "access decision denial preserved"
);

assert(
  accessGranted.policyValidated ===
    authorizedProvisioning.policyValidated &&
  accessGranted.resourceCompatible ===
    authorizedProvisioning.resourceCompatible &&
  accessGranted.resource ===
    authorizedProvisioning.resource &&
  accessGranted.infrastructureClass ===
    authorizedProvisioning.infrastructureClass,
  "provisioning context preserved"
);

assert(
  !("infrastructureUsed" in accessGranted),
  "access does not use infrastructure"
);


// ============================================================
// USAGE
// ============================================================

const usageAuthorized =
  authorizeKeyRotationInfrastructureUsage({

    access:
      accessGranted,

    usageDecision:
      "ALLOW_USAGE",

  });

assert(
  usageAuthorized.usageStatus ===
    "USAGE_AUTHORIZED",
  "usage authorized"
);

assert(
  usageAuthorized.usageAuthorized === true,
  "usage authorization preserved"
);

const usageDeniedByAccess =
  authorizeKeyRotationInfrastructureUsage({

    access:
      accessDeniedByDecision,

    usageDecision:
      "ALLOW_USAGE",

  });

assert(
  usageDeniedByAccess.usageStatus ===
    "USAGE_DENIED",
  "usage denied by access"
);

assert(
  usageDeniedByAccess.denialReason ===
    "ACCESS_NOT_GRANTED",
  "usage access denial preserved"
);

const usageDeniedByDecision =
  authorizeKeyRotationInfrastructureUsage({

    access:
      accessGranted,

    usageDecision:
      "DENY_USAGE",

  });

assert(
  usageDeniedByDecision.usageStatus ===
    "USAGE_DENIED",
  "usage denied by decision"
);

assert(
  usageDeniedByDecision.denialReason ===
    "USAGE_NOT_ALLOWED",
  "usage decision denial preserved"
);

assert(
  usageAuthorized.accessGranted ===
    accessGranted.accessGranted &&
  usageAuthorized.policyValidated ===
    accessGranted.policyValidated &&
  usageAuthorized.resourceCompatible ===
    accessGranted.resourceCompatible &&
  usageAuthorized.resource ===
    accessGranted.resource &&
  usageAuthorized.infrastructureClass ===
    accessGranted.infrastructureClass,
  "infrastructure context preserved"
);

assert(
  !("providerOperationExecuted" in usageAuthorized),
  "usage does not execute provider operations"
);


// ============================================================
// RECOVERY
// ============================================================

const recoveryAuthorized =
  authorizeKeyRotationInfrastructureRecovery({

    usage:
      usageAuthorized,

    recoveryDecision:
      "ALLOW_RECOVERY",

  });

assert(
  recoveryAuthorized.recoveryStatus ===
    "RECOVERY_AUTHORIZED",
  "recovery authorized"
);

assert(
  recoveryAuthorized.recoveryAuthorized === true,
  "recovery authorization preserved"
);

const recoveryDeniedByUsage =
  authorizeKeyRotationInfrastructureRecovery({

    usage:
      usageDeniedByDecision,

    recoveryDecision:
      "ALLOW_RECOVERY",

  });

assert(
  recoveryDeniedByUsage.recoveryStatus ===
    "RECOVERY_DENIED",
  "recovery denied by usage"
);

assert(
  recoveryDeniedByUsage.denialReason ===
    "USAGE_NOT_AUTHORIZED",
  "recovery usage denial preserved"
);

const recoveryDeniedByDecision =
  authorizeKeyRotationInfrastructureRecovery({

    usage:
      usageAuthorized,

    recoveryDecision:
      "DENY_RECOVERY",

  });

assert(
  recoveryDeniedByDecision.recoveryStatus ===
    "RECOVERY_DENIED",
  "recovery denied by decision"
);

assert(
  recoveryDeniedByDecision.denialReason ===
    "RECOVERY_NOT_ALLOWED",
  "recovery decision denial preserved"
);

assert(
  recoveryAuthorized.usageAuthorized ===
    usageAuthorized.usageAuthorized &&
  recoveryAuthorized.accessGranted ===
    usageAuthorized.accessGranted &&
  recoveryAuthorized.provisioningAuthorized ===
    usageAuthorized.provisioningAuthorized &&
  recoveryAuthorized.policyValidated ===
    usageAuthorized.policyValidated &&
  recoveryAuthorized.resourceCompatible ===
    usageAuthorized.resourceCompatible &&
  recoveryAuthorized.resource ===
    usageAuthorized.resource &&
  recoveryAuthorized.infrastructureClass ===
    usageAuthorized.infrastructureClass,
  "recovery infrastructure context preserved"
);

assert(
  !("recoveryExecuted" in recoveryAuthorized),
  "recovery does not execute recovery operations"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "P9F INFRASTRUCTURE FAMILY"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Policy:"
);

console.log(
  "✓ approved infrastructure"
);

console.log(
  "✓ approved storage"
);

console.log(
  "✓ approved recovery"
);

console.log("");

console.log(
  "Provisioning:"
);

console.log(
  "✓ provisioning authorized"
);

console.log(
  "✓ provisioning denied"
);

console.log(
  "✓ infrastructure class not approved"
);

console.log(
  "✓ resource/class mismatch"
);

console.log(
  "✓ provisioning does not execute infrastructure"
);

console.log("");

console.log(
  "Access Control:"
);

console.log(
  "✓ access granted"
);

console.log(
  "✓ access denied by provisioning"
);

console.log(
  "✓ access denied by decision"
);

console.log(
  "✓ provisioning context preserved"
);

console.log(
  "✓ access does not use infrastructure"
);

console.log("");

console.log(
  "Usage:"
);

console.log(
  "✓ usage authorized"
);

console.log(
  "✓ usage denied by access"
);

console.log(
  "✓ usage denied by decision"
);

console.log(
  "✓ infrastructure context preserved"
);

console.log(
  "✓ usage does not execute provider operations"
);

console.log("");

console.log(
  "Recovery:"
);

console.log(
  "✓ recovery authorized"
);

console.log(
  "✓ recovery denied by usage"
);

console.log(
  "✓ recovery denied by decision"
);

console.log(
  "✓ infrastructure context preserved"
);

console.log(
  "✓ recovery does not execute recovery operations"
);

console.log("");

console.log(
  "================================"
);

console.log(
  "INFRASTRUCTURE FAMILY VERIFIED"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Policy"
);

console.log(
  "↓"
);

console.log(
  "Provisioning"
);

console.log(
  "↓"
);

console.log(
  "Access Control"
);

console.log(
  "↓"
);

console.log(
  "Usage"
);

console.log(
  "↓"
);

console.log(
  "Recovery"
);

console.log("");

console.log(
  "STATUS:"
);

console.log(
  "COMPLETE"
);

console.log(
  "================================"
);