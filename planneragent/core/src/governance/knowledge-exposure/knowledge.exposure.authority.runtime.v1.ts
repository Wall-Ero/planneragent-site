import { createHash } from "node:crypto";
import { scopeWithinV1 } from "../organizational-authority";
import type { CanonicalEffectiveOperationalAuthorityProofV1 } from "../organizational-authority";
import { deepCopyAndFreeze } from "./knowledge.projection.guard.v1";
import { evaluateKnowledgeExposurePolicyV1 } from "./knowledge.exposure.policy.v1";
import { CUSTOMER_QUOTATION_AUTHORITY_DOMAIN_V1, CUSTOMER_QUOTATION_AUTHORITY_SCOPE_V1, SecurityEvidenceAuthorityErrorV1, classifyKnowledgeExposureAuthorityV1 } from "./knowledge.exposure.authority.contracts.v1";
import type { CurrentEffectiveAuthorityResolverV1, KnowledgeExposureAuthorityBindingInputV1, KnowledgeExposureAuthorityBindingRepositoryV1, KnowledgeExposureAuthorityBindingV1, SecurityEvidenceApplicabilityV1, SecurityEvidenceAuthorityFailureCodeV1 } from "./knowledge.exposure.authority.contracts.v1";

const digest=(v:unknown)=>createHash("sha256").update(JSON.stringify(v),"utf8").digest("hex");
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const fail=(code:SecurityEvidenceAuthorityFailureCodeV1):never=>{throw new SecurityEvidenceAuthorityErrorV1(code);};
const applicability=(domain:SecurityEvidenceApplicabilityV1["domain"],status:SecurityEvidenceApplicabilityV1["status"],reason:SecurityEvidenceApplicabilityV1["reason"],i:KnowledgeExposureAuthorityBindingInputV1,at:string):SecurityEvidenceApplicabilityV1=>{
  const d=i.decision,r=i.request,semantic={domain,status,reason,request_id:d.request_id,decision_id:d.decision_id,purpose:String(d.purpose),projection_digest:String(d.projection_digest),principal_id:String(d.principal_id),session_id:String(d.session_id),tenant_id:String(d.tenant_id),company_id:String(d.company_id),recorded_at:at,correlation_id:String(d.correlation_id),causal_references:[...r.causal_references].sort()};
  return deepCopyAndFreeze({version:1,applicability_id:`security-applicability:sha256:${digest(semantic)}`,...semantic}) as SecurityEvidenceApplicabilityV1;
};

export class KnowledgeExposureAuthorityRuntimeV1 {
  constructor(private readonly resolver:CurrentEffectiveAuthorityResolverV1,private readonly repository?:KnowledgeExposureAuthorityBindingRepositoryV1,private readonly now:()=>string=()=>new Date().toISOString()){}
  async bind(unsafe:KnowledgeExposureAuthorityBindingInputV1):Promise<KnowledgeExposureAuthorityBindingV1>{
    const i=deepCopyAndFreeze(unsafe) as KnowledgeExposureAuthorityBindingInputV1,d=i?.decision,r=i?.request,at=this.now();
    if(!i||i.version!==1||!r||!d) fail("SECURITY_EVIDENCE_AUTHORITY_PURPOSE_MISMATCH");
    if(Object.prototype.hasOwnProperty.call(i,"authority_proof")) fail("SECURITY_EVIDENCE_AUTHORITY_PROOF_INVALID");
    const classification=classifyKnowledgeExposureAuthorityV1(String(d.purpose));
    if(classification==="AUTHORITY_SOURCE_UNDEFINED") fail("SECURITY_EVIDENCE_AUTHORITY_SOURCE_UNDEFINED");
    if(d.outcome!=="ADMITTED"||!equal(evaluateKnowledgeExposurePolicyV1(r,d.issued_at),d)) fail("SECURITY_EVIDENCE_AUTHORITY_PURPOSE_MISMATCH");
    let organizational:SecurityEvidenceApplicabilityV1,authority_evidence:KnowledgeExposureAuthorityBindingV1["authority_evidence"],p9:SecurityEvidenceApplicabilityV1|undefined;
    if(classification==="ORGANIZATIONAL_AUTHORITY_NOT_APPLICABLE"){
      if(["p9_operation_id","p9_ledger_id","p9_record_hash"].some(k=>Object.prototype.hasOwnProperty.call(i,k))) fail("SECURITY_EVIDENCE_P9_REFERENCE_INVALID");
      organizational=applicability("ORGANIZATIONAL_AUTHORITY","NOT_APPLICABLE","COGNITIVE_TRANSFORMATION_ONLY",i,at);
      p9=applicability("P9","NOT_APPLICABLE","ORDINARY_COGNITIVE_PROVIDER_OPERATION",i,at);
    }else{
      organizational=applicability("ORGANIZATIONAL_AUTHORITY","APPLICABLE","CUSTOMER_QUOTATION_DISCLOSURE",i,at);
      const actor=i.oag_actor_id,proofId=i.authority_proof_id,proofDigest=i.authority_proof_digest;
      if(!actor||!proofId||!proofDigest) fail("SECURITY_EVIDENCE_AUTHORITY_REQUIRED");
      if(r.authority_reference!==proofId) fail("SECURITY_EVIDENCE_LEGACY_AUTHORITY_MISMATCH");
      const exactActor=actor as string;
      let proof:CanonicalEffectiveOperationalAuthorityProofV1;
      try{proof=await this.resolver.resolveCurrentEffectiveOperationalAuthorityProofV1({version:1,oag_actor_id:exactActor,principal_id:r.participation.principal_id,tenant_id:r.participation.tenant_id,company_id:r.participation.company_id,requested_domain:CUSTOMER_QUOTATION_AUTHORITY_DOMAIN_V1,requested_scope:CUSTOMER_QUOTATION_AUTHORITY_SCOPE_V1,as_of:at,correlation_id:r.correlation_id,causal_references:r.causal_references});}
      catch{throw new SecurityEvidenceAuthorityErrorV1("SECURITY_EVIDENCE_AUTHORITY_PROOF_STALE");}
      if(proof.authority_proof_id!==proofId) fail("SECURITY_EVIDENCE_AUTHORITY_PROOF_INVALID");
      if(proof.proof_digest!==proofDigest) fail("SECURITY_EVIDENCE_AUTHORITY_DIGEST_MISMATCH");
      if(proof.oag_actor_id!==exactActor) fail("SECURITY_EVIDENCE_AUTHORITY_ACTOR_MISMATCH");
      if(proof.principal_id!==r.participation.principal_id) fail("SECURITY_EVIDENCE_AUTHORITY_PRINCIPAL_MISMATCH");
      if(proof.tenant_id!==r.participation.tenant_id) fail("SECURITY_EVIDENCE_AUTHORITY_TENANT_MISMATCH");
      if(proof.company_id!==r.participation.company_id) fail("SECURITY_EVIDENCE_AUTHORITY_COMPANY_MISMATCH");
      if(proof.expires_at<=at) fail("SECURITY_EVIDENCE_AUTHORITY_EXPIRED");
      if(proof.policy_id!=="OAG_AUTHORITY_POLICY_V2"||proof.policy_numeric_version!==2||proof.effective_scope.domain!==CUSTOMER_QUOTATION_AUTHORITY_DOMAIN_V1||!scopeWithinV1(CUSTOMER_QUOTATION_AUTHORITY_SCOPE_V1,proof.effective_scope)) fail("SECURITY_EVIDENCE_AUTHORITY_SCOPE_MISMATCH");
      const semantic={authority_source_class:"ORGANIZATIONAL_OPERATIONAL_AUTHORITY" as const,authority_proof_id:proof.authority_proof_id,authority_proof_digest:proof.proof_digest,oag_actor_id:proof.oag_actor_id,principal_id:proof.principal_id,tenant_id:proof.tenant_id,company_id:proof.company_id,effective_operational_domain:CUSTOMER_QUOTATION_AUTHORITY_DOMAIN_V1,effective_scope:proof.effective_scope,graph_version:proof.graph_version,graph_digest:proof.graph_digest,authority_policy_id:proof.policy_id,authority_policy_version:proof.policy_numeric_version,confirmation_chain_references:proof.confirmation_chain_references,delegation_lineage:proof.delegation_references,issued_at:proof.issued_at,expires_at:proof.expires_at,current_state_resolution:"CURRENT" as const,request_id:d.request_id,decision_id:d.decision_id,purpose:"CUSTOMER_QUOTATION_DISCLOSURE" as const,projection_digest:String(d.projection_digest),correlation_id:r.correlation_id,causal_references:[...new Set([...r.causal_references,proof.authority_proof_id])].sort()};
      authority_evidence=deepCopyAndFreeze({version:1,evidence_id:`knowledge-exposure-authority:sha256:${digest(semantic)}`,...semantic});
    }
    const semantic={organizational_authority:organizational,...(authority_evidence?{authority_evidence}:{}),...(p9?{p9}:{})},binding_id=`knowledge-exposure-authority-binding:sha256:${digest(semantic)}`,binding_digest=digest({binding_id,...semantic});
    const binding=deepCopyAndFreeze({version:1,binding_id,binding_digest,...semantic}) as KnowledgeExposureAuthorityBindingV1;
    if(this.repository)try{await this.repository.persist(binding);}catch(e){if(e instanceof SecurityEvidenceAuthorityErrorV1)throw e;fail("SECURITY_EVIDENCE_PERSISTENCE_FAILED");}
    return binding;
  }
}
