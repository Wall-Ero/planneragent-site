import type { KnowledgeExposureAuthorityBindingRepositoryV1, KnowledgeExposureAuthorityBindingV1 } from "../knowledge.exposure.authority.contracts.v1";
import { SecurityEvidenceAuthorityErrorV1 } from "../knowledge.exposure.authority.contracts.v1";

export class D1KnowledgeExposureAuthorityBindingRepositoryV1 implements KnowledgeExposureAuthorityBindingRepositoryV1 {
  constructor(private readonly db:D1Database){}
  async persist(b:KnowledgeExposureAuthorityBindingV1):Promise<"CREATED"|"IDENTICAL">{
    const old=await this.db.prepare("SELECT binding_digest FROM knowledge_exposure_authority_bindings WHERE binding_id=?").bind(b.binding_id).first<{binding_digest:string}>();
    if(old){if(old.binding_digest!==b.binding_digest)throw new SecurityEvidenceAuthorityErrorV1("SECURITY_EVIDENCE_PERSISTENCE_FAILED");return "IDENTICAL";}
    const rows=[b.organizational_authority,...(b.p9?[b.p9]:[])];
    const statements=[this.db.prepare("INSERT INTO knowledge_exposure_authority_bindings VALUES (?,?,?,?,?,?,?)").bind(b.binding_id,b.binding_digest,b.organizational_authority.request_id,b.organizational_authority.decision_id,b.organizational_authority.projection_digest,b.organizational_authority.recorded_at,b.organizational_authority.correlation_id),
      ...rows.map(a=>this.db.prepare("INSERT INTO security_evidence_applicability VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(a.applicability_id,b.binding_id,a.domain,a.status,a.reason,a.request_id,a.decision_id,a.purpose,a.projection_digest,a.principal_id,a.session_id,a.tenant_id,a.company_id,a.recorded_at,a.correlation_id,JSON.stringify(a.causal_references)))];
    if(b.authority_evidence){const e=b.authority_evidence;statements.push(this.db.prepare("INSERT INTO knowledge_exposure_authority_evidence VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(e.evidence_id,b.binding_id,e.authority_source_class,e.authority_proof_id,e.authority_proof_digest,e.oag_actor_id,e.principal_id,e.tenant_id,e.company_id,e.effective_operational_domain,JSON.stringify(e.effective_scope),e.graph_version,e.graph_digest,e.authority_policy_id,e.authority_policy_version,JSON.stringify(e.confirmation_chain_references),JSON.stringify(e.delegation_lineage),e.issued_at,e.expires_at,e.current_state_resolution,e.purpose,e.correlation_id,JSON.stringify(e.causal_references)));}
    statements.push(this.db.prepare("INSERT INTO knowledge_exposure_authority_audit VALUES (?,?,?,?,?,?,?,?)").bind(`audit:${b.binding_id}`,b.binding_id,"AUTHORITY_BINDING_PERSISTED","PERSISTED",b.organizational_authority.decision_id,b.organizational_authority.projection_digest,b.organizational_authority.correlation_id,b.organizational_authority.recorded_at));
    try{await this.db.batch(statements);return "CREATED";}catch{throw new SecurityEvidenceAuthorityErrorV1("SECURITY_EVIDENCE_PERSISTENCE_FAILED");}
  }
}
