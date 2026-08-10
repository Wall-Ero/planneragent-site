import { randomUUID } from 'node:crypto';
import { deepFreeze } from '../organizational-representation/organizational.representation.policy.v1';
import { CanonicalOrganizationalAuthorityD1V1 } from './organizational.authority.d1.v1';
import type {
	CanonicalActorBindingV1,
	CanonicalAuthorityRootV1,
	CanonicalConfirmationChainV1,
	CanonicalResponsibilityV1,
	OperationalAuthorityDelegationV1,
	OrganizationalAuthorityPolicyV2,
} from './organizational.authority.contracts.v1';
import {
	OagAuthorityProofErrorV1,
	type CanonicalEffectiveOperationalAuthorityProofV1,
	type EffectiveAuthorityCanonicalStateV1,
	type EffectiveAuthorityProofStoreV1,
	type EffectiveOperationalAuthorityProofRequestV1,
} from './effective.authority.proof.contracts.v1';
const list = (x: unknown) => JSON.parse(String(x)) as any[],
	j = (x: unknown) => JSON.stringify(x);
export class D1EffectiveAuthorityProofStoreV1 implements EffectiveAuthorityProofStoreV1 {
	constructor(private readonly db: D1Database) {}
	async loadCurrentState(q: EffectiveOperationalAuthorityProofRequestV1): Promise<EffectiveAuthorityCanonicalStateV1 | null> {
		const graphState = await new CanonicalOrganizationalAuthorityD1V1(this.db).resolveCurrentState(q.tenant_id, q.company_id);
		if (!graphState || graphState.graph.policy_id !== 'OAG_AUTHORITY_POLICY_V2') return null;
		const p = await this.db
			.prepare(
				"SELECT * FROM oag_can_policies p LEFT JOIN oag_can_transitions t ON t.subject_kind='POLICY' AND t.subject_id=p.policy_id WHERE p.policy_id='OAG_AUTHORITY_POLICY_V2' AND t.transition_id IS NULL",
			)
			.first<Record<string, unknown>>();
		if (!p) return null;
		const b = await this.db
			.prepare(
				`SELECT b.*,pr.lifecycle_state principal_state,m.lifecycle_state membership_state FROM oag_can_actor_bindings b JOIN oir_principals pr ON pr.principal_id=b.principal_id JOIN oir_organization_memberships m ON m.membership_id=b.membership_id LEFT JOIN oag_can_transitions t ON t.subject_kind='ACTOR_BINDING' AND t.subject_id=b.binding_id WHERE b.actor_id=? AND b.principal_id=? AND b.tenant_id=? AND b.company_id=? AND t.transition_id IS NULL`,
			)
			.bind(q.oag_actor_id, q.principal_id, q.tenant_id, q.company_id)
			.first<Record<string, unknown>>();
		if (!b) return null;
		const rows = await this.db
			.prepare(
				`SELECT r.*,c.chain_id,c.subject_actor_id chain_subject,c.declaration_version_id chain_declaration,c.steps_json,c.terminal_scope_json,c.graph_version_id chain_graph,c.authority_source_id,c.authority_source_actor_id,c.subject_fact_id,c.effective_from chain_from,c.effective_until chain_until,c.evidence_references_json,c.causal_references_json chain_causes,root.*,root.root_id canonical_root_id,root.scope_json root_scope,root.effective_from root_from,root.effective_until root_until,d.delegation_id,d.source_authority_id delegation_source,d.source_actor_id,d.target_actor_id,d.target_actor_binding_id,d.domain delegation_domain,d.scope_json delegation_scope,d.effective_from delegation_from,d.effective_until delegation_until,d.depth,d.confirmation_chain_id delegation_chain,d.graph_version_id delegation_graph,d.causal_references_json delegation_causes FROM oag_can_responsibilities r JOIN oag_can_confirmation_chains c ON c.chain_id=r.confirmation_chain_id JOIN oag_can_roots root ON (root.actor_id=r.subject_actor_id OR root.root_id=c.authority_source_id) LEFT JOIN oag_can_delegations d ON d.target_actor_id=r.subject_actor_id AND d.source_authority_id=root.root_id LEFT JOIN oag_can_transitions tr ON tr.subject_kind='RESPONSIBILITY' AND tr.subject_id=r.responsibility_id LEFT JOIN oag_can_transitions tc ON tc.subject_kind='CONFIRMATION' AND tc.subject_id=c.chain_id LEFT JOIN oag_can_transitions tt ON tt.subject_kind='ROOT' AND tt.subject_id=root.root_id LEFT JOIN oag_can_transitions td ON td.subject_kind='DELEGATION' AND td.subject_id=d.delegation_id WHERE r.subject_actor_id=? AND r.tenant_id=? AND r.company_id=? AND r.lifecycle_state='ACTIVE' AND tr.transition_id IS NULL AND tc.transition_id IS NULL AND tt.transition_id IS NULL AND td.transition_id IS NULL`,
			)
			.bind(q.oag_actor_id, q.tenant_id, q.company_id)
			.all<Record<string, unknown>>();
		const binding = deepFreeze({
			version: 1,
			tenant_id: b.tenant_id,
			binding: {
				version: 1,
				oag_actor_binding_id: b.binding_id,
				oag_actor_id: b.actor_id,
				principal_id: b.principal_id,
				membership_id: b.membership_id,
				company_id: b.company_id,
				lifecycle_state: 'ACTIVE',
				bound_at: b.effective_from,
				binding_reference: b.binding_reference,
			},
			effective_from: b.effective_from,
			policy_id: 'OAG_AUTHORITY_POLICY_V1',
			causal_references: list(b.causal_references_json),
		}) as unknown as CanonicalActorBindingV1;
		const candidates = (await Promise.all(rows.results.map(async(x) => {
			const root = deepFreeze({
					version: 1,
					root_id: x.canonical_root_id,
					tenant_id: x.tenant_id,
					company_id: x.company_id,
					oag_actor_id: x.actor_id,
					actor_binding_id: x.actor_binding_id,
					principal_id: x.principal_id,
					membership_id: x.membership_id,
					domain: x.domain,
					permitted_scope: JSON.parse(String(x.root_scope)),
					effective_from: x.root_from,
					effective_until: x.root_until ?? undefined,
					bootstrap_eligibility_id: x.bootstrap_eligibility_id,
					bootstrap_authority_id: x.bootstrap_authority_id,
					legal_entity_id: x.legal_entity_id,
					company_binding_id: x.company_binding_id,
					policy_id: x.policy_id,
					graph_version_id: x.graph_version_id,
					causal_references: list(x.causal_references_json),
				}) as unknown as CanonicalAuthorityRootV1,
				responsibility = deepFreeze({
					version: 1,
					responsibility_id: x.responsibility_id,
					declaration_version_id: x.declaration_version_id,
					tenant_id: x.tenant_id,
					company_id: x.company_id,
					subject_actor_id: x.subject_actor_id,
					scope: JSON.parse(String(x.scope_json)),
					effective_from: x.effective_from,
					effective_until: x.effective_until ?? undefined,
					lifecycle_state: x.lifecycle_state,
					confirmation_chain_id: x.confirmation_chain_id,
					policy_id: x.policy_id,
					causal_references: list(x.causal_references_json),
				}) as unknown as CanonicalResponsibilityV1,
				confirmation = deepFreeze({
					version: 1,
					chain: {
						version: 1,
						confirmation_chain_id: x.chain_id,
						subject_actor_id: x.chain_subject,
						tenant_id: x.tenant_id,
						company_id: x.company_id,
						declaration_version_id: x.chain_declaration,
						steps: list(x.steps_json),
						terminal_scope: JSON.parse(String(x.terminal_scope_json)),
						graph_version: x.chain_graph,
						policy_version: 'OAG_AUTHORITY_POLICY_V1',
						completed_at: x.chain_from,
					},
					authority_source_id: x.authority_source_id,
					authority_source_actor_id: x.authority_source_actor_id,
					subject_fact_id: x.subject_fact_id,
					policy_id: 'OAG_AUTHORITY_POLICY_V1',
					effective_from: x.chain_from,
					effective_until: x.chain_until ?? undefined,
					evidence_references: list(x.evidence_references_json),
					causal_references: list(x.chain_causes),
				}) as unknown as CanonicalConfirmationChainV1;
			const direct={ authority_basis: 'DIRECT' as const, binding, root, responsibility, confirmation };
			if (!x.delegation_id) return [direct];
			const delegation = deepFreeze({
				version: 1,
				delegation_id: x.delegation_id,
				tenant_id: x.tenant_id,
				company_id: x.company_id,
				source_authority_id: x.delegation_source,
				source_actor_id: x.source_actor_id,
				target_actor_id: x.target_actor_id,
				target_actor_binding_id: x.target_actor_binding_id,
				domain: x.delegation_domain,
				delegated_scope: JSON.parse(String(x.delegation_scope)),
				effective_from: x.delegation_from,
				effective_until: x.delegation_until,
				depth: x.depth,
				confirmation_chain_id: x.delegation_chain,
				policy_id: 'OAG_AUTHORITY_POLICY_V1',
				graph_version_id: x.delegation_graph,
				causal_references: list(x.delegation_causes),
			}) as unknown as OperationalAuthorityDelegationV1;
			const delegation_confirmation=await this.loadConfirmation(String(x.delegation_chain));
			return delegation_confirmation?[direct,{ authority_basis: 'DELEGATED' as const, binding, root, responsibility, confirmation, delegation,delegation_confirmation }]:[direct];
		}))).flat();
		const policy = deepFreeze({
			version: 2,
			policy_id: p.policy_id,
			policy_version: 2,
			effective_from: p.effective_from,
			effective_until: p.effective_until ?? undefined,
			root_activation_rule: p.root_activation_rule,
			responsibility_confirmation_rule: p.responsibility_confirmation_rule,
			delegation_confirmation_rule: p.delegation_confirmation_rule,
			max_delegation_depth: 1,
			proof_validity_rule: p.proof_validity_rule,
			max_effective_authority_proof_lifetime_seconds: p.max_effective_authority_proof_lifetime_seconds,
			graph_supersession_rule: p.graph_supersession_rule,
			supersedes_policy_id: p.supersedes_policy_id,
			correlation_id: p.correlation_id,
			causal_references: list(p.causal_references_json),
		}) as unknown as OrganizationalAuthorityPolicyV2;
		return deepFreeze({
			policy,
			graph: graphState.graph,
			principal_state: String(b.principal_state),
			membership_state: String(b.membership_state),
			binding_current: true,
			candidates,
		});
	}
	async persist(x: CanonicalEffectiveOperationalAuthorityProofV1) {
		const old = await this.db
			.prepare('SELECT proof_digest FROM oag_can_authority_proofs WHERE authority_proof_id=?')
			.bind(x.authority_proof_id)
			.first<{ proof_digest: string }>();
		if (old) {
			if (old.proof_digest !== x.proof_digest) throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_PERSISTENCE_FAILED');
			return 'IDENTICAL';
		}
		try {
			await this.db
				.prepare(`INSERT INTO oag_can_authority_proofs VALUES (${Array(27).fill('?').join(',')})`)
				.bind(
					x.authority_proof_id,
					1,
					x.proof_digest,
					x.authority_source_class,
					x.authority_basis,
					x.oag_actor_id,
					x.oag_actor_binding_id,
					x.principal_id,
					x.membership_id,
					x.tenant_id,
					x.company_id,
					x.root_reference,
					j(x.responsibility_references),
					j(x.declaration_version_ids),
					x.confirmation_chain_id,
					j(x.delegation_references),
					x.graph_version,
					x.graph_digest,
					x.policy_id,
					x.policy_numeric_version,
					j(x.effective_scope),
					x.issued_at,
					x.expires_at,
					x.eligibility_state,
					j(x.invalidation_reasons),
					x.correlation_id,
					j(x.causal_references),
				)
				.run();
			return 'CREATED';
		} catch {
			throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_PERSISTENCE_FAILED');
		}
	}
	async find(q: EffectiveOperationalAuthorityProofRequestV1) {
		const rows = await this.db
			.prepare(
				'SELECT * FROM oag_can_authority_proofs WHERE actor_id=? AND principal_id=? AND tenant_id=? AND company_id=? ORDER BY authority_proof_id',
			)
			.bind(q.oag_actor_id, q.principal_id, q.tenant_id, q.company_id)
			.all<Record<string, unknown>>();
		return rows.results.map((x) =>
			deepFreeze({
				version: 1,
				authority_proof_id: x.authority_proof_id,
				proof_digest: x.proof_digest,
				authority_source_class: x.authority_source_class,
				authority_basis: x.authority_basis,
				oag_actor_id: x.actor_id,
				oag_actor_binding_id: x.binding_id,
				principal_id: x.principal_id,
				membership_id: x.membership_id,
				tenant_id: x.tenant_id,
				company_id: x.company_id,
				root_reference: x.root_reference,
				responsibility_references: list(x.responsibility_references_json),
				declaration_version_ids: list(x.declaration_version_ids_json),
				confirmation_chain_id: x.confirmation_chain_id,
				confirmation_chain_references: [x.confirmation_chain_id],
				delegation_references: list(x.delegation_references_json),
				graph_version: x.graph_version_id,
				graph_digest: x.graph_digest,
				policy_id: x.policy_id,
				policy_version: x.policy_id,
				policy_numeric_version: x.policy_version,
				effective_scope: JSON.parse(String(x.effective_scope_json)),
				issued_at: x.issued_at,
				expires_at: x.expires_at,
				eligibility_state: x.eligibility_state,
				invalidation_reasons: list(x.invalidation_reasons_json),
				correlation_id: x.correlation_id,
				causal_references: list(x.causal_references_json),
			}),
		) as unknown as CanonicalEffectiveOperationalAuthorityProofV1[];
	}
	async audit(e: any) {
		try {
			await this.db
				.prepare('INSERT INTO oag_can_authority_proof_audit_events VALUES (?,?,?,?,?,?,?,?,?,?,NULL)')
				.bind(
					`oag-proof-audit:${randomUUID()}`,
					e.event_kind,
					e.outcome,
					e.reason_code,
					e.authority_proof_id ?? null,
					e.actor_id,
					e.policy_id,
					e.correlation_id,
					j(e.causal_references),
					e.recorded_at,
				)
				.run();
		} catch {
			throw new OagAuthorityProofErrorV1('OAG_AUTHORITY_PROOF_AUDIT_FAILED');
		}
	}
	private async loadConfirmation(id:string):Promise<CanonicalConfirmationChainV1|null>{const x=await this.db.prepare("SELECT * FROM oag_can_confirmation_chains c LEFT JOIN oag_can_transitions t ON t.subject_kind='CONFIRMATION' AND t.subject_id=c.chain_id WHERE c.chain_id=? AND t.transition_id IS NULL").bind(id).first<Record<string,unknown>>();if(!x)return null;return deepFreeze({version:1,chain:{version:1,confirmation_chain_id:x.chain_id,subject_actor_id:x.subject_actor_id,tenant_id:x.tenant_id,company_id:x.company_id,declaration_version_id:x.declaration_version_id,steps:list(x.steps_json),terminal_scope:JSON.parse(String(x.terminal_scope_json)),graph_version:x.graph_version_id,policy_version:"OAG_AUTHORITY_POLICY_V1",completed_at:x.effective_from},authority_source_id:x.authority_source_id,authority_source_actor_id:x.authority_source_actor_id,subject_fact_id:x.subject_fact_id,policy_id:"OAG_AUTHORITY_POLICY_V1",effective_from:x.effective_from,effective_until:x.effective_until??undefined,evidence_references:list(x.evidence_references_json),causal_references:list(x.causal_references_json)})as unknown as CanonicalConfirmationChainV1;}
}
