-- =====================================================
-- PlannerAgent — Operational Working Attention
-- Canonical Snapshot · Source of Truth
-- =====================================================
--
-- PURPOSE
-- -----------------------------------------------------
-- Persist temporary human-directed operational focus.
--
-- This table DOES NOT store:
--
-- - authority grants
-- - execution permission
-- - permanent cognition
-- - decision ownership
--
-- It DOES store:
--
-- - what the human asked PlannerAgent to watch
-- - for whom
-- - until when
-- - under which trigger condition
-- - with which notification noise policy
--
-- CORE PRINCIPLE
-- -----------------------------------------------------
-- Attention is future-oriented working memory.
--
-- Memory remembers.
-- Attention watches.
--
-- =====================================================

CREATE TABLE IF NOT EXISTS attention_subscriptions (

  attention_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  context_id TEXT NOT NULL,

  actor_id TEXT NOT NULL,

  scope TEXT NOT NULL,
  trigger TEXT NOT NULL,

  priority TEXT NOT NULL,
  status TEXT NOT NULL,

  noise_policy TEXT NOT NULL,

  target_ref TEXT,
  target_label TEXT,

  human_request TEXT NOT NULL,

  condition_json TEXT,
  metadata_json TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  expires_at TEXT,

  last_checked_at TEXT,
  last_triggered_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_attention_company
ON attention_subscriptions(company_id);

CREATE INDEX IF NOT EXISTS idx_attention_actor
ON attention_subscriptions(actor_id);

CREATE INDEX IF NOT EXISTS idx_attention_status
ON attention_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_attention_scope
ON attention_subscriptions(scope);

CREATE INDEX IF NOT EXISTS idx_attention_expires
ON attention_subscriptions(expires_at);