# GCC-5B controlled interpretation shadow

The controlled shadow is disabled unless `INTERPRETATION_STUDENT_SHADOW_STATE` is exactly `CONTROLLED_SHADOW`. Its sample defaults to zero percent, and the kill switch stops new scheduling. Sampling uses the admitted request ID as a stable, privacy-safe key; requester plaintext is neither the key nor retained for sampling.

`request_digest` is SHA-256 over the trimmed requester-message bytes. It proves only that two observations were derived from identical normalized input bytes. It does not prove truth, authorship, authorization, provenance, or operational validity, and it must never be treated as authority.

Shadow observations are metadata-only, non-authoritative, asynchronous, and excluded from the live response path. Identity is checked against the pinned qualified v0.6 candidate before inference. No retries are performed.
