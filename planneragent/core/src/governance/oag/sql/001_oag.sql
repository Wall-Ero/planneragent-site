//src/governance/oag/sql/001_oag.sql

-- CANONICAL SNAPSHOT
-- File: src/governance/oag/sql/001_oag.sql
-- Tag: canonical/v1-oag
-- Status: Source of Truth

-- =========================
-- Nodes: identities in org
-- =========================
CREATE TABLE IF NOT EXISTS oag_nodes (
  id TEXT PRIMARY KEY,                -- e.g. user:123, role:planner, system:planneragent
  company_id TEXT NOT NULL,
  node_type TEXT NOT NULL,            -- user | role | team | system
  display_name TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oag_nodes_company
  ON oag_nodes(company_id);

-- =========================
-- Links: authority edges
-- =========================
CREATE TABLE IF NOT EXISTS oag_links (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,

  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,

  relation TEXT NOT NULL,             -- approves | delegates | sponsors | owns_budget | may_use_ai
  domain TEXT NOT NULL,               -- supply_chain | production | logistics | "*"
  max_plan TEXT NOT NULL,             -- BASIC | JUNIOR | SENIOR | PRINCIPAL | CHARTER
  max_intent TEXT NOT NULL,           -- INFORM | SENSE | ADVISE | EXECUTE

  valid_from TEXT NOT NULL,
  valid_to TEXT,                      -- nullable = open-ended

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oag_links_company
  ON oag_links(company_id);

CREATE INDEX IF NOT EXISTS idx_oag_links_from
  ON oag_links(company_id, from_id);

CREATE INDEX IF NOT EXISTS idx_oag_links_to
  ON oag_links(company_id, to_id);

-- =========================
-- Attestations: who verified the link
-- =========================
CREATE TABLE IF NOT EXISTS oag_attestations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,

  link_id TEXT NOT NULL,
  attested_by TEXT NOT NULL,          -- user/system/policy
  attestation_type TEXT NOT NULL,     -- human | policy | board
  note TEXT,

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oag_att_company
  ON oag_attestations(company_id);

CREATE INDEX IF NOT EXISTS idx_oag_att_link
  ON oag_attestations(company_id, link_id);