CREATE TABLE platform_operational_authority_proofs (
  authority_proof_id TEXT PRIMARY KEY, platform_tenant_id TEXT NOT NULL REFERENCES oir_tenants(tenant_id),
  platform_company_id TEXT NOT NULL REFERENCES oir_companies(company_id), actor_id TEXT NOT NULL,
  principal_id TEXT NOT NULL REFERENCES oir_principals(principal_id), membership_id TEXT NOT NULL,
  authority_domain TEXT NOT NULL CHECK(authority_domain='PLATFORM_OPERATIONS'), effective_scope_json TEXT NOT NULL,
  confirmation_chain_reference TEXT NOT NULL, delegation_references_json TEXT NOT NULL,
  graph_version TEXT NOT NULL, eligibility_state TEXT NOT NULL CHECK(eligibility_state IN('ELIGIBLE','INELIGIBLE')),
  drift_state TEXT NOT NULL CHECK(drift_state IN('CURRENT','DRIFTED')), issued_at TEXT NOT NULL, expires_at TEXT NOT NULL,
  policy_version TEXT NOT NULL, causal_references_json TEXT NOT NULL,
  FOREIGN KEY(membership_id,principal_id,platform_company_id) REFERENCES oir_organization_memberships(membership_id,principal_id,company_id)
);
CREATE TABLE platform_alert_recipient_entitlements (
  entitlement_id TEXT PRIMARY KEY, version INTEGER NOT NULL CHECK(version=1), platform_tenant_id TEXT NOT NULL,
  platform_company_id TEXT NOT NULL, actor_id TEXT NOT NULL, principal_id TEXT NOT NULL, membership_id TEXT NOT NULL,
  authority_domain TEXT NOT NULL CHECK(authority_domain='PLATFORM_OPERATIONS'), authority_proof_id TEXT NOT NULL REFERENCES platform_operational_authority_proofs(authority_proof_id),
  family TEXT NOT NULL CHECK(family='PLATFORM_OPERATIONAL_ALERT'), purpose TEXT NOT NULL CHECK(purpose='GOVERNED_DELIVERY_REVIEW'),
  urgency_ceiling TEXT NOT NULL CHECK(urgency_ceiling IN('REVIEW_REQUIRED','URGENT_REVIEW')),
  allowed_channels_json TEXT NOT NULL, preferred_channel TEXT NOT NULL CHECK(preferred_channel IN('EMAIL','SMS','WHATSAPP')),
  recipient_priority TEXT NOT NULL CHECK(recipient_priority IN('PRIMARY','SUPERVISOR_FALLBACK')),
  supervisor_fallback_authorized INTEGER NOT NULL CHECK(supervisor_fallback_authorized IN(0,1)),
  lifecycle_state TEXT NOT NULL CHECK(lifecycle_state IN('ACTIVE','INACTIVE','REVOKED')),
  effective_at TEXT NOT NULL, expires_at TEXT NOT NULL, correlation_id TEXT NOT NULL, causal_references_json TEXT NOT NULL
);
CREATE UNIQUE INDEX platform_one_active_primary_entitlement ON platform_alert_recipient_entitlements(platform_company_id,authority_domain,family,purpose) WHERE lifecycle_state='ACTIVE' AND recipient_priority='PRIMARY';
CREATE TABLE platform_alert_recipient_endpoints (
  endpoint_id TEXT PRIMARY KEY, entitlement_id TEXT NOT NULL REFERENCES platform_alert_recipient_entitlements(entitlement_id),
  actor_id TEXT NOT NULL, channel TEXT NOT NULL CHECK(channel IN('EMAIL','SMS','WHATSAPP')), normalized_destination TEXT NOT NULL,
  destination_digest TEXT NOT NULL, lifecycle_state TEXT NOT NULL CHECK(lifecycle_state IN('ACTIVE','INACTIVE','REVOKED')),
  verification_state TEXT NOT NULL CHECK(verification_state IN('VERIFIED','UNVERIFIED')),
  effective_at TEXT NOT NULL, expires_at TEXT NOT NULL, verification_reference TEXT NOT NULL, causal_references_json TEXT NOT NULL,
  UNIQUE(entitlement_id,channel)
);
CREATE TABLE platform_alert_entitlement_revocations (entitlement_id TEXT PRIMARY KEY REFERENCES platform_alert_recipient_entitlements(entitlement_id),revoked_at TEXT NOT NULL,revocation_reference TEXT NOT NULL);
CREATE TABLE platform_alert_endpoint_revocations (endpoint_id TEXT PRIMARY KEY REFERENCES platform_alert_recipient_endpoints(endpoint_id),revoked_at TEXT NOT NULL,revocation_reference TEXT NOT NULL);
CREATE TABLE platform_alert_recipient_resolution_decisions (
  resolution_id TEXT PRIMARY KEY, eligibility_id TEXT NOT NULL UNIQUE, alert_id TEXT NOT NULL REFERENCES platform_alert_intents(alert_id),
  entitlement_id TEXT NOT NULL REFERENCES platform_alert_recipient_entitlements(entitlement_id), authority_proof_id TEXT NOT NULL,
  actor_id TEXT NOT NULL, endpoint_id TEXT NOT NULL, destination_digest TEXT NOT NULL, channel TEXT NOT NULL,
  family TEXT NOT NULL, purpose TEXT NOT NULL, urgency TEXT NOT NULL, decision TEXT NOT NULL CHECK(decision='RESOLVED'),
  issued_at TEXT NOT NULL, expires_at TEXT NOT NULL, policy_version TEXT NOT NULL, correlation_id TEXT NOT NULL, causal_references_json TEXT NOT NULL
);
CREATE TABLE platform_alert_recipient_bindings (
  alert_id TEXT PRIMARY KEY REFERENCES platform_alert_intents(alert_id), resolution_id TEXT NOT NULL UNIQUE REFERENCES platform_alert_recipient_resolution_decisions(resolution_id),
  entitlement_id TEXT NOT NULL, endpoint_id TEXT NOT NULL, bound_at TEXT NOT NULL
);
CREATE TABLE platform_alert_recipient_audit_events (
  audit_event_id TEXT PRIMARY KEY, event_kind TEXT NOT NULL, alert_id TEXT, entitlement_id TEXT, actor_id TEXT,
  authority_proof_id TEXT, endpoint_id TEXT, destination_digest TEXT, authority_domain TEXT, family TEXT, purpose TEXT,
  urgency TEXT, channel TEXT, outcome TEXT NOT NULL, reason_code TEXT NOT NULL, correlation_id TEXT NOT NULL,
  causal_references_json TEXT NOT NULL, recorded_at TEXT NOT NULL
);
CREATE TRIGGER platform_authority_proofs_no_update BEFORE UPDATE ON platform_operational_authority_proofs BEGIN SELECT RAISE(ABORT,'PLATFORM_AUTHORITY_PROOF_IMMUTABLE'); END;
CREATE TRIGGER platform_authority_proofs_no_delete BEFORE DELETE ON platform_operational_authority_proofs BEGIN SELECT RAISE(ABORT,'PLATFORM_AUTHORITY_PROOF_IMMUTABLE'); END;
CREATE TRIGGER platform_entitlements_no_update BEFORE UPDATE ON platform_alert_recipient_entitlements BEGIN SELECT RAISE(ABORT,'PLATFORM_RECIPIENT_ENTITLEMENT_IMMUTABLE'); END;
CREATE TRIGGER platform_entitlements_no_delete BEFORE DELETE ON platform_alert_recipient_entitlements BEGIN SELECT RAISE(ABORT,'PLATFORM_RECIPIENT_ENTITLEMENT_IMMUTABLE'); END;
CREATE TRIGGER platform_endpoints_no_update BEFORE UPDATE ON platform_alert_recipient_endpoints BEGIN SELECT RAISE(ABORT,'PLATFORM_ENDPOINT_IMMUTABLE'); END;
CREATE TRIGGER platform_endpoints_no_delete BEFORE DELETE ON platform_alert_recipient_endpoints BEGIN SELECT RAISE(ABORT,'PLATFORM_ENDPOINT_IMMUTABLE'); END;
CREATE TRIGGER platform_entitlement_revocations_no_update BEFORE UPDATE ON platform_alert_entitlement_revocations BEGIN SELECT RAISE(ABORT,'PLATFORM_ENTITLEMENT_REVOCATION_IMMUTABLE'); END;
CREATE TRIGGER platform_entitlement_revocations_no_delete BEFORE DELETE ON platform_alert_entitlement_revocations BEGIN SELECT RAISE(ABORT,'PLATFORM_ENTITLEMENT_REVOCATION_IMMUTABLE'); END;
CREATE TRIGGER platform_endpoint_revocations_no_update BEFORE UPDATE ON platform_alert_endpoint_revocations BEGIN SELECT RAISE(ABORT,'PLATFORM_ENDPOINT_REVOCATION_IMMUTABLE'); END;
CREATE TRIGGER platform_endpoint_revocations_no_delete BEFORE DELETE ON platform_alert_endpoint_revocations BEGIN SELECT RAISE(ABORT,'PLATFORM_ENDPOINT_REVOCATION_IMMUTABLE'); END;
CREATE TRIGGER platform_resolutions_no_update BEFORE UPDATE ON platform_alert_recipient_resolution_decisions BEGIN SELECT RAISE(ABORT,'PLATFORM_RECIPIENT_RESOLUTION_IMMUTABLE'); END;
CREATE TRIGGER platform_resolutions_no_delete BEFORE DELETE ON platform_alert_recipient_resolution_decisions BEGIN SELECT RAISE(ABORT,'PLATFORM_RECIPIENT_RESOLUTION_IMMUTABLE'); END;
CREATE TRIGGER platform_recipient_bindings_no_update BEFORE UPDATE ON platform_alert_recipient_bindings BEGIN SELECT RAISE(ABORT,'PLATFORM_RECIPIENT_BINDING_IMMUTABLE'); END;
CREATE TRIGGER platform_recipient_bindings_no_delete BEFORE DELETE ON platform_alert_recipient_bindings BEGIN SELECT RAISE(ABORT,'PLATFORM_RECIPIENT_BINDING_IMMUTABLE'); END;
CREATE TRIGGER platform_recipient_audit_no_update BEFORE UPDATE ON platform_alert_recipient_audit_events BEGIN SELECT RAISE(ABORT,'PLATFORM_RECIPIENT_AUDIT_IMMUTABLE'); END;
CREATE TRIGGER platform_recipient_audit_no_delete BEFORE DELETE ON platform_alert_recipient_audit_events BEGIN SELECT RAISE(ABORT,'PLATFORM_RECIPIENT_AUDIT_IMMUTABLE'); END;
