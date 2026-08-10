import { createHash } from 'node:crypto';
import type { OrganizationalResponsibilityScopeV1 } from '../../operational-identity/contracts/track-b.v1';
import { buildConfirmationChainV1, buildOagActorBindingV1 } from '../../operational-identity/contracts/invariants.v1';
import { deepFreeze } from '../organizational-representation/organizational.representation.policy.v1';
import {
	OAG_AUTHORITY_POLICY_ID_V1,
	OAG_AUTHORITY_POLICY_ID_V2,
	OagCanonicalErrorV1,
	type CanonicalActorBindingV1,
	type CanonicalAuthorityRootV1,
	type CanonicalConfirmationChainV1,
	type CanonicalResponsibilityV1,
	type OagGraphStateReferenceV1,
	type OagGraphVersionV1,
	type OperationalAuthorityDelegationV1,
	type OrganizationalAuthorityPolicyV1,
	type OrganizationalAuthorityPolicyV2,
	type RootBootstrapContextV1,
} from './organizational.authority.contracts.v1';
const sha = (v: unknown) => createHash('sha256').update(JSON.stringify(v), 'utf8').digest('hex');
const ordered = <T extends string>(v: readonly T[]): T[] => [...new Set(v)].sort();
function scope(s: OrganizationalResponsibilityScopeV1): OrganizationalResponsibilityScopeV1 {
	return deepFreeze({
		...s,
		intents: ordered(s.intents),
		scopes: ordered(s.scopes),
		limits: [...s.limits].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
		team_or_subordinate_actor_ids: ordered(s.team_or_subordinate_actor_ids),
		operational_constraints: ordered(s.operational_constraints),
	});
}
export function scopeWithinV1(child: OrganizationalResponsibilityScopeV1, parent: OrganizationalResponsibilityScopeV1) {
	const c = scope(child),
		p = scope(parent);
	return (
		c.domain === p.domain &&
		c.intents.every((x) => p.intents.includes(x)) &&
		c.scopes.every((x) => p.scopes.includes(x)) &&
		c.limits.every((x) => p.limits.some((y) => JSON.stringify(x) === JSON.stringify(y))) &&
		c.team_or_subordinate_actor_ids.every((x) => p.team_or_subordinate_actor_ids.includes(x)) &&
		c.operational_constraints.every((x) => p.operational_constraints.includes(x))
	);
}
export function organizationalAuthorityPolicyV1(
	effective_from: string,
	correlation_id: string,
	causal_references: readonly string[] = [],
): OrganizationalAuthorityPolicyV1 {
	return deepFreeze({
		version: 1,
		policy_id: OAG_AUTHORITY_POLICY_ID_V1,
		policy_version: 1,
		effective_from,
		root_activation_rule: 'CURRENT_ORPA_PLATFORM_ONBOARDING_REPRESENTATION',
		responsibility_confirmation_rule: 'ONE_QUALIFYING_CURRENT_ROOT',
		delegation_confirmation_rule: 'ONE_QUALIFYING_CURRENT_AUTHORITY',
		max_delegation_depth: 1,
		proof_validity_rule: 'EARLIEST_SOURCE_VALIDITY_AND_CURRENT_STATE',
		graph_supersession_rule: 'NO_GRANDFATHERING',
		correlation_id,
		causal_references: [...causal_references],
	});
}
export function organizationalAuthorityPolicyV2(
	effective_from: string,
	correlation_id: string,
	causal_references: readonly string[] = [],
): OrganizationalAuthorityPolicyV2 {
	return deepFreeze({
		version: 2,
		policy_id: OAG_AUTHORITY_POLICY_ID_V2,
		policy_version: 2,
		effective_from,
		root_activation_rule: 'CURRENT_ORPA_PLATFORM_ONBOARDING_REPRESENTATION',
		responsibility_confirmation_rule: 'ONE_QUALIFYING_CURRENT_ROOT',
		delegation_confirmation_rule: 'ONE_QUALIFYING_CURRENT_AUTHORITY',
		max_delegation_depth: 1,
		proof_validity_rule: 'BOUNDED_BY_POLICY_AND_SOURCE_VALIDITY',
		max_effective_authority_proof_lifetime_seconds: 3600,
		graph_supersession_rule: 'NO_GRANDFATHERING',
		supersedes_policy_id: OAG_AUTHORITY_POLICY_ID_V1,
		correlation_id,
		causal_references: ordered(causal_references),
	});
}
export function assertOrganizationalAuthorityPolicyV2(p:OrganizationalAuthorityPolicyV2):void{if(!p||p.version!==2||p.policy_id!==OAG_AUTHORITY_POLICY_ID_V2||p.policy_version!==2||p.supersedes_policy_id!==OAG_AUTHORITY_POLICY_ID_V1||p.proof_validity_rule!=="BOUNDED_BY_POLICY_AND_SOURCE_VALIDITY"||p.max_effective_authority_proof_lifetime_seconds!==3600||p.max_delegation_depth!==1||p.graph_supersession_rule!=="NO_GRANDFATHERING"||p.root_activation_rule!=="CURRENT_ORPA_PLATFORM_ONBOARDING_REPRESENTATION"||p.responsibility_confirmation_rule!=="ONE_QUALIFYING_CURRENT_ROOT"||p.delegation_confirmation_rule!=="ONE_QUALIFYING_CURRENT_AUTHORITY")throw new OagCanonicalErrorV1("OAG_CAN_POLICY_INVALID");}
export function buildCanonicalActorBindingV1(
	input: CanonicalActorBindingV1,
	current: {
		principal_id: string;
		membership_id: string;
		tenant_id: string;
		company_id: string;
		principal_state: string;
		membership_state: string;
		resolved_tenant_id: string;
	},
): CanonicalActorBindingV1 {
	const b = buildOagActorBindingV1(input.binding);
	if (current.principal_state !== 'ACTIVE' || current.membership_state !== 'ACTIVE')
		throw new OagCanonicalErrorV1('OAG_CAN_MEMBERSHIP_INVALID');
	if (b.principal_id !== current.principal_id || b.membership_id !== current.membership_id)
		throw new OagCanonicalErrorV1('OAG_CAN_ACTOR_BINDING_INVALID');
	if (input.tenant_id !== current.tenant_id || current.resolved_tenant_id !== input.tenant_id)
		throw new OagCanonicalErrorV1('OAG_CAN_TENANT_MISMATCH');
	if (b.company_id !== current.company_id) throw new OagCanonicalErrorV1('OAG_CAN_COMPANY_MISMATCH');
	return deepFreeze({ ...input, binding: b, causal_references: [...input.causal_references] });
}
export function buildCanonicalRootV1(
	input: Omit<CanonicalAuthorityRootV1, 'root_id'>,
	context: RootBootstrapContextV1,
): CanonicalAuthorityRootV1 {
	const e = context.eligibility,
		b = context.actor_binding.binding;
	if (
		e.requested_scope !== 'REPRESENT_LEGAL_ENTITY_FOR_PLATFORM_ONBOARDING' ||
		e.future_consumer !== 'OAG_AUTHORITY_ROOT_BOOTSTRAP_V1' ||
		e.expires_at <= context.requested_at ||
		e.transferable !== false ||
		e.executable !== false
	)
		throw new OagCanonicalErrorV1('OAG_CAN_ROOT_BOOTSTRAP_UNAUTHORIZED');
	if (
		e.actor_principal_id !== input.principal_id ||
		e.membership_id !== input.membership_id ||
		b.principal_id !== input.principal_id ||
		b.membership_id !== input.membership_id ||
		b.oag_actor_id !== input.oag_actor_id ||
		b.oag_actor_binding_id !== input.actor_binding_id
	)
		throw new OagCanonicalErrorV1('OAG_CAN_ACTOR_BINDING_INVALID');
	if (context.tenant_id !== input.tenant_id || context.actor_binding.tenant_id !== input.tenant_id)
		throw new OagCanonicalErrorV1('OAG_CAN_TENANT_MISMATCH');
	if (context.company_id !== input.company_id || b.company_id !== input.company_id)
		throw new OagCanonicalErrorV1('OAG_CAN_COMPANY_MISMATCH');
	if (
		e.legal_entity_id !== input.legal_entity_id ||
		e.company_binding_id !== input.company_binding_id ||
		context.legal_entity_id !== input.legal_entity_id ||
		context.company_binding_id !== input.company_binding_id
	)
		throw new OagCanonicalErrorV1('OAG_CAN_ROOT_BOOTSTRAP_UNAUTHORIZED');
	const semantic = { ...input, permitted_scope: scope(input.permitted_scope), causal_references: ordered(input.causal_references) };
	return deepFreeze({ ...semantic, root_id: `oag-root:sha256:${sha(semantic)}` });
}
export function activateResponsibilityV1(
	r: CanonicalResponsibilityV1,
	c: CanonicalConfirmationChainV1,
	root: CanonicalAuthorityRootV1,
	now: string,
): CanonicalResponsibilityV1 {
	if (
		c.subject_fact_id !== r.responsibility_id ||
		c.authority_source_id !== root.root_id ||
		c.authority_source_actor_id === r.subject_actor_id
	)
		throw new OagCanonicalErrorV1('OAG_CAN_CONFIRMATION_SELF_REFERENCE');
	buildConfirmationChainV1(c.chain);
	if (root.tenant_id !== r.tenant_id || root.company_id !== r.company_id) throw new OagCanonicalErrorV1('OAG_CAN_COMPANY_MISMATCH');
	if (root.effective_until && root.effective_until <= now) throw new OagCanonicalErrorV1('OAG_CAN_ROOT_REVOKED');
	if (!scopeWithinV1(r.scope, root.permitted_scope) || !scopeWithinV1(r.scope, c.chain.terminal_scope))
		throw new OagCanonicalErrorV1('OAG_CAN_CONFIRMATION_INVALID');
	return deepFreeze({
		...r,
		scope: scope(r.scope),
		lifecycle_state: 'ACTIVE',
		confirmation_chain_id: c.chain.confirmation_chain_id,
		causal_references: ordered([...r.causal_references, c.chain.confirmation_chain_id]),
	});
}
export function buildDelegationV1(
	d: OperationalAuthorityDelegationV1,
	source: {
		id: string;
		actor_id: string;
		tenant_id: string;
		company_id: string;
		scope: OrganizationalResponsibilityScopeV1;
		expires_at?: string;
	},
	target: CanonicalActorBindingV1,
	c: CanonicalConfirmationChainV1,
	now: string,
): OperationalAuthorityDelegationV1 {
	if (d.depth !== 1 || 'parent_delegation_id' in d) throw new OagCanonicalErrorV1('OAG_CAN_DELEGATION_DEPTH_EXCEEDED');
	if (d.effective_until <= now || d.effective_until <= d.effective_from) throw new OagCanonicalErrorV1('OAG_CAN_DELEGATION_EXPIRED');
	if (
		d.source_authority_id !== source.id ||
		d.source_actor_id !== source.actor_id ||
		d.target_actor_id !== target.binding.oag_actor_id ||
		d.target_actor_binding_id !== target.binding.oag_actor_binding_id
	)
		throw new OagCanonicalErrorV1('OAG_CAN_DELEGATION_INVALID');
	if (d.tenant_id !== source.tenant_id || d.tenant_id !== target.tenant_id) throw new OagCanonicalErrorV1('OAG_CAN_TENANT_MISMATCH');
	if (d.company_id !== source.company_id || d.company_id !== target.binding.company_id)
		throw new OagCanonicalErrorV1('OAG_CAN_COMPANY_MISMATCH');
	if (!scopeWithinV1(d.delegated_scope, source.scope)) throw new OagCanonicalErrorV1('OAG_CAN_DELEGATION_SCOPE_EXPANDED');
	if (source.expires_at && d.effective_until > source.expires_at) throw new OagCanonicalErrorV1('OAG_CAN_DELEGATION_SCOPE_EXPANDED');
	if (
		c.chain.confirmation_chain_id !== d.confirmation_chain_id ||
		c.subject_fact_id !== d.delegation_id ||
		c.authority_source_actor_id === d.target_actor_id ||
		!scopeWithinV1(d.delegated_scope, c.chain.terminal_scope)
	)
		throw new OagCanonicalErrorV1('OAG_CAN_CONFIRMATION_INVALID');
	return deepFreeze({ ...d, delegated_scope: scope(d.delegated_scope), causal_references: ordered(d.causal_references) });
}
export function buildGraphVersionV1(input: Omit<OagGraphVersionV1, 'graph_version_id' | 'graph_digest'>): OagGraphVersionV1 {
	const refs = [...input.state_references]
		.map((x) => deepFreeze({ ...x }))
		.sort((a, b) => `${a.kind}:${a.identity}`.localeCompare(`${b.kind}:${b.identity}`));
	if (
		!refs.length ||
		new Set(refs.map((x) => `${x.kind}:${x.identity}`)).size !== refs.length ||
		refs.some((x) => !/^[0-9a-f]{64}$/.test(x.semantic_digest))
	)
		throw new OagCanonicalErrorV1('OAG_CAN_GRAPH_VERSION_INVALID');
	const graph_digest = sha({
		tenant_id: input.tenant_id,
		company_id: input.company_id,
		policy_id: input.policy_id,
		state_references: refs,
	});
	return deepFreeze({
		...input,
		state_references: refs,
		graph_digest,
		graph_version_id: `oag-graph:sha256:${graph_digest}`,
		causal_references: ordered(input.causal_references),
	});
}
export function semanticReferenceV1(kind: OagGraphStateReferenceV1['kind'], identity: string, value: unknown): OagGraphStateReferenceV1 {
	return deepFreeze({ kind, identity, semantic_digest: sha(value) });
}
