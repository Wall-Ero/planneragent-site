CREATE TABLE governed_email_delivery_reservations (
  disclosure_consumption_id TEXT PRIMARY KEY REFERENCES outbound_disclosure_consumptions(disclosure_consumption_id),
  provider TEXT NOT NULL, reserved_at TEXT NOT NULL
);
CREATE TRIGGER governed_email_reservations_no_update BEFORE UPDATE ON governed_email_delivery_reservations
BEGIN SELECT RAISE(ABORT,'GOVERNED_EMAIL_RESERVATION_IMMUTABLE'); END;
CREATE TRIGGER governed_email_reservations_no_delete BEFORE DELETE ON governed_email_delivery_reservations
BEGIN SELECT RAISE(ABORT,'GOVERNED_EMAIL_RESERVATION_IMMUTABLE'); END;

CREATE TABLE governed_email_delivery_evidence (
  delivery_evidence_id TEXT PRIMARY KEY,
  disclosure_id TEXT NOT NULL REFERENCES outbound_disclosure_admissions(disclosure_id),
  disclosure_consumption_id TEXT NOT NULL UNIQUE REFERENCES governed_email_delivery_reservations(disclosure_consumption_id),
  recipient_id TEXT NOT NULL, entitlement_reference TEXT NOT NULL, endpoint_reference TEXT NOT NULL,
  projection_digest TEXT NOT NULL, canonical_projection_digest TEXT NOT NULL,
  request_digest TEXT NOT NULL, provider TEXT NOT NULL, dispatched_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCEEDED','FAILED')),
  provider_message_digest TEXT, failure_code TEXT, causal_references_json TEXT NOT NULL,
  CHECK ((status='SUCCEEDED' AND failure_code IS NULL) OR (status='FAILED' AND provider_message_digest IS NULL AND failure_code IS NOT NULL))
);
CREATE INDEX governed_email_evidence_disclosure ON governed_email_delivery_evidence(disclosure_id,dispatched_at);
CREATE TRIGGER governed_email_evidence_no_update BEFORE UPDATE ON governed_email_delivery_evidence
BEGIN SELECT RAISE(ABORT,'GOVERNED_EMAIL_EVIDENCE_IMMUTABLE'); END;
CREATE TRIGGER governed_email_evidence_no_delete BEFORE DELETE ON governed_email_delivery_evidence
BEGIN SELECT RAISE(ABORT,'GOVERNED_EMAIL_EVIDENCE_IMMUTABLE'); END;
