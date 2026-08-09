import { describe, expect, it, vi } from 'vitest';
import {
	DeferredProviderCredentialResolverV1,
	ProviderBoundaryFailureV1,
	providerRuntimeCausalReferenceV1,
	verifyProviderRuntimeCausalReferenceV1,
	type PreparedProviderCandidateV1,
	type ProviderRuntimeBindingReferenceV1,
} from '..';
import { executeWithLlmProviders } from '../../../sandbox/llm/executeWithLlmProviders';
import { createOpenRouterProvider } from '../../../sandbox/llm/providers/openrouter';
import type { LlmProvider } from '../../../sandbox/llm/types';
function binding(provider: string, credential = `secret://providers/${provider}`): ProviderRuntimeBindingReferenceV1 {
	return Object.freeze({
		version: 1,
		binding_id: `binding:${provider}`,
		mapping_id: `mapping:${provider}`,
		provider_identity: provider,
		provider_account_id: `account:${provider}`,
		provider_deployment_id: `deployment:${provider}`,
		adapter_identity: `adapter:${provider}`,
		selected_model: `model:${provider}`,
		credential_reference: credential,
	});
}
function ready(provider: string, credential?: string): PreparedProviderCandidateV1 {
	const b = binding(provider, credential);
	return Object.freeze({
		outcome: 'READY',
		binding_reference: b,
		credential_resolution_permit: Object.freeze({
			version: 1,
			...b,
			consumer: 'PROVIDER_CREDENTIAL_RESOLVER',
			authorization_reference: `future-admission-seam:${provider}`,
		}),
		causal_reference: providerRuntimeCausalReferenceV1({ binding_id: b.binding_id, binding_digest: `digest:${provider}` }),
	});
}
function input(ids: string[]) {
	return {
		companyId: 'company',
		requestId: 'request',
		mode: 'advise' as const,
		sealedExposures: ids.map((id) => ({ provider: id, model: `model:${id}` }) as any),
		providers: ids.map((id, i) => ({ id, allowedFor: ['SENIOR' as const], priority: i, costType: 'paid' as const, estimatedCostEur: 1 })),
	};
}
function remote(id: string, run: (x: any) => Promise<any>): LlmProvider {
	return { id, remote: true, isFree: false, quality: 'high', generateScenarios: run };
}
describe('PT-WU3B pre-credential provider boundary', () => {
	for (const provider of ['openai', 'anthropic', 'openrouter'])
		it(`prepares ${provider} binding before any credential read`, async () => {
			const events: string[] = [],
				resolver = new DeferredProviderCredentialResolverV1({
					[`secret://providers/${provider}`]: () => {
						events.push('secret');
						return 'secret-value';
					},
				}),
				map = {
					[provider]: remote(provider, async (x) => {
						events.push('wrapper');
						await x.credential_resolver.resolve(x.runtime_context.binding_reference, x.runtime_context.credential_resolution_permit);
						return { scenarios: [] };
					}),
				};
			await executeWithLlmProviders(
				{
					...input([provider]),
					prepareProviderCandidate: async () => {
						events.push('binding');
						return ready(provider);
					},
					credentialResolver: resolver,
				},
				map,
			);
			expect(events).toEqual(['binding', 'wrapper', 'secret']);
		});
	it('keeps candidates and pre-admission structures secret-free', () => {
		const x = ready('openai');
		expect(x.binding_reference.credential_reference).toBe('secret://providers/openai');
		expect(JSON.stringify(x)).not.toContain('secret-value');
		expect(Object.isFrozen(x)).toBe(true);
	});
	it('requires a permit and denies every bound substitution before lookup', async () => {
		const get = vi.fn(() => 'secret-value'),
			resolver = new DeferredProviderCredentialResolverV1({ 'secret://providers/openai': get }),
			x = ready('openai');
		await expect(resolver.resolve(x.binding_reference, undefined as any)).rejects.toMatchObject({ category: 'GOVERNANCE_DENIAL' });
		for (const field of [
			'binding_id',
			'provider_identity',
			'provider_account_id',
			'provider_deployment_id',
			'adapter_identity',
			'credential_reference',
		] as const)
			await expect(resolver.resolve(x.binding_reference, { ...x.credential_resolution_permit, [field]: 'other' })).rejects.toMatchObject({
				code: 'PROVIDER_CREDENTIAL_REFERENCE_SUBSTITUTED',
			});
		expect(get).not.toHaveBeenCalled();
	});
	it('resolves an environment-backed secret only downstream of the seam', async () => {
		const get = vi.fn(() => 'secret-value'),
			resolver = new DeferredProviderCredentialResolverV1({ 'secret://providers/openai': get }),
			x = ready('openai');
		expect(await resolver.resolve(x.binding_reference, x.credential_resolution_permit)).toBe('secret-value');
		expect(get).toHaveBeenCalledOnce();
		expect(JSON.stringify(x)).not.toContain('secret-value');
	});
	it('represents credentialless local execution without a fake secret', async () => {
		const resolver = new DeferredProviderCredentialResolverV1({}),
			x = ready('future-local', 'NOT_APPLICABLE');
		expect(await resolver.resolve(x.binding_reference, x.credential_resolution_permit)).toBeUndefined();
	});
	it('makes governance denial non-fallback and prevents B secret or dispatch', async () => {
		const b = vi.fn(),
			resolver = new DeferredProviderCredentialResolverV1({ 'secret://providers/b': b });
		const map = { a: remote('a', vi.fn()), b: remote('b', vi.fn()) };
		await expect(
			executeWithLlmProviders(
				{
					...input(['a', 'b']),
					prepareProviderCandidate: async ({ provider_identity }) =>
						provider_identity === 'a' ? { outcome: 'GOVERNANCE_DENIED', failure_code: 'FUTURE_PT_DENIED' } : ready('b'),
					credentialResolver: resolver,
				},
				map,
			),
		).rejects.toMatchObject({ category: 'GOVERNANCE_DENIAL', code: 'FUTURE_PT_DENIED' });
		expect(map.a.generateScenarios).not.toHaveBeenCalled();
		expect(map.b.generateScenarios).not.toHaveBeenCalled();
		expect(b).not.toHaveBeenCalled();
	});
	it('retains technical fallback with an independent binding B', async () => {
		const seen: string[] = [],
			map = {
				a: remote('a', async (x) => {
					seen.push(x.runtime_context.binding_reference.binding_id);
					throw new Error('timeout');
				}),
				b: remote('b', async (x) => {
					seen.push(x.runtime_context.binding_reference.binding_id);
					return { scenarios: [] };
				}),
			};
		const out = await executeWithLlmProviders(
			{
				...input(['a', 'b']),
				prepareProviderCandidate: async ({ provider_identity }) => ready(provider_identity),
				credentialResolver: new DeferredProviderCredentialResolverV1({}),
			},
			map,
		);
		expect(out.providerUsed).toBe('b');
		expect(seen).toEqual(['binding:a', 'binding:b']);
	});
	it('fails configuration errors without technical fallback', async () => {
		const b = vi.fn(),
			map = { a: remote('a', vi.fn()), b: remote('b', b) };
		await expect(executeWithLlmProviders(input(['a', 'b']), map)).rejects.toMatchObject({ category: 'CONFIGURATION_FAILURE' });
		expect(b).not.toHaveBeenCalled();
	});
	it('keeps the generic boundary extensible and free of trust-brand semantics', async () => {
		const future = 'future_provider_x',
			x = ready(future, 'secret://future/custom-mechanism'),
			get = vi.fn(() => 'credential');
		expect(x.binding_reference.provider_identity).toBe(future);
		expect(
			await new DeferredProviderCredentialResolverV1({ 'secret://future/custom-mechanism': get }).resolve(
				x.binding_reference,
				x.credential_resolution_permit,
			),
		).toBe('credential');
		const serialized = JSON.stringify(x);
		expect(serialized).not.toMatch(/nationality|country|price|cost|trusted_provider/i);
	});
	it('creates substitition-resistant content-free external causal references', () => {
		const x = providerRuntimeCausalReferenceV1({
			binding_id: 'binding:1',
			binding_digest: 'digest:1',
			admission_id: 'future:1',
			admission_digest: 'future-digest:1',
		});
		expect(x).toEqual({
			version: 1,
			provider_runtime_binding_id: 'binding:1',
			provider_runtime_binding_digest: 'digest:1',
			provider_trust_admission_id: 'future:1',
			provider_trust_admission_digest: 'future-digest:1',
		});
		expect(JSON.stringify(x)).not.toMatch(/policy|prompt|secret|provider.brand/i);
		expect(() => providerRuntimeCausalReferenceV1({ binding_id: 'binding:1', binding_digest: 'digest:1', admission_id: 'other' })).toThrow(
			/PROVIDER_RUNTIME_CAUSAL_REFERENCE_SUBSTITUTED/,
		);
		expect(() =>
			verifyProviderRuntimeCausalReferenceV1(x, {
				binding_id: 'binding:other',
				binding_digest: 'digest:1',
				admission_id: 'future:1',
				admission_digest: 'future-digest:1',
			}),
		).toThrow(/PROVIDER_RUNTIME_CAUSAL_REFERENCE_SUBSTITUTED/);
	});
	it('keeps provider failures classified separately from boundary failures', () => {
		expect(new ProviderBoundaryFailureV1('TECHNICAL_FAILURE', 'TIMEOUT').category).toBe('TECHNICAL_FAILURE');
		expect(new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', 'DENIED').category).not.toBe('TECHNICAL_FAILURE');
	});
	it('keeps the OpenRouter wrapper behind the pre-credential boundary', async () => {
		const provider = createOpenRouterProvider({});
		await expect(provider.generateScenarios({})).rejects.toMatchObject({
			category: 'CONFIGURATION_FAILURE',
			code: 'PROVIDER_PRE_CREDENTIAL_BOUNDARY_REQUIRED',
		});
		expect(JSON.stringify(provider)).not.toMatch(/api[_-]?key|bearer|token/i);
	});
});
