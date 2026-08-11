import { createHash } from 'node:crypto';
import { deepCopyAndFreeze } from '../knowledge-exposure/knowledge.projection.guard.v1';
import {
	SecurityEvidenceCompositionFailureV1,
	type SecurityEvidenceCompositionSemanticV1,
	type SecurityEvidenceCompositionV1,
} from './security.evidence.composition.contracts.v1';

const compare = (a: string, b: string) => a.localeCompare(b);
const unique = (xs: readonly string[], code: 'SECURITY_COMPOSITION_ATTEMPT_MISMATCH' | 'SECURITY_COMPOSITION_IDENTITY_MISMATCH') => {
	if (new Set(xs).size !== xs.length) throw new SecurityEvidenceCompositionFailureV1(code);
};
const canonical = (input: SecurityEvidenceCompositionSemanticV1): SecurityEvidenceCompositionSemanticV1 => {
	const attempts = [...input.attempts].sort((a, b) => a.sequence - b.sequence || compare(a.attempt_id, b.attempt_id));
	const fallback_edges = [...input.fallback_edges].sort((a, b) => compare(a.fallback_edge_id, b.fallback_edge_id));
	const edges = [...input.edges].sort((a, b) => compare(a.edge_id, b.edge_id));
	unique(attempts.map(x => x.attempt_id), 'SECURITY_COMPOSITION_ATTEMPT_MISMATCH');
	unique(fallback_edges.map(x => x.fallback_edge_id), 'SECURITY_COMPOSITION_IDENTITY_MISMATCH');
	unique(edges.map(x => x.edge_id), 'SECURITY_COMPOSITION_IDENTITY_MISMATCH');
	const attemptById = new Map(attempts.map(x => [x.attempt_id, x]));
	for (const x of fallback_edges) {
		const predecessor = attemptById.get(x.predecessor_attempt_id), successor = attemptById.get(x.successor_attempt_id);
		if (x.request_id !== input.request_id || x.predecessor_attempt_id === x.successor_attempt_id || !predecessor || !successor ||
			predecessor.outcome !== 'TRANSPORT_FAILED' || successor.predecessor_attempt_id !== predecessor.attempt_id)
			throw new SecurityEvidenceCompositionFailureV1('SECURITY_COMPOSITION_FALLBACK_LINEAGE_INVALID');
	}
	const authority = input.organizational_authority;
	const hasAuthority = Boolean(authority.authority_evidence_id && authority.authority_proof_id && authority.authority_proof_digest);
	if (authority.requirement === 'REQUIRED' && !hasAuthority)
		throw new SecurityEvidenceCompositionFailureV1('SECURITY_COMPOSITION_AUTHORITY_REQUIRED');
	if (authority.requirement === 'NOT_APPLICABLE' && (authority.authority_evidence_id || authority.authority_proof_id || authority.authority_proof_digest))
		throw new SecurityEvidenceCompositionFailureV1('SECURITY_COMPOSITION_AUTHORITY_APPLICABILITY_CONFLICT');
	return {
		...input,
		pt_admissions: [...input.pt_admissions].sort((a, b) => compare(a.admission_id, b.admission_id)),
		runtime_bindings: [...input.runtime_bindings].sort((a, b) => compare(a.runtime_binding_id, b.runtime_binding_id)),
		credential_access_evidence_ids: [...input.credential_access_evidence_ids].sort(compare), attempts,
		transport_evidence_ids: [...input.transport_evidence_ids].sort(compare), fallback_edges, edges,
		causal_lineage: [...input.causal_lineage].sort(compare),
	};
};
export const securityEvidenceCompositionDigestV1 = (semantic: SecurityEvidenceCompositionSemanticV1): string =>
	createHash('sha256').update(JSON.stringify(canonical(semantic)), 'utf8').digest('hex');
export function createSecurityEvidenceCompositionV1(input: SecurityEvidenceCompositionSemanticV1): SecurityEvidenceCompositionV1 {
	const semantic = canonical(input), digest = securityEvidenceCompositionDigestV1(semantic);
	return deepCopyAndFreeze({ ...semantic, composition_id: `security-evidence-composition:sha256:${digest}`, composition_digest: digest }) as SecurityEvidenceCompositionV1;
}
