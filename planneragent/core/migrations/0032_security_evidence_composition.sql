CREATE TABLE security_evidence_compositions(
 composition_id TEXT PRIMARY KEY,version INTEGER NOT NULL CHECK(version=1),composition_digest TEXT NOT NULL UNIQUE,request_id TEXT NOT NULL,
 principal_id TEXT,session_id TEXT,tenant_id TEXT NOT NULL,company_id TEXT NOT NULL,oks_request_id TEXT NOT NULL,oks_decision_id TEXT NOT NULL,
 projection_id TEXT NOT NULL,projection_digest TEXT NOT NULL,oks_consumption_id TEXT NOT NULL,
 authority_applicability_id TEXT NOT NULL,authority_requirement TEXT NOT NULL CHECK(authority_requirement IN('NOT_APPLICABLE','REQUIRED')),
 authority_evidence_id TEXT,authority_proof_id TEXT,authority_proof_digest TEXT,p9_applicability_id TEXT NOT NULL,
 final_outcome TEXT NOT NULL,verification_result TEXT NOT NULL CHECK(verification_result IN('VERIFIED','DENIED')),
 historical_validity_basis TEXT NOT NULL CHECK(historical_validity_basis IN('VALID_AT_OPERATION_TIME','CURRENT_NOW')),
 composed_at TEXT NOT NULL,causal_lineage_json TEXT NOT NULL,
 CHECK((authority_requirement='REQUIRED' AND authority_evidence_id IS NOT NULL AND authority_proof_id IS NOT NULL AND authority_proof_digest IS NOT NULL) OR (authority_requirement='NOT_APPLICABLE' AND authority_evidence_id IS NULL AND authority_proof_id IS NULL AND authority_proof_digest IS NULL))
);
CREATE TABLE security_composition_admissions(composition_id TEXT NOT NULL REFERENCES security_evidence_compositions(composition_id),admission_id TEXT NOT NULL,admission_digest TEXT NOT NULL,PRIMARY KEY(composition_id,admission_id));
CREATE TABLE security_composition_bindings(composition_id TEXT NOT NULL REFERENCES security_evidence_compositions(composition_id),binding_id TEXT NOT NULL,binding_digest TEXT NOT NULL,PRIMARY KEY(composition_id,binding_id));
CREATE TABLE security_composition_credentials(composition_id TEXT NOT NULL REFERENCES security_evidence_compositions(composition_id),evidence_id TEXT NOT NULL,PRIMARY KEY(composition_id,evidence_id));
CREATE TABLE security_composition_attempts(composition_id TEXT NOT NULL REFERENCES security_evidence_compositions(composition_id),attempt_id TEXT NOT NULL,sequence INTEGER NOT NULL,outcome TEXT NOT NULL,predecessor_attempt_id TEXT,admission_id TEXT,admission_digest TEXT,binding_id TEXT,binding_digest TEXT,credential_evidence_id TEXT,transport_evidence_id TEXT,PRIMARY KEY(composition_id,attempt_id),UNIQUE(composition_id,sequence));
CREATE TABLE security_composition_transports(composition_id TEXT NOT NULL REFERENCES security_evidence_compositions(composition_id),evidence_id TEXT NOT NULL,PRIMARY KEY(composition_id,evidence_id));
CREATE TABLE security_composition_fallbacks(composition_id TEXT NOT NULL REFERENCES security_evidence_compositions(composition_id),edge_id TEXT NOT NULL,request_id TEXT NOT NULL,predecessor_attempt_id TEXT NOT NULL,successor_attempt_id TEXT NOT NULL,reason TEXT NOT NULL CHECK(reason='TECHNICAL_FAILURE'),PRIMARY KEY(composition_id,edge_id));
CREATE TABLE security_composition_edges(composition_id TEXT NOT NULL REFERENCES security_evidence_compositions(composition_id),edge_id TEXT NOT NULL,source_domain TEXT NOT NULL,source_id TEXT NOT NULL,source_digest TEXT,target_domain TEXT NOT NULL,target_id TEXT NOT NULL,target_digest TEXT,integrity TEXT NOT NULL,causal_relation TEXT NOT NULL,referenced_at TEXT,PRIMARY KEY(composition_id,edge_id));
CREATE TABLE security_composition_audit(audit_id TEXT PRIMARY KEY,event_kind TEXT NOT NULL CHECK(event_kind='COMPOSITION_PERSISTED'),composition_id TEXT NOT NULL,composition_digest TEXT NOT NULL,outcome TEXT NOT NULL CHECK(outcome='PERSISTED'),recorded_at TEXT NOT NULL);
CREATE TRIGGER security_composition_immutable BEFORE UPDATE ON security_evidence_compositions BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_no_delete BEFORE DELETE ON security_evidence_compositions BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_admission_immutable BEFORE UPDATE ON security_composition_admissions BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_binding_immutable BEFORE UPDATE ON security_composition_bindings BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_credential_immutable BEFORE UPDATE ON security_composition_credentials BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_attempt_immutable BEFORE UPDATE ON security_composition_attempts BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_transport_immutable BEFORE UPDATE ON security_composition_transports BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_fallback_immutable BEFORE UPDATE ON security_composition_fallbacks BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_edge_immutable BEFORE UPDATE ON security_composition_edges BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_audit_immutable BEFORE UPDATE ON security_composition_audit BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_AUDIT_IMMUTABLE');END;
CREATE TRIGGER security_composition_audit_no_delete BEFORE DELETE ON security_composition_audit BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_AUDIT_IMMUTABLE');END;
CREATE TRIGGER security_composition_admission_no_delete BEFORE DELETE ON security_composition_admissions BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_binding_no_delete BEFORE DELETE ON security_composition_bindings BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_credential_no_delete BEFORE DELETE ON security_composition_credentials BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_attempt_no_delete BEFORE DELETE ON security_composition_attempts BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_transport_no_delete BEFORE DELETE ON security_composition_transports BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_fallback_no_delete BEFORE DELETE ON security_composition_fallbacks BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;
CREATE TRIGGER security_composition_edge_no_delete BEFORE DELETE ON security_composition_edges BEGIN SELECT RAISE(ABORT,'SECURITY_COMPOSITION_IMMUTABLE');END;

