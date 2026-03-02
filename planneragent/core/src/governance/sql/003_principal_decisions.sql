-- CANONICAL SNAPSHOT
-- File: src/governance/sql/003_principal_decisions.sql
-- Tag: canonical/v1-principal-ledger
-- Status: Source of Truth

CREATE TABLE IF NOT EXISTS principal_decisions (
  id TEXT PRIMARY KEY,                -- UUID decision

  created_at TEXT NOT NULL,

  company_id TEXT NOT NULL,

  principal_actor TEXT NOT NULL,      -- human id / email / wallet

  domain TEXT NOT NULL,               -- supply_chain, finance, production
  intent TEXT NOT NULL,               -- ALLOCATE, COMMIT, REALLOCATE

  description TEXT NOT NULL,          -- human-readable summary

  scenario_reference TEXT,            -- link to scenario id (from sandbox)

  budget_impact_eur REAL NOT NULL,    -- signed (+/-)

  resource_type TEXT,                 -- budget, inventory, capacity
  resource_reference TEXT,            -- item id, warehouse id, contract id

  delegation_scope TEXT,              -- NONE | LIMITED | FULL

  execution_status TEXT NOT NULL,     -- APPROVED | EXECUTED | REJECTED | ROLLED_BACK

  executed_at TEXT,
  rollback_reference TEXT,

  llm_assisted INTEGER NOT NULL,      -- 1 if LLM supported reasoning
  llm_request_id TEXT,                -- correlation to llm_usage.request_id

  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_principal_company
ON principal_decisions(company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_principal_actor
ON principal_decisions(principal_actor);