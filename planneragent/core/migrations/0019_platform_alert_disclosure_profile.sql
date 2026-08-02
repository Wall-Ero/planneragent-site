CREATE TABLE platform_alert_disclosure_admissions (
 disclosure_id TEXT PRIMARY KEY,alert_id TEXT NOT NULL UNIQUE REFERENCES platform_alert_intents(alert_id),recipient_eligibility_id TEXT NOT NULL UNIQUE,
 profile_id TEXT NOT NULL CHECK(profile_id='PLATFORM_OPERATIONAL_ALERT_DISCLOSURE'),profile_version TEXT NOT NULL CHECK(profile_version='PLATFORM_OPERATIONAL_ALERT_DISCLOSURE_V1'),
 alert_admission_decision_reference TEXT NOT NULL,recipient_resolution_id TEXT NOT NULL UNIQUE REFERENCES platform_alert_recipient_resolution_decisions(resolution_id),
 family TEXT NOT NULL CHECK(family='PLATFORM_OPERATIONAL_ALERT'),purpose TEXT NOT NULL CHECK(purpose='GOVERNED_DELIVERY_REVIEW'),projection_json TEXT NOT NULL,
 manifest_id TEXT NOT NULL CHECK(manifest_id='platform-operational-alert-disclosure@1'),projection_digest TEXT NOT NULL,representation TEXT NOT NULL CHECK(representation='STRUCTURED_JSON'),
 classification TEXT NOT NULL CHECK(classification='INTERNAL'),sovereignty TEXT NOT NULL CHECK(sovereignty='TENANT_LOCAL'),retention TEXT NOT NULL CHECK(retention='NO_RETENTION'),
 accountable_actor_id TEXT NOT NULL,recipient_entitlement_id TEXT NOT NULL,endpoint_id TEXT NOT NULL,endpoint_destination_digest TEXT NOT NULL,
 channel TEXT NOT NULL CHECK(channel IN('EMAIL','SMS','WHATSAPP')),authority_proof_id TEXT NOT NULL,urgency TEXT NOT NULL CHECK(urgency IN('REVIEW_REQUIRED','URGENT_REVIEW')),
 policy_version TEXT NOT NULL CHECK(policy_version='PLATFORM_ALERT_DISCLOSURE_POLICY_V1'),admitted_at TEXT NOT NULL,expires_at TEXT NOT NULL,
 correlation_id TEXT NOT NULL,causal_references_json TEXT NOT NULL,canonical_digest TEXT NOT NULL UNIQUE,
 recipient_count INTEGER NOT NULL CHECK(recipient_count=1),channel_count INTEGER NOT NULL CHECK(channel_count=1),attempt_count INTEGER NOT NULL CHECK(attempt_count=1),CHECK(expires_at>admitted_at)
);
CREATE TABLE platform_alert_disclosure_consumptions(disclosure_consumption_id TEXT PRIMARY KEY,disclosure_id TEXT NOT NULL UNIQUE REFERENCES platform_alert_disclosure_admissions(disclosure_id),consuming_runtime TEXT NOT NULL,consumed_at TEXT NOT NULL,correlation_id TEXT NOT NULL,causal_references_json TEXT NOT NULL,outcome TEXT NOT NULL CHECK(outcome='CONSUMED'));
CREATE TABLE platform_alert_disclosure_audit_events(audit_event_id TEXT PRIMARY KEY,event_kind TEXT NOT NULL,disclosure_id TEXT,alert_id TEXT,recipient_eligibility_id TEXT,profile_id TEXT NOT NULL,profile_version TEXT NOT NULL,projection_digest TEXT,recipient_entitlement_id TEXT,endpoint_id TEXT,endpoint_destination_digest TEXT,channel TEXT,authority_proof_id TEXT,outcome TEXT NOT NULL,reason_code TEXT NOT NULL,correlation_id TEXT NOT NULL,causal_references_json TEXT NOT NULL,recorded_at TEXT NOT NULL,content_payload TEXT CHECK(content_payload IS NULL));
CREATE TRIGGER platform_alert_disclosures_no_update BEFORE UPDATE ON platform_alert_disclosure_admissions BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DISCLOSURE_IMMUTABLE');END;
CREATE TRIGGER platform_alert_disclosures_no_delete BEFORE DELETE ON platform_alert_disclosure_admissions BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DISCLOSURE_IMMUTABLE');END;
CREATE TRIGGER platform_alert_disclosure_consumptions_no_update BEFORE UPDATE ON platform_alert_disclosure_consumptions BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DISCLOSURE_CONSUMPTION_IMMUTABLE');END;
CREATE TRIGGER platform_alert_disclosure_consumptions_no_delete BEFORE DELETE ON platform_alert_disclosure_consumptions BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DISCLOSURE_CONSUMPTION_IMMUTABLE');END;
CREATE TRIGGER platform_alert_disclosure_audit_no_update BEFORE UPDATE ON platform_alert_disclosure_audit_events BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DISCLOSURE_AUDIT_IMMUTABLE');END;
CREATE TRIGGER platform_alert_disclosure_audit_no_delete BEFORE DELETE ON platform_alert_disclosure_audit_events BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DISCLOSURE_AUDIT_IMMUTABLE');END;
