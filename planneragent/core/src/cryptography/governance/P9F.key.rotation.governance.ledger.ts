// ============================================================
// PlannerAgent — Key Rotation Governance Ledger
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/governance/
// P9F.key.rotation.governance.ledger.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Governance Ledger
//
// DOMAIN
// ------------------------------------------------------------
// P9F.1.4 — Key Rotation Governance Ledger
//
// PURPOSE
// ------------------------------------------------------------
// Preserve key rotation governance
// evidence history.
//
// Ledger remembers.
//
// Ledger does not decide.
//
// Ledger does not reinterpret evidence.
//
// This file does not:
//
// - evaluate policy
// - execute runtime
// - generate evidence
// - reinterpret evidence
// - change evidence
// - rotate keys
// - call KMS APIs
// - call Vault APIs
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
  KeyRotationGovernanceEvidence,
} from "./P9F.key.rotation.governance.evidence";


// ============================================================
// LEDGER STATUS
// ============================================================

export type KeyRotationLedgerStatus =
  | "LEDGER_RECORD_CREATED";


// ============================================================
// LEDGER INPUT
// ============================================================

export interface KeyRotationLedgerInput {

  ledgerRecordId:
    string;

  recordedAt:
    string;

  evidence:
    KeyRotationGovernanceEvidence;

}


// ============================================================
// LEDGER RECORD
// ============================================================

export interface KeyRotationGovernanceLedgerRecord {

  ledgerRecordId:
    string;

  ledgerStatus:
    KeyRotationLedgerStatus;

  recordedAt:
    string;

  evidenceId:
    string;

  evidenceGeneratedAt:
    string;

  evidenceStatus:
    KeyRotationGovernanceEvidence["evidenceStatus"];

  decisionStatus:
    KeyRotationGovernanceEvidence["decisionStatus"];

  decisionCode:
    KeyRotationGovernanceEvidence["decisionCode"];

  authorityValidated:
    boolean;

  triggerValidated:
    boolean;

  denialReason?:
    KeyRotationGovernanceEvidence["denialReason"];

  evidenceSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// LEDGER RECORDING
// ============================================================

export function recordKeyRotationGovernanceEvidence(
  input: KeyRotationLedgerInput
): KeyRotationGovernanceLedgerRecord {

  return {

    ledgerRecordId:
      input.ledgerRecordId,

    ledgerStatus:
      "LEDGER_RECORD_CREATED",

    recordedAt:
      input.recordedAt,

    evidenceId:
      input.evidence.evidenceId,

    evidenceGeneratedAt:
      input.evidence.generatedAt,

    evidenceStatus:
      input.evidence.evidenceStatus,

    decisionStatus:
      input.evidence.decisionStatus,

    decisionCode:
      input.evidence.decisionCode,

    authorityValidated:
      input.evidence.authorityValidated,

    triggerValidated:
      input.evidence.triggerValidated,

    denialReason:
      input.evidence.denialReason,

    evidenceSummary: [
      ...input.evidence.summary,
    ],

    summary: [
      ...input.evidence.summary,
      "ledger_record_created",
    ],

  };

}


// ============================================================
// CANONICAL OBSERVATION
// ============================================================
//
// Ledger preserves evidence history.
//
// Ledger does not reinterpret evidence.
//
// Ledger does not create evidence.
//
// Ledger does not verify evidence.
//
// Ledger preserves the typed contract
// of Evidence.
//
// Ledger identity and record time
// are supplied externally.
//
// This keeps Ledger deterministic,
// testable, and free from side effects.
//
// ============================================================


// ============================================================
// P9F.1.4 PRINCIPLE
// ============================================================
//
// Evidence
// ≠
// Ledger
//
// Ledger
// ≠
// Audit
//
// Ledger remembers evidence.
//
// Ledger never degrades evidence
// into untyped strings.
//
// Ledger never re-evaluates decisions.
//
// Ledger never reinterprets evidence.
//
// Ledger never creates evidence.
//
// Ledger never performs audit.
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
// - degrade evidence types
// - generate evidence identity
// - generate timestamps
// - rotate keys
// - execute cryptography
// - call KMS APIs
// - call Vault APIs
// - perform audits
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ preserve ledgerRecordId
//
// ✓ preserve recordedAt
//
// ✓ preserve evidenceId
//
// ✓ preserve evidence generatedAt
//
// ✓ preserve evidenceStatus
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
// ✓ preserve typed evidence contract
//
// ✓ preserve evidence summary
//
// ✓ add ledger marker
//
// ✗ decide
//
// ✗ generate evidence
//
// ✗ degrade evidence types
//
// ✗ execute rotation
//
// ✗ audit
//
// ============================================================