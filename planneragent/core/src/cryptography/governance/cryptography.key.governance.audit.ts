// ============================================================
// PlannerAgent — Key Governance Audit
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// cryptography.key.governance.audit.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Key Management Governance
//
// P9C.4.6 — Key Governance Audit
//
// PURPOSE
// ------------------------------------------------------------
// Verify continuity between key governance
// evidence and key governance ledger records.
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
// Audit never decides.
//
// Audit never preserves.
//
// Audit never reconstructs authority.
//
// Audit never creates evidence.
//
// Audit only verifies continuity.
//
// ============================================================
//
// DOES
//
// ✓ verify evidence continuity
// ✓ verify ledger continuity
// ✓ verify decision traceability
// ✓ verify responsibility traceability
// ✓ verify auditability
// ✓ identify continuity violations
//
// DOES NOT
//
// ✗ evaluate requests
// ✗ create authority
// ✗ reconstruct authority
// ✗ create evidence
// ✗ write ledger records
// ✗ modify history
// ✗ execute cryptographic operations
// ✗ perform governance decisions
//
// ============================================================
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Verify that governance decisions preserved
// in Evidence remain continuous in Ledger.
//
// Nothing else.
//
// ============================================================

import type {
  KeyGovernanceEvidence,
} from "./cryptography.key.governance.evidence";

import type {
  KeyGovernanceLedgerRecord,
} from "./cryptography.key.governance.ledger";


// ============================================================
// AUDIT STATUS
// ============================================================

export type KeyGovernanceAuditStatus =
  | "VERIFIED"
  | "VIOLATION";


// ============================================================
// AUDIT VIOLATION
// ============================================================

export type KeyGovernanceAuditViolation =
  | "EVIDENCE_MISSING"
  | "LEDGER_MISSING"
  | "EVIDENCE_ID_MISMATCH"
  | "OPERATION_MISMATCH"
  | "DECISION_STATUS_MISMATCH"
  | "AUTHORITY_VALIDATION_MISMATCH"
  | "LIFECYCLE_VALIDATION_MISMATCH"
  | "APPROVAL_VALIDATION_MISMATCH"
  | "RESIDUAL_RISK_OWNER_MISMATCH"
  | "GOVERNANCE_EVIDENCE_REQUIREMENT_MISMATCH"
  | "LEDGER_REQUIREMENT_MISMATCH"
  | "CRYPTOGRAPHIC_AUDIT_REQUIREMENT_MISMATCH"
  | "DENIAL_REASON_MISMATCH"
  | "REASON_MISMATCH"
  | "SUMMARY_NOT_PRESERVED";


// ============================================================
// AUDIT RESULT
// ============================================================

export interface KeyGovernanceAuditResult {

  status:
    KeyGovernanceAuditStatus;

  violations:
    KeyGovernanceAuditViolation[];

  evidenceId?:
    string;

  ledgerId?:
    string;

  verified:
    boolean;

  reason:
    string;

  summary:
    string[];

}


// ============================================================
// AUDIT
// ============================================================

export function auditKeyGovernanceContinuity(
  evidence?: KeyGovernanceEvidence,
  ledgerRecord?: KeyGovernanceLedgerRecord
): KeyGovernanceAuditResult {

  const violations:
    KeyGovernanceAuditViolation[] = [];

  if (!evidence) {

    violations.push(
      "EVIDENCE_MISSING"
    );

  }

  if (!ledgerRecord) {

    violations.push(
      "LEDGER_MISSING"
    );

  }

  if (
    !evidence ||
    !ledgerRecord
  ) {

    return buildAuditResult(
      evidence,
      ledgerRecord,
      violations
    );

  }

  if (
    ledgerRecord.evidenceId !==
    evidence.evidenceId
  ) {

    violations.push(
      "EVIDENCE_ID_MISMATCH"
    );

  }

  if (
    ledgerRecord.operation !==
    evidence.operation
  ) {

    violations.push(
      "OPERATION_MISMATCH"
    );

  }

  if (
    ledgerRecord.decisionStatus !==
    evidence.decisionStatus
  ) {

    violations.push(
      "DECISION_STATUS_MISMATCH"
    );

  }

  if (
    ledgerRecord.authorityValidated !==
    evidence.authorityValidated
  ) {

    violations.push(
      "AUTHORITY_VALIDATION_MISMATCH"
    );

  }

  if (
    ledgerRecord.lifecycleValidated !==
    evidence.lifecycleValidated
  ) {

    violations.push(
      "LIFECYCLE_VALIDATION_MISMATCH"
    );

  }

  if (
    ledgerRecord.approvalValidated !==
    evidence.approvalValidated
  ) {

    violations.push(
      "APPROVAL_VALIDATION_MISMATCH"
    );

  }

  if (
    ledgerRecord.residualRiskOwner !==
    evidence.residualRiskOwner
  ) {

    violations.push(
      "RESIDUAL_RISK_OWNER_MISMATCH"
    );

  }

  if (
    ledgerRecord.governanceEvidenceRequired !==
    evidence.governanceEvidenceRequired
  ) {

    violations.push(
      "GOVERNANCE_EVIDENCE_REQUIREMENT_MISMATCH"
    );

  }

  if (
    ledgerRecord.ledgerRecordRequired !==
    evidence.ledgerRecordRequired
  ) {

    violations.push(
      "LEDGER_REQUIREMENT_MISMATCH"
    );

  }

  if (
    ledgerRecord.cryptographicAuditRequired !==
    evidence.cryptographicAuditRequired
  ) {

    violations.push(
      "CRYPTOGRAPHIC_AUDIT_REQUIREMENT_MISMATCH"
    );

  }

  if (
    ledgerRecord.denialReason !==
    evidence.denialReason
  ) {

    violations.push(
      "DENIAL_REASON_MISMATCH"
    );

  }

  if (
    ledgerRecord.reason !==
    evidence.reason
  ) {

    violations.push(
      "REASON_MISMATCH"
    );

  }

  for (
    const item
    of evidence.summary
  ) {

    if (
      !ledgerRecord.summary.includes(
        item
      )
    ) {

      violations.push(
        "SUMMARY_NOT_PRESERVED"
      );

      break;

    }

  }

  return buildAuditResult(
    evidence,
    ledgerRecord,
    violations
  );

}


// ============================================================
// RESULT BUILDER
// ============================================================

function buildAuditResult(
  evidence:
    KeyGovernanceEvidence | undefined,
  ledgerRecord:
    KeyGovernanceLedgerRecord | undefined,
  violations:
    KeyGovernanceAuditViolation[]
): KeyGovernanceAuditResult {

  const verified =
    violations.length === 0;

  return {

    status:
      verified
        ? "VERIFIED"
        : "VIOLATION",

    violations,

    evidenceId:
      evidence?.evidenceId,

    ledgerId:
      ledgerRecord?.ledgerId,

    verified,

    reason:
      verified
        ? "Governance continuity verified."
        : "Governance continuity violation detected.",

    summary:
      verified
        ? [
            "key_governance_audit_verified",
            "decision_history_continuity_verified",
          ]
        : [
            "key_governance_audit_violation",
            "decision_history_continuity_broken",
          ],

  };

}


// ============================================================
// AUDIT GUARDRAIL
// ============================================================
//
// If Audit requires information that does
// not exist in Ledger or Evidence,
//
// the first question must be:
//
// "Why was this not preserved earlier?"
//
// Audit may identify missing continuity.
//
// Audit may not compensate for missing
// continuity.
//
// ============================================================


// ============================================================
// PLANNERAGENT AUDIT PRINCIPLE
// ============================================================
//
// Audit may verify governance.
//
// Audit may never perform governance.
//
// Audit may identify continuity violations.
//
// Audit may never repair continuity violations.
//
// Authority continuity must be preserved
// before Audit begins.
//
// ============================================================