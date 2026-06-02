-- ============================================================
-- PlannerAgent — Governance Ledger
-- Canonical Source of Truth
-- ============================================================
--
-- PATH
-- ------------------------------------------------------------
-- core/src/governance/ledger/sql/001_governance_ledger.sql
--
-- STATUS
-- ------------------------------------------------------------
-- CANONICAL SOURCE OF TRUTH
--
-- CATEGORY
-- ------------------------------------------------------------
-- Immutable Governance Ledger Persistence
--
-- PURPOSE
-- ------------------------------------------------------------
-- Persist immutable governance ledger records.
--
-- CORE PRINCIPLE
-- ------------------------------------------------------------
-- Evidence proves.
-- Ledger remembers.
--
-- Governance responsibility records must remain
-- reconstructable across runtime lifecycles.
--
-- DOES NOT:
-- - generate evidence
-- - verify continuity
-- - verify sequence integrity
-- - perform cryptography
-- - enforce governance policy
--
-- DOES:
-- - preserve ledger records
-- - preserve chain continuity metadata
-- - preserve responsibility history
--
-- CANONICAL RESPONSIBILITY
-- ------------------------------------------------------------
-- Store governance ledger records.
--
-- Nothing else.
--
-- ============================================================

CREATE TABLE IF NOT EXISTS governance_ledger (

    -- --------------------------------------------------------
    -- IDENTITY
    -- --------------------------------------------------------

    ledger_id TEXT PRIMARY KEY,

    evidence_id TEXT NOT NULL,

    tenant_id TEXT,

    -- --------------------------------------------------------
    -- GOVERNANCE DOMAIN
    -- --------------------------------------------------------

    domain TEXT NOT NULL,

    -- --------------------------------------------------------
    -- CHAIN CONTINUITY
    -- --------------------------------------------------------

    previous_hash TEXT,

    current_hash TEXT NOT NULL,

    sequence_number INTEGER NOT NULL,

    immutable INTEGER NOT NULL,

    -- --------------------------------------------------------
    -- TEMPORAL
    -- --------------------------------------------------------

    created_at TEXT NOT NULL

);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_governance_ledger_ledger_id
ON governance_ledger (
    ledger_id
);

CREATE INDEX IF NOT EXISTS
idx_governance_ledger_evidence_id
ON governance_ledger (
    evidence_id
);

CREATE INDEX IF NOT EXISTS
idx_governance_ledger_tenant_id
ON governance_ledger (
    tenant_id
);

CREATE INDEX IF NOT EXISTS
idx_governance_ledger_domain
ON governance_ledger (
    domain
);

CREATE INDEX IF NOT EXISTS
idx_governance_ledger_sequence
ON governance_ledger (
    sequence_number
);

CREATE INDEX IF NOT EXISTS
idx_governance_ledger_created_at
ON governance_ledger (
    created_at
);