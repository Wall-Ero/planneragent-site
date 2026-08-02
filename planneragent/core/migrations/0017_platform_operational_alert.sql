CREATE TABLE platform_alert_intents (
  alert_id TEXT PRIMARY KEY,
  deduplication_id TEXT NOT NULL UNIQUE,
  family TEXT NOT NULL CHECK (family = 'PLATFORM_OPERATIONAL_ALERT'),
  platform_owner_id TEXT NOT NULL,
  source_class TEXT NOT NULL CHECK (source_class IN ('WU4B_EMAIL_DELIVERY','WU4C_TWILIO_DELIVERY')),
  source_evidence_id TEXT NOT NULL,
  source_evidence_digest TEXT NOT NULL,
  source_outcome TEXT NOT NULL CHECK (source_outcome IN ('FAILED','INDETERMINATE')),
  purpose TEXT NOT NULL CHECK (purpose = 'GOVERNED_DELIVERY_REVIEW'),
  review_urgency TEXT NOT NULL CHECK (review_urgency IN ('REVIEW_REQUIRED','URGENT_REVIEW')),
  acknowledgement_required INTEGER NOT NULL CHECK (acknowledgement_required IN (0,1)),
  platform_scope TEXT NOT NULL,
  tenant_reference_digest TEXT,
  company_reference_digest TEXT,
  projection_manifest_json TEXT NOT NULL,
  policy_id TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  effective_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  causal_references_json TEXT NOT NULL,
  canonical_digest TEXT NOT NULL
);

CREATE TABLE platform_alert_source_bindings (
  alert_id TEXT PRIMARY KEY REFERENCES platform_alert_intents(alert_id),
  source_class TEXT NOT NULL,
  source_evidence_id TEXT NOT NULL,
  source_evidence_digest TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  UNIQUE(source_class, source_evidence_id, source_evidence_digest)
);

CREATE TABLE platform_alert_admission_decisions (
  decision_id TEXT PRIMARY KEY,
  alert_id TEXT NOT NULL UNIQUE REFERENCES platform_alert_intents(alert_id),
  decision TEXT NOT NULL CHECK (decision = 'ADMITTED'),
  policy_id TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  decided_at TEXT NOT NULL
);

CREATE TABLE platform_alert_suppressions (
  suppression_id TEXT PRIMARY KEY,
  deduplication_id TEXT NOT NULL REFERENCES platform_alert_intents(deduplication_id),
  canonical_alert_id TEXT NOT NULL REFERENCES platform_alert_intents(alert_id),
  reason_code TEXT NOT NULL CHECK (reason_code = 'PLATFORM_ALERT_DUPLICATE'),
  suppressed_at TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  UNIQUE(deduplication_id, correlation_id)
);

CREATE TABLE platform_alert_audit_events (
  audit_event_id TEXT PRIMARY KEY,
  event_kind TEXT NOT NULL CHECK (event_kind IN ('SOURCE_VERIFIED','INTENT_CONSTRUCTED','ADMITTED','DENIED','DUPLICATE_DETECTED','SUPPRESSED')),
  alert_id TEXT,
  source_class TEXT,
  source_evidence_id TEXT,
  source_evidence_digest TEXT,
  family TEXT,
  policy_id TEXT,
  policy_version TEXT,
  purpose TEXT,
  review_urgency TEXT,
  platform_scope TEXT,
  tenant_reference_digest TEXT,
  company_reference_digest TEXT,
  reason_code TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  causal_references_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE INDEX platform_alert_audit_source ON platform_alert_audit_events(source_class, source_evidence_id, recorded_at);

CREATE TRIGGER platform_alert_intents_no_update BEFORE UPDATE ON platform_alert_intents BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_INTENT_IMMUTABLE'); END;
CREATE TRIGGER platform_alert_intents_no_delete BEFORE DELETE ON platform_alert_intents BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_INTENT_IMMUTABLE'); END;
CREATE TRIGGER platform_alert_bindings_no_update BEFORE UPDATE ON platform_alert_source_bindings BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_BINDING_IMMUTABLE'); END;
CREATE TRIGGER platform_alert_bindings_no_delete BEFORE DELETE ON platform_alert_source_bindings BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_BINDING_IMMUTABLE'); END;
CREATE TRIGGER platform_alert_decisions_no_update BEFORE UPDATE ON platform_alert_admission_decisions BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DECISION_IMMUTABLE'); END;
CREATE TRIGGER platform_alert_decisions_no_delete BEFORE DELETE ON platform_alert_admission_decisions BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DECISION_IMMUTABLE'); END;
CREATE TRIGGER platform_alert_suppressions_no_update BEFORE UPDATE ON platform_alert_suppressions BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_SUPPRESSION_IMMUTABLE'); END;
CREATE TRIGGER platform_alert_suppressions_no_delete BEFORE DELETE ON platform_alert_suppressions BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_SUPPRESSION_IMMUTABLE'); END;
CREATE TRIGGER platform_alert_audit_no_update BEFORE UPDATE ON platform_alert_audit_events BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_AUDIT_IMMUTABLE'); END;
CREATE TRIGGER platform_alert_audit_no_delete BEFORE DELETE ON platform_alert_audit_events BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_AUDIT_IMMUTABLE'); END;
