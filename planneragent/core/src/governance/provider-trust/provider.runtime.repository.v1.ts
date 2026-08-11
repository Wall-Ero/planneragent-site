import { freeze, PROVIDERS } from './provider.attestation.policy.v1';
import {canonicalProviderRuntimeBindingDigestV1} from './provider.precredential.boundary.v1';
import {
	PROVIDER_RUNTIME_BINDING_POLICY_V1,
	ProviderRuntimeBindingFailureV1,
	type ProviderRuntimeBindingRequestV1,
	type ProviderRuntimeBindingSourceV1,
	type ProviderRuntimeBindingV1,
	type CanonicalProviderRuntimeBindingEvidenceV1,
} from './provider.runtime.repository.contracts.v1';
const text = (x: unknown) => typeof x === 'string' && x.length > 0;
async function hash(x: unknown) {
	return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(x))))]
		.map((v) => v.toString(16).padStart(2, '0'))
		.join('');
}
export class ProviderRuntimeBindingRuntimeV1 {
	constructor(private readonly source: ProviderRuntimeBindingSourceV1) {}
	async bind(r: ProviderRuntimeBindingRequestV1): Promise<ProviderRuntimeBindingV1> {
		let mappingId: string | undefined;
		const deny = async (code: ProviderRuntimeBindingFailureV1['code']): Promise<never> => {
			try {
				await this.source.audit({
					event_id: `provider-runtime-binding-audit:sha256:${(await hash([r?.correlation_id, code, r?.requested_at])).slice(0, 32)}`,
					event_kind: 'BINDING_DENIED',
					...(mappingId ? { mapping_id: mappingId } : {}),
					outcome: 'DENIED',
					failure_code: code,
					correlation_id: r?.correlation_id ?? 'UNKNOWN',
					recorded_at: r?.requested_at ?? new Date(0).toISOString(),
				});
			} catch {
				throw new ProviderRuntimeBindingFailureV1('PROVIDER_RUNTIME_BINDING_AUDIT_FAILED');
			}
			throw new ProviderRuntimeBindingFailureV1(code);
		};
		if (
			!r ||
			r.version !== 1 ||
			!PROVIDERS.includes(r.provider) ||
			!text(r.selected_model) ||
			!text(r.requested_at) ||
			!text(r.correlation_id) ||
			!Array.isArray(r.causal_references)
		)
			return deny(
				!PROVIDERS.includes(r?.provider) ? 'PROVIDER_RUNTIME_BINDING_PROVIDER_UNKNOWN' : 'PROVIDER_RUNTIME_BINDING_REQUEST_INVALID',
			);
		const mappings = (await this.source.findMappings(r)).filter(
			(x) => x.effective_at <= r.requested_at && (!x.expires_at || x.expires_at > r.requested_at) && x.selected_model === r.selected_model,
		);
		if (!mappings.length) return deny('PROVIDER_RUNTIME_BINDING_ACCOUNT_REQUIRED');
		if (mappings.length !== 1) return deny('PROVIDER_RUNTIME_BINDING_ACCOUNT_AMBIGUOUS');
		const m = mappings[0]!;
		mappingId = m.mapping_id;
		if (await this.source.isTransitioned(m.mapping_id)) return deny('PROVIDER_RUNTIME_BINDING_STALE');
		const a = await this.source.readAccount(m.provider_account_id);
		if (!a) return deny('PROVIDER_RUNTIME_BINDING_ACCOUNT_INVALID');
		if ((await this.source.isTransitioned(a.provider_account_id)) || (a.reverify_at && a.reverify_at <= r.requested_at))
			return deny('PROVIDER_RUNTIME_BINDING_STALE');
		if (a.provider !== r.provider) return deny('PROVIDER_RUNTIME_BINDING_ACCOUNT_SUBSTITUTED');
		if (a.environment_class !== r.environment_class || a.adapter_identity !== m.adapter_identity)
			return deny('PROVIDER_RUNTIME_BINDING_ADAPTER_INVALID');
		const d = await this.source.readDeployment(m.provider_deployment_id);
		if (!d) return deny('PROVIDER_RUNTIME_BINDING_DEPLOYMENT_REQUIRED');
		if ((await this.source.isTransitioned(d.provider_deployment_id)) || (d.reverify_at && d.reverify_at <= r.requested_at))
			return deny('PROVIDER_RUNTIME_BINDING_STALE');
		if (d.provider_account_id !== a.provider_account_id) return deny('PROVIDER_RUNTIME_BINDING_DEPLOYMENT_SUBSTITUTED');
		if (!d.model_references.includes(r.selected_model)) return deny('PROVIDER_RUNTIME_BINDING_MODEL_MISMATCH');
		if (r.provider === 'oss' && m.credential_reference !== 'NOT_APPLICABLE')
			return deny('PROVIDER_RUNTIME_BINDING_CREDENTIAL_REFERENCE_INVALID');
		if (r.provider !== 'oss' && (m.credential_reference === 'NOT_APPLICABLE' || !/^secret:\/\//.test(m.credential_reference)))
			return deny('PROVIDER_RUNTIME_BINDING_CREDENTIAL_REFERENCE_REQUIRED');
		if (
			m.credential_reference !== 'NOT_APPLICABLE' &&
			!(await this.source.credentialReferenceIsCurrent(a.provider_account_id, d.provider_deployment_id, m.credential_reference))
		)
			return deny('PROVIDER_RUNTIME_BINDING_CREDENTIAL_SUBSTITUTED');
		const subject = {
			mapping_id: m.mapping_id,
			provider: r.provider,
			provider_account_id: a.provider_account_id,
			provider_deployment_id: d.provider_deployment_id,
			adapter_identity: a.adapter_identity,
			selected_model: r.selected_model,
			credential_reference: m.credential_reference,
			environment_class: a.environment_class,
			binding_policy_version: PROVIDER_RUNTIME_BINDING_POLICY_V1,
		};
		const binding = freeze({
			version: 1,
			binding_id: `provider-runtime-binding:sha256:${(await hash(subject)).slice(0, 32)}`,
			...subject,
			downstream_provider_identity_status: r.provider === 'openrouter' ? 'UNKNOWN' : 'PROVEN',
			downstream_deployment_identity_status: r.provider === 'openrouter' ? 'UNKNOWN' : 'PROVEN',
			issued_at: r.requested_at,
			correlation_id: r.correlation_id,
			causal_references: [...r.causal_references, m.mapping_id, a.provider_account_id, d.provider_deployment_id],
			admission_granted: false,
			transport_executed: false,
		}) as ProviderRuntimeBindingV1;
		const evidence = freeze({version:1,binding,binding_digest:await canonicalProviderRuntimeBindingDigestV1(binding)}) as CanonicalProviderRuntimeBindingEvidenceV1;
		try{await this.source.persistBinding(evidence);}catch(error){if(error instanceof ProviderRuntimeBindingFailureV1)throw error;throw new ProviderRuntimeBindingFailureV1('PROVIDER_RUNTIME_BINDING_PERSISTENCE_FAILED');}
		try {
			await this.source.audit({
				event_id: `audit:${binding.binding_id}`,
				event_kind: 'RUNTIME_IDENTITY_BOUND',
				mapping_id: m.mapping_id,
				binding_id: binding.binding_id,
				outcome: 'BOUND',
				correlation_id: r.correlation_id,
				recorded_at: r.requested_at,
			});
		} catch {
			throw new ProviderRuntimeBindingFailureV1('PROVIDER_RUNTIME_BINDING_AUDIT_FAILED');
		}
		return binding;
	}
}
