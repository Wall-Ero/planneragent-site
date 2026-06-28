//core/src/cryptography/governance/__tests__/P9F.key.rotation.governance.evidence.runner.ts

// ============================================================
// PlannerAgent
// Key Rotation Governance Evidence Runner
// ============================================================

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
// TEST 1
// Evidence generated
// ============================================================

assert(
  evidence.evidenceStatus ===
    "EVIDENCE_GENERATED",
  "evidence generated"
);


// ============================================================
// TEST 2
// Evidence ID preserved
// ============================================================

assert(
  evidence.evidenceId ===
    "evidence-key-rotation-001",
  "evidenceId preserved"
);


// ============================================================
// TEST 3
// Generated timestamp preserved
// ============================================================

assert(
  evidence.generatedAt ===
    "2026-01-01T00:00:00.000Z",
  "generatedAt preserved"
);


// ============================================================
// TEST 4
// Decision status preserved
// ============================================================

assert(
  evidence.decisionStatus ===
    decision.decisionStatus,
  "decisionStatus preserved"
);


// ============================================================
// TEST 5
// Decision code preserved
// ============================================================

assert(
  evidence.decisionCode ===
    decision.decisionCode,
  "decisionCode preserved"
);


// ============================================================
// TEST 6
// Authority validation preserved
// ============================================================

assert(
  evidence.authorityValidated ===
    decision.authorityValidated,
  "authorityValidated preserved"
);


// ============================================================
// TEST 7
// Trigger validation preserved
// ============================================================

assert(
  evidence.triggerValidated ===
    decision.triggerValidated,
  "triggerValidated preserved"
);


// ============================================================
// TEST 8
// Denial reason preserved
// ============================================================

assert(
  evidence.denialReason ===
    decision.denialReason,
  "denialReason preserved"
);


// ============================================================
// TEST 9
// Decision summary preserved
// ============================================================

assert(
  evidence.decisionSummary.join("|") ===
    decision.summary.join("|"),
  "decision summary preserved"
);


// ============================================================
// TEST 10
// Evidence marker added
// ============================================================

assert(
  evidence.summary.includes(
    "evidence_generated"
  ),
  "evidence marker added"
);


// ============================================================
// TEST 11
// Evidence does not decide
// ============================================================

assert(
  !("evaluateKeyRotationGovernance" in evidence),
  "evidence does not decide"
);


// ============================================================
// TEST 12
// Evidence does not execute rotation
// ============================================================

assert(
  !("rotationExecuted" in evidence),
  "evidence does not execute rotation"
);


// ============================================================
// TEST 13
// Evidence does not write ledger
// ============================================================

assert(
  !("ledgerRecordId" in evidence),
  "evidence does not write ledger"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "KEY ROTATION GOVERNANCE EVIDENCE"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Evidence:"
);

console.log(
  "✓ evidenceId preserved"
);

console.log(
  "✓ generatedAt preserved"
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
  "✓ decision summary preserved"
);

console.log(
  "✓ evidence marker added"
);

console.log("");

console.log(
  "Boundary Verification:"
);

console.log(
  "✓ evidence does not decide"
);

console.log(
  "✓ evidence does not execute rotation"
);

console.log(
  "✓ evidence does not write ledger"
);

console.log("");

console.log(
  "================================"
);

console.log(
  "EVIDENCE VERIFIED"
);

console.log(
  "================================"
);