import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import pt from '../../../../migrations/0023_provider_account_attestation.sql?raw';
import binding from '../../../../migrations/0025_provider_runtime_binding.sql?raw';
import {
	ProviderAttestationD1V1,
	ProviderRuntimeBindingD1V1,
	ProviderRuntimeBindingRuntimeV1,
	type ProviderRuntimeMappingV1,
	verifyProviderFactsV1,
} from '..';
import { fixture, NOW } from './provider.attestation.runtime.test';
const db = env.POLICIES_DB,
	attest = new ProviderAttestationD1V1(db),
	repo = new ProviderRuntimeBindingD1V1(db);
function queries(sql: string) {
	return sql
		.split(/;\s*(?=CREATE)/)
		.map((x) => x.trim())
		.filter(Boolean)
		.map((x) => (x.endsWith(';') ? x : `${x};`));
}
let mapping: ProviderRuntimeMappingV1;
beforeAll(async () => {
	await applyD1Migrations(db, [
		{ name: '0023', queries: queries(pt) },
		{ name: '0025', queries: queries(binding) },
	]);
	const r = await fixture(),
		f = await verifyProviderFactsV1(r, NOW);
	await attest.persist(r, f);
	await attest.bindCredential({
		binding_id: 'runtime-credential',
		provider_account_id: f.account.provider_account_id,
		provider_deployment_id: f.deployment!.provider_deployment_id,
		credential_reference: 'secret://providers/openrouter',
		bound_at: NOW,
		evidence_reference: 'configuration:1',
		correlation_id: 'c',
		causal_references: [],
	});
	mapping = {
		version: 1,
		mapping_id: 'runtime-mapping:openrouter',
		provider: 'openrouter',
		selected_model: 'openai/gpt-4o-mini',
		provider_account_id: f.account.provider_account_id,
		provider_deployment_id: f.deployment!.provider_deployment_id,
		adapter_identity: f.account.adapter_identity,
		credential_reference: 'secret://providers/openrouter',
		environment_class: 'PRODUCTION',
		effective_at: NOW,
		correlation_id: 'c',
		causal_references: [f.account.provider_account_id],
	};
	await repo.persistMapping(mapping);
});
describe('PT-WU3A actual D1', () => {
	it('applies migration and resolves one immutable content-free binding', async () => {
		const out = await new ProviderRuntimeBindingRuntimeV1(repo).bind({
			version: 1,
			provider: 'openrouter',
			selected_model: 'openai/gpt-4o-mini',
			environment_class: 'PRODUCTION',
			requested_at: '2026-08-09T10:01:00.000Z',
			correlation_id: 'c1',
			causal_references: [],
		});
		expect(out).toMatchObject({
			mapping_id: mapping.mapping_id,
			provider_account_id: mapping.provider_account_id,
			provider_deployment_id: mapping.provider_deployment_id,
			transport_executed: false,
		});
		expect(JSON.stringify(out)).not.toMatch(/api[_-]?key|prompt|provider response/i);
	});
	it('keeps mapping and audit immutable', async () => {
		await expect(db.prepare("UPDATE provider_runtime_mappings SET selected_model='x'").run()).rejects.toThrow(/IMMUTABLE/);
		await expect(db.prepare("UPDATE provider_runtime_binding_audit_events SET outcome='x'").run()).rejects.toThrow(/IMMUTABLE/);
	});
	it('denies an immutable stale mapping', async () => {
		await repo.transition(mapping.mapping_id, 'SUPERSEDED', 'replacement:1', '2026-08-09T10:02:00.000Z', 'c2');
		await expect(
			new ProviderRuntimeBindingRuntimeV1(repo).bind({
				version: 1,
				provider: 'openrouter',
				selected_model: mapping.selected_model,
				environment_class: 'PRODUCTION',
				requested_at: '2026-08-09T10:03:00.000Z',
				correlation_id: 'c2',
				causal_references: [],
			}),
		).rejects.toMatchObject({ code: 'PROVIDER_RUNTIME_BINDING_STALE' });
		await expect(db.prepare("UPDATE provider_runtime_mapping_transitions SET status='REVOKED'").run()).rejects.toThrow(/IMMUTABLE/);
	});
	it('persists content-free audit only', async () => {
		const rows = JSON.stringify((await db.prepare('SELECT * FROM provider_runtime_binding_audit_events').all()).results);
		expect(rows).not.toMatch(/secret:\/\/|api[_-]?key|prompt|projection|provider response/i);
	});
});
