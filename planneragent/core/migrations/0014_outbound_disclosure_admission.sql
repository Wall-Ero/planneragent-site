CREATE TABLE outbound_disclosure_admissions (
  disclosure_id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL UNIQUE REFERENCES knowledge_exposure_decisions(decision_id),
  binding_id TEXT NOT NULL UNIQUE REFERENCES knowledge_exposure_projection_bindings(binding_id),
  knowledge_consumption_id TEXT NOT NULL UNIQUE REFERENCES knowledge_exposure_consumptions(consumption_id),
  authority_reference TEXT NOT NULL, governance_references_json TEXT NOT NULL,
  tenant_id TEXT NOT NULL, company_id TEXT NOT NULL, purpose TEXT NOT NULL,
  communication_family TEXT NOT NULL CHECK (communication_family IN ('TENANT_OPERATIONAL_DISCLOSURE','COMMERCIAL_LIFECYCLE_COMMUNICATION','ORGANIZATIONAL_GOVERNANCE_COMMUNICATION','SECURITY_GOVERNANCE_NOTIFICATION','PLATFORM_OPERATIONAL_ALERT','SYSTEM_HEALTH_SIGNAL','INTERNAL_RUNTIME_COMMUNICATION')),
  manifest_id TEXT NOT NULL, projection_digest TEXT NOT NULL,
  recipient_id TEXT NOT NULL, recipient_class TEXT NOT NULL CHECK (recipient_class='AUTHORIZED_BUSINESS_RECIPIENT'),
  entitlement_reference TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL','SMS','WHATSAPP','WEBHOOK')),
  representation TEXT NOT NULL CHECK (representation IN ('STRUCTURED_JSON','PLAIN_TEXT','GENERATED_DOCUMENT')),
  classification TEXT NOT NULL CHECK (classification IN ('PUBLIC','INTERNAL','SENSITIVE','CRITICAL','CONSTITUTIONAL')),
  policy_version TEXT NOT NULL, admitted_at TEXT NOT NULL, expires_at TEXT NOT NULL,
  correlation_id TEXT NOT NULL, causal_references_json TEXT NOT NULL, canonical_digest TEXT NOT NULL UNIQUE,
  CHECK (expires_at > admitted_at)
);
CREATE INDEX outbound_disclosure_admissions_owner ON outbound_disclosure_admissions(tenant_id,company_id,admitted_at);
CREATE TRIGGER outbound_disclosure_admissions_no_update BEFORE UPDATE ON outbound_disclosure_admissions
BEGIN SELECT RAISE(ABORT,'OUTBOUND_DISCLOSURE_ADMISSION_IMMUTABLE'); END;
CREATE TRIGGER outbound_disclosure_admissions_no_delete BEFORE DELETE ON outbound_disclosure_admissions
BEGIN SELECT RAISE(ABORT,'OUTBOUND_DISCLOSURE_ADMISSION_IMMUTABLE'); END;

CREATE TABLE outbound_disclosure_consumptions (
  disclosure_consumption_id TEXT PRIMARY KEY,
  disclosure_id TEXT NOT NULL UNIQUE REFERENCES outbound_disclosure_admissions(disclosure_id),
  consuming_runtime TEXT NOT NULL, consumed_at TEXT NOT NULL,
  correlation_id TEXT NOT NULL, causal_references_json TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome='CONSUMED')
);
CREATE TRIGGER outbound_disclosure_consumptions_no_update BEFORE UPDATE ON outbound_disclosure_consumptions
BEGIN SELECT RAISE(ABORT,'OUTBOUND_DISCLOSURE_CONSUMPTION_IMMUTABLE'); END;
CREATE TRIGGER outbound_disclosure_consumptions_no_delete BEFORE DELETE ON outbound_disclosure_consumptions
BEGIN SELECT RAISE(ABORT,'OUTBOUND_DISCLOSURE_CONSUMPTION_IMMUTABLE'); END;

CREATE TABLE outbound_disclosure_audit_events (
  audit_event_id TEXT PRIMARY KEY,
  event_kind TEXT NOT NULL CHECK (event_kind IN ('ADMISSION_PERSISTED','CURRENT_STATE_DENIED','SUBSTITUTION_DENIED','EXPIRY_DENIED','CONSUMED','REPLAY_DENIED')),
  disclosure_id TEXT NOT NULL, disclosure_consumption_id TEXT,
  outcome TEXT NOT NULL, failure_code TEXT, projection_digest TEXT NOT NULL,
  correlation_id TEXT NOT NULL, causal_references_json TEXT NOT NULL, recorded_at TEXT NOT NULL
);
CREATE INDEX outbound_disclosure_audit_identity ON outbound_disclosure_audit_events(disclosure_id,recorded_at);
CREATE TRIGGER outbound_disclosure_audit_no_update BEFORE UPDATE ON outbound_disclosure_audit_events
BEGIN SELECT RAISE(ABORT,'OUTBOUND_DISCLOSURE_AUDIT_IMMUTABLE'); END;
CREATE TRIGGER outbound_disclosure_audit_no_delete BEFORE DELETE ON outbound_disclosure_audit_events
BEGIN SELECT RAISE(ABORT,'OUTBOUND_DISCLOSURE_AUDIT_IMMUTABLE'); END;
