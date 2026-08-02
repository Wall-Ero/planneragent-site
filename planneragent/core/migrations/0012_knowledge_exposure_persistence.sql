CREATE TABLE knowledge_exposure_decisions (
  decision_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  outcome TEXT NOT NULL CHECK (outcome IN ('ADMITTED', 'DENIED')),
  participation_context_id TEXT NOT NULL,
  principal_id TEXT NOT NULL, session_id TEXT NOT NULL, membership_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL, company_id TEXT NOT NULL,
  authority_reference TEXT NOT NULL, authorization_reference TEXT,
  operation TEXT NOT NULL, purpose TEXT NOT NULL, policy_version TEXT NOT NULL,
  target_class TEXT NOT NULL, target_identity TEXT,
  effective_classification TEXT NOT NULL, effective_sovereignty TEXT NOT NULL,
  permitted_region TEXT NOT NULL, permitted_retention TEXT NOT NULL,
  manifest_id TEXT NOT NULL, projection_digest TEXT NOT NULL,
  knowledge_digests_json TEXT NOT NULL,
  issued_at TEXT NOT NULL, expires_at TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL, evidence_id TEXT NOT NULL UNIQUE,
  correlation_id TEXT NOT NULL, causal_references_json TEXT NOT NULL,
  canonical_digest TEXT NOT NULL UNIQUE,
  CHECK (expires_at > issued_at)
);
CREATE INDEX knowledge_exposure_decisions_expiry ON knowledge_exposure_decisions(expires_at);
CREATE INDEX knowledge_exposure_decisions_scope ON knowledge_exposure_decisions(tenant_id, company_id);
CREATE TRIGGER knowledge_exposure_decisions_no_update BEFORE UPDATE ON knowledge_exposure_decisions
BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_DECISION_IMMUTABLE'); END;
CREATE TRIGGER knowledge_exposure_decisions_no_delete BEFORE DELETE ON knowledge_exposure_decisions
BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_DECISION_IMMUTABLE'); END;

CREATE TABLE knowledge_exposure_projection_bindings (
  binding_id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL UNIQUE REFERENCES knowledge_exposure_decisions(decision_id),
  manifest_id TEXT NOT NULL, projection_digest TEXT NOT NULL,
  knowledge_digests_json TEXT NOT NULL, operation TEXT NOT NULL, purpose TEXT NOT NULL,
  target_class TEXT NOT NULL, target_identity TEXT,
  tenant_id TEXT NOT NULL, company_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (binding_id, decision_id),
  UNIQUE (decision_id, manifest_id, projection_digest)
);
CREATE INDEX knowledge_exposure_bindings_projection ON knowledge_exposure_projection_bindings(manifest_id, projection_digest);
CREATE TRIGGER knowledge_exposure_bindings_no_update BEFORE UPDATE ON knowledge_exposure_projection_bindings
BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_BINDING_IMMUTABLE'); END;
CREATE TRIGGER knowledge_exposure_bindings_no_delete BEFORE DELETE ON knowledge_exposure_projection_bindings
BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_BINDING_IMMUTABLE'); END;

CREATE TABLE knowledge_exposure_consumptions (
  consumption_id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL UNIQUE REFERENCES knowledge_exposure_decisions(decision_id),
  binding_id TEXT NOT NULL UNIQUE REFERENCES knowledge_exposure_projection_bindings(binding_id),
  consuming_runtime TEXT NOT NULL, intended_transport_class TEXT NOT NULL,
  target_constraint TEXT, consumed_at TEXT NOT NULL,
  correlation_id TEXT NOT NULL, causal_references_json TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome = 'CONSUMED')
);
CREATE TRIGGER knowledge_exposure_consumptions_no_update BEFORE UPDATE ON knowledge_exposure_consumptions
BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_CONSUMPTION_IMMUTABLE'); END;
CREATE TRIGGER knowledge_exposure_consumptions_no_delete BEFORE DELETE ON knowledge_exposure_consumptions
BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_CONSUMPTION_IMMUTABLE'); END;

CREATE TABLE knowledge_exposure_audit_events (
  audit_event_id TEXT PRIMARY KEY, event_kind TEXT NOT NULL CHECK (event_kind IN (
    'DECISION_PERSISTED','DECISION_VERIFIED','CURRENT_STATE_DENIED','CONSUMED',
    'REPLAY_DENIED','EXPIRY_DENIED','SUBSTITUTION_DENIED')),
  decision_id TEXT NOT NULL, binding_id TEXT, consumption_id TEXT,
  outcome TEXT NOT NULL, failure_code TEXT,
  projection_digest TEXT NOT NULL, evidence_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL, causal_references_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);
CREATE INDEX knowledge_exposure_audit_decision ON knowledge_exposure_audit_events(decision_id, recorded_at);
CREATE TRIGGER knowledge_exposure_audit_no_update BEFORE UPDATE ON knowledge_exposure_audit_events
BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_AUDIT_IMMUTABLE'); END;
CREATE TRIGGER knowledge_exposure_audit_no_delete BEFORE DELETE ON knowledge_exposure_audit_events
BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_AUDIT_IMMUTABLE'); END;
