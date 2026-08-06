import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import oir from "../../../../migrations/0007_oir_track_a_persistence.sql?raw";
import migration from "../../../../migrations/0021_legal_entity_verification.sql?raw";
import { LegalEntityD1V1, verifyLegalEntityV1, type CompanyLegalEntityBindingV1 } from "..";
import { legalEntityNowFixture as now, legalEntityRequestFixture as fixture } from "./legal.entity.fixtures.v1";

const db=env.POLICIES_DB; const repo=new LegalEntityD1V1(db);
function queries(sql:string){return sql.split(/;\s*\r?\n(?=CREATE (?:TABLE|UNIQUE INDEX|TRIGGER))/).map(q=>q.trim()).filter(Boolean).map(q=>q.endsWith(";")?q:`${q};`);}
async function persisted(){const req=fixture();const identity=await verifyLegalEntityV1(req,now);await repo.persistVerification(req,identity);return {req,identity};}
beforeAll(async()=>{
  await applyD1Migrations(db,[{name:"0007",queries:queries(oir)},{name:"0021",queries:queries(migration)}]);
  await db.prepare("INSERT INTO oir_principals VALUES ('principal-1','HUMAN','ACTIVE',?)").bind(now).run();
  await db.prepare("INSERT INTO oir_companies VALUES ('company-1','ACTIVE',?)").bind(now).run();
  await db.prepare("INSERT INTO oir_companies VALUES ('company-2','ACTIVE',?)").bind(now).run();
});

describe("LE-WU1 actual D1 persistence",()=>{
  it("applies migration and persists immutable minimized verification rows",async()=>{
    const req=fixture(); const identity=await verifyLegalEntityV1(req,now); await repo.persistVerification(req,identity);
    const tables=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'legal_entity_%'").all<{name:string}>();
    expect(tables.results).toHaveLength(8); expect(await repo.findByCanonicalKey(identity.canonical_key)).toEqual(identity);
    for(const [table,column] of [["legal_entity_claims","registered_name"],["legal_entity_evidence_references","issuer_id"],["legal_entity_verification_decisions","verifier_id"],["legal_entity_identities","registered_name"]])
      await expect(db.prepare(`UPDATE ${table} SET ${column}=${column}`).run()).rejects.toThrow(/IMMUTABLE/);
    const serialized=JSON.stringify((await db.prepare("SELECT * FROM legal_entity_evidence_references").all()).results);
    expect(serialized).not.toMatch(/raw_document|credential|operational_data/);
  });
  it("converges concurrent duplicate verification on one canonical identity",async()=>{
    const req=fixture(); const identity=await verifyLegalEntityV1(req,now);
    const results=await Promise.all([repo.persistVerification(req,identity),repo.persistVerification(req,identity)]);
    expect(new Set(results.map(v=>v.legal_entity_id))).toEqual(new Set([identity.legal_entity_id]));
    expect((await db.prepare("SELECT COUNT(*) count FROM legal_entity_identities WHERE canonical_key=?").bind(identity.canonical_key).first<{count:number}>())?.count).toBe(1);
  });
  it("fails closed on same canonical registration with a conflicting name",async()=>{
    const {req,identity}=await persisted();
    await expect(repo.persistVerification(req,{...identity,registered_name:"Contradictory S.r.l."})).rejects.toMatchObject({code:"LEGAL_ENTITY_CONFLICT"});
  });
  it("creates one exact immutable Company binding without membership, OAG, or authority",async()=>{
    const {identity}=await persisted();
    const binding:CompanyLegalEntityBindingV1={version:1,binding_id:"binding-1",company_id:"company-1",legal_entity_id:identity.legal_entity_id,bound_at:now,binding_reference:"review-binding-1",correlation_id:"correlation-1",caused_by:[identity.verification_decision_id],grants_membership:false,grants_authority:false,grants_contractual_authority:false};
    await expect(repo.bindCompany(binding)).resolves.toEqual(binding);
    await expect(repo.resolveCurrent(identity.legal_entity_id,now,"company-1")).resolves.toEqual(identity);
    await expect(repo.resolveCurrent(identity.legal_entity_id,now,"company-2")).rejects.toMatchObject({code:"LEGAL_ENTITY_COMPANY_BINDING_MISMATCH"});
    expect((await db.prepare("SELECT COUNT(*) count FROM oir_organization_memberships").first<{count:number}>())?.count).toBe(0);
    expect((await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'oag_%'").all()).results).toHaveLength(0);
    await expect(db.prepare("UPDATE legal_entity_company_bindings SET company_id='company-2'").run()).rejects.toThrow(/IMMUTABLE/);
    await expect(repo.bindCompany({...binding,binding_id:"binding-2",company_id:"company-2"})).rejects.toMatchObject({code:"LEGAL_ENTITY_COMPANY_BINDING_MISMATCH"});
  });
  it("persists immutable rejection, revocation, supersession, and content-free audit evidence",async()=>{
    const {identity}=await persisted();
    const base=fixture(); const successorRequest={
      claim:{...base.claim,claim_id:"claim-successor",registration_identifier:"MI-7654321",evidence_references:["evidence-successor"]},
      evidence:[{...base.evidence[0]!,evidence_id:"evidence-successor",subject_claim_id:"claim-successor",registration_identifier:"MI-7654321",governed_reference:"document:vault:successor"}],
      decision:{...base.decision,decision_id:"decision-successor",claim_id:"claim-successor",evidence_ids:["evidence-successor"]}
    } as const;
    const successor=await verifyLegalEntityV1(successorRequest,now); await repo.persistVerification(successorRequest,successor);
    await db.prepare(`INSERT INTO legal_entity_verification_decisions VALUES ('rejected',1,'claim-1','[]','PLANNERNET_LEGAL_ENTITY_REVIEW','GOVERNED_AUTHORIZED_REVIEWER','REJECTED','["MISMATCH"]',?,NULL,'correlation-r','[]')`).bind(now).run();
    await repo.transition(identity.legal_entity_id,"REVOKED","revocation-1",now,"correlation-r",["rejected"]);
    await repo.transition(successor.legal_entity_id,"SUPERSEDED","supersession-1",now,"correlation-s",["decision-successor"],identity.legal_entity_id);
    await expect(repo.resolveCurrent(identity.legal_entity_id,now)).rejects.toMatchObject({code:"LEGAL_ENTITY_REVOKED"});
    const transition=await db.prepare("SELECT * FROM legal_entity_status_transitions WHERE legal_entity_id=?").bind(identity.legal_entity_id).first<Record<string,unknown>>();
    expect(transition?.to_status).toBe("REVOKED");
    expect((await db.prepare("SELECT superseded_by_legal_entity_id FROM legal_entity_status_transitions WHERE legal_entity_id=?").bind(successor.legal_entity_id).first<{superseded_by_legal_entity_id:string}>())?.superseded_by_legal_entity_id).toBe(identity.legal_entity_id);
    await expect(db.prepare("UPDATE legal_entity_status_transitions SET to_status='EXPIRED'").run()).rejects.toThrow(/IMMUTABLE/);
    const audit=JSON.stringify((await db.prepare("SELECT * FROM legal_entity_audit_events").all()).results);
    expect(audit).not.toMatch(/document:vault|sha256:abc|credential|operational/);
  });
});
