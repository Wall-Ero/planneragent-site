ALTER TABLE oir_external_authentication_bindings
ADD COLUMN verified_normalized_email TEXT;

UPDATE oir_external_authentication_bindings
SET verified_normalized_email = (
  SELECT challenges.normalized_email
  FROM email_ownership_challenges challenges
  WHERE verification_reference = 'email-challenge:' || challenges.challenge_id
    AND challenges.lifecycle_state = 'CONSUMED'
    AND challenges.verification_reference = oir_external_authentication_bindings.verification_reference
)
WHERE provider = 'EMAIL_OWNERSHIP'
  AND issuer = 'planneragent:email-ownership'
  AND verified_normalized_email IS NULL;
