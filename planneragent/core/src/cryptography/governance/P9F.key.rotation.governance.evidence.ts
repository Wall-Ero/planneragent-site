// ============================================================
// PlannerAgent — Key Rotation Governance Evidence
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// P9F.key.rotation.governance.evidence.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Governance Evidence
//
// DOMAIN
// ------------------------------------------------------------
// P9F.1.3 — Key Rotation Governance Evidence
//
// PURPOSE
// ------------------------------------------------------------
// Preserve deterministic evidence of
// key rotation governance decisions.
//
// Evidence preserves.
//
// Evidence does not decide.
//
// This file does not:
//
// - evaluate policy
// - execute runtime
// - re-evaluate authority
// - re-evaluate trigger
// - change decisions
// - rotate keys
// - call KMS APIs
// - call Vault APIs
// - write ledger records
// - perform audits
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Policy defines.
//
// Runtime decides.
//
// Evidence preserves.
//
// Ledger remembers.
//
// Audit verifies.
//
// ============================================================

import {
  KeyRotationDecisionCode,
  KeyRotationDecisionStatus,
  KeyRotationDenialReason,
  KeyRotationGovernanceDecision,
} from "./P9F.key.rotation.governance.runtime";


// ============================================================
// EVIDENCE STATUS
// ============================================================

export type KeyRotationEvidenceStatus =
  | "EVIDENCE_GENERATED";


// ============================================================
// EVIDENCE INPUT
// ============================================================

export interface KeyRotationEvidenceInput {

  evidenceId:
    string;

  generatedAt:
    string;

  decision:
    KeyRotationGovernanceDecision;

}


// ============================================================
// EVIDENCE
// ============================================================

export interface KeyRotationGovernanceEvidence {

  evidenceId:
    string;

  evidenceStatus:
    KeyRotationEvidenceStatus;

  generatedAt:
    string;

  decisionStatus:
    KeyRotationDecisionStatus;

  decisionCode:
    KeyRotationDecisionCode;

  authorityValidated:
    boolean;

  triggerValidated:
    boolean;

  denialReason?:
    KeyRotationDenialReason;

  decisionSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// EVIDENCE GENERATION
// ============================================================

export function generateKeyRotationGovernanceEvidence(
  input: KeyRotationEvidenceInput
): KeyRotationGovernanceEvidence {

  return {

    evidenceId:
      input.evidenceId,

    evidenceStatus:
      "EVIDENCE_GENERATED",

    generatedAt:
      input.generatedAt,

    decisionStatus:
      input.decision.decisionStatus,

    decisionCode:
      input.decision.decisionCode,

    authorityValidated:
      input.decision.authorityValidated,

    triggerValidated:
      input.decision.triggerValidated,

    denialReason:
      input.decision.denialReason,

    decisionSummary: [
      ...input.decision.summary,
    ],

    summary: [
      ...input.decision.summary,
      "evidence_generated",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Evidence preserves governance
// decisions.
//
// Evidence does not reinterpret
// governance decisions.
//
// Evidence does not create
// governance decisions.
//
// Evidence identity and generation time
// are supplied externally.
//
// This keeps Evidence deterministic,
// testable, and free from side effects.
//
// ============================================================


// ============================================================
// P9F.1.3 PRINCIPLE
// ============================================================
//
// Decision
// ≠
// Evidence
//
// Evidence
// ≠
// Ledger
//
// Evidence
// ≠
// Audit
//
// Evidence preserves decisions.
//
// Evidence never re-evaluates decisions.
//
// Evidence never creates decisions.
//
// Evidence never writes ledger records.
//
// Evidence never performs audit.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - evaluate policy
// - execute runtime
// - re-evaluate authority
// - re-evaluate trigger
// - change decision status
// - change decision code
// - rotate keys
// - execute cryptography
// - call KMS APIs
// - call Vault APIs
// - generate evidence identity
// - generate timestamps
// - write ledger records
// - perform audits
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ preserve evidenceId
//
// ✓ preserve generatedAt
//
// ✓ preserve decisionStatus
//
// ✓ preserve decisionCode
//
// ✓ preserve authorityValidated
//
// ✓ preserve triggerValidated
//
// ✓ preserve denialReason
//
// ✓ preserve decision summary
//
// ✓ add evidence marker
//
// ✗ decide
//
// ✗ execute rotation
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================