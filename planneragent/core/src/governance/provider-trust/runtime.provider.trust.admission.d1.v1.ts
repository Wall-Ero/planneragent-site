import {
	RuntimeProviderTrustFailureV1,
	type RuntimeProviderTrustAdmissionRepositoryV1,
	type RuntimeProviderTrustAdmissionRequestV1,
	type RuntimeProviderTrustAdmissionV1,
	type RuntimeProviderTrustCurrentStateV1,
} from './runtime.provider.trust.admission.contracts.v1';
import { ProviderRuntimeBindingD1V1 } from './provider.runtime.repository.d1.v1';
const json = (x: string) => JSON.parse(x);
export class RuntimeProviderTrustAdmissionD1V1 implements RuntimeProviderTrustAdmissionRepositoryV1 {
	constructor(private readonly db: D1Database) {}
	async resolveRuntimeBinding(id:string){return new ProviderRuntimeBindingD1V1(this.db).readBinding(id);}
	async auditRuntimeBindingVerification(e:Parameters<RuntimeProviderTrustAdmissionRepositoryV1['auditRuntimeBindingVerification']>[0]){try{await this.db.prepare('INSERT INTO provider_runtime_binding_evidence_audit VALUES (?,?,?,?,?,?,?)').bind(`binding-evidence-audit:${crypto.randomUUID()}`,e.event_kind,e.binding_id,e.outcome,e.failure_code??null,e.correlation_id,e.recorded_at).run();}catch{throw new RuntimeProviderTrustFailureV1('RUNTIME_PROVIDER_TRUST_AUDIT_FAILED');}}
	async current(r: RuntimeProviderTrustAdmissionRequestV1): Promise<RuntimeProviderTrustCurrentStateV1> {
		const o = r.oks_eligibility,
			p = r.provider_trust_eligibility,
			b = r.runtime_binding;
		if (!o || !p || !b) return {};
		const oks = await this.db
			.prepare(
				'SELECT d.*,c.consumption_id,b.binding_id FROM knowledge_exposure_decisions d JOIN knowledge_exposure_projection_bindings b ON b.decision_id=d.decision_id JOIN knowledge_exposure_consumptions c ON c.decision_id=d.decision_id WHERE d.decision_id=? AND b.binding_id=? AND c.consumption_id=?',
			)
			.bind(o.decision_id, o.binding_id, o.consumption_id)
			.first<any>();
		const e = await this.db
			.prepare(
				'SELECT e.*,p.future_consumer p_future_consumer,p.expires_at p_expires_at,p.eligibility_id FROM provider_trust_evaluations e JOIN provider_trust_eligibilities p ON p.evaluation_id=e.evaluation_id WHERE p.eligibility_id=?',
			)
			.bind(p.eligibility_id)
			.first<any>();
		if (!oks || !e) return { ...(oks ? { oks: this.oks(oks) } : {}) };
		const resolution = await this.db
				.prepare('SELECT * FROM tenant_provider_trust_resolutions WHERE resolution_id=?')
				.bind(e.resolved_policy_id)
				.first<any>(),
			account = await this.db
				.prepare('SELECT * FROM provider_account_identities WHERE provider_account_id=?')
				.bind(e.provider_account_id)
				.first<any>(),
			deployment = await this.db
				.prepare('SELECT * FROM provider_deployment_identities WHERE provider_deployment_id=?')
				.bind(e.provider_deployment_id)
				.first<any>(),
			mapping = await this.db.prepare('SELECT * FROM provider_runtime_mappings WHERE mapping_id=?').bind(b.mapping_id).first<any>(),
			set = await this.db
				.prepare('SELECT attestation_set_digest FROM provider_attestation_sets WHERE provider_account_id=?')
				.bind(e.provider_account_id)
				.first<any>();
		if (!resolution || !account || !deployment || !mapping) return { oks: this.oks(oks) };
		const ids = json(resolution.policy_ids_json) as string[],
			policies = await this.db
				.prepare(
					`SELECT policy_id,policy_version,policy_digest,expires_at FROM tenant_provider_trust_policies WHERE policy_id IN (${ids.map(() => '?').join(',')})`,
				)
				.bind(...ids)
				.all<any>(),
			policyTransitions = await this.db
				.prepare(
					`SELECT policy_id FROM tenant_provider_trust_policy_transitions WHERE policy_id IN (${ids.map(() => '?').join(',')}) LIMIT 1`,
				)
				.bind(...ids)
				.first(),
			transition = async (id: string) =>
				(await this.db
					.prepare(
						'SELECT transition_id FROM provider_attestation_transitions WHERE subject_id=? UNION ALL SELECT transition_id FROM provider_runtime_mapping_transitions WHERE mapping_id=? LIMIT 1',
					)
					.bind(id, id)
					.first()) !== null;
		const policyCurrent =
			policies.results.length === ids.length &&
			!policyTransitions &&
			policies.results.every((x: any) => x.policy_digest === e.policy_digest || resolution.effective_policy_digest === e.policy_digest) &&
			policies.results.every((x: any) => !x.expires_at || x.expires_at > r.current_time);
		return {
			oks: this.oks(oks),
			pt: {
				eligibility_id: e.eligibility_id,
				future_consumer: e.p_future_consumer,
				expires_at: e.p_expires_at,
				evaluation_id: e.evaluation_id,
				evaluation_digest: e.evaluation_digest,
				evaluation_outcome: e.outcome,
				evaluation_expires_at: e.expires_at,
				policy_digest: e.policy_digest,
				policy_ids: ids,
				policy_versions: policies.results.map((x: any) => x.policy_version),
				policy_current: policyCurrent,
				attestation_set_digest: e.attestation_set_digest,
				current_attestation_set_digest: set?.attestation_set_digest ?? '',
				context: json(e.context_json),
				context_digest: e.context_digest,
				requirements: json(resolution.requirements_json),
				provider: account.provider,
				provider_account_id: account.provider_account_id,
				provider_deployment_id: deployment.provider_deployment_id,
				adapter_identity: account.adapter_identity,
				deployment_class: deployment.deployment_class,
				model_references: json(deployment.model_references_json),
				credential_reference: mapping.credential_reference,
				account_current: !(await transition(account.provider_account_id)) && (!account.reverify_at || account.reverify_at > r.current_time),
				deployment_current:
					!(await transition(deployment.provider_deployment_id)) && (!deployment.reverify_at || deployment.reverify_at > r.current_time),
				mapping_current: !(await transition(mapping.mapping_id)) && (!mapping.expires_at || mapping.expires_at > r.current_time),
			},
		};
	}
	async persistAdmission(a: RuntimeProviderTrustAdmissionV1) {
		try {
			await this.db.batch([
				this.db
					.prepare(
						'INSERT INTO runtime_provider_trust_admissions VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
					)
					.bind(
						a.admission_id,
						1,
						a.admission_digest,
						a.tenant_id,
						a.company_id,
						a.legal_entity_id,
						a.oks_decision_id,
						a.oks_binding_id,
						a.oks_consumption_id,
						a.manifest_id,
						a.projection_digest,
						JSON.stringify(a.effective_context),
						a.provider_trust_eligibility_id,
						a.evaluation_id,
						a.evaluation_digest,
						JSON.stringify(a.policy_ids),
						JSON.stringify(a.policy_versions),
						a.policy_digest,
						a.attestation_set_digest,
						a.runtime_binding_id,
						a.runtime_binding_digest,
						a.provider,
						a.provider_account_id,
						a.provider_deployment_id,
						a.adapter_identity,
						a.selected_model,
						a.credential_reference,
						a.issued_at,
						a.expires_at,
						a.reservation_id,
						a.invocation_consumer,
						a.correlation_id,
						JSON.stringify(a.causal_references),
						0,
					),
				this.audit(`audit:${a.admission_id}`, 'ADMISSION_GRANTED', a.admission_id, 'ADMITTED', null, a.correlation_id, a.issued_at),
			]);
		} catch {
			throw new RuntimeProviderTrustFailureV1('RUNTIME_PROVIDER_TRUST_PERSISTENCE_FAILED');
		}
	}
	async persistDenial(d: {
		denial_id: string;
		failure_code: any;
		correlation_id: string;
		recorded_at: string;
		causal_references: readonly string[];
	}) {
		try {
			await this.db.batch([
				this.db
					.prepare('INSERT INTO runtime_provider_trust_denials VALUES (?,?,?,?,?)')
					.bind(d.denial_id, d.failure_code, d.correlation_id, d.recorded_at, JSON.stringify(d.causal_references)),
				this.audit(`audit:${d.denial_id}`, 'ADMISSION_DENIED', d.denial_id, 'DENIED', d.failure_code, d.correlation_id, d.recorded_at),
			]);
		} catch {
			throw new RuntimeProviderTrustFailureV1('RUNTIME_PROVIDER_TRUST_AUDIT_FAILED');
		}
	}
	async reserve(a: RuntimeProviderTrustAdmissionV1, consumer: string, at: string) {
		try {
			await this.db
				.prepare('INSERT INTO runtime_provider_trust_reservations VALUES (?,?,?,?)')
				.bind(a.reservation_id, a.admission_id, consumer, at)
				.run();
			await this.audit(
				`audit:${a.reservation_id}`,
				'ADMISSION_CONSUMED',
				a.admission_id,
				'CONSUMED',
				null,
				a.correlation_id,
				at,
			).run();
			return true;
		} catch (error) {
			if (String(error).includes('UNIQUE')) return false;
			throw error;
		}
	}
	private oks(x: any) {
		return {
			decision_id: x.decision_id,
			binding_id: x.binding_id,
			consumption_id: x.consumption_id,
			outcome: x.outcome,
			tenant_id: x.tenant_id,
			company_id: x.company_id,
			purpose: x.purpose,
			target_class: x.target_class,
			...(x.target_identity ? { target_identity: x.target_identity } : {}),
			region: x.permitted_region,
			retention: x.permitted_retention,
			classification: x.effective_classification,
			sovereignty: x.effective_sovereignty,
			manifest_id: x.manifest_id,
			projection_digest: x.projection_digest,
			expires_at: x.expires_at,
		} as any;
	}
	private audit(id: string, kind: string, subject: string, outcome: string, failure: string | null, correlation: string, at: string) {
		return this.db
			.prepare('INSERT INTO runtime_provider_trust_audit_events VALUES (?,?,?,?,?,?,?)')
			.bind(id, kind, subject, outcome, failure, correlation, at);
	}
}
