CREATE TABLE oir_principals (
  principal_id TEXT PRIMARY KEY,
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('HUMAN', 'WORKLOAD')),
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED')),
  created_at TEXT NOT NULL
);

CREATE TABLE oir_external_authentication_bindings (
  external_authentication_identity_id TEXT PRIMARY KEY,
  principal_id TEXT NOT NULL REFERENCES oir_principals(principal_id),
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('HUMAN', 'WORKLOAD')),
  provider TEXT NOT NULL,
  issuer TEXT NOT NULL,
  external_subject TEXT NOT NULL,
  authentication_method TEXT NOT NULL,
  assurance TEXT NOT NULL CHECK (assurance IN ('SINGLE_FACTOR', 'MULTI_FACTOR', 'PHISHING_RESISTANT', 'WORKLOAD_ATTESTED')),
  verified_at TEXT NOT NULL,
  verification_reference TEXT NOT NULL,
  UNIQUE (provider, issuer, external_subject),
  UNIQUE (external_authentication_identity_id, principal_id)
);

CREATE TABLE oir_server_sessions (
  session_id TEXT PRIMARY KEY,
  principal_id TEXT NOT NULL REFERENCES oir_principals(principal_id),
  external_authentication_identity_id TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  assurance TEXT NOT NULL CHECK (assurance IN ('SINGLE_FACTOR', 'MULTI_FACTOR', 'PHISHING_RESISTANT', 'WORKLOAD_ATTESTED')),
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('ACTIVE', 'ROTATED', 'EXPIRED', 'REVOKED')),
  revocation_reference TEXT,
  rotated_to_session_id TEXT REFERENCES oir_server_sessions(session_id),
  CHECK (expires_at > issued_at),
  CHECK (
    (lifecycle_state = 'ACTIVE' AND revocation_reference IS NULL AND rotated_to_session_id IS NULL) OR
    (lifecycle_state = 'ROTATED' AND revocation_reference IS NOT NULL AND rotated_to_session_id IS NOT NULL) OR
    (lifecycle_state IN ('EXPIRED', 'REVOKED') AND revocation_reference IS NOT NULL)
  ),
  UNIQUE (session_id, principal_id),
  FOREIGN KEY (external_authentication_identity_id, principal_id)
    REFERENCES oir_external_authentication_bindings(external_authentication_identity_id, principal_id)
);

CREATE TABLE oir_tenants (
  tenant_id TEXT PRIMARY KEY,
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
  created_at TEXT NOT NULL
);

CREATE TABLE oir_companies (
  company_id TEXT PRIMARY KEY,
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED')),
  created_at TEXT NOT NULL
);

CREATE TABLE oir_tenant_company_ownership (
  company_id TEXT NOT NULL REFERENCES oir_companies(company_id),
  tenant_id TEXT NOT NULL REFERENCES oir_tenants(tenant_id),
  effective_from TEXT NOT NULL,
  effective_until TEXT,
  ownership_reference TEXT NOT NULL UNIQUE,
  PRIMARY KEY (company_id, effective_from),
  UNIQUE (tenant_id, company_id),
  CHECK (effective_until IS NULL OR effective_until > effective_from)
);

CREATE UNIQUE INDEX oir_one_current_tenant_per_company
ON oir_tenant_company_ownership(company_id)
WHERE effective_until IS NULL;

CREATE TABLE oir_organization_memberships (
  membership_id TEXT PRIMARY KEY,
  principal_id TEXT NOT NULL REFERENCES oir_principals(principal_id),
  company_id TEXT NOT NULL REFERENCES oir_companies(company_id),
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('REQUESTED', 'INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'REMOVED')),
  created_at TEXT NOT NULL,
  invitation_or_request_reference TEXT,
  activation_reference TEXT,
  activated_at TEXT,
  lifecycle_decision_reference TEXT,
  lifecycle_changed_at TEXT,
  CHECK (
    (lifecycle_state IN ('REQUESTED', 'INVITED') AND invitation_or_request_reference IS NOT NULL AND activation_reference IS NULL AND activated_at IS NULL AND lifecycle_decision_reference IS NULL AND lifecycle_changed_at IS NULL) OR
    (lifecycle_state = 'ACTIVE' AND activation_reference IS NOT NULL AND activated_at IS NOT NULL) OR
    (lifecycle_state IN ('SUSPENDED', 'REVOKED', 'REMOVED') AND lifecycle_decision_reference IS NOT NULL AND lifecycle_changed_at IS NOT NULL)
  ),
  UNIQUE (membership_id, principal_id, company_id)
);

CREATE TRIGGER oir_membership_insert_not_active
BEFORE INSERT ON oir_organization_memberships
WHEN NEW.lifecycle_state = 'ACTIVE'
BEGIN
  SELECT RAISE(ABORT, 'OIR_MEMBERSHIP_ACTIVATION_REQUIRES_EXISTING_REQUEST_OR_INVITATION');
END;

CREATE TRIGGER oir_membership_lifecycle_guard
BEFORE UPDATE ON oir_organization_memberships
WHEN NOT (
  (OLD.lifecycle_state IN ('REQUESTED', 'INVITED') AND NEW.lifecycle_state IN ('ACTIVE', 'REVOKED', 'REMOVED')) OR
  (OLD.lifecycle_state = 'ACTIVE' AND NEW.lifecycle_state IN ('SUSPENDED', 'REVOKED', 'REMOVED')) OR
  (OLD.lifecycle_state = 'SUSPENDED' AND NEW.lifecycle_state IN ('ACTIVE', 'REVOKED', 'REMOVED'))
)
BEGIN
  SELECT RAISE(ABORT, 'OIR_MEMBERSHIP_LIFECYCLE_TRANSITION_INVALID');
END;

CREATE TABLE oir_platform_roles (
  platform_role_id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE oir_platform_permissions (
  platform_permission_id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (code IN ('VIEW_COCKPIT', 'UPLOAD_DATA', 'MANAGE_PROFILE', 'SELECT_COMPANY', 'REQUEST_ROLE_CONFIRMATION')),
  description TEXT NOT NULL
);

CREATE TABLE oir_role_permission_assignments (
  platform_role_id TEXT NOT NULL REFERENCES oir_platform_roles(platform_role_id),
  platform_permission_id TEXT NOT NULL REFERENCES oir_platform_permissions(platform_permission_id),
  assigned_at TEXT NOT NULL,
  assignment_reference TEXT NOT NULL UNIQUE,
  PRIMARY KEY (platform_role_id, platform_permission_id)
);

CREATE TABLE oir_membership_role_assignments (
  membership_id TEXT NOT NULL REFERENCES oir_organization_memberships(membership_id),
  platform_role_id TEXT NOT NULL REFERENCES oir_platform_roles(platform_role_id),
  assigned_at TEXT NOT NULL,
  assignment_reference TEXT NOT NULL UNIQUE,
  revoked_at TEXT,
  revocation_reference TEXT,
  PRIMARY KEY (membership_id, platform_role_id, assigned_at),
  CHECK ((revoked_at IS NULL AND revocation_reference IS NULL) OR (revoked_at IS NOT NULL AND revocation_reference IS NOT NULL))
);

CREATE UNIQUE INDEX oir_one_current_membership_role_assignment
ON oir_membership_role_assignments(membership_id, platform_role_id)
WHERE revoked_at IS NULL;

CREATE TABLE oir_authorization_decisions (
  authorization_decision_id TEXT PRIMARY KEY,
  permission TEXT NOT NULL CHECK (permission IN ('VIEW_COCKPIT', 'UPLOAD_DATA', 'MANAGE_PROFILE', 'SELECT_COMPANY', 'REQUEST_ROLE_CONFIRMATION')),
  decision TEXT NOT NULL CHECK (decision IN ('ADMITTED', 'DENIED')),
  principal_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  membership_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  resource TEXT NOT NULL,
  purpose TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  CHECK (expires_at > issued_at),
  FOREIGN KEY (session_id, principal_id) REFERENCES oir_server_sessions(session_id, principal_id),
  FOREIGN KEY (membership_id, principal_id, company_id) REFERENCES oir_organization_memberships(membership_id, principal_id, company_id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES oir_tenant_company_ownership(tenant_id, company_id)
);

CREATE TRIGGER oir_authorization_decisions_no_update
BEFORE UPDATE ON oir_authorization_decisions
BEGIN
  SELECT RAISE(ABORT, 'OIR_AUTHORIZATION_DECISION_IMMUTABLE');
END;

CREATE TRIGGER oir_authorization_decisions_no_delete
BEFORE DELETE ON oir_authorization_decisions
BEGIN
  SELECT RAISE(ABORT, 'OIR_AUTHORIZATION_DECISION_IMMUTABLE');
END;

CREATE TABLE oir_authorization_consumptions (
  authorization_decision_id TEXT PRIMARY KEY REFERENCES oir_authorization_decisions(authorization_decision_id),
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('ISSUED', 'CONSUMED')),
  issued_at TEXT NOT NULL,
  consumed_at TEXT,
  consumption_reference TEXT UNIQUE,
  CHECK (
    (lifecycle_state = 'ISSUED' AND consumed_at IS NULL AND consumption_reference IS NULL) OR
    (lifecycle_state = 'CONSUMED' AND consumed_at IS NOT NULL AND consumption_reference IS NOT NULL)
  )
);

CREATE TRIGGER oir_authorization_consumption_guard
BEFORE UPDATE ON oir_authorization_consumptions
WHEN NOT (OLD.lifecycle_state = 'ISSUED' AND NEW.lifecycle_state = 'CONSUMED')
BEGIN
  SELECT RAISE(ABORT, 'OIR_AUTHORIZATION_CONSUMPTION_TRANSITION_INVALID');
END;

CREATE TRIGGER oir_authorization_consumption_no_delete
BEFORE DELETE ON oir_authorization_consumptions
BEGIN
  SELECT RAISE(ABORT, 'OIR_AUTHORIZATION_CONSUMPTION_HISTORY_IMMUTABLE');
END;

CREATE TABLE oir_identity_audit_events (
  audit_event_id TEXT PRIMARY KEY,
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('HUMAN', 'WORKLOAD')),
  external_authentication_identity_id TEXT NOT NULL,
  executing_component TEXT NOT NULL,
  principal_id TEXT NOT NULL REFERENCES oir_principals(principal_id),
  session_id TEXT NOT NULL,
  participation_context_id TEXT,
  authorization_decision_id TEXT REFERENCES oir_authorization_decisions(authorization_decision_id),
  correlation_id TEXT NOT NULL,
  caused_by_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  FOREIGN KEY (external_authentication_identity_id, principal_id)
    REFERENCES oir_external_authentication_bindings(external_authentication_identity_id, principal_id),
  FOREIGN KEY (session_id, principal_id)
    REFERENCES oir_server_sessions(session_id, principal_id)
);

CREATE TRIGGER oir_identity_audit_events_no_update
BEFORE UPDATE ON oir_identity_audit_events
BEGIN
  SELECT RAISE(ABORT, 'OIR_IDENTITY_AUDIT_EVENT_IMMUTABLE');
END;

CREATE TRIGGER oir_identity_audit_events_no_delete
BEFORE DELETE ON oir_identity_audit_events
BEGIN
  SELECT RAISE(ABORT, 'OIR_IDENTITY_AUDIT_EVENT_IMMUTABLE');
END;

CREATE TRIGGER oir_principal_identity_immutable
BEFORE UPDATE OF principal_id, actor_kind, created_at ON oir_principals
BEGIN
  SELECT RAISE(ABORT, 'OIR_PRINCIPAL_IDENTITY_IMMUTABLE');
END;
