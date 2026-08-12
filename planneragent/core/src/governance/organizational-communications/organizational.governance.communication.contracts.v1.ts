import type { GovernanceIndicatorHistoricalModeV1, GovernanceIndicatorStatusV1, GovernanceIndicatorTypeV1 } from '../indicators';

export type OrganizationalGovernanceCommunicationClassificationV1 = 'INFORMATIONAL' | 'ATTENTION_REQUIRED' | 'BLOCKING';
export type OrganizationalGovernanceAttentionRequirementV1 = 'NO_ACTION' | 'REVIEW';
export type OrganizationalGovernanceCommunicationReasonCodeV1 =
	| 'AUTHORITY_HEALTHY' | 'AUTHORITY_DENIED' | 'AUTHORITY_INCOMPLETE'
	| 'PROVIDER_TRUST_HEALTHY' | 'PROVIDER_TRUST_DENIED' | 'PROVIDER_TRUST_INCOMPLETE'
	| 'SECURITY_EVIDENCE_HEALTHY' | 'SECURITY_EVIDENCE_DENIED' | 'SECURITY_EVIDENCE_INCOMPLETE'
	| 'KNOWLEDGE_EXPOSURE_HEALTHY' | 'KNOWLEDGE_EXPOSURE_DENIED' | 'KNOWLEDGE_EXPOSURE_INCOMPLETE'
	| 'RUNTIME_SECURITY_HEALTHY' | 'RUNTIME_SECURITY_DENIED' | 'RUNTIME_SECURITY_INCOMPLETE'
	| 'GOVERNANCE_EVIDENCE_HEALTHY' | 'GOVERNANCE_EVIDENCE_DENIED' | 'GOVERNANCE_EVIDENCE_INCOMPLETE'
	| 'SOURCE_NOT_APPLICABLE';

export interface OrganizationalGovernanceCommunicationSourceV1 {
	readonly source_kind: 'INDICATOR' | 'AGGREGATE'; readonly source_id: string; readonly source_digest: string;
	readonly indicator_type: GovernanceIndicatorTypeV1 | 'GOVERNANCE_EVIDENCE_COMPLETENESS';
	readonly status: GovernanceIndicatorStatusV1;
	readonly contributor_references: readonly Readonly<{ indicator_id: string; indicator_digest: string; status: GovernanceIndicatorStatusV1 }>[];
}
export interface OrganizationalGovernanceCommunicationSemanticV1 {
	readonly version: 1; readonly communication_type: 'GOVERNANCE_STATE';
	readonly subject_type: string; readonly subject_id: string; readonly tenant_id?: string; readonly company_id?: string;
	readonly source: OrganizationalGovernanceCommunicationSourceV1;
	readonly source_status: GovernanceIndicatorStatusV1;
	readonly classification: OrganizationalGovernanceCommunicationClassificationV1;
	readonly attention_requirement: OrganizationalGovernanceAttentionRequirementV1;
	readonly blocking: boolean; readonly reason_codes: readonly OrganizationalGovernanceCommunicationReasonCodeV1[];
	readonly historical_mode: GovernanceIndicatorHistoricalModeV1; readonly generated_at: string;
	readonly causal_lineage: readonly string[]; readonly provenance_references: readonly string[];
}
export interface OrganizationalGovernanceCommunicationV1 extends OrganizationalGovernanceCommunicationSemanticV1 { readonly communication_id: string; readonly communication_digest: string; }
export type OrganizationalGovernanceCommunicationDecisionV1 =
	| Readonly<{ version: 1; decision: 'COMMUNICATION_GENERATED'; source: OrganizationalGovernanceCommunicationSourceV1; communication: OrganizationalGovernanceCommunicationV1 }>
	| Readonly<{ version: 1; decision: 'NO_COMMUNICATION_REQUIRED'; source: OrganizationalGovernanceCommunicationSourceV1; reason_code: 'SOURCE_NOT_APPLICABLE' }>;

export interface CreateOrganizationalGovernanceCommunicationInputV1 {
	readonly version: 1; readonly source: import('../indicators').GovernanceIndicatorV1 | import('../indicators').GovernanceIndicatorAggregateV1;
	readonly expected_source_id: string; readonly expected_source_digest: string;
	readonly subject_type: string; readonly subject_id: string; readonly tenant_id?: string; readonly company_id?: string;
	readonly historical_mode: GovernanceIndicatorHistoricalModeV1; readonly generated_at: string; readonly causal_lineage: readonly string[];
}
export type OrganizationalGovernanceCommunicationFailureCodeV1 =
	| 'GOVERNANCE_COMMUNICATION_SOURCE_UNSUPPORTED' | 'GOVERNANCE_COMMUNICATION_SOURCE_INVALID'
	| 'GOVERNANCE_COMMUNICATION_SOURCE_IDENTITY_MISMATCH' | 'GOVERNANCE_COMMUNICATION_SOURCE_DIGEST_MISMATCH'
	| 'GOVERNANCE_COMMUNICATION_TENANT_MISMATCH' | 'GOVERNANCE_COMMUNICATION_COMPANY_MISMATCH'
	| 'GOVERNANCE_COMMUNICATION_SUBJECT_MISMATCH' | 'GOVERNANCE_COMMUNICATION_HISTORICAL_MODE_MISMATCH'
	| 'GOVERNANCE_COMMUNICATION_MAPPING_UNSUPPORTED' | 'GOVERNANCE_COMMUNICATION_IDENTITY_INVALID';
export class OrganizationalGovernanceCommunicationFailureV1 extends Error { constructor(readonly code:OrganizationalGovernanceCommunicationFailureCodeV1){super(code);this.name='OrganizationalGovernanceCommunicationFailureV1';} }
