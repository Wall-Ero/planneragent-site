import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import migration from '../../../../migrations/0026_runtime_provider_trust_admission.sql?raw';
import { RuntimeProviderTrustAdmissionD1V1, type RuntimeProviderTrustAdmissionV1 } from '..';
const db = env.POLICIES_DB,
	repo = new RuntimeProviderTrustAdmissionD1V1(db),
	NOW = '2026-08-09T10:00:00.000Z';
function queries(sql: string) {
	return sql
		.split(/;\s*(?=CREATE)/)
		.map((x) => x.trim())
		.filter(Boolean)
		.map((x) => (x.endsWith(';') ? x : `${x};`));
}
function admission(): RuntimeProviderTrustAdmissionV1 {
	return {
		version: 1,
		admission_id: 'admission:1',
		admission_digest: 'a'.repeat(64),
		tenant_id: 'tenant',
		company_id: 'company',
		legal_entity_id: 'le',
		oks_decision_id: 'oks:d',
		oks_binding_id: 'oks:b',
		oks_consumption_id: 'oks:c',
		manifest_id: 'manifest@1',
		projection_digest: 'projection',
		effective_context: {
			purpose: 'LANGUAGE_REFINEMENT',
			classification: 'CONFIDENTIAL',
			sovereignty: 'EU_ONLY',
			target_class: 'SHARED_REMOTE_PROVIDER',
			processing_regions: ['EU'],
			retention: 'NO_RETENTION',
			deployment_class: 'SHARED_REMOTE_PROVIDER',
		},
		provider_trust_eligibility_id: 'pt:e',
		evaluation_id: 'evaluation',
		evaluation_digest: 'evaluation-digest',
		policy_ids: ['policy'],
		policy_versions: [1],
		policy_digest: 'policy-digest',
		attestation_set_digest: 'set',
		runtime_binding_id: 'runtime-binding',
		runtime_binding_digest: 'binding-digest',
		provider: 'openai',
		provider_account_id: 'account',
		provider_deployment_id: 'deployment',
		adapter_identity: 'adapter',
		selected_model: 'model',
		credential_reference: 'secret://providers/openai',
		issued_at: NOW,
		expires_at: '2026-08-09T10:00:10.000Z',
		reservation_id: 'reservation:1',
		invocation_consumer: 'COGNITIVE_PROVIDER_INVOCATION',
		correlation_id: 'c',
		causal_references: ['oks:c', 'pt:e', 'runtime-binding'],
		transport_executed: false,
	};
}
beforeAll(() => applyD1Migrations(db, [{ name: '0026', queries: queries(migration) }]));
describe('PT-WU3C actual D1', () => {
	it('applies migration and persists immutable normalized admission', async () => {
		await repo.persistAdmission(admission());
		const row = await db.prepare('SELECT * FROM runtime_provider_trust_admissions').first<any>();
		expect(row).toMatchObject({ admission_id: 'admission:1', transport_executed: 0, provider_account_id: 'account' });
		await expect(db.prepare("UPDATE runtime_provider_trust_admissions SET provider='x'").run()).rejects.toThrow(/IMMUTABLE/);
	});
	it('atomically permits exactly one concurrent consumer', async () => {
		await repo.persistAdmission(admission());
		const results = await Promise.all([
			repo.reserve(admission(), 'COGNITIVE_PROVIDER_INVOCATION', NOW),
			repo.reserve(admission(), 'COGNITIVE_PROVIDER_INVOCATION', NOW),
		]);
		expect(results.filter(Boolean)).toHaveLength(1);
		expect((await db.prepare('SELECT COUNT(*) n FROM runtime_provider_trust_reservations').first<{ n: number }>())?.n).toBe(1);
	});
	it('makes reservation and audit immutable', async () => {
		await repo.persistAdmission(admission());
		await repo.reserve(admission(), 'COGNITIVE_PROVIDER_INVOCATION', NOW);
		await expect(db.prepare("UPDATE runtime_provider_trust_reservations SET invocation_consumer='x'").run()).rejects.toThrow(/IMMUTABLE/);
		await expect(db.prepare('DELETE FROM runtime_provider_trust_audit_events').run()).rejects.toThrow(/IMMUTABLE/);
	});
	it('persists immutable typed denial evidence', async () => {
		await repo.persistDenial({
			denial_id: 'denial:1',
			failure_code: 'RUNTIME_PROVIDER_TRUST_POLICY_STALE',
			correlation_id: 'c',
			recorded_at: NOW,
			causal_references: [],
		});
		expect(await db.prepare('SELECT failure_code FROM runtime_provider_trust_denials').first()).toEqual({
			failure_code: 'RUNTIME_PROVIDER_TRUST_POLICY_STALE',
		});
		await expect(db.prepare("UPDATE runtime_provider_trust_denials SET failure_code='x'").run()).rejects.toThrow(/IMMUTABLE/);
	});
	it('keeps admission, denial and audit persistence content-free', async () => {
		const rows =
			JSON.stringify((await db.prepare('SELECT * FROM runtime_provider_trust_admissions').all()).results) +
			JSON.stringify((await db.prepare('SELECT * FROM runtime_provider_trust_denials').all()).results) +
			JSON.stringify((await db.prepare('SELECT * FROM runtime_provider_trust_audit_events').all()).results);
		expect(rows).not.toMatch(/secret-value|prompt|projection_content|provider_response|authorization_header/i);
	});
});
