CREATE TABLE email_ownership_challenges (
  challenge_id TEXT PRIMARY KEY,
  normalized_email TEXT NOT NULL,
  secret_digest TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('ISSUED', 'CONSUMED', 'REVOKED')),
  failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  consumed_at TEXT,
  evidence_id TEXT UNIQUE,
  evidence_nonce TEXT UNIQUE,
  verification_reference TEXT UNIQUE,
  audit_lineage_json TEXT NOT NULL,
  CHECK (expires_at > issued_at),
  CHECK (
    (lifecycle_state = 'ISSUED' AND consumed_at IS NULL AND evidence_id IS NULL AND evidence_nonce IS NULL AND verification_reference IS NULL) OR
    (lifecycle_state = 'CONSUMED' AND consumed_at IS NOT NULL AND evidence_id IS NOT NULL AND evidence_nonce IS NOT NULL AND verification_reference IS NOT NULL) OR
    (lifecycle_state = 'REVOKED' AND consumed_at IS NULL AND evidence_id IS NULL AND evidence_nonce IS NULL AND verification_reference IS NULL)
  )
);

CREATE INDEX email_ownership_challenges_email ON email_ownership_challenges(normalized_email, issued_at);

CREATE TRIGGER email_ownership_challenge_terminal_guard
BEFORE UPDATE ON email_ownership_challenges
WHEN OLD.lifecycle_state <> 'ISSUED'
BEGIN
  SELECT RAISE(ABORT, 'EMAIL_OWNERSHIP_CHALLENGE_TERMINAL');
END;

CREATE TRIGGER email_ownership_challenge_no_delete
BEFORE DELETE ON email_ownership_challenges
BEGIN
  SELECT RAISE(ABORT, 'EMAIL_OWNERSHIP_CHALLENGE_IMMUTABLE');
END;
