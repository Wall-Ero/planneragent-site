// ============================================================
// PlannerAgent — Recovery Governance Ledger Runtime
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/recovery/governance.recovery.ledger.runtime.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Recovery Governance
//
// PURPOSE
// ------------------------------------------------------------
// Translate recovery governance evidence into
// governance ledger records.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Recovery decisions are temporary.
//
// Governance records are permanent.
//
// Recovery evidence must be transformed into
// preserved responsibility history.
//
// DOES NOT:
// - evaluate recovery policy
// - evaluate recovery requests
// - generate recovery evidence
// - persist ledger records
// - execute recovery
// - perform cryptography
//
// DOES:
// - accept recovery evidence
// - map recovery evidence to governance ledger format
// - preserve recovery responsibility history
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Transform recovery governance evidence into
// governance ledger records.
//
// Nothing else.
//
// ============================================================

import type {
  RecoveryGovernanceEvidence,
} from "./governance.recovery.evidence.runtime";

// ============================================================
// GOVERNANCE LEDGER RECORD
// ============================================================

export interface GovernanceLedgerRecord {

  ledgerRecordId:
    string;

  tenantId:
    string;

  domain:
    RecoveryGovernanceEvidence["domain"];

  classification:
    RecoveryGovernanceEvidence["classification"];

  recordType:
    RecoveryGovernanceEvidence["evidenceType"];

  sourceEvidenceId:
    string;

  decisionStatus:
    RecoveryGovernanceEvidence["decisionStatus"];

  authorityReconstructionRequired:
    boolean;

  reason:
    string;

  summary:
    string[];

  createdAt:
    string;
}

// ============================================================
// INPUT
// ============================================================

export interface BuildRecoveryLedgerRecordInput {

  ledgerRecordId:
    string;

  evidence:
    RecoveryGovernanceEvidence;

  createdAt:
    string;
}

// ============================================================
// MAIN
// ============================================================

export function buildGovernanceLedgerRecordFromRecoveryEvidence(
  input:
    BuildRecoveryLedgerRecordInput
): GovernanceLedgerRecord {

  return {

    ledgerRecordId:
      input.ledgerRecordId,

    tenantId:
      input.evidence.tenantId,

    domain:
      input.evidence.domain,

    classification:
      input.evidence.classification,

    recordType:
      input.evidence.evidenceType,

    sourceEvidenceId:
      input.evidence.evidenceId,

    decisionStatus:
      input.evidence.decisionStatus,

    authorityReconstructionRequired:
      input.evidence
        .authorityReconstructionRequired,

    reason:
      input.evidence.reason,

    summary: [

      ...input.evidence.summary,

      "governance_ledger_record_created",

    ],

    createdAt:
      input.createdAt,
  };
}