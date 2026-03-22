// core/src/decision-memory/decision.store.ts
// ============================================================
// Decision Memory Store — D1 Adapter
// Canonical Source of Truth
// ============================================================

import type {
  DecisionMemorySnapshotV1,
  DecisionMemoryHashChain,
  OrdEvidence
} from "./snapshot/snapshot.types";

// ------------------------------------------------------------
// STORE CONTRACT
// ------------------------------------------------------------

export interface DecisionStore {
  appendSnapshot(snapshot: DecisionMemorySnapshotV1): Promise<void>;

  getLastSnapshot(
    company_id: string,
    context_id: string
  ): Promise<DecisionMemorySnapshotV1 | null>;

  getRecentSnapshots(
    company_id: string,
    context_id: string,
    limit: number
  ): Promise<DecisionMemorySnapshotV1[]>;
}

// ------------------------------------------------------------
// D1 ADAPTER
// ------------------------------------------------------------

export class D1DecisionStoreAdapter implements DecisionStore {

  constructor(private db: D1Database) {}

  // ----------------------------------------------------------
  // APPEND SNAPSHOT
  // ----------------------------------------------------------

  async appendSnapshot(snapshot: DecisionMemorySnapshotV1): Promise<void> {

    await this.db.prepare(`
  INSERT INTO decision_memory_snapshots (
    snapshot_id,
    tenant_id,
    company_id,
    context_id,
    plan,
    intent,
    domain,
    baseline_snapshot_id,
    baseline_metrics_json,
    ord_json,
    previous_hash,
    current_hash,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).bind(
  snapshot.snapshot_id,
  snapshot.tenant_id,
  snapshot.company_id,
  snapshot.context_id,

  snapshot.plan,
  snapshot.intent,
  snapshot.domain ?? snapshot.context_id,

  snapshot.baseline_snapshot_id ?? null,

  JSON.stringify(snapshot.baseline_metrics ?? {}),
  JSON.stringify(snapshot.ord ?? {}),

  snapshot.hash_chain?.previous_hash ?? null,
  snapshot.hash_chain?.current_hash ?? null,

  snapshot.created_at ?? new Date().toISOString()
).run();
  }

  // ----------------------------------------------------------
  // GET LAST SNAPSHOT
  // ----------------------------------------------------------

  async getLastSnapshot(
    company_id: string,
    context_id: string
  ): Promise<DecisionMemorySnapshotV1 | null> {

    const res = await this.db.prepare(`
      SELECT *
      FROM decision_memory_snapshots
      WHERE company_id = ?
      AND context_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(company_id, context_id).first();

    if (!res) return null;

    return this.mapRowToSnapshot(res);
  }

  // ----------------------------------------------------------
  // GET RECENT SNAPSHOTS (FOR REPLAY)
  // ----------------------------------------------------------

  async getRecentSnapshots(
    company_id: string,
    context_id: string,
    limit: number
  ): Promise<DecisionMemorySnapshotV1[]> {

    const res = await this.db.prepare(`
      SELECT *
      FROM decision_memory_snapshots
      WHERE company_id = ?
      AND context_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(company_id, context_id, limit).all();

    if (!res?.results?.length) return [];

    return res.results.map((row: any) => this.mapRowToSnapshot(row));
  }

  // ----------------------------------------------------------
  // MAPPER
  // ----------------------------------------------------------

  private mapRowToSnapshot(row: any): DecisionMemorySnapshotV1 {

    const hashChain: DecisionMemoryHashChain = {
      previous_hash: row.previous_hash ?? null,
      current_hash: row.current_hash
    };

    const ord: OrdEvidence = row.ord_json
      ? JSON.parse(row.ord_json)
      : {
          pressure_score: 0,
          confidence_score: 0,
          ord_gate: {
            allow_paid_llm: false,
            recommended_tier: "OSS",
            reason: "default_fallback"
          }
        };

    return {
      snapshot_id: String(row.snapshot_id),

      tenant_id: String(row.tenant_id),
      company_id: String(row.company_id),
      context_id: String(row.context_id),

      plan: row.plan,
      intent: row.intent,
      domain: row.domain,

      baseline_snapshot_id: String(row.baseline_snapshot_id),

      baseline_metrics: row.baseline_metrics_json
        ? JSON.parse(row.baseline_metrics_json)
        : {},

      ord,

      hash_chain: hashChain,

      created_at: String(row.created_at)
    };
  }
}