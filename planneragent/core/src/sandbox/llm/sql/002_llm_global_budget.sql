-- CANONICAL SNAPSHOT
-- File: src/sandbox/llm/sql/002_llm_global_budget.sql
-- Tag: canonical/v2-governance-budget
-- Status: Source of Truth

CREATE TABLE IF NOT EXISTS llm_global_budget (
  id TEXT PRIMARY KEY,
  pool_name TEXT NOT NULL,         -- es. "BASIC_GLOBAL"
  monthly_cap_eur REAL NOT NULL,  -- es. 5.00
  monthly_used_eur REAL NOT NULL DEFAULT 0,
  reset_at TEXT NOT NULL
);

INSERT OR IGNORE INTO llm_global_budget (
  id,
  pool_name,
  monthly_cap_eur,
  monthly_used_eur,
  reset_at
) VALUES (
  'basic-global',
  'BASIC_GLOBAL',
  5.00,
  0,
  datetime('now', 'start of month', '+1 month')
);