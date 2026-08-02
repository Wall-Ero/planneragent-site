import type { KnowledgeExposureConsumptionClaimV1, KnowledgeExposureCurrentStateRepositoryV1, KnowledgeExposureCurrentStateV1, KnowledgeExposureDecisionRepositoryV1, PersistedKnowledgeExposureV1 } from "./knowledge.exposure.repositories.v1";
import { KnowledgeExposurePersistenceError } from "./knowledge.exposure.repositories.v1";

const parseArray = (value: unknown): readonly string[] => {
  if (typeof value !== "string") throw new KnowledgeExposurePersistenceError("KNOWLEDGE_DECISION_PERSISTENCE_INVALID");
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.some(item => typeof item !== "string")) throw new KnowledgeExposurePersistenceError("KNOWLEDGE_DECISION_PERSISTENCE_INVALID");
  return Object.freeze([...parsed]);
};

export class D1KnowledgeExposureRepositoryV1 implements KnowledgeExposureDecisionRepositoryV1 {
  constructor(private readonly db: D1Database) {}
  async persist(r: PersistedKnowledgeExposureV1, at: string): Promise<"CREATED" | "IDENTICAL"> {
    const old = await this.db.prepare("SELECT canonical_digest FROM knowledge_exposure_decisions WHERE decision_id = ?").bind(r.decision.decision_id).first<{canonical_digest:string}>();
    if (old) {
      if (old.canonical_digest !== r.canonical_digest) throw new KnowledgeExposurePersistenceError("KNOWLEDGE_DECISION_IDENTITY_CONFLICT");
      return "IDENTICAL";
    }
    const d=r.decision, q=r.request;
    const statements = [this.db.prepare(`INSERT INTO knowledge_exposure_decisions VALUES (${Array(30).fill("?").join(",")})`).bind(
      d.decision_id,d.request_id,d.outcome,q.participation.participation_context_id,d.principal_id,d.session_id,d.membership_id,d.tenant_id,d.company_id,
      d.authority_reference,q.authorization_reference??null,d.operation,d.purpose,d.policy_version,d.target_class,d.target_identity??null,d.effective_classification,d.effective_sovereignty,
      q.target_region,d.effective_retention,r.manifest_id,d.projection_digest,JSON.stringify(d.knowledge_digests),d.issued_at,d.expires_at,JSON.stringify(d.reason_codes),r.evidence.evidence_id,d.correlation_id,JSON.stringify(r.evidence.causal_references),r.canonical_digest),
      this.auditStatement({audit_event_id:`audit:persist:${d.decision_id}`,event_kind:"DECISION_PERSISTED",decision_id:d.decision_id,binding_id:r.binding_id,outcome:d.outcome,projection_digest:d.projection_digest,evidence_id:r.evidence.evidence_id,correlation_id:d.correlation_id,causal_references_json:JSON.stringify(r.evidence.causal_references),recorded_at:at})];
    if (r.binding_id) statements.splice(1,0,this.db.prepare("INSERT INTO knowledge_exposure_projection_bindings VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(r.binding_id,d.decision_id,r.manifest_id,d.projection_digest,JSON.stringify(d.knowledge_digests),d.operation,d.purpose,d.target_class,d.target_identity??null,d.tenant_id,d.company_id,at));
    try { await this.db.batch(statements); return "CREATED"; } catch { throw new KnowledgeExposurePersistenceError("KNOWLEDGE_DECISION_PERSISTENCE_INVALID"); }
  }
  async read(id:string):Promise<PersistedKnowledgeExposureV1|null>{
    const row=await this.db.prepare(`SELECT d.*,b.binding_id FROM knowledge_exposure_decisions d LEFT JOIN knowledge_exposure_projection_bindings b ON b.decision_id=d.decision_id WHERE d.decision_id=?`).bind(id).first<Record<string,unknown>>();
    if(!row)return null;
    const decision:any={version:1,decision_id:row.decision_id,request_id:row.request_id,outcome:row.outcome,principal_id:row.principal_id,session_id:row.session_id,membership_id:row.membership_id,tenant_id:row.tenant_id,company_id:row.company_id,authority_reference:row.authority_reference,operation:row.operation,purpose:row.purpose,knowledge_digests:parseArray(row.knowledge_digests_json),projection_digest:row.projection_digest,target_class:row.target_class,...(row.target_identity?{target_identity:row.target_identity}:{}),effective_classification:row.effective_classification,effective_sovereignty:row.effective_sovereignty,effective_regions:Object.freeze([row.permitted_region]),effective_retention:row.permitted_retention,policy_version:row.policy_version,reason_codes:parseArray(row.reason_codes_json),issued_at:row.issued_at,expires_at:row.expires_at,consumption_identity:`knowledge-exposure-consumption:${row.decision_id}`,correlation_id:row.correlation_id};
    const request:any={version:1,participation:{version:1,participation_context_id:row.participation_context_id,principal_id:row.principal_id,session_id:row.session_id,membership_id:row.membership_id,tenant_id:row.tenant_id,company_id:row.company_id,principal_active:true,session_active:true,membership_active:true},authority_reference:row.authority_reference,...(row.authorization_reference?{authorization_reference:row.authorization_reference}:{}),operation:row.operation,purpose:{version:1,code:row.purpose,operation:row.operation},knowledge:[],projection:{version:1,schema_id:String(row.manifest_id).split("@")[0],schema_version:String(row.manifest_id).split("@")[1],projection_digest:row.projection_digest,included_fields:[],excluded_categories:[],source_knowledge_references:[],representation:"STRUCTURED_JSON"},target_class:row.target_class,...(row.target_identity?{target_identity:row.target_identity}:{}),source_region:row.permitted_region,target_region:row.permitted_region,requested_retention:row.permitted_retention,requested_validity_ms:Date.parse(String(row.expires_at))-Date.parse(String(row.issued_at)),requested_at:row.issued_at,correlation_id:row.correlation_id,causal_references:parseArray(row.causal_references_json)};
    const evidence:any={version:1,evidence_id:row.evidence_id,request_id:row.request_id,decision_id:row.decision_id,outcome:row.outcome,knowledge_digests:decision.knowledge_digests,projection_digest:row.projection_digest,classifications:[],encryption_domains:[],purpose:row.purpose,operation:row.operation,target_class:row.target_class,policy_version:row.policy_version,reason_codes:decision.reason_codes,issued_at:row.issued_at,causal_references:request.causal_references};
    return Object.freeze({request:Object.freeze(request),decision:Object.freeze(decision),evidence:Object.freeze(evidence),manifest_id:String(row.manifest_id),binding_id:row.binding_id as string|undefined,canonical_digest:String(row.canonical_digest)});
  }
  async consume(r:PersistedKnowledgeExposureV1,c:KnowledgeExposureConsumptionClaimV1,id:string,at:string):Promise<boolean>{
    try { await this.db.batch([this.db.prepare("INSERT INTO knowledge_exposure_consumptions VALUES (?,?,?,?,?,?,?,?,?,?)").bind(id,r.decision.decision_id,r.binding_id,c.consuming_runtime,c.intended_transport_class,c.target_identity??null,at,c.correlation_id,JSON.stringify(c.causal_references),"CONSUMED"),this.auditStatement({audit_event_id:`audit:consume:${id}`,event_kind:"CONSUMED",decision_id:r.decision.decision_id,binding_id:r.binding_id,consumption_id:id,outcome:"CONSUMED",projection_digest:r.decision.projection_digest,evidence_id:r.evidence.evidence_id,correlation_id:c.correlation_id,causal_references_json:JSON.stringify(c.causal_references),recorded_at:at})]); return true; } catch { return false; }
  }
  async audit(e:Readonly<Record<string,string|undefined>>){try{await this.auditStatement(e).run();}catch{throw new KnowledgeExposurePersistenceError("KNOWLEDGE_AUDIT_PERSISTENCE_FAILED");}}
  private auditStatement(e:Readonly<Record<string,string|undefined>>){return this.db.prepare("INSERT INTO knowledge_exposure_audit_events VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(e.audit_event_id,e.event_kind,e.decision_id,e.binding_id??null,e.consumption_id??null,e.outcome,e.failure_code??null,e.projection_digest,e.evidence_id,e.correlation_id,e.causal_references_json??"[]",e.recorded_at);}
}

export class D1KnowledgeExposureCurrentStateV1 implements KnowledgeExposureCurrentStateRepositoryV1 {
  constructor(private readonly db:D1Database,private readonly policy:(r:PersistedKnowledgeExposureV1,c:KnowledgeExposureConsumptionClaimV1)=>Promise<Pick<KnowledgeExposureCurrentStateV1,"authority_current"|"target_permitted"|"region_permitted"|"retention_permitted">>){ }
  async verifyCurrent(r:PersistedKnowledgeExposureV1,c:KnowledgeExposureConsumptionClaimV1,now:string):Promise<KnowledgeExposureCurrentStateV1>{
    const d=r.decision;
    const x=await this.db.prepare(`SELECT
      EXISTS(SELECT 1 FROM oir_principals WHERE principal_id=? AND lifecycle_state='ACTIVE') principal_active,
      EXISTS(SELECT 1 FROM oir_server_sessions WHERE session_id=? AND principal_id=? AND lifecycle_state='ACTIVE') session_active,
      EXISTS(SELECT 1 FROM oir_server_sessions WHERE session_id=? AND expires_at>?) session_unexpired,
      EXISTS(SELECT 1 FROM oir_organization_memberships WHERE membership_id=? AND principal_id=? AND company_id=? AND lifecycle_state='ACTIVE') membership_active,
      EXISTS(SELECT 1 FROM oir_tenant_company_ownership WHERE tenant_id=? AND company_id=? AND effective_from<=? AND (effective_until IS NULL OR effective_until>?)) ownership_current,
      EXISTS(SELECT 1 FROM oir_company_selections WHERE session_id=? AND principal_id=? AND membership_id=? AND company_id=? AND invalidated_at IS NULL) selection_current`).bind(d.principal_id,d.session_id,d.principal_id,d.session_id,now,d.membership_id,d.principal_id,d.company_id,d.tenant_id,d.company_id,now,now,d.session_id,d.principal_id,d.membership_id,d.company_id).first<any>();
    const p=await this.policy(r,c); return Object.freeze({...x,principal_active:x?.principal_active===1,session_active:x?.session_active===1,session_unexpired:x?.session_unexpired===1,membership_active:x?.membership_active===1,ownership_current:x?.ownership_current===1,selection_current:x?.selection_current===1,...p});
  }
}
