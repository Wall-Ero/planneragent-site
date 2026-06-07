// ============================================================
// PlannerAgent — Key Governance Ledger Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/__tests__/
// cryptography.key.governance.ledger.runner.ts
//
// STATUS
// ------------------------------------------------------------
// TEST RUNNER
//
// ============================================================

import {
  createKeyGovernanceLedgerRecord,
} from "../cryptography.key.governance.ledger";

import type {
  KeyGovernanceEvidence,
} from "../cryptography.key.governance.evidence";


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
console.log("KEY GOVERNANCE LEDGER AUDIT");
console.log("================================");
console.log("");


// ============================================================
// TEST DATA
// ============================================================

const ledgerId =
  "LEDGER-001";

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


// ============================================================
// LEDGER RECORD
// ============================================================

const ledgerRecord =
  createKeyGovernanceLedgerRecord(

    ledgerId,

    evidence

  );


// ============================================================
// TEST 1
// LEDGER RECORD CREATED
// ============================================================

assert(

  !!ledgerRecord,

  "ledger record created"

);


// ============================================================
// TEST 2
// LEDGER ID PRESERVED
// ============================================================

assert(

  ledgerRecord.ledgerId ===
    ledgerId,

  "ledger id preserved"

);


// ============================================================
// TEST 3
// EVIDENCE ID PRESERVED
// ============================================================

assert(

  ledgerRecord.evidenceId ===
    evidence.evidenceId,

  "evidence id preserved"

);


// ============================================================
// TEST 4
// DECISION STATUS PRESERVED
// ============================================================

assert(

  ledgerRecord.decisionStatus ===
    evidence.decisionStatus,

  "decision status preserved"

);


// ============================================================
// TEST 5
// AUTHORITY VALIDATION PRESERVED
// ============================================================

assert(

  ledgerRecord.authorityValidated ===
    evidence.authorityValidated,

  "authority validation preserved"

);


// ============================================================
// TEST 6
// LIFECYCLE VALIDATION PRESERVED
// ============================================================

assert(

  ledgerRecord.lifecycleValidated ===
    evidence.lifecycleValidated,

  "lifecycle validation preserved"

);


// ============================================================
// TEST 7
// APPROVAL VALIDATION PRESERVED
// ============================================================

assert(

  ledgerRecord.approvalValidated ===
    evidence.approvalValidated,

  "approval validation preserved"

);


// ============================================================
// TEST 8
// RESIDUAL RISK OWNER PRESERVED
// ============================================================

assert(

  ledgerRecord.residualRiskOwner ===
    evidence.residualRiskOwner,

  "residual risk owner preserved"

);


// ============================================================
// TEST 9
// GOVERNANCE EVIDENCE REQUIREMENT PRESERVED
// ============================================================

assert(

  ledgerRecord.governanceEvidenceRequired ===
    evidence.governanceEvidenceRequired,

  "governance evidence requirement preserved"

);


// ============================================================
// TEST 10
// LEDGER REQUIREMENT PRESERVED
// ============================================================

assert(

  ledgerRecord.ledgerRecordRequired ===
    evidence.ledgerRecordRequired,

  "ledger requirement preserved"

);


// ============================================================
// TEST 11
// AUDIT REQUIREMENT PRESERVED
// ============================================================

assert(

  ledgerRecord.cryptographicAuditRequired ===
    evidence.cryptographicAuditRequired,

  "cryptographic audit requirement preserved"

);


// ============================================================
// TEST 12
// REASON PRESERVED
// ============================================================

assert(

  ledgerRecord.reason ===
    evidence.reason,

  "decision reason preserved"

);


// ============================================================
// TEST 13
// SUMMARY PRESERVED
// ============================================================

assert(

  ledgerRecord.summary.includes(
    "create_key"
  ),

  "summary preserved"

);


// ============================================================
// TEST 14
// LEDGER MARKER ADDED
// ============================================================

assert(

  ledgerRecord.summary.includes(
    "key_governance_ledger_record"
  ),

  "ledger marker added"

);


// ============================================================
// VERIFIED
// ============================================================

console.log("");
console.log("================================");
console.log("KEY GOVERNANCE LEDGER VERIFIED");
console.log("================================");
console.log("");