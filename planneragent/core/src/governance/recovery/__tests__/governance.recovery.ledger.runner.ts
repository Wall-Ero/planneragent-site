// ============================================================
// PlannerAgent — Recovery Governance Ledger Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/recovery/__tests__/governance.recovery.ledger.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL TEST RUNNER
//
// PURPOSE
// ------------------------------------------------------------
// Verify that recovery governance evidence
// is successfully translated into
// governance ledger records.
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Verify continuity of responsibility history.
//
// Recovery Evidence
// ↓
// Governance Ledger Record
//
// Nothing else.
//
// ============================================================

import {
  evaluateRecoveryRequest,
} from "../governance.recovery.runtime";

import {
  buildRecoveryGovernanceEvidence,
} from "../governance.recovery.evidence.runtime";

import {
  buildGovernanceLedgerRecordFromRecoveryEvidence,
} from "../governance.recovery.ledger.runtime";

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

console.log("");
console.log("================================");
console.log("RECOVERY GOVERNANCE LEDGER AUDIT");
console.log("================================");
console.log("");

// ============================================================
// TEST 1
// TECHNICAL SNAPSHOT
// ============================================================

const technicalDecision =
  evaluateRecoveryRequest({
    tenantId: "tenant-001",
    domain: "TECHNICAL_SNAPSHOT",
    requestedBy: "system",
    requestedAt:
      "2026-06-01T00:00:00Z",
    reason:
      "technical recovery",
  });

const technicalEvidence =
  buildRecoveryGovernanceEvidence({
    evidenceId:
      "evidence-tech",
    tenantId:
      "tenant-001",
    decision:
      technicalDecision,
    createdAt:
      "2026-06-01T00:00:00Z",
  });

const technicalLedger =
  buildGovernanceLedgerRecordFromRecoveryEvidence({
    ledgerRecordId:
      "ledger-tech",
    evidence:
      technicalEvidence,
    createdAt:
      "2026-06-01T00:00:00Z",
  });

assert(
  technicalLedger.recordType ===
    "RECOVERY_ALLOWED",
  "technical recovery preserved"
);

// ============================================================
// TEST 2
// GOVERNANCE
// ============================================================

const governanceDecision =
  evaluateRecoveryRequest({
    tenantId: "tenant-001",
    domain: "GOVERNANCE",
    requestedBy: "system",
    requestedAt:
      "2026-06-01T00:00:00Z",
    reason:
      "governance recovery",
  });

const governanceEvidence =
  buildRecoveryGovernanceEvidence({
    evidenceId:
      "evidence-governance",
    tenantId:
      "tenant-001",
    decision:
      governanceDecision,
    createdAt:
      "2026-06-01T00:00:00Z",
  });

const governanceLedger =
  buildGovernanceLedgerRecordFromRecoveryEvidence({
    ledgerRecordId:
      "ledger-governance",
    evidence:
      governanceEvidence,
    createdAt:
      "2026-06-01T00:00:00Z",
  });

assert(
  governanceLedger
    .authorityReconstructionRequired,
  "governance authority reconstruction preserved"
);

// ============================================================
// TEST 3
// CHARTER
// ============================================================

const charterDecision =
  evaluateRecoveryRequest({
    tenantId: "tenant-001",
    domain: "CHARTER",
    requestedBy: "system",
    requestedAt:
      "2026-06-01T00:00:00Z",
    reason:
      "charter recovery",
  });

const charterEvidence =
  buildRecoveryGovernanceEvidence({
    evidenceId:
      "evidence-charter",
    tenantId:
      "tenant-001",
    decision:
      charterDecision,
    createdAt:
      "2026-06-01T00:00:00Z",
  });

const charterLedger =
  buildGovernanceLedgerRecordFromRecoveryEvidence({
    ledgerRecordId:
      "ledger-charter",
    evidence:
      charterEvidence,
    createdAt:
      "2026-06-01T00:00:00Z",
  });

assert(
  charterLedger.recordType ===
    "RECOVERY_DENIED",
  "charter denial preserved"
);

// ============================================================
// CROSS-CHECKS
// ============================================================

assert(
  technicalLedger.sourceEvidenceId ===
    technicalEvidence.evidenceId,
  "source evidence id preserved"
);

assert(
  governanceLedger.decisionStatus ===
    governanceEvidence.decisionStatus,
  "decision status preserved"
);

assert(
  technicalLedger.summary.length > 0 &&
  governanceLedger.summary.length > 0 &&
  charterLedger.summary.length > 0,
  "governance responsibility history preserved"
);

assert(
  technicalLedger.recordType !== undefined &&
  governanceLedger.recordType !== undefined &&
  charterLedger.recordType !== undefined,
  "recovery evidence translated to governance ledger record"
);

console.log("");
console.log("================================");
console.log("RECOVERY LEDGER VERIFIED");
console.log("================================");
console.log("");