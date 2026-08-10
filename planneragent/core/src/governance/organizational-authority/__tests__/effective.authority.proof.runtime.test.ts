import { describe, expect, it } from 'vitest';
import {
	buildGraphVersionV1,
	EffectiveOperationalAuthorityProofRuntimeV1,
	organizationalAuthorityPolicyV1,
	organizationalAuthorityPolicyV2,
	semanticReferenceV1,
	type CanonicalEffectiveOperationalAuthorityProofV1,
	type EffectiveAuthorityCanonicalStateV1,
	type EffectiveAuthorityProofStoreV1,
	type EffectiveOperationalAuthorityProofRequestV1,
} from '..';
const at = '2026-08-10T10:00:00.000Z',
	scope = {
		domain: 'operations',
		intents: ['EXECUTE'],
		scopes: ['OPERATE'],
		limits: [],
		team_or_subordinate_actor_ids: [],
		operational_constraints: [],
	} as any;
const req = (time = at): EffectiveOperationalAuthorityProofRequestV1 => ({
	version: 1,
	oag_actor_id: 'actor:2',
	principal_id: 'principal:2',
	tenant_id: 'tenant:1',
	company_id: 'company:1',
	requested_domain: 'operations',
	requested_scope: scope,
	as_of: time,
	correlation_id: 'correlation:1',
	causal_references: [],
});
function fixture(
	expiry: Partial<Record<'membership' | 'root' | 'responsibility' | 'confirmation' | 'policy', string>> = {},
): EffectiveAuthorityCanonicalStateV1 {
	const policy = { ...organizationalAuthorityPolicyV2(at, 'policy-correlation'), effective_until: expiry.policy },
		binding = {
			version: 1,
			tenant_id: 'tenant:1',
			binding: {
				version: 1,
				oag_actor_binding_id: 'binding:2',
				oag_actor_id: 'actor:2',
				principal_id: 'principal:2',
				membership_id: 'membership:2',
				company_id: 'company:1',
				lifecycle_state: 'ACTIVE',
				bound_at: at,
				binding_reference: 'oir:2',
			},
			effective_from: at,
			policy_id: 'OAG_AUTHORITY_POLICY_V1',
			causal_references: [],
		} as any,
		root = {
			version: 1,
			root_id: 'root:1',
			tenant_id: 'tenant:1',
			company_id: 'company:1',
			oag_actor_id: 'actor:2',
			actor_binding_id: 'binding:2',
			principal_id: 'principal:2',
			membership_id: 'membership:2',
			domain: 'operations',
			permitted_scope: scope,
			effective_from: at,
			effective_until: expiry.root,
			bootstrap_eligibility_id: 'orpe:1',
			bootstrap_authority_id: 'orpa:1',
			legal_entity_id: 'legal:1',
			company_binding_id: 'company-binding:1',
			policy_id: 'OAG_AUTHORITY_POLICY_V1',
			graph_version_id: 'graph:v1',
			causal_references: [],
		} as any,
		responsibility = {
			version: 1,
			responsibility_id: 'responsibility:2',
			declaration_version_id: 'declaration:2',
			tenant_id: 'tenant:1',
			company_id: 'company:1',
			subject_actor_id: 'actor:2',
			scope,
			effective_from: at,
			effective_until: expiry.responsibility,
			lifecycle_state: 'ACTIVE',
			confirmation_chain_id: 'chain:2',
			policy_id: 'OAG_AUTHORITY_POLICY_V1',
			causal_references: [],
		} as any,
		confirmation = {
			version: 1,
			chain: {
				version: 1,
				confirmation_chain_id: 'chain:2',
				subject_actor_id: 'actor:2',
				tenant_id: 'tenant:1',
				company_id: 'company:1',
				declaration_version_id: 'declaration:2',
				steps: [{ ordinal: 1, confirmation_decision_id: 'decision:2', confirming_actor_id: 'actor:1', confirmed_scope: scope }],
				terminal_scope: scope,
				graph_version: 'graph:v1',
				policy_version: 'OAG_AUTHORITY_POLICY_V1',
				completed_at: at,
			},
			authority_source_id: 'root:1',
			authority_source_actor_id: 'actor:1',
			subject_fact_id: 'responsibility:2',
			policy_id: 'OAG_AUTHORITY_POLICY_V1',
			effective_from: at,
			effective_until: expiry.confirmation,
			evidence_references: [],
			causal_references: [],
		} as any,
		graph = buildGraphVersionV1({
			version: 1,
			tenant_id: 'tenant:1',
			company_id: 'company:1',
			policy_id: 'OAG_AUTHORITY_POLICY_V2',
			state_references: [semanticReferenceV1('ACTOR_BINDING','binding:2',binding),semanticReferenceV1('ROOT', 'root:1', root),semanticReferenceV1('RESPONSIBILITY','responsibility:2',responsibility),semanticReferenceV1('CONFIRMATION','chain:2',confirmation)],
			effective_from: at,
			correlation_id: 'graph-correlation',
			causal_references: [],
		});
	return {
		policy,
		graph,
		principal_state: 'ACTIVE',
		membership_state: 'ACTIVE',
		membership_effective_until: expiry.membership,
		binding_current: true,
		candidates: [{ authority_basis: 'DIRECT', binding, root, responsibility, confirmation }],
	};
}
class Memory implements EffectiveAuthorityProofStoreV1 {
	proofs: CanonicalEffectiveOperationalAuthorityProofV1[] = [];
	audits: any[] = [];
	constructor(public state: EffectiveAuthorityCanonicalStateV1 | null = fixture()) {}
	async loadCurrentState() {
		return this.state;
	}
	async persist(p: CanonicalEffectiveOperationalAuthorityProofV1) {
		const old = this.proofs.find((x) => x.authority_proof_id === p.authority_proof_id);
		if (old) return 'IDENTICAL' as const;
		this.proofs.push(p);
		return 'CREATED' as const;
	}
	async find() {
		return this.proofs;
	}
	async audit(e: any) {
		this.audits.push(e);
	}
}
describe('OAG-AUTH-WU1 bounded effective authority proof', () => {
	it('preserves V1 and defines exact immutable V2', () => {
		expect(organizationalAuthorityPolicyV1(at, 'c').proof_validity_rule).toBe('EARLIEST_SOURCE_VALIDITY_AND_CURRENT_STATE');
		const p = organizationalAuthorityPolicyV2(at, 'c');
		expect(p).toMatchObject({
			version: 2,
			policy_id: 'OAG_AUTHORITY_POLICY_V2',
			policy_version: 2,
			supersedes_policy_id: 'OAG_AUTHORITY_POLICY_V1',
			max_effective_authority_proof_lifetime_seconds: 3600,
			max_delegation_depth: 1,
		});
		expect(Object.isFrozen(p)).toBe(true);
	});
	it('issues deterministic immutable direct proof from open-ended sources', async () => {
		const m = new Memory(),
			r = new EffectiveOperationalAuthorityProofRuntimeV1(m),
			a = await r.issueEffectiveOperationalAuthorityProofV1(req()),
			b = await r.issueEffectiveOperationalAuthorityProofV1(req());
		expect(a.authority_proof_id).toBe(b.authority_proof_id);
		expect(a.proof_digest).toBe(b.proof_digest);
		expect(a.expires_at).toBe('2026-08-10T11:00:00.000Z');
		expect(Object.isFrozen(a)).toBe(true);
		expect(m.proofs).toHaveLength(1);
	});
	it.each([
		['membership', '2026-08-10T10:15:00.000Z'],
		['root', '2026-08-10T10:20:00.000Z'],
		['responsibility', '2026-08-10T10:25:00.000Z'],
		['confirmation', '2026-08-10T10:30:00.000Z'],
		['policy', '2026-08-10T10:35:00.000Z'],
	] as const)('truncates at finite %s validity', async (k, v) => {
		const p = await new EffectiveOperationalAuthorityProofRuntimeV1(
			new Memory(fixture({ [k]: v })),
		).issueEffectiveOperationalAuthorityProofV1(req());
		expect(p.expires_at).toBe(v);
	});
	it('issues exact single-hop delegated proof and truncates at delegation expiry',async()=>{const s=fixture(),base=s.candidates[0]!,root={...base.root,oag_actor_id:'actor:1',actor_binding_id:'binding:1',principal_id:'principal:1',membership_id:'membership:1'},delegation={version:1,delegation_id:'delegation:1',tenant_id:'tenant:1',company_id:'company:1',source_authority_id:root.root_id,source_actor_id:'actor:1',target_actor_id:'actor:2',target_actor_binding_id:'binding:2',domain:'operations',delegated_scope:scope,effective_from:at,effective_until:'2026-08-10T10:40:00.000Z',depth:1,confirmation_chain_id:'chain:delegation:1',policy_id:'OAG_AUTHORITY_POLICY_V1',graph_version_id:s.graph.graph_version_id,causal_references:[]}as any,delegation_confirmation={...base.confirmation,chain:{...base.confirmation.chain,confirmation_chain_id:'chain:delegation:1'},subject_fact_id:'delegation:1'}as any,candidate={...base,authority_basis:'DELEGATED'as const,root,delegation,delegation_confirmation},graph=buildGraphVersionV1({...s.graph,graph_version_id:undefined,graph_digest:undefined,state_references:s.graph.state_references.map(x=>x.kind==='ROOT'?semanticReferenceV1('ROOT',root.root_id,root):x).concat(semanticReferenceV1('DELEGATION',delegation.delegation_id,delegation))}as any),p=await new EffectiveOperationalAuthorityProofRuntimeV1(new Memory({...s,graph,candidates:[candidate]})).issueEffectiveOperationalAuthorityProofV1(req());expect(p.authority_basis).toBe('DELEGATED');expect(p.delegation_references).toEqual(['delegation:1']);expect(p.expires_at).toBe('2026-08-10T10:40:00.000Z');});
	it('revalidates membership and graph before resolving', async () => {
		const m = new Memory(),
			r = new EffectiveOperationalAuthorityProofRuntimeV1(m);
		await r.issueEffectiveOperationalAuthorityProofV1(req());
		expect(await r.resolveCurrentEffectiveOperationalAuthorityProofV1(req('2026-08-10T10:30:00.000Z'))).toBeTruthy();
		m.state = { ...m.state!, membership_state: 'REVOKED' };
		await expect(r.resolveCurrentEffectiveOperationalAuthorityProofV1(req('2026-08-10T10:31:00.000Z'))).rejects.toMatchObject({
			code: 'OAG_AUTHORITY_PROOF_MEMBERSHIP_INVALID',
		});
	});
	it('fails closed on distinct authority lineage', async () => {
		const s = fixture();
		const other={...s.candidates[0]!.root,root_id:'root:other'};
		const m = new Memory({
			...s,
			graph:buildGraphVersionV1({...s.graph,graph_version_id:undefined,graph_digest:undefined,state_references:[...s.graph.state_references,semanticReferenceV1('ROOT','root:other',other)]}as any),
			candidates: [...s.candidates, { ...s.candidates[0]!, root:other }],
		});
		await expect(new EffectiveOperationalAuthorityProofRuntimeV1(m).issueEffectiveOperationalAuthorityProofV1(req())).rejects.toMatchObject(
			{ code: 'OAG_AUTHORITY_PROOF_AMBIGUOUS' },
		);
	});
});
