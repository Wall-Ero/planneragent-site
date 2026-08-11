import { describe, expect, it } from 'vitest';
import { createGovernanceIndicatorV1, GovernanceIndicatorFailureV1 } from '..';

const source = (result = 'VERIFIED', overrides = {}) => ({
	version: 1 as const, source_family: 'SEC_WU3' as const, source_artifact_id: 'composition:1',
	source_artifact_digest: 'a'.repeat(64), source_result: result, tenant_id: 'tenant:1', company_id: 'company:1',
	observed_at: '2026-08-11T00:00:00.000Z', ...overrides,
});
const input = (overrides: Record<string, unknown> = {}) => ({
	version: 1 as const, indicator_type: 'SECURITY_EVIDENCE_COMPOSITION' as const, subject_type: 'GOVERNED_OPERATION',
	subject_id: 'operation:1', tenant_id: 'tenant:1', company_id: 'company:1', source_evidence: [source()],
	expected_source_digests: { 'composition:1': 'a'.repeat(64) }, evaluated_at: '2026-08-11T00:00:00.000Z',
	historical_mode: 'VALID_AT_OPERATION_TIME' as const, causal_lineage: ['composition:1'], ...overrides,
});
const fails = (fn: () => unknown, code: string) => expect(fn).toThrowError(expect.objectContaining({ code }));

describe('GI-WU1 canonical governance indicator foundation', () => {
	it('creates a deeply immutable content-free canonical indicator', () => { const x = createGovernanceIndicatorV1(input()); expect(x.status).toBe('HEALTHY'); expect(Object.isFrozen(x) && Object.isFrozen(x.source_evidence)).toBe(true); expect(() => (x as any).status = 'DENIED').toThrow(); expect(JSON.stringify(x)).not.toMatch(/prompt|projection body|provider response|business payload|credential|authorization header/i); });
	it('requires exact source provenance', () => { fails(() => createGovernanceIndicatorV1(input({ source_evidence: [] })), 'GOVERNANCE_INDICATOR_SOURCE_MISSING'); fails(() => createGovernanceIndicatorV1(input({ source_evidence: [source('VERIFIED', { source_artifact_digest: '' })] })), 'GOVERNANCE_INDICATOR_SOURCE_INVALID'); });
	it('is deterministic and source changes alter identity and digest', () => { const a = createGovernanceIndicatorV1(input()), b = createGovernanceIndicatorV1(input()), c = createGovernanceIndicatorV1(input({ source_evidence: [source('VERIFIED', { source_artifact_digest: 'b'.repeat(64) })], expected_source_digests: { 'composition:1': 'b'.repeat(64) } })); expect(a).toEqual(b); expect(c.indicator_id).not.toBe(a.indicator_id); expect(c.indicator_digest).not.toBe(a.indicator_digest); });
	it.each([['VERIFIED', 'HEALTHY'], ['DENIED', 'DENIED'], ['INCOMPLETE', 'INCOMPLETE'], ['NOT_APPLICABLE', 'NOT_APPLICABLE']] as const)('maps SEC %s truthfully', (result, status) => expect(createGovernanceIndicatorV1(input({ source_evidence: [source(result)] })).status).toBe(status));
	it('denies tenant and company substitution', () => { fails(() => createGovernanceIndicatorV1(input({ tenant_id: 'other' })), 'GOVERNANCE_INDICATOR_TENANT_MISMATCH'); fails(() => createGovernanceIndicatorV1(input({ company_id: 'other' })), 'GOVERNANCE_INDICATOR_COMPANY_MISMATCH'); });
	it('denies authoritative source digest mismatch', () => fails(() => createGovernanceIndicatorV1(input({ expected_source_digests: { 'composition:1': 'b'.repeat(64) } })), 'GOVERNANCE_INDICATOR_SOURCE_DIGEST_MISMATCH'));
	it('denies a missing authoritative digest expectation', () => fails(() => createGovernanceIndicatorV1(input({ expected_source_digests: {} })), 'GOVERNANCE_INDICATOR_SOURCE_DIGEST_MISMATCH'));
	it('fails closed for unsupported indicator and inconsistent status', () => { fails(() => createGovernanceIndicatorV1(input({ indicator_type: 'DECISION_PRESSURE' })), 'GOVERNANCE_INDICATOR_UNSUPPORTED'); fails(() => createGovernanceIndicatorV1(input({ source_evidence: [source('SCORED')] })), 'GOVERNANCE_INDICATOR_SOURCE_STATUS_INCONSISTENT'); });
	it('maps authoritative OAG and PT results without policy re-evaluation', () => { const common = { tenant_id: 'tenant:1', company_id: 'company:1' }; expect(createGovernanceIndicatorV1(input({ indicator_type: 'AUTHORITY_INTEGRITY', source_evidence: [source('NOT_APPLICABLE', { source_family: 'OAG', ...common })] })).status).toBe('NOT_APPLICABLE'); expect(createGovernanceIndicatorV1(input({ indicator_type: 'PROVIDER_TRUST', source_evidence: [source('SATISFIED', { source_family: 'PT', ...common })] })).status).toBe('HEALTHY'); });
	it('does not expose cockpit scoring or execution authority', () => { const value = JSON.stringify(createGovernanceIndicatorV1(input())); expect(value).not.toMatch(/score|confidence|decision_pressure|data_awareness|plan_coherence|reality_alignment|execution_allowed|permit|authorization/i); });
});
