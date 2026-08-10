import { createHash } from 'node:crypto';
import type { OrganizationalResponsibilityScopeV1 } from '../../operational-identity/contracts/track-b.v1';
import { deepFreeze } from '../organizational-representation/organizational.representation.policy.v1';
import { buildGraphVersionV1, scopeWithinV1 } from './organizational.authority.runtime.v1';
import type {
	AuthorityProofCandidateV1,
	CanonicalEffectiveOperationalAuthorityProofV1,
	EffectiveAuthorityCanonicalStateV1,
	EffectiveAuthorityProofStoreV1,
	EffectiveOperationalAuthorityProofRequestV1,
	OagAuthorityProofFailureCodeV1,
} from './effective.authority.proof.contracts.v1';
import { OagAuthorityProofErrorV1 } from './effective.authority.proof.contracts.v1';
const hash = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex'),
	same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
	sort = (x: readonly string[]) => [...new Set(x)].sort();
const active = (from: string, to: string | undefined, at: string) => from <= at && (!to || to > at);
function intersection(a: OrganizationalResponsibilityScopeV1, b: OrganizationalResponsibilityScopeV1) {
	if (a.domain !== b.domain) throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_DOMAIN_INVALID');
	return deepFreeze({
		domain: a.domain,
		intents: a.intents.filter((x) => b.intents.includes(x)).sort(),
		scopes: a.scopes.filter((x) => b.scopes.includes(x)).sort(),
		limits: a.limits.filter((x) => b.limits.some((y) => same(x, y))).sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y))),
		team_or_subordinate_actor_ids: a.team_or_subordinate_actor_ids.filter((x) => b.team_or_subordinate_actor_ids.includes(x)).sort(),
		operational_constraints: a.operational_constraints.filter((x) => b.operational_constraints.includes(x)).sort(),
	});
}
function request(r: EffectiveOperationalAuthorityProofRequestV1) {
	if (
		!r ||
		r.version !== 1 ||
		!r.oag_actor_id ||
		!r.principal_id ||
		!r.tenant_id ||
		!r.company_id ||
		!r.correlation_id ||
		!Number.isFinite(Date.parse(r.as_of)) ||
		r.requested_domain !== r.requested_scope?.domain
	)
		throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_REQUEST_INVALID');
}
function state(s: EffectiveAuthorityCanonicalStateV1, r: EffectiveOperationalAuthorityProofRequestV1) {
	if (
		s.policy.policy_id !== 'OAG_AUTHORITY_POLICY_V2' ||
		s.policy.policy_version !== 2 ||
		s.policy.max_effective_authority_proof_lifetime_seconds !== 3600 ||
		!active(s.policy.effective_from, s.policy.effective_until, r.as_of)
	)
		throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_POLICY_STALE');
	if (s.principal_state !== 'ACTIVE') throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_ACTOR_INVALID');
	if (s.membership_state !== 'ACTIVE') throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_MEMBERSHIP_INVALID');
	if (!s.binding_current) throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_ACTOR_INVALID');
	const rebuilt = buildGraphVersionV1({ ...s.graph, graph_version_id: undefined, graph_digest: undefined } as any);
	if (
		s.graph.policy_id !== s.policy.policy_id ||
		rebuilt.graph_digest !== s.graph.graph_digest ||
		rebuilt.graph_version_id !== s.graph.graph_version_id
	)
		throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_GRAPH_MISMATCH');
}
function derive(s: EffectiveAuthorityCanonicalStateV1, r: EffectiveOperationalAuthorityProofRequestV1, c: AuthorityProofCandidateV1) {
	const b = c.binding.binding;
	const references=new Set(s.graph.state_references.map(x=>`${x.kind}:${x.identity}`));
	for(const [kind,id] of [['ACTOR_BINDING',b.oag_actor_binding_id],['ROOT',c.root.root_id],['RESPONSIBILITY',c.responsibility.responsibility_id],['CONFIRMATION',c.confirmation.chain.confirmation_chain_id],...(c.delegation?[['DELEGATION',c.delegation.delegation_id]]:[])] as string[][])if(!references.has(`${kind}:${id}`))throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_GRAPH_MISMATCH');
	if (b.oag_actor_id !== r.oag_actor_id || b.principal_id !== r.principal_id)
		throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_ACTOR_INVALID');
	if (c.binding.tenant_id !== r.tenant_id || c.root.tenant_id !== r.tenant_id)
		throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_TENANT_MISMATCH');
	if (b.company_id !== r.company_id || c.root.company_id !== r.company_id || c.responsibility.company_id !== r.company_id)
		throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_COMPANY_MISMATCH');
	if(c.authority_basis==='DIRECT'&&c.root.oag_actor_id!==r.oag_actor_id)throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_NOT_ESTABLISHED');
	if (
		c.responsibility.subject_actor_id !== r.oag_actor_id ||
		c.responsibility.lifecycle_state !== 'ACTIVE' ||
		c.responsibility.confirmation_chain_id !== c.confirmation.chain.confirmation_chain_id
	)
		throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_RESPONSIBILITY_INVALID');
	if (
		c.confirmation.subject_fact_id !== c.responsibility.responsibility_id ||
		c.confirmation.chain.subject_actor_id !== r.oag_actor_id ||
		!active(c.confirmation.effective_from, c.confirmation.effective_until, r.as_of)
	)
		throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_CONFIRMATION_INVALID');
	if (
		!active(c.root.effective_from, c.root.effective_until, r.as_of) ||
		!active(c.responsibility.effective_from, c.responsibility.effective_until, r.as_of)
	)
		throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_STALE');
	let scope = intersection(intersection(c.root.permitted_scope, c.responsibility.scope), c.confirmation.chain.terminal_scope);
	if (c.authority_basis === 'DELEGATED') {
		const d = c.delegation,
			dc = c.delegation_confirmation;
		if (!d || d.depth !== 1) throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_DELEGATION_DEPTH_EXCEEDED');
		if (!dc || dc.chain.confirmation_chain_id !== d.confirmation_chain_id || dc.subject_fact_id !== d.delegation_id)
			throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_CONFIRMATION_INVALID');
		if (
			d.target_actor_id !== r.oag_actor_id ||
			d.source_actor_id !== c.root.oag_actor_id ||
			d.target_actor_binding_id !== b.oag_actor_binding_id ||
			d.source_authority_id !== c.root.root_id ||
			!active(d.effective_from, d.effective_until, r.as_of)
		)
			throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_DELEGATION_INVALID');
		scope = intersection(scope, d.delegated_scope);
	}
	if (!scopeWithinV1(r.requested_scope, scope)) throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_SCOPE_NOT_CONTAINED');
	return scope;
}
function proof(
	s: EffectiveAuthorityCanonicalStateV1,
	r: EffectiveOperationalAuthorityProofRequestV1,
	c: AuthorityProofCandidateV1,
	effective_scope: OrganizationalResponsibilityScopeV1,
) {
	const bound = new Date(Date.parse(r.as_of) + s.policy.max_effective_authority_proof_lifetime_seconds * 1000).toISOString(),
		expires_at = [
			bound,
			s.membership_effective_until,
			s.policy.effective_until,
			c.root.effective_until,
			c.responsibility.effective_until,
			c.confirmation.effective_until,
			c.delegation?.effective_until,
			c.delegation_confirmation?.effective_until,
		]
			.filter((x): x is string => !!x)
			.sort()[0]!;
	const semantic = {
		authority_source_class: 'ORGANIZATIONAL_OPERATIONAL_AUTHORITY' as const,
		authority_basis: c.authority_basis,
		oag_actor_id: r.oag_actor_id,
		oag_actor_binding_id: c.binding.binding.oag_actor_binding_id,
		principal_id: r.principal_id,
		membership_id: c.binding.binding.membership_id,
		tenant_id: r.tenant_id,
		company_id: r.company_id,
		root_reference: c.root.root_id,
		responsibility_references: [c.responsibility.responsibility_id],
		declaration_version_ids: [c.responsibility.declaration_version_id],
		confirmation_chain_id: c.confirmation.chain.confirmation_chain_id,
		confirmation_chain_references: sort([
			c.confirmation.chain.confirmation_chain_id,
			...(c.delegation_confirmation ? [c.delegation_confirmation.chain.confirmation_chain_id] : []),
		]),
		graph_version: s.graph.graph_version_id,
		graph_digest: s.graph.graph_digest,
		delegation_references: c.delegation ? [c.delegation.delegation_id] : [],
		effective_scope,
		policy_id: s.policy.policy_id,
		policy_version: s.policy.policy_id,
		policy_numeric_version: 2 as const,
		issued_at: r.as_of,
		expires_at,
		eligibility_state: 'ELIGIBLE' as const,
		invalidation_reasons: [] as const,
		correlation_id: r.correlation_id,
		causal_references: sort([
			...r.causal_references,
			s.graph.graph_version_id,
			c.root.root_id,
			c.responsibility.responsibility_id,
			c.confirmation.chain.confirmation_chain_id,
			...(c.delegation ? [c.delegation.delegation_id] : []),
		]),
	};
	const authority_proof_id = `oag-authority-proof:sha256:${hash(semantic)}`,
		proof_digest = hash({ authority_proof_id, ...semantic });
	return deepFreeze({
		version: 1,
		authority_proof_id,
		...semantic,
		proof_digest,
	}) as unknown as CanonicalEffectiveOperationalAuthorityProofV1;
}
export class EffectiveOperationalAuthorityProofRuntimeV1 {
	constructor(private readonly store: EffectiveAuthorityProofStoreV1) {}
	async issueEffectiveOperationalAuthorityProofV1(r: EffectiveOperationalAuthorityProofRequestV1) {
		return this.guard(r, async () => {
			request(r);
			const s = await this.store.loadCurrentState(r);
			if (!s) throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_NOT_ESTABLISHED');
			state(s, r);
			const ps: CanonicalEffectiveOperationalAuthorityProofV1[] = [];
			for (const c of s.candidates)
				try {
					ps.push(proof(s, r, c, derive(s, r, c)));
				} catch (e) {
					if (!(e instanceof OagAuthorityProofErrorV1)) throw e;
				}
			const unique = [...new Map(ps.map((x) => [x.proof_digest, x])).values()];
			if (unique.length !== 1)
				throw new OagAuthorityProofErrorV1(unique.length ? 'OAG_AUTHORITY_PROOF_AMBIGUOUS' : 'OAG_AUTHORITY_PROOF_NOT_ESTABLISHED');
			await this.store.persist(unique[0]!);
			await this.audit(r, 'PROOF_ISSUED', 'ISSUED', 'PROOF_ISSUED', unique[0]!.authority_proof_id);
			return unique[0]!;
		});
	}
	async resolveCurrentEffectiveOperationalAuthorityProofV1(r: EffectiveOperationalAuthorityProofRequestV1) {
		return this.guard(r, async () => {
			request(r);
			const s = await this.store.loadCurrentState(r);
			if (!s) throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_STALE');
			state(s, r);
			const rows = (await this.store.find(r)).filter(
				(x) =>
					x.expires_at > r.as_of &&
					scopeWithinV1(r.requested_scope, x.effective_scope) &&
					s.candidates.some((c) => {
						try {
							return (
								proof(
									s,
									{ ...r, as_of: x.issued_at, correlation_id: x.correlation_id, causal_references: x.causal_references },
									c,
									derive(s, { ...r, as_of: x.issued_at }, c),
								).proof_digest === x.proof_digest
							);
						} catch {
							return false;
						}
					}),
			);
			if (rows.length !== 1)
				throw new OagAuthorityProofErrorV1(rows.length ? 'OAG_AUTHORITY_PROOF_AMBIGUOUS' : 'OAG_AUTHORITY_PROOF_STALE');
			return rows[0]!;
		});
	}
	private async guard<T>(r: EffectiveOperationalAuthorityProofRequestV1, f: () => Promise<T>) {
		try {
			return await f();
		} catch (e) {
			const code = (
				e instanceof OagAuthorityProofErrorV1 ? e.code : 'OAG_AUTHORITY_PROOF_NOT_ESTABLISHED'
			) as OagAuthorityProofFailureCodeV1;
			await this.audit(r, 'PROOF_DENIED', 'DENIED', code).catch(() => {
				throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_AUDIT_FAILED');
			});
			throw new OagAuthorityProofErrorV1(code);
		}
	}
	private audit(r: EffectiveOperationalAuthorityProofRequestV1, event_kind: string, outcome: string, reason_code: string, id?: string) {
		return this.store.audit({
			event_kind,
			outcome,
			reason_code,
			authority_proof_id: id,
			actor_id: r?.oag_actor_id ?? 'INVALID',
			policy_id: 'OAG_AUTHORITY_POLICY_V2',
			correlation_id: r?.correlation_id ?? 'INVALID',
			causal_references: r?.causal_references ?? [],
			recorded_at: r?.as_of ?? new Date(0).toISOString(),
		});
	}
}
