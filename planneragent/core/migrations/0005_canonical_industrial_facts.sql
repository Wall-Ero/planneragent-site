CREATE TABLE IF NOT EXISTS canonical_industrial_facts (
  persistence_reference TEXT PRIMARY KEY,
  fact_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  source_system TEXT NOT NULL,
  external_object_id TEXT NOT NULL,
  external_object_version TEXT NOT NULL,
  canonical_serialization_version TEXT NOT NULL,
  canonical_json TEXT NOT NULL,
  digest_algorithm TEXT NOT NULL,
  digest_profile TEXT NOT NULL,
  digest_value TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  persisted_at TEXT NOT NULL,
  UNIQUE (tenant_id, fact_id),
  UNIQUE (
    tenant_id, source_system, external_object_id, external_object_version
  )
);

CREATE INDEX IF NOT EXISTS idx_canonical_industrial_facts_source
ON canonical_industrial_facts (
  tenant_id, source_system, external_object_id, external_object_version
);
