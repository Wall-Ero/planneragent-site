import type { GovernanceIndicatorHistoricalModeV1, GovernanceIndicatorStatusV1, GovernanceIndicatorTypeV1, GovernanceIndicatorV1 } from './governance.indicator.contracts.v1';

export type GovernanceIndicatorAggregateTypeV1 = 'GOVERNANCE_EVIDENCE_COMPLETENESS';
export interface GovernanceIndicatorContributorV1 {
	readonly indicator_id: string; readonly indicator_digest: string; readonly indicator_type: GovernanceIndicatorTypeV1;
	readonly status: GovernanceIndicatorStatusV1;
}
export interface GovernanceIndicatorAggregateSemanticV1 {
	readonly version: 1; readonly aggregate_type: GovernanceIndicatorAggregateTypeV1;
	readonly subject_type: string; readonly subject_id: string; readonly tenant_id?: string; readonly company_id?: string;
	readonly required_indicator_types: readonly GovernanceIndicatorTypeV1[];
	readonly contributors: readonly GovernanceIndicatorContributorV1[];
	readonly status: GovernanceIndicatorStatusV1; readonly evaluated_at: string;
	readonly historical_mode: GovernanceIndicatorHistoricalModeV1; readonly causal_lineage: readonly string[];
	readonly reason_codes: readonly ('ALL_REQUIRED_GOVERNANCE_EVIDENCE_ACCOUNTED_FOR'|'REQUIRED_GOVERNANCE_INDICATOR_MISSING'|'GOVERNANCE_CONTRIBUTOR_DENIED'|'GOVERNANCE_CONTRIBUTOR_INCOMPLETE'|'GOVERNANCE_CONTRIBUTOR_DEGRADED'|'NO_APPLICABLE_GOVERNANCE_INDICATOR')[];
}
export interface GovernanceIndicatorAggregateV1 extends GovernanceIndicatorAggregateSemanticV1 { readonly aggregate_id: string; readonly aggregate_digest: string; }
export interface CreateGovernanceIndicatorAggregateInputV1 {
	readonly version: 1; readonly aggregate_type: GovernanceIndicatorAggregateTypeV1 | string;
	readonly subject_type: string; readonly subject_id: string; readonly tenant_id?: string; readonly company_id?: string;
	readonly required_indicator_types: readonly GovernanceIndicatorTypeV1[]; readonly contributors: readonly GovernanceIndicatorV1[];
	readonly evaluated_at: string; readonly historical_mode: GovernanceIndicatorHistoricalModeV1; readonly causal_lineage: readonly string[];
}
export type GovernanceIndicatorAggregateFailureCodeV1 = 'GOVERNANCE_INDICATOR_AGGREGATE_UNSUPPORTED'|'GOVERNANCE_INDICATOR_CONTRIBUTOR_MISSING'|'GOVERNANCE_INDICATOR_CONTRIBUTOR_DIGEST_MISMATCH'|'GOVERNANCE_INDICATOR_CONTRIBUTOR_DUPLICATE'|'GOVERNANCE_INDICATOR_CONTRIBUTOR_TENANT_MISMATCH'|'GOVERNANCE_INDICATOR_CONTRIBUTOR_COMPANY_MISMATCH'|'GOVERNANCE_INDICATOR_CONTRIBUTOR_SUBJECT_MISMATCH'|'GOVERNANCE_INDICATOR_HISTORICAL_MODE_MISMATCH';
export class GovernanceIndicatorAggregateFailureV1 extends Error { constructor(readonly code:GovernanceIndicatorAggregateFailureCodeV1){super(code);this.name='GovernanceIndicatorAggregateFailureV1';} }
