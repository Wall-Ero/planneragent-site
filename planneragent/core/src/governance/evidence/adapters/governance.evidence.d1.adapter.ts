// core/src/governance/evidence/adapters/governance.evidence.d1.adapter.ts
// ============================================================
// PlannerAgent — Governance Evidence D1 Adapter
// Canonical Adapter
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/governance/evidence/adapters/governance.evidence.d1.adapter.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL ADAPTER
//
// CATEGORY
// ------------------------------------------------------------
// Governance Evidence Preservation Adapter
//
// PURPOSE
// ------------------------------------------------------------
// Persist governance evidence using Cloudflare D1.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Preservation adapters implement durable storage.
// They do not define governance evidence.
//
// DOES NOT:
// - define governance evidence
// - enforce policy
// - create immutable chains
// - perform cryptography
// - decide authority
//
// DOES:
// - implement GovernanceEvidencePreservationAdapter
// - persist governance evidence records
// - make evidence retrievable after runtime lifecycle
//
// CANONICAL RESPONSIBILITY
// ------------------------------------------------------------
// Persist governance evidence to D1.
// Nothing else.
//
// ============================================================

import type {
  GovernanceEvidenceRecord,
} from "../governance.evidence.types";

import type {
  GovernanceEvidencePreservationAdapter,
} from "../governance.evidence.preservation";

// ============================================================
// D1 DATABASE CONTRACT
// ============================================================

export interface GovernanceEvidenceD1Database {

  prepare(
    query: string
  ): {
    bind(
      ...values: unknown[]
    ): {
      run(): Promise<unknown>;
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{
        results?: T[];
      }>;
    };
  };

}

// ============================================================
// ADAPTER
// ============================================================

export class GovernanceEvidenceD1Adapter
  implements GovernanceEvidencePreservationAdapter {

  constructor(
    private readonly db: GovernanceEvidenceD1Database
  ) {}

  async appendGovernanceEvidence(
    input: {
      record: GovernanceEvidenceRecord;
    }
  ): Promise<void> {

    const record =
      input.record;

    await this.db
      .prepare(
        `
        INSERT INTO governance_evidence (
          evidence_id,
          source,
          action,
          tenant_id,
          domain,
          severity,
          reason,
          summary_json,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        record.evidence_id,
        record.source,
        record.action,
        record.tenant_id ?? null,
        record.domain ?? null,
        record.severity,
        record.reason,
        JSON.stringify(record.summary ?? []),
        record.created_at
      )
      .run();

  }

  async getGovernanceEvidenceById(
    evidenceId: string
  ): Promise<GovernanceEvidenceRecord | null> {

    const row =
      await this.db
        .prepare(
          `
          SELECT
            evidence_id,
            source,
            action,
            tenant_id,
            domain,
            severity,
            reason,
            summary_json,
            created_at
          FROM governance_evidence
          WHERE evidence_id = ?
          LIMIT 1
          `
        )
        .bind(
          evidenceId
        )
        .first<{
          evidence_id: string;
          source: GovernanceEvidenceRecord["source"];
          action: GovernanceEvidenceRecord["action"];
          tenant_id: string | null;
          domain: string | null;
          severity: GovernanceEvidenceRecord["severity"];
          reason: string;
          summary_json: string | null;
          created_at: string;
        }>();

    if (!row) {
      return null;
    }

    return {
      evidence_id:
        row.evidence_id,

      source:
        row.source,

      action:
        row.action,

      tenant_id:
        row.tenant_id ?? undefined,

      domain:
        row.domain ?? undefined,

      severity:
        row.severity,

      reason:
        row.reason,

      summary:
        row.summary_json
          ? JSON.parse(row.summary_json)
          : [],

      created_at:
        row.created_at,
    };

  }

}