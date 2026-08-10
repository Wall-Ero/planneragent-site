CREATE TABLE provider_runtime_binding_evidence(
  binding_id TEXT PRIMARY KEY,version INTEGER NOT NULL CHECK(version=1),binding_digest TEXT NOT NULL UNIQUE,
  mapping_id TEXT NOT NULL,provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,provider_deployment_id TEXT NOT NULL,adapter_identity TEXT NOT NULL,
  selected_model TEXT NOT NULL,credential_reference TEXT NOT NULL,environment_class TEXT NOT NULL,
  downstream_provider_identity_status TEXT NOT NULL,downstream_deployment_identity_status TEXT NOT NULL,
  binding_policy_version TEXT NOT NULL CHECK(binding_policy_version='PROVIDER_RUNTIME_BINDING_POLICY_V1'),
  issued_at TEXT NOT NULL,correlation_id TEXT NOT NULL,causal_references_json TEXT NOT NULL,
  admission_granted INTEGER NOT NULL CHECK(admission_granted=0),transport_executed INTEGER NOT NULL CHECK(transport_executed=0),persisted_at TEXT NOT NULL
);
CREATE TABLE provider_runtime_binding_evidence_audit(
  event_id TEXT PRIMARY KEY,event_kind TEXT NOT NULL,binding_id TEXT NOT NULL,outcome TEXT NOT NULL,
  failure_code TEXT,correlation_id TEXT NOT NULL,recorded_at TEXT NOT NULL
);
CREATE TRIGGER provider_runtime_binding_evidence_no_update BEFORE UPDATE ON provider_runtime_binding_evidence BEGIN SELECT RAISE(ABORT,'PROVIDER_RUNTIME_BINDING_EVIDENCE_IMMUTABLE');END;
CREATE TRIGGER provider_runtime_binding_evidence_no_delete BEFORE DELETE ON provider_runtime_binding_evidence BEGIN SELECT RAISE(ABORT,'PROVIDER_RUNTIME_BINDING_EVIDENCE_IMMUTABLE');END;
CREATE TRIGGER provider_runtime_binding_evidence_audit_no_update BEFORE UPDATE ON provider_runtime_binding_evidence_audit BEGIN SELECT RAISE(ABORT,'PROVIDER_RUNTIME_BINDING_EVIDENCE_AUDIT_IMMUTABLE');END;
CREATE TRIGGER provider_runtime_binding_evidence_audit_no_delete BEFORE DELETE ON provider_runtime_binding_evidence_audit BEGIN SELECT RAISE(ABORT,'PROVIDER_RUNTIME_BINDING_EVIDENCE_AUDIT_IMMUTABLE');END;
