//core/src/cryptography/governance/__tests__/P9F.key.rotation.governance.audit.runner.ts

// ============================================================
// PlannerAgent
// Key Rotation Governance Audit Runner
// ============================================================

import {
  auditKeyRotationGovernanceLedger,
} from "../P9F.key.rotation.governance.audit";

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
// TEST CHAIN
// ============================================================

const decision =
  evaluateKeyRotationGovernance({

    authority:
      "PRIMARY_AUTHORITY",

    trigger:
      "KEY_COMPROMISE",

  });

const evidence =
  generateKeyRotationGovernanceEvidence({

    evidenceId:
      "evidence-key-rotation-001",

    generatedAt:
      "2026-01-01T00:00:00.000Z",

    decision,

  });

const ledgerRecord =
  recordKeyRotationGovernanceEvidence({

    ledgerRecordId:
      "ledger-key-rotation-001",

    recordedAt:
      "2026-01-01T00:01:00.000Z",

    evidence,

  });

const auditResult =
  auditKeyRotationGovernanceLedger({

    auditId:
      "audit-key-rotation-001",

    auditedAt:
      "2026-01-01T00:02:00.000Z",

    ledgerRecord,

  });


// ============================================================
// TEST 1
// Audit passed
// ============================================================

assert(
  auditResult.auditStatus ===
    "AUDIT_PASSED",
  "audit passed"
);


// ============================================================
// TEST 2
// Audit ID preserved
// ============================================================

assert(
  auditResult.auditId ===
    "audit-key-rotation-001",
  "auditId preserved"
);


// ============================================================
// TEST 3
// Audited timestamp preserved
// ============================================================

assert(
  auditResult.auditedAt ===
    "2026-01-01T00:02:00.000Z",
  "auditedAt preserved"
);


// ============================================================
// TEST 4
// Ledger record ID preserved
// ============================================================

assert(
  auditResult.ledgerRecordId ===
    ledgerRecord.ledgerRecordId,
  "ledgerRecordId preserved"
);


// ============================================================
// TEST 5
// Evidence ID preserved
// ============================================================

assert(
  auditResult.evidenceId ===
    ledgerRecord.evidenceId,
  "evidenceId preserved"
);


// ============================================================
// TEST 6
// Audit summary preserved
// ============================================================

assert(
  auditResult.summary.includes(
    "audit_passed"
  ),
  "audit summary preserved"
);


// ============================================================
// TEST 7
// Missing ledger record denied
// ============================================================

const missingLedgerAudit =
  auditKeyRotationGovernanceLedger({

    auditId:
      "audit-missing-ledger-001",

    auditedAt:
      "2026-01-01T00:03:00.000Z",

  });

assert(
  missingLedgerAudit.auditStatus ===
    "AUDIT_FAILED",
  "missing ledger record denied"
);

assert(
  missingLedgerAudit.failureReason ===
    "LEDGER_RECORD_MISSING",
  "missing ledger failure reason preserved"
);


// ============================================================
// TEST 8
// Missing evidenceId denied
// ============================================================

const missingEvidenceIdAudit =
  auditKeyRotationGovernanceLedger({

    auditId:
      "audit-missing-evidence-id-001",

    auditedAt:
      "2026-01-01T00:04:00.000Z",

    ledgerRecord: {
      ...ledgerRecord,
      evidenceId:
        "",
    },

  });

assert(
  missingEvidenceIdAudit.auditStatus ===
    "AUDIT_FAILED",
  "missing evidenceId denied"
);

assert(
  missingEvidenceIdAudit.failureReason ===
    "EVIDENCE_ID_MISSING",
  "missing evidenceId failure reason preserved"
);


// ============================================================
// TEST 9
// Missing evidenceStatus denied
// ============================================================

const missingEvidenceStatusAudit =
  auditKeyRotationGovernanceLedger({

    auditId:
      "audit-missing-evidence-status-001",

    auditedAt:
      "2026-01-01T00:05:00.000Z",

    ledgerRecord: {
      ...ledgerRecord,
      evidenceStatus:
        "" as never,
    },

  });

assert(
  missingEvidenceStatusAudit.auditStatus ===
    "AUDIT_FAILED",
  "missing evidenceStatus denied"
);

assert(
  missingEvidenceStatusAudit.failureReason ===
    "EVIDENCE_STATUS_MISSING",
  "missing evidenceStatus failure reason preserved"
);


// ============================================================
// TEST 10
// Missing decisionStatus denied
// ============================================================

const missingDecisionStatusAudit =
  auditKeyRotationGovernanceLedger({

    auditId:
      "audit-missing-decision-status-001",

    auditedAt:
      "2026-01-01T00:06:00.000Z",

    ledgerRecord: {
      ...ledgerRecord,
      decisionStatus:
        "" as never,
    },

  });

assert(
  missingDecisionStatusAudit.auditStatus ===
    "AUDIT_FAILED",
  "missing decisionStatus denied"
);

assert(
  missingDecisionStatusAudit.failureReason ===
    "DECISION_STATUS_MISSING",
  "missing decisionStatus failure reason preserved"
);


// ============================================================
// TEST 11
// Missing decisionCode denied
// ============================================================

const missingDecisionCodeAudit =
  auditKeyRotationGovernanceLedger({

    auditId:
      "audit-missing-decision-code-001",

    auditedAt:
      "2026-01-01T00:07:00.000Z",

    ledgerRecord: {
      ...ledgerRecord,
      decisionCode:
        "" as never,
    },

  });

assert(
  missingDecisionCodeAudit.auditStatus ===
    "AUDIT_FAILED",
  "missing decisionCode denied"
);

assert(
  missingDecisionCodeAudit.failureReason ===
    "DECISION_CODE_MISSING",
  "missing decisionCode failure reason preserved"
);


// ============================================================
// TEST 12
// Missing ledger marker denied
// ============================================================

const missingLedgerMarkerAudit =
  auditKeyRotationGovernanceLedger({

    auditId:
      "audit-missing-ledger-marker-001",

    auditedAt:
      "2026-01-01T00:08:00.000Z",

    ledgerRecord: {
      ...ledgerRecord,
      summary:
        ledgerRecord.summary.filter(
          item =>
            item !== "ledger_record_created"
        ),
    },

  });

assert(
  missingLedgerMarkerAudit.auditStatus ===
    "AUDIT_FAILED",
  "missing ledger marker denied"
);

assert(
  missingLedgerMarkerAudit.failureReason ===
    "LEDGER_MARKER_MISSING",
  "missing ledger marker failure reason preserved"
);


// ============================================================
// TEST 13
// Audit does not decide
// ============================================================

assert(
  !("decisionEvaluated" in auditResult),
  "audit does not decide"
);


// ============================================================
// TEST 14
// Audit does not generate evidence
// ============================================================

assert(
  !("evidenceGenerated" in auditResult),
  "audit does not generate evidence"
);


// ============================================================
// TEST 15
// Audit does not write ledger
// ============================================================

assert(
  !("ledgerWritten" in auditResult),
  "audit does not write ledger"
);


// ============================================================
// TEST 16
// Audit does not execute rotation
// ============================================================

assert(
  !("rotationExecuted" in auditResult),
  "audit does not execute rotation"
);


// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
  "================================"
);

console.log(
  "KEY ROTATION GOVERNANCE AUDIT"
);

console.log(
  "================================"
);

console.log("");

console.log(
  "Audit:"
);

console.log(
  "✓ auditId preserved"
);

console.log(
  "✓ auditedAt preserved"
);

console.log(
  "✓ ledgerRecordId preserved"
);

console.log(
  "✓ evidenceId preserved"
);

console.log(
  "✓ audit summary preserved"
);

console.log("");

console.log(
  "Failure Paths:"
);

console.log(
  "✓ missing ledger record denied"
);

console.log(
  "✓ missing evidenceId denied"
);

console.log(
  "✓ missing evidenceStatus denied"
);

console.log(
  "✓ missing decisionStatus denied"
);

console.log(
  "✓ missing decisionCode denied"
);

console.log(
  "✓ missing ledger marker denied"
);

console.log("");

console.log(
  "Boundary Verification:"
);

console.log(
  "✓ audit does not decide"
);

console.log(
  "✓ audit does not generate evidence"
);

console.log(
  "✓ audit does not write ledger"
);

console.log(
  "✓ audit does not execute rotation"
);

console.log("");

console.log(
  "================================"
);

console.log(
  "AUDIT VERIFIED"
);

console.log(
  "================================"
);
