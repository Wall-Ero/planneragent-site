import { deepCopyAndFreeze } from '../knowledge-exposure/knowledge.projection.guard.v1';
import { canonicalProviderRuntimeBindingDigestV1 } from './provider.precredential.boundary.v1';
import type { KnowledgeRetentionV1 } from '../knowledge-exposure';
import {
	ProviderBoundaryFailureV1,
	providerRuntimeCausalReferenceV1,
	referenceProviderRuntimeBindingV1,
	type PreparedProviderCandidateV1,
} from './provider.precredential.boundary.v1';
import {
	RuntimeProviderTrustFailureV1,
	type ConsumedRuntimeProviderTrustAdmissionV1,
	type EffectiveRuntimeProviderConstraintsV1,
	type RuntimeProviderTrustAdmissionRepositoryV1,
	type RuntimeProviderTrustAdmissionRequestV1,
	type RuntimeProviderTrustAdmissionV1,
	type RuntimeProviderTrustFailureCodeV1,
} from './runtime.provider.trust.admission.contracts.v1';
async function digest(x: unknown) {
	return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(x))))]
		.map((v) => v.toString(16).padStart(2, '0'))
		.join('');
}
const external = (x: string) => x.includes('EXTERNAL') || x === 'SHARED_REMOTE_PROVIDER';
export class RuntimeProviderTrustAdmissionRuntimeV1 {
	constructor(private readonly repository: RuntimeProviderTrustAdmissionRepositoryV1) {}
	async admit(r: RuntimeProviderTrustAdmissionRequestV1): Promise<RuntimeProviderTrustAdmissionV1> {
		const deny = async (code: RuntimeProviderTrustFailureCodeV1): Promise<never> => {
			try {
				await this.repository.persistDenial({
					denial_id: `runtime-provider-trust-denial:sha256:${(await digest([r?.correlation_id, code, r?.current_time])).slice(0, 32)}`,
					failure_code: code,
					correlation_id: r?.correlation_id ?? 'UNKNOWN',
					recorded_at: r?.current_time ?? new Date(0).toISOString(),
					causal_references: r?.causal_references ?? [],
				});
			} catch {
				throw new RuntimeProviderTrustFailureV1('RUNTIME_PROVIDER_TRUST_AUDIT_FAILED');
			}
			throw new RuntimeProviderTrustFailureV1(code);
		};
		if (
			!r ||
			r.version !== 1 ||
			!r.current_time ||
			!r.correlation_id ||
			r.invocation_consumer !== 'COGNITIVE_PROVIDER_INVOCATION' ||
			r.requested_validity_ms < 1 ||
			r.requested_validity_ms > 30000
		)
			return deny('RUNTIME_PROVIDER_TRUST_REQUEST_INVALID');
		const o = r.oks_eligibility,
			p = r.provider_trust_eligibility,
			b = r.runtime_binding;
		if (!o) return deny('RUNTIME_PROVIDER_TRUST_OKS_REQUIRED');
		if (!p) return deny('RUNTIME_PROVIDER_TRUST_ELIGIBILITY_REQUIRED');
		if (!b) return deny('RUNTIME_PROVIDER_TRUST_REQUEST_INVALID');
		const bindingEvidence=await this.repository.resolveRuntimeBinding(b.binding_id);
		if(!bindingEvidence){await this.repository.auditRuntimeBindingVerification({event_kind:'BINDING_MISSING',binding_id:b.binding_id,outcome:'DENIED',failure_code:'RUNTIME_PROVIDER_TRUST_BINDING_NOT_FOUND',correlation_id:r.correlation_id,recorded_at:r.current_time});return deny('RUNTIME_PROVIDER_TRUST_BINDING_NOT_FOUND');}
		await this.repository.auditRuntimeBindingVerification({event_kind:'BINDING_RESOLVED',binding_id:b.binding_id,outcome:'VERIFIED',correlation_id:r.correlation_id,recorded_at:r.current_time});
		const authoritative=bindingEvidence.binding,canonicalDigest=await canonicalProviderRuntimeBindingDigestV1(authoritative);
		const bindingMismatch=async(code:RuntimeProviderTrustFailureCodeV1):Promise<never>=>{await this.repository.auditRuntimeBindingVerification({event_kind:'BINDING_IDENTITY_MISMATCH',binding_id:b.binding_id,outcome:'DENIED',failure_code:code,correlation_id:r.correlation_id,recorded_at:r.current_time});return deny(code);};
		if(bindingEvidence.binding_digest!==canonicalDigest){await this.repository.auditRuntimeBindingVerification({event_kind:'BINDING_DIGEST_MISMATCH',binding_id:b.binding_id,outcome:'DENIED',failure_code:'RUNTIME_PROVIDER_TRUST_BINDING_DIGEST_MISMATCH',correlation_id:r.correlation_id,recorded_at:r.current_time});return deny('RUNTIME_PROVIDER_TRUST_BINDING_DIGEST_MISMATCH');}
		if(authoritative.provider!==b.provider)return bindingMismatch('RUNTIME_PROVIDER_TRUST_PROVIDER_MISMATCH');
		if(authoritative.provider_account_id!==b.provider_account_id)return bindingMismatch('RUNTIME_PROVIDER_TRUST_ACCOUNT_MISMATCH');
		if(authoritative.provider_deployment_id!==b.provider_deployment_id)return bindingMismatch('RUNTIME_PROVIDER_TRUST_DEPLOYMENT_MISMATCH');
		if(authoritative.adapter_identity!==b.adapter_identity)return bindingMismatch('RUNTIME_PROVIDER_TRUST_ADAPTER_MISMATCH');
		if(authoritative.selected_model!==b.selected_model)return bindingMismatch('RUNTIME_PROVIDER_TRUST_DEPLOYMENT_MISMATCH');
		if(authoritative.credential_reference!==b.credential_reference)return bindingMismatch('RUNTIME_PROVIDER_TRUST_CREDENTIAL_REFERENCE_MISMATCH');
		if(JSON.stringify(authoritative)!==JSON.stringify(b))return bindingMismatch('RUNTIME_PROVIDER_TRUST_BINDING_IDENTITY_MISMATCH');
		if(r.runtime_binding_digest!==canonicalDigest){await this.repository.auditRuntimeBindingVerification({event_kind:'BINDING_DIGEST_MISMATCH',binding_id:b.binding_id,outcome:'DENIED',failure_code:'RUNTIME_PROVIDER_TRUST_BINDING_DIGEST_MISMATCH',correlation_id:r.correlation_id,recorded_at:r.current_time});return deny('RUNTIME_PROVIDER_TRUST_BINDING_DIGEST_MISMATCH');}
		await this.repository.auditRuntimeBindingVerification({event_kind:'BINDING_DIGEST_VERIFIED',binding_id:b.binding_id,outcome:'VERIFIED',correlation_id:r.correlation_id,recorded_at:r.current_time});
		const s = await this.repository.current(r);
		if (!s.oks) return deny('RUNTIME_PROVIDER_TRUST_OKS_INVALID');
		if (!s.pt) return deny('RUNTIME_PROVIDER_TRUST_ELIGIBILITY_INVALID');
		const so = s.oks,
			sp = s.pt;
		if (
			so.outcome !== 'ADMITTED' ||
			so.expires_at <= r.current_time ||
			so.decision_id !== o.decision_id ||
			so.binding_id !== o.binding_id ||
			so.consumption_id !== o.consumption_id
		)
			return deny('RUNTIME_PROVIDER_TRUST_OKS_STALE');
		if (so.projection_digest !== o.projection_digest || so.manifest_id !== o.manifest_id)
			return deny('RUNTIME_PROVIDER_TRUST_PROJECTION_MISMATCH');
		if (
			sp.eligibility_id !== p.eligibility_id ||
			sp.future_consumer !== 'PT_WU3_RUNTIME_PROVIDER_ADMISSION' ||
			sp.expires_at <= r.current_time ||
			sp.evaluation_expires_at <= r.current_time ||
			sp.evaluation_outcome !== 'SATISFIED'
		)
			return deny('RUNTIME_PROVIDER_TRUST_ELIGIBILITY_STALE');
		if (!sp.policy_current || sp.policy_digest !== p.policy_digest) return deny('RUNTIME_PROVIDER_TRUST_POLICY_STALE');
		if (sp.attestation_set_digest !== p.attestation_set_digest || sp.current_attestation_set_digest !== p.attestation_set_digest)
			return deny('RUNTIME_PROVIDER_TRUST_ATTESTATION_SET_STALE');
		if (!sp.account_current || !sp.deployment_current || !sp.mapping_current) return deny('RUNTIME_PROVIDER_TRUST_ELIGIBILITY_STALE');
		if (o.tenant_id !== p.tenant_id || o.company_id !== p.company_id || so.tenant_id !== p.tenant_id || so.company_id !== p.company_id)
			return deny('RUNTIME_PROVIDER_TRUST_CONTEXT_MISMATCH');
		if (sp.provider !== b.provider) return deny('RUNTIME_PROVIDER_TRUST_PROVIDER_MISMATCH');
		if (p.provider_account_id !== b.provider_account_id || sp.provider_account_id !== b.provider_account_id)
			return deny('RUNTIME_PROVIDER_TRUST_ACCOUNT_MISMATCH');
		if (
			!p.provider_deployment_id ||
			p.provider_deployment_id !== b.provider_deployment_id ||
			sp.provider_deployment_id !== b.provider_deployment_id
		)
			return deny('RUNTIME_PROVIDER_TRUST_DEPLOYMENT_MISMATCH');
		if (sp.adapter_identity !== b.adapter_identity) return deny('RUNTIME_PROVIDER_TRUST_ADAPTER_MISMATCH');
		if ((sp.credential_reference ?? 'NOT_APPLICABLE') !== b.credential_reference)
			return deny('RUNTIME_PROVIDER_TRUST_CREDENTIAL_REFERENCE_MISMATCH');
		if (!sp.model_references.includes(b.selected_model)) return deny('RUNTIME_PROVIDER_TRUST_DEPLOYMENT_MISMATCH');
		const c = sp.context;
		if (
			c.tenant_id !== so.tenant_id ||
			c.company_id !== so.company_id ||
			c.purpose !== so.purpose ||
			c.classification !== so.classification ||
			c.sovereignty !== so.sovereignty ||
			c.target_class !== so.target_class ||
			c.processing_region !== so.region
		)
			return deny('RUNTIME_PROVIDER_TRUST_CONTEXT_MISMATCH');
		let effective: EffectiveRuntimeProviderConstraintsV1;
		try {
			effective = this.compose(so, sp);
		} catch {
			return deny('RUNTIME_PROVIDER_TRUST_CONSTRAINT_CONFLICT');
		}
		if (
			b.provider === 'openrouter' &&
			(b.downstream_provider_identity_status === 'UNKNOWN' || b.downstream_deployment_identity_status === 'UNKNOWN') &&
			sp.requirements.some((x) => ['DEPLOYMENT_CLASS', 'PROCESSING_REGION', 'DATA_RESIDENCY'].includes(x.subject))
		)
			return deny('RUNTIME_PROVIDER_TRUST_CONSTRAINT_CONFLICT');
		const subject = {
			tenant_id: o.tenant_id,
			company_id: o.company_id,
			legal_entity_id: p.legal_entity_id,
			oks_decision_id: o.decision_id,
			oks_binding_id: o.binding_id,
			oks_consumption_id: o.consumption_id,
			manifest_id: o.manifest_id,
			projection_digest: o.projection_digest,
			effective_context: effective,
			provider_trust_eligibility_id: p.eligibility_id,
			evaluation_id: p.evaluation_id,
			evaluation_digest: p.evaluation_digest,
			policy_ids: sp.policy_ids,
			policy_versions: sp.policy_versions,
			policy_digest: p.policy_digest,
			attestation_set_digest: p.attestation_set_digest,
			runtime_binding_id: b.binding_id,
			runtime_binding_digest: canonicalDigest,
			provider: b.provider,
			provider_account_id: b.provider_account_id,
			provider_deployment_id: b.provider_deployment_id,
			adapter_identity: b.adapter_identity,
			selected_model: b.selected_model,
			credential_reference: b.credential_reference,
			invocation_consumer: r.invocation_consumer,
		};
		const admissionDigest = await digest(subject),
			admission = deepCopyAndFreeze({
				version: 1,
				admission_id: `runtime-provider-trust-admission:sha256:${admissionDigest.slice(0, 32)}`,
				admission_digest: admissionDigest,
				...subject,
				issued_at: r.current_time,
				expires_at: new Date(Date.parse(r.current_time) + r.requested_validity_ms).toISOString(),
				reservation_id: `runtime-provider-trust-reservation:sha256:${admissionDigest.slice(0, 32)}`,
				correlation_id: r.correlation_id,
				causal_references: [...r.causal_references, o.consumption_id, p.eligibility_id, b.binding_id],
				transport_executed: false,
			}) as RuntimeProviderTrustAdmissionV1;
		try {
			await this.repository.persistAdmission(admission);
		} catch {
			throw new RuntimeProviderTrustFailureV1('RUNTIME_PROVIDER_TRUST_PERSISTENCE_FAILED');
		}
		return admission;
	}
	async consume(
		a: RuntimeProviderTrustAdmissionV1,
		consumer: 'COGNITIVE_PROVIDER_INVOCATION',
		at: string,
	): Promise<ConsumedRuntimeProviderTrustAdmissionV1> {
		if (!a || consumer !== a.invocation_consumer) throw new RuntimeProviderTrustFailureV1('RUNTIME_PROVIDER_TRUST_ADMISSION_DENIED');
		if (a.expires_at <= at) throw new RuntimeProviderTrustFailureV1('RUNTIME_PROVIDER_TRUST_ADMISSION_EXPIRED');
		if (!(await this.repository.reserve(a, consumer, at)))
			throw new RuntimeProviderTrustFailureV1('RUNTIME_PROVIDER_TRUST_ADMISSION_REPLAYED');
		const permit = deepCopyAndFreeze({
			version: 1,
			binding_id: a.runtime_binding_id,
			provider_identity: a.provider,
			provider_account_id: a.provider_account_id,
			provider_deployment_id: a.provider_deployment_id,
			adapter_identity: a.adapter_identity,
			credential_reference: a.credential_reference,
			consumer: 'PROVIDER_CREDENTIAL_RESOLVER',
			authorization_reference: a.admission_id,
			admission_id: a.admission_id,
			admission_digest: a.admission_digest,
			invocation_consumer: consumer,
			expires_at: a.expires_at,
		}) as any;
		return deepCopyAndFreeze({ admission: a, permit, consumed_at: at }) as ConsumedRuntimeProviderTrustAdmissionV1;
	}
	private compose(o: any, p: any): EffectiveRuntimeProviderConstraintsV1 {
		const regions = new Set<string>([p.context.processing_region]),
			classes = new Set<string>([p.deployment_class]);
		let retention: KnowledgeRetentionV1 = o.retention;
		for (const r of p.requirements) {
			if ((r.subject === 'PROCESSING_REGION' || r.subject === 'DATA_RESIDENCY') && r.operator === 'SUBSET_OF') {
				for (const x of [...regions]) if (!r.values.includes(x)) regions.delete(x);
			}
			if (r.subject === 'DEPLOYMENT_CLASS' && r.operator === 'ONE_OF') {
				for (const x of [...classes]) if (!r.values.includes(x as any)) classes.delete(x);
			}
			if (r.subject === 'ZERO_RETENTION' && r.value) retention = 'NO_RETENTION';
		}
		if (!regions.has(o.region) || !classes.size || (p.context.retention !== o.retention && retention !== 'NO_RETENTION'))
			throw new Error('CONFLICT');
		return deepCopyAndFreeze({
			purpose: o.purpose,
			classification: o.classification,
			sovereignty: o.sovereignty,
			target_class: o.target_class,
			processing_regions: [o.region],
			retention,
			deployment_class: p.deployment_class,
		}) as EffectiveRuntimeProviderConstraintsV1;
	}
}
export function asGovernanceDenialV1(error: unknown): ProviderBoundaryFailureV1 {
	return new ProviderBoundaryFailureV1(
		'GOVERNANCE_DENIAL',
		error instanceof RuntimeProviderTrustFailureV1 ? error.code : 'RUNTIME_PROVIDER_TRUST_ADMISSION_DENIED',
	);
}
export async function prepareAdmittedProviderCandidateV1(
	runtime: RuntimeProviderTrustAdmissionRuntimeV1,
	request: RuntimeProviderTrustAdmissionRequestV1,
): Promise<PreparedProviderCandidateV1> {
	try {
		const admission = await runtime.admit(request);
		const consumed = await runtime.consume(admission, 'COGNITIVE_PROVIDER_INVOCATION', request.current_time);
		return deepCopyAndFreeze({
			outcome: 'READY',
			binding_reference: referenceProviderRuntimeBindingV1(request.runtime_binding!),
			credential_resolution_permit: consumed.permit,
			causal_reference: providerRuntimeCausalReferenceV1({
				binding_id: admission.runtime_binding_id,
				binding_digest: admission.runtime_binding_digest,
				admission_id: admission.admission_id,
				admission_digest: admission.admission_digest,
			}),
			security_evidence_context: {
				admission_id: admission.admission_id,
				admission_digest: admission.admission_digest,
				runtime_binding_id: admission.runtime_binding_id,
				runtime_binding_digest: admission.runtime_binding_digest,
				oks_consumption_id: admission.oks_consumption_id,
				correlation_id: admission.correlation_id,
				causal_references: admission.causal_references,
			},
		}) as PreparedProviderCandidateV1;
	} catch (error) {
		throw asGovernanceDenialV1(error);
	}
}
