// core/src/governance/ledger/governance.ledger.types.ts
// ============================================================
// PlannerAgent — Governance Ledger Types
// Canonical Source of Truth
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/ledger/governance.ledger.types.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Immutable Governance Ledger
//
// PURPOSE
// ------------------------------------------------------------
// Define immutable governance ledger contracts.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance history must remain reconstructable
// and resistant to silent modification.
//
// DOES NOT:
// - persist records
// - verify hashes
// - execute runtime logic
// - perform cryptography
//
// DOES:
// - define ledger contracts
// - define immutable record structure
// - define verification results
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Define immutable governance ledger structures.
//
// ============================================================

export type GovernanceLedgerDomain =
  | "SNAPSHOT"
  | "TENANT_BOUNDARY"
  | "SOVEREIGNTY"
  | "ENCRYPTION"
  | "EXECUTION"
  | "GOVERNANCE";

export interface GovernanceLedgerRecord {

  ledger_id: string;

  evidence_id: string;

  tenant_id?: string;

  domain:
    GovernanceLedgerDomain;

  previous_hash:
    string | null;

  current_hash:
    string;

  sequence_number:
    number;

  immutable: true;

  created_at: string;
}

export interface GovernanceLedgerVerification {

  valid: boolean;

  immutable: boolean;

  continuityValid: boolean;

  sequenceValid: boolean;

  duplicateIdsDetected: boolean;

  brokenAt?: string;

  summary: string[];
}