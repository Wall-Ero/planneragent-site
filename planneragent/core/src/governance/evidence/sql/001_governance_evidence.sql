-- core/src/governance/evidence/sql/001_governance_evidence.sql
-- ============================================================
-- PlannerAgent — Governance Evidence SQL
-- Canonical Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS governance_evidence (
  evidence_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  action TEXT NOT NULL,
  tenant_id TEXT,
  domain TEXT,
  severity TEXT NOT NULL,
  reason TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_governance_evidence_tenant
ON governance_evidence (tenant_id);

CREATE INDEX IF NOT EXISTS idx_governance_evidence_source
ON governance_evidence (source);

CREATE INDEX IF NOT EXISTS idx_governance_evidence_created_at
ON governance_evidence (created_at);