import { createHash, randomUUID } from "node:crypto";
import type { KnowledgeExposureDecisionV1, KnowledgeExposureEvidenceV1, KnowledgeExposureRequestV1 } from "../knowledge.exposure.contracts.v1";
import { buildKnowledgeExposureEvidenceV1 } from "../knowledge.exposure.evidence.v1";
import { evaluateKnowledgeExposurePolicyV1 } from "../knowledge.exposure.policy.v1";
import { deepCopyAndFreeze } from "../knowledge.projection.guard.v1";
import type { KnowledgeExposureConsumptionClaimV1, KnowledgeExposureCurrentStateRepositoryV1, KnowledgeExposureDecisionRepositoryV1, KnowledgeExposureEligibilityV1, KnowledgeExposurePersistenceFailureCode, PersistedKnowledgeExposureV1 } from "./knowledge.exposure.repositories.v1";
import { KnowledgeExposurePersistenceError } from "./knowledge.exposure.repositories.v1";

const digest=(v:unknown)=>createHash("sha256").update(JSON.stringify(v),"utf8").digest("hex");
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const fail=(c:KnowledgeExposurePersistenceFailureCode):never=>{throw new KnowledgeExposurePersistenceError(c);};

export class KnowledgeExposureLifecycleV1 {
  constructor(private readonly repository:KnowledgeExposureDecisionRepositoryV1,private readonly current:KnowledgeExposureCurrentStateRepositoryV1,private readonly now:()=>string=()=>new Date().toISOString()){}

  async issue(request:KnowledgeExposureRequestV1,decision:KnowledgeExposureDecisionV1,evidence:KnowledgeExposureEvidenceV1){
    if(!Object.isFrozen(request)||!Object.isFrozen(decision)||!Object.isFrozen(evidence)) fail("KNOWLEDGE_DECISION_PERSISTENCE_INVALID");
    const expected=evaluateKnowledgeExposurePolicyV1(request,decision.issued_at);
    if(!equal(expected,decision)) fail("KNOWLEDGE_DECISION_IDENTITY_CONFLICT");
    const expectedEvidence=buildKnowledgeExposureEvidenceV1(request,decision);
    if(!equal(expectedEvidence,evidence)) fail("KNOWLEDGE_DECISION_EVIDENCE_MISMATCH");
    if(Date.parse(decision.expires_at)<=Date.parse(this.now())) fail("KNOWLEDGE_DECISION_EXPIRED");
    const manifestId=`${request.projection.schema_id}@${request.projection.schema_version}`;
    const canonicalDigest=digest({request,decision,evidence,manifest_id:manifestId});
    const bindingId=decision.outcome==="ADMITTED"?`knowledge-exposure-binding:sha256:${digest({decision_id:decision.decision_id,manifest_id:manifestId,projection_digest:decision.projection_digest,knowledge_digests:decision.knowledge_digests,operation:decision.operation,purpose:decision.purpose,target_class:decision.target_class,target_identity:decision.target_identity,tenant_id:decision.tenant_id,company_id:decision.company_id})}`:undefined;
    const record=deepCopyAndFreeze({request,decision,evidence,manifest_id:manifestId,...(bindingId?{binding_id:bindingId}:{}),canonical_digest:canonicalDigest}) as PersistedKnowledgeExposureV1;
    const disposition=await this.repository.persist(record,this.now());
    return deepCopyAndFreeze({version:1 as const,disposition,decision_id:decision.decision_id,...(bindingId?{binding_id:bindingId}:{}),evidence_id:evidence.evidence_id,canonical_digest:canonicalDigest});
  }

  async consume(unsafe:KnowledgeExposureConsumptionClaimV1):Promise<KnowledgeExposureEligibilityV1>{
    const claim=deepCopyAndFreeze(unsafe) as KnowledgeExposureConsumptionClaimV1;
    const record=await this.repository.read(claim.decision_id); if(!record) throw new KnowledgeExposurePersistenceError("KNOWLEDGE_DECISION_NOT_FOUND");
    const d=record.decision, binding=record.binding_id;
    const deny=async(code:KnowledgeExposurePersistenceFailureCode,kind="SUBSTITUTION_DENIED")=>{await this.repository.audit({audit_event_id:`knowledge-exposure-audit:${randomUUID()}`,event_kind:kind,decision_id:d.decision_id,binding_id:binding,outcome:"DENIED",failure_code:code,projection_digest:d.projection_digest,evidence_id:record.evidence.evidence_id,correlation_id:claim.correlation_id,causal_references_json:JSON.stringify(claim.causal_references),recorded_at:this.now()});fail(code);};
    if(d.outcome!=="ADMITTED") await deny("KNOWLEDGE_DECISION_NOT_ADMITTED");
    if(!binding) await deny("KNOWLEDGE_BINDING_NOT_FOUND");
    if(Date.parse(d.expires_at)<=Date.parse(this.now())) await deny("KNOWLEDGE_DECISION_EXPIRED","EXPIRY_DENIED");
    if(claim.binding_id!==binding) await deny("KNOWLEDGE_BINDING_SUBSTITUTED");
    if(claim.manifest_id!==record.manifest_id) await deny("KNOWLEDGE_MANIFEST_SUBSTITUTED");
    if(claim.projection_digest!==d.projection_digest) await deny("KNOWLEDGE_PROJECTION_DIGEST_SUBSTITUTED");
    if(!equal(claim.knowledge_digests,d.knowledge_digests)) await deny("KNOWLEDGE_REFERENCE_SET_SUBSTITUTED");
    if(claim.operation!==d.operation) await deny("KNOWLEDGE_OPERATION_SUBSTITUTED");
    if(claim.purpose!==d.purpose) await deny("KNOWLEDGE_PURPOSE_SUBSTITUTED");
    if(claim.target_class!==d.target_class||claim.target_identity!==d.target_identity) await deny("KNOWLEDGE_TARGET_SUBSTITUTED");
    if(claim.target_region!==record.request.target_region) await deny("KNOWLEDGE_REGION_SUBSTITUTED");
    if(claim.requested_retention!==d.effective_retention) await deny("KNOWLEDGE_RETENTION_SUBSTITUTED");
    if(claim.principal_id!==d.principal_id||claim.session_id!==d.session_id||claim.membership_id!==d.membership_id||claim.tenant_id!==d.tenant_id||claim.company_id!==d.company_id) await deny("KNOWLEDGE_PARTICIPATION_INVALID");
    const state=await this.current.verifyCurrent(record,claim,this.now());
    if(!state.authority_current) await deny("KNOWLEDGE_AUTHORITY_INVALID","CURRENT_STATE_DENIED");
    if(!state.principal_active||!state.session_active||!state.session_unexpired||!state.membership_active||!state.ownership_current||!state.selection_current||!state.target_permitted||!state.region_permitted||!state.retention_permitted) await deny("KNOWLEDGE_DECISION_CURRENT_STATE_INVALID","CURRENT_STATE_DENIED");
    await this.repository.audit({audit_event_id:`knowledge-exposure-audit:${randomUUID()}`,event_kind:"DECISION_VERIFIED",decision_id:d.decision_id,binding_id:binding,outcome:"VERIFIED",projection_digest:d.projection_digest,evidence_id:record.evidence.evidence_id,correlation_id:claim.correlation_id,causal_references_json:JSON.stringify(claim.causal_references),recorded_at:this.now()});
    const consumedAt=this.now(), consumptionId=`knowledge-exposure-consumption:sha256:${digest({decision_id:d.decision_id,binding_id:binding,consumed_at:consumedAt,correlation_id:claim.correlation_id})}`;
    if(!await this.repository.consume(record,claim,consumptionId,consumedAt)){await deny("KNOWLEDGE_CONSUMPTION_REPLAYED","REPLAY_DENIED");}
    return deepCopyAndFreeze({version:1,decision_id:d.decision_id,binding_id:binding!,consumption_id:consumptionId,principal_id:d.principal_id,session_id:d.session_id,membership_id:d.membership_id,tenant_id:d.tenant_id,company_id:d.company_id,operation:d.operation,purpose:d.purpose,target_class:d.target_class,...(d.target_identity?{target_identity:d.target_identity}:{}),target_region:claim.target_region,requested_retention:claim.requested_retention,manifest_id:record.manifest_id,projection_digest:d.projection_digest,knowledge_digests:d.knowledge_digests,correlation_id:claim.correlation_id,causal_references:claim.causal_references,policy_version:d.policy_version,consumed_at:consumedAt}) as KnowledgeExposureEligibilityV1;
  }
}
