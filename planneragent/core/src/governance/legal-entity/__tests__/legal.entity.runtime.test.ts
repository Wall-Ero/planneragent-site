import { describe, expect, it } from "vitest";
import { verifyLegalEntityV1, revalidateLegalEntityV1, type LegalEntityVerificationRequestV1 } from "..";

const now = "2026-08-06T10:00:00.000Z";
function request(): LegalEntityVerificationRequestV1 {
  return {
    claim: { version:1,claim_id:"claim-1",claimant_principal_id:"principal-1",claim_status:"EVIDENCE_SUBMITTED",registered_name:"Acme Italia S.r.l.",jurisdiction:"it",registration_type:"COMPANY",registration_identifier:" mi-1234567 ",registration_profile:"business_register",evidence_references:["evidence-1"],purpose:"LEGAL_ENTITY_IDENTIFICATION",issued_at:"2026-08-01T00:00:00.000Z",expires_at:"2026-09-01T00:00:00.000Z",correlation_id:"correlation-1",caused_by:["onboarding-1"] },
    evidence: [{ version:1,evidence_id:"evidence-1",issuer_id:"PLANNERNET_GOVERNED_EVIDENCE_INTAKE",evidence_type:"SIGNED_OFFICIAL_DOCUMENT_REFERENCE",subject_claim_id:"claim-1",jurisdiction:"IT",registration_profile:"BUSINESS_REGISTER",registration_identifier:"MI-1234567",registered_name:"Acme Italia S.r.l.",issued_at:"2026-08-01T00:00:00.000Z",effective_at:"2026-07-01T00:00:00.000Z",expires_at:"2026-09-01T00:00:00.000Z",immutable_digest:"sha256:abc",governed_reference:"document:vault:1",verification_state:"ACCEPTED",verification_authority_id:"PLANNERNET_LEGAL_ENTITY_REVIEW" }],
    decision: { version:1,decision_id:"decision-1",claim_id:"claim-1",evidence_ids:["evidence-1"],verifier_id:"PLANNERNET_LEGAL_ENTITY_REVIEW",verifier_class:"GOVERNED_AUTHORIZED_REVIEWER",decision:"VERIFIED",reason_codes:[],decided_at:now,valid_until:"2026-09-01T00:00:00.000Z",correlation_id:"correlation-1",caused_by:["evidence-1"] },
  };
}
async function code(value: Promise<unknown>, expected: string) { await expect(value).rejects.toMatchObject({code:expected}); }

describe("LE-WU1 claims and bounded evidence", () => {
  it("normalizes a valid claim into a deterministic verified identity", async () => {
    const one=await verifyLegalEntityV1(request(),now); const two=await verifyLegalEntityV1(request(),now);
    expect(one).toEqual(two); expect(one.canonical_key).toBe("IT:BUSINESS_REGISTER:MI-1234567");
    expect(one.verification_status).toBe("VERIFIED_BY_AUTHORIZED_REVIEW");
  });
  it("denies malformed claims, unsupported jurisdictions, and malformed identifiers", async () => {
    await code(verifyLegalEntityV1({...request(),claim:{...request().claim,claim_id:""}},now),"LEGAL_ENTITY_CLAIM_INVALID");
    await code(verifyLegalEntityV1({...request(),claim:{...request().claim,jurisdiction:"US"}},now),"LEGAL_ENTITY_JURISDICTION_UNSUPPORTED");
    await code(verifyLegalEntityV1({...request(),claim:{...request().claim,registration_identifier:"?"}},now),"LEGAL_ENTITY_IDENTIFIER_INVALID");
  });
  it("does not infer verification from Company name, email domain, payment, or subscription", async () => {
    const bare={...request(),evidence:[]};
    for(const assertion of [{company_name:"Acme"},{email_domain:"acme.it"},{paid:true},{subscription:"ACTIVE"}])
      await code(verifyLegalEntityV1({...bare,...assertion} as LegalEntityVerificationRequestV1,now),"LEGAL_ENTITY_EVIDENCE_REQUIRED");
  });
  it("denies missing, expired, untrusted, cross-jurisdiction, mismatched, and contradictory evidence", async () => {
    await code(verifyLegalEntityV1({...request(),evidence:[]},now),"LEGAL_ENTITY_EVIDENCE_REQUIRED");
    await code(verifyLegalEntityV1({...request(),evidence:[{...request().evidence[0]!,expires_at:now}]},now),"LEGAL_ENTITY_EVIDENCE_EXPIRED");
    await code(verifyLegalEntityV1({...request(),evidence:[{...request().evidence[0]!,issuer_id:"claimant"}]},now),"LEGAL_ENTITY_EVIDENCE_ISSUER_UNTRUSTED");
    await code(verifyLegalEntityV1({...request(),evidence:[{...request().evidence[0]!,jurisdiction:"GB"}]},now),"LEGAL_ENTITY_IDENTITY_MISMATCH");
    await code(verifyLegalEntityV1({...request(),evidence:[{...request().evidence[0]!,registration_identifier:"MI-7654321"}]},now),"LEGAL_ENTITY_IDENTITY_MISMATCH");
    await code(verifyLegalEntityV1({...request(),evidence:[{...request().evidence[0]!,registered_name:"Other S.r.l."}]},now),"LEGAL_ENTITY_CONFLICT");
  });
  it("prevents claimant self-verification and arbitrary verifier assertion", async () => {
    await code(verifyLegalEntityV1({...request(),decision:{...request().decision,verifier_id:"principal-1"}},now),"LEGAL_ENTITY_VERIFIER_UNAUTHORIZED");
    await code(verifyLegalEntityV1({...request(),decision:{...request().decision,decision:"REJECTED"}},now),"LEGAL_ENTITY_NOT_VERIFIED");
  });
});

describe("LE-WU1 verified identity boundaries", () => {
  it("returns deeply immutable defensive copies without membership or authority", async () => {
    const input=request(); const output=await verifyLegalEntityV1(input,now); (input.claim as {registered_name:string}).registered_name="Mutated";
    expect(output.registered_name).toBe("Acme Italia S.r.l."); expect(Object.isFrozen(output)).toBe(true); expect(Object.isFrozen(output.caused_by)).toBe(true);
    expect(output).not.toHaveProperty("membership_id"); expect(output).not.toHaveProperty("authority"); expect(output).not.toHaveProperty("contractual_authority");
  });
  it("denies expired, revoked, and superseded current identities", async () => {
    const value=await verifyLegalEntityV1(request(),now);
    await code(Promise.resolve().then(()=>revalidateLegalEntityV1(value,"2026-09-01T00:00:00.000Z")),"LEGAL_ENTITY_VERIFICATION_EXPIRED");
    await code(Promise.resolve().then(()=>revalidateLegalEntityV1({...value,verification_status:"REVOKED"},now)),"LEGAL_ENTITY_REVOKED");
    await code(Promise.resolve().then(()=>revalidateLegalEntityV1({...value,verification_status:"SUPERSEDED"},now)),"LEGAL_ENTITY_SUPERSEDED");
  });
  it("keeps same names with distinct identifiers distinct and ignores domains/tenant names", async () => {
    const one=await verifyLegalEntityV1(request(),now);
    const base=request(); const other:LegalEntityVerificationRequestV1={
      claim:{...base.claim,claim_id:"claim-2",registration_identifier:"MI-7654321",evidence_references:["evidence-2"]},
      evidence:[{...base.evidence[0]!,evidence_id:"evidence-2",subject_claim_id:"claim-2",registration_identifier:"MI-7654321"}],
      decision:{...base.decision,decision_id:"decision-2",claim_id:"claim-2",evidence_ids:["evidence-2"]}
    };
    const two=await verifyLegalEntityV1({...other,email_domain:"acme.it",tenant_display_name:"Acme"} as LegalEntityVerificationRequestV1,now);
    expect(two.legal_entity_id).not.toBe(one.legal_entity_id);
  });
});
