import type { ProviderRuntimeBindingV1 } from './provider.runtime.binding.contracts.v1';
export type ProviderBoundaryFailureCategoryV1 = 'GOVERNANCE_DENIAL' | 'TECHNICAL_FAILURE' | 'CONFIGURATION_FAILURE';
export class ProviderBoundaryFailureV1 extends Error {
	constructor(
		readonly category: ProviderBoundaryFailureCategoryV1,
		readonly code: string,
	) {
		super(code);
		this.name = 'ProviderBoundaryFailureV1';
	}
}
export interface ProviderRuntimeBindingReferenceV1 {
	readonly version: 1;
	readonly binding_id: string;
	readonly mapping_id: string;
	readonly provider_identity: string;
	readonly provider_account_id: string;
	readonly provider_deployment_id: string;
	readonly adapter_identity: string;
	readonly selected_model: string;
	readonly credential_reference: string | 'NOT_APPLICABLE';
}
export interface CredentialResolutionPermitV1 {
	readonly version: 1;
	readonly binding_id: string;
	readonly provider_identity: string;
	readonly provider_account_id: string;
	readonly provider_deployment_id: string;
	readonly adapter_identity: string;
	readonly credential_reference: string | 'NOT_APPLICABLE';
	readonly consumer: 'PROVIDER_CREDENTIAL_RESOLVER';
	readonly authorization_reference: string;
	readonly admission_id?: string;
	readonly admission_digest?: string;
	readonly invocation_consumer?: 'COGNITIVE_PROVIDER_INVOCATION';
	readonly expires_at?: string;
}
export interface ProviderRuntimeCausalReferenceV1 {
	readonly version: 1;
	readonly provider_runtime_binding_id: string;
	readonly provider_runtime_binding_digest: string;
	readonly provider_trust_admission_id?: string;
	readonly provider_trust_admission_digest?: string;
}
export interface PreparedProviderCandidateV1 {
	readonly outcome: 'READY';
	readonly binding_reference: ProviderRuntimeBindingReferenceV1;
	readonly credential_resolution_permit: CredentialResolutionPermitV1;
	readonly causal_reference: ProviderRuntimeCausalReferenceV1;
}
export type ProviderCandidatePreparationV1 = PreparedProviderCandidateV1 | Readonly<{ outcome: 'GOVERNANCE_DENIED'; failure_code: string }>;
export interface ProviderCredentialResolverV1 {
	resolve(binding: ProviderRuntimeBindingReferenceV1, permit: CredentialResolutionPermitV1): Promise<string | undefined>;
}
const frozen = <T>(value: T): T => {
	if (value && typeof value === 'object') {
		for (const child of Object.values(value as object)) frozen(child);
		Object.freeze(value);
	}
	return value;
};
export function referenceProviderRuntimeBindingV1(binding: ProviderRuntimeBindingV1): ProviderRuntimeBindingReferenceV1 {
	return frozen({
		version: 1,
		binding_id: binding.binding_id,
		mapping_id: binding.mapping_id,
		provider_identity: binding.provider,
		provider_account_id: binding.provider_account_id,
		provider_deployment_id: binding.provider_deployment_id,
		adapter_identity: binding.adapter_identity,
		selected_model: binding.selected_model,
		credential_reference: binding.credential_reference,
	});
}
export function providerRuntimeCausalReferenceV1(input: {
	binding_id: string;
	binding_digest: string;
	admission_id?: string;
	admission_digest?: string;
}): ProviderRuntimeCausalReferenceV1 {
	if (!input.binding_id || !input.binding_digest)
		throw new ProviderBoundaryFailureV1('CONFIGURATION_FAILURE', 'PROVIDER_RUNTIME_CAUSAL_REFERENCE_INVALID');
	if (!!input.admission_id !== !!input.admission_digest)
		throw new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', 'PROVIDER_RUNTIME_CAUSAL_REFERENCE_SUBSTITUTED');
	return frozen({
		version: 1,
		provider_runtime_binding_id: input.binding_id,
		provider_runtime_binding_digest: input.binding_digest,
		...(input.admission_id
			? { provider_trust_admission_id: input.admission_id, provider_trust_admission_digest: input.admission_digest }
			: {}),
	});
}
export function verifyProviderRuntimeCausalReferenceV1(
	reference: ProviderRuntimeCausalReferenceV1,
	expected: { binding_id: string; binding_digest: string; admission_id?: string; admission_digest?: string },
): void {
	if (
		reference.provider_runtime_binding_id !== expected.binding_id ||
		reference.provider_runtime_binding_digest !== expected.binding_digest ||
		reference.provider_trust_admission_id !== expected.admission_id ||
		reference.provider_trust_admission_digest !== expected.admission_digest
	)
		throw new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', 'PROVIDER_RUNTIME_CAUSAL_REFERENCE_SUBSTITUTED');
}
export class DeferredProviderCredentialResolverV1 implements ProviderCredentialResolverV1 {
	constructor(
		private readonly sources: Readonly<Record<string, () => string | undefined | Promise<string | undefined>>>,
		private readonly now: () => string = () => new Date().toISOString(),
	) {}
	async resolve(binding: ProviderRuntimeBindingReferenceV1, permit: CredentialResolutionPermitV1) {
		const fields = [
			'binding_id',
			'provider_identity',
			'provider_account_id',
			'provider_deployment_id',
			'adapter_identity',
			'credential_reference',
		] as const;
		if (!binding || !permit || permit.consumer !== 'PROVIDER_CREDENTIAL_RESOLVER')
			throw new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', 'PROVIDER_CREDENTIAL_RESOLUTION_NOT_AUTHORIZED');
		if (fields.some((field) => binding[field] !== permit[field]))
			throw new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', 'PROVIDER_CREDENTIAL_REFERENCE_SUBSTITUTED');
		if (
			!permit.admission_id ||
			!permit.admission_digest ||
			permit.authorization_reference !== permit.admission_id ||
			permit.invocation_consumer !== 'COGNITIVE_PROVIDER_INVOCATION' ||
			!permit.expires_at ||
			permit.expires_at <= this.now()
		)
			throw new ProviderBoundaryFailureV1('GOVERNANCE_DENIAL', 'PROVIDER_CREDENTIAL_RESOLUTION_NOT_AUTHORIZED');
		if (binding.credential_reference === 'NOT_APPLICABLE') return undefined;
		const source = this.sources[binding.credential_reference];
		if (!source) throw new ProviderBoundaryFailureV1('CONFIGURATION_FAILURE', 'PROVIDER_CREDENTIAL_SOURCE_MISSING');
		const secret = await source();
		if (!secret) throw new ProviderBoundaryFailureV1('CONFIGURATION_FAILURE', 'PROVIDER_CREDENTIAL_SECRET_MISSING');
		return secret;
	}
}
