//core/src/cryptography/governance/__tests__/cryptography.key.governance.audit.runner.ts

// ============================================================
// PlannerAgent — Key Governance Audit Runner
// ============================================================

import {
  auditKeyGovernanceContinuity,
} from "../cryptography.key.governance.audit";

import type {
  KeyGovernanceEvidence,
} from "../cryptography.key.governance.evidence";

import type {
  KeyGovernanceLedgerRecord,
} from "../cryptography.key.governance.ledger";


// ============================================================
// ASSERT
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
// AUDIT
// ============================================================

console.log("");
console.log("================================");
console.log("KEY GOVERNANCE AUDIT AUDIT");
console.log("================================");
console.log("");


// ============================================================
// TEST DATA
// ============================================================

const evidence: KeyGovernanceEvidence = {

  evidenceId:
    "EVIDENCE-001",

  operation:
    "CREATE_KEY",

  decisionStatus:
    "ALLOWED",

  authorityValidated:
    true,

  lifecycleValidated:
    true,

  approvalValidated:
    true,

  governanceEvidenceRequired:
    true,

  ledgerRecordRequired:
    true,

  cryptographicAuditRequired:
    true,

  residualRiskOwner:
    "AUTHORITY_OWNER",

  reason:
    "Operation permitted under governance policy.",

  summary: [
    "create_key",
    "operation_allowed",
    "key_governance_evidence",
  ],

};

const ledger: KeyGovernanceLedgerRecord = {

  ledgerId:
    "LEDGER-001",

  evidenceId:
    "EVIDENCE-001",

  operation:
    "CREATE_KEY",

  decisionStatus:
    "ALLOWED",

  authorityValidated:
    true,

  lifecycleValidated:
    true,

  approvalValidated:
    true,

  governanceEvidenceRequired:
    true,

  ledgerRecordRequired:
    true,

  cryptographicAuditRequired:
    true,

  residualRiskOwner:
    "AUTHORITY_OWNER",

  reason:
    "Operation permitted under governance policy.",

  summary: [
    "create_key",
    "operation_allowed",
    "key_governance_evidence",
    "key_governance_ledger_record",
  ],

};


// ============================================================
// TEST 1
// CONTINUITY VERIFIED
// ============================================================

const verified =
  auditKeyGovernanceContinuity(
    evidence,
    ledger
  );

assert(
  verified.status ===
    "VERIFIED",

  "continuity verified"
);

assert(
  verified.verified,

  "audit verified"
);


// ============================================================
// TEST 2
// EVIDENCE MISSING
// ============================================================

const missingEvidence =
  auditKeyGovernanceContinuity(
    undefined,
    ledger
  );

assert(
  missingEvidence.status ===
    "VIOLATION",

  "missing evidence violation"
);

assert(
  missingEvidence.violations.includes(
    "EVIDENCE_MISSING"
  ),

  "evidence missing detected"
);


// ============================================================
// TEST 3
// LEDGER MISSING
// ============================================================

const missingLedger =
  auditKeyGovernanceContinuity(
    evidence,
    undefined
  );

assert(
  missingLedger.status ===
    "VIOLATION",

  "missing ledger violation"
);

assert(
  missingLedger.violations.includes(
    "LEDGER_MISSING"
  ),

  "ledger missing detected"
);


// ============================================================
// TEST 4
// DECISION STATUS MISMATCH
// ============================================================

const mismatchLedger = {

  ...ledger,

  decisionStatus:
    "DENIED",

} as KeyGovernanceLedgerRecord;

const mismatch =
  auditKeyGovernanceContinuity(
    evidence,
    mismatchLedger
  );

assert(
  mismatch.status ===
    "VIOLATION",

  "decision mismatch violation"
);

assert(
  mismatch.violations.includes(
    "DECISION_STATUS_MISMATCH"
  ),

  "decision mismatch detected"
);


// ============================================================
// TEST 5
// RESIDUAL RISK OWNER MISMATCH
// ============================================================

const riskMismatchLedger = {

  ...ledger,

  residualRiskOwner:
    "APPROVAL_AUTHORITY",

} as KeyGovernanceLedgerRecord;

const riskMismatch =
  auditKeyGovernanceContinuity(
    evidence,
    riskMismatchLedger
  );

assert(
  riskMismatch.violations.includes(
    "RESIDUAL_RISK_OWNER_MISMATCH"
  ),

  "residual risk owner mismatch detected"
);


// ============================================================
// TEST 6
// SUMMARY CONTINUITY VERIFIED
// ============================================================

assert(
  verified.violations.length === 0,

  "summary continuity verified"
);


// ============================================================
// TEST 7
// AUDIT DOES NOT REPAIR
// ============================================================

assert(
  mismatch.status ===
    "VIOLATION",

  "audit identifies violation"
);

assert(
  !mismatch.verified,

  "audit does not repair violation"
);


// ============================================================
// VERIFIED
// ============================================================

console.log("");
console.log("================================");
console.log("KEY GOVERNANCE AUDIT VERIFIED");
console.log("================================");
console.log("");