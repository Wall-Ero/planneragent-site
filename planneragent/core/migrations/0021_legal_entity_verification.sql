CREATE TABLE legal_entity_claims (
  claim_id TEXT PRIMARY KEY, version INTEGER NOT NULL CHECK(version=1), claim_status TEXT NOT NULL CHECK(claim_status IN ('CLAIMED','EVIDENCE_SUBMITTED')),
  claimant_principal_id TEXT NOT NULL REFERENCES oir_principals(principal_id), registered_name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL, registration_type TEXT NOT NULL, registration_identifier TEXT NOT NULL,
  registration_profile TEXT NOT NULL, evidence_references_json TEXT NOT NULL, purpose TEXT NOT NULL CHECK(purpose='LEGAL_ENTITY_IDENTIFICATION'),
  issued_at TEXT NOT NULL, expires_at TEXT, correlation_id TEXT NOT NULL, caused_by_json TEXT NOT NULL
);
CREATE TABLE legal_entity_registration_identities (
  registration_identity_id TEXT PRIMARY KEY, jurisdiction TEXT NOT NULL, registration_profile TEXT NOT NULL,
  registration_identifier TEXT NOT NULL, normalized_registered_name TEXT NOT NULL, registration_type TEXT NOT NULL,
  UNIQUE(jurisdiction,registration_profile,registration_identifier)
);
CREATE TABLE legal_entity_evidence_references (
  evidence_id TEXT PRIMARY KEY, version INTEGER NOT NULL CHECK(version=1), issuer_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL CHECK(evidence_type IN ('SIGNED_OFFICIAL_DOCUMENT_REFERENCE','GOVERNED_MANUAL_REVIEW_DECISION')),
  subject_claim_id TEXT NOT NULL REFERENCES legal_entity_claims(claim_id), jurisdiction TEXT NOT NULL,
  registration_profile TEXT NOT NULL, registration_identifier TEXT NOT NULL, registered_name TEXT NOT NULL,
  issued_at TEXT NOT NULL, effective_at TEXT NOT NULL, expires_at TEXT, immutable_digest TEXT NOT NULL,
  governed_reference TEXT NOT NULL UNIQUE, verification_state TEXT NOT NULL CHECK(verification_state IN ('SUBMITTED','ACCEPTED','REJECTED')),
  verification_authority_id TEXT
);
CREATE TABLE legal_entity_verification_decisions (
  decision_id TEXT PRIMARY KEY, version INTEGER NOT NULL CHECK(version=1), claim_id TEXT NOT NULL REFERENCES legal_entity_claims(claim_id),
  evidence_ids_json TEXT NOT NULL, verifier_id TEXT NOT NULL, verifier_class TEXT NOT NULL CHECK(verifier_class='GOVERNED_AUTHORIZED_REVIEWER'),
  decision TEXT NOT NULL CHECK(decision IN ('VERIFIED','REJECTED')), reason_codes_json TEXT NOT NULL,
  decided_at TEXT NOT NULL, valid_until TEXT, correlation_id TEXT NOT NULL, caused_by_json TEXT NOT NULL
);
CREATE TABLE legal_entity_identities (
  legal_entity_id TEXT PRIMARY KEY, version INTEGER NOT NULL CHECK(version=1), canonical_key TEXT NOT NULL UNIQUE,
  registration_identity_id TEXT NOT NULL UNIQUE REFERENCES legal_entity_registration_identities(registration_identity_id),
  registered_name TEXT NOT NULL, entity_status TEXT NOT NULL CHECK(entity_status='ACTIVE'),
  verification_status TEXT NOT NULL CHECK(verification_status='VERIFIED_BY_AUTHORIZED_REVIEW'),
  verification_method TEXT NOT NULL CHECK(verification_method='GOVERNED_MANUAL_REVIEW'), evidence_ids_json TEXT NOT NULL,
  effective_at TEXT NOT NULL, verified_at TEXT NOT NULL, reverify_at TEXT,
  claim_id TEXT NOT NULL UNIQUE REFERENCES legal_entity_claims(claim_id), decision_id TEXT NOT NULL UNIQUE REFERENCES legal_entity_verification_decisions(decision_id),
  correlation_id TEXT NOT NULL, caused_by_json TEXT NOT NULL
);
CREATE TABLE legal_entity_company_bindings (
  binding_id TEXT PRIMARY KEY, version INTEGER NOT NULL CHECK(version=1), company_id TEXT NOT NULL UNIQUE REFERENCES oir_companies(company_id),
  legal_entity_id TEXT NOT NULL UNIQUE REFERENCES legal_entity_identities(legal_entity_id), bound_at TEXT NOT NULL,
  binding_reference TEXT NOT NULL UNIQUE, correlation_id TEXT NOT NULL, caused_by_json TEXT NOT NULL,
  grants_membership INTEGER NOT NULL CHECK(grants_membership=0), grants_authority INTEGER NOT NULL CHECK(grants_authority=0),
  grants_contractual_authority INTEGER NOT NULL CHECK(grants_contractual_authority=0)
);
CREATE TABLE legal_entity_status_transitions (
  transition_id TEXT PRIMARY KEY, legal_entity_id TEXT NOT NULL REFERENCES legal_entity_identities(legal_entity_id),
  from_status TEXT NOT NULL, to_status TEXT NOT NULL CHECK(to_status IN ('EXPIRED','REVOKED','SUPERSEDED')),
  transition_reference TEXT NOT NULL UNIQUE, transitioned_at TEXT NOT NULL, superseded_by_legal_entity_id TEXT REFERENCES legal_entity_identities(legal_entity_id),
  correlation_id TEXT NOT NULL, caused_by_json TEXT NOT NULL
);
CREATE UNIQUE INDEX legal_entity_one_terminal_transition ON legal_entity_status_transitions(legal_entity_id);
CREATE TABLE legal_entity_audit_events (
  audit_event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL, subject_id TEXT NOT NULL,
  outcome TEXT NOT NULL, reason_code TEXT, actor_id TEXT NOT NULL, correlation_id TEXT NOT NULL,
  caused_by_json TEXT NOT NULL, recorded_at TEXT NOT NULL
);

CREATE TRIGGER legal_entity_claims_immutable BEFORE UPDATE ON legal_entity_claims BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_CLAIM_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_claims_no_delete BEFORE DELETE ON legal_entity_claims BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_CLAIM_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_registration_immutable BEFORE UPDATE ON legal_entity_registration_identities BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_REGISTRATION_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_registration_no_delete BEFORE DELETE ON legal_entity_registration_identities BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_REGISTRATION_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_evidence_immutable BEFORE UPDATE ON legal_entity_evidence_references BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_EVIDENCE_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_evidence_no_delete BEFORE DELETE ON legal_entity_evidence_references BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_EVIDENCE_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_decision_immutable BEFORE UPDATE ON legal_entity_verification_decisions BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_DECISION_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_decision_no_delete BEFORE DELETE ON legal_entity_verification_decisions BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_DECISION_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_identity_immutable BEFORE UPDATE ON legal_entity_identities BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_IDENTITY_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_identity_no_delete BEFORE DELETE ON legal_entity_identities BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_IDENTITY_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_binding_immutable BEFORE UPDATE ON legal_entity_company_bindings BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_BINDING_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_binding_no_delete BEFORE DELETE ON legal_entity_company_bindings BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_BINDING_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_transition_immutable BEFORE UPDATE ON legal_entity_status_transitions BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_TRANSITION_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_transition_no_delete BEFORE DELETE ON legal_entity_status_transitions BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_TRANSITION_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_audit_immutable BEFORE UPDATE ON legal_entity_audit_events BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_AUDIT_IMMUTABLE'); END;
CREATE TRIGGER legal_entity_audit_no_delete BEFORE DELETE ON legal_entity_audit_events BEGIN SELECT RAISE(ABORT,'LEGAL_ENTITY_AUDIT_IMMUTABLE'); END;
