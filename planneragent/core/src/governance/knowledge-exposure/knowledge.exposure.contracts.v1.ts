import type {
  AuditLineageReference,
  CompanyId,
  CorrelationId,
  MembershipId,
  ParticipationContextId,
  PrincipalId,
  SessionId,
  TenantId,
} from "../../operational-identity/contracts/identifiers.v1";
import type {
  DataClassification,
  EncryptionDomain,
  SovereigntyClass,
} from "../../security/encryption.domains";

export const KNOWLEDGE_EXPOSURE_VERSION = 1 as const;
export const KNOWLEDGE_EXPOSURE_POLICY_VERSION =
  "KNOWLEDGE_EXPOSURE_POLICY_V1" as const;

export type KnowledgeExposureOperationV1 =
  | "COGNITIVE_EXPOSURE"
  | "OUTBOUND_DISCLOSURE";

export type KnowledgeExposurePurposeCodeV1 =
  | "LANGUAGE_REFINEMENT"
  | "TRANSLATION"
  | "EXPLANATION"
  | "STRUCTURED_EXTRACTION"
  | "CUSTOMER_QUOTATION_DISCLOSURE";

export interface KnowledgeExposurePurposeV1 {
  readonly version: 1;
  readonly code: KnowledgeExposurePurposeCodeV1;
  readonly operation: KnowledgeExposureOperationV1;
}

export type ProviderOrRecipientClassV1 =
  | "DETERMINISTIC_INTERNAL_PROCESSOR"
  | "LOCAL_SELF_HOSTED_MODEL"
  | "CUSTOMER_MANAGED_MODEL"
  | "ENTERPRISE_DEDICATED_EXTERNAL_PROVIDER"
  | "SOVEREIGN_REGION_EXTERNAL_PROVIDER"
  | "SHARED_REMOTE_PROVIDER"
  | "EXTERNAL_COMMUNICATION_PROVIDER"
  | "AUTHORIZED_BUSINESS_RECIPIENT";

export type KnowledgeCategoryV1 =
  | "RAW_OPERATIONAL_DATA"
  | "INTERPRETED_DATASET"
  | "CANONICAL_FACT"
  | "RECONSTRUCTED_REALITY"
  | "ASSUMPTION"
  | "PLAN"
  | "SCENARIO"
  | "OPTIMIZER_OUTPUT"
  | "RECOMMENDATION"
  | "DECISION_EVIDENCE"
  | "AUTHORITY_EVIDENCE"
  | "OPERATIONAL_MEMORY"
  | "DECISION_MEMORY"
  | "EXECUTION_MEMORY"
  | "TRANSFERABLE_EXPERIENCE"
  | "GENERATED_DOCUMENT"
  | "OUTBOUND_COMMUNICATION";

export type KnowledgeRetentionV1 =
  | "NO_RETENTION"
  | "TRANSIENT_PROCESSING"
  | "TENANT_CONTROLLED_RETENTION";

export interface KnowledgeReferenceV1 {
  readonly version: 1;
  readonly knowledge_reference: string;
  readonly digest: string;
  readonly tenant_id: TenantId;
  readonly company_id: CompanyId;
  readonly category: KnowledgeCategoryV1;
  readonly classification: DataClassification;
  readonly encryption_domain: EncryptionDomain;
  readonly sovereignty: SovereigntyClass;
  readonly export_allowed: boolean;
  readonly llm_access_allowed: boolean;
  readonly tenant_isolated: boolean;
  readonly permitted_regions: readonly string[];
  readonly maximum_retention: KnowledgeRetentionV1;
  readonly authorized_fields: readonly string[];
  readonly provenance_references: readonly string[];
  readonly derived_from: readonly string[];
}

export type KnowledgeProjectionRepresentationV1 =
  | "STRUCTURED_JSON"
  | "PLAIN_TEXT"
  | "GENERATED_DOCUMENT";

export interface KnowledgeProjectionFieldV1 {
  readonly field: string;
  readonly knowledge_reference: string;
  readonly category: KnowledgeCategoryV1;
}

export interface KnowledgeProjectionManifestV1 {
  readonly version: 1;
  readonly schema_id: string;
  readonly schema_version: string;
  readonly representation: KnowledgeProjectionRepresentationV1;
  readonly included_fields: readonly KnowledgeProjectionFieldV1[];
  readonly excluded_categories: readonly KnowledgeCategoryV1[];
  readonly source_knowledge_references: readonly string[];
  readonly projection_digest: string;
}

export interface KnowledgeExposureParticipationV1 {
  readonly version: 1;
  readonly participation_context_id: ParticipationContextId;
  readonly principal_id: PrincipalId;
  readonly session_id: SessionId;
  readonly membership_id: MembershipId;
  readonly tenant_id: TenantId;
  readonly company_id: CompanyId;
  readonly principal_active: true;
  readonly session_active: true;
  readonly membership_active: true;
}

export interface KnowledgeExposureRequestV1 {
  readonly version: 1;
  readonly participation: KnowledgeExposureParticipationV1;
  readonly authority_reference: string;
  readonly authorization_reference?: string;
  readonly operation: KnowledgeExposureOperationV1;
  readonly purpose: KnowledgeExposurePurposeV1;
  readonly knowledge: readonly KnowledgeReferenceV1[];
  readonly projection: KnowledgeProjectionManifestV1;
  readonly target_class: ProviderOrRecipientClassV1;
  readonly target_identity?: string;
  readonly source_region: string;
  readonly target_region: string;
  readonly requested_retention: KnowledgeRetentionV1;
  readonly requested_validity_ms: number;
  readonly requested_at: string;
  readonly correlation_id: CorrelationId;
  readonly causal_references: readonly AuditLineageReference[];
}

export interface KnowledgeExposureDecisionV1 {
  readonly version: 1;
  readonly decision_id: string;
  readonly request_id: string;
  readonly outcome: "ADMITTED" | "DENIED";
  readonly principal_id: PrincipalId | "UNKNOWN";
  readonly session_id: SessionId | "UNKNOWN";
  readonly membership_id: MembershipId | "UNKNOWN";
  readonly tenant_id: TenantId | "UNKNOWN";
  readonly company_id: CompanyId | "UNKNOWN";
  readonly authority_reference: string | "UNKNOWN";
  readonly operation: KnowledgeExposureOperationV1 | "UNKNOWN";
  readonly purpose: KnowledgeExposurePurposeCodeV1 | "UNKNOWN";
  readonly knowledge_digests: readonly string[];
  readonly projection_digest: string | "UNKNOWN";
  readonly target_class: ProviderOrRecipientClassV1 | "UNKNOWN";
  readonly target_identity?: string;
  readonly effective_classification: DataClassification | "UNKNOWN";
  readonly effective_sovereignty: SovereigntyClass | "UNKNOWN";
  readonly effective_regions: readonly string[];
  readonly effective_retention: KnowledgeRetentionV1 | "UNKNOWN";
  readonly policy_version: typeof KNOWLEDGE_EXPOSURE_POLICY_VERSION;
  readonly reason_codes: readonly KnowledgeExposureFailureCode[];
  readonly issued_at: string;
  readonly expires_at: string;
  readonly consumption_identity: string;
  readonly correlation_id: CorrelationId | "UNKNOWN";
}

export type KnowledgeExposureFailureCode =
  | "KNOWLEDGE_EXPOSURE_REQUEST_INVALID"
  | "KNOWLEDGE_REFERENCE_INVALID"
  | "KNOWLEDGE_OWNER_CONTRADICTION"
  | "KNOWLEDGE_CLASSIFICATION_MISSING"
  | "KNOWLEDGE_DOMAIN_LLM_PROHIBITED"
  | "KNOWLEDGE_DOMAIN_EXPORT_PROHIBITED"
  | "KNOWLEDGE_NON_EXPORTABLE"
  | "KNOWLEDGE_TENANT_CONTRADICTION"
  | "KNOWLEDGE_REGION_CONFLICT"
  | "KNOWLEDGE_RETENTION_CONFLICT"
  | "KNOWLEDGE_PURPOSE_INVALID"
  | "KNOWLEDGE_OPERATION_MISMATCH"
  | "KNOWLEDGE_PROVIDER_CLASS_PROHIBITED"
  | "KNOWLEDGE_RECIPIENT_CLASS_PROHIBITED"
  | "KNOWLEDGE_PROJECTION_INVALID"
  | "KNOWLEDGE_PROJECTION_FIELD_UNAUTHORIZED"
  | "KNOWLEDGE_PROJECTION_DIGEST_MISMATCH"
  | "KNOWLEDGE_DERIVATION_RESTRICTION_UNKNOWN"
  | "KNOWLEDGE_DERIVATION_DOWNGRADE_PROHIBITED"
  | "KNOWLEDGE_AUTHORITY_MISSING"
  | "KNOWLEDGE_DECISION_EXPIRED"
  | "KNOWLEDGE_DECISION_SUBSTITUTED"
  | "KNOWLEDGE_EVIDENCE_INVALID";

export class KnowledgeExposureError extends Error {
  constructor(readonly code: KnowledgeExposureFailureCode) {
    super(code);
    this.name = "KnowledgeExposureError";
  }
}

export interface KnowledgeExposureEvidenceV1 {
  readonly version: 1;
  readonly evidence_id: string;
  readonly request_id: string;
  readonly decision_id: string;
  readonly outcome: KnowledgeExposureDecisionV1["outcome"];
  readonly knowledge_digests: readonly string[];
  readonly projection_digest: string | "UNKNOWN";
  readonly classifications: readonly DataClassification[];
  readonly encryption_domains: readonly EncryptionDomain[];
  readonly purpose: KnowledgeExposureDecisionV1["purpose"];
  readonly operation: KnowledgeExposureDecisionV1["operation"];
  readonly target_class: KnowledgeExposureDecisionV1["target_class"];
  readonly policy_version: typeof KNOWLEDGE_EXPOSURE_POLICY_VERSION;
  readonly reason_codes: readonly KnowledgeExposureFailureCode[];
  readonly issued_at: string;
  readonly causal_references: readonly AuditLineageReference[];
}
