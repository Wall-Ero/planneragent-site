import { LegalEntityFailureV1, type CompanyLegalEntityBindingV1, type LegalEntityIdentityV1, type LegalEntityVerificationRequestV1 } from "./legal.entity.contracts.v1";
import { freeze } from "./legal.entity.policy.v1";
import { INITIAL_LEGAL_ENTITY_POLICY_V1 } from "./legal.entity.policy.v1";

type Db = D1Database;
export class LegalEntityD1V1 {
  constructor(private readonly db: Db) {}

  async persistVerification(request: LegalEntityVerificationRequestV1, identity: LegalEntityIdentityV1): Promise<LegalEntityIdentityV1> {
    const existing = await this.findByCanonicalKey(identity.canonical_key);
    if (existing) {
      if (existing.registered_name !== identity.registered_name) throw new LegalEntityFailureV1("LEGAL_ENTITY_CONFLICT");
      return existing;
    }
    const registrationId = `reg:${identity.canonical_key}`;
    try {
      await this.db.batch([
        this.db.prepare(`INSERT INTO legal_entity_claims VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
          request.claim.claim_id,1,request.claim.claim_status,request.claim.claimant_principal_id,identity.registered_name,identity.jurisdiction,
          identity.registration_type,identity.registration_identifier,identity.registration_profile,JSON.stringify(request.claim.evidence_references),
          request.claim.purpose,request.claim.issued_at,request.claim.expires_at ?? null,request.claim.correlation_id,JSON.stringify(request.claim.caused_by)),
        this.db.prepare(`INSERT INTO legal_entity_registration_identities VALUES (?,?,?,?,?,?)`).bind(
          registrationId,identity.jurisdiction,identity.registration_profile,identity.registration_identifier,identity.registered_name,identity.registration_type),
        ...request.evidence.map(e => this.db.prepare(`INSERT INTO legal_entity_evidence_references VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
          e.evidence_id,1,e.issuer_id,e.evidence_type,e.subject_claim_id,e.jurisdiction,e.registration_profile,e.registration_identifier,
          e.registered_name,e.issued_at,e.effective_at,e.expires_at ?? null,e.immutable_digest,e.governed_reference,e.verification_state,e.verification_authority_id ?? null)),
        this.db.prepare(`INSERT INTO legal_entity_verification_decisions VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
          request.decision.decision_id,1,request.decision.claim_id,JSON.stringify(request.decision.evidence_ids),request.decision.verifier_id,
          request.decision.verifier_class,request.decision.decision,JSON.stringify(request.decision.reason_codes),request.decision.decided_at,
          request.decision.valid_until ?? null,request.decision.correlation_id,JSON.stringify(request.decision.caused_by)),
        this.db.prepare(`INSERT INTO legal_entity_identities VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
          identity.legal_entity_id,1,identity.canonical_key,registrationId,identity.registered_name,identity.entity_status,
          identity.verification_status,identity.verification_method,JSON.stringify(identity.verification_evidence_ids),identity.effective_at,
          identity.verified_at,identity.reverify_at ?? null,identity.claim_id,identity.verification_decision_id,identity.correlation_id,JSON.stringify(identity.caused_by)),
        this.audit(`audit:${request.decision.decision_id}`,"VERIFICATION",identity.legal_entity_id,"VERIFIED",null,request.decision.verifier_id,identity.correlation_id,identity.caused_by,identity.verified_at),
      ]);
      return freeze(structuredClone(identity));
    } catch (error) {
      const concurrent = await this.findByCanonicalKey(identity.canonical_key);
      if (concurrent && concurrent.registered_name === identity.registered_name) return concurrent;
      if (concurrent) throw new LegalEntityFailureV1("LEGAL_ENTITY_CONFLICT");
      throw new LegalEntityFailureV1("LEGAL_ENTITY_PERSISTENCE_FAILED");
    }
  }

  async bindCompany(binding: CompanyLegalEntityBindingV1): Promise<CompanyLegalEntityBindingV1> {
    const entity = await this.findById(binding.legal_entity_id);
    if (!entity) throw new LegalEntityFailureV1("LEGAL_ENTITY_NOT_VERIFIED");
    const current = await this.db.prepare(`SELECT * FROM legal_entity_company_bindings WHERE company_id=? OR legal_entity_id=?`).bind(binding.company_id,binding.legal_entity_id).first<Record<string, unknown>>();
    if (current) {
      if (current.company_id !== binding.company_id || current.legal_entity_id !== binding.legal_entity_id) throw new LegalEntityFailureV1("LEGAL_ENTITY_COMPANY_BINDING_MISMATCH");
      return freeze(structuredClone(binding));
    }
    try {
      await this.db.batch([
        this.db.prepare(`INSERT INTO legal_entity_company_bindings VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(
          binding.binding_id,1,binding.company_id,binding.legal_entity_id,binding.bound_at,binding.binding_reference,
          binding.correlation_id,JSON.stringify(binding.caused_by),0,0,0),
        this.audit(`audit:${binding.binding_id}`,"COMPANY_BINDING",binding.legal_entity_id,"BOUND",null,"LEGAL_ENTITY_RUNTIME",binding.correlation_id,binding.caused_by,binding.bound_at),
      ]);
      return freeze(structuredClone(binding));
    } catch { throw new LegalEntityFailureV1("LEGAL_ENTITY_COMPANY_BINDING_MISMATCH"); }
  }

  async transition(id: string, to: "EXPIRED"|"REVOKED"|"SUPERSEDED", reference: string, at: string, correlation: string, causedBy: readonly string[], supersededBy?: string): Promise<void> {
    const entity = await this.findById(id); if (!entity) throw new LegalEntityFailureV1("LEGAL_ENTITY_NOT_VERIFIED");
    try { await this.db.batch([
      this.db.prepare(`INSERT INTO legal_entity_status_transitions VALUES (?,?,?,?,?,?,?,?,?)`).bind(`transition:${reference}`,id,entity.verification_status,to,reference,at,supersededBy ?? null,correlation,JSON.stringify(causedBy)),
      this.audit(`audit:transition:${reference}`,"STATUS_TRANSITION",id,to,null,"LEGAL_ENTITY_RUNTIME",correlation,causedBy,at),
    ]); } catch { throw new LegalEntityFailureV1("LEGAL_ENTITY_CONFLICT"); }
  }

  async resolveCurrent(id:string,now:string,companyId?:string):Promise<LegalEntityIdentityV1>{
    const entity=await this.findById(id); if(!entity)throw new LegalEntityFailureV1("LEGAL_ENTITY_NOT_VERIFIED");
    const transition=await this.db.prepare("SELECT to_status FROM legal_entity_status_transitions WHERE legal_entity_id=?").bind(id).first<{to_status:string}>();
    if(transition?.to_status==="REVOKED")throw new LegalEntityFailureV1("LEGAL_ENTITY_REVOKED");
    if(transition?.to_status==="SUPERSEDED")throw new LegalEntityFailureV1("LEGAL_ENTITY_SUPERSEDED");
    if(transition?.to_status==="EXPIRED"||entity.reverify_at&&entity.reverify_at<=now)throw new LegalEntityFailureV1("LEGAL_ENTITY_VERIFICATION_EXPIRED");
    const evidence=await this.db.prepare("SELECT issuer_id,jurisdiction,registration_identifier,expires_at FROM legal_entity_evidence_references WHERE subject_claim_id=?").bind(entity.claim_id).all<{issuer_id:string;jurisdiction:string;registration_identifier:string;expires_at:string|null}>();
    if(!evidence.results.length)throw new LegalEntityFailureV1("LEGAL_ENTITY_EVIDENCE_REQUIRED");
    for(const row of evidence.results){
      if(!INITIAL_LEGAL_ENTITY_POLICY_V1.trusted_evidence_issuers.includes(row.issuer_id))throw new LegalEntityFailureV1("LEGAL_ENTITY_EVIDENCE_ISSUER_UNTRUSTED");
      if(row.expires_at&&row.expires_at<=now)throw new LegalEntityFailureV1("LEGAL_ENTITY_EVIDENCE_EXPIRED");
      if(row.jurisdiction!==entity.jurisdiction||row.registration_identifier!==entity.registration_identifier)throw new LegalEntityFailureV1("LEGAL_ENTITY_IDENTITY_MISMATCH");
    }
    const decision=await this.db.prepare("SELECT verifier_id,decision,valid_until FROM legal_entity_verification_decisions WHERE decision_id=? AND claim_id=?").bind(entity.verification_decision_id,entity.claim_id).first<{verifier_id:string;decision:string;valid_until:string|null}>();
    if(!decision||decision.decision!=="VERIFIED")throw new LegalEntityFailureV1("LEGAL_ENTITY_NOT_VERIFIED");
    if(!INITIAL_LEGAL_ENTITY_POLICY_V1.authorized_reviewers.includes(decision.verifier_id))throw new LegalEntityFailureV1("LEGAL_ENTITY_VERIFIER_UNAUTHORIZED");
    if(decision.valid_until&&decision.valid_until<=now)throw new LegalEntityFailureV1("LEGAL_ENTITY_VERIFICATION_EXPIRED");
    const duplicate=await this.db.prepare("SELECT COUNT(*) count FROM legal_entity_identities WHERE canonical_key=?").bind(entity.canonical_key).first<{count:number}>();
    if(duplicate?.count!==1)throw new LegalEntityFailureV1("LEGAL_ENTITY_DUPLICATE");
    if(companyId){const binding=await this.db.prepare("SELECT legal_entity_id FROM legal_entity_company_bindings WHERE company_id=?").bind(companyId).first<{legal_entity_id:string}>();if(!binding||binding.legal_entity_id!==id)throw new LegalEntityFailureV1("LEGAL_ENTITY_COMPANY_BINDING_MISMATCH");}
    return entity;
  }

  async findByCanonicalKey(key: string): Promise<LegalEntityIdentityV1|null> { return this.row(await this.db.prepare(`SELECT i.*,r.jurisdiction,r.registration_profile,r.registration_identifier,r.registration_type FROM legal_entity_identities i JOIN legal_entity_registration_identities r ON r.registration_identity_id=i.registration_identity_id WHERE i.canonical_key=?`).bind(key).first<Record<string,unknown>>()); }
  async findById(id: string): Promise<LegalEntityIdentityV1|null> { return this.row(await this.db.prepare(`SELECT i.*,r.jurisdiction,r.registration_profile,r.registration_identifier,r.registration_type FROM legal_entity_identities i JOIN legal_entity_registration_identities r ON r.registration_identity_id=i.registration_identity_id WHERE i.legal_entity_id=?`).bind(id).first<Record<string,unknown>>()); }
  private audit(id:string,type:string,subject:string,outcome:string,reason:string|null,actor:string,correlation:string,causedBy:readonly string[],at:string) { return this.db.prepare(`INSERT INTO legal_entity_audit_events VALUES (?,?,?,?,?,?,?,?,?)`).bind(id,type,subject,outcome,reason,actor,correlation,JSON.stringify(causedBy),at); }
  private row(r:Record<string,unknown>|null):LegalEntityIdentityV1|null { if(!r)return null; return freeze({version:1,legal_entity_id:String(r.legal_entity_id),canonical_key:String(r.canonical_key),jurisdiction:String(r.jurisdiction),registration_profile:String(r.registration_profile),registration_identifier:String(r.registration_identifier),registered_name:String(r.registered_name),registration_type:String(r.registration_type),entity_status:"ACTIVE",verification_status:"VERIFIED_BY_AUTHORIZED_REVIEW",verification_method:"GOVERNED_MANUAL_REVIEW",verification_evidence_ids:JSON.parse(String(r.evidence_ids_json)),effective_at:String(r.effective_at),verified_at:String(r.verified_at),...(r.reverify_at?{reverify_at:String(r.reverify_at)}:{}),claim_id:String(r.claim_id),verification_decision_id:String(r.decision_id),correlation_id:String(r.correlation_id),caused_by:JSON.parse(String(r.caused_by_json))}); }
}
