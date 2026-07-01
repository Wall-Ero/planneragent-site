//core/src/cryptography/orchestration/__tests__/P9G.key.rotation.orchestrator.runner.ts

// ============================================================
// PlannerAgent
// P9G Key Rotation Orchestrator Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/orchestration/__tests__/
// P9G.key.rotation.orchestrator.runner.ts
//
// PURPOSE
// ------------------------------------------------------------
// Verify P9G.1 Key Rotation Orchestrator
// contract.
//
// This runner verifies orchestration,
// contract propagation, summary composition,
// and family boundary preservation.
//
// This runner does not verify provider
// execution.
//
// ============================================================

import {
  orchestrateKeyRotation,
} from "../P9G.key.rotation.orchestrator";


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
// HAPPY PATH
// ============================================================

const completed =
  orchestrateKeyRotation({

    governanceRequest: {
      authority:
        "PRIMARY_AUTHORITY",

      trigger:
        "KEY_COMPROMISE",
    },

    mechanismRequest: {
      mechanism:
        "KEY_REWRAP",

      wrappingOperation:
        "REWRAP_KEY",
    },

    infrastructureProvisioningRequest: {
      resource:
        "KEY_ROTATION_INFRASTRUCTURE",

      infrastructureClass:
        "MANAGED_KMS",
    },

    accessDecision:
      "ALLOW_ACCESS",

    usageDecision:
      "ALLOW_USAGE",

    recoveryDecision:
      "ALLOW_RECOVERY",

    evidenceId:
      "evidence-key-rotation-001",

    evidenceGeneratedAt:
      "2026-01-01T00:00:00.000Z",

    ledgerRecordId:
      "ledger-key-rotation-001",

    ledgerRecordedAt:
      "2026-01-01T00:01:00.000Z",

    auditId:
      "audit-key-rotation-001",

    auditedAt:
      "2026-01-01T00:02:00.000Z",

    verificationId:
      "verification-key-rotation-001",

    verifiedAt:
      "2026-01-01T00:03:00.000Z",

  });

assert(
  completed.orchestrationStatus ===
    "KEY_ROTATION_ORCHESTRATION_COMPLETED",
  "orchestration completed"
);

assert(
  completed.governanceDecision.decisionStatus !==
    "ROTATION_DENIED",
  "governance authorized"
);

assert(
  completed.governanceEvidence?.evidenceStatus ===
    "EVIDENCE_GENERATED",
  "governance evidence generated"
);

assert(
  completed.governanceLedgerRecord?.ledgerStatus ===
    "LEDGER_RECORD_CREATED",
  "governance ledger recorded"
);

assert(
  completed.governanceAuditResult?.auditStatus ===
    "AUDIT_PASSED",
  "governance audit passed"
);

assert(
  completed.mechanismExecutionResult?.executionStatus ===
    "EXECUTION_COMPLETED",
  "mechanism executed"
);

assert(
  completed.mechanismVerificationResult?.verificationStatus ===
    "VERIFICATION_PASSED",
  "mechanism verified"
);

assert(
  completed.infrastructureProvisioningResult?.provisioningAuthorized ===
    true,
  "infrastructure provisioning authorized"
);

assert(
  completed.infrastructureAccessResult?.accessGranted ===
    true,
  "infrastructure access granted"
);

assert(
  completed.infrastructureUsageResult?.usageAuthorized ===
    true,
  "infrastructure usage authorized"
);

assert(
  completed.infrastructureRecoveryResult?.recoveryAuthorized ===
    true,
  "infrastructure recovery authorized"
);

assert(
  completed.summary.includes(
    "key_rotation_orchestration_completed"
  ),
  "orchestration completion marker preserved"
);


// ============================================================
// CONTRACT PROPAGATION
// ============================================================

assert(
  completed.governanceLedgerRecord?.evidenceId ===
    completed.governanceEvidence?.evidenceId,
  "governance evidence propagated"
);

assert(
  completed.governanceAuditResult?.ledgerRecordId ===
    completed.governanceLedgerRecord?.ledgerRecordId,
  "governance ledger propagated"
);

assert(
  completed.mechanismVerificationResult?.executionStatus ===
    completed.mechanismExecutionResult?.executionStatus,
  "mechanism execution propagated"
);

assert(
  completed.infrastructureRecoveryResult?.resource ===
    completed.infrastructureUsageResult?.resource,
  "infrastructure context propagated"
);

assert(
  completed.infrastructureRecoveryResult?.infrastructureClass ===
    completed.infrastructureUsageResult?.infrastructureClass,
  "infrastructure class propagated"
);

assert(
  completed.infrastructureRecoveryResult?.policyValidated ===
    completed.infrastructureUsageResult?.policyValidated,
  "policy validation propagated"
);

assert(
  completed.infrastructureRecoveryResult?.resourceCompatible ===
    completed.infrastructureUsageResult?.resourceCompatible,
  "resource compatibility propagated"
);


// ============================================================
// SUMMARY COMPOSITION
// ============================================================

assert(
  completed.summary.includes(
    "audit_passed"
  ),
  "governance summary propagated"
);

assert(
  completed.summary.includes(
    "mechanism_verification_passed"
  ),
  "mechanism summary propagated"
);

assert(
  completed.summary.includes(
    "recovery_authorized"
  ),
  "infrastructure summary propagated"
);


// ============================================================
// GOVERNANCE DENIED
// ============================================================

const governanceDenied =
  orchestrateKeyRotation({

    governanceRequest: {
      authority:
        "PRIMARY_AUTHORITY",

      trigger:
        "UNAPPROVED_TRIGGER" as never,
    },

    mechanismRequest: {
      mechanism:
        "KEY_REWRAP",

      wrappingOperation:
        "REWRAP_KEY",
    },

    infrastructureProvisioningRequest: {
      resource:
        "KEY_ROTATION_INFRASTRUCTURE",

      infrastructureClass:
        "MANAGED_KMS",
    },

    accessDecision:
      "ALLOW_ACCESS",

    usageDecision:
      "ALLOW_USAGE",

    recoveryDecision:
      "ALLOW_RECOVERY",

    evidenceId:
      "evidence-governance-denied-001",

    evidenceGeneratedAt:
      "2026-01-01T00:10:00.000Z",

    ledgerRecordId:
      "ledger-governance-denied-001",

    ledgerRecordedAt:
      "2026-01-01T00:11:00.000Z",

    auditId:
      "audit-governance-denied-001",

    auditedAt:
      "2026-01-01T00:12:00.000Z",

    verificationId:
      "verification-governance-denied-001",

    verifiedAt:
      "2026-01-01T00:13:00.000Z",

  });

assert(
  governanceDenied.orchestrationStatus ===
    "KEY_ROTATION_ORCHESTRATION_DENIED",
  "governance denial stops orchestration"
);

assert(
  governanceDenied.denialReason ===
    "GOVERNANCE_DENIED",
  "governance denial reason preserved"
);

assert(
  governanceDenied.mechanismExecutionResult ===
    undefined,
  "governance denial prevents mechanism execution"
);


// ============================================================
// MECHANISM EXECUTION DENIED
// ============================================================

const mechanismDenied =
  orchestrateKeyRotation({

    governanceRequest: {
      authority:
        "PRIMARY_AUTHORITY",

      trigger:
        "KEY_COMPROMISE",
    },

    mechanismRequest: {
      mechanism:
        "UNAPPROVED_MECHANISM" as never,

      wrappingOperation:
        "REWRAP_KEY",
    },

    infrastructureProvisioningRequest: {
      resource:
        "KEY_ROTATION_INFRASTRUCTURE",

      infrastructureClass:
        "MANAGED_KMS",
    },

    accessDecision:
      "ALLOW_ACCESS",

    usageDecision:
      "ALLOW_USAGE",

    recoveryDecision:
      "ALLOW_RECOVERY",

    evidenceId:
      "evidence-mechanism-denied-001",

    evidenceGeneratedAt:
      "2026-01-01T00:20:00.000Z",

    ledgerRecordId:
      "ledger-mechanism-denied-001",

    ledgerRecordedAt:
      "2026-01-01T00:21:00.000Z",

    auditId:
      "audit-mechanism-denied-001",

    auditedAt:
      "2026-01-01T00:22:00.000Z",

    verificationId:
      "verification-mechanism-denied-001",

    verifiedAt:
      "2026-01-01T00:23:00.000Z",

  });

assert(
  mechanismDenied.orchestrationStatus ===
    "KEY_ROTATION_ORCHESTRATION_DENIED",
  "mechanism denial stops orchestration"
);

assert(
  mechanismDenied.denialReason ===
    "MECHANISM_EXECUTION_DENIED",
  "mechanism denial reason preserved"
);

assert(
  mechanismDenied.infrastructureProvisioningResult ===
    undefined,
  "mechanism denial prevents infrastructure provisioning"
);


// ============================================================
// INFRASTRUCTURE PROVISIONING DENIED
// ============================================================

const provisioningDenied =
  orchestrateKeyRotation({

    governanceRequest: {
      authority:
        "PRIMARY_AUTHORITY",

      trigger:
        "KEY_COMPROMISE",
    },

    mechanismRequest: {
      mechanism:
        "KEY_REWRAP",

      wrappingOperation:
        "REWRAP_KEY",
    },

    infrastructureProvisioningRequest: {
      resource:
        "KEY_ROTATION_INFRASTRUCTURE",

      infrastructureClass:
        "DATABASE",
    },

    accessDecision:
      "ALLOW_ACCESS",

    usageDecision:
      "ALLOW_USAGE",

    recoveryDecision:
      "ALLOW_RECOVERY",

    evidenceId:
      "evidence-provisioning-denied-001",

    evidenceGeneratedAt:
      "2026-01-01T00:30:00.000Z",

    ledgerRecordId:
      "ledger-provisioning-denied-001",

    ledgerRecordedAt:
      "2026-01-01T00:31:00.000Z",

    auditId:
      "audit-provisioning-denied-001",

    auditedAt:
      "2026-01-01T00:32:00.000Z",

    verificationId:
      "verification-provisioning-denied-001",

    verifiedAt:
      "2026-01-01T00:33:00.000Z",

  });

assert(
  provisioningDenied.orchestrationStatus ===
    "KEY_ROTATION_ORCHESTRATION_DENIED",
  "infrastructure provisioning denial stops orchestration"
);

assert(
  provisioningDenied.denialReason ===
    "INFRASTRUCTURE_PROVISIONING_DENIED",
  "infrastructure provisioning denial reason preserved"
);

assert(
  provisioningDenied.infrastructureAccessResult ===
    undefined,
  "provisioning denial prevents access control"
);


// ============================================================
// INFRASTRUCTURE ACCESS DENIED
// ============================================================

const accessDenied =
  orchestrateKeyRotation({

    governanceRequest: {
      authority:
        "PRIMARY_AUTHORITY",

      trigger:
        "KEY_COMPROMISE",
    },

    mechanismRequest: {
      mechanism:
        "KEY_REWRAP",

      wrappingOperation:
        "REWRAP_KEY",
    },

    infrastructureProvisioningRequest: {
      resource:
        "KEY_ROTATION_INFRASTRUCTURE",

      infrastructureClass:
        "MANAGED_KMS",
    },

    accessDecision:
      "DENY_ACCESS",

    usageDecision:
      "ALLOW_USAGE",

    recoveryDecision:
      "ALLOW_RECOVERY",

    evidenceId:
      "evidence-access-denied-001",

    evidenceGeneratedAt:
      "2026-01-01T00:40:00.000Z",

    ledgerRecordId:
      "ledger-access-denied-001",

    ledgerRecordedAt:
      "2026-01-01T00:41:00.000Z",

    auditId:
      "audit-access-denied-001",

    auditedAt:
      "2026-01-01T00:42:00.000Z",

    verificationId:
      "verification-access-denied-001",

    verifiedAt:
      "2026-01-01T00:43:00.000Z",

  });

assert(
  accessDenied.orchestrationStatus ===
    "KEY_ROTATION_ORCHESTRATION_DENIED",
  "infrastructure access denial stops orchestration"
);

assert(
  accessDenied.denialReason ===
    "INFRASTRUCTURE_ACCESS_DENIED",
  "infrastructure access denial reason preserved"
);

assert(
  accessDenied.infrastructureUsageResult ===
    undefined,
  "access denial prevents usage"
);


// ============================================================
// INFRASTRUCTURE USAGE DENIED
// ============================================================

const usageDenied =
  orchestrateKeyRotation({

    governanceRequest: {
      authority:
        "PRIMARY_AUTHORITY",

      trigger:
        "KEY_COMPROMISE",
    },

    mechanismRequest: {
      mechanism:
        "KEY_REWRAP",

      wrappingOperation:
        "REWRAP_KEY",
    },

    infrastructureProvisioningRequest: {
      resource:
        "KEY_ROTATION_INFRASTRUCTURE",

      infrastructureClass:
        "MANAGED_KMS",
    },

    accessDecision:
      "ALLOW_ACCESS",

    usageDecision:
      "DENY_USAGE",

    recoveryDecision:
      "ALLOW_RECOVERY",

    evidenceId:
      "evidence-usage-denied-001",

    evidenceGeneratedAt:
      "2026-01-01T00:50:00.000Z",

    ledgerRecordId:
      "ledger-usage-denied-001",

    ledgerRecordedAt:
      "2026-01-01T00:51:00.000Z",

    auditId:
      "audit-usage-denied-001",

    auditedAt:
      "2026-01-01T00:52:00.000Z",

    verificationId:
      "verification-usage-denied-001",

    verifiedAt:
      "2026-01-01T00:53:00.000Z",

  });

assert(
  usageDenied.orchestrationStatus ===
    "KEY_ROTATION_ORCHESTRATION_DENIED",
  "infrastructure usage denial stops orchestration"
);

assert(
  usageDenied.denialReason ===
    "INFRASTRUCTURE_USAGE_DENIED",
  "infrastructure usage denial reason preserved"
);

assert(
  usageDenied.infrastructureRecoveryResult ===
    undefined,
  "usage denial prevents recovery"
);


// ============================================================
// INFRASTRUCTURE RECOVERY DENIED
// ============================================================

const recoveryDenied =
  orchestrateKeyRotation({

    governanceRequest: {
      authority:
        "PRIMARY_AUTHORITY",

      trigger:
        "KEY_COMPROMISE",
    },

    mechanismRequest: {
      mechanism:
        "KEY_REWRAP",

      wrappingOperation:
        "REWRAP_KEY",
    },

    infrastructureProvisioningRequest: {
      resource:
        "KEY_ROTATION_INFRASTRUCTURE",

      infrastructureClass:
        "MANAGED_KMS",
    },

    accessDecision:
      "ALLOW_ACCESS",

    usageDecision:
      "ALLOW_USAGE",

    recoveryDecision:
      "DENY_RECOVERY",

    evidenceId:
      "evidence-recovery-denied-001",

    evidenceGeneratedAt:
      "2026-01-01T01:00:00.000Z",

    ledgerRecordId:
      "ledger-recovery-denied-001",

    ledgerRecordedAt:
      "2026-01-01T01:01:00.000Z",

    auditId:
      "audit-recovery-denied-001",

    auditedAt:
      "2026-01-01T01:02:00.000Z",

    verificationId:
      "verification-recovery-denied-001",

    verifiedAt:
      "2026-01-01T01:03:00.000Z",

  });

assert(
  recoveryDenied.orchestrationStatus ===
    "KEY_ROTATION_ORCHESTRATION_DENIED",
  "infrastructure recovery denial stops orchestration"
);

assert(
  recoveryDenied.denialReason ===
    "INFRASTRUCTURE_RECOVERY_DENIED",
  "infrastructure recovery denial reason preserved"
);


// ============================================================
// BOUNDARY VERIFICATION
// ============================================================

assert(
  !("providerOperationExecuted" in completed),
  "orchestrator does not execute provider operations"
);

assert(
  !("kmsCalled" in completed),
  "orchestrator does not call KMS"
);

assert(
  !("vaultCalled" in completed),
  "orchestrator does not call Vault"
);

assert(
  !("hsmCalled" in completed),
  "orchestrator does not call HSM"
);

assert(
  !("cloudProviderSelected" in completed),
  "orchestrator does not select cloud providers"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "P9G KEY ROTATION ORCHESTRATOR"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Happy Path:"
);

console.log(
  "✓ governance authorized"
);

console.log(
  "✓ governance evidence generated"
);

console.log(
  "✓ governance ledger recorded"
);

console.log(
  "✓ governance audit passed"
);

console.log(
  "✓ mechanism executed"
);

console.log(
  "✓ mechanism verified"
);

console.log(
  "✓ infrastructure provisioning authorized"
);

console.log(
  "✓ infrastructure access granted"
);

console.log(
  "✓ infrastructure usage authorized"
);

console.log(
  "✓ infrastructure recovery authorized"
);

console.log(
  "✓ orchestration completed"
);

console.log("");

console.log(
  "Contract Propagation:"
);

console.log(
  "✓ governance evidence propagated"
);

console.log(
  "✓ governance ledger propagated"
);

console.log(
  "✓ mechanism execution propagated"
);

console.log(
  "✓ infrastructure context propagated"
);

console.log(
  "✓ infrastructure class propagated"
);

console.log(
  "✓ policy validation propagated"
);

console.log(
  "✓ resource compatibility propagated"
);

console.log("");

console.log(
  "Summary Composition:"
);

console.log(
  "✓ governance summary propagated"
);

console.log(
  "✓ mechanism summary propagated"
);

console.log(
  "✓ infrastructure summary propagated"
);

console.log("");

console.log(
  "Denial Paths:"
);

console.log(
  "✓ governance denial"
);

console.log(
  "✓ mechanism execution denial"
);

console.log(
  "✓ infrastructure provisioning denial"
);

console.log(
  "✓ infrastructure access denial"
);

console.log(
  "✓ infrastructure usage denial"
);

console.log(
  "✓ infrastructure recovery denial"
);

console.log("");

console.log(
  "Boundary Verification:"
);

console.log(
  "✓ orchestrator does not execute provider operations"
);

console.log(
  "✓ orchestrator does not call KMS"
);

console.log(
  "✓ orchestrator does not call Vault"
);

console.log(
  "✓ orchestrator does not call HSM"
);

console.log(
  "✓ orchestrator does not select cloud providers"
);

console.log("");

console.log(
  "================================"
);

console.log(
  "KEY ROTATION ORCHESTRATOR VERIFIED"
);

console.log(
  "================================"
);