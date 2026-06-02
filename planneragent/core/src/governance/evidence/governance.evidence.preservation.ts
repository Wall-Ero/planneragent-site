// core/src/governance/evidence/governance.evidence.preservation.ts
// ============================================================
// PlannerAgent — Governance Evidence Preservation
// Canonical Source of Truth
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/evidence/governance.evidence.preservation.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Governance Evidence Preservation
//
// PURPOSE
// ------------------------------------------------------------
// Preserve governance evidence beyond the runtime lifecycle.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance evidence must survive the runtime that generated it.
//
// DOES NOT:
// - evaluate policy
// - enforce policy
// - create immutable chains
// - perform cryptography
// - decide authority
//
// DOES:
// - define the evidence preservation boundary
// - require explicit persistence adapter
// - preserve governance evidence records
// - fail closed when evidence cannot be preserved
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Preserve governance evidence.
// Nothing else.
//
// ============================================================

import type {
  GovernanceEvidenceRecord,
} from "./governance.evidence.types";

// ============================================================
// ADAPTER
// ============================================================

export interface GovernanceEvidencePreservationAdapter {

  appendGovernanceEvidence(
    input: {
      record: GovernanceEvidenceRecord;
    }
  ): Promise<void>;

}

// ============================================================
// RESULT
// ============================================================

export interface GovernanceEvidencePreservationResult {

  preserved: boolean;

  evidence_id: string;

  source: string;

  action: string;

  tenant_id?: string;

  created_at: string;

}

// ============================================================
// MAIN
// ============================================================

export async function preserveGovernanceEvidence(
  input: {
    record: GovernanceEvidenceRecord;
    adapter: GovernanceEvidencePreservationAdapter;
  }
): Promise<GovernanceEvidencePreservationResult> {

  if (!input.adapter) {
    throw new Error(
      "GOVERNANCE_EVIDENCE_ADAPTER_REQUIRED"
    );
  }

  if (!input.record?.evidence_id) {
    throw new Error(
      "GOVERNANCE_EVIDENCE_ID_REQUIRED"
    );
  }

  if (!input.record?.source) {
    throw new Error(
      "GOVERNANCE_EVIDENCE_SOURCE_REQUIRED"
    );
  }

  if (!input.record?.created_at) {
    throw new Error(
      "GOVERNANCE_EVIDENCE_TIMESTAMP_REQUIRED"
    );
  }

  await input.adapter.appendGovernanceEvidence({
    record:
      input.record,
  });

  return {
    preserved: true,

    evidence_id:
      input.record.evidence_id,

    source:
      input.record.source,

    action:
      input.record.action,

    tenant_id:
      input.record.tenant_id,

    created_at:
      input.record.created_at,
  };

}