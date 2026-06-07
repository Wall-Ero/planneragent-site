// ============================================================
// PlannerAgent — Key Governance Evidence
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// cryptography.key.governance.evidence.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Key Management Governance
//
// P9C.4.4 — Key Governance Evidence
//
// PURPOSE
// ------------------------------------------------------------
// Transform key governance decisions
// into auditable governance evidence.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Runtime decides.
//
// Evidence preserves.
//
// Evidence never re-evaluates decisions.
//
// Evidence never creates authority.
//
// Evidence records responsibility history.
//
// DOES:
//
// - create governance evidence contracts
// - preserve governance decisions
// - preserve validation outcomes
// - preserve residual risk ownership
// - prepare audit-ready evidence
//
// DOES NOT:
//
// - evaluate requests
// - re-evaluate authority
// - re-evaluate lifecycle
// - re-evaluate approvals
// - write ledger records
// - perform audits
// - execute cryptographic operations
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Transform governance decisions
// into reconstructable responsibility history.
//
// Nothing else.
//
// ============================================================

import type {
KeyGovernanceOperation,
ResidualRiskOwner,
} from "./cryptography.key.policy";

import type {
KeyGovernanceDecision,
KeyGovernanceDecisionStatus,
KeyGovernanceDenialReason,
} from "./cryptography.key.governance.runtime";

// ============================================================
// EVIDENCE
// ============================================================

export interface KeyGovernanceEvidence {

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

governanceEvidenceRequired:
boolean;

ledgerRecordRequired:
boolean;

cryptographicAuditRequired:
boolean;

residualRiskOwner:
ResidualRiskOwner;

denialReason?:
KeyGovernanceDenialReason;

reason:
string;

summary:
string[];

}

// ============================================================
// EVIDENCE GENERATION
// ============================================================

export function createKeyGovernanceEvidence(
evidenceId: string,
decision: KeyGovernanceDecision,
residualRiskOwner: ResidualRiskOwner
): KeyGovernanceEvidence {

return {

evidenceId,

operation:
  decision.operation,

decisionStatus:
  decision.status,

authorityValidated:
  decision.authorityValidated,

lifecycleValidated:
  decision.lifecycleValidated,

approvalValidated:
  decision.approvalValidated,

governanceEvidenceRequired:
  decision.governanceEvidenceRequired,

ledgerRecordRequired:
  decision.ledgerRecordRequired,

cryptographicAuditRequired:
  decision.cryptographicAuditRequired,

residualRiskOwner,

denialReason:
  decision.denialReason,

reason:
  decision.reason,

summary: [
  ...decision.summary,
  "key_governance_evidence",
],

};

}

// ============================================================
// PLANNERAGENT EVIDENCE PRINCIPLE
// ============================================================
//
// Runtime decides.
//
// Evidence preserves.
//
// Evidence never re-evaluates decisions.
//
// Evidence never creates authority.
//
// Evidence records responsibility history.
//
// ============================================================