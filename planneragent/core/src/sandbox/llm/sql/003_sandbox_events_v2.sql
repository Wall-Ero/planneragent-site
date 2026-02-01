-- CANONICAL SNAPSHOT
-- File: src/sandbox/llm/sql/003_sandbox_events_v2.sql
-- Tag: canonical/v2-governance-ledger
-- Status: Source of Truth
--
-- sandbox_events_v2_thin
-- Governance Ledger (NOT telemetry, NOT billing)
-- Records authority, intent, and boundary enforcement.
-- Answers: "Who tried to make the system do what — and what did governance allow?"

CREATE TABLE IF NOT EXISTS sandbox_events_v2 (
  event_id TEXT PRIMARY KEY,

  company_id TEXT NOT NULL,
  created_at TEXT NOT NULL,

  plan TEXT NOT NULL,          -- BASIC | JUNIOR | SENIOR | PRINCIPAL
  intent TEXT NOT NULL,        -- INFORM | SENSE | ADVISE | EXECUTE
  domain TEXT NOT NULL,        -- supply_chain | production | logistics | ...

  boundary_status TEXT NOT NULL,  -- ALLOWED | BLOCKED | ESCALATED
  confidence REAL               -- optional governance signal (0..1)
);

-- Optional governance index for auditors / abuse detection
CREATE INDEX IF NOT EXISTS idx_sandbox_events_company_time
  ON sandbox_events_v2 (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_sandbox_events_intent_plan
  ON sandbox_events_v2 (intent, plan);