CREATE TABLE oir_authentication_evidence_replay (
  replay_key TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL UNIQUE,
  nonce TEXT NOT NULL,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  reserved_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  CHECK (expires_at > reserved_at)
);

CREATE TRIGGER oir_authentication_evidence_replay_no_update
BEFORE UPDATE ON oir_authentication_evidence_replay
BEGIN
  SELECT RAISE(ABORT, 'OIR_AUTHENTICATION_REPLAY_RECORD_IMMUTABLE');
END;

CREATE TRIGGER oir_authentication_evidence_replay_no_delete
BEFORE DELETE ON oir_authentication_evidence_replay
BEGIN
  SELECT RAISE(ABORT, 'OIR_AUTHENTICATION_REPLAY_RECORD_IMMUTABLE');
END;

CREATE TABLE oir_authentication_audit_events (
  authentication_audit_event_id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL,
  authentication_source TEXT NOT NULL,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  external_authentication_identity_id TEXT,
  principal_id TEXT,
  session_id TEXT,
  verification_result TEXT NOT NULL CHECK (verification_result IN ('VERIFIED', 'REJECTED')),
  outcome TEXT NOT NULL CHECK (outcome IN ('AUTHENTICATED', 'REJECTED', 'RESTORED', 'ROTATED', 'LOGGED_OUT', 'REVOKED')),
  assurance TEXT NOT NULL CHECK (assurance IN ('SINGLE_FACTOR', 'MULTI_FACTOR', 'PHISHING_RESISTANT', 'WORKLOAD_ATTESTED')),
  verification_reference TEXT,
  failure_code TEXT,
  evidence_issued_at TEXT NOT NULL,
  evidence_expires_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  evidence_lineage_json TEXT NOT NULL,
  executing_runtime TEXT NOT NULL,
  FOREIGN KEY (external_authentication_identity_id) REFERENCES oir_external_authentication_bindings(external_authentication_identity_id),
  FOREIGN KEY (principal_id) REFERENCES oir_principals(principal_id),
  FOREIGN KEY (session_id) REFERENCES oir_server_sessions(session_id)
);

CREATE TRIGGER oir_authentication_audit_events_no_update
BEFORE UPDATE ON oir_authentication_audit_events
BEGIN
  SELECT RAISE(ABORT, 'OIR_AUTHENTICATION_AUDIT_EVENT_IMMUTABLE');
END;

CREATE TRIGGER oir_authentication_audit_events_no_delete
BEFORE DELETE ON oir_authentication_audit_events
BEGIN
  SELECT RAISE(ABORT, 'OIR_AUTHENTICATION_AUDIT_EVENT_IMMUTABLE');
END;
