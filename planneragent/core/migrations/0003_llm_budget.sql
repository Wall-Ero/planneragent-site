-- ===============================
-- LLM Budget & Redistribution v1
-- ===============================

-- Budget globale LLM (pool condiviso)
CREATE TABLE IF NOT EXISTS llm_global_budget (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,                  -- YYYY-MM
  total_budget_eur REAL NOT NULL,        -- es. 50.00
  used_budget_eur REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

-- Budget allocato per company (vista logica)
CREATE TABLE IF NOT EXISTS llm_company_usage (
  company_id TEXT NOT NULL,
  month TEXT NOT NULL,                   -- YYYY-MM
  plan_tier TEXT NOT NULL,               -- BASIC | JUNIOR | SENIOR
  llm_calls INTEGER NOT NULL DEFAULT 0,
  estimated_cost_eur REAL NOT NULL DEFAULT 0,
  last_call_at TEXT,
  PRIMARY KEY (company_id, month)
);

-- Redistribuzione: contributi da piani paganti
CREATE TABLE IF NOT EXISTS llm_redistribution (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  source_plan TEXT NOT NULL,             -- JUNIOR | SENIOR
  source_company_id TEXT,
  contribution_eur REAL NOT NULL,
  created_at TEXT NOT NULL
);

-- Audit opzionale (utile più avanti)
CREATE TABLE IF NOT EXISTS llm_call_log (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  plan_tier TEXT NOT NULL,
  provider TEXT NOT NULL,                -- openai | mistral | openrouter
  model TEXT NOT NULL,
  estimated_cost_eur REAL NOT NULL,
  created_at TEXT NOT NULL
);
