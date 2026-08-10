CREATE TABLE knowledge_exposure_authority_bindings (
  binding_id TEXT PRIMARY KEY, binding_digest TEXT NOT NULL UNIQUE,
  request_id TEXT NOT NULL, decision_id TEXT NOT NULL REFERENCES knowledge_exposure_decisions(decision_id),
  projection_digest TEXT NOT NULL, recorded_at TEXT NOT NULL, correlation_id TEXT NOT NULL,
  UNIQUE (decision_id, projection_digest)
);
CREATE TRIGGER knowledge_exposure_authority_bindings_no_update BEFORE UPDATE ON knowledge_exposure_authority_bindings BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_AUTHORITY_BINDING_IMMUTABLE'); END;
CREATE TRIGGER knowledge_exposure_authority_bindings_no_delete BEFORE DELETE ON knowledge_exposure_authority_bindings BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_AUTHORITY_BINDING_IMMUTABLE'); END;

CREATE TABLE security_evidence_applicability (
  applicability_id TEXT PRIMARY KEY, binding_id TEXT NOT NULL REFERENCES knowledge_exposure_authority_bindings(binding_id),
  domain TEXT NOT NULL CHECK(domain IN ('ORGANIZATIONAL_AUTHORITY','P9')),
  status TEXT NOT NULL CHECK(status IN ('APPLICABLE','NOT_APPLICABLE','UNDEFINED')), reason TEXT NOT NULL,
  request_id TEXT NOT NULL, decision_id TEXT NOT NULL, purpose TEXT NOT NULL, projection_digest TEXT NOT NULL,
  principal_id TEXT NOT NULL, session_id TEXT NOT NULL, tenant_id TEXT NOT NULL, company_id TEXT NOT NULL,
  recorded_at TEXT NOT NULL, correlation_id TEXT NOT NULL, causal_references_json TEXT NOT NULL,
  UNIQUE(binding_id,domain)
);
CREATE TRIGGER security_evidence_applicability_no_update BEFORE UPDATE ON security_evidence_applicability BEGIN SELECT RAISE(ABORT, 'SECURITY_EVIDENCE_APPLICABILITY_IMMUTABLE'); END;
CREATE TRIGGER security_evidence_applicability_no_delete BEFORE DELETE ON security_evidence_applicability BEGIN SELECT RAISE(ABORT, 'SECURITY_EVIDENCE_APPLICABILITY_IMMUTABLE'); END;

CREATE TABLE knowledge_exposure_authority_evidence (
  evidence_id TEXT PRIMARY KEY, binding_id TEXT NOT NULL UNIQUE REFERENCES knowledge_exposure_authority_bindings(binding_id),
  authority_source_class TEXT NOT NULL CHECK(authority_source_class='ORGANIZATIONAL_OPERATIONAL_AUTHORITY'),
  authority_proof_id TEXT NOT NULL, authority_proof_digest TEXT NOT NULL, oag_actor_id TEXT NOT NULL,
  principal_id TEXT NOT NULL, tenant_id TEXT NOT NULL, company_id TEXT NOT NULL,
  effective_operational_domain TEXT NOT NULL, effective_scope_json TEXT NOT NULL,
  graph_version TEXT NOT NULL, graph_digest TEXT NOT NULL, authority_policy_id TEXT NOT NULL, authority_policy_version INTEGER NOT NULL,
  confirmation_chain_references_json TEXT NOT NULL, delegation_lineage_json TEXT NOT NULL,
  issued_at TEXT NOT NULL, expires_at TEXT NOT NULL, current_state_resolution TEXT NOT NULL CHECK(current_state_resolution='CURRENT'),
  purpose TEXT NOT NULL CHECK(purpose='CUSTOMER_QUOTATION_DISCLOSURE'), correlation_id TEXT NOT NULL, causal_references_json TEXT NOT NULL,
  CHECK(expires_at>issued_at)
);
CREATE TRIGGER knowledge_exposure_authority_evidence_no_update BEFORE UPDATE ON knowledge_exposure_authority_evidence BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_AUTHORITY_EVIDENCE_IMMUTABLE'); END;
CREATE TRIGGER knowledge_exposure_authority_evidence_no_delete BEFORE DELETE ON knowledge_exposure_authority_evidence BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_AUTHORITY_EVIDENCE_IMMUTABLE'); END;

CREATE TABLE knowledge_exposure_authority_audit (
  audit_event_id TEXT PRIMARY KEY, binding_id TEXT NOT NULL, event_kind TEXT NOT NULL CHECK(event_kind='AUTHORITY_BINDING_PERSISTED'),
  outcome TEXT NOT NULL CHECK(outcome='PERSISTED'), decision_id TEXT NOT NULL, projection_digest TEXT NOT NULL,
  correlation_id TEXT NOT NULL, recorded_at TEXT NOT NULL
);
CREATE TRIGGER knowledge_exposure_authority_audit_no_update BEFORE UPDATE ON knowledge_exposure_authority_audit BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_AUTHORITY_AUDIT_IMMUTABLE'); END;
CREATE TRIGGER knowledge_exposure_authority_audit_no_delete BEFORE DELETE ON knowledge_exposure_authority_audit BEGIN SELECT RAISE(ABORT, 'KNOWLEDGE_EXPOSURE_AUTHORITY_AUDIT_IMMUTABLE'); END;
