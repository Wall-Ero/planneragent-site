// src/sandbox/llm/executeWithLlmProviders.ts

import type { D1Database } from '@cloudflare/workers-types';
import { LlmProvider, LlmProviderResult, LlmUsage } from './types';
import { LlmProviderCandidate } from '../llmcontracts';
import { logLlmUsage } from './usageLedger';
import type { LlmResultV2, LlmUsageV2 } from '../llm.v2';
import type { SealedCognitiveExposureV1 } from '../../governance/knowledge-exposure/transport';
import {
	ProviderBoundaryFailureV1,
	type PreparedProviderCandidateV1,
	type ProviderCandidatePreparationV1,
	type ProviderCredentialResolverV1,
} from '../../governance/provider-trust';

/* ============================================================
 * Helpers
 * ============================================================ */

function mapUsageToV2(usage?: LlmUsage): LlmUsageV2 | undefined {
	if (!usage) return undefined;
	return {
		tokens_in: usage.prompt_tokens,
		tokens_out: usage.completion_tokens,
	};
}

/**
 * Maps technical provider cost type → economic provider category
 */
function mapProviderType(costType: 'openrouter' | 'mock' | 'free' | 'paid' | 'oss'): 'paid' | 'free' | 'oss' {
	switch (costType) {
		case 'paid':
			return 'paid';
		case 'free':
			return 'free';
		case 'oss':
			return 'oss';
		case 'openrouter':
			return 'free';
		case 'mock':
		default:
			return 'oss';
	}
}

/* ============================================================
 * Types
 * ============================================================ */

export type LlmExecutionResultV2 = {
	scenarios: any[];
	providerUsed: string;
	degraded: boolean;
	llmResults: LlmResultV2[];
};

/**
 * Cognitive mode only — LLM never sees authority
 */
export type DecisionMode = 'sense' | 'advise';

/**
 * Input contract for LLM execution
 */
export interface ExecuteLlmInput {
	db?: D1Database;
	companyId: string;
	requestId: string;
	mode: DecisionMode;
	sealedExposures: readonly SealedCognitiveExposureV1[];
	localBaseline?: unknown;
	providers: LlmProviderCandidate[];
	model?: string;
	prepareProviderCandidate?: (selection: {
		readonly provider_identity: string;
		readonly selected_model: string;
	}) => Promise<ProviderCandidatePreparationV1>;
	credentialResolver?: ProviderCredentialResolverV1;
}

/* ============================================================
 * Main
 * ============================================================ */

/**
 * Executes LLM calls using ordered providers with fallback and usage ledger.
 * Stops at first successful provider.
 */
export async function executeWithLlmProviders(
	input: ExecuteLlmInput,
	providerMap: Record<string, LlmProvider>,
	governance?: {
		plan: 'BASIC' | 'JUNIOR' | 'SENIOR';
	},
): Promise<LlmExecutionResultV2> {
	const { db, companyId, requestId, mode, sealedExposures, localBaseline, providers, prepareProviderCandidate, credentialResolver } = input;

	const plan = governance?.plan ?? 'BASIC';
	let usedFallback = false;

	for (let i = 0; i < providers.length; i++) {
		const candidate = providers[i];
		const provider = providerMap[candidate.id];

		if (!provider) {
			usedFallback = true;
			continue;
		}

		const sealed = sealedExposures.find((exposure) => exposure.provider === candidate.id);
		if (provider.remote && !sealed) {
			usedFallback = true;
			continue;
		}

		let runtimeContext: PreparedProviderCandidateV1 | undefined;
		if (prepareProviderCandidate) {
			const preparation = await prepareProviderCandidate({
				provider_identity: candidate.id,
				selected_model: sealed?.model ?? input.model ?? candidate.id,
			});
			if (preparation.outcome === 'GOVERNANCE_DENIED') throw new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', preparation.failure_code);
			if (preparation.binding_reference.provider_identity !== candidate.id)
				throw new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', 'PROVIDER_RUNTIME_BINDING_CANDIDATE_SUBSTITUTED');
			runtimeContext = preparation;
		} else if (provider.remote) {
			throw new ProviderBoundaryFailureV1('CONFIGURATION_FAILURE', 'PROVIDER_PRE_CREDENTIAL_BOUNDARY_REQUIRED');
		}

		try {
			const result: LlmProviderResult = await provider.generateScenarios({
				...(provider.remote ? { sealed_exposure: sealed, model: sealed!.model } : { local_input: localBaseline }),
				...(runtimeContext ? { runtime_context: runtimeContext } : {}),
				...(credentialResolver ? { credential_resolver: credentialResolver } : {}),
			});

			const llmResults: LlmResultV2[] = [
				{
					ok: true,
					call_id: requestId,
					provider: 'worker-ai',
					model: result.model ?? 'unknown',
					text: 'scenario fanout',
					usage: mapUsageToV2(result.usage),
				},
			];

			// ======================
			// LEDGER — SUCCESS
			// ======================
			if (db) {
				const promptTokens = llmResults.reduce((sum, r) => sum + (r.usage?.tokens_in ?? 0), 0);

				const completionTokens = llmResults.reduce((sum, r) => sum + (r.usage?.tokens_out ?? 0), 0);

				await logLlmUsage(db, {
					id: crypto.randomUUID(),
					createdAt: new Date().toISOString(),
					companyId,
					requestId,
					plan,
					providerId: candidate.id,
					providerType: mapProviderType(candidate.costType),
					model: llmResults[0]?.model,
					promptTokens,
					completionTokens,
					totalTokens: promptTokens + completionTokens,
					costEur: candidate.estimatedCostEur,
					success: true,
					fallback: usedFallback,
				});
			}

			return {
				scenarios: result.scenarios,
				providerUsed: candidate.id,
				degraded: usedFallback,
				llmResults,
			};
		} catch (err) {
			if (err instanceof ProviderBoundaryFailureV1) throw err;
			usedFallback = true;

			// ======================
			// LEDGER — FAILURE
			// ======================
			if (db) {
				await logLlmUsage(db, {
					id: crypto.randomUUID(),
					createdAt: new Date().toISOString(),
					companyId,
					requestId,
					plan,
					providerId: candidate.id,
					providerType: mapProviderType(candidate.costType),
					model: undefined,
					promptTokens: 0,
					completionTokens: 0,
					totalTokens: 0,
					costEur: candidate.estimatedCostEur,
					success: false,
					fallback: true,
				});
			}

			// fallback → try next provider
		}
	}

	throw new Error('All LLM providers failed');
}
