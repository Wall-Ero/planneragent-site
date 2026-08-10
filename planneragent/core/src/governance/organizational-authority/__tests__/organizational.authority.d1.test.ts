import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import migration from '../../../../migrations/0028_canonical_organizational_authority.sql?raw';
import migration29 from '../../../../migrations/0029_authority_policy_v2_and_effective_proofs.sql?raw';
import {
	buildGraphVersionV1,
	CanonicalOrganizationalAuthorityD1V1,
	D1EffectiveAuthorityProofStoreV1,
	organizationalAuthorityPolicyV1,
	organizationalAuthorityPolicyV2,
	semanticReferenceV1,
} from '..';
const now = '2026-08-09T10:00:00.000Z',
	db = env.POLICIES_DB,
	repo = new CanonicalOrganizationalAuthorityD1V1(db);
function queries(sql: string) {
	return sql
		.split(/;\s*\r?\n(?=(?:PRAGMA|CREATE|INSERT|DROP|ALTER))/)
		.map((x) => x.trim())
		.filter(Boolean)
		.map((x) => (x.endsWith(';') ? x : `${x};`));
}
beforeAll(async () =>
	applyD1Migrations(db, [
		{ name: '0028', queries: queries(migration) },
		{ name: '0029', queries: queries(migration29) },
	]),
);
beforeEach(async () => repo.persistPolicy(organizationalAuthorityPolicyV1(now, 'correlation')));
const graph = (identity: string) =>
	buildGraphVersionV1({
		version: 1,
		tenant_id: 'tenant:1',
		company_id: 'company:1',
		policy_id: 'OAG_AUTHORITY_POLICY_V1',
		state_references: [semanticReferenceV1('ROOT', identity, { identity })],
		effective_from: now,
		correlation_id: 'correlation',
		causal_references: [],
	});
describe('OAG-CAN-WU1 actual D1', () => {
	it('rebuilds losslessly and persists immutable V2 without retroactive V1 semantics', async () => {
		const before = await db
			.prepare("SELECT * FROM oag_can_policies WHERE policy_id='OAG_AUTHORITY_POLICY_V1'")
			.first<Record<string, unknown>>();
		expect(before).toMatchObject({
			version: 1,
			policy_version: 1,
			proof_validity_rule: 'EARLIEST_SOURCE_VALIDITY_AND_CURRENT_STATE',
			max_delegation_depth: 1,
			graph_supersession_rule: 'NO_GRANDFATHERING',
			max_effective_authority_proof_lifetime_seconds: null,
			supersedes_policy_id: null,
		});
		await repo.persistPolicyV2(organizationalAuthorityPolicyV2(now, 'v2-correlation'));
		const rows = await db
			.prepare(
				'SELECT policy_id,version,policy_version,max_effective_authority_proof_lifetime_seconds,supersedes_policy_id FROM oag_can_policies ORDER BY version',
			)
			.all();
		expect(rows.results).toEqual([
			{
				policy_id: 'OAG_AUTHORITY_POLICY_V1',
				version: 1,
				policy_version: 1,
				max_effective_authority_proof_lifetime_seconds: null,
				supersedes_policy_id: null,
			},
			{
				policy_id: 'OAG_AUTHORITY_POLICY_V2',
				version: 2,
				policy_version: 2,
				max_effective_authority_proof_lifetime_seconds: 3600,
				supersedes_policy_id: 'OAG_AUTHORITY_POLICY_V1',
			},
		]);
		await expect(db.prepare("UPDATE oag_can_policies SET version=2 WHERE policy_id='OAG_AUTHORITY_POLICY_V1'").run()).rejects.toThrow(
			/OAG_CAN_IMMUTABLE/,
		);
		expect((await db.prepare('PRAGMA foreign_key_check').all()).results).toHaveLength(0);
	});
	it('creates a policy-sensitive V2 graph and supersedes V1 without changing source references', async () => {
		await repo.persistPolicyV2(organizationalAuthorityPolicyV2(now, 'v2-correlation'));
		const ref = semanticReferenceV1('ROOT', 'root:stable', { stable: true }),
			v1 = buildGraphVersionV1({
				version: 1,
				tenant_id: 'tenant:1',
				company_id: 'company:1',
				policy_id: 'OAG_AUTHORITY_POLICY_V1',
				state_references: [ref],
				effective_from: now,
				correlation_id: 'v1',
				causal_references: [],
			}),
			v2 = buildGraphVersionV1({
				version: 1,
				tenant_id: 'tenant:1',
				company_id: 'company:1',
				policy_id: 'OAG_AUTHORITY_POLICY_V2',
				state_references: [ref],
				effective_from: now,
				correlation_id: 'v2',
				causal_references: [],
			});
		await repo.persistGraph(v1);
		await repo.persistGraph(v2);
		expect(v2.graph_digest).not.toBe(v1.graph_digest);
		expect(v2.state_references).toEqual(v1.state_references);
		await repo.transition('GRAPH', v1.graph_version_id, 'SUPERSEDED', now, 'v2', [v1.graph_version_id], v2.graph_version_id);
		await repo.transition(
			'POLICY',
			'OAG_AUTHORITY_POLICY_V1',
			'SUPERSEDED',
			now,
			'v2',
			['OAG_AUTHORITY_POLICY_V1'],
			'OAG_AUTHORITY_POLICY_V2',
		);
		expect((await repo.resolveCurrentGraph('tenant:1', 'company:1'))?.graph_version_id).toBe(v2.graph_version_id);
		expect(await db.prepare("SELECT policy_id FROM oag_can_policies WHERE policy_id='OAG_AUTHORITY_POLICY_V1'").first()).toBeTruthy();
	});
	it('applies normalized migration and preserves immutable records', async () => {
		const g = graph('root:1');
		await repo.persistGraph(g);
		expect((await repo.resolveCurrentGraph('tenant:1', 'company:1'))?.graph_version_id).toBe(g.graph_version_id);
		await expect(db.prepare("UPDATE oag_can_graph_versions SET graph_digest='tampered'").run()).rejects.toThrow(/OAG_CAN_IMMUTABLE/);
		await expect(db.prepare('UPDATE oag_can_policies SET max_delegation_depth=2').run()).rejects.toThrow();
	});
	it('retains historical graph and resolves its explicit successor', async () => {
		const old = graph('root:1'),
			next = graph('root:2');
		await repo.persistGraph(old);
		await repo.persistGraph(next);
		await expect(repo.resolveCurrentGraph('tenant:1', 'company:1')).rejects.toMatchObject({ code: 'OAG_CAN_GRAPH_VERSION_AMBIGUOUS' });
		await repo.transition('GRAPH', old.graph_version_id, 'SUPERSEDED', now, 'correlation', [old.graph_version_id], next.graph_version_id);
		expect((await repo.resolveCurrentGraph('tenant:1', 'company:1'))?.graph_version_id).toBe(next.graph_version_id);
		expect((await db.prepare('SELECT COUNT(*) count FROM oag_can_graph_versions').first<{ count: number }>())?.count).toBe(2);
	});
	it('persists immutable content-free audit', async () => {
		await repo.audit({
			id: 'audit:1',
			kind: 'GRAPH_VERSION_CREATED',
			subject_kind: 'GRAPH',
			subject_id: graph('root:2').graph_version_id,
			outcome: 'CREATED',
			policy_id: 'OAG_AUTHORITY_POLICY_V1',
			correlation: 'correlation',
			caused: [],
			at: now,
		});
		const row = await db.prepare('SELECT content_payload FROM oag_can_audit_events').first<{ content_payload: null }>();
		expect(row?.content_payload).toBeNull();
		await expect(db.prepare("UPDATE oag_can_audit_events SET outcome='TAMPERED'").run()).rejects.toThrow(/OAG_CAN_IMMUTABLE/);
	});
	it('persists convergent immutable proof rows', async () => {
		await repo.persistPolicyV2(organizationalAuthorityPolicyV2(now, 'v2'));
		const g = buildGraphVersionV1({
			version: 1,
			tenant_id: 'tenant:1',
			company_id: 'company:1',
			policy_id: 'OAG_AUTHORITY_POLICY_V2',
			state_references: [semanticReferenceV1('ROOT', 'root:1', { root: 1 })],
			effective_from: now,
			correlation_id: 'v2',
			causal_references: [],
		});
		await repo.persistGraph(g);
		const store = new D1EffectiveAuthorityProofStoreV1(db),
			p = {
				version: 1,
				authority_proof_id: 'proof:1',
				proof_digest: 'a'.repeat(64),
				authority_source_class: 'ORGANIZATIONAL_OPERATIONAL_AUTHORITY',
				authority_basis: 'DIRECT',
				oag_actor_id: 'actor:1',
				oag_actor_binding_id: 'binding:1',
				principal_id: 'principal:1',
				membership_id: 'membership:1',
				tenant_id: 'tenant:1',
				company_id: 'company:1',
				root_reference: 'root:1',
				responsibility_references: ['responsibility:1'],
				declaration_version_ids: ['declaration:1'],
				confirmation_chain_id: 'chain:1',
				confirmation_chain_references: ['chain:1'],
				delegation_references: [],
				graph_version: g.graph_version_id,
				graph_digest: g.graph_digest,
				policy_id: 'OAG_AUTHORITY_POLICY_V2',
				policy_version: 'OAG_AUTHORITY_POLICY_V2',
				policy_numeric_version: 2,
				effective_scope: {
					domain: 'operations',
					intents: ['EXECUTE'],
					scopes: ['OPERATE'],
					limits: [],
					team_or_subordinate_actor_ids: [],
					operational_constraints: [],
				},
				issued_at: now,
				expires_at: '2026-08-09T11:00:00.000Z',
				eligibility_state: 'ELIGIBLE',
				invalidation_reasons: [],
				correlation_id: 'c',
				causal_references: [],
			} as any;
		expect(await store.persist(p)).toBe('CREATED');
		expect(await store.persist(p)).toBe('IDENTICAL');
		await expect(db.prepare("UPDATE oag_can_authority_proofs SET proof_digest='bad'").run()).rejects.toThrow(/IMMUTABLE/);
	});
});
