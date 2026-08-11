export const GOVERNANCE_INDICATOR_TYPES_V1 = [
	'AUTHORITY_INTEGRITY',
	'PROVIDER_TRUST',
	'SECURITY_EVIDENCE_COMPOSITION',
] as const;
export type GovernanceIndicatorTypeV1 = (typeof GOVERNANCE_INDICATOR_TYPES_V1)[number];

export const GOVERNANCE_INDICATOR_STATUSES_V1 = ['HEALTHY', 'DEGRADED', 'DENIED', 'INCOMPLETE', 'NOT_APPLICABLE'] as const;
export type GovernanceIndicatorStatusV1 = (typeof GOVERNANCE_INDICATOR_STATUSES_V1)[number];

export type GovernanceIndicatorSourceFamilyV1 = 'OAG' | 'PT' | 'SEC_WU3';
export type GovernanceIndicatorHistoricalModeV1 = 'CURRENT' | 'VALID_AT_OPERATION_TIME';
export type GovernanceIndicatorReasonCodeV1 =
	| 'AUTHORITATIVE_SOURCE_VERIFIED'
	| 'AUTHORITATIVE_SOURCE_DENIED'
	| 'AUTHORITATIVE_SOURCE_INCOMPLETE'
	| 'AUTHORITATIVE_SOURCE_NOT_APPLICABLE';

export interface GovernanceIndicatorSourceReferenceV1 {
	readonly version: 1;
	readonly source_family: GovernanceIndicatorSourceFamilyV1;
	readonly source_artifact_id: string;
	readonly source_artifact_digest: string;
	readonly source_result: string;
	readonly tenant_id?: string;
	readonly company_id?: string;
	readonly observed_at: string;
}

export interface GovernanceIndicatorSemanticV1 {
	readonly version: 1;
	readonly indicator_type: GovernanceIndicatorTypeV1;
	readonly subject_type: string;
	readonly subject_id: string;
	readonly tenant_id?: string;
	readonly company_id?: string;
	readonly status: GovernanceIndicatorStatusV1;
	readonly source_evidence: readonly GovernanceIndicatorSourceReferenceV1[];
	readonly evaluated_at: string;
	readonly historical_mode: GovernanceIndicatorHistoricalModeV1;
	readonly causal_lineage: readonly string[];
	readonly reason_codes: readonly GovernanceIndicatorReasonCodeV1[];
}

export interface GovernanceIndicatorV1 extends GovernanceIndicatorSemanticV1 {
	readonly indicator_id: string;
	readonly indicator_digest: string;
}

export type GovernanceIndicatorFailureCodeV1 =
	| 'GOVERNANCE_INDICATOR_UNSUPPORTED'
	| 'GOVERNANCE_INDICATOR_SOURCE_MISSING'
	| 'GOVERNANCE_INDICATOR_SOURCE_INVALID'
	| 'GOVERNANCE_INDICATOR_SOURCE_DIGEST_MISMATCH'
	| 'GOVERNANCE_INDICATOR_TENANT_MISMATCH'
	| 'GOVERNANCE_INDICATOR_COMPANY_MISMATCH'
	| 'GOVERNANCE_INDICATOR_SOURCE_STATUS_INCONSISTENT'
	| 'GOVERNANCE_INDICATOR_APPLICABILITY_UNSUPPORTED'
	| 'GOVERNANCE_INDICATOR_IDENTITY_INVALID';

export class GovernanceIndicatorFailureV1 extends Error {
	constructor(readonly code: GovernanceIndicatorFailureCodeV1) {
		super(code);
		this.name = 'GovernanceIndicatorFailureV1';
	}
}

export interface CreateGovernanceIndicatorInputV1 {
	readonly version: 1;
	readonly indicator_type: GovernanceIndicatorTypeV1 | string;
	readonly subject_type: string;
	readonly subject_id: string;
	readonly tenant_id?: string;
	readonly company_id?: string;
	readonly source_evidence: readonly GovernanceIndicatorSourceReferenceV1[];
	readonly expected_source_digests: Readonly<Record<string, string>>;
	readonly evaluated_at: string;
	readonly historical_mode: GovernanceIndicatorHistoricalModeV1;
	readonly causal_lineage: readonly string[];
}
