//core/src/cryptography/governance/__tests__/P9F.key.rotation.governance.ledger.runner.ts

// ============================================================
// PlannerAgent
// Key Rotation Governance Ledger Runner
// ============================================================

import {
  recordKeyRotationGovernanceEvidence,
} from "../P9F.key.rotation.governance.ledger";

import {
  generateKeyRotationGovernanceEvidence,
} from "../P9F.key.rotation.governance.evidence";

import {
  evaluateKeyRotationGovernance,
} from "../P9F.key.rotation.governance.runtime";


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
// TEST DECISION
// ============================================================

const decision =
  evaluateKeyRotationGovernance({

    authority:
      "PRIMARY_AUTHORITY",

    trigger:
      "KEY_COMPROMISE",

  });


// ============================================================
// TEST EVIDENCE
// ============================================================

const evidence =
  generateKeyRotationGovernanceEvidence({

    evidenceId:
      "evidence-key-rotation-001",

    generatedAt:
      "2026-01-01T00:00:00.000Z",

    decision,

  });


// ============================================================
// TEST LEDGER RECORD
// ============================================================

const ledgerRecord =
  recordKeyRotationGovernanceEvidence({

    ledgerRecordId:
      "ledger-key-rotation-001",

    recordedAt:
      "2026-01-01T00:01:00.000Z",

    evidence,

  });


// ============================================================
// TEST 1
// Ledger record created
// ============================================================

assert(
  ledgerRecord.ledgerStatus ===
    "LEDGER_RECORD_CREATED",
  "ledger record created"
);


// ============================================================
// TEST 2
// Ledger record ID preserved
// ============================================================

assert(
  ledgerRecord.ledgerRecordId ===
    "ledger-key-rotation-001",
  "ledgerRecordId preserved"
);


// ============================================================
// TEST 3
// Recorded timestamp preserved
// ============================================================

assert(
  ledgerRecord.recordedAt ===
    "2026-01-01T00:01:00.000Z",
  "recordedAt preserved"
);


// ============================================================
// TEST 4
// Evidence ID preserved
// ============================================================

assert(
  ledgerRecord.evidenceId ===
    evidence.evidenceId,
  "evidenceId preserved"
);


// ============================================================
// TEST 5
// Evidence generatedAt preserved
// ============================================================

assert(
  ledgerRecord.evidenceGeneratedAt ===
    evidence.generatedAt,
  "evidence generatedAt preserved"
);


// ============================================================
// TEST 6
// Evidence status preserved
// ============================================================

assert(
  ledgerRecord.evidenceStatus ===
    evidence.evidenceStatus,
  "evidenceStatus preserved"
);


// ============================================================
// TEST 7
// Decision status preserved
// ============================================================

assert(
  ledgerRecord.decisionStatus ===
    evidence.decisionStatus,
  "decisionStatus preserved"
);


// ============================================================
// TEST 8
// Decision code preserved
// ============================================================

assert(
  ledgerRecord.decisionCode ===
    evidence.decisionCode,
  "decisionCode preserved"
);


// ============================================================
// TEST 9
// Authority validation preserved
// ============================================================

assert(
  ledgerRecord.authorityValidated ===
    evidence.authorityValidated,
  "authorityValidated preserved"
);


// ============================================================
// TEST 10
// Trigger validation preserved
// ============================================================

assert(
  ledgerRecord.triggerValidated ===
    evidence.triggerValidated,
  "triggerValidated preserved"
);


// ============================================================
// TEST 11
// Denial reason preserved
// ============================================================

assert(
  ledgerRecord.denialReason ===
    evidence.denialReason,
  "denialReason preserved"
);


// ============================================================
// TEST 12
// Evidence summary preserved
// ============================================================

assert(
  ledgerRecord.evidenceSummary.join("|") ===
    evidence.summary.join("|"),
  "evidence summary preserved"
);


// ============================================================
// TEST 13
// Ledger marker added
// ============================================================

assert(
  ledgerRecord.summary.includes(
    "ledger_record_created"
  ),
  "ledger marker added"
);


// ============================================================
// TEST 14
// Ledger does not decide
// ============================================================

assert(
  !("decisionEvaluated" in ledgerRecord),
  "ledger does not decide"
);


// ============================================================
// TEST 15
// Ledger does not generate evidence
// ============================================================

assert(
  !("evidenceGenerated" in ledgerRecord),
  "ledger does not generate evidence"
);


// ============================================================
// TEST 16
// Ledger does not execute rotation
// ============================================================

assert(
  !("rotationExecuted" in ledgerRecord),
  "ledger does not execute rotation"
);


// ============================================================
// TEST 17
// Ledger does not audit
// ============================================================

assert(
  !("auditPerformed" in ledgerRecord),
  "ledger does not audit"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "KEY ROTATION GOVERNANCE LEDGER"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Ledger:"
);

console.log(
  "✓ ledgerRecordId preserved"
);

console.log(
  "✓ recordedAt preserved"
);

console.log(
  "✓ evidenceId preserved"
);

console.log(
  "✓ evidence generatedAt preserved"
);

console.log(
  "✓ evidenceStatus preserved"
);

console.log(
  "✓ decisionStatus preserved"
);

console.log(
  "✓ decisionCode preserved"
);

console.log(
  "✓ authorityValidated preserved"
);

console.log(
  "✓ triggerValidated preserved"
);

console.log(
  "✓ denialReason preserved"
);

console.log(
  "✓ evidence summary preserved"
);

console.log(
  "✓ ledger marker added"
);

console.log("");

console.log(
  "Boundary Verification:"
);

console.log(
  "✓ ledger does not decide"
);

console.log(
  "✓ ledger does not generate evidence"
);

console.log(
  "✓ ledger does not execute rotation"
);

console.log(
  "✓ ledger does not audit"
);

console.log("");

console.log(
  "================================"
);

console.log(
  "LEDGER VERIFIED"
);

console.log(
  "================================"
);