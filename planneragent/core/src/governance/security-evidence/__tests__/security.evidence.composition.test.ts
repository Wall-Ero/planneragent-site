import { describe, expect, it } from 'vitest';
import {
	SECURITY_EVIDENCE_COMPOSITION_RESULTS_V1,
	SECURITY_EVIDENCE_EDGE_INTEGRITIES_V1,
	SECURITY_EVIDENCE_OPERATION_OUTCOMES_V1,
	createSecurityEvidenceCompositionV1,
	type SecurityEvidenceCompositionSemanticV1,
} from '..';

const semantic = (patch: Partial<SecurityEvidenceCompositionSemanticV1> = {}): SecurityEvidenceCompositionSemanticV1 => ({
	version: 1, request_id: 'operation:1', principal_id: 'principal:1', session_id: 'session:1', tenant_id: 'tenant:1', company_id: 'company:1',
	oks_request_id: 'oks-request:1', oks_decision_id: 'oks-decision:1', projection_id: 'manifest:1', projection_digest: 'a'.repeat(64),
	oks_consumption_id: 'consumption:1',
	organizational_authority: { applicability_evidence_id: 'applicability:oag:1', requirement: 'NOT_APPLICABLE' },
	p9: { applicability_evidence_id: 'applicability:p9:1', status: 'NOT_APPLICABLE' },
	pt_admissions: [{ admission_id: 'admission:1', admission_digest: 'b'.repeat(64) }],
	runtime_bindings: [{ runtime_binding_id: 'binding:1', runtime_binding_digest: 'c'.repeat(64) }],
	credential_access_evidence_ids: ['credential:1'],
	attempts: [{ attempt_id: 'attempt:1', sequence: 0, outcome: 'TRANSPORT_SUCCEEDED', admission_id: 'admission:1', admission_digest: 'b'.repeat(64), runtime_binding_id: 'binding:1', runtime_binding_digest: 'c'.repeat(64), credential_access_evidence_id: 'credential:1', transport_evidence_id: 'transport:1' }],
	transport_evidence_ids: ['transport:1'], fallback_edges: [],
	edges: [{ version: 1, edge_id: 'edge:1', source: { domain: 'RUNTIME_ATTEMPT', evidence_id: 'attempt:1' }, target: { domain: 'COGNITIVE_TRANSPORT', evidence_id: 'transport:1' }, integrity: 'IDENTITY_REFERENCED', causal_relation: 'DISPATCH_PRODUCED' }],
	final_outcome: 'COMPLETED', verification_result: 'VERIFIED', historical_validity_basis: 'VALID_AT_OPERATION_TIME',
	composed_at: '2026-08-11T10:00:00.000Z', causal_lineage: ['attempt:1'], ...patch,
});

describe('SecurityEvidenceCompositionV1 contracts and deterministic join model', () => {
	it('exposes closed result, integrity and operation-outcome vocabularies', () => {
		expect(SECURITY_EVIDENCE_COMPOSITION_RESULTS_V1).toEqual(['VERIFIED', 'DENIED', 'INCOMPLETE']);
		expect(SECURITY_EVIDENCE_EDGE_INTEGRITIES_V1).toEqual(['CRYPTOGRAPHICALLY_BOUND', 'DIGEST_BOUND', 'IDENTITY_REFERENCED', 'APPLICABILITY_ASSERTED']);
		expect(SECURITY_EVIDENCE_OPERATION_OUTCOMES_V1).toContain('COMPLETED_AFTER_TECHNICAL_FALLBACK');
	});
	it('constructs an immutable, content-free reference graph with distinct binding ID and digest', () => {
		const x = createSecurityEvidenceCompositionV1(semantic());
		expect(Object.isFrozen(x)).toBe(true); expect(Object.isFrozen(x.attempts)).toBe(true);
		expect(x.runtime_bindings[0]).toEqual({ runtime_binding_id: 'binding:1', runtime_binding_digest: 'c'.repeat(64) });
		expect(JSON.stringify(x)).not.toMatch(/prompt|provider.response|credential.secret/i);
	});
	it('represents cognitive and P9 non-applicability and exact failed/pre-transport evidence', () => {
		const failed = createSecurityEvidenceCompositionV1(semantic({ attempts: [{ attempt_id: 'attempt:1', sequence: 0, outcome: 'TRANSPORT_FAILED', transport_evidence_id: 'failed-transport:1' }], transport_evidence_ids: ['failed-transport:1'], final_outcome: 'TRANSPORT_FAILED' }));
		expect(failed.organizational_authority.requirement).toBe('NOT_APPLICABLE'); expect(failed.p9.status).toBe('NOT_APPLICABLE');
		const before = createSecurityEvidenceCompositionV1(semantic({ attempts: [{ attempt_id: 'attempt:1', sequence: 0, outcome: 'GOVERNANCE_DENIED' }], transport_evidence_ids: [], final_outcome: 'GOVERNANCE_DENIED', verification_result: 'DENIED' }));
		expect(before.attempts[0].transport_evidence_id).toBeUndefined();
	});
	it('requires exact quotation authority and rejects authority on NOT_APPLICABLE', () => {
		expect(() => createSecurityEvidenceCompositionV1(semantic({ organizational_authority: { applicability_evidence_id: 'a', requirement: 'REQUIRED' } }))).toThrowError(expect.objectContaining({ code: 'SECURITY_COMPOSITION_AUTHORITY_REQUIRED' }));
		const quotation = createSecurityEvidenceCompositionV1(semantic({ organizational_authority: { applicability_evidence_id: 'a', requirement: 'REQUIRED', authority_evidence_id: 'authority:1', authority_proof_id: 'proof:1', authority_proof_digest: 'd'.repeat(64) } }));
		expect(quotation.organizational_authority.requirement).toBe('REQUIRED');
		expect(() => createSecurityEvidenceCompositionV1(semantic({ organizational_authority: { applicability_evidence_id: 'a', requirement: 'NOT_APPLICABLE', authority_evidence_id: 'fake', authority_proof_id: 'fake', authority_proof_digest: 'fake' } }))).toThrowError(expect.objectContaining({ code: 'SECURITY_COMPOSITION_AUTHORITY_APPLICABILITY_CONFLICT' }));
	});
	it('rejects duplicate attempts, duplicate edge identities and fallback self-loops', () => {
		const attempt = semantic().attempts[0];
		expect(() => createSecurityEvidenceCompositionV1(semantic({ attempts: [attempt, attempt] }))).toThrowError(expect.objectContaining({ code: 'SECURITY_COMPOSITION_ATTEMPT_MISMATCH' }));
		const edge = semantic().edges[0];
		expect(() => createSecurityEvidenceCompositionV1(semantic({ edges: [edge, edge] }))).toThrowError(expect.objectContaining({ code: 'SECURITY_COMPOSITION_IDENTITY_MISMATCH' }));
		expect(() => createSecurityEvidenceCompositionV1(semantic({ fallback_edges: [{ fallback_edge_id: 'f:1', request_id: 'operation:1', predecessor_attempt_id: 'attempt:1', successor_attempt_id: 'attempt:1', reason: 'TECHNICAL_FAILURE' }] }))).toThrowError(expect.objectContaining({ code: 'SECURITY_COMPOSITION_FALLBACK_LINEAGE_INVALID' }));
	});
	it('binds an ordered fallback edge to predecessor, successor, and common request root', () => {
		const x = createSecurityEvidenceCompositionV1(semantic({ attempts: [{ attempt_id: 'attempt:b', sequence: 1, predecessor_attempt_id: 'attempt:a', outcome: 'TRANSPORT_SUCCEEDED' }, { attempt_id: 'attempt:a', sequence: 0, outcome: 'TRANSPORT_FAILED', transport_evidence_id: 'transport:a' }], fallback_edges: [{ fallback_edge_id: 'fallback:1', request_id: 'operation:1', predecessor_attempt_id: 'attempt:a', successor_attempt_id: 'attempt:b', reason: 'TECHNICAL_FAILURE' }], final_outcome: 'COMPLETED_AFTER_TECHNICAL_FALLBACK' }));
		expect(x.attempts.map(a => a.attempt_id)).toEqual(['attempt:a', 'attempt:b']); expect(x.fallback_edges[0].request_id).toBe(x.request_id);
	});
	it('is order-independent and changes digest for every material reference family', () => {
		const base = createSecurityEvidenceCompositionV1(semantic({ credential_access_evidence_ids: ['credential:b', 'credential:a'], causal_lineage: ['z', 'a'] }));
		const reordered = createSecurityEvidenceCompositionV1(semantic({ credential_access_evidence_ids: ['credential:a', 'credential:b'], causal_lineage: ['a', 'z'] }));
		expect(reordered.composition_digest).toBe(base.composition_digest); expect(reordered.composition_id).toBe(base.composition_id);
		const changes: Partial<SecurityEvidenceCompositionSemanticV1>[] = [
			{ projection_digest: '9'.repeat(64) }, { pt_admissions: [{ admission_id: 'admission:2', admission_digest: 'b'.repeat(64) }] },
			{ runtime_bindings: [{ runtime_binding_id: 'binding:2', runtime_binding_digest: 'c'.repeat(64) }] },
			{ transport_evidence_ids: ['transport:2'] }, { p9: { applicability_evidence_id: 'applicability:p9:2', status: 'NOT_APPLICABLE' } },
		];
		for (const change of changes) expect(createSecurityEvidenceCompositionV1(semantic({ credential_access_evidence_ids: ['credential:b', 'credential:a'], causal_lineage: ['z', 'a'], ...change })).composition_digest).not.toBe(base.composition_digest);
	});
});
