import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import m7 from "../../../../migrations/0007_oir_track_a_persistence.sql?raw";
import m8 from "../../../../migrations/0008_oir_authentication_runtime.sql?raw";
import m9 from "../../../../migrations/0009_oir_participation_runtime.sql?raw";
import m10 from "../../../../migrations/0010_oir_governed_upload_authorization.sql?raw";
import m11 from "../../../../migrations/0011_oir_governed_upload_verification.sql?raw";
import {
  acquireUntrustedFileSecurely,
  type SecureFileAcquisitionServices,
} from "../../../industrial/acquisition/secure.file.acquisition";
import type { GovernedUploadOperationalContextV1 } from "../../contracts/track-a.v1";
import {
  D1GovernedUploadVerificationRepository,
  GovernedUploadLineageVerifierV1,
  type GovernedAdmissionRecord,
} from "..";

const db = env.POLICIES_DB;
const repository = new D1GovernedUploadVerificationRepository(db);
const verifier = new GovernedUploadLineageVerifierV1(repository);
const T0 = "2026-07-29T10:00:00.000Z";
const T1 = "2026-07-29T10:01:00.000Z";
let sequence = 0;

function queries(sql: string) {
  return sql.split(/;\s*\r?\n(?=CREATE (?:TABLE|UNIQUE INDEX|TRIGGER))/)
    .map(query => query.trim()).filter(Boolean)
    .map(query => query.endsWith(";") ? query : `${query};`);
}

beforeAll(async () => {
  await applyD1Migrations(db, [
    { name: "0007", queries: queries(m7) },
    { name: "0008", queries: queries(m8) },
    { name: "0009", queries: queries(m9) },
    { name: "0010", queries: queries(m10) },
    { name: "0011", queries: queries(m11) },
  ]);
});

async function scenario(fileName = "misleading-company-other.csv", bytes = new TextEncoder().encode("a,b\n1,2")) {
  const n = ++sequence;
  const id = (kind: string) => `${kind}-wu6a-${n}`;
  const principal = id("principal"), external = id("external"), session = id("session");
  const tenant = id("tenant"), company = id("company"), membership = id("membership");
  const decision = id("decision"), upload = id("upload"), admitted = id("admitted");
  await db.batch([
    db.prepare("INSERT INTO oir_principals VALUES (?, 'HUMAN', 'ACTIVE', ?)").bind(principal, T0),
    db.prepare("INSERT INTO oir_external_authentication_bindings VALUES (?, ?, 'HUMAN', 'neutral', 'issuer', ?, 'verified', 'MULTI_FACTOR', ?, 'proof')")
      .bind(external, principal, id("subject"), T0),
    db.prepare("INSERT INTO oir_server_sessions (session_id, principal_id, external_authentication_identity_id, issued_at, expires_at, assurance, lifecycle_state) VALUES (?, ?, ?, ?, '2026-07-29T11:00:00.000Z', 'MULTI_FACTOR', 'ACTIVE')")
      .bind(session, principal, external, T0),
    db.prepare("INSERT INTO oir_tenants VALUES (?, 'ACTIVE', ?)").bind(tenant, T0),
    db.prepare("INSERT INTO oir_companies VALUES (?, 'ACTIVE', ?)").bind(company, T0),
    db.prepare("INSERT INTO oir_tenant_company_ownership VALUES (?, ?, ?, NULL, ?)")
      .bind(company, tenant, T0, id("ownership")),
    db.prepare("INSERT INTO oir_organization_memberships (membership_id, principal_id, company_id, lifecycle_state, created_at, invitation_or_request_reference) VALUES (?, ?, ?, 'REQUESTED', ?, ?)")
      .bind(membership, principal, company, T0, id("request")),
  ]);
  await db.prepare(`UPDATE oir_organization_memberships SET lifecycle_state = 'ACTIVE',
    activation_reference = ?, activated_at = ? WHERE membership_id = ?`)
    .bind(id("activation"), T0, membership).run();
  await db.batch([
    db.prepare(`INSERT INTO oir_authorization_decisions VALUES
      (?, 'UPLOAD_DATA', 'ADMITTED', ?, ?, ?, ?, ?, 'governed-upload:industrial-file',
       'operational-planning', 'upload-policy-v1', ?, '2026-07-29T10:05:00.000Z', '["POLICY_ADMITTED"]')`)
      .bind(decision, principal, session, membership, tenant, company, T0),
    db.prepare("INSERT INTO oir_authorization_consumptions VALUES (?, 'CONSUMED', ?, ?, ?)")
      .bind(decision, T0, T0, `governed-upload:${upload}:wu8:${decision}`),
    db.prepare("INSERT INTO oir_governed_upload_authorizations VALUES (?, ?, ?, ?, '[]', ?)")
      .bind(decision, id("participation"), upload, id("correlation"), T0),
  ]);
  const context = Object.freeze({
    version: 1, upload_operational_context_id: id("context"),
    principal_id: principal, session_id: session, membership_id: membership,
    tenant_id: tenant, company_id: company, authorization_decision_id: decision,
    permission: "UPLOAD_DATA", upload_id: upload, resource: "governed-upload:industrial-file",
    purpose: "operational-planning", policy_version: "upload-policy-v1", issued_at: T0,
    expires_at: "2026-07-29T10:05:00.000Z", replay_state_reference: id("replay"),
    audit_lineage: Object.freeze([id("auth-audit"), id("participation-audit")]),
    correlation_id: id("correlation"),
  }) as GovernedUploadOperationalContextV1 & { correlation_id: string };
  const services: SecureFileAcquisitionServices = {
    async authorize(request) {
      return { authorized: true, uploadId: request.uploadId, tenantId: request.tenantId,
        companyId: request.companyId, authorizationReference: decision };
    },
    async quarantine(request) {
      return { quarantined: true, uploadId: request.uploadId, tenantId: request.tenantId,
        quarantineReference: id("quarantine"), byteDigest: request.byteDigest,
        byteLength: request.bytes.byteLength, quarantinedAt: T0 };
    },
    async inspect(request) {
      return { completed: true, inspectionId: id("inspection"),
        quarantineReference: request.quarantineReference, byteDigest: request.byteDigest,
        detectedFormat: "CSV", structureStatus: "VALID", extensionMediaTypeCoherent: true,
        passiveDataOnly: true, encrypted: false, macrosPresent: false,
        activeContentPresent: false, embeddedObjectsPresent: false,
        externalConnectionsPresent: false, archivePathTraversalDetected: false,
        decompressionBombDetected: false, resourceLimitsExceeded: false };
    },
    async scan(request) {
      return { completed: true, scanId: id("scan"), quarantineReference: request.quarantineReference,
        byteDigest: request.byteDigest, scannerProfileVersion: "scanner-v1", verdict: "CLEAN",
        scannedAt: T0 };
    },
  };
  const result = await acquireUntrustedFileSecurely({
    uploadId: upload, tenantId: tenant, companyId: company, workloadId: id("workload"),
    claimedFileName: fileName, claimedMediaType: "text/csv", bytes,
  }, services, () => Date.parse(T0));
  if (!result.processed || result.disposition !== "ADMITTED_FOR_GOVERNED_INTERPRETATION") {
    throw new Error("TEST_ACQUISITION_NOT_ADMITTED");
  }
  await repository.recordAdmission({
    admitted_object_id: admitted, acquisition_id: id("acquisition"),
  }, context, result, T1);
  return { admitted, decision, principal, session, membership, company, tenant, result };
}

describe("OIR-WU6A governed upload operational-context verification", () => {
  it("verifies the actual-D1 WU8 admission receipt end to end", async () => {
    const value = await scenario();
    const result = await verifier.verify(value.admitted);
    expect(result).toMatchObject({
      outcome: "VERIFIED", admitted_object_id: value.admitted,
      authorization_decision_id: value.decision, principal_id: value.principal,
      session_id: value.session, membership_id: value.membership,
      company_id: value.company, tenant_id: value.tenant,
      permission: "UPLOAD_DATA", current_state: { drifted: false },
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.audit_lineage)).toBe(true);
  });

  it("derives identity only from governed lineage, never file claims or bytes", async () => {
    const one = await scenario("tenant-other_company-other_admin.csv",
      new TextEncoder().encode('{"principal":"attacker","tenant":"other"}'));
    const result = await verifier.verify(one.admitted);
    expect(result.principal_id).toBe(one.principal);
    expect(result.tenant_id).toBe(one.tenant);
    expect(JSON.stringify(result)).not.toContain("attacker");
    expect(JSON.stringify(result)).not.toContain("tenant-other");
  });

  it.each([
    ["principal", "setLifecycle", "principal"],
    ["session", "revoke", "session"],
    ["membership", "transition", "membership"],
  ])("preserves historically valid lineage after current %s drift", async (_label, action, field) => {
    const value = await scenario();
    if (action === "setLifecycle") {
      await db.prepare("UPDATE oir_principals SET lifecycle_state = 'SUSPENDED' WHERE principal_id = ?")
        .bind(value.principal).run();
    } else if (action === "revoke") {
      await db.prepare("UPDATE oir_server_sessions SET lifecycle_state = 'REVOKED', revocation_reference = 'later' WHERE session_id = ?")
        .bind(value.session).run();
    } else {
      await db.prepare(`UPDATE oir_organization_memberships SET lifecycle_state = 'SUSPENDED',
        lifecycle_decision_reference = 'later', lifecycle_changed_at = ? WHERE membership_id = ?`)
        .bind(T1, value.membership).run();
    }
    const result = await verifier.verify(value.admitted);
    expect(result.outcome).toBe("VERIFIED");
    expect(result.current_state.drifted).toBe(true);
    expect(result.current_state[field as "principal"]).not.toBe("ACTIVE");
  });

  it("makes admitted lineage immutable and one-to-one with authorization", async () => {
    const value = await scenario();
    await expect(db.prepare("UPDATE oir_governed_upload_admissions SET purpose = 'tampered' WHERE admitted_object_id = ?")
      .bind(value.admitted).run()).rejects.toThrow(/IMMUTABLE/);
    await expect(db.prepare("DELETE FROM oir_governed_upload_admissions WHERE admitted_object_id = ?")
      .bind(value.admitted).run()).rejects.toThrow(/IMMUTABLE/);
    const row = await db.prepare("SELECT * FROM oir_governed_upload_admissions WHERE admitted_object_id = ?")
      .bind(value.admitted).first<Record<string, unknown>>();
    const columns = Object.keys(row!);
    const values = columns.map(column => row![column]);
    values[columns.indexOf("admitted_object_id")] = `${value.admitted}-replay`;
    values[columns.indexOf("acquisition_id")] = `${row!.acquisition_id}-replay`;
    await expect(db.prepare(`INSERT INTO oir_governed_upload_admissions (${columns.join(",")})
      VALUES (${columns.map(() => "?").join(",")})`).bind(...values).run()).rejects.toThrow();
  });

  it("rejects absent admitted objects through the narrow selector", async () => {
    await expect(verifier.verify("admitted-absent")).rejects
      .toMatchObject({ code: "ADMITTED_OBJECT_NOT_FOUND" });
  });

  it.each([
    ["AUTHORIZATION_DECISION_MISSING", (r: any) => { r.decision = null; }],
    ["AUTHORIZATION_NOT_ADMITTED", (r: any) => { r.decision.decision = "DENIED"; }],
    ["AUTHORIZATION_CONSUMPTION_MISSING", (r: any) => { r.consumption = null; }],
    ["AUTHORIZATION_NOT_CONSUMED", (r: any) => { r.consumption.lifecycle_state = "ISSUED"; }],
    ["AUTHORIZATION_CONSUMPTION_DUPLICATE", (r: any) => { r.counts.consumptions = 2; }],
    ["ADMISSION_LINEAGE_DUPLICATE", (r: any) => { r.counts.admissions = 2; }],
    ["GOVERNED_CONTEXT_MISSING", (r: any) => { r.binding = null; }],
    ["IDENTITY_LINEAGE_SUBSTITUTED", (r: any) => { r.admission.principal_id = "other"; }],
    ["SESSION_LINEAGE_SUBSTITUTED", (r: any) => { r.admission.session_id = "other"; }],
    ["MEMBERSHIP_LINEAGE_SUBSTITUTED", (r: any) => { r.admission.membership_id = "other"; }],
    ["TENANT_COMPANY_LINEAGE_SUBSTITUTED", (r: any) => { r.admission.tenant_id = "other"; }],
    ["AUTHORIZATION_LINEAGE_SUBSTITUTED", (r: any) => { r.admission.purpose = "other"; }],
    ["ACQUISITION_LINEAGE_SUBSTITUTED", (r: any) => { r.admission.byte_digest = "bad"; }],
    ["AUDIT_LINEAGE_MALFORMED", (r: any) => { r.admission.audit_lineage_json = "{"; }],
    ["TEMPORAL_LINEAGE_CONTRADICTORY", (r: any) => { r.admission.admitted_at = "2020-01-01T00:00:00.000Z"; }],
  ])("fails closed with typed %s", async (code, mutate) => {
    const value = await scenario();
    const original = await repository.resolve(value.admitted);
    const record = structuredClone(original) as GovernedAdmissionRecord;
    mutate(record);
    const isolated = new GovernedUploadLineageVerifierV1({ async resolve() { return record; } });
    await expect(isolated.verify(value.admitted)).rejects.toMatchObject({ code });
  });

  it.each([
    ["decision id", "authorization_decision_id", "AUTHORIZATION_LINEAGE_SUBSTITUTED"],
    ["company", "company_id", "TENANT_COMPANY_LINEAGE_SUBSTITUTED"],
    ["resource", "resource", "AUTHORIZATION_LINEAGE_SUBSTITUTED"],
    ["permission", "permission", "AUTHORIZATION_LINEAGE_SUBSTITUTED"],
    ["policy", "policy_version", "AUTHORIZATION_LINEAGE_SUBSTITUTED"],
    ["authorization reference", "authorization_reference", "AUTHORIZATION_LINEAGE_SUBSTITUTED"],
    ["binding upload", "binding.upload_id", "AUTHORIZATION_LINEAGE_SUBSTITUTED"],
    ["binding decision", "binding.authorization_decision_id", "AUTHORIZATION_LINEAGE_SUBSTITUTED"],
    ["consumption reference", "consumption_reference", "AUTHORIZATION_LINEAGE_SUBSTITUTED"],
    ["consumption upload", "consumption-upload", "ACQUISITION_LINEAGE_SUBSTITUTED"],
    ["digest algorithm", "byte_digest_algorithm", "ACQUISITION_LINEAGE_SUBSTITUTED"],
    ["zero byte length", "byte_length", "ACQUISITION_LINEAGE_SUBSTITUTED"],
    ["negative byte length", "negative-byte_length", "ACQUISITION_LINEAGE_SUBSTITUTED"],
    ["issued after consumption", "authorization_issued_at", "TEMPORAL_LINEAGE_CONTRADICTORY"],
    ["consumed after admission", "consumed_at", "TEMPORAL_LINEAGE_CONTRADICTORY"],
    ["admitted after recording", "recorded_at", "TEMPORAL_LINEAGE_CONTRADICTORY"],
    ["consumed at expiry", "authorization_expires_at", "TEMPORAL_LINEAGE_CONTRADICTORY"],
    ["non-string audit member", "audit_lineage_json", "AUDIT_LINEAGE_MALFORMED"],
  ])("rejects %s contradiction independently", async (_label, field, code) => {
    const value = await scenario();
    const record = structuredClone(await repository.resolve(value.admitted)) as GovernedAdmissionRecord;
    if (field === "binding.upload_id") record.binding!.upload_id = "other";
    else if (field === "binding.authorization_decision_id") record.binding!.authorization_decision_id = "other";
    else if (field === "consumption_reference") record.consumption!.consumption_reference = "other";
    else if (field === "consumption-upload") {
      record.admission.consumption_reference = `governed-upload:other:wu8:${value.decision}`;
      record.consumption!.consumption_reference = record.admission.consumption_reference;
    } else if (field === "byte_length") record.admission.byte_length = 0;
    else if (field === "negative-byte_length") record.admission.byte_length = -1;
    else if (field === "authorization_issued_at") {
      record.admission.authorization_issued_at = "2026-07-29T10:02:00.000Z";
    } else if (field === "consumed_at") record.admission.consumed_at = "2026-07-29T10:02:00.000Z";
    else if (field === "recorded_at") record.admission.recorded_at = "2026-07-29T09:59:00.000Z";
    else if (field === "authorization_expires_at") record.admission.authorization_expires_at = T0;
    else if (field === "audit_lineage_json") record.admission.audit_lineage_json = '["valid",1]';
    else if (field === "authorization_reference") record.admission.authorization_reference = "other";
    else {
      record.admission[field] = "other";
    }
    const isolated = new GovernedUploadLineageVerifierV1({ async resolve() { return record; } });
    await expect(isolated.verify(value.admitted)).rejects.toMatchObject({ code });
  });
});
