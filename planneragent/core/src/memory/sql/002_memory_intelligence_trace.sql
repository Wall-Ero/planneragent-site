-- core/src/memory/sql/002_memory_intelligence_trace.sql
-- =====================================================
-- PlannerAgent — Intelligence Participation Trace Table
-- Canonical Snapshot · Source of Truth
-- =====================================================

CREATE TABLE IF NOT EXISTS memory_intelligence_trace (

  trace_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  context_id TEXT NOT NULL,

  authority_layer TEXT NOT NULL,
  operational_scope TEXT NOT NULL,

  provider TEXT NOT NULL,
  model TEXT,

  role TEXT NOT NULL,

  governed INTEGER NOT NULL,

  policy_scope TEXT NOT NULL,

  execution_scope TEXT,

  execution_contribution TEXT,

  metadata_json TEXT,

  participated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_intelligence_trace_company
ON memory_intelligence_trace(company_id);

CREATE INDEX IF NOT EXISTS idx_memory_intelligence_trace_authority
ON memory_intelligence_trace(authority_layer);

CREATE INDEX IF NOT EXISTS idx_memory_intelligence_trace_provider
ON memory_intelligence_trace(provider);