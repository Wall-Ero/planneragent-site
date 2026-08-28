import { applyD1Migrations, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import m7 from "../../../../migrations/0007_oir_track_a_persistence.sql?raw";
import m33 from "../../../../migrations/0033_email_ownership_registration.sql?raw";
import m34 from "../../../../migrations/0034_email_account_identity_label.sql?raw";

const queries=(sql:string)=>sql.split(/;\s*\r?\n(?=CREATE (?:TABLE|INDEX|UNIQUE INDEX|TRIGGER))/).map(x=>x.trim()).filter(Boolean).map(x=>x.endsWith(";")?x:`${x};`);

describe("email account identity label migration",()=>{
  it("backfills an existing verified binding once from its consumed challenge provenance",async()=>{
    const db=env.POLICIES_DB,reference="email-challenge:legacy-challenge";
    await applyD1Migrations(db,[{name:"0007",queries:queries(m7)},{name:"0033",queries:queries(m33)}]);
    await db.prepare("INSERT INTO oir_principals (principal_id,actor_kind,lifecycle_state,created_at) VALUES ('legacy-principal','HUMAN','ACTIVE','2026-01-01T00:00:00.000Z')").run();
    await db.prepare("INSERT INTO email_ownership_challenges (challenge_id,normalized_email,secret_digest,issued_at,expires_at,lifecycle_state,failed_attempts,consumed_at,evidence_id,evidence_nonce,verification_reference,audit_lineage_json) VALUES ('legacy-challenge','Legacy.User@example.com','digest','2026-01-01T00:00:00.000Z','2026-01-01T00:10:00.000Z','CONSUMED',0,'2026-01-01T00:01:00.000Z','legacy-evidence','legacy-nonce',?,'[]')").bind(reference).run();
    await db.prepare("INSERT INTO oir_external_authentication_bindings (external_authentication_identity_id,principal_id,actor_kind,provider,issuer,external_subject,authentication_method,assurance,verified_at,verification_reference) VALUES ('legacy-binding','legacy-principal','HUMAN','EMAIL_OWNERSHIP','planneragent:email-ownership','legacy-subject','ONE_TIME_EMAIL_CODE','SINGLE_FACTOR','2026-01-01T00:01:00.000Z',?)").bind(reference).run();
    await applyD1Migrations(db,[{name:"0034",queries:queries(m34)}]);
    expect(await db.prepare("SELECT verified_normalized_email,verification_reference FROM oir_external_authentication_bindings WHERE external_authentication_identity_id='legacy-binding'").first()).toMatchObject({verified_normalized_email:"Legacy.User@example.com",verification_reference:reference});
  });
});
