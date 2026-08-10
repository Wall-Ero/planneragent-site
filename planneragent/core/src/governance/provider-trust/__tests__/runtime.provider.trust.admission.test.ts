import { describe, expect, it, vi } from 'vitest';
import {createHash} from 'node:crypto';
import {
	DeferredProviderCredentialResolverV1,
	prepareAdmittedProviderCandidateV1,
	RuntimeProviderTrustAdmissionRuntimeV1,
	type RuntimeProviderTrustAdmissionRepositoryV1,
	type RuntimeProviderTrustAdmissionRequestV1,
	type RuntimeProviderTrustCurrentStateV1,
} from '..';
const canonicalProviderRuntimeBindingDigestV1=(x:unknown)=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const NOW = '2026-08-09T10:00:00.000Z',
	LATER = '2026-08-09T10:01:00.000Z';
function request(overrides: Record<string, unknown> = {}): RuntimeProviderTrustAdmissionRequestV1 {
	const oks: any = {
			version: 1,
			decision_id: 'oks:d',
			binding_id: 'oks:b',
			consumption_id: 'oks:c',
			principal_id: 'p',
			session_id: 's',
			membership_id: 'm',
			tenant_id: 'tenant',
			company_id: 'company',
			operation: 'COGNITIVE_EXPOSURE',
			purpose: 'LANGUAGE_REFINEMENT',
			target_class: 'SHARED_REMOTE_PROVIDER',
			target_identity: 'openai:model',
			target_region: 'EU',
			requested_retention: 'NO_RETENTION',
			manifest_id: 'manifest@1',
			projection_digest: 'projection',
			knowledge_digests: ['knowledge'],
			correlation_id: 'c',
			causal_references: [],
			policy_version: 'KNOWLEDGE_EXPOSURE_POLICY_V1',
			consumed_at: NOW,
		},
		pt: any = {
			version: 1,
			eligibility_id: 'pt:e',
			tenant_id: 'tenant',
			company_id: 'company',
			legal_entity_id: 'le',
			policy_digest: 'policy-digest',
			context: {
				version: 1,
				tenant_id: 'tenant',
				company_id: 'company',
				purpose: 'LANGUAGE_REFINEMENT',
				classification: 'CONFIDENTIAL',
				sovereignty: 'EU_ONLY',
				target_class: 'SHARED_REMOTE_PROVIDER',
				processing_region: 'EU',
				retention: 'NO_RETENTION',
			},
			context_digest: 'context',
			provider_account_id: 'account',
			provider_deployment_id: 'deployment',
			attestation_set_digest: 'set',
			evaluation_id: 'evaluation',
			evaluation_digest: 'evaluation-digest',
			allowed_target_class: 'SHARED_REMOTE_PROVIDER',
			future_consumer: 'PT_WU3_RUNTIME_PROVIDER_ADMISSION',
			issued_at: NOW,
			expires_at: LATER,
			correlation_id: 'c',
			causal_references: [],
			executable: false,
		},
		binding: any = {
			version: 1,
			binding_id: 'runtime-binding',
			mapping_id: 'mapping',
			provider: 'openai',
			provider_account_id: 'account',
			provider_deployment_id: 'deployment',
			adapter_identity: 'adapter',
			selected_model: 'model',
			credential_reference: 'secret://providers/openai',
			environment_class: 'PRODUCTION',
			downstream_provider_identity_status: 'PROVEN',
			downstream_deployment_identity_status: 'PROVEN',
			binding_policy_version: 'PROVIDER_RUNTIME_BINDING_POLICY_V1',
			issued_at: NOW,
			correlation_id: 'c',
			causal_references: [],
			admission_granted: false,
			transport_executed: false,
		};
	return {
		version: 1,
		oks_eligibility: oks,
		provider_trust_eligibility: pt,
		runtime_binding: binding,
		runtime_binding_digest: canonicalProviderRuntimeBindingDigestV1(binding),
		invocation_consumer: 'COGNITIVE_PROVIDER_INVOCATION',
		requested_validity_ms: 10000,
		current_time: NOW,
		correlation_id: 'c',
		causal_references: [],
		...overrides,
	} as any;
}
function state(overrides: Record<string, unknown> = {}): RuntimeProviderTrustCurrentStateV1 {
	return {
		oks: {
			decision_id: 'oks:d',
			binding_id: 'oks:b',
			consumption_id: 'oks:c',
			outcome: 'ADMITTED',
			tenant_id: 'tenant',
			company_id: 'company',
			purpose: 'LANGUAGE_REFINEMENT',
			target_class: 'SHARED_REMOTE_PROVIDER',
			target_identity: 'openai:model',
			region: 'EU',
			retention: 'NO_RETENTION',
			classification: 'CONFIDENTIAL',
			sovereignty: 'EU_ONLY',
			manifest_id: 'manifest@1',
			projection_digest: 'projection',
			expires_at: LATER,
		},
		pt: {
			eligibility_id: 'pt:e',
			future_consumer: 'PT_WU3_RUNTIME_PROVIDER_ADMISSION',
			expires_at: LATER,
			evaluation_id: 'evaluation',
			evaluation_digest: 'evaluation-digest',
			evaluation_outcome: 'SATISFIED',
			evaluation_expires_at: LATER,
			policy_digest: 'policy-digest',
			policy_ids: ['policy'],
			policy_versions: [1],
			policy_current: true,
			attestation_set_digest: 'set',
			current_attestation_set_digest: 'set',
			context: {
				version: 1,
				tenant_id: 'tenant',
				company_id: 'company',
				purpose: 'LANGUAGE_REFINEMENT',
				classification: 'CONFIDENTIAL',
				sovereignty: 'EU_ONLY',
				target_class: 'SHARED_REMOTE_PROVIDER',
				processing_region: 'EU',
				retention: 'NO_RETENTION',
			},
			context_digest: 'context',
			requirements: [{ requirement_id: 'retention', subject: 'RETENTION_LIMIT', operator: 'MAXIMUM', maximum_days: 30 }],
			provider: 'openai',
			provider_account_id: 'account',
			provider_deployment_id: 'deployment',
			adapter_identity: 'adapter',
			deployment_class: 'SHARED_REMOTE_PROVIDER',
			model_references: ['model'],
			credential_reference: 'secret://providers/openai',
			account_current: true,
			deployment_current: true,
			mapping_current: true,
		},
		...overrides,
	} as any;
}
class Repo implements RuntimeProviderTrustAdmissionRepositoryV1 {
	snapshot = state();
	binding=request().runtime_binding!;
	admissions: any[] = [];
	denials: any[] = [];
	used = false;
	async resolveRuntimeBinding(id:string){return id===this.binding.binding_id?{version:1 as const,binding:this.binding,binding_digest:canonicalProviderRuntimeBindingDigestV1(this.binding)}:null;}
	async auditRuntimeBindingVerification(){}
	async current() {
		return this.snapshot;
	}
	async persistAdmission(a: any) {
		this.admissions.push(a);
	}
	async persistDenial(d: any) {
		this.denials.push(d);
	}
	async reserve() {
		if (this.used) return false;
		this.used = true;
		return true;
	}
}
const fails = async (p: Promise<unknown>, code: string) => expect(p).rejects.toMatchObject({ code });
describe('PT-WU3C runtime provider trust admission', () => {
	it('admits only valid OKS, PT and exact binding with most-restrictive context', async () => {
		const repo = new Repo(),
			a = await new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request());
		expect(a).toMatchObject({
			tenant_id: 'tenant',
			provider: 'openai',
			transport_executed: false,
			effective_context: { retention: 'NO_RETENTION', processing_regions: ['EU'] },
		});
		expect(a.admission_digest).toMatch(/^[0-9a-f]{64}$/);
		expect(Object.isFrozen(a)).toBe(true);
	});
	it('requires both independent gates', async () => {
		for (const changes of [
			{ oks_eligibility: undefined },
			{ provider_trust_eligibility: undefined },
			{ oks_eligibility: undefined, provider_trust_eligibility: undefined },
		]) {
			const repo = new Repo();
			await expect(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request(changes))).rejects.toBeInstanceOf(Error);
		}
	});
	it('denies stale OKS and stale or non-satisfied PT', async () => {
		let repo = new Repo();
		repo.snapshot = state({ oks: { ...state().oks!, expires_at: NOW } });
		await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request()), 'RUNTIME_PROVIDER_TRUST_OKS_STALE');
		for (const outcome of ['DENIED', 'INSUFFICIENT_EVIDENCE']) {
			repo = new Repo();
			repo.snapshot = state({ pt: { ...state().pt!, evaluation_outcome: outcome } });
			await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request()), 'RUNTIME_PROVIDER_TRUST_ELIGIBILITY_STALE');
		}
	});
	it('denies stale policy and attestation set', async () => {
		let repo = new Repo();
		repo.snapshot = state({ pt: { ...state().pt!, policy_current: false } });
		await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request()), 'RUNTIME_PROVIDER_TRUST_POLICY_STALE');
		repo = new Repo();
		repo.snapshot = state({ pt: { ...state().pt!, current_attestation_set_digest: 'changed' } });
		await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request()), 'RUNTIME_PROVIDER_TRUST_ATTESTATION_SET_STALE');
	});
	it('denies projection substitution', async () => {
		const repo = new Repo();
		repo.snapshot = state({ oks: { ...state().oks!, projection_digest: 'changed' } });
		await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request()), 'RUNTIME_PROVIDER_TRUST_PROJECTION_MISMATCH');
	});
	it('denies tenant, purpose, classification, sovereignty, target and region incoherence', async () => {
		for (const [field, value] of [
			['tenant_id', 'other'],
			['purpose', 'TRANSLATION'],
			['classification', 'PUBLIC'],
			['sovereignty', 'GLOBAL'],
			['target_class', 'LOCAL_SELF_HOSTED_MODEL'],
			['processing_region', 'US'],
		]) {
			const repo = new Repo();
			repo.snapshot = state({ pt: { ...state().pt!, context: { ...state().pt!.context, [field]: value } } });
			await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request()), 'RUNTIME_PROVIDER_TRUST_CONTEXT_MISMATCH');
		}
	});
	it('denies provider, account, deployment, adapter, credential and model substitution', async () => {
		for (const [field, value, code] of [
			['provider', 'anthropic', 'RUNTIME_PROVIDER_TRUST_PROVIDER_MISMATCH'],
			['provider_account_id', 'other', 'RUNTIME_PROVIDER_TRUST_ACCOUNT_MISMATCH'],
			['provider_deployment_id', 'other', 'RUNTIME_PROVIDER_TRUST_DEPLOYMENT_MISMATCH'],
			['adapter_identity', 'other', 'RUNTIME_PROVIDER_TRUST_ADAPTER_MISMATCH'],
			['credential_reference', 'secret://other', 'RUNTIME_PROVIDER_TRUST_CREDENTIAL_REFERENCE_MISMATCH'],
		]) {
			const q = request(),
				repo = new Repo();
			(q.runtime_binding as any)[field] = value;
			await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(q), code as string);
		}
		const repo = new Repo();
		repo.snapshot = state({ pt: { ...state().pt!, model_references: ['other'] } });
		await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request()), 'RUNTIME_PROVIDER_TRUST_DEPLOYMENT_MISMATCH');
	});
	it('denies empty region and deployment intersections', async () => {
		for (const requirement of [
			{ requirement_id: 'r', subject: 'PROCESSING_REGION', operator: 'SUBSET_OF', values: ['US'] },
			{ requirement_id: 'd', subject: 'DEPLOYMENT_CLASS', operator: 'ONE_OF', values: ['LOCAL_SELF_HOSTED_MODEL'] },
		]) {
			const repo = new Repo();
			repo.snapshot = state({ pt: { ...state().pt!, requirements: [requirement] } });
			await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request()), 'RUNTIME_PROVIDER_TRUST_CONSTRAINT_CONFLICT');
		}
	});
	it('does not infer OpenRouter downstream facts', async () => {
		const q = request();
		(q.runtime_binding as any).provider = 'openrouter';
		const repo = new Repo();
		repo.snapshot = state({
			pt: {
				...state().pt!,
				provider: 'openrouter',
				requirements: [{ requirement_id: 'r', subject: 'PROCESSING_REGION', operator: 'SUBSET_OF', values: ['EU'] }],
			},
		});
		(q.runtime_binding as any).downstream_provider_identity_status = 'UNKNOWN';
		repo.binding=q.runtime_binding!;
		(q as any).runtime_binding_digest=canonicalProviderRuntimeBindingDigestV1(repo.binding);
		await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(q), 'RUNTIME_PROVIDER_TRUST_CONSTRAINT_CONFLICT');
	});
	it('is short-lived, atomic and single-use', async () => {
		const repo = new Repo(),
			runtime = new RuntimeProviderTrustAdmissionRuntimeV1(repo),
			a = await runtime.admit(request());
		expect(Date.parse(a.expires_at) - Date.parse(a.issued_at)).toBe(10000);
		const xs = await Promise.allSettled([
			runtime.consume(a, 'COGNITIVE_PROVIDER_INVOCATION', NOW),
			runtime.consume(a, 'COGNITIVE_PROVIDER_INVOCATION', NOW),
		]);
		expect(xs.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
		await fails(runtime.consume(a, 'COGNITIVE_PROVIDER_INVOCATION', NOW), 'RUNTIME_PROVIDER_TRUST_ADMISSION_REPLAYED');
	});
	it('denies expiry and wrong consumer before permit issuance', async () => {
		const repo = new Repo(),
			runtime = new RuntimeProviderTrustAdmissionRuntimeV1(repo),
			a = await runtime.admit(request());
		await fails(runtime.consume(a, 'OTHER' as any, NOW), 'RUNTIME_PROVIDER_TRUST_ADMISSION_DENIED');
		await fails(runtime.consume(a, 'COGNITIVE_PROVIDER_INVOCATION', a.expires_at), 'RUNTIME_PROVIDER_TRUST_ADMISSION_EXPIRED');
	});
	it('issues a real admission-bound credential permit', async () => {
		const repo = new Repo(),
			runtime = new RuntimeProviderTrustAdmissionRuntimeV1(repo),
			a = await runtime.admit(request()),
			c = await runtime.consume(a, 'COGNITIVE_PROVIDER_INVOCATION', NOW);
		expect(c.permit).toMatchObject({
			admission_id: a.admission_id,
			admission_digest: a.admission_digest,
			binding_id: a.runtime_binding_id,
			expires_at: a.expires_at,
		});
	});
	it('prepares a provider candidate bound to the admitted runtime state', async () => {
		const candidate = await prepareAdmittedProviderCandidateV1(
			new RuntimeProviderTrustAdmissionRuntimeV1(new Repo()),
			request(),
		);
		expect(candidate).toMatchObject({
			outcome: 'READY',
			credential_resolution_permit: {
				consumer: 'PROVIDER_CREDENTIAL_RESOLVER',
				invocation_consumer: 'COGNITIVE_PROVIDER_INVOCATION',
			},
			causal_reference: {
				provider_runtime_binding_id: 'runtime-binding',
				provider_runtime_binding_digest: canonicalProviderRuntimeBindingDigestV1(request().runtime_binding!),
			},
		});
		expect(candidate.credential_resolution_permit.authorization_reference).toBe(
			candidate.causal_reference.provider_trust_admission_id,
		);
	});
	it('performs zero secret reads for denied, stale and replayed admissions', async () => {
		const read = vi.fn(() => 'secret'),
			resolver = new DeferredProviderCredentialResolverV1({ 'secret://providers/openai': read }, () => NOW),
			repo = new Repo(),
			runtime = new RuntimeProviderTrustAdmissionRuntimeV1(repo);
		await fails(runtime.admit(request({ provider_trust_eligibility: undefined })), 'RUNTIME_PROVIDER_TRUST_ELIGIBILITY_REQUIRED');
		expect(read).not.toHaveBeenCalled();
		const a = await runtime.admit(request()),
			c = await runtime.consume(a, 'COGNITIVE_PROVIDER_INVOCATION', NOW);
		expect(
			await resolver.resolve(
				{
					version: 1,
					binding_id: a.runtime_binding_id,
					mapping_id: 'mapping',
					provider_identity: a.provider,
					provider_account_id: a.provider_account_id,
					provider_deployment_id: a.provider_deployment_id,
					adapter_identity: a.adapter_identity,
					selected_model: a.selected_model,
					credential_reference: a.credential_reference,
				},
				c.permit,
			),
		).toBe('secret');
		await fails(runtime.consume(a, 'COGNITIVE_PROVIDER_INVOCATION', NOW), 'RUNTIME_PROVIDER_TRUST_ADMISSION_REPLAYED');
		expect(read).toHaveBeenCalledOnce();
	});
	it('keeps admission, denial and audit inputs content-free and provider-neutral', async () => {
		const repo = new Repo(),
			a = await new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request());
		expect(JSON.stringify([a, ...repo.admissions, ...repo.denials])).not.toMatch(
			/prompt|projection content|secret-value|provider response|nationality|price/i,
		);
		expect(JSON.stringify(a)).not.toMatch(/openai.*trusted/i);
	});
	it('credentialless local still requires both gates and admission', async () => {
		const q = request();
		(q.runtime_binding as any).provider = 'oss';
		(q.runtime_binding as any).credential_reference = 'NOT_APPLICABLE';
		(q.runtime_binding as any).selected_model = 'oss';
		const repo = new Repo();
		repo.binding=q.runtime_binding!;
		(q as any).runtime_binding_digest=canonicalProviderRuntimeBindingDigestV1(repo.binding);
		repo.snapshot = state({ pt: { ...state().pt!, provider: 'oss', credential_reference: undefined, model_references: ['oss'] } });
		const runtime = new RuntimeProviderTrustAdmissionRuntimeV1(repo),
			a = await runtime.admit(q),
			c = await runtime.consume(a, 'COGNITIVE_PROVIDER_INVOCATION', NOW);
		expect(
			await new DeferredProviderCredentialResolverV1({}, () => NOW).resolve(
				{
					version: 1,
					binding_id: a.runtime_binding_id,
					mapping_id: 'mapping',
					provider_identity: a.provider,
					provider_account_id: a.provider_account_id,
					provider_deployment_id: a.provider_deployment_id,
					adapter_identity: a.adapter_identity,
					selected_model: a.selected_model,
					credential_reference: 'NOT_APPLICABLE',
				},
				c.permit,
			),
		).toBeUndefined();
	});
	it('denies missing, mismatched and consistently forged binding provenance',async()=>{let repo=new Repo();repo.resolveRuntimeBinding=async()=>null;await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request()),'RUNTIME_PROVIDER_TRUST_BINDING_NOT_FOUND');repo=new Repo();const wrong=request();(wrong.runtime_binding as any).binding_id='other';await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(wrong),'RUNTIME_PROVIDER_TRUST_BINDING_NOT_FOUND');repo=new Repo();await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(request({runtime_binding_digest:'f'.repeat(64)})),'RUNTIME_PROVIDER_TRUST_BINDING_DIGEST_MISMATCH');repo=new Repo();const forged=request();(forged.runtime_binding as any).selected_model='forged';(forged as any).runtime_binding_digest=canonicalProviderRuntimeBindingDigestV1(forged.runtime_binding!);await fails(new RuntimeProviderTrustAdmissionRuntimeV1(repo).admit(forged),'RUNTIME_PROVIDER_TRUST_DEPLOYMENT_MISMATCH');});
});
