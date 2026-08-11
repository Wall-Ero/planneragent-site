import { deepCopyAndFreeze } from '../knowledge-exposure/knowledge.projection.guard.v1';
import { canonicalProviderRuntimeBindingDigestV1 } from '../provider-trust/provider.precredential.boundary.v1';
import type { SecurityEvidenceCompositionFailureCodeV1, SecurityEvidenceEdgeV1, SecurityEvidenceOperationOutcomeV1 } from './security.evidence.composition.contracts.v1';
import { createSecurityEvidenceCompositionV1 } from './security.evidence.composition.v1';
import type { SecurityEvidenceComposerInputV1, SecurityEvidenceCompositionRuntimeResultV1, SecurityEvidenceMissingClassV1 } from './security.evidence.composer.contracts.v1';

const cognitive = new Set(['LANGUAGE_REFINEMENT', 'TRANSLATION', 'EXPLANATION', 'STRUCTURED_EXTRACTION']);
const unique = <T>(xs: readonly T[], key: (x: T) => string) => new Map(xs.map(x => [key(x), x]));
const time = (x: string) => Date.parse(x);
const edge = (id:string, source:SecurityEvidenceEdgeV1['source'], target:SecurityEvidenceEdgeV1['target'], integrity:SecurityEvidenceEdgeV1['integrity'], relation:string, at?:string):SecurityEvidenceEdgeV1 => ({ version:1, edge_id:id, source, target, integrity, causal_relation:relation, ...(at?{referenced_at:at}:{}) });

export function createSecurityEvidenceCompositionResultV1(result: SecurityEvidenceCompositionRuntimeResultV1): SecurityEvidenceCompositionRuntimeResultV1 {
	if ((result.result === 'VERIFIED' && (!result.composition || result.failures.length || result.missing_evidence.length)) ||
		(result.result === 'INCOMPLETE' && (result.composition !== undefined || !result.missing_evidence.length)) ||
		(result.result === 'DENIED' && !result.failures.length))
		throw new Error('SECURITY_COMPOSITION_IDENTITY_MISMATCH');
	return deepCopyAndFreeze(result);
}

export async function composeSecurityEvidenceV1(input: SecurityEvidenceComposerInputV1): Promise<SecurityEvidenceCompositionRuntimeResultV1> {
	const denied = new Set<SecurityEvidenceCompositionFailureCodeV1>(), missing = new Set<SecurityEvidenceMissingClassV1>();
	const deny = (x:SecurityEvidenceCompositionFailureCodeV1) => denied.add(x), miss = (x:SecurityEvidenceMissingClassV1, f:SecurityEvidenceCompositionFailureCodeV1) => { missing.add(x); if (!denied.size) void f; };
	if (!input.oks_request || !input.oks_decision || !input.oks_eligibility) miss('OKS_EVIDENCE','SECURITY_COMPOSITION_INCOMPLETE');
	if (!input.attempts.length) miss('RUNTIME_ATTEMPT','SECURITY_COMPOSITION_INCOMPLETE');
	const request=input.oks_request, decision=input.oks_decision, eligibility=input.oks_eligibility;
	const purpose=decision?.purpose;
	if (decision && (decision.request_id!==input.oks_request_id || decision.outcome!=='ADMITTED')) deny('SECURITY_COMPOSITION_OKS_REQUEST_MISMATCH');
	if (request && decision) {
		if(request.participation.principal_id!==decision.principal_id)deny('SECURITY_COMPOSITION_PRINCIPAL_MISMATCH');
		if(request.participation.session_id!==decision.session_id)deny('SECURITY_COMPOSITION_SESSION_MISMATCH');
		if(request.participation.tenant_id!==decision.tenant_id)deny('SECURITY_COMPOSITION_TENANT_MISMATCH');
		if(request.participation.company_id!==decision.company_id)deny('SECURITY_COMPOSITION_COMPANY_MISMATCH');
		if(request.purpose.code!==decision.purpose)deny('SECURITY_COMPOSITION_IDENTITY_MISMATCH');
		if(request.projection.projection_digest!==decision.projection_digest)deny('SECURITY_COMPOSITION_PROJECTION_MISMATCH');
	}
	if (eligibility && decision) {
		if(eligibility.decision_id!==decision.decision_id)deny('SECURITY_COMPOSITION_OKS_DECISION_MISMATCH');
		if(eligibility.projection_digest!==decision.projection_digest)deny('SECURITY_COMPOSITION_PROJECTION_MISMATCH');
		if(eligibility.purpose!==decision.purpose)deny('SECURITY_COMPOSITION_IDENTITY_MISMATCH');
		if(eligibility.tenant_id!==decision.tenant_id)deny('SECURITY_COMPOSITION_TENANT_MISMATCH');
		if(eligibility.company_id!==decision.company_id)deny('SECURITY_COMPOSITION_COMPANY_MISMATCH');
	}
	const oa=input.organizational_authority_applicability, p9=input.p9_applicability;
	if(!oa||!p9)miss('APPLICABILITY_EVIDENCE','SECURITY_COMPOSITION_INCOMPLETE');
	if(oa&&decision){
		const required=purpose==='CUSTOMER_QUOTATION_DISCLOSURE', expectedStatus=required?'APPLICABLE':'NOT_APPLICABLE';
		if((!required&&!cognitive.has(String(purpose)))||oa.domain!=='ORGANIZATIONAL_AUTHORITY'||oa.status!==expectedStatus||oa.request_id!==decision.request_id||oa.decision_id!==decision.decision_id||oa.purpose!==purpose||oa.projection_digest!==decision.projection_digest)deny('SECURITY_COMPOSITION_AUTHORITY_APPLICABILITY_CONFLICT');
		if(required&&!input.authority_evidence)miss('AUTHORITY_EVIDENCE','SECURITY_COMPOSITION_AUTHORITY_REQUIRED');
		if(!required&&input.authority_evidence)deny('SECURITY_COMPOSITION_AUTHORITY_APPLICABILITY_CONFLICT');
	}
	if(p9&&decision&&(p9.domain!=='P9'||p9.status!=='NOT_APPLICABLE'||p9.request_id!==decision.request_id||p9.decision_id!==decision.decision_id||p9.projection_digest!==decision.projection_digest))deny('SECURITY_COMPOSITION_P9_APPLICABILITY_MISMATCH');
	if(input.unexpected_p9_evidence_ids?.length)deny('SECURITY_COMPOSITION_P9_REFERENCE_INVALID');
	const authority=input.authority_evidence;
	if(authority&&decision&&oa){
		if(authority.request_id!==decision.request_id||authority.decision_id!==decision.decision_id||authority.purpose!==decision.purpose||authority.projection_digest!==decision.projection_digest)deny('SECURITY_COMPOSITION_AUTHORITY_MISMATCH');
		if(authority.principal_id!==decision.principal_id)deny('SECURITY_COMPOSITION_PRINCIPAL_MISMATCH');
		if(authority.tenant_id!==decision.tenant_id)deny('SECURITY_COMPOSITION_TENANT_MISMATCH');
		if(authority.company_id!==decision.company_id)deny('SECURITY_COMPOSITION_COMPANY_MISMATCH');
		if(input.expected_oag_actor_id&&authority.oag_actor_id!==input.expected_oag_actor_id)deny('SECURITY_COMPOSITION_AUTHORITY_MISMATCH');
		if(!authority.authority_proof_id||!authority.authority_proof_digest||!authority.graph_version||!authority.graph_digest||authority.authority_policy_id!=='OAG_AUTHORITY_POLICY_V2'||authority.authority_policy_version!==2)deny('SECURITY_COMPOSITION_AUTHORITY_MISMATCH');
	}
	const attempts=[...input.attempts].sort((a,b)=>a.sequence-b.sequence||a.attempt_id.localeCompare(b.attempt_id));
	if(unique(attempts,x=>x.attempt_id).size!==attempts.length||unique(attempts,x=>String(x.sequence)).size!==attempts.length)deny('SECURITY_COMPOSITION_ATTEMPT_MISMATCH');
	const admissions=unique(input.pt_admissions,x=>x.admission_id), bindings=unique(input.authoritative_runtime_bindings,x=>x.binding.binding_id), credentials=unique(input.credential_evidence,x=>x.evidence_id), transports=unique(input.transport_evidence,x=>x.evidence_id);
	for(const [items,map] of [[input.pt_admissions,admissions],[input.authoritative_runtime_bindings,bindings],[input.credential_evidence,credentials],[input.transport_evidence,transports]] as const)if(map.size!==items.length){for(const [id,value] of map)if(items.filter((x:any)=>(x.admission_id??x.binding?.binding_id??x.evidence_id)===id).some(x=>JSON.stringify(x)!==JSON.stringify(value)))deny('SECURITY_COMPOSITION_IDENTITY_MISMATCH');}
	const canonicalDigests=new Map<string,string>();
	for(const b of input.authoritative_runtime_bindings){const d=await canonicalProviderRuntimeBindingDigestV1(b.binding);canonicalDigests.set(b.binding.binding_id,d);if(d!==b.binding_digest)deny('SECURITY_COMPOSITION_RUNTIME_BINDING_DIGEST_MISMATCH');}
	for(const a of attempts){
		if(a.request_id!==input.request_id)deny('SECURITY_COMPOSITION_ATTEMPT_MISMATCH');
		const pre=['GOVERNANCE_DENIED','CONFIGURATION_FAILED'].includes(a.outcome), needsTransport=['TRANSPORT_SUCCEEDED','TRANSPORT_FAILED','CREDENTIAL_NOT_APPLICABLE'].includes(a.outcome);
		if(pre&&a.transport_evidence_id)deny('SECURITY_COMPOSITION_TRANSPORT_MISMATCH');
		if(needsTransport&&!a.transport_evidence_id)miss('TRANSPORT_EVIDENCE','SECURITY_COMPOSITION_INCOMPLETE');
		if(a.transport_evidence_id){const t=transports.get(a.transport_evidence_id);if(!t)miss('TRANSPORT_EVIDENCE','SECURITY_COMPOSITION_INCOMPLETE');else if(t.status!==(a.outcome==='TRANSPORT_FAILED'?'FAILED':'SUCCEEDED')||t.decision_id!==decision?.decision_id||t.binding_id!==eligibility?.binding_id||t.consumption_id!==eligibility?.consumption_id||t.projection_digest!==decision?.projection_digest||t.provider!==a.provider||t.model!==a.model)deny('SECURITY_COMPOSITION_TRANSPORT_MISMATCH');}
		if(pre&&!a.admission_id)continue;
		if(!a.admission_id){miss('PT_ADMISSION','SECURITY_COMPOSITION_INCOMPLETE');continue;} const admission=admissions.get(a.admission_id);
		if(!admission)miss('PT_ADMISSION','SECURITY_COMPOSITION_INCOMPLETE');else{
			if(a.admission_digest!==admission.admission_digest||admission.oks_decision_id!==decision?.decision_id||admission.oks_binding_id!==eligibility?.binding_id||admission.oks_consumption_id!==eligibility?.consumption_id)deny('SECURITY_COMPOSITION_PT_ADMISSION_MISMATCH');
			const binding=bindings.get(admission.runtime_binding_id);if(!binding)miss('RUNTIME_BINDING','SECURITY_COMPOSITION_INCOMPLETE');else{
				const d=canonicalDigests.get(binding.binding.binding_id)!;
				if(admission.runtime_binding_digest!==d||a.runtime_binding_id!==binding.binding.binding_id||a.runtime_binding_digest!==d)deny('SECURITY_COMPOSITION_RUNTIME_BINDING_DIGEST_MISMATCH');
				if(a.provider!==binding.binding.provider||a.provider_account_id!==binding.binding.provider_account_id||a.provider_deployment_id!==binding.binding.provider_deployment_id||a.adapter_identity!==binding.binding.adapter_identity||a.model!==binding.binding.selected_model)deny('SECURITY_COMPOSITION_RUNTIME_BINDING_MISMATCH');
				if(a.credential_access_evidence_id){const c=credentials.get(a.credential_access_evidence_id);if(!c)miss('CREDENTIAL_EVIDENCE','SECURITY_COMPOSITION_INCOMPLETE');else{
					if(c.admission_id!==admission.admission_id||c.admission_digest!==admission.admission_digest||c.runtime_binding_id!==binding.binding.binding_id||c.runtime_binding_digest!==d||c.provider!==binding.binding.provider||c.provider_account_id!==binding.binding.provider_account_id||c.provider_deployment_id!==binding.binding.provider_deployment_id||c.adapter_identity!==binding.binding.adapter_identity||c.credential_reference!==binding.binding.credential_reference)deny('SECURITY_COMPOSITION_CREDENTIAL_EVIDENCE_MISMATCH');
					if(time(admission.issued_at)>time(c.attempted_at))deny('SECURITY_COMPOSITION_TEMPORAL_ORDER_INVALID'); const t=a.transport_evidence_id?transports.get(a.transport_evidence_id):undefined;if(t&&time(c.completed_at)>time(t.dispatched_at))deny('SECURITY_COMPOSITION_TEMPORAL_ORDER_INVALID');
				}}else if(!pre)miss('CREDENTIAL_EVIDENCE','SECURITY_COMPOSITION_INCOMPLETE');
			}
		}
		const t=a.transport_evidence_id?transports.get(a.transport_evidence_id):undefined;if(t&&time(t.dispatched_at)>time(a.completed_at))deny('SECURITY_COMPOSITION_TEMPORAL_ORDER_INVALID');
		if(time(a.completed_at)>time(input.composed_at))deny('SECURITY_COMPOSITION_TEMPORAL_ORDER_INVALID');
	}
	const attemptMap=unique(attempts,x=>x.attempt_id), fallbackMap=unique(input.fallback_edges,x=>x.lineage_id);
	if(fallbackMap.size!==input.fallback_edges.length)deny('SECURITY_COMPOSITION_FALLBACK_LINEAGE_INVALID');
	for(const f of input.fallback_edges){const a=attemptMap.get(f.predecessor_attempt_id),b=attemptMap.get(f.successor_attempt_id);if(!a||!b||a.request_id!==input.request_id||b.request_id!==input.request_id||a.attempt_id===b.attempt_id||a.outcome!=='TRANSPORT_FAILED'||a.failure_class!=='TECHNICAL'||b.predecessor_attempt_id!==a.attempt_id||a.sequence>=b.sequence||time(a.completed_at)>time(b.started_at))deny('SECURITY_COMPOSITION_FALLBACK_LINEAGE_INVALID');}
	for(const a of attempts)if(a.predecessor_attempt_id&&!input.fallback_edges.some(f=>f.predecessor_attempt_id===a.predecessor_attempt_id&&f.successor_attempt_id===a.attempt_id))miss('FALLBACK_EDGE','SECURITY_COMPOSITION_INCOMPLETE');
	const seen=new Set<string>();for(const a of attempts){let x:typeof a|undefined=a;seen.clear();while(x?.predecessor_attempt_id){if(seen.has(x.attempt_id)){deny('SECURITY_COMPOSITION_FALLBACK_LINEAGE_INVALID');break;}seen.add(x.attempt_id);x=attemptMap.get(x.predecessor_attempt_id);}}
	if(denied.size)return result('DENIED'); if(missing.size)return result('INCOMPLETE'); return result('VERIFIED');
	function result(state:'VERIFIED'|'DENIED'|'INCOMPLETE'):SecurityEvidenceCompositionRuntimeResultV1{
		const failures=state==='DENIED'?[...denied].sort():state==='INCOMPLETE'?[...new Set<SecurityEvidenceCompositionFailureCodeV1>([...missing].map(x=>x==='AUTHORITY_EVIDENCE'?'SECURITY_COMPOSITION_AUTHORITY_REQUIRED':'SECURITY_COMPOSITION_INCOMPLETE'))].sort():[];
		const final=outcome(attempts,input.fallback_edges.length,input.credential_evidence); let composition;
		if(state!=='INCOMPLETE'&&!missing.size&&request&&decision&&eligibility&&oa&&p9){
			const edges:SecurityEvidenceEdgeV1[]=[edge(`edge:${decision.request_id}:${decision.decision_id}`,{domain:'OKS_REQUEST',evidence_id:decision.request_id},{domain:'OKS_DECISION',evidence_id:decision.decision_id},'IDENTITY_REFERENCED','REQUEST_DECIDED',decision.issued_at),edge(`edge:${decision.decision_id}:${eligibility.consumption_id}`,{domain:'OKS_DECISION',evidence_id:decision.decision_id},{domain:'OKS_CONSUMPTION',evidence_id:eligibility.consumption_id},'DIGEST_BOUND','DECISION_CONSUMED',eligibility.consumed_at),edge(`edge:applicability:${oa.applicability_id}`,{domain:'AUTHORITY_APPLICABILITY',evidence_id:oa.applicability_id},{domain:'OKS_DECISION',evidence_id:decision.decision_id},'APPLICABILITY_ASSERTED','AUTHORITY_CLASSIFIED',oa.recorded_at),edge(`edge:p9:${p9.applicability_id}`,{domain:'P9_APPLICABILITY',evidence_id:p9.applicability_id},{domain:'OKS_DECISION',evidence_id:decision.decision_id},'APPLICABILITY_ASSERTED','P9_CLASSIFIED',p9.recorded_at)];
			for(const a of attempts){if(a.admission_id)edges.push(edge(`edge:${a.admission_id}:${a.attempt_id}`,{domain:'PT_ADMISSION',evidence_id:a.admission_id,digest:a.admission_digest},{domain:'RUNTIME_ATTEMPT',evidence_id:a.attempt_id},'DIGEST_BOUND','ADMISSION_ATTEMPTED',a.started_at));if(a.credential_access_evidence_id)edges.push(edge(`edge:${a.credential_access_evidence_id}:${a.attempt_id}`,{domain:'CREDENTIAL_ACCESS',evidence_id:a.credential_access_evidence_id},{domain:'RUNTIME_ATTEMPT',evidence_id:a.attempt_id},'IDENTITY_REFERENCED','CREDENTIAL_USED',a.started_at));if(a.transport_evidence_id)edges.push(edge(`edge:${a.attempt_id}:${a.transport_evidence_id}`,{domain:'RUNTIME_ATTEMPT',evidence_id:a.attempt_id},{domain:'COGNITIVE_TRANSPORT',evidence_id:a.transport_evidence_id},'IDENTITY_REFERENCED','TRANSPORT_RECORDED',a.completed_at));}
			try { composition=createSecurityEvidenceCompositionV1({version:1,request_id:input.request_id,principal_id:String(decision.principal_id),session_id:String(decision.session_id),tenant_id:String(decision.tenant_id),company_id:String(decision.company_id),oks_request_id:input.oks_request_id,oks_decision_id:decision.decision_id,projection_id:eligibility.manifest_id,projection_digest:String(decision.projection_digest),oks_consumption_id:eligibility.consumption_id,organizational_authority:{applicability_evidence_id:oa.applicability_id,requirement:purpose==='CUSTOMER_QUOTATION_DISCLOSURE'?'REQUIRED':'NOT_APPLICABLE',...(authority?{authority_evidence_id:authority.evidence_id,authority_proof_id:authority.authority_proof_id,authority_proof_digest:authority.authority_proof_digest}:{})},p9:{applicability_evidence_id:p9.applicability_id,status:'NOT_APPLICABLE'},pt_admissions:[...admissions.values()].map(a=>({admission_id:a.admission_id,admission_digest:a.admission_digest})),runtime_bindings:[...bindings.values()].map(b=>({runtime_binding_id:b.binding.binding_id,runtime_binding_digest:b.binding_digest})),credential_access_evidence_ids:[...credentials.values()].map(c=>c.evidence_id),attempts:attempts.map(a=>({attempt_id:a.attempt_id,sequence:a.sequence,outcome:a.outcome,...(a.predecessor_attempt_id?{predecessor_attempt_id:a.predecessor_attempt_id}:{}),...(a.admission_id?{admission_id:a.admission_id,admission_digest:a.admission_digest}:{}),...(a.runtime_binding_id?{runtime_binding_id:a.runtime_binding_id,runtime_binding_digest:a.runtime_binding_digest}:{}),...(a.credential_access_evidence_id?{credential_access_evidence_id:a.credential_access_evidence_id}:{}),...(a.transport_evidence_id?{transport_evidence_id:a.transport_evidence_id}:{})})),transport_evidence_ids:[...transports.values()].map(t=>t.evidence_id),fallback_edges:input.fallback_edges.map(f=>({fallback_edge_id:f.lineage_id,request_id:input.request_id,predecessor_attempt_id:f.predecessor_attempt_id,successor_attempt_id:f.successor_attempt_id,reason:f.reason})),edges,final_outcome:final,verification_result:state,historical_validity_basis:input.historical_validity_basis,composed_at:input.composed_at,causal_lineage:input.causal_lineage}); } catch (error) { if(state==='VERIFIED') throw error; }
		}
		return createSecurityEvidenceCompositionResultV1({version:1,request_id:input.request_id,result:state,...(composition?{composition}:{}),failures,missing_evidence:[...missing].sort(),evaluated_at:input.composed_at,causal_lineage:[...input.causal_lineage].sort()} as SecurityEvidenceCompositionRuntimeResultV1);
	}
}
function outcome(attempts:readonly {outcome:string;credential_access_evidence_id?:string}[],fallbacks:number,credentials:readonly {evidence_id:string;outcome:string}[]):SecurityEvidenceOperationOutcomeV1{const last=attempts.at(-1)?.outcome,credential=credentials.find(c=>c.evidence_id===attempts.at(-1)?.credential_access_evidence_id);if(last==='TRANSPORT_SUCCEEDED')return fallbacks?'COMPLETED_AFTER_TECHNICAL_FALLBACK':'COMPLETED';if(last==='GOVERNANCE_DENIED')return'GOVERNANCE_DENIED';if(credential?.outcome==='RESOLUTION_DENIED')return'CREDENTIAL_DENIED';if(last==='CONFIGURATION_FAILED')return'CONFIGURATION_DENIED';if(last==='CREDENTIAL_RESOLUTION_FAILED')return'CREDENTIAL_FAILED';if(last==='CREDENTIAL_NOT_APPLICABLE')return'CREDENTIAL_NOT_APPLICABLE';return'TRANSPORT_FAILED';}
