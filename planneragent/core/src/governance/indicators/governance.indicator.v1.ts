import { createHash } from 'node:crypto';
import { deepCopyAndFreeze } from '../knowledge-exposure/knowledge.projection.guard.v1';
import {
	GOVERNANCE_INDICATOR_TYPES_V1,
	GovernanceIndicatorFailureV1,
	type CreateGovernanceIndicatorInputV1,
	type GovernanceIndicatorReasonCodeV1,
	type GovernanceIndicatorSemanticV1,
	type GovernanceIndicatorSourceReferenceV1,
	type GovernanceIndicatorStatusV1,
	type GovernanceIndicatorTypeV1,
	type GovernanceIndicatorV1,
} from './governance.indicator.contracts.v1';

const mappings: Readonly<Record<GovernanceIndicatorTypeV1, Readonly<{
	family: GovernanceIndicatorSourceReferenceV1['source_family'];
	results: Readonly<Record<string, GovernanceIndicatorStatusV1>>;
}>>> = Object.freeze({
	AUTHORITY_INTEGRITY: Object.freeze({ family: 'OAG', results: Object.freeze({ VERIFIED: 'HEALTHY', APPLICABLE: 'HEALTHY', DENIED: 'DENIED', INCOMPLETE: 'INCOMPLETE', UNDEFINED: 'INCOMPLETE', NOT_APPLICABLE: 'NOT_APPLICABLE' }) }),
	PROVIDER_TRUST: Object.freeze({ family: 'PT', results: Object.freeze({ VERIFIED: 'HEALTHY', SATISFIED: 'HEALTHY', DENIED: 'DENIED', INCOMPLETE: 'INCOMPLETE', INSUFFICIENT_EVIDENCE: 'INCOMPLETE', NOT_APPLICABLE: 'NOT_APPLICABLE' }) }),
	SECURITY_EVIDENCE_COMPOSITION: Object.freeze({ family: 'SEC_WU3', results: Object.freeze({ VERIFIED: 'HEALTHY', DENIED: 'DENIED', INCOMPLETE: 'INCOMPLETE', NOT_APPLICABLE: 'NOT_APPLICABLE' }) }),
	KNOWLEDGE_EXPOSURE_GOVERNANCE: Object.freeze({ family: 'OKS', results: Object.freeze({ ADMITTED: 'HEALTHY', DENIED: 'DENIED', INCOMPLETE: 'INCOMPLETE', NOT_APPLICABLE: 'NOT_APPLICABLE' }) }),
	RUNTIME_SECURITY_EVIDENCE: Object.freeze({ family: 'SEC_WU1', results: Object.freeze({}) }),
});

const reason = (status: GovernanceIndicatorStatusV1): GovernanceIndicatorReasonCodeV1 =>
	status === 'HEALTHY' ? 'AUTHORITATIVE_SOURCE_VERIFIED' : status === 'DENIED' ? 'AUTHORITATIVE_SOURCE_DENIED' :
	status === 'NOT_APPLICABLE' ? 'AUTHORITATIVE_SOURCE_NOT_APPLICABLE' : 'AUTHORITATIVE_SOURCE_INCOMPLETE';
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
const valid = (value: string) => typeof value === 'string' && value.trim() === value && value.length > 0;

export function governanceIndicatorDigestV1(semantic: GovernanceIndicatorSemanticV1): string {
	return digest(canonical(semantic));
}

export function createGovernanceIndicatorV1(input: CreateGovernanceIndicatorInputV1): GovernanceIndicatorV1 {
	if (!GOVERNANCE_INDICATOR_TYPES_V1.includes(input.indicator_type as GovernanceIndicatorTypeV1))
		throw new GovernanceIndicatorFailureV1('GOVERNANCE_INDICATOR_UNSUPPORTED');
	const indicatorType = input.indicator_type as GovernanceIndicatorTypeV1;
	if (!valid(input.subject_type) || !valid(input.subject_id) || !valid(input.evaluated_at))
		throw new GovernanceIndicatorFailureV1('GOVERNANCE_INDICATOR_IDENTITY_INVALID');
	if (input.source_evidence.length === 0)
		throw new GovernanceIndicatorFailureV1('GOVERNANCE_INDICATOR_SOURCE_MISSING');
	const mapping = mappings[indicatorType];
	for (const source of input.source_evidence) {
		if (!source || source.version !== 1 || !valid(source.source_artifact_id) || !valid(source.source_artifact_digest) || !valid(source.source_result) || !valid(source.observed_at) || source.source_family !== mapping.family)
			throw new GovernanceIndicatorFailureV1('GOVERNANCE_INDICATOR_SOURCE_INVALID');
		if (input.tenant_id !== source.tenant_id) throw new GovernanceIndicatorFailureV1('GOVERNANCE_INDICATOR_TENANT_MISMATCH');
		if (input.company_id !== source.company_id) throw new GovernanceIndicatorFailureV1('GOVERNANCE_INDICATOR_COMPANY_MISMATCH');
		const expectedDigest = input.expected_source_digests[source.source_artifact_id];
		if (!expectedDigest || expectedDigest !== source.source_artifact_digest) throw new GovernanceIndicatorFailureV1('GOVERNANCE_INDICATOR_SOURCE_DIGEST_MISMATCH');
	}
	if (new Set(input.source_evidence.map(x => x.source_artifact_id)).size !== input.source_evidence.length)
		throw new GovernanceIndicatorFailureV1('GOVERNANCE_INDICATOR_SOURCE_INVALID');
	let status: GovernanceIndicatorStatusV1;
	if (indicatorType === 'RUNTIME_SECURITY_EVIDENCE') status = runtimeStatus(input.source_evidence);
	else {
		if (input.source_evidence.length !== 1) throw new GovernanceIndicatorFailureV1('GOVERNANCE_INDICATOR_SOURCE_INVALID');
		const result = input.source_evidence[0].source_result;
		const mapped = mapping.results[result];
		if (!mapped) throw new GovernanceIndicatorFailureV1(result === 'NOT_APPLICABLE' ? 'GOVERNANCE_INDICATOR_APPLICABILITY_UNSUPPORTED' : 'GOVERNANCE_INDICATOR_SOURCE_STATUS_INCONSISTENT');
		status = mapped;
	}
	const reasonCodes: GovernanceIndicatorReasonCodeV1[] = indicatorType === 'RUNTIME_SECURITY_EVIDENCE' && status === 'HEALTHY' ? ['AUTHORITATIVE_RUNTIME_EVIDENCE_COMPLETE'] : [reason(status)];
	const semantic = canonical({
		version: 1, indicator_type: indicatorType, subject_type: input.subject_type, subject_id: input.subject_id,
		...(input.tenant_id ? { tenant_id: input.tenant_id } : {}), ...(input.company_id ? { company_id: input.company_id } : {}),
		status, source_evidence: [...input.source_evidence], evaluated_at: input.evaluated_at, historical_mode: input.historical_mode,
		causal_lineage: [...input.causal_lineage], reason_codes: reasonCodes,
	});
	const indicatorDigest = governanceIndicatorDigestV1(semantic);
	return deepCopyAndFreeze({ ...semantic, indicator_id: `governance-indicator:sha256:${indicatorDigest}`, indicator_digest: indicatorDigest }) as GovernanceIndicatorV1;
}

function canonical(input: GovernanceIndicatorSemanticV1): GovernanceIndicatorSemanticV1 {
	return {
		...input,
		source_evidence: [...input.source_evidence].map(source => ({ ...source })).sort((a, b) => a.source_artifact_id.localeCompare(b.source_artifact_id)),
		causal_lineage: [...new Set(input.causal_lineage)].sort((a, b) => a.localeCompare(b)),
		reason_codes: [...new Set(input.reason_codes)].sort((a, b) => a.localeCompare(b)),
	};
}

function runtimeStatus(sources: readonly GovernanceIndicatorSourceReferenceV1[]): GovernanceIndicatorStatusV1 {
	const results = new Set(sources.map(x => x.source_result));
	const known = new Set(['RESOLUTION_SUCCEEDED', 'NOT_APPLICABLE', 'RESOLUTION_FAILED', 'RESOLUTION_DENIED', 'GOVERNANCE_DENIED', 'CONFIGURATION_FAILED', 'CREDENTIAL_RESOLUTION_FAILED', 'TRANSPORT_FAILED', 'TRANSPORT_SUCCEEDED', 'CREDENTIAL_NOT_APPLICABLE']);
	if ([...results].some(x => !known.has(x))) throw new GovernanceIndicatorFailureV1('GOVERNANCE_INDICATOR_SOURCE_STATUS_INCONSISTENT');
	if (results.has('RESOLUTION_DENIED') || results.has('GOVERNANCE_DENIED')) return 'DENIED';
	if (results.has('NOT_APPLICABLE') && results.has('CREDENTIAL_NOT_APPLICABLE') && sources.length === 2) return 'NOT_APPLICABLE';
	if (results.has('RESOLUTION_SUCCEEDED') && results.has('TRANSPORT_SUCCEEDED') && sources.length === 2) return 'HEALTHY';
	return 'INCOMPLETE';
}
