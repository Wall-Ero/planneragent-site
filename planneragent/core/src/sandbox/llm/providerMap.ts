import { LlmProvider } from './types';
import { createOpenRouterProvider } from './providers/openrouter';
import { OssProvider } from './providers/oss';
import { MockProvider } from './providers/mock';
import { DeferredProviderCredentialResolverV1 } from '../../governance/provider-trust';

export function createProviderMap(env: any): Record<string, LlmProvider> {
	return {
		openrouter: createOpenRouterProvider(env),
		oss: OssProvider,
		mock: MockProvider,
	};
}

export function createEnvironmentCredentialResolver(env: any) {
	return new DeferredProviderCredentialResolverV1({
		'secret://providers/openai': () => env.OPENAI_API_KEY,
		'secret://providers/anthropic': () => env.ANTHROPIC_API_KEY,
		'secret://providers/openrouter': () => env.OPENROUTER_API_KEY,
	});
}
