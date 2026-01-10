CREATE TABLE IF NOT EXISTS llm_usage (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,

  company_id TEXT NOT NULL,
  plan TEXT NOT NULL,              -- BASIC | JUNIOR | SENIOR

  provider_id TEXT NOT NULL,        -- openai | openrouter | oss | mock
  model TEXT,                       -- es. gpt-4o-mini, mistral-7b, llama3
  provider_type TEXT NOT NULL,      -- paid | free | oss

  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,

  cost_eur REAL NOT NULL DEFAULT 0, -- stimato o reale
  success INTEGER NOT NULL,         -- 1 / 0
  fallback INTEGER NOT NULL,        -- 1 / 0

  request_id TEXT                  -- correlazione (sandbox event id)
);