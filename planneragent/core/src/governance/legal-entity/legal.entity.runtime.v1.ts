import { LegalEntityFailureV1, type LegalEntityIdentityV1, type LegalEntityVerificationRequestV1 } from "./legal.entity.contracts.v1";
import { INITIAL_LEGAL_ENTITY_POLICY_V1, freeze, normalizeLegalEntityClaimV1, validateEvidenceV1, type LegalEntityPolicyV1 } from "./legal.entity.policy.v1";

export async function verifyLegalEntityV1(request: LegalEntityVerificationRequestV1, now: string, policy: LegalEntityPolicyV1 = INITIAL_LEGAL_ENTITY_POLICY_V1): Promise<LegalEntityIdentityV1> {
  const claim = normalizeLegalEntityClaimV1(structuredClone(request.claim), policy);
  if (claim.expires_at && claim.expires_at <= now) throw new LegalEntityFailureV1("LEGAL_ENTITY_CLAIM_INVALID");
  if (!request.evidence.length) throw new LegalEntityFailureV1("LEGAL_ENTITY_EVIDENCE_REQUIRED");
  if (request.evidence.some(e => !claim.evidence_references.includes(e.evidence_id)) || claim.evidence_references.some(id => !request.evidence.some(e => e.evidence_id === id)))
    throw new LegalEntityFailureV1("LEGAL_ENTITY_EVIDENCE_INVALID");
  for (const evidence of request.evidence) validateEvidenceV1(claim, evidence, now, policy);
  const decision = request.decision;
  if (!policy.authorized_reviewers.includes(decision.verifier_id) || decision.verifier_class !== "GOVERNED_AUTHORIZED_REVIEWER")
    throw new LegalEntityFailureV1("LEGAL_ENTITY_VERIFIER_UNAUTHORIZED");
  if (decision.claim_id !== claim.claim_id || decision.decision !== "VERIFIED" || decision.evidence_ids.length !== request.evidence.length || request.evidence.some(e => !decision.evidence_ids.includes(e.evidence_id)))
    throw new LegalEntityFailureV1("LEGAL_ENTITY_NOT_VERIFIED");
  if (decision.valid_until && decision.valid_until <= now) throw new LegalEntityFailureV1("LEGAL_ENTITY_VERIFICATION_EXPIRED");
  const canonicalKey = `${claim.jurisdiction}:${claim.registration_profile}:${claim.registration_identifier}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalKey));
  const id = `le_${Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2, "0")).join("").slice(0, 32)}`;
  return freeze({
    version: 1, legal_entity_id: id, canonical_key: canonicalKey, jurisdiction: claim.jurisdiction,
    registration_profile: claim.registration_profile, registration_identifier: claim.registration_identifier,
    registered_name: claim.registered_name, registration_type: claim.registration_type, entity_status: "ACTIVE",
    verification_status: "VERIFIED_BY_AUTHORIZED_REVIEW", verification_method: "GOVERNED_MANUAL_REVIEW",
    verification_evidence_ids: [...decision.evidence_ids], effective_at: request.evidence.map(e => e.effective_at).sort()[0]!,
    verified_at: decision.decided_at, ...(decision.valid_until ? { reverify_at: decision.valid_until } : {}),
    claim_id: claim.claim_id, verification_decision_id: decision.decision_id,
    correlation_id: decision.correlation_id, caused_by: [...decision.caused_by],
  });
}

export function revalidateLegalEntityV1(entity: LegalEntityIdentityV1, now: string): LegalEntityIdentityV1 {
  if (entity.verification_status === "REVOKED") throw new LegalEntityFailureV1("LEGAL_ENTITY_REVOKED");
  if (entity.verification_status === "SUPERSEDED") throw new LegalEntityFailureV1("LEGAL_ENTITY_SUPERSEDED");
  if (entity.verification_status !== "VERIFIED_BY_AUTHORIZED_REVIEW") throw new LegalEntityFailureV1("LEGAL_ENTITY_NOT_VERIFIED");
  if (entity.reverify_at && entity.reverify_at <= now) throw new LegalEntityFailureV1("LEGAL_ENTITY_VERIFICATION_EXPIRED");
  return freeze(structuredClone(entity));
}
