-- planneragent/core/src/finance/fdc.d1.sql

CREATE TABLE IF NOT EXISTS fdc_commits (
  fdc_id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  generated_at TEXT NOT NULL,

  decision_id TEXT NOT NULL,
  decision_layer TEXT NOT NULL,

  financial_intent TEXT NOT NULL,
  budget_owner TEXT NOT NULL,
  budget_limit REAL NOT NULL,
  approval_mode TEXT NOT NULL,

  amount REAL NOT NULL,
  currency TEXT NOT NULL,

  status TEXT NOT NULL,

  purpose TEXT NOT NULL,
  constraints_json TEXT NOT NULL,

  ord_status TEXT NOT NULL,
  fdg_policy_version TEXT NOT NULL,
  dlci_version TEXT,

  system_signature TEXT NOT NULL,
  human_signature TEXT NOT NULL,

  previous_fdc_id TEXT,
  chain_hash TEXT NOT NULL,

  idempotency_key TEXT NOT NULL,
  request_id TEXT,
  actor_user_id TEXT,

  notes TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS fdc_idempotency_uq
ON fdc_commits(company_id, idempotency_key);

CREATE INDEX IF NOT EXISTS fdc_company_time_idx
ON fdc_commits(company_id, generated_at);

CREATE INDEX IF NOT EXISTS fdc_decision_idx
ON fdc_commits(company_id, decision_id);
