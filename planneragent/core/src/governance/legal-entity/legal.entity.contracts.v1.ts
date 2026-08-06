export type LegalEntityFailureCodeV1 =
  | "LEGAL_ENTITY_CLAIM_INVALID" | "LEGAL_ENTITY_JURISDICTION_UNSUPPORTED"
  | "LEGAL_ENTITY_IDENTIFIER_INVALID" | "LEGAL_ENTITY_EVIDENCE_REQUIRED"
  | "LEGAL_ENTITY_EVIDENCE_INVALID" | "LEGAL_ENTITY_EVIDENCE_EXPIRED"
  | "LEGAL_ENTITY_EVIDENCE_ISSUER_UNTRUSTED" | "LEGAL_ENTITY_VERIFIER_UNAUTHORIZED"
  | "LEGAL_ENTITY_IDENTITY_MISMATCH" | "LEGAL_ENTITY_DUPLICATE"
  | "LEGAL_ENTITY_CONFLICT" | "LEGAL_ENTITY_NOT_VERIFIED"
  | "LEGAL_ENTITY_VERIFICATION_EXPIRED" | "LEGAL_ENTITY_REVOKED"
  | "LEGAL_ENTITY_SUPERSEDED" | "LEGAL_ENTITY_COMPANY_BINDING_MISMATCH"
  | "LEGAL_ENTITY_MEMBERSHIP_NOT_GRANTED" | "LEGAL_ENTITY_AUTHORITY_NOT_GRANTED"
  | "LEGAL_ENTITY_PERSISTENCE_FAILED" | "LEGAL_ENTITY_AUDIT_FAILED";

export type LegalEntityStatusV1 = "VERIFIED_BY_AUTHORIZED_REVIEW" | "EXPIRED" | "REVOKED" | "SUPERSEDED";
export type LegalEntityEvidenceTypeV1 = "SIGNED_OFFICIAL_DOCUMENT_REFERENCE" | "GOVERNED_MANUAL_REVIEW_DECISION";

export interface LegalEntityClaimV1 {
  readonly version: 1; readonly claim_id: string; readonly claimant_principal_id: string;
  readonly claim_status: "CLAIMED" | "EVIDENCE_SUBMITTED";
  readonly registered_name: string; readonly jurisdiction: string; readonly registration_type: string;
  readonly registration_identifier: string; readonly registration_profile: string;
  readonly evidence_references: readonly string[]; readonly purpose: "LEGAL_ENTITY_IDENTIFICATION";
  readonly issued_at: string; readonly expires_at?: string; readonly correlation_id: string;
  readonly caused_by: readonly string[];
}

export interface LegalEntityEvidenceV1 {
  readonly version: 1; readonly evidence_id: string; readonly issuer_id: string;
  readonly evidence_type: LegalEntityEvidenceTypeV1; readonly subject_claim_id: string;
  readonly jurisdiction: string; readonly registration_profile: string;
  readonly registration_identifier: string; readonly registered_name: string;
  readonly issued_at: string; readonly effective_at: string; readonly expires_at?: string;
  readonly immutable_digest: string; readonly governed_reference: string;
  readonly verification_state: "SUBMITTED" | "ACCEPTED" | "REJECTED";
  readonly verification_authority_id?: string;
}

export interface LegalEntityVerificationDecisionV1 {
  readonly version: 1; readonly decision_id: string; readonly claim_id: string;
  readonly evidence_ids: readonly string[]; readonly verifier_id: string;
  readonly verifier_class: "GOVERNED_AUTHORIZED_REVIEWER";
  readonly decision: "VERIFIED" | "REJECTED"; readonly reason_codes: readonly string[];
  readonly decided_at: string; readonly valid_until?: string; readonly correlation_id: string;
  readonly caused_by: readonly string[];
}

export interface LegalEntityIdentityV1 {
  readonly version: 1; readonly legal_entity_id: string; readonly canonical_key: string;
  readonly jurisdiction: string; readonly registration_profile: string;
  readonly registration_identifier: string; readonly registered_name: string;
  readonly registration_type: string; readonly entity_status: "ACTIVE";
  readonly verification_status: LegalEntityStatusV1;
  readonly verification_method: "GOVERNED_MANUAL_REVIEW";
  readonly verification_evidence_ids: readonly string[]; readonly effective_at: string;
  readonly verified_at: string; readonly reverify_at?: string; readonly revoked_at?: string;
  readonly revocation_reference?: string; readonly superseded_by_legal_entity_id?: string;
  readonly claim_id: string; readonly verification_decision_id: string;
  readonly correlation_id: string; readonly caused_by: readonly string[];
}

export interface CompanyLegalEntityBindingV1 {
  readonly version: 1; readonly binding_id: string; readonly company_id: string;
  readonly legal_entity_id: string; readonly bound_at: string; readonly binding_reference: string;
  readonly correlation_id: string; readonly caused_by: readonly string[];
  readonly grants_membership: false; readonly grants_authority: false; readonly grants_contractual_authority: false;
}

export interface LegalEntityVerificationRequestV1 {
  readonly claim: LegalEntityClaimV1; readonly evidence: readonly LegalEntityEvidenceV1[];
  readonly decision: LegalEntityVerificationDecisionV1;
}

export class LegalEntityFailureV1 extends Error {
  constructor(readonly code: LegalEntityFailureCodeV1) { super(code); this.name = "LegalEntityFailureV1"; }
}
