-- core/src/executor/sql/001_executor_audit_v1.sql
-- ======================================================
-- Executor Audit Table — D1 v1
-- Canonical Source of Truth
-- ======================================================

CREATE TABLE IF NOT EXISTS executor_audit_v1 (
  audit_ref TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  request_id TEXT NOT NULL,

  actor_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  intent TEXT NOT NULL,
  domain TEXT NOT NULL,

  action_type TEXT NOT NULL,

  mode TEXT NOT NULL, -- "preview" | "run"
  performed INTEGER NOT NULL, -- 0/1

  governance_json TEXT NOT NULL,
  result_json TEXT NOT NULL,

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_executor_audit_v1_company_time
  ON executor_audit_v1 (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_executor_audit_v1_request
  ON executor_audit_v1 (request_id);