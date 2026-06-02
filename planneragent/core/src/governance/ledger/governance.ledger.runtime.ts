// core/src/governance/ledger/governance.ledger.runtime.ts
// ============================================================
// PlannerAgent — Governance Ledger Runtime
// Canonical Source of Truth
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/ledger/governance.ledger.runtime.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Immutable Governance Ledger Runtime
//
// PURPOSE
// ------------------------------------------------------------
// Translate governance evidence into immutable governance
// ledger records.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Evidence proves.
// Ledger remembers.
//
// Governance evidence that requires responsibility
// preservation becomes an immutable governance ledger record.
//
// DOES NOT:
// - generate governance evidence
// - evaluate policy
// - enforce policy
// - persist records
// - write immutable chains
// - perform cryptography
//
// DOES:
// - translate governance evidence into ledger records
// - assign governance ledger domain
// - preserve evidence identity
// - link records through previous hash
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Convert governance evidence into governance ledger records.
// Nothing else.
//
// ============================================================

import type {
  GovernanceEvidenceRecord,
} from "../evidence/governance.evidence.types";

import {
  buildGovernanceLedgerRecord,
} from "./governance.ledger.builder";

import type {
  GovernanceLedgerDomain,
  GovernanceLedgerRecord,
} from "./governance.ledger.types";

// ============================================================
// INPUT
// ============================================================

export interface GovernanceLedgerRuntimeInput {

  evidence:
    GovernanceEvidenceRecord;

  previous?:
    GovernanceLedgerRecord | null;

  current_hash:
    string;

}

// ============================================================
// MAIN
// ============================================================

export function createGovernanceLedgerRecordFromEvidence(
  input: GovernanceLedgerRuntimeInput
): GovernanceLedgerRecord {

  const previous =
    input.previous ?? null;

  return buildGovernanceLedgerRecord({

    evidence_id:
      input.evidence.evidence_id,

    tenant_id:
      input.evidence.tenant_id,

    domain:
      mapEvidenceSourceToLedgerDomain(
        input.evidence.source
      ),

    previous_hash:
      previous?.current_hash ?? null,

    current_hash:
      input.current_hash,

    sequence_number:
      (previous?.sequence_number ?? 0) + 1,

    created_at:
      new Date()
        .toISOString(),

  });

}

// ============================================================
// SOURCE → LEDGER DOMAIN MAP
// ============================================================

function mapEvidenceSourceToLedgerDomain(
  source: GovernanceEvidenceRecord["source"]
): GovernanceLedgerDomain {

  switch (source) {

    case "TENANT_BOUNDARY":
      return "TENANT_BOUNDARY";

    case "SOVEREIGNTY_POLICY":
      return "SOVEREIGNTY";

    case "ENCRYPTION_POLICY":
      return "ENCRYPTION";

    case "EXECUTION_GUARD":
      return "EXECUTION";

    case "AUTHORITY_GRAPH":
      return "GOVERNANCE";

    default:
      return "GOVERNANCE";
  }

}