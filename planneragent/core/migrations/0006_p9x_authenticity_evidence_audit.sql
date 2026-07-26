CREATE TABLE IF NOT EXISTS p9x_authenticity_evidence (
  evidence_id TEXT PRIMARY KEY,
  certificate_id TEXT NOT NULL UNIQUE,
  certificate_digest TEXT NOT NULL,
  certificate_digest_algorithm TEXT NOT NULL,
  certificate_json TEXT NOT NULL,
  cryptographic_operation_id TEXT NOT NULL,
  cryptographic_context_id TEXT NOT NULL,
  provider_key_reference TEXT NOT NULL,
  persisted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS p9x_authenticity_audit_records (
  audit_record_id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL UNIQUE,
  certificate_id TEXT NOT NULL UNIQUE,
  audit_event TEXT NOT NULL,
  audit_record_digest TEXT NOT NULL,
  audit_record_digest_algorithm TEXT NOT NULL,
  persisted_at TEXT NOT NULL
);
