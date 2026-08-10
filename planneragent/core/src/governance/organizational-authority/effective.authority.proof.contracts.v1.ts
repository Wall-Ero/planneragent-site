import type {
	EffectiveOperationalAuthorityProofV1,
	OrganizationalResponsibilityScopeV1,
} from '../../operational-identity/contracts/track-b.v1';
import type {
	CanonicalActorBindingV1,
	CanonicalAuthorityRootV1,
	CanonicalConfirmationChainV1,
	CanonicalResponsibilityV1,
	OagGraphVersionV1,
	OperationalAuthorityDelegationV1,
	OrganizationalAuthorityPolicyV2,
} from './organizational.authority.contracts.v1';
export type OagAuthorityProofFailureCodeV1 =
	| 'OAG_AUTHORITY_PROOF_REQUEST_INVALID'
	| 'OAG_AUTHORITY_PROOF_ACTOR_INVALID'
	| 'OAG_AUTHORITY_PROOF_MEMBERSHIP_INVALID'
	| 'OAG_AUTHORITY_PROOF_TENANT_MISMATCH'
	| 'OAG_AUTHORITY_PROOF_COMPANY_MISMATCH'
	| 'OAG_AUTHORITY_PROOF_DOMAIN_INVALID'
	| 'OAG_AUTHORITY_PROOF_SCOPE_INVALID'
	| 'OAG_AUTHORITY_PROOF_NOT_ESTABLISHED'
	| 'OAG_AUTHORITY_PROOF_AMBIGUOUS'
	| 'OAG_AUTHORITY_PROOF_EXPIRED'
	| 'OAG_AUTHORITY_PROOF_STALE'
	| 'OAG_AUTHORITY_PROOF_GRAPH_MISMATCH'
	| 'OAG_AUTHORITY_PROOF_POLICY_STALE'
	| 'OAG_AUTHORITY_PROOF_CONFIRMATION_INVALID'
	| 'OAG_AUTHORITY_PROOF_RESPONSIBILITY_INVALID'
	| 'OAG_AUTHORITY_PROOF_DELEGATION_INVALID'
	| 'OAG_AUTHORITY_PROOF_DELEGATION_REVOKED'
	| 'OAG_AUTHORITY_PROOF_DELEGATION_DEPTH_EXCEEDED'
	| 'OAG_AUTHORITY_PROOF_SCOPE_NOT_CONTAINED'
	| 'OAG_AUTHORITY_PROOF_SUBSTITUTED'
	| 'OAG_AUTHORITY_PROOF_PERSISTENCE_FAILED'
	| 'OAG_AUTHORITY_PROOF_AUDIT_FAILED';
export class OagAuthorityProofErrorV1 extends Error {
	constructor(readonly code: OagAuthorityProofFailureCodeV1) {
		super(code);
		this.name = 'OagAuthorityProofErrorV1';
	}
}
export interface EffectiveOperationalAuthorityProofRequestV1 {
	readonly version: 1;
	readonly oag_actor_id: string;
	readonly principal_id: string;
	readonly tenant_id: string;
	readonly company_id: string;
	readonly requested_domain: string;
	readonly requested_scope: OrganizationalResponsibilityScopeV1;
	readonly as_of: string;
	readonly correlation_id: string;
	readonly causal_references: readonly string[];
}
export interface CanonicalEffectiveOperationalAuthorityProofV1 extends EffectiveOperationalAuthorityProofV1 {
	readonly authority_source_class: 'ORGANIZATIONAL_OPERATIONAL_AUTHORITY';
	readonly authority_basis: 'DIRECT' | 'DELEGATED';
	readonly root_reference: string;
	readonly responsibility_references: readonly string[];
	readonly confirmation_chain_references: readonly string[];
	readonly proof_digest: string;
	readonly graph_digest: string;
	readonly policy_id: 'OAG_AUTHORITY_POLICY_V2';
	readonly policy_numeric_version: 2;
	readonly correlation_id: string;
	readonly causal_references: readonly string[];
}
export interface AuthorityProofCandidateV1 {
	readonly authority_basis: 'DIRECT' | 'DELEGATED';
	readonly binding: CanonicalActorBindingV1;
	readonly root: CanonicalAuthorityRootV1;
	readonly responsibility: CanonicalResponsibilityV1;
	readonly confirmation: CanonicalConfirmationChainV1;
	readonly delegation?: OperationalAuthorityDelegationV1;
	readonly delegation_confirmation?: CanonicalConfirmationChainV1;
}
export interface EffectiveAuthorityCanonicalStateV1 {
	readonly policy: OrganizationalAuthorityPolicyV2;
	readonly graph: OagGraphVersionV1;
	readonly principal_state: string;
	readonly membership_state: string;
	readonly membership_effective_until?: string;
	readonly binding_current: boolean;
	readonly candidates: readonly AuthorityProofCandidateV1[];
}
export interface EffectiveAuthorityProofStoreV1 {
	loadCurrentState(request: EffectiveOperationalAuthorityProofRequestV1): Promise<EffectiveAuthorityCanonicalStateV1 | null>;
	persist(proof: CanonicalEffectiveOperationalAuthorityProofV1): Promise<'CREATED' | 'IDENTICAL'>;
	find(request: EffectiveOperationalAuthorityProofRequestV1): Promise<readonly CanonicalEffectiveOperationalAuthorityProofV1[]>;
	audit(event: {
		event_kind: string;
		outcome: string;
		reason_code: string;
		authority_proof_id?: string;
		actor_id: string;
		policy_id: string;
		correlation_id: string;
		causal_references: readonly string[];
		recorded_at: string;
	}): Promise<void>;
}
