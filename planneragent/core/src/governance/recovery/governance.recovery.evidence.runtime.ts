// ============================================================
// PlannerAgent — Recovery Governance Evidence Runtime
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/recovery/governance.recovery.evidence.runtime.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Recovery Governance Evidence
//
// PURPOSE
// ------------------------------------------------------------
// Translate recovery governance decisions into
// auditable governance evidence.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Decision explains.
// Evidence preserves.
//
// DOES NOT
// ------------------------------------------------------------
// - persist evidence
// - write ledger records
// - execute recovery
// - evaluate policy
//
// DOES
// ------------------------------------------------------------
// - preserve recovery decisions
// - preserve governance reasoning
// - preserve authority reconstruction requirements
// - generate audit-ready evidence
//
// ============================================================

import type {
  RecoveryDecision,
  RecoveryDecisionStatus,
} from "./governance.recovery.types";

import type {
  RecoveryDomain,
  RecoveryClassification,
} from "./governance.recovery.policy";

// ============================================================
// Evidence Types
// ============================================================

export type RecoveryEvidenceType =
  | "RECOVERY_ALLOWED"
  | "RECOVERY_DENIED"
  | "RECOVERY_APPROVAL_REQUIRED"
  | "AUTHORITY_RECONSTRUCTION_REQUIRED";

// ============================================================
// Recovery Governance Evidence
// ============================================================

export interface RecoveryGovernanceEvidence {
  evidenceId: string;

  tenantId: string;

  domain: RecoveryDomain;

  classification:
    RecoveryClassification;

  evidenceType:
    RecoveryEvidenceType;

  decisionStatus:
    RecoveryDecisionStatus;

  authorityReconstructionRequired:
    boolean;

  reason: string;

  createdAt: string;

  summary: string[];
}

// ============================================================
// Builder Input
// ============================================================

export interface BuildRecoveryEvidenceInput {
  evidenceId: string;

  tenantId: string;

  decision:
    RecoveryDecision;

  createdAt: string;
}

// ============================================================
// Evidence Type Resolution
// ============================================================

function resolveEvidenceType(
  decision: RecoveryDecision
): RecoveryEvidenceType {

  if (
    decision.status ===
    "DENIED"
  ) {
    return "RECOVERY_DENIED";
  }

  if (
    decision.status ===
    "APPROVAL_REQUIRED"
  ) {
    return "RECOVERY_APPROVAL_REQUIRED";
  }

  if (
    decision.authorityReconstructionRequired
  ) {
    return "AUTHORITY_RECONSTRUCTION_REQUIRED";
  }

  return "RECOVERY_ALLOWED";
}

// ============================================================
// Build Recovery Governance Evidence
// ============================================================

export function buildRecoveryGovernanceEvidence(
  input: BuildRecoveryEvidenceInput
): RecoveryGovernanceEvidence {

  const evidenceType =
    resolveEvidenceType(
      input.decision
    );

  return {
    evidenceId:
      input.evidenceId,

    tenantId:
      input.tenantId,

    domain:
      input.decision.domain,

    classification:
      input.decision.classification,

    evidenceType,

    decisionStatus:
      input.decision.status,

    authorityReconstructionRequired:
      input.decision
        .authorityReconstructionRequired,

    reason:
      input.decision.reason,

    createdAt:
      input.createdAt,

    summary: [
  ...input.decision.summary,
  `recovery_evidence_type:${evidenceType}`,
]
  };
}