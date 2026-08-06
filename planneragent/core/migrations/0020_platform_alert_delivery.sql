CREATE TABLE platform_alert_delivery_reservations(
 disclosure_consumption_id TEXT PRIMARY KEY REFERENCES platform_alert_disclosure_consumptions(disclosure_consumption_id),
 endpoint_id TEXT NOT NULL,channel TEXT NOT NULL CHECK(channel IN('EMAIL','SMS','WHATSAPP')),reserved_at TEXT NOT NULL
);
CREATE TABLE platform_alert_delivery_evidence(
 evidence_id TEXT PRIMARY KEY,disclosure_id TEXT NOT NULL REFERENCES platform_alert_disclosure_admissions(disclosure_id),
 disclosure_consumption_id TEXT NOT NULL UNIQUE REFERENCES platform_alert_delivery_reservations(disclosure_consumption_id),alert_id TEXT NOT NULL,
 endpoint_id TEXT NOT NULL,endpoint_destination_digest TEXT NOT NULL,channel TEXT NOT NULL CHECK(channel IN('EMAIL','SMS','WHATSAPP')),
 projection_digest TEXT NOT NULL,payload_digest TEXT NOT NULL,transport_identity TEXT NOT NULL,dispatched_at TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN('SUCCEEDED','FAILED','INDETERMINATE')),failure_code TEXT,provider_message_reference_digest TEXT,
 policy_version TEXT NOT NULL CHECK(policy_version='PLATFORM_ALERT_DELIVERY_POLICY_V1'),correlation_id TEXT NOT NULL,causal_references_json TEXT NOT NULL,
 CHECK((status='SUCCEEDED' AND failure_code IS NULL) OR (status IN('FAILED','INDETERMINATE') AND failure_code IS NOT NULL))
);
CREATE TRIGGER platform_alert_delivery_reservations_no_update BEFORE UPDATE ON platform_alert_delivery_reservations BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DELIVERY_RESERVATION_IMMUTABLE');END;
CREATE TRIGGER platform_alert_delivery_reservations_no_delete BEFORE DELETE ON platform_alert_delivery_reservations BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DELIVERY_RESERVATION_IMMUTABLE');END;
CREATE TRIGGER platform_alert_delivery_evidence_no_update BEFORE UPDATE ON platform_alert_delivery_evidence BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DELIVERY_EVIDENCE_IMMUTABLE');END;
CREATE TRIGGER platform_alert_delivery_evidence_no_delete BEFORE DELETE ON platform_alert_delivery_evidence BEGIN SELECT RAISE(ABORT,'PLATFORM_ALERT_DELIVERY_EVIDENCE_IMMUTABLE');END;
