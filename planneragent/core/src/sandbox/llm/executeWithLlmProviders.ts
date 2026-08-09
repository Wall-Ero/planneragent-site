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
import {
	EvidencedProviderCredentialResolverV1,
	type ProviderRuntimeAttemptEvidenceV1,
	type SecurityEvidenceContextV1,
	type SecurityRuntimeEvidenceRepositoryV1,
} from '../../governance/security-evidence';

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
	securityEvidenceRepository?: SecurityRuntimeEvidenceRepositoryV1;
	securityEvidenceNow?: () => string;
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
	const { db, companyId, requestId, mode, sealedExposures, localBaseline, providers, prepareProviderCandidate, credentialResolver, securityEvidenceRepository } = input;
	const now=input.securityEvidenceNow??(()=>new Date().toISOString()),contexts=new Map<string,SecurityEvidenceContextV1>();
	const evidencedResolver=credentialResolver&&securityEvidenceRepository?new EvidencedProviderCredentialResolverV1(credentialResolver,securityEvidenceRepository,contexts,now):undefined;

	const plan = governance?.plan ?? 'BASIC';
	let usedFallback = false;
	let technicalPredecessor:ProviderRuntimeAttemptEvidenceV1|undefined;

	for (let i = 0; i < providers.length; i++) {
		const candidate = providers[i];
		const provider = providerMap[candidate.id];
		const attemptId=`provider-runtime-attempt:${crypto.randomUUID()}`,startedAt=now();

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
			if (preparation.outcome === 'GOVERNANCE_DENIED') {
				await securityEvidenceRepository?.persistAttempt({version:1,attempt_id:attemptId,request_id:requestId,sequence:i,provider:candidate.id,model:sealed?.model??input.model??candidate.id,outcome:'GOVERNANCE_DENIED',failure_class:'GOVERNANCE',failure_code:preparation.failure_code,started_at:startedAt,completed_at:now(),correlation_id:requestId,causal_references:[]});
				throw new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', preparation.failure_code);
			}
			if (preparation.binding_reference.provider_identity !== candidate.id) {
				await securityEvidenceRepository?.persistAttempt({version:1,attempt_id:attemptId,request_id:requestId,sequence:i,runtime_binding_id:preparation.causal_reference.provider_runtime_binding_id,runtime_binding_digest:preparation.causal_reference.provider_runtime_binding_digest,admission_id:preparation.security_evidence_context?.admission_id,admission_digest:preparation.security_evidence_context?.admission_digest,oks_consumption_id:preparation.security_evidence_context?.oks_consumption_id,provider:candidate.id,model:sealed?.model??input.model??candidate.id,outcome:'GOVERNANCE_DENIED',failure_class:'GOVERNANCE',failure_code:'PROVIDER_RUNTIME_BINDING_CANDIDATE_SUBSTITUTED',started_at:startedAt,completed_at:now(),correlation_id:preparation.security_evidence_context?.correlation_id??requestId,causal_references:preparation.security_evidence_context?.causal_references??[]});
				throw new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', 'PROVIDER_RUNTIME_BINDING_CANDIDATE_SUBSTITUTED');
			}
			runtimeContext = preparation;
			if(preparation.security_evidence_context)contexts.set(preparation.binding_reference.binding_id,preparation.security_evidence_context);
		} else if (provider.remote) {
			await securityEvidenceRepository?.persistAttempt({version:1,attempt_id:attemptId,request_id:requestId,sequence:i,provider:candidate.id,model:sealed?.model??input.model??candidate.id,outcome:'CONFIGURATION_FAILED',failure_class:'CONFIGURATION',failure_code:'PROVIDER_PRE_CREDENTIAL_BOUNDARY_REQUIRED',started_at:startedAt,completed_at:now(),correlation_id:requestId,causal_references:[]});
			throw new ProviderBoundaryFailureV1('CONFIGURATION_FAILURE', 'PROVIDER_PRE_CREDENTIAL_BOUNDARY_REQUIRED');
		}

		try {
			const result: LlmProviderResult = await provider.generateScenarios({
				...(provider.remote ? { sealed_exposure: sealed, model: sealed!.model } : { local_input: localBaseline }),
				...(runtimeContext ? { runtime_context: runtimeContext } : {}),
				...(credentialResolver ? { credential_resolver: evidencedResolver??credentialResolver } : {}),
			});
			if(securityEvidenceRepository&&runtimeContext){
				const c=runtimeContext.security_evidence_context,ce=evidencedResolver?.latest.get(runtimeContext.binding_reference.binding_id);
				const attempt=Object.freeze({version:1,attempt_id:attemptId,request_id:requestId,sequence:i,...(technicalPredecessor?{predecessor_attempt_id:technicalPredecessor.attempt_id}:{}),runtime_binding_id:runtimeContext.causal_reference.provider_runtime_binding_id,runtime_binding_digest:runtimeContext.causal_reference.provider_runtime_binding_digest,admission_id:c?.admission_id,admission_digest:c?.admission_digest,oks_consumption_id:c?.oks_consumption_id,credential_access_evidence_id:ce?.evidence_id,provider:candidate.id,provider_account_id:runtimeContext.binding_reference.provider_account_id,provider_deployment_id:runtimeContext.binding_reference.provider_deployment_id,adapter_identity:runtimeContext.binding_reference.adapter_identity,model:result.model??runtimeContext.binding_reference.selected_model,outcome:ce?.outcome==='NOT_APPLICABLE'?'CREDENTIAL_NOT_APPLICABLE':'TRANSPORT_SUCCEEDED',transport_evidence_id:result.transport_evidence_id,started_at:startedAt,completed_at:now(),correlation_id:c?.correlation_id??requestId,causal_references:c?.causal_references??[]}) as ProviderRuntimeAttemptEvidenceV1;
				await securityEvidenceRepository.persistAttempt(attempt);
				if(technicalPredecessor)await securityEvidenceRepository.persistFallback({lineage_id:`provider-runtime-fallback:${technicalPredecessor.attempt_id}:${attempt.attempt_id}`,predecessor_attempt_id:technicalPredecessor.attempt_id,successor_attempt_id:attempt.attempt_id,reason:'TECHNICAL_FAILURE',linked_at:attempt.started_at,correlation_id:attempt.correlation_id});
			}

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
			if(securityEvidenceRepository&&runtimeContext){const c=runtimeContext.security_evidence_context,ce=evidencedResolver?.latest.get(runtimeContext.binding_reference.binding_id),boundary=err instanceof ProviderBoundaryFailureV1;const attempt=Object.freeze({version:1,attempt_id:attemptId,request_id:requestId,sequence:i,...(technicalPredecessor?{predecessor_attempt_id:technicalPredecessor.attempt_id}:{}),runtime_binding_id:runtimeContext.causal_reference.provider_runtime_binding_id,runtime_binding_digest:runtimeContext.causal_reference.provider_runtime_binding_digest,admission_id:c?.admission_id,admission_digest:c?.admission_digest,oks_consumption_id:c?.oks_consumption_id,credential_access_evidence_id:ce?.evidence_id,provider:candidate.id,provider_account_id:runtimeContext.binding_reference.provider_account_id,provider_deployment_id:runtimeContext.binding_reference.provider_deployment_id,adapter_identity:runtimeContext.binding_reference.adapter_identity,model:runtimeContext.binding_reference.selected_model,outcome:ce?.outcome==='RESOLUTION_FAILED'?'CREDENTIAL_RESOLUTION_FAILED':boundary?'CONFIGURATION_FAILED':'TRANSPORT_FAILED',failure_class:boundary?'CONFIGURATION':'TECHNICAL',failure_code:boundary?err.code:ce?.failure_code??'PROVIDER_TECHNICAL_FAILURE',started_at:startedAt,completed_at:now(),correlation_id:c?.correlation_id??requestId,causal_references:c?.causal_references??[]}) as ProviderRuntimeAttemptEvidenceV1;await securityEvidenceRepository.persistAttempt(attempt);if(technicalPredecessor)await securityEvidenceRepository.persistFallback({lineage_id:`provider-runtime-fallback:${technicalPredecessor.attempt_id}:${attempt.attempt_id}`,predecessor_attempt_id:technicalPredecessor.attempt_id,successor_attempt_id:attempt.attempt_id,reason:'TECHNICAL_FAILURE',linked_at:attempt.started_at,correlation_id:attempt.correlation_id});if(!boundary)technicalPredecessor=attempt;}
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
