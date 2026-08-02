import type { KnowledgeExposureEligibilityV1 } from "../persistence";
import type { KnowledgeProjectionManifestV1, KnowledgeExposurePurposeCodeV1, KnowledgeRetentionV1, ProviderOrRecipientClassV1 } from "../knowledge.exposure.contracts.v1";

export type CognitiveProviderV1="openai"|"anthropic"|"openrouter";
export type CognitiveTransportFailureCode=
|"COGNITIVE_EXPOSURE_REQUIRED"|"COGNITIVE_ELIGIBILITY_INVALID"|"COGNITIVE_ELIGIBILITY_OPERATION_MISMATCH"|"COGNITIVE_ELIGIBILITY_PURPOSE_MISMATCH"|"COGNITIVE_ELIGIBILITY_TARGET_MISMATCH"|"COGNITIVE_ELIGIBILITY_REGION_MISMATCH"|"COGNITIVE_ELIGIBILITY_RETENTION_MISMATCH"|"COGNITIVE_ELIGIBILITY_CONSUMPTION_MISMATCH"|"COGNITIVE_MANIFEST_MISMATCH"|"COGNITIVE_PROJECTION_DIGEST_MISMATCH"|"COGNITIVE_REFERENCE_SET_MISMATCH"|"COGNITIVE_PROJECTION_MUTATED"|"COGNITIVE_PROVIDER_NOT_ADMITTED"|"COGNITIVE_MODEL_NOT_ADMITTED"|"COGNITIVE_FALLBACK_NOT_ADMITTED"|"COGNITIVE_FANOUT_NOT_ADMITTED"|"COGNITIVE_REQUEST_TOO_LARGE"|"COGNITIVE_RESPONSE_TOO_LARGE"|"COGNITIVE_PROVIDER_TIMEOUT"|"COGNITIVE_PROVIDER_FAILURE"|"COGNITIVE_PROVIDER_RESPONSE_INVALID"|"COGNITIVE_TRANSPORT_EVIDENCE_FAILED"|"COGNITIVE_LEGACY_BYPASS_PROHIBITED";
export class CognitiveTransportError extends Error{constructor(readonly code:CognitiveTransportFailureCode){super(code);this.name="CognitiveTransportError";}}

export interface SealedCognitiveExposureV1{
 readonly version:1;readonly eligibility:KnowledgeExposureEligibilityV1;readonly manifest:KnowledgeProjectionManifestV1;
 readonly manifest_id:string;readonly projection_digest:string;readonly knowledge_digests:readonly string[];
 readonly canonical_projection:string;readonly canonical_projection_digest:string;
 readonly purpose:KnowledgeExposurePurposeCodeV1;readonly provider:CognitiveProviderV1;
 readonly provider_target_class:ProviderOrRecipientClassV1;readonly provider_identity:string;readonly model:string;
 readonly region:string;readonly retention:KnowledgeRetentionV1;readonly correlation_id:string;readonly causal_references:readonly string[];
}
export interface CognitiveTransportEvidenceV1{readonly version:1;readonly evidence_id:string;readonly decision_id:string;readonly binding_id:string;readonly consumption_id:string;readonly projection_digest:string;readonly request_digest:string;readonly provider:CognitiveProviderV1;readonly model:string;readonly provider_deployment_class:ProviderOrRecipientClassV1;readonly purpose:KnowledgeExposurePurposeCodeV1;readonly region:string;readonly retention:KnowledgeRetentionV1;readonly dispatched_at:string;readonly status:"SUCCEEDED"|"FAILED";readonly response_digest?:string;readonly failure_code?:CognitiveTransportFailureCode;readonly causal_references:readonly string[];}
export interface CognitiveTransportEvidenceRepositoryV1{reserve(consumptionId:string,provider:CognitiveProviderV1,at:string):Promise<boolean>;append(evidence:CognitiveTransportEvidenceV1):Promise<void>;}
export interface CognitiveAdvisoryResponseV1{readonly version:1;readonly provider:CognitiveProviderV1;readonly model:string;readonly text:string;readonly response_digest:string;readonly usage?:Readonly<{input_tokens?:number;output_tokens?:number}>;readonly evidence:CognitiveTransportEvidenceV1;readonly advisory_only:true;}
