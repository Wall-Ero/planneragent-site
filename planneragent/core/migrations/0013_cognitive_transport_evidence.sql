CREATE TABLE cognitive_transport_dispatch_reservations (
  consumption_id TEXT PRIMARY KEY REFERENCES knowledge_exposure_consumptions(consumption_id),
  provider TEXT NOT NULL CHECK (provider IN ('openai','anthropic','openrouter')),
  reserved_at TEXT NOT NULL
);
CREATE TRIGGER cognitive_transport_reservations_no_update BEFORE UPDATE ON cognitive_transport_dispatch_reservations
BEGIN SELECT RAISE(ABORT, 'COGNITIVE_TRANSPORT_RESERVATION_IMMUTABLE'); END;
CREATE TRIGGER cognitive_transport_reservations_no_delete BEFORE DELETE ON cognitive_transport_dispatch_reservations
BEGIN SELECT RAISE(ABORT, 'COGNITIVE_TRANSPORT_RESERVATION_IMMUTABLE'); END;

CREATE TABLE cognitive_transport_evidence (
  evidence_id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES knowledge_exposure_decisions(decision_id),
  binding_id TEXT NOT NULL REFERENCES knowledge_exposure_projection_bindings(binding_id),
  consumption_id TEXT NOT NULL UNIQUE REFERENCES cognitive_transport_dispatch_reservations(consumption_id),
  projection_digest TEXT NOT NULL, request_digest TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai','anthropic','openrouter')),
  model TEXT NOT NULL, provider_deployment_class TEXT NOT NULL,
  purpose TEXT NOT NULL, region TEXT NOT NULL, retention TEXT NOT NULL,
  dispatched_at TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('SUCCEEDED','FAILED')),
  response_digest TEXT, failure_code TEXT, causal_references_json TEXT NOT NULL,
  CHECK ((status='SUCCEEDED' AND response_digest IS NOT NULL AND failure_code IS NULL) OR
         (status='FAILED' AND response_digest IS NULL AND failure_code IS NOT NULL))
);
CREATE INDEX cognitive_transport_evidence_decision ON cognitive_transport_evidence(decision_id,dispatched_at);
CREATE TRIGGER cognitive_transport_evidence_no_update BEFORE UPDATE ON cognitive_transport_evidence
BEGIN SELECT RAISE(ABORT, 'COGNITIVE_TRANSPORT_EVIDENCE_IMMUTABLE'); END;
CREATE TRIGGER cognitive_transport_evidence_no_delete BEFORE DELETE ON cognitive_transport_evidence
BEGIN SELECT RAISE(ABORT, 'COGNITIVE_TRANSPORT_EVIDENCE_IMMUTABLE'); END;
