// ============================================================
// PlannerAgent — Key Rotation Governance Audit
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// P9F.key.rotation.governance.audit.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Governance Audit
//
// DOMAIN
// ------------------------------------------------------------
// P9F.1.5 — Key Rotation Governance Audit
//
// PURPOSE
// ------------------------------------------------------------
// Verify key rotation governance
// ledger records.
//
// Audit verifies.
//
// Audit does not decide.
//
// Audit does not reinterpret evidence.
//
// Audit does not rewrite ledger history.
//
// This file does not:
//
// - evaluate policy
// - execute runtime
// - generate evidence
// - write ledger records
// - change ledger records
// - rotate keys
// - call KMS APIs
// - call Vault APIs
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
  KeyRotationGovernanceLedgerRecord,
} from "./P9F.key.rotation.governance.ledger";


// ============================================================
// AUDIT STATUS
// ============================================================

export type KeyRotationAuditStatus =
  | "AUDIT_PASSED"
  | "AUDIT_FAILED";


// ============================================================
// AUDIT FAILURE REASON
// ============================================================

export type KeyRotationAuditFailureReason =
  | "LEDGER_RECORD_MISSING"
  | "EVIDENCE_ID_MISSING"
  | "DECISION_STATUS_MISSING"
  | "DECISION_CODE_MISSING"
  | "EVIDENCE_STATUS_MISSING"
  | "LEDGER_MARKER_MISSING";


// ============================================================
// AUDIT INPUT
// ============================================================

export interface KeyRotationAuditInput {

  auditId:
    string;

  auditedAt:
    string;

  ledgerRecord?:
    KeyRotationGovernanceLedgerRecord;

}

// ============================================================
// AUDIT RESULT
// ============================================================

export interface KeyRotationGovernanceAuditResult {

  auditId:
    string;

  auditStatus:
    KeyRotationAuditStatus;

  auditedAt:
    string;

  ledgerRecordId:
    string;

  evidenceId?:
    string;

  failureReason?:
    KeyRotationAuditFailureReason;

  summary:
    string[];

}


// ============================================================
// AUDIT
// ============================================================

export function auditKeyRotationGovernanceLedger(
  input: KeyRotationAuditInput
): KeyRotationGovernanceAuditResult {

  const ledgerRecord =
    input.ledgerRecord;

  if (!ledgerRecord) {

    return {

      auditId:
        input.auditId,

      auditStatus:
        "AUDIT_FAILED",

      auditedAt:
        input.auditedAt,

      ledgerRecordId:
        "MISSING_LEDGER_RECORD",

      failureReason:
        "LEDGER_RECORD_MISSING",

      summary: [
        "ledger_record_missing",
        "audit_failed",
      ],

    };

  }

  if (!ledgerRecord.evidenceId) {

    return {

      auditId:
        input.auditId,

      auditStatus:
        "AUDIT_FAILED",

      auditedAt:
        input.auditedAt,

      ledgerRecordId:
        ledgerRecord.ledgerRecordId,

      failureReason:
        "EVIDENCE_ID_MISSING",

      summary: [
        "evidence_id_missing",
        "audit_failed",
      ],

    };

  }

  if (!ledgerRecord.evidenceStatus) {

    return {

      auditId:
        input.auditId,

      auditStatus:
        "AUDIT_FAILED",

      auditedAt:
        input.auditedAt,

      ledgerRecordId:
        ledgerRecord.ledgerRecordId,

      evidenceId:
        ledgerRecord.evidenceId,

      failureReason:
        "EVIDENCE_STATUS_MISSING",

      summary: [
        "evidence_status_missing",
        "audit_failed",
      ],

    };

  }

  if (!ledgerRecord.decisionStatus) {

    return {

      auditId:
        input.auditId,

      auditStatus:
        "AUDIT_FAILED",

      auditedAt:
        input.auditedAt,

      ledgerRecordId:
        ledgerRecord.ledgerRecordId,

      evidenceId:
        ledgerRecord.evidenceId,

      failureReason:
        "DECISION_STATUS_MISSING",

      summary: [
        "decision_status_missing",
        "audit_failed",
      ],

    };

  }

  if (!ledgerRecord.decisionCode) {

    return {

      auditId:
        input.auditId,

      auditStatus:
        "AUDIT_FAILED",

      auditedAt:
        input.auditedAt,

      ledgerRecordId:
        ledgerRecord.ledgerRecordId,

      evidenceId:
        ledgerRecord.evidenceId,

      failureReason:
        "DECISION_CODE_MISSING",

      summary: [
        "decision_code_missing",
        "audit_failed",
      ],

    };

  }

  if (
    !ledgerRecord.summary.includes(
      "ledger_record_created"
    )
  ) {

    return {

      auditId:
        input.auditId,

      auditStatus:
        "AUDIT_FAILED",

      auditedAt:
        input.auditedAt,

      ledgerRecordId:
        ledgerRecord.ledgerRecordId,

      evidenceId:
        ledgerRecord.evidenceId,

      failureReason:
        "LEDGER_MARKER_MISSING",

      summary: [
        "ledger_marker_missing",
        "audit_failed",
      ],

    };

  }

  return {

    auditId:
      input.auditId,

    auditStatus:
      "AUDIT_PASSED",

    auditedAt:
      input.auditedAt,

    ledgerRecordId:
      ledgerRecord.ledgerRecordId,

    evidenceId:
      ledgerRecord.evidenceId,

    summary: [
      "ledger_record_present",
      "evidence_id_present",
      "evidence_status_present",
      "decision_status_present",
      "decision_code_present",
      "ledger_marker_present",
      "audit_passed",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Audit verifies ledger records.
//
// Audit does not reinterpret evidence.
//
// Audit does not rewrite ledger history.
//
// Audit does not create evidence.
//
// Audit does not decide.
//
// Audit identity and audit time are
// supplied externally.
//
// This keeps Audit deterministic,
// testable, and free from side effects.
//
// ============================================================


// ============================================================
// P9F.1.5 PRINCIPLE
// ============================================================
//
// Ledger
// ≠
// Audit
//
// Audit verifies.
//
// Audit never decides.
//
// Audit never re-evaluates policy.
//
// Audit never re-executes runtime.
//
// Audit never changes evidence.
//
// Audit never rewrites ledger records.
//
// Audit never rotates keys.
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
// - change evidence status
// - generate evidence
// - write ledger records
// - mutate ledger records
// - rotate keys
// - execute cryptography
// - call KMS APIs
// - call Vault APIs
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ preserve auditId
//
// ✓ preserve auditedAt
//
// ✓ verify ledger record presence
//
// ✓ verify evidenceId presence
//
// ✓ verify evidenceStatus presence
//
// ✓ verify decisionStatus presence
//
// ✓ verify decisionCode presence
//
// ✓ verify ledger marker presence
//
// ✓ produce audit status
//
// ✗ decide
//
// ✗ generate evidence
//
// ✗ write ledger
//
// ✗ mutate ledger
//
// ✗ execute rotation
//
// ============================================================