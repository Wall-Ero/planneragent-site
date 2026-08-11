import type { ProviderAccountIdentityV1, ProviderDeploymentIdentityV1, ProviderIdentityV1 } from './provider.account.contracts.v1';
export const PROVIDER_RUNTIME_BINDING_POLICY_V1 = 'PROVIDER_RUNTIME_BINDING_POLICY_V1' as const;
export type ProviderRuntimeBindingFailureCodeV1 =
	| 'PROVIDER_RUNTIME_BINDING_REQUEST_INVALID'
	| 'PROVIDER_RUNTIME_BINDING_PROVIDER_UNKNOWN'
	| 'PROVIDER_RUNTIME_BINDING_ACCOUNT_REQUIRED'
	| 'PROVIDER_RUNTIME_BINDING_ACCOUNT_AMBIGUOUS'
	| 'PROVIDER_RUNTIME_BINDING_ACCOUNT_INVALID'
	| 'PROVIDER_RUNTIME_BINDING_DEPLOYMENT_REQUIRED'
	| 'PROVIDER_RUNTIME_BINDING_DEPLOYMENT_AMBIGUOUS'
	| 'PROVIDER_RUNTIME_BINDING_DEPLOYMENT_INVALID'
	| 'PROVIDER_RUNTIME_BINDING_ADAPTER_INVALID'
	| 'PROVIDER_RUNTIME_BINDING_MODEL_MISMATCH'
	| 'PROVIDER_RUNTIME_BINDING_CREDENTIAL_REFERENCE_REQUIRED'
	| 'PROVIDER_RUNTIME_BINDING_CREDENTIAL_REFERENCE_INVALID'
	| 'PROVIDER_RUNTIME_BINDING_ACCOUNT_SUBSTITUTED'
	| 'PROVIDER_RUNTIME_BINDING_DEPLOYMENT_SUBSTITUTED'
	| 'PROVIDER_RUNTIME_BINDING_ADAPTER_SUBSTITUTED'
	| 'PROVIDER_RUNTIME_BINDING_CREDENTIAL_SUBSTITUTED'
	| 'PROVIDER_RUNTIME_BINDING_NOT_FOUND'
	| 'PROVIDER_RUNTIME_BINDING_DIGEST_MISMATCH'
	| 'PROVIDER_RUNTIME_BINDING_IDENTITY_MISMATCH'
	| 'PROVIDER_RUNTIME_BINDING_STALE'
	| 'PROVIDER_RUNTIME_BINDING_PERSISTENCE_FAILED'
	| 'PROVIDER_RUNTIME_BINDING_AUDIT_FAILED';
export class ProviderRuntimeBindingFailureV1 extends Error {
	constructor(readonly code: ProviderRuntimeBindingFailureCodeV1) {
		super(code);
		this.name = 'ProviderRuntimeBindingFailureV1';
	}
}
export interface ProviderRuntimeMappingV1 {
	readonly version: 1;
	readonly mapping_id: string;
	readonly provider: ProviderIdentityV1;
	readonly selected_model: string;
	readonly provider_account_id: string;
	readonly provider_deployment_id: string;
	readonly adapter_identity: string;
	readonly credential_reference: string | 'NOT_APPLICABLE';
	readonly environment_class: 'PRODUCTION' | 'NON_PRODUCTION';
	readonly effective_at: string;
	readonly expires_at?: string;
	readonly correlation_id: string;
	readonly causal_references: readonly string[];
}
export interface ProviderRuntimeBindingRequestV1 {
	readonly version: 1;
	readonly provider: ProviderIdentityV1;
	readonly selected_model: string;
	readonly environment_class: 'PRODUCTION' | 'NON_PRODUCTION';
	readonly requested_at: string;
	readonly correlation_id: string;
	readonly causal_references: readonly string[];
}
export interface ProviderRuntimeBindingV1 {
	readonly version: 1;
	readonly binding_id: string;
	readonly mapping_id: string;
	readonly provider: ProviderIdentityV1;
	readonly provider_account_id: string;
	readonly provider_deployment_id: string;
	readonly adapter_identity: string;
	readonly selected_model: string;
	readonly credential_reference: string | 'NOT_APPLICABLE';
	readonly environment_class: 'PRODUCTION' | 'NON_PRODUCTION';
	readonly downstream_provider_identity_status: 'PROVEN' | 'UNKNOWN';
	readonly downstream_deployment_identity_status: 'PROVEN' | 'UNKNOWN';
	readonly binding_policy_version: typeof PROVIDER_RUNTIME_BINDING_POLICY_V1;
	readonly issued_at: string;
	readonly correlation_id: string;
	readonly causal_references: readonly string[];
	readonly admission_granted: false;
	readonly transport_executed: false;
}
export interface CanonicalProviderRuntimeBindingEvidenceV1 {
	readonly version: 1;
	readonly binding: ProviderRuntimeBindingV1;
	readonly binding_digest: string;
}
export interface ProviderRuntimeBindingSourceV1 {
	findMappings(request: ProviderRuntimeBindingRequestV1): Promise<readonly ProviderRuntimeMappingV1[]>;
	readAccount(id: string): Promise<ProviderAccountIdentityV1 | null>;
	readDeployment(id: string): Promise<ProviderDeploymentIdentityV1 | null>;
	credentialReferenceIsCurrent(accountId: string, deploymentId: string, reference: string): Promise<boolean>;
	isTransitioned(subjectId: string): Promise<boolean>;
	persistBinding(evidence: CanonicalProviderRuntimeBindingEvidenceV1): Promise<'CREATED' | 'IDENTICAL'>;
	readBinding(bindingId: string): Promise<CanonicalProviderRuntimeBindingEvidenceV1 | null>;
	audit(event: {
		event_id: string;
		event_kind: string;
		mapping_id?: string;
		binding_id?: string;
		outcome: 'BOUND' | 'DENIED';
		failure_code?: ProviderRuntimeBindingFailureCodeV1;
		correlation_id: string;
		recorded_at: string;
	}): Promise<void>;
}
