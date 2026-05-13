-- ============================================
-- REBUILD memory_executions
-- DEV ONLY
-- ============================================

DROP TABLE IF EXISTS memory_executions;

CREATE TABLE memory_executions (

  memory_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  context_id TEXT NOT NULL,

  domain TEXT NOT NULL,
  subtype TEXT NOT NULL,

  authority_plan TEXT NOT NULL,
  authority_intent TEXT,
  authority_mode TEXT NOT NULL,

  payload_json TEXT NOT NULL,

  baseline_snapshot_id TEXT,

  created_at TEXT NOT NULL
);

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