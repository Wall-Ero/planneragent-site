CREATE TABLE IF NOT EXISTS trusted_sign_replay_reservations (
  replay_key TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL UNIQUE,
  composition_id TEXT NOT NULL,
  governance_decision_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  provider_key_reference TEXT NOT NULL,
  proof_profile_id TEXT NOT NULL,
  proof_profile_version TEXT NOT NULL,
  reserved_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS trusted_sign_replay_scope_idx
ON trusted_sign_replay_reservations (
  tenant_id,
  company_id,
  reserved_at
);
