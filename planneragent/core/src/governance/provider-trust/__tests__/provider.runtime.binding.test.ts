import { describe, expect, it, vi } from 'vitest';
import {
	ProviderRuntimeBindingRuntimeV1,
	type ProviderRuntimeBindingRequestV1,
	type ProviderRuntimeBindingSourceV1,
	type ProviderRuntimeMappingV1,
} from '..';
import type { ProviderAccountIdentityV1, ProviderDeploymentIdentityV1 } from '..';
const NOW = '2026-08-09T10:00:00.000Z',
	LATER = '2027-01-01T00:00:00.000Z';
function account(provider: any = 'openai'): ProviderAccountIdentityV1 {
	return {
		version: 1,
		provider_account_id: `account:${provider}`,
		canonical_key: `${provider}:owner:account:PRODUCTION`,
		provider,
		account_reference: 'account',
		account_owner_reference: 'owner',
		adapter_identity: `sandbox.llm.${provider}`,
		environment_class: 'PRODUCTION',
		effective_at: NOW,
		verification_status: 'VERIFIED',
		verification_method: 'GOVERNED_MANUAL_REVIEW',
		evidence_references: ['e'],
		verified_at: NOW,
		reverify_at: LATER,
		claim_id: 'claim',
		decision_id: 'decision',
		correlation_id: 'c',
		causal_references: [],
	};
}
function deployment(provider: any = 'openai', model = 'model-1'): ProviderDeploymentIdentityV1 {
	return {
		version: 1,
		provider_deployment_id: `deployment:${provider}`,
		provider_account_id: `account:${provider}`,
		deployment_reference: 'deployment',
		deployment_class: provider === 'oss' ? 'LOCAL_SELF_HOSTED_MODEL' : 'SHARED_REMOTE_PROVIDER',
		model_references: [model],
		processing_service_identity: provider,
		verified_regions: [],
		...(provider === 'oss' ? {} : { credential_reference: `secret://providers/${provider}` }),
		effective_at: NOW,
		verification_status: 'VERIFIED',
		evidence_references: ['e'],
		verified_at: NOW,
		reverify_at: LATER,
		correlation_id: 'c',
		causal_references: [],
	};
}
function mapping(provider: any = 'openai', model = 'model-1'): ProviderRuntimeMappingV1 {
	return {
		version: 1,
		mapping_id: `mapping:${provider}`,
		provider,
		selected_model: model,
		provider_account_id: `account:${provider}`,
		provider_deployment_id: `deployment:${provider}`,
		adapter_identity: `sandbox.llm.${provider}`,
		credential_reference: provider === 'oss' ? 'NOT_APPLICABLE' : `secret://providers/${provider}`,
		environment_class: 'PRODUCTION',
		effective_at: NOW,
		correlation_id: 'c',
		causal_references: [],
	};
}
function request(provider: any = 'openai', model = 'model-1'): ProviderRuntimeBindingRequestV1 {
	return {
		version: 1,
		provider,
		selected_model: model,
		environment_class: 'PRODUCTION',
		requested_at: '2026-08-09T10:01:00.000Z',
		correlation_id: 'c',
		causal_references: ['selection:1'],
	};
}
function source(provider: any = 'openai', model = 'model-1') {
	const m = mapping(provider, model),
		a = account(provider),
		d = deployment(provider, model),
		audit = vi.fn();
	const s: ProviderRuntimeBindingSourceV1 = {
		findMappings: async () => [m],
		readAccount: async () => a,
		readDeployment: async () => d,
		credentialReferenceIsCurrent: async () => true,
		isTransitioned: async () => false,
		audit,
	};
	return { s, m, a, d, audit };
}
const fails = async (p: Promise<unknown>, code: string) => expect(p).rejects.toMatchObject({ code });
describe('PT-WU3A runtime provider binding', () => {
	for (const provider of ['openai', 'anthropic', 'openrouter'] as const)
		it(`binds exact ${provider} account, deployment, adapter, model and credential reference`, async () => {
			const x = source(provider),
				b = await new ProviderRuntimeBindingRuntimeV1(x.s).bind(request(provider));
			expect(b).toMatchObject({
				provider,
				provider_account_id: `account:${provider}`,
				provider_deployment_id: `deployment:${provider}`,
				adapter_identity: `sandbox.llm.${provider}`,
				credential_reference: `secret://providers/${provider}`,
				admission_granted: false,
				transport_executed: false,
			});
			expect(Object.isFrozen(b) && Object.isFrozen(b.causal_references)).toBe(true);
			expect(JSON.stringify(b)).not.toMatch(/api[_-]?key|prompt|response/i);
		});
	it('preserves unknown OpenRouter downstream identities', async () => {
		const x = source('openrouter'),
			b = await new ProviderRuntimeBindingRuntimeV1(x.s).bind(request('openrouter'));
		expect(b).toMatchObject({
			downstream_provider_identity_status: 'UNKNOWN',
			downstream_deployment_identity_status: 'UNKNOWN',
			selected_model: 'model-1',
		});
	});
	it('represents local OSS without a fake secret or trust bypass', async () => {
		const x = source('oss'),
			b = await new ProviderRuntimeBindingRuntimeV1(x.s).bind(request('oss'));
		expect(b).toMatchObject({ credential_reference: 'NOT_APPLICABLE', admission_granted: false });
	});
	it('fails closed for unknown, missing and ambiguous mappings', async () => {
		let x = source();
		await fails(new ProviderRuntimeBindingRuntimeV1(x.s).bind(request('bogus' as any)), 'PROVIDER_RUNTIME_BINDING_PROVIDER_UNKNOWN');
		x = source();
		x.s.findMappings = async () => [];
		await fails(new ProviderRuntimeBindingRuntimeV1(x.s).bind(request()), 'PROVIDER_RUNTIME_BINDING_ACCOUNT_REQUIRED');
		x = source();
		x.s.findMappings = async () => [x.m, { ...x.m, mapping_id: 'mapping:2' }];
		await fails(new ProviderRuntimeBindingRuntimeV1(x.s).bind(request()), 'PROVIDER_RUNTIME_BINDING_ACCOUNT_AMBIGUOUS');
	});
	it('denies stale mappings, accounts and deployments', async () => {
		for (const id of ['mapping:openai', 'account:openai', 'deployment:openai']) {
			const x = source();
			x.s.isTransitioned = async (value) => value === id;
			await fails(new ProviderRuntimeBindingRuntimeV1(x.s).bind(request()), 'PROVIDER_RUNTIME_BINDING_STALE');
		}
	});
	it('denies account, deployment, adapter, model and credential substitutions', async () => {
		let x = source();
		x.s.readAccount = async () => ({ ...x.a, provider: 'anthropic' });
		await fails(new ProviderRuntimeBindingRuntimeV1(x.s).bind(request()), 'PROVIDER_RUNTIME_BINDING_ACCOUNT_SUBSTITUTED');
		x = source();
		x.s.readDeployment = async () => ({ ...x.d, provider_account_id: 'other' });
		await fails(new ProviderRuntimeBindingRuntimeV1(x.s).bind(request()), 'PROVIDER_RUNTIME_BINDING_DEPLOYMENT_SUBSTITUTED');
		x = source();
		x.s.readAccount = async () => ({ ...x.a, adapter_identity: 'other' });
		await fails(new ProviderRuntimeBindingRuntimeV1(x.s).bind(request()), 'PROVIDER_RUNTIME_BINDING_ADAPTER_INVALID');
		x = source();
		x.s.readDeployment = async () => ({ ...x.d, model_references: ['other'] });
		await fails(new ProviderRuntimeBindingRuntimeV1(x.s).bind(request()), 'PROVIDER_RUNTIME_BINDING_MODEL_MISMATCH');
		x = source();
		x.s.credentialReferenceIsCurrent = async () => false;
		await fails(new ProviderRuntimeBindingRuntimeV1(x.s).bind(request()), 'PROVIDER_RUNTIME_BINDING_CREDENTIAL_SUBSTITUTED');
	});
	it('does not select, dispatch, evaluate policy, or resolve a secret', async () => {
		const x = source(),
			b = await new ProviderRuntimeBindingRuntimeV1(x.s).bind(request());
		expect(b.provider).toBe('openai');
		expect(x.audit).toHaveBeenCalledTimes(1);
		expect(Object.keys(x.s)).not.toContain('fetch');
		expect(JSON.stringify(b)).not.toContain('secret-value');
	});
});
