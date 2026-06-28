// core/src/cryptography/__tests__/P9E.auditability.family.architectural.decision.runner.ts

// ============================================================
// PlannerAgent
// P9E Auditability Family Architectural Decision Runner
// ============================================================

import {
falsifyAuditabilityFamily,
} from "../P9E.auditability.family.falsification";

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

}

// ============================================================
// ARCHITECTURAL DECISION
// ============================================================
//
// Decision Question:
//
// Can Cryptographic Auditability be fully
// expressed through Governance Family:
//
// Policy
// ↓
// Runtime
// ↓
// Evidence
// ↓
// Ledger
// ↓
// Audit
//
// ?
//
// Current evidence:
//
// - prove who used a key
// - prove when a secret changed
// - prove encryption occurred
// - prove rotation occurred
// - prove tampering did not occur
//
// These are expressible through:
//
// Evidence
// Ledger
// Audit
//
// ============================================================

const auditabilityDecision =
falsifyAuditabilityFamily({

capability:  
  "CRYPTOGRAPHIC_AUDITABILITY",  

existingFamilyTested:  
  "GOVERNANCE_FAMILY",  

expressibleThroughExistingFamily:  
  true,  

rationale: [  
  "cryptographic_auditability_requires_evidence",  
  "cryptographic_auditability_requires_ledger",  
  "cryptographic_auditability_requires_audit",  
  "governance_family_contains_evidence_ledger_audit",  
  "governance_family_sufficient",  
],

});

// ============================================================
// TEST 1
// Auditability absorbed by Governance
// ============================================================

assert(
auditabilityDecision.classification ===
"EXPRESSIBLE_THROUGH_EXISTING_FAMILY",
"auditability absorbed by governance"
);

// ============================================================
// TEST 2
// Governance family preserved
// ============================================================

assert(
auditabilityDecision.expressedThrough ===
"GOVERNANCE_FAMILY",
"governance family preserved"
);

// ============================================================
// TEST 3
// Reuse existing family outcome selected
// ============================================================

assert(
auditabilityDecision.outcome ===
"REUSE_EXISTING_FAMILY",
"reuse existing family outcome selected"
);

// ============================================================
// TEST 4
// Auditability family not required
// ============================================================

assert(
auditabilityDecision.classification !==
"REQUIRES_AUDITABILITY_FAMILY",
"auditability family not required"
);

// ============================================================
// TEST 5
// Evidence requirement preserved
// ============================================================

assert(
auditabilityDecision.summary.includes(
"cryptographic_auditability_requires_evidence"
),
"evidence requirement preserved"
);

// ============================================================
// TEST 6
// Ledger requirement preserved
// ============================================================

assert(
auditabilityDecision.summary.includes(
"cryptographic_auditability_requires_ledger"
),
"ledger requirement preserved"
);

// ============================================================
// TEST 7
// Audit requirement preserved
// ============================================================

assert(
auditabilityDecision.summary.includes(
"cryptographic_auditability_requires_audit"
),
"audit requirement preserved"
);

// ============================================================
// TEST 8
// Governance sufficiency preserved
// ============================================================

assert(
auditabilityDecision.summary.includes(
"governance_family_sufficient"
),
"governance sufficiency preserved"
);

// ============================================================
// SUMMARY
// ============================================================

console.log("");

console.log(
"================================"
);

console.log(
"P9E AUDITABILITY FAMILY ARCHITECTURAL DECISION"
);

console.log(
"================================"
);

console.log("");

console.log(
"Decision:"
);

console.log(
"CRYPTOGRAPHIC_AUDITABILITY"
);

console.log(
"→ GOVERNANCE_FAMILY"
);

console.log("");

console.log(
"Outcome:"
);

console.log(
"REUSE_EXISTING_FAMILY"
);

console.log("");

console.log(
"Verified Reason:"
);

console.log(
"✓ evidence"
);

console.log(
"✓ ledger"
);

console.log(
"✓ audit"
);

console.log(
"✓ governance family sufficient"
);

console.log("");

console.log(
"RESULT:"
);

console.log(
"Auditability candidate absorbed."
);

console.log(
"Dedicated Auditability Family not required."
);

console.log("");

console.log(
"================================"
);

console.log(
"ARCHITECTURAL DECISION VERIFIED"
);

console.log(
"================================"
);