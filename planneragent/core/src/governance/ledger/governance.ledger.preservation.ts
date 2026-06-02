// core/src/governance/ledger/governance.ledger.preservation.ts
// ============================================================
// PlannerAgent — Governance Ledger Preservation
// Canonical Source of Truth
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/ledger/governance.ledger.preservation.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Immutable Governance Ledger Preservation
//
// PURPOSE
// ------------------------------------------------------------
// Preserve governance ledger records beyond
// runtime lifecycle.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Ledger remembers.
//
// Governance responsibility records must
// survive runtime termination.
//
// DOES NOT:
// - generate evidence
// - build ledger records
// - reconstruct records
// - verify continuity
// - verify sequence integrity
// - detect duplicate ledger ids
// - verify chain integrity
// - perform cryptography
//
// DOES:
// - preserve ledger records
// - invoke preservation adapters
// - fail closed if preservation fails
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Persist governance ledger records.
//
// Nothing else.
//
// ============================================================

import type {
  GovernanceLedgerRecord,
} from "./governance.ledger.types";

// ============================================================
// ADAPTER
// ============================================================

export interface GovernanceLedgerPreservationAdapter {

  preserveLedgerRecord(
    input: {
      record:
        GovernanceLedgerRecord;
    }
  ): Promise<void>;

}

// ============================================================
// INPUT
// ============================================================

export interface PreserveGovernanceLedgerInput {

  record:
    GovernanceLedgerRecord;

  adapter:
    GovernanceLedgerPreservationAdapter;

}

// ============================================================
// RESULT
// ============================================================

export interface GovernanceLedgerPreservationResult {

  preserved: boolean;

  ledger_id: string;

  summary: string[];

}

// ============================================================
// MAIN
// ============================================================

export async function preserveGovernanceLedgerRecord(
  input: PreserveGovernanceLedgerInput
): Promise<GovernanceLedgerPreservationResult> {

  await input.adapter
    .preserveLedgerRecord({

      record:
        input.record,

    });

  return {

    preserved: true,

    ledger_id:
      input.record.ledger_id,

    summary: [

      "ledger_preserved",

      "preservation_completed",

    ],

  };

}