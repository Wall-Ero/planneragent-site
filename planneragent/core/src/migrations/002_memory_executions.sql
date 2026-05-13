-- core/src/migrations/002_memory_executions.sql
-- ============================================
-- PlannerAgent — Memory Executions
-- Canonical Snapshot · Source of Truth
-- ============================================

CREATE TABLE IF NOT EXISTS memory_executions (

  -- -------------------------------------------
  -- Identity
  -- -------------------------------------------
  memory_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  context_id TEXT NOT NULL,

  -- -------------------------------------------
  -- Classification
  -- -------------------------------------------
  domain TEXT NOT NULL,
  subtype TEXT NOT NULL,

  -- -------------------------------------------
  -- Governance Authority
  -- -------------------------------------------
  authority_plan TEXT NOT NULL,
  authority_intent TEXT,
  authority_mode TEXT NOT NULL,

  -- -------------------------------------------
  -- Snapshot payload
  -- -------------------------------------------
  payload_json TEXT NOT NULL,

  baseline_snapshot_id TEXT,

  -- -------------------------------------------
  -- Temporal truth
  -- -------------------------------------------
  created_at TEXT NOT NULL
);

-- -------------------------------------------
-- INDEXES
-- -------------------------------------------

CREATE INDEX IF NOT EXISTS idx_memory_exec_company
ON memory_executions (
  company_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_memory_exec_context
ON memory_executions (
  context_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_memory_exec_domain
ON memory_executions (
  domain,
  created_at DESC
);