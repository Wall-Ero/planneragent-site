CREATE TABLE oir_company_selections (
  company_selection_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  membership_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  selected_at TEXT NOT NULL,
  selection_reference TEXT NOT NULL UNIQUE,
  invalidated_at TEXT,
  invalidation_reason TEXT,
  CHECK (
    (invalidated_at IS NULL AND invalidation_reason IS NULL) OR
    (invalidated_at IS NOT NULL AND invalidation_reason IS NOT NULL)
  ),
  FOREIGN KEY (session_id, principal_id) REFERENCES oir_server_sessions(session_id, principal_id),
  FOREIGN KEY (membership_id, principal_id, company_id)
    REFERENCES oir_organization_memberships(membership_id, principal_id, company_id)
);

CREATE UNIQUE INDEX oir_one_current_company_selection_per_session
ON oir_company_selections(session_id)
WHERE invalidated_at IS NULL;

CREATE TABLE oir_participation_audit_events (
  participation_audit_event_id TEXT PRIMARY KEY,
  event_kind TEXT NOT NULL CHECK (event_kind IN (
    'MEMBERSHIP_RESOLUTION', 'COMPANY_RESOLUTION', 'COMPANY_SELECTION',
    'TENANT_RESOLUTION', 'ROLE_RESOLUTION', 'PERMISSION_RESOLUTION',
    'PARTICIPATION_CONTEXT_ISSUED', 'PARTICIPATION_REJECTED',
    'STALE_CONTEXT_REJECTED', 'CROSS_COMPANY_DENIED', 'CROSS_TENANT_DENIED'
  )),
  decision_result TEXT NOT NULL CHECK (decision_result IN ('ADMITTED', 'DENIED')),
  principal_id TEXT NOT NULL REFERENCES oir_principals(principal_id),
  session_id TEXT NOT NULL REFERENCES oir_server_sessions(session_id),
  membership_id TEXT REFERENCES oir_organization_memberships(membership_id),
  company_id TEXT REFERENCES oir_companies(company_id),
  tenant_id TEXT REFERENCES oir_tenants(tenant_id),
  evaluated_role_ids_json TEXT NOT NULL,
  evaluated_permissions_json TEXT NOT NULL,
  failure_code TEXT,
  correlation_id TEXT NOT NULL,
  causal_references_json TEXT NOT NULL,
  executing_component TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE TRIGGER oir_participation_audit_events_no_update
BEFORE UPDATE ON oir_participation_audit_events
BEGIN
  SELECT RAISE(ABORT, 'OIR_PARTICIPATION_AUDIT_EVENT_IMMUTABLE');
END;

CREATE TRIGGER oir_participation_audit_events_no_delete
BEFORE DELETE ON oir_participation_audit_events
BEGIN
  SELECT RAISE(ABORT, 'OIR_PARTICIPATION_AUDIT_EVENT_IMMUTABLE');
END;
