// core/src/governance/ledger/adapters/governance.ledger.d1.adapter.ts
// ============================================================
// PlannerAgent — Governance Ledger D1 Adapter
// Canonical Source of Truth
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/ledger/adapters/governance.ledger.d1.adapter.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Immutable Governance Ledger Persistence Adapter
//
// PURPOSE
// ------------------------------------------------------------
// Persist governance ledger records into D1.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Ledger preservation is an infrastructure concern.
//
// Governance domains decide what must be preserved.
// Adapters decide where preservation occurs.
//
// DOES NOT:
// - build ledger records
// - verify continuity
// - verify sequence integrity
// - detect duplicate ids
// - perform cryptography
// - evaluate governance
//
// DOES:
// - persist ledger records
// - fail closed on D1 errors
//
// ============================================================

import type {
  GovernanceLedgerRecord,
} from "../governance.ledger.types";

import type {
  GovernanceLedgerPreservationAdapter,
} from "../governance.ledger.preservation";

// ============================================================
// D1
// ============================================================

export interface GovernanceLedgerD1Database {

  prepare(
    query: string
  ): {
    bind(
      ...values: unknown[]
    ): {
      run(): Promise<unknown>;
    };
  };

}

// ============================================================
// ADAPTER
// ============================================================

export class GovernanceLedgerD1Adapter
  implements GovernanceLedgerPreservationAdapter {

  constructor(
    private readonly db:
      GovernanceLedgerD1Database
  ) {}

  async preserveLedgerRecord(
    input: {
      record:
        GovernanceLedgerRecord;
    }
  ): Promise<void> {

    await this.db
      .prepare(`
        INSERT INTO governance_ledger (
          ledger_id,
          evidence_id,
          tenant_id,
          domain,
          previous_hash,
          current_hash,
          sequence_number,
          immutable,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(

        input.record.ledger_id,

        input.record.evidence_id,

        input.record.tenant_id ?? null,

        input.record.domain,

        input.record.previous_hash,

        input.record.current_hash,

        input.record.sequence_number,

        1,

        input.record.created_at,

      )
      .run();

  }

}