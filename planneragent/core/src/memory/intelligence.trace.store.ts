// core/src/memory/intelligence.trace.store.ts
// =====================================================
// PlannerAgent — Intelligence Trace Store
// Canonical Snapshot · Source of Truth
// =====================================================

import type {
  IntelligenceParticipationRecord
} from "./intelligence.trace";

export class IntelligenceTraceStore {

  constructor(
    private db: D1Database
  ) {}

  // ===================================================
  // APPEND TRACE
  // ===================================================

  async appendTrace(
    trace: IntelligenceParticipationRecord
  ): Promise<void> {

    await this.db.prepare(`
      INSERT INTO memory_intelligence_trace (

        trace_id,

        tenant_id,
        company_id,
        context_id,

        authority_layer,

        operational_scope,

        provider,
        model,

        role,

        governed,

        policy_scope,

        execution_scope,
        execution_contribution,

        metadata_json,

        participated_at

      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(

      trace.trace_id,

      trace.tenant_id,
      trace.company_id,
      trace.context_id,

      trace.authority_layer,

      trace.operational_scope,

      trace.provider,
      trace.model ?? null,

      trace.role,

      trace.governed ? 1 : 0,

      trace.policy_scope,

      trace.execution_scope ?? null,
      trace.execution_contribution ?? null,

      JSON.stringify(trace.metadata ?? {}),

      trace.participated_at

    ).run();
  }

  // ===================================================
  // GET RECENT TRACES
  // ===================================================

  async getRecentTraces(
    company_id: string,
    limit = 20
  ): Promise<IntelligenceParticipationRecord[]> {

    const res = await this.db.prepare(`
      SELECT *
      FROM memory_intelligence_trace
      WHERE company_id = ?
      ORDER BY participated_at DESC
      LIMIT ?
    `).bind(
      company_id,
      limit
    ).all();

    return (res.results ?? []).map((row: any) => ({

      trace_id: row.trace_id,

      tenant_id: row.tenant_id,
      company_id: row.company_id,
      context_id: row.context_id,

      authority_layer: row.authority_layer,

      operational_scope: row.operational_scope,

      provider: row.provider,

      model: row.model ?? undefined,

      role: row.role,

      governed: !!row.governed,

      policy_scope: row.policy_scope,

      execution_scope:
        row.execution_scope ?? undefined,

      execution_contribution:
        row.execution_contribution ?? undefined,

      participated_at: row.participated_at,

      metadata:
        row.metadata_json
          ? JSON.parse(row.metadata_json)
          : {}
    }));
  }
}