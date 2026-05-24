-- =====================================================
-- PlannerAgent — Synthetic Cognition Memory
-- Canonical Snapshot · Source of Truth
-- =====================================================
--
-- PURPOSE
-- -----------------------------------------------------
-- Persist governed experiential operational learning.
--
-- This layer DOES NOT:
--
-- - define reality
-- - define authority
-- - expand execution scope
-- - autonomously create actions
-- - bypass governance
--
-- It DOES:
--
-- - consolidate repeated operational experience
-- - persist stabilized behavioral patterns
-- - preserve operational coherence memory
-- - derive procedural operational heuristics
-- - support runtime cognition confidence
--
-- CORE PRINCIPLE
-- -----------------------------------------------------
-- Synthetic cognition remembers
-- how operational reality repeatedly stabilizes.
--
-- Events
-- → Patterns
-- → Experience
-- → Procedural memory
--
-- =====================================================



-- =====================================================
-- EXPERIENTIAL PATTERNS
-- =====================================================

CREATE TABLE IF NOT EXISTS cognition_synthesis_patterns (

  synthesis_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,

  context_id TEXT NOT NULL,

  domain TEXT NOT NULL,

  pattern_type TEXT NOT NULL,

  pattern_signature TEXT NOT NULL,

  occurrence_count INTEGER NOT NULL,

  confidence REAL NOT NULL,

  stabilization_score REAL NOT NULL,

  evidence_json TEXT,

  first_observed_at TEXT NOT NULL,

  last_observed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS
idx_cognition_synthesis_company
ON cognition_synthesis_patterns(company_id);

CREATE INDEX IF NOT EXISTS
idx_cognition_synthesis_pattern
ON cognition_synthesis_patterns(pattern_type);



-- =====================================================
-- PROCEDURAL MEMORY
-- =====================================================

CREATE TABLE IF NOT EXISTS cognition_procedural_memory (

  procedural_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,

  context_id TEXT NOT NULL,

  domain TEXT NOT NULL,

  trigger_signature TEXT NOT NULL,

  preferred_action TEXT NOT NULL,

  confidence REAL NOT NULL,

  reinforcement_count INTEGER NOT NULL,

  stabilization_score REAL NOT NULL,

  heuristic_json TEXT,

  first_learned_at TEXT NOT NULL,

  last_reinforced_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS
idx_procedural_company
ON cognition_procedural_memory(company_id);

CREATE INDEX IF NOT EXISTS
idx_procedural_trigger
ON cognition_procedural_memory(trigger_signature);



-- =====================================================
-- EXPERIENCE TIMELINE
-- =====================================================

CREATE TABLE IF NOT EXISTS cognition_experience_timeline (

  experience_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,

  context_id TEXT NOT NULL,

  domain TEXT NOT NULL,

  experience_type TEXT NOT NULL,

  experience_signature TEXT NOT NULL,

  execution_outcome TEXT NOT NULL,

  confidence REAL,

  metadata_json TEXT,

  observed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS
idx_experience_company
ON cognition_experience_timeline(company_id);



-- =====================================================
-- SYNTHESIS SNAPSHOT
-- =====================================================

CREATE TABLE IF NOT EXISTS cognition_synthesis_snapshot (

  snapshot_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,

  context_id TEXT NOT NULL,

  procedural_memory_count INTEGER,

  active_patterns_count INTEGER,

  average_stabilization REAL,

  cognition_confidence REAL,

  runtime_trust REAL,

  signals_json TEXT,

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS
idx_synthesis_snapshot_company
ON cognition_synthesis_snapshot(company_id);