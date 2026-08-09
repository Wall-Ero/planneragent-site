import type { CognitiveTransportEvidenceRepositoryV1 } from '../../../governance/knowledge-exposure/transport';
import { CognitiveTransportMediatorV1 } from '../../../governance/knowledge-exposure/transport';
import { ProviderBoundaryFailureV1 } from '../../../governance/provider-trust';
import type { LlmProvider } from '../types';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
export interface OpenRouterEnvironment {
	readonly cognitiveTransportEvidence?: CognitiveTransportEvidenceRepositoryV1;
	readonly cognitiveFetch?: typeof fetch;
	readonly cognitiveNow?: () => string;
}
export function createOpenRouterProvider(env: OpenRouterEnvironment): LlmProvider {
	return {
		id: 'openrouter',
		remote: true,
		isFree: false,
		quality: 'high',
		async generateScenarios(input) {
			if (!input.runtime_context || !input.credential_resolver)
				throw new ProviderBoundaryFailureV1('CONFIGURATION_FAILURE', 'PROVIDER_PRE_CREDENTIAL_BOUNDARY_REQUIRED');
			if (input.runtime_context.binding_reference.provider_identity !== 'openrouter')
				throw new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', 'PROVIDER_RUNTIME_BINDING_CANDIDATE_SUBSTITUTED');
			if (!env.cognitiveTransportEvidence || !input.sealed_exposure) throw new Error('COGNITIVE_EXPOSURE_REQUIRED');
			const model = input.model ?? DEFAULT_MODEL;
			if (input.runtime_context.binding_reference.selected_model !== model)
				throw new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', 'PROVIDER_RUNTIME_BINDING_MODEL_SUBSTITUTED');
			const key = await input.credential_resolver.resolve(
				input.runtime_context.binding_reference,
				input.runtime_context.credential_resolution_permit,
			);
			if (!key) throw new ProviderBoundaryFailureV1('CONFIGURATION_FAILURE', 'PROVIDER_CREDENTIAL_SECRET_MISSING');
			const response = await new CognitiveTransportMediatorV1({
				fetch: env.cognitiveFetch ?? fetch,
				evidence: env.cognitiveTransportEvidence,
				now: env.cognitiveNow ?? (() => new Date().toISOString()),
			}).dispatch({
				sealed: input.sealed_exposure,
				provider: 'openrouter',
				model,
				api_key: key,
				runtime_governance_references: [
					`provider-runtime-binding:${input.runtime_context.causal_reference.provider_runtime_binding_id}:${input.runtime_context.causal_reference.provider_runtime_binding_digest}`,
					`runtime-provider-trust-admission:${input.runtime_context.credential_resolution_permit.admission_id}:${input.runtime_context.credential_resolution_permit.admission_digest}`,
					`oks-consumption:${input.sealed_exposure.eligibility.consumption_id}`,
				],
			});
			let scenarios: unknown;
			try {
				scenarios = JSON.parse(response.text);
			} catch {
				throw new Error('COGNITIVE_PROVIDER_RESPONSE_INVALID');
			}
			if (!Array.isArray(scenarios)) throw new Error('COGNITIVE_PROVIDER_RESPONSE_INVALID');
			return { model, scenarios };
		},
	};
}
