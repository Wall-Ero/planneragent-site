// ============================================================
// PlannerAgent — Key Governance Ledger
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// cryptography.key.governance.ledger.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Key Management Governance
//
// P9C.4.5 — Key Governance Ledger
//
// PURPOSE
// ------------------------------------------------------------
// Transform key governance evidence
// into immutable governance ledger records.
//
// CORE PRINCIPLES
// ------------------------------------------------------------
//
// Runtime decides legitimacy.
//
// Evidence preserves legitimacy.
//
// Ledger preserves legitimacy history.
//
// Audit verifies legitimacy continuity.
//
// No governance interpretation may be introduced
// after the Evidence layer.
//
// ============================================================
//
// DOES
//
// ✓ preserve governance evidence
// ✓ preserve decision status
// ✓ preserve validation outcomes
// ✓ preserve residual risk ownership
// ✓ preserve responsibility history
// ✓ prepare audit reconstruction
//
// DOES NOT
//
// ✗ evaluate requests
// ✗ re-evaluate authority
// ✗ re-evaluate lifecycle
// ✗ re-evaluate approval
// ✗ re-evaluate governance decisions
// ✗ generate evidence
// ✗ perform audits
// ✗ execute cryptographic operations
//
// ============================================================
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Preserve governance evidence as
// immutable governance history.
//
// Nothing else.
//
// ============================================================

import type {
KeyGovernanceOperation,
ResidualRiskOwner,
} from "./cryptography.key.policy";

import type {
KeyGovernanceDecisionStatus,
KeyGovernanceDenialReason,
} from "./cryptography.key.governance.runtime";

import type {
KeyGovernanceEvidence,
} from "./cryptography.key.governance.evidence";

// ============================================================
// LEDGER RECORD
// ============================================================

export interface KeyGovernanceLedgerRecord {

ledgerId:
string;

evidenceId:
string;

operation:
KeyGovernanceOperation;

decisionStatus:
KeyGovernanceDecisionStatus;

authorityValidated:
boolean;

lifecycleValidated:
boolean;

approvalValidated:
boolean;

residualRiskOwner:
ResidualRiskOwner;

governanceEvidenceRequired:
boolean;

ledgerRecordRequired:
boolean;

cryptographicAuditRequired:
boolean;

denialReason?:
KeyGovernanceDenialReason;

reason:
string;

summary:
string[];

}

// ============================================================
// LEDGER CREATION
// ============================================================

export function createKeyGovernanceLedgerRecord(
ledgerId: string,
evidence: KeyGovernanceEvidence
): KeyGovernanceLedgerRecord {

return {

ledgerId,

evidenceId:
  evidence.evidenceId,

operation:
  evidence.operation,

decisionStatus:
  evidence.decisionStatus,

authorityValidated:
  evidence.authorityValidated,

lifecycleValidated:
  evidence.lifecycleValidated,

approvalValidated:
  evidence.approvalValidated,

residualRiskOwner:
  evidence.residualRiskOwner,

governanceEvidenceRequired:
  evidence.governanceEvidenceRequired,

ledgerRecordRequired:
  evidence.ledgerRecordRequired,

cryptographicAuditRequired:
  evidence.cryptographicAuditRequired,

denialReason:
  evidence.denialReason,

reason:
  evidence.reason,

summary: [
  ...evidence.summary,
  "key_governance_ledger_record",
],

};

}

// ============================================================
// LEDGER INVARIANT
// ============================================================
//
// For every governance ledger field
// other than:
//
// - ledgerId
// - Summary ledger marker
//
// Ledger.field must originate from
// Evidence.field
//
// without transformation.
//
// ============================================================

// ============================================================
// LEDGER GUARDRAIL
// ============================================================
//
// If a field appears in Ledger
// that did not exist in Evidence,
//
// the first question must be:
//
// "Why wasn't this already evidence?"
//
// No governance interpretation may be
// introduced after the Evidence layer.
//
// ============================================================

// ============================================================
// PLANNERAGENT LEDGER PRINCIPLE
// ============================================================
//
// Runtime decides legitimacy.
//
// Evidence preserves decisions.
//
// Ledger preserves decision history.
//
// Audit verifies decision continuity.
//
// Ledger records may preserve governance.
//
// Ledger records may never perform
// governance.
//
// ============================================================