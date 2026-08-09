import { freeze } from './provider.attestation.policy.v1';
import {
	ProviderRuntimeBindingFailureV1,
	type ProviderRuntimeBindingRequestV1,
	type ProviderRuntimeBindingSourceV1,
	type ProviderRuntimeMappingV1,
} from './provider.runtime.binding.contracts.v1';
import type { ProviderAccountIdentityV1, ProviderDeploymentIdentityV1 } from './provider.account.contracts.v1';
const parse = (x: string) => Object.freeze(JSON.parse(x));
export class ProviderRuntimeBindingD1V1 implements ProviderRuntimeBindingSourceV1 {
	constructor(private readonly db: D1Database) {}
	async persistMapping(m: ProviderRuntimeMappingV1) {
		try {
			await this.db
				.prepare('INSERT INTO provider_runtime_mappings VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
				.bind(
					m.mapping_id,
					1,
					m.provider,
					m.selected_model,
					m.provider_account_id,
					m.provider_deployment_id,
					m.adapter_identity,
					m.credential_reference,
					m.environment_class,
					m.effective_at,
					m.expires_at ?? null,
					m.correlation_id,
					JSON.stringify(m.causal_references),
					'PROVIDER_RUNTIME_BINDING_POLICY_V1',
				)
				.run();
		} catch {
			throw new ProviderRuntimeBindingFailureV1('PROVIDER_RUNTIME_BINDING_PERSISTENCE_FAILED');
		}
	}
	async transition(mappingId: string, status: 'EXPIRED' | 'REVOKED' | 'SUPERSEDED', reference: string, at: string, correlation: string) {
		try {
			await this.db
				.prepare('INSERT INTO provider_runtime_mapping_transitions VALUES (?,?,?,?,?,?)')
				.bind(`transition:${reference}`, mappingId, status, reference, at, correlation)
				.run();
		} catch {
			throw new ProviderRuntimeBindingFailureV1('PROVIDER_RUNTIME_BINDING_PERSISTENCE_FAILED');
		}
	}
	async findMappings(r: ProviderRuntimeBindingRequestV1) {
		const x = await this.db
			.prepare('SELECT * FROM provider_runtime_mappings WHERE provider=? AND selected_model=? AND environment_class=? ORDER BY mapping_id')
			.bind(r.provider, r.selected_model, r.environment_class)
			.all<any>();
		return Object.freeze(
			x.results.map(
				(row) =>
					freeze({
						version: 1,
						mapping_id: row.mapping_id,
						provider: row.provider,
						selected_model: row.selected_model,
						provider_account_id: row.provider_account_id,
						provider_deployment_id: row.provider_deployment_id,
						adapter_identity: row.adapter_identity,
						credential_reference: row.credential_reference,
						environment_class: row.environment_class,
						effective_at: row.effective_at,
						...(row.expires_at ? { expires_at: row.expires_at } : {}),
						correlation_id: row.correlation_id,
						causal_references: parse(row.causal_references_json),
					}) as ProviderRuntimeMappingV1,
			),
		);
	}
	async readAccount(id: string): Promise<ProviderAccountIdentityV1 | null> {
		const a = await this.db
			.prepare(
				'SELECT a.*,c.evidence_references_json FROM provider_account_identities a JOIN provider_account_claims c ON c.claim_id=a.claim_id WHERE a.provider_account_id=?',
			)
			.bind(id)
			.first<any>();
		return a
			? (freeze({
					version: 1,
					provider_account_id: a.provider_account_id,
					canonical_key: a.canonical_key,
					provider: a.provider,
					account_reference: a.account_reference,
					account_owner_reference: a.account_owner_reference,
					adapter_identity: a.adapter_identity,
					environment_class: a.environment_class,
					effective_at: a.effective_at,
					verification_status: 'VERIFIED',
					verification_method: 'GOVERNED_MANUAL_REVIEW',
					evidence_references: parse(a.evidence_references_json),
					verified_at: a.verified_at,
					...(a.reverify_at ? { reverify_at: a.reverify_at } : {}),
					claim_id: a.claim_id,
					decision_id: a.decision_id,
					correlation_id: a.correlation_id,
					causal_references: parse(a.causal_references_json),
				}) as ProviderAccountIdentityV1)
			: null;
	}
	async readDeployment(id: string): Promise<ProviderDeploymentIdentityV1 | null> {
		const d = await this.db.prepare('SELECT * FROM provider_deployment_identities WHERE provider_deployment_id=?').bind(id).first<any>();
		return d
			? (freeze({
					version: 1,
					provider_deployment_id: d.provider_deployment_id,
					provider_account_id: d.provider_account_id,
					deployment_reference: d.deployment_reference,
					deployment_class: d.deployment_class,
					model_references: parse(d.model_references_json),
					processing_service_identity: d.processing_service_identity,
					verified_regions: parse(d.verified_regions_json),
					...(d.credential_reference ? { credential_reference: d.credential_reference } : {}),
					effective_at: d.effective_at,
					verification_status: 'VERIFIED',
					evidence_references: parse(d.evidence_references_json),
					verified_at: d.verified_at,
					...(d.reverify_at ? { reverify_at: d.reverify_at } : {}),
					correlation_id: d.correlation_id,
					causal_references: parse(d.causal_references_json),
				}) as ProviderDeploymentIdentityV1)
			: null;
	}
	async credentialReferenceIsCurrent(a: string, d: string, r: string) {
		const x = await this.db
			.prepare(
				'SELECT binding_id FROM provider_credential_bindings WHERE provider_account_id=? AND provider_deployment_id=? AND credential_reference=?',
			)
			.bind(a, d, r)
			.first();
		return !!x;
	}
	async isTransitioned(id: string) {
		const x = await this.db
			.prepare(
				'SELECT transition_id FROM provider_attestation_transitions WHERE subject_id=? UNION ALL SELECT transition_id FROM provider_runtime_mapping_transitions WHERE mapping_id=? LIMIT 1',
			)
			.bind(id, id)
			.first();
		return !!x;
	}
	async audit(e: Parameters<ProviderRuntimeBindingSourceV1['audit']>[0]) {
		try {
			await this.db
				.prepare('INSERT INTO provider_runtime_binding_audit_events VALUES (?,?,?,?,?,?,?,?)')
				.bind(
					e.event_id,
					e.event_kind,
					e.mapping_id ?? null,
					e.binding_id ?? null,
					e.outcome,
					e.failure_code ?? null,
					e.correlation_id,
					e.recorded_at,
				)
				.run();
		} catch {
			throw new ProviderRuntimeBindingFailureV1('PROVIDER_RUNTIME_BINDING_AUDIT_FAILED');
		}
	}
}
