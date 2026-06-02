// ============================================================
// PlannerAgent — Recovery Governance Evidence Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/recovery/__tests__/governance.recovery.evidence.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL TEST RUNNER
//
// PURPOSE
// ------------------------------------------------------------
// Verify recovery governance evidence generation.
//
// ============================================================

import {
  buildRecoveryGovernanceEvidence,
} from "../governance.recovery.evidence.runtime";

import type {
  RecoveryDecision,
} from "../governance.recovery.types";

// ============================================================
// Helpers
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
// Test Data
// ============================================================

const baseDecision: RecoveryDecision = {

  status:
    "ALLOWED",

  domain:
    "TECHNICAL_SNAPSHOT",

  classification:
    "OPERATIONAL",

  recoveryAllowed:
    true,

  authorityReconstructionRequired:
    false,

  recoveredDataAuthoritative:
    true,

  humanApprovalRequired:
    false,

  governanceEvidenceRequired:
    true,

  ledgerRecordRequired:
    true,

  reason:
    "technical snapshot recovery permitted",

  summary: [
    "technical_snapshot",
    "recovery_allowed",
  ],
};

// ============================================================
// Tests
// ============================================================

console.log("");
console.log("================================");
console.log("RECOVERY GOVERNANCE EVIDENCE");
console.log("================================");
console.log("");

// ------------------------------------------------------------
// TEST 1
// ALLOWED
// ------------------------------------------------------------

const allowedEvidence =
  buildRecoveryGovernanceEvidence({
    evidenceId:
      "evidence-001",

    tenantId:
      "tenant-001",

    decision:
      baseDecision,

    createdAt:
      "2026-06-01T00:00:00Z",
  });

assert(
  allowedEvidence.evidenceType ===
    "RECOVERY_ALLOWED",
  "recovery allowed evidence generated"
);

// ------------------------------------------------------------
// TEST 2
// DENIED
// ------------------------------------------------------------

const deniedEvidence =
  buildRecoveryGovernanceEvidence({
    evidenceId:
      "evidence-002",

    tenantId:
      "tenant-001",

    decision: {
      ...baseDecision,

      status:
        "DENIED",

      recoveryAllowed:
        false,

      reason:
        "charter recovery denied",
    },

    createdAt:
      "2026-06-01T00:00:00Z",
  });

assert(
  deniedEvidence.evidenceType ===
    "RECOVERY_DENIED",
  "recovery denied evidence generated"
);

// ------------------------------------------------------------
// TEST 3
// APPROVAL REQUIRED
// ------------------------------------------------------------

const approvalEvidence =
  buildRecoveryGovernanceEvidence({
    evidenceId:
      "evidence-003",

    tenantId:
      "tenant-001",

    decision: {
      ...baseDecision,

      status:
        "APPROVAL_REQUIRED",

      humanApprovalRequired:
        true,

      reason:
        "approval required",
    },

    createdAt:
      "2026-06-01T00:00:00Z",
  });

assert(
  approvalEvidence.evidenceType ===
    "RECOVERY_APPROVAL_REQUIRED",
  "approval required evidence generated"
);

// ------------------------------------------------------------
// TEST 4
// AUTHORITY RECONSTRUCTION
// ------------------------------------------------------------

const authorityEvidence =
  buildRecoveryGovernanceEvidence({
    evidenceId:
      "evidence-004",

    tenantId:
      "tenant-001",

    decision: {
      ...baseDecision,

      domain:
        "GOVERNANCE",

      classification:
        "GOVERNANCE",

      authorityReconstructionRequired:
        true,

      recoveredDataAuthoritative:
        false,

      reason:
        "authority reconstruction required",
    },

    createdAt:
      "2026-06-01T00:00:00Z",
  });

assert(
  authorityEvidence.evidenceType ===
    "AUTHORITY_RECONSTRUCTION_REQUIRED",
  "authority reconstruction evidence generated"
);

// ------------------------------------------------------------
// TEST 5
// REASON PRESERVED
// ------------------------------------------------------------

assert(
  authorityEvidence.reason ===
    "authority reconstruction required",
  "decision reason preserved"
);

// ------------------------------------------------------------
// TEST 6
// SUMMARY PRESERVED
// ------------------------------------------------------------

assert(
  authorityEvidence.summary.length > 0,
  "decision summary preserved"
);

// ------------------------------------------------------------
// TEST 7
// CLASSIFICATION PRESERVED
// ------------------------------------------------------------

assert(
  authorityEvidence.classification ===
    "GOVERNANCE",
  "classification preserved"
);

// ------------------------------------------------------------
// TEST 8
// DOMAIN PRESERVED
// ------------------------------------------------------------

assert(
  authorityEvidence.domain ===
    "GOVERNANCE",
  "domain preserved"
);

console.log("");
console.log("================================");
console.log("RECOVERY EVIDENCE VERIFIED");
console.log("================================");
console.log("");