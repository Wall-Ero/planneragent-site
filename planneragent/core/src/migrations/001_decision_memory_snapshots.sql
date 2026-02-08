-- core/src/migrations/001_decision_memory_snapshots.sql
-- ============================================
-- Decision Memory — Append Only Ledger
-- Status: CANONICAL · SOURCE OF TRUTH
-- Layer: P1 — Decision Memory
-- ============================================

-- --------------------------------------------------
-- TABLE: decision_memory_snapshots
-- Immutable decision memory ledger
-- Append only — NEVER UPDATE / NEVER DELETE
-- --------------------------------------------------

CREATE TABLE IF NOT EXISTS decision_memory_snapshots (

  -- -------------------------------------------
  -- Primary identity
  -- -------------------------------------------
  snapshot_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  context_id TEXT NOT NULL,

  -- -------------------------------------------
  -- Governance coordinates
  -- -------------------------------------------
  plan TEXT NOT NULL,
  intent TEXT NOT NULL,
  domain TEXT NOT NULL,

  -- -------------------------------------------
  -- Baseline reference
  -- -------------------------------------------
  baseline_snapshot_id TEXT NOT NULL,
  baseline_metrics_json TEXT NOT NULL,

  -- -------------------------------------------
  -- ORD evidence snapshot
  -- -------------------------------------------
  ord_json TEXT NOT NULL,

  -- -------------------------------------------
  -- Hash chain (append only forensic integrity)
  -- -------------------------------------------
  previous_hash TEXT,
  current_hash TEXT NOT NULL,

  -- -------------------------------------------
  -- Temporal truth
  -- -------------------------------------------
  created_at TEXT NOT NULL
);

-- --------------------------------------------------
-- INDEXES (Query performance — NEVER affect integrity)
-- --------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_dms_company_context_time
ON decision_memory_snapshots (
  company_id,
  context_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_dms_tenant_time
ON decision_memory_snapshots (
  tenant_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_dms_company_time
ON decision_memory_snapshots (
  company_id,
  created_at DESC
);

-- --------------------------------------------------
-- APPEND ONLY GUARDS (Soft — enforced at app layer)
-- --------------------------------------------------
-- NOTE:
-- Cloudflare D1 does not support full trigger protection yet.
-- Enforcement must happen in application layer:
--
-- ❌ NO UPDATE
-- ❌ NO DELETE
-- ✅ INSERT ONLY
--
-- If triggers become available → add BLOCK triggers here.
-- --------------------------------------------------