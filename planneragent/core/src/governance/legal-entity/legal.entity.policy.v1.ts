import { LegalEntityFailureV1, type LegalEntityClaimV1, type LegalEntityEvidenceV1 } from "./legal.entity.contracts.v1";

export interface LegalEntityPolicyV1 {
  readonly profiles: Readonly<Record<string, Readonly<{ identifier: RegExp; registration_types: readonly string[] }>>>;
  readonly trusted_evidence_issuers: readonly string[];
  readonly authorized_reviewers: readonly string[];
}

export const INITIAL_LEGAL_ENTITY_POLICY_V1: LegalEntityPolicyV1 = Object.freeze({
  profiles: Object.freeze({
    "IT:BUSINESS_REGISTER": Object.freeze({ identifier: /^[A-Z0-9.-]{6,32}$/, registration_types: Object.freeze(["COMPANY", "COOPERATIVE", "PARTNERSHIP"]) }),
  }),
  trusted_evidence_issuers: Object.freeze(["PLANNERNET_GOVERNED_EVIDENCE_INTAKE"]),
  authorized_reviewers: Object.freeze(["PLANNERNET_LEGAL_ENTITY_REVIEW"]),
});

export function normalizeLegalEntityClaimV1(input: LegalEntityClaimV1, policy = INITIAL_LEGAL_ENTITY_POLICY_V1): LegalEntityClaimV1 {
  const jurisdiction = input.jurisdiction.trim().toUpperCase();
  const profile = input.registration_profile.trim().toUpperCase();
  const key = `${jurisdiction}:${profile}`;
  const rule = policy.profiles[key];
  if (!rule) throw new LegalEntityFailureV1("LEGAL_ENTITY_JURISDICTION_UNSUPPORTED");
  const identifier = input.registration_identifier.replace(/\s+/g, "").toUpperCase();
  const name = input.registered_name.trim().replace(/\s+/g, " ");
  if (!input.claim_id || !input.claimant_principal_id || !input.correlation_id || input.purpose !== "LEGAL_ENTITY_IDENTIFICATION" || !validTime(input.issued_at) || name.length < 2 ||
    (input.claim_status === "EVIDENCE_SUBMITTED") !== (input.evidence_references.length > 0))
    throw new LegalEntityFailureV1("LEGAL_ENTITY_CLAIM_INVALID");
  if (!rule.identifier.test(identifier) || !rule.registration_types.includes(input.registration_type))
    throw new LegalEntityFailureV1("LEGAL_ENTITY_IDENTIFIER_INVALID");
  return freeze({ ...input, jurisdiction, registration_profile: profile, registration_identifier: identifier, registered_name: name });
}

export function validateEvidenceV1(claim: LegalEntityClaimV1, evidence: LegalEntityEvidenceV1, now: string, policy = INITIAL_LEGAL_ENTITY_POLICY_V1): void {
  if (!evidence.evidence_id || !evidence.immutable_digest || !evidence.governed_reference || evidence.subject_claim_id !== claim.claim_id ||
    evidence.verification_state !== "ACCEPTED" || !validTime(evidence.issued_at) || !validTime(evidence.effective_at))
    throw new LegalEntityFailureV1("LEGAL_ENTITY_EVIDENCE_INVALID");
  if (!policy.trusted_evidence_issuers.includes(evidence.issuer_id)) throw new LegalEntityFailureV1("LEGAL_ENTITY_EVIDENCE_ISSUER_UNTRUSTED");
  if (evidence.expires_at && evidence.expires_at <= now) throw new LegalEntityFailureV1("LEGAL_ENTITY_EVIDENCE_EXPIRED");
  if (evidence.jurisdiction !== claim.jurisdiction) throw new LegalEntityFailureV1("LEGAL_ENTITY_IDENTITY_MISMATCH");
  if (evidence.registration_identifier.replace(/\s+/g, "").toUpperCase() !== claim.registration_identifier) throw new LegalEntityFailureV1("LEGAL_ENTITY_IDENTITY_MISMATCH");
  if (evidence.registered_name.trim().replace(/\s+/g, " ").toUpperCase() !== claim.registered_name.toUpperCase()) throw new LegalEntityFailureV1("LEGAL_ENTITY_CONFLICT");
}

export function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function validTime(value: string): boolean { return Number.isFinite(Date.parse(value)); }
