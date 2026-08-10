import type { OrganizationalResponsibilityScopeV1 } from "../../operational-identity/contracts/track-b.v1";
import type { CanonicalEffectiveOperationalAuthorityProofV1, EffectiveOperationalAuthorityProofRequestV1 } from "../organizational-authority";
import type { KnowledgeExposureDecisionV1, KnowledgeExposurePurposeCodeV1, KnowledgeExposureRequestV1 } from "./knowledge.exposure.contracts.v1";

export const CUSTOMER_QUOTATION_AUTHORITY_DOMAIN_V1 = "CUSTOMER_COMMERCIAL_COMMUNICATION" as const;
export const CUSTOMER_QUOTATION_AUTHORITY_INTENT_V1 = "DISCLOSE_CUSTOMER_QUOTATION" as const;
export const CUSTOMER_QUOTATION_AUTHORITY_SCOPE_V1: OrganizationalResponsibilityScopeV1 = Object.freeze({
  domain: CUSTOMER_QUOTATION_AUTHORITY_DOMAIN_V1,
  intents: Object.freeze([CUSTOMER_QUOTATION_AUTHORITY_INTENT_V1]),
  scopes: Object.freeze([CUSTOMER_QUOTATION_AUTHORITY_INTENT_V1]),
  limits: Object.freeze([]), team_or_subordinate_actor_ids: Object.freeze([]), operational_constraints: Object.freeze([]),
});

export type OrganizationalAuthorityApplicabilityV1 =
  | "ORGANIZATIONAL_OPERATIONAL_AUTHORITY_REQUIRED"
  | "ORGANIZATIONAL_AUTHORITY_NOT_APPLICABLE"
  | "AUTHORITY_SOURCE_UNDEFINED";
export type SecurityEvidenceDomainV1 = "ORGANIZATIONAL_AUTHORITY" | "P9";
export type SecurityEvidenceApplicabilityStatusV1 = "APPLICABLE" | "NOT_APPLICABLE" | "UNDEFINED";
export interface SecurityEvidenceApplicabilityV1 {
  readonly version: 1; readonly applicability_id: string; readonly domain: SecurityEvidenceDomainV1;
  readonly status: SecurityEvidenceApplicabilityStatusV1; readonly reason: "COGNITIVE_TRANSFORMATION_ONLY" | "CUSTOMER_QUOTATION_DISCLOSURE" | "ORDINARY_COGNITIVE_PROVIDER_OPERATION" | "AUTHORITY_SOURCE_UNDEFINED";
  readonly request_id: string; readonly decision_id: string; readonly purpose: string; readonly projection_digest: string;
  readonly principal_id: string; readonly session_id: string; readonly tenant_id: string; readonly company_id: string;
  readonly recorded_at: string; readonly correlation_id: string; readonly causal_references: readonly string[];
}
export interface KnowledgeExposureAuthorityEvidenceV1 {
  readonly version: 1; readonly evidence_id: string; readonly authority_source_class: "ORGANIZATIONAL_OPERATIONAL_AUTHORITY";
  readonly authority_proof_id: string; readonly authority_proof_digest: string; readonly oag_actor_id: string;
  readonly principal_id: string; readonly tenant_id: string; readonly company_id: string;
  readonly effective_operational_domain: typeof CUSTOMER_QUOTATION_AUTHORITY_DOMAIN_V1;
  readonly effective_scope: OrganizationalResponsibilityScopeV1; readonly graph_version: string;
  readonly graph_digest: string; readonly authority_policy_id: "OAG_AUTHORITY_POLICY_V2"; readonly authority_policy_version: 2;
  readonly confirmation_chain_references: readonly string[]; readonly delegation_lineage: readonly string[];
  readonly issued_at: string; readonly expires_at: string; readonly current_state_resolution: "CURRENT";
  readonly request_id: string; readonly decision_id: string; readonly purpose: "CUSTOMER_QUOTATION_DISCLOSURE";
  readonly projection_digest: string; readonly correlation_id: string; readonly causal_references: readonly string[];
}
export interface KnowledgeExposureAuthorityBindingV1 {
  readonly version: 1; readonly binding_id: string; readonly binding_digest: string;
  readonly organizational_authority: SecurityEvidenceApplicabilityV1;
  readonly authority_evidence?: KnowledgeExposureAuthorityEvidenceV1;
  readonly p9?: SecurityEvidenceApplicabilityV1;
}
export interface KnowledgeExposureAuthorityBindingInputV1 {
  readonly version: 1; readonly request: KnowledgeExposureRequestV1; readonly decision: KnowledgeExposureDecisionV1;
  readonly oag_actor_id?: string; readonly authority_proof_id?: string; readonly authority_proof_digest?: string;
  readonly authority_proof?: never; readonly p9_operation_id?: never; readonly p9_ledger_id?: never; readonly p9_record_hash?: never;
}
export interface CurrentEffectiveAuthorityResolverV1 {
  resolveCurrentEffectiveOperationalAuthorityProofV1(request: EffectiveOperationalAuthorityProofRequestV1): Promise<CanonicalEffectiveOperationalAuthorityProofV1>;
}
export interface KnowledgeExposureAuthorityBindingRepositoryV1 { persist(binding: KnowledgeExposureAuthorityBindingV1): Promise<"CREATED" | "IDENTICAL">; }
export type SecurityEvidenceAuthorityFailureCodeV1 =
  | "SECURITY_EVIDENCE_AUTHORITY_REQUIRED" | "SECURITY_EVIDENCE_AUTHORITY_SOURCE_UNDEFINED" | "SECURITY_EVIDENCE_AUTHORITY_SOURCE_INVALID"
  | "SECURITY_EVIDENCE_AUTHORITY_PROOF_INVALID" | "SECURITY_EVIDENCE_AUTHORITY_PROOF_STALE" | "SECURITY_EVIDENCE_AUTHORITY_DIGEST_MISMATCH"
  | "SECURITY_EVIDENCE_AUTHORITY_ACTOR_MISMATCH" | "SECURITY_EVIDENCE_AUTHORITY_PRINCIPAL_MISMATCH" | "SECURITY_EVIDENCE_AUTHORITY_TENANT_MISMATCH"
  | "SECURITY_EVIDENCE_AUTHORITY_COMPANY_MISMATCH" | "SECURITY_EVIDENCE_AUTHORITY_SCOPE_MISMATCH" | "SECURITY_EVIDENCE_AUTHORITY_PURPOSE_MISMATCH"
  | "SECURITY_EVIDENCE_AUTHORITY_EXPIRED" | "SECURITY_EVIDENCE_LEGACY_AUTHORITY_MISMATCH" | "SECURITY_EVIDENCE_P9_APPLICABILITY_INVALID"
  | "SECURITY_EVIDENCE_P9_REFERENCE_INVALID" | "SECURITY_EVIDENCE_PERSISTENCE_FAILED" | "SECURITY_EVIDENCE_AUDIT_FAILED";
export class SecurityEvidenceAuthorityErrorV1 extends Error { constructor(readonly code: SecurityEvidenceAuthorityFailureCodeV1){super(code);this.name="SecurityEvidenceAuthorityErrorV1";} }

export function classifyKnowledgeExposureAuthorityV1(purpose: KnowledgeExposurePurposeCodeV1 | string): OrganizationalAuthorityApplicabilityV1 {
  if (["LANGUAGE_REFINEMENT","TRANSLATION","EXPLANATION","STRUCTURED_EXTRACTION"].includes(purpose)) return "ORGANIZATIONAL_AUTHORITY_NOT_APPLICABLE";
  if (purpose === "CUSTOMER_QUOTATION_DISCLOSURE") return "ORGANIZATIONAL_OPERATIONAL_AUTHORITY_REQUIRED";
  return "AUTHORITY_SOURCE_UNDEFINED";
}
