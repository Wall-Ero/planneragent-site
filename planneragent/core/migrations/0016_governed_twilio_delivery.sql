CREATE TABLE governed_twilio_dispatch_reservations (
  disclosure_consumption_id TEXT PRIMARY KEY REFERENCES outbound_disclosure_consumptions(disclosure_consumption_id),
  sealed_message_id TEXT NOT NULL UNIQUE, channel TEXT NOT NULL CHECK(channel IN ('SMS','WHATSAPP')),
  product TEXT NOT NULL CHECK(product IN ('TWILIO_SMS','TWILIO_WHATSAPP')), reserved_at TEXT NOT NULL
);
CREATE TRIGGER governed_twilio_reservations_no_update BEFORE UPDATE ON governed_twilio_dispatch_reservations BEGIN SELECT RAISE(ABORT,'GOVERNED_TWILIO_RESERVATION_IMMUTABLE'); END;
CREATE TRIGGER governed_twilio_reservations_no_delete BEFORE DELETE ON governed_twilio_dispatch_reservations BEGIN SELECT RAISE(ABORT,'GOVERNED_TWILIO_RESERVATION_IMMUTABLE'); END;

CREATE TABLE governed_twilio_delivery_evidence (
  evidence_id TEXT PRIMARY KEY, disclosure_id TEXT NOT NULL REFERENCES outbound_disclosure_admissions(disclosure_id),
  decision_id TEXT NOT NULL, binding_id TEXT NOT NULL,
  disclosure_consumption_id TEXT NOT NULL UNIQUE REFERENCES governed_twilio_dispatch_reservations(disclosure_consumption_id),
  sealed_message_id TEXT NOT NULL UNIQUE, projection_digest TEXT NOT NULL, message_digest TEXT NOT NULL,
  recipient_entitlement_reference TEXT NOT NULL, destination_digest TEXT NOT NULL,
  channel TEXT NOT NULL CHECK(channel IN ('SMS','WHATSAPP')), product TEXT NOT NULL CHECK(product IN ('TWILIO_SMS','TWILIO_WHATSAPP')),
  provider_identity TEXT NOT NULL, sender_identity_reference TEXT NOT NULL, purpose TEXT NOT NULL,
  tenant_id TEXT NOT NULL, company_id TEXT NOT NULL, dispatched_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('SUCCEEDED','FAILED','INDETERMINATE')),
  failure_code TEXT, provider_message_reference_digest TEXT,
  correlation_id TEXT NOT NULL, causal_references_json TEXT NOT NULL,
  CHECK ((status='SUCCEEDED' AND failure_code IS NULL) OR (status IN ('FAILED','INDETERMINATE') AND provider_message_reference_digest IS NULL AND failure_code IS NOT NULL))
);
CREATE INDEX governed_twilio_evidence_disclosure ON governed_twilio_delivery_evidence(disclosure_id,dispatched_at);
CREATE TRIGGER governed_twilio_evidence_no_update BEFORE UPDATE ON governed_twilio_delivery_evidence BEGIN SELECT RAISE(ABORT,'GOVERNED_TWILIO_EVIDENCE_IMMUTABLE'); END;
CREATE TRIGGER governed_twilio_evidence_no_delete BEFORE DELETE ON governed_twilio_delivery_evidence BEGIN SELECT RAISE(ABORT,'GOVERNED_TWILIO_EVIDENCE_IMMUTABLE'); END;
