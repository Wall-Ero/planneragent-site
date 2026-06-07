// ============================================================
// PlannerAgent — Key Governance Evidence Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/__tests__/
// cryptography.key.governance.evidence.runner.ts
//
// STATUS
// ------------------------------------------------------------
// TEST RUNNER
//
// ============================================================

import {
  createKeyGovernanceEvidence,
} from "../cryptography.key.governance.evidence";

import type {
  KeyGovernanceDecision,
} from "../cryptography.key.governance.runtime";


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
console.log("KEY GOVERNANCE EVIDENCE AUDIT");
console.log("================================");
console.log("");


// ============================================================
// TEST DATA
// ============================================================

const evidenceId =
  "EVIDENCE-001";

const decision: KeyGovernanceDecision = {

  status:
    "ALLOWED",

  operation:
    "CREATE_KEY",

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

  reason:
    "Operation permitted under governance policy.",

  summary: [
    "create_key",
    "operation_allowed",
  ],

};

// ============================================================
// EVIDENCE
// ============================================================

const evidence =
  createKeyGovernanceEvidence(

    evidenceId,

    decision,

    "AUTHORITY_OWNER"

  );


// ============================================================
// TEST 1
// EVIDENCE CREATED
// ============================================================

assert(

  !!evidence,

  "evidence created"

);


// ============================================================
// TEST 2
// EVIDENCE ID PRESERVED
// ============================================================

assert(

  evidence.evidenceId ===
    evidenceId,

  "evidence id preserved"

);


// ============================================================
// TEST 3
// DECISION STATUS PRESERVED
// ============================================================

assert(

  evidence.decisionStatus ===
    decision.status,

  "decision status preserved"

);


// ============================================================
// TEST 4
// AUTHORITY VALIDATION PRESERVED
// ============================================================

assert(

  evidence.authorityValidated,

  "authority validation preserved"

);


// ============================================================
// TEST 5
// LIFECYCLE VALIDATION PRESERVED
// ============================================================

assert(

  evidence.lifecycleValidated,

  "lifecycle validation preserved"

);


// ============================================================
// TEST 6
// APPROVAL VALIDATION PRESERVED
// ============================================================

assert(

  evidence.approvalValidated,

  "approval validation preserved"

);


// ============================================================
// TEST 7
// GOVERNANCE EVIDENCE REQUIREMENT PRESERVED
// ============================================================

assert(

  evidence.governanceEvidenceRequired,

  "governance evidence requirement preserved"

);


// ============================================================
// TEST 8
// LEDGER REQUIREMENT PRESERVED
// ============================================================

assert(

  evidence.ledgerRecordRequired,

  "ledger requirement preserved"

);


// ============================================================
// TEST 9
// AUDIT REQUIREMENT PRESERVED
// ============================================================

assert(

  evidence.cryptographicAuditRequired,

  "cryptographic audit requirement preserved"

);


// ============================================================
// TEST 10
// RESIDUAL RISK OWNER PRESERVED
// ============================================================

assert(

  evidence.residualRiskOwner ===
    "AUTHORITY_OWNER",

  "residual risk owner preserved"

);


// ============================================================
// TEST 11
// REASON PRESERVED
// ============================================================

assert(

  evidence.reason ===
    decision.reason,

  "decision reason preserved"

);


// ============================================================
// TEST 12
// SUMMARY PRESERVED
// ============================================================

assert(

  evidence.summary.includes(
    "create_key"
  ),

  "summary preserved"

);


// ============================================================
// TEST 13
// EVIDENCE MARKER ADDED
// ============================================================

assert(

  evidence.summary.includes(
    "key_governance_evidence"
  ),

  "evidence marker added"

);


// ============================================================
// VERIFIED
// ============================================================

console.log("");
console.log("================================");
console.log("KEY GOVERNANCE EVIDENCE VERIFIED");
console.log("================================");
console.log("");