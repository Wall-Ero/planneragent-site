import type { KnowledgeExposureDecisionV1, KnowledgeExposureEvidenceV1, KnowledgeExposureRequestV1, KnowledgeRetentionV1, ProviderOrRecipientClassV1 } from "../knowledge.exposure.contracts.v1";

export type KnowledgeExposurePersistenceFailureCode =
  | "KNOWLEDGE_DECISION_PERSISTENCE_INVALID" | "KNOWLEDGE_DECISION_IDENTITY_CONFLICT"
  | "KNOWLEDGE_DECISION_EVIDENCE_MISMATCH" | "KNOWLEDGE_DECISION_NOT_FOUND"
  | "KNOWLEDGE_DECISION_NOT_ADMITTED" | "KNOWLEDGE_DECISION_EXPIRED"
  | "KNOWLEDGE_DECISION_CURRENT_STATE_INVALID" | "KNOWLEDGE_BINDING_INVALID"
  | "KNOWLEDGE_BINDING_NOT_FOUND" | "KNOWLEDGE_BINDING_SUBSTITUTED"
  | "KNOWLEDGE_MANIFEST_SUBSTITUTED" | "KNOWLEDGE_PROJECTION_DIGEST_SUBSTITUTED"
  | "KNOWLEDGE_REFERENCE_SET_SUBSTITUTED" | "KNOWLEDGE_PURPOSE_SUBSTITUTED"
  | "KNOWLEDGE_OPERATION_SUBSTITUTED" | "KNOWLEDGE_TARGET_SUBSTITUTED"
  | "KNOWLEDGE_REGION_SUBSTITUTED" | "KNOWLEDGE_RETENTION_SUBSTITUTED"
  | "KNOWLEDGE_PARTICIPATION_INVALID" | "KNOWLEDGE_AUTHORITY_INVALID"
  | "KNOWLEDGE_CONSUMPTION_REPLAYED" | "KNOWLEDGE_CONSUMPTION_CONFLICT"
  | "KNOWLEDGE_CONSUMPTION_FAILED" | "KNOWLEDGE_AUDIT_PERSISTENCE_FAILED";

export class KnowledgeExposurePersistenceError extends Error {
  constructor(readonly code: KnowledgeExposurePersistenceFailureCode) { super(code); this.name = "KnowledgeExposurePersistenceError"; }
}

export interface PersistedKnowledgeExposureV1 {
  readonly request: KnowledgeExposureRequestV1;
  readonly decision: KnowledgeExposureDecisionV1;
  readonly evidence: KnowledgeExposureEvidenceV1;
  readonly manifest_id: string;
  readonly binding_id?: string;
  readonly canonical_digest: string;
}

export interface KnowledgeExposureConsumptionClaimV1 {
  readonly version: 1; readonly decision_id: string; readonly binding_id: string;
  readonly principal_id: string; readonly session_id: string; readonly membership_id: string;
  readonly tenant_id: string; readonly company_id: string;
  readonly operation: string; readonly purpose: string; readonly target_class: ProviderOrRecipientClassV1;
  readonly target_identity?: string; readonly target_region: string; readonly requested_retention: KnowledgeRetentionV1;
  readonly manifest_id: string; readonly projection_digest: string; readonly knowledge_digests: readonly string[];
  readonly consuming_runtime: string; readonly intended_transport_class: string;
  readonly correlation_id: string; readonly causal_references: readonly string[];
}

export interface KnowledgeExposureCurrentStateV1 {
  readonly principal_active: boolean; readonly session_active: boolean; readonly session_unexpired: boolean;
  readonly membership_active: boolean; readonly ownership_current: boolean; readonly selection_current: boolean;
  readonly authority_current: boolean; readonly target_permitted: boolean; readonly region_permitted: boolean;
  readonly retention_permitted: boolean;
}

export interface KnowledgeExposureCurrentStateRepositoryV1 {
  verifyCurrent(record: PersistedKnowledgeExposureV1, claim: KnowledgeExposureConsumptionClaimV1, now: string): Promise<KnowledgeExposureCurrentStateV1>;
}

export interface KnowledgeExposureEligibilityV1 extends Omit<KnowledgeExposureConsumptionClaimV1, "version" | "consuming_runtime" | "intended_transport_class"> {
  readonly version: 1; readonly consumption_id: string; readonly policy_version: string; readonly consumed_at: string;
}

export interface KnowledgeExposureDecisionRepositoryV1 {
  persist(record: PersistedKnowledgeExposureV1, recordedAt: string): Promise<"CREATED" | "IDENTICAL">;
  read(decisionId: string): Promise<PersistedKnowledgeExposureV1 | null>;
  consume(record: PersistedKnowledgeExposureV1, claim: KnowledgeExposureConsumptionClaimV1, consumptionId: string, consumedAt: string): Promise<boolean>;
  audit(event: Readonly<Record<string, string | undefined>>): Promise<void>;
}
