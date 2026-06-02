// core/src/governance/ledger/governance.ledger.builder.ts

import type {
  GovernanceLedgerDomain,
  GovernanceLedgerRecord,
} from "./governance.ledger.types";

export function buildGovernanceLedgerRecord(
  input: {

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

    created_at: string;
  }
): GovernanceLedgerRecord {

  return {

    ledger_id:
      crypto.randomUUID(),

    evidence_id:
      input.evidence_id,

    tenant_id:
      input.tenant_id,

    domain:
      input.domain,

    previous_hash:
      input.previous_hash,

    current_hash:
      input.current_hash,

    sequence_number:
      input.sequence_number,

    immutable: true,

    created_at:
      input.created_at,
  };
}