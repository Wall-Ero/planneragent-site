CREATE TABLE oir_governed_upload_authorizations (
  authorization_decision_id TEXT PRIMARY KEY
    REFERENCES oir_authorization_decisions(authorization_decision_id),
  participation_context_id TEXT NOT NULL,
  upload_id TEXT NOT NULL UNIQUE,
  correlation_id TEXT NOT NULL,
  audit_lineage_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TRIGGER oir_governed_upload_authorizations_no_update
BEFORE UPDATE ON oir_governed_upload_authorizations
BEGIN
  SELECT RAISE(ABORT, 'OIR_GOVERNED_UPLOAD_AUTHORIZATION_IMMUTABLE');
END;

CREATE TRIGGER oir_governed_upload_authorizations_no_delete
BEFORE DELETE ON oir_governed_upload_authorizations
BEGIN
  SELECT RAISE(ABORT, 'OIR_GOVERNED_UPLOAD_AUTHORIZATION_IMMUTABLE');
END;

CREATE TABLE oir_authorization_audit_events (
  authorization_audit_event_id TEXT PRIMARY KEY,
  event_kind TEXT NOT NULL CHECK (event_kind IN (
    'POLICY_EVALUATED', 'DECISION_ISSUED', 'CONSUMPTION_ADMITTED',
    'CONSUMPTION_REJECTED'
  )),
  authorization_decision_id TEXT
    REFERENCES oir_authorization_decisions(authorization_decision_id),
  decision_result TEXT NOT NULL CHECK (decision_result IN ('ADMITTED', 'DENIED')),
  principal_id TEXT NOT NULL REFERENCES oir_principals(principal_id),
  session_id TEXT NOT NULL REFERENCES oir_server_sessions(session_id),
  membership_id TEXT NOT NULL REFERENCES oir_organization_memberships(membership_id),
  company_id TEXT NOT NULL REFERENCES oir_companies(company_id),
  tenant_id TEXT NOT NULL REFERENCES oir_tenants(tenant_id),
  upload_id TEXT NOT NULL,
  resource TEXT NOT NULL,
  purpose TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  failure_code TEXT,
  correlation_id TEXT NOT NULL,
  causal_references_json TEXT NOT NULL,
  executing_component TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE TRIGGER oir_authorization_audit_events_no_update
BEFORE UPDATE ON oir_authorization_audit_events
BEGIN
  SELECT RAISE(ABORT, 'OIR_AUTHORIZATION_AUDIT_EVENT_IMMUTABLE');
END;

CREATE TRIGGER oir_authorization_audit_events_no_delete
BEFORE DELETE ON oir_authorization_audit_events
BEGIN
  SELECT RAISE(ABORT, 'OIR_AUTHORIZATION_AUDIT_EVENT_IMMUTABLE');
END;
