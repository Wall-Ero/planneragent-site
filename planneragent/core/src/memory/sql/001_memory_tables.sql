-- =====================================================
-- PlannerAgent — Governed Memory Tables
-- Canonical Snapshot · Source of Truth
-- =====================================================

-- =====================================================
-- OBSERVATIONAL MEMORY
-- =====================================================

CREATE TABLE IF NOT EXISTS memory_observations (

  memory_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  context_id TEXT NOT NULL,

  domain TEXT NOT NULL,
  subtype TEXT NOT NULL,

  authority_plan TEXT NOT NULL,
  authority_intent TEXT,

  authority_mode TEXT,

  payload_json TEXT NOT NULL,

  baseline_snapshot_id TEXT,

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_observations_company
ON memory_observations(company_id);

-- =====================================================
-- AI GOVERNANCE MEMORY
-- =====================================================

CREATE TABLE IF NOT EXISTS memory_ai_governance (

  memory_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  context_id TEXT NOT NULL,

  domain TEXT NOT NULL,
  subtype TEXT NOT NULL,

  authority_plan TEXT NOT NULL,
  authority_intent TEXT,

  authority_mode TEXT,

  payload_json TEXT NOT NULL,

  baseline_snapshot_id TEXT,

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_ai_governance_company
ON memory_ai_governance(company_id);

-- =====================================================
-- DECISION MEMORY
-- =====================================================

CREATE TABLE IF NOT EXISTS memory_decisions (

  memory_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  context_id TEXT NOT NULL,

  domain TEXT NOT NULL,
  subtype TEXT NOT NULL,

  authority_plan TEXT NOT NULL,
  authority_intent TEXT,

  authority_mode TEXT,

  payload_json TEXT NOT NULL,

  baseline_snapshot_id TEXT,

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_decisions_company
ON memory_decisions(company_id);

-- =====================================================
-- EXECUTION MEMORY
-- =====================================================

CREATE TABLE IF NOT EXISTS memory_executions (

  memory_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  context_id TEXT NOT NULL,

  domain TEXT NOT NULL,
  subtype TEXT NOT NULL,

  authority_plan TEXT NOT NULL,
  authority_intent TEXT,

  authority_mode TEXT,

  payload_json TEXT NOT NULL,

  baseline_snapshot_id TEXT,

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_executions_company
ON memory_executions(company_id);

-- =====================================================
-- IMPROVEMENT MEMORY
-- =====================================================

CREATE TABLE IF NOT EXISTS memory_improvements (

  memory_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  context_id TEXT NOT NULL,

  domain TEXT NOT NULL,
  subtype TEXT NOT NULL,

  authority_plan TEXT NOT NULL,
  authority_intent TEXT,

  authority_mode TEXT,

  payload_json TEXT NOT NULL,

  baseline_snapshot_id TEXT,

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_improvements_company
ON memory_improvements(company_id);

-- =====================================================
-- CHARTER MEMORY
-- =====================================================

CREATE TABLE IF NOT EXISTS memory_charter_events (

  memory_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  context_id TEXT NOT NULL,

  domain TEXT NOT NULL,
  subtype TEXT NOT NULL,

  authority_plan TEXT NOT NULL,
  authority_intent TEXT,

  authority_mode TEXT,

  payload_json TEXT NOT NULL,

  baseline_snapshot_id TEXT,

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_charter_company
ON memory_charter_events(company_id);