-- core/src/governance/oag/sql/001_oag_d1.sql
-- ======================================================
-- OAG — Organizational Authority Graph (D1 / SQLite) v1
-- Canonical Source of Truth (enterprise-ready)
-- ======================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------
-- 1) Actors
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS oag_actors (
  company_id     TEXT NOT NULL,
  actor_id       TEXT NOT NULL,
  actor_type     TEXT NOT NULL CHECK (actor_type IN ('human','service','board')),
  display_name   TEXT,
  is_active      INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (company_id, actor_id)
);

CREATE INDEX IF NOT EXISTS idx_oag_actors_company_active
ON oag_actors(company_id, is_active);

-- ------------------------------------------------------
-- 2) Delegations (authority edges)
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS oag_delegations (
  delegation_id   TEXT NOT NULL,                 -- e.g. "delg_..." uuid
  company_id      TEXT NOT NULL,

  from_actor_id   TEXT NOT NULL,
  to_actor_id     TEXT NOT NULL,

  plan            TEXT NOT NULL CHECK (plan IN ('VISION','GRADUATE','JUNIOR','SENIOR','PRINCIPAL','CHARTER')),
  domain          TEXT NOT NULL,                 -- keep as TEXT; domain registry enforced at API boundary

  intents_json    TEXT NOT NULL,                 -- JSON array: ["ADVISE","EXECUTE","WARN"]
  sponsor_id      TEXT,                          -- optional sponsor chain
  issued_by       TEXT NOT NULL CHECK (issued_by IN ('human','board','system')),

  issued_at       TEXT NOT NULL,                 -- ISO-8601
  expires_at      TEXT,                          -- ISO-8601 nullable
  revoked_at      TEXT,                          -- ISO-8601 nullable
  revoked_by      TEXT,                          -- actor_id nullable

  note            TEXT,

  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  PRIMARY KEY (delegation_id),

  -- Soft-integrity: ensure “no self delegation” at storage too
  CHECK (from_actor_id <> to_actor_id),

  FOREIGN KEY (company_id, from_actor_id)
    REFERENCES oag_actors(company_id, actor_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  FOREIGN KEY (company_id, to_actor_id)
    REFERENCES oag_actors(company_id, actor_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

-- Fast lookups for runtime validation
CREATE INDEX IF NOT EXISTS idx_oag_delegations_lookup_active
ON oag_delegations(company_id, to_actor_id, plan, domain);

CREATE INDEX IF NOT EXISTS idx_oag_delegations_from
ON oag_delegations(company_id, from_actor_id);

CREATE INDEX IF NOT EXISTS idx_oag_delegations_revoked
ON oag_delegations(company_id, revoked_at);

CREATE INDEX IF NOT EXISTS idx_oag_delegations_expires
ON oag_delegations(company_id, expires_at);

-- Prevent exact duplicates for same edge “shape” (revocation creates a new row)
-- NOTE: intents_json included; use stable JSON encoding in app (sorted, no spaces).
CREATE UNIQUE INDEX IF NOT EXISTS uq_oag_delegations_shape
ON oag_delegations(company_id, from_actor_id, to_actor_id, plan, domain, intents_json, issued_at);

-- ------------------------------------------------------
-- 3) Graph versioning / snapshots (optional but enterprise-friendly)
--    Useful for audit + deterministic playback
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS oag_graph_snapshots (
  snapshot_id     TEXT NOT NULL,                 -- e.g. "snap_..." uuid
  company_id      TEXT NOT NULL,
  graph_json      TEXT NOT NULL,                 -- JSON payload {company_id, actors[], delegations[]}
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_by      TEXT,                          -- actor_id that triggered snapshot
  reason          TEXT,
  PRIMARY KEY (snapshot_id)
);

CREATE INDEX IF NOT EXISTS idx_oag_graph_snapshots_company_time
ON oag_graph_snapshots(company_id, created_at);

-- ------------------------------------------------------
-- 4) Audit log (who changed OAG, when, and why)
-- ------------------------------------------------------
CREATE TABLE IF NOT EXISTS oag_audit_log (
  audit_id        TEXT NOT NULL,                 -- e.g. "aud_..." uuid
  company_id      TEXT NOT NULL,
  actor_id        TEXT,                          -- who performed the change (nullable for system)
  action          TEXT NOT NULL CHECK (action IN (
                    'ACTOR_UPSERT',
                    'ACTOR_DEACTIVATE',
                    'DELEGATION_CREATE',
                    'DELEGATION_REVOKE',
                    'SNAPSHOT_CREATE'
                  )),
  target_id       TEXT,                          -- delegation_id / (company_id|actor_id) / snapshot_id
  payload_json    TEXT,                          -- details for audit
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (audit_id)
);

CREATE INDEX IF NOT EXISTS idx_oag_audit_company_time
ON oag_audit_log(company_id, created_at);