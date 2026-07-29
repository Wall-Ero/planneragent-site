CREATE TABLE oir_governed_upload_admissions (
  admitted_object_id TEXT PRIMARY KEY,
  acquisition_id TEXT NOT NULL UNIQUE,
  authorization_decision_id TEXT NOT NULL UNIQUE
    REFERENCES oir_authorization_decisions(authorization_decision_id),
  upload_operational_context_id TEXT NOT NULL UNIQUE,
  participation_context_id TEXT NOT NULL,
  upload_id TEXT NOT NULL UNIQUE,
  principal_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  membership_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  ownership_reference TEXT NOT NULL,
  permission TEXT NOT NULL,
  resource TEXT NOT NULL,
  purpose TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  authorization_reference TEXT NOT NULL,
  consumption_reference TEXT NOT NULL UNIQUE,
  replay_state_reference TEXT NOT NULL,
  acquisition_profile TEXT NOT NULL,
  interpretation_registry_version TEXT NOT NULL,
  quarantine_reference TEXT NOT NULL,
  inspection_id TEXT NOT NULL,
  malware_scan_id TEXT NOT NULL,
  detected_format TEXT NOT NULL,
  byte_digest_algorithm TEXT NOT NULL CHECK (byte_digest_algorithm = 'SHA-256'),
  byte_digest TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length > 0),
  authorization_issued_at TEXT NOT NULL,
  authorization_expires_at TEXT NOT NULL,
  consumed_at TEXT NOT NULL,
  admitted_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  audit_lineage_json TEXT NOT NULL
);

CREATE TRIGGER oir_governed_upload_admissions_no_update
BEFORE UPDATE ON oir_governed_upload_admissions
BEGIN
  SELECT RAISE(ABORT, 'OIR_GOVERNED_UPLOAD_ADMISSION_IMMUTABLE');
END;

CREATE TRIGGER oir_governed_upload_admissions_no_delete
BEFORE DELETE ON oir_governed_upload_admissions
BEGIN
  SELECT RAISE(ABORT, 'OIR_GOVERNED_UPLOAD_ADMISSION_IMMUTABLE');
END;
