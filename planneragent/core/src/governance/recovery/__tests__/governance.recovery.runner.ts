// ============================================================
// PlannerAgent — Recovery Governance Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/recovery/__tests__/governance.recovery.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL TEST RUNNER
//
// ============================================================

import {
  evaluateRecoveryRequest,
} from "../governance.recovery.runtime";

import {
  buildRecoveryGovernanceEvidence,
} from "../governance.recovery.evidence.runtime";

function assert(
  condition: boolean,
  label: string
): void {

  if (!condition) {
    throw new Error(
      `FAILED: ${label}`
    );
  }

  console.log(`✅ ${label}`);
}

const tenantId =
  "tenant-001";

const requestedBy =
  "system";

const approverId =
  "approver-001";

const requestedAt =
  "2026-06-01T00:00:00Z";

console.log("");
console.log("================================");
console.log("RECOVERY GOVERNANCE AUDIT");
console.log("================================");
console.log("");

// ============================================================
// TEST 1
// TECHNICAL SNAPSHOT
// ============================================================

const technicalDecision =
  evaluateRecoveryRequest({

    tenantId,

    domain:
      "TECHNICAL_SNAPSHOT",

    requestedBy,

    requestedAt,

    reason:
      "technical recovery",

  });

const technicalEvidence =
  buildRecoveryGovernanceEvidence({

    evidenceId:
      "evidence-tech",

    tenantId,

    decision:
      technicalDecision,

    createdAt:
      requestedAt,

  });

assert(
  technicalDecision.recoveryAllowed,
  "technical snapshot recovery allowed"
);

assert(
  technicalDecision.recoveredDataAuthoritative,
  "technical snapshot authoritative"
);

assert(
  technicalEvidence.evidenceType ===
    "RECOVERY_ALLOWED",
  "technical snapshot evidence generated"
);

// ============================================================
// TEST 2
// OPERATIONAL SNAPSHOT
// ============================================================

const operationalDecision =
  evaluateRecoveryRequest({

    tenantId,

    domain:
      "OPERATIONAL_SNAPSHOT",

    requestedBy,

    approverId,

    requestedAt,

    reason:
      "operational recovery",

  });

const operationalEvidence =
  buildRecoveryGovernanceEvidence({

    evidenceId:
      "evidence-operational",

    tenantId,

    decision:
      operationalDecision,

    createdAt:
      requestedAt,

  });

assert(
  operationalDecision.recoveryAllowed,
  "operational snapshot recovery allowed"
);

assert(
  operationalDecision
    .recoveredDataAuthoritative === false,
  "operational snapshot non-authoritative"
);

assert(
  operationalEvidence.evidenceType ===
    "RECOVERY_ALLOWED",
  "operational snapshot evidence generated"
);

// ============================================================
// TEST 3
// OPERATIONAL SNAPSHOT APPROVAL REQUIRED
// ============================================================

const approvalDecision =
  evaluateRecoveryRequest({

    tenantId,

    domain:
      "OPERATIONAL_SNAPSHOT",

    requestedBy,

    requestedAt,

    reason:
      "operational recovery without approval",

  });

const approvalEvidence =
  buildRecoveryGovernanceEvidence({

    evidenceId:
      "evidence-approval",

    tenantId,

    decision:
      approvalDecision,

    createdAt:
      requestedAt,

  });

assert(
  approvalDecision.status ===
    "APPROVAL_REQUIRED",
  "operational snapshot requires approval without approver"
);

assert(
  approvalEvidence.evidenceType ===
    "RECOVERY_APPROVAL_REQUIRED",
  "approval required evidence generated"
);

// ============================================================
// TEST 4
// GOVERNANCE
// ============================================================

const governanceDecision =
  evaluateRecoveryRequest({

    tenantId,

    domain:
      "GOVERNANCE",

    requestedBy,

    approverId,

    requestedAt,

    reason:
      "governance recovery",

  });

const governanceEvidence =
  buildRecoveryGovernanceEvidence({

    evidenceId:
      "evidence-governance",

    tenantId,

    decision:
      governanceDecision,

    createdAt:
      requestedAt,

  });

assert(
  governanceDecision
    .authorityReconstructionRequired,
  "governance recovery requires authority reconstruction"
);

assert(
  governanceDecision
    .recoveredDataAuthoritative === false,
  "governance recovery is non-authoritative"
);

assert(
  governanceEvidence.evidenceType ===
    "AUTHORITY_RECONSTRUCTION_REQUIRED",
  "governance authority reconstruction evidence generated"
);

// ============================================================
// TEST 5
// OAG
// ============================================================

const oagDecision =
  evaluateRecoveryRequest({

    tenantId,

    domain:
      "OAG",

    requestedBy,

    approverId,

    requestedAt,

    reason:
      "oag recovery",

  });

const oagEvidence =
  buildRecoveryGovernanceEvidence({

    evidenceId:
      "evidence-oag",

    tenantId,

    decision:
      oagDecision,

    createdAt:
      requestedAt,

  });

assert(
  oagDecision
    .authorityReconstructionRequired,
  "oag recovery requires authority reconstruction"
);

assert(
  oagDecision
    .recoveredDataAuthoritative === false,
  "oag recovery is non-authoritative"
);

assert(
  oagEvidence.evidenceType ===
    "AUTHORITY_RECONSTRUCTION_REQUIRED",
  "oag authority reconstruction evidence generated"
);

// ============================================================
// TEST 6
// CHARTER
// ============================================================

const charterDecision =
  evaluateRecoveryRequest({

    tenantId,

    domain:
      "CHARTER",

    requestedBy,

    requestedAt,

    reason:
      "charter recovery",

  });

const charterEvidence =
  buildRecoveryGovernanceEvidence({

    evidenceId:
      "evidence-charter",

    tenantId,

    decision:
      charterDecision,

    createdAt:
      requestedAt,

  });

assert(
  !charterDecision.recoveryAllowed,
  "charter recovery denied"
);

assert(
  charterEvidence.evidenceType ===
    "RECOVERY_DENIED",
  "charter denial evidence generated"
);

// ============================================================
// TEST 7
// EVIDENCE REQUIRED
// ============================================================

assert(
  technicalDecision
    .governanceEvidenceRequired,
  "recovery decisions require evidence"
);

// ============================================================
// TEST 8
// LEDGER REQUIRED
// ============================================================

assert(
  technicalDecision
    .ledgerRecordRequired,
  "recovery decisions require ledger record"
);

console.log("");
console.log("================================");
console.log("RECOVERY GOVERNANCE VERIFIED");
console.log("================================");
console.log("");