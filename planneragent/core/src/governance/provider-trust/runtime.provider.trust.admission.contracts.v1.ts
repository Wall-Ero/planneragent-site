import type { KnowledgeExposureEligibilityV1 } from '../knowledge-exposure/persistence';
import type { DataClassification, SovereigntyClass } from '../../security/encryption.domains';
import type { KnowledgeRetentionV1, ProviderOrRecipientClassV1 } from '../knowledge-exposure';
import type { ProviderRuntimeBindingV1 } from './provider.runtime.binding.contracts.v1';
import type {
	ProviderTrustEligibilityV1,
	ProviderTrustProcessingContextV1,
	ProviderTrustRequirementV1,
} from './tenant.provider.trust.contracts.v1';
import type { CredentialResolutionPermitV1 } from './provider.precredential.boundary.v1';
export type RuntimeProviderTrustFailureCodeV1 =
	| 'RUNTIME_PROVIDER_TRUST_REQUEST_INVALID'
	| 'RUNTIME_PROVIDER_TRUST_OKS_REQUIRED'
	| 'RUNTIME_PROVIDER_TRUST_OKS_INVALID'
	| 'RUNTIME_PROVIDER_TRUST_OKS_STALE'
	| 'RUNTIME_PROVIDER_TRUST_PROJECTION_MISMATCH'
	| 'RUNTIME_PROVIDER_TRUST_ELIGIBILITY_REQUIRED'
	| 'RUNTIME_PROVIDER_TRUST_ELIGIBILITY_INVALID'
	| 'RUNTIME_PROVIDER_TRUST_ELIGIBILITY_STALE'
	| 'RUNTIME_PROVIDER_TRUST_POLICY_STALE'
	| 'RUNTIME_PROVIDER_TRUST_ATTESTATION_SET_STALE'
	| 'RUNTIME_PROVIDER_TRUST_CONTEXT_MISMATCH'
	| 'RUNTIME_PROVIDER_TRUST_CONSTRAINT_CONFLICT'
	| 'RUNTIME_PROVIDER_TRUST_PROVIDER_MISMATCH'
	| 'RUNTIME_PROVIDER_TRUST_ACCOUNT_MISMATCH'
	| 'RUNTIME_PROVIDER_TRUST_DEPLOYMENT_MISMATCH'
	| 'RUNTIME_PROVIDER_TRUST_ADAPTER_MISMATCH'
	| 'RUNTIME_PROVIDER_TRUST_CREDENTIAL_REFERENCE_MISMATCH'
	| 'RUNTIME_PROVIDER_TRUST_ADMISSION_DENIED'
	| 'RUNTIME_PROVIDER_TRUST_ADMISSION_EXPIRED'
	| 'RUNTIME_PROVIDER_TRUST_ADMISSION_REPLAYED'
	| 'RUNTIME_PROVIDER_TRUST_RESERVATION_FAILED'
	| 'RUNTIME_PROVIDER_TRUST_PERSISTENCE_FAILED'
	| 'RUNTIME_PROVIDER_TRUST_AUDIT_FAILED';
export class RuntimeProviderTrustFailureV1 extends Error {
	constructor(readonly code: RuntimeProviderTrustFailureCodeV1) {
		super(code);
		this.name = 'RuntimeProviderTrustFailureV1';
	}
}
export interface RuntimeProviderTrustAdmissionRequestV1 {
	readonly version: 1;
	readonly oks_eligibility?: KnowledgeExposureEligibilityV1;
	readonly provider_trust_eligibility?: ProviderTrustEligibilityV1;
	readonly runtime_binding?: ProviderRuntimeBindingV1;
	readonly runtime_binding_digest: string;
	readonly invocation_consumer: 'COGNITIVE_PROVIDER_INVOCATION';
	readonly requested_validity_ms: number;
	readonly current_time: string;
	readonly correlation_id: string;
	readonly causal_references: readonly string[];
}
export interface RuntimeProviderTrustCurrentStateV1 {
	readonly oks?: Readonly<{
		decision_id: string;
		binding_id: string;
		consumption_id: string;
		outcome: 'ADMITTED' | 'DENIED';
		tenant_id: string;
		company_id: string;
		purpose: string;
		target_class: ProviderOrRecipientClassV1;
		target_identity?: string;
		region: string;
		retention: KnowledgeRetentionV1;
		classification: DataClassification;
		sovereignty: SovereigntyClass;
		manifest_id: string;
		projection_digest: string;
		expires_at: string;
	}>;
	readonly pt?: Readonly<{
		eligibility_id: string;
		future_consumer: string;
		expires_at: string;
		evaluation_id: string;
		evaluation_digest: string;
		evaluation_outcome: 'SATISFIED' | 'DENIED' | 'INSUFFICIENT_EVIDENCE';
		evaluation_expires_at: string;
		policy_digest: string;
		policy_ids: readonly string[];
		policy_versions: readonly number[];
		policy_current: boolean;
		attestation_set_digest: string;
		current_attestation_set_digest: string;
		context: ProviderTrustProcessingContextV1;
		context_digest: string;
		requirements: readonly ProviderTrustRequirementV1[];
		provider: string;
		provider_account_id: string;
		provider_deployment_id?: string;
		adapter_identity: string;
		deployment_class: string;
		model_references: readonly string[];
		credential_reference?: string;
		account_current: boolean;
		deployment_current: boolean;
		mapping_current: boolean;
	}>;
}
export interface EffectiveRuntimeProviderConstraintsV1 {
	readonly purpose: string;
	readonly classification: DataClassification;
	readonly sovereignty: SovereigntyClass;
	readonly target_class: ProviderOrRecipientClassV1;
	readonly processing_regions: readonly string[];
	readonly retention: KnowledgeRetentionV1;
	readonly deployment_class: string;
}
export interface RuntimeProviderTrustAdmissionV1 {
	readonly version: 1;
	readonly admission_id: string;
	readonly admission_digest: string;
	readonly tenant_id: string;
	readonly company_id: string;
	readonly legal_entity_id: string;
	readonly oks_decision_id: string;
	readonly oks_binding_id: string;
	readonly oks_consumption_id: string;
	readonly manifest_id: string;
	readonly projection_digest: string;
	readonly effective_context: EffectiveRuntimeProviderConstraintsV1;
	readonly provider_trust_eligibility_id: string;
	readonly evaluation_id: string;
	readonly evaluation_digest: string;
	readonly policy_ids: readonly string[];
	readonly policy_versions: readonly number[];
	readonly policy_digest: string;
	readonly attestation_set_digest: string;
	readonly runtime_binding_id: string;
	readonly runtime_binding_digest: string;
	readonly provider: string;
	readonly provider_account_id: string;
	readonly provider_deployment_id: string;
	readonly adapter_identity: string;
	readonly selected_model: string;
	readonly credential_reference: string | 'NOT_APPLICABLE';
	readonly issued_at: string;
	readonly expires_at: string;
	readonly reservation_id: string;
	readonly invocation_consumer: 'COGNITIVE_PROVIDER_INVOCATION';
	readonly correlation_id: string;
	readonly causal_references: readonly string[];
	readonly transport_executed: false;
}
export interface RuntimeProviderTrustAdmissionRepositoryV1 {
	current(request: RuntimeProviderTrustAdmissionRequestV1): Promise<RuntimeProviderTrustCurrentStateV1>;
	persistAdmission(admission: RuntimeProviderTrustAdmissionV1): Promise<void>;
	persistDenial(input: {
		denial_id: string;
		failure_code: RuntimeProviderTrustFailureCodeV1;
		correlation_id: string;
		recorded_at: string;
		causal_references: readonly string[];
	}): Promise<void>;
	reserve(admission: RuntimeProviderTrustAdmissionV1, consumer: string, at: string): Promise<boolean>;
}
export interface ConsumedRuntimeProviderTrustAdmissionV1 {
	readonly admission: RuntimeProviderTrustAdmissionV1;
	readonly permit: CredentialResolutionPermitV1;
	readonly consumed_at: string;
}
