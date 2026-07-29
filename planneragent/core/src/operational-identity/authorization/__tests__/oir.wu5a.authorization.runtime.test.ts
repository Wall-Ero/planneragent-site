import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import m7 from "../../../../migrations/0007_oir_track_a_persistence.sql?raw";
import m8 from "../../../../migrations/0008_oir_authentication_runtime.sql?raw";
import m9 from "../../../../migrations/0009_oir_participation_runtime.sql?raw";
import m10 from "../../../../migrations/0010_oir_governed_upload_authorization.sql?raw";
import { identifier } from "../../contracts/identifiers.v1";
import { D1OperationalIdentityRepositories } from "../../persistence";
import { D1ParticipationRepository, OrganizationalParticipationRuntime } from "../../participation";
import type { ResolvedOperationalParticipationV1 } from "../../participation";
import { D1UploadAuthorizationPersistence } from "../authorization.persistence.d1";
import { DeterministicUploadAuthorizationPolicyV1 } from "../authorization.policy.v1";
import { GovernedUploadAuthorizationRuntime } from "../authorization.runtime.v1";
import { createWu8UploadAuthorizationBoundary } from "../wu8.authorization.boundary.v1";

const db = env.POLICIES_DB;
const repositories = new D1OperationalIdentityRepositories(db);
const participationStore = new D1ParticipationRepository(db);
const authorizationStore = new D1UploadAuthorizationPersistence(db);
const principalId = identifier("PrincipalId", "principal-wu5a");
const externalId = identifier("ExternalAuthenticationIdentityId", "external-wu5a");
const sessionId = identifier("SessionId", "session-wu5a");
const tenantId = identifier("TenantId", "tenant-wu5a");
const companyId = identifier("CompanyId", "company-wu5a");
const membershipId = identifier("MembershipId", "membership-wu5a");
const uploadId = identifier("UploadId", "upload-wu5a");
const correlationId = identifier("CorrelationId", "correlation-wu5a");
let clock = "2026-07-29T10:00:00.000Z";
let sequence = 0;

function queries(sql: string) {
  return sql.split(/;\s*\r?\n(?=CREATE (?:TABLE|UNIQUE INDEX|TRIGGER))/)
    .map(query => query.trim()).filter(Boolean)
    .map(query => query.endsWith(";") ? query : `${query};`);
}

function participationRuntime() {
  return new OrganizationalParticipationRuntime({
    sessions: repositories.sessions,
    principals: repositories.principals,
    participation: participationStore,
    ids: {
      participationContextId: () => identifier("ParticipationContextId", `participation-${++sequence}`),
      companySelectionId: () => `selection-${++sequence}`,
      participationAuditEventId: () => `participation-audit-${++sequence}`,
    },
    now: () => clock,
  }, { executing_component: "participation.test" });
}

function authorizationRuntime() {
  return new GovernedUploadAuthorizationRuntime({
    authorizations: repositories.authorizations,
    persistence: authorizationStore,
    policy: new DeterministicUploadAuthorizationPolicyV1({
      version: "upload-policy-v1",
      allowed_resource_prefixes: ["governed-upload:"],
      allowed_purposes: ["operational-planning"],
      validity_ms: 5 * 60 * 1000,
    }),
    ids: {
      authorizationDecisionId: () => identifier("AuthorizationDecisionId", `authorization-${++sequence}`),
      authorizationAuditEventId: () => `authorization-audit-${++sequence}`,
      replayStateReference: decisionId =>
        identifier("ReplayStateReference", `replay:${decisionId}`),
    },
    now: () => clock,
  }, { executing_component: "operational-identity.authorization.v1" });
}

async function context(): Promise<ResolvedOperationalParticipationV1> {
  return participationRuntime().resolve({
    version: 1,
    session_id: sessionId,
    correlation_id: correlationId,
    causal_references: Object.freeze([]),
  });
}

async function authorize(participation?: ResolvedOperationalParticipationV1) {
  const resolved = participation ?? await context();
  return authorizationRuntime().authorize({
    version: 1,
    participation: resolved,
    upload_id: uploadId,
    resource: "governed-upload:industrial-file",
    purpose: "operational-planning",
    correlation_id: correlationId,
    causal_references: Object.freeze([]),
  });
}

function consumption(governed: NonNullable<Awaited<ReturnType<typeof authorize>>["governed_context"]>) {
  return {
    authorization_decision_id: governed.authorization_decision_id,
    upload_id: governed.upload_id,
    principal_id: governed.principal_id,
    session_id: governed.session_id,
    membership_id: governed.membership_id,
    company_id: governed.company_id,
    tenant_id: governed.tenant_id,
    resource: governed.resource,
    purpose: governed.purpose,
    correlation_id: correlationId,
  };
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
}

beforeAll(async () => {
  await applyD1Migrations(db, [
    { name: "0007_oir_track_a_persistence.sql", queries: queries(m7) },
    { name: "0008_oir_authentication_runtime.sql", queries: queries(m8) },
    { name: "0009_oir_participation_runtime.sql", queries: queries(m9) },
    { name: "0010_oir_governed_upload_authorization.sql", queries: queries(m10) },
  ]);
});

beforeEach(async () => {
  clock = "2026-07-29T10:00:00.000Z";
  sequence = 0;
  await repositories.principals.create({
    version: 1, principal_id: principalId, actor_kind: "HUMAN",
    lifecycle_state: "ACTIVE", created_at: clock,
  });
  await repositories.externalBindings.create({
    version: 1, external_authentication_identity_id: externalId,
    actor_kind: "HUMAN", provider: "neutral", issuer: "urn:issuer",
    external_subject: "subject", authentication_method: "verified",
    assurance: "MULTI_FACTOR", verified_at: clock, verification_reference: "verification",
  }, principalId);
  await repositories.sessions.create({
    version: 1, session_id: sessionId, principal_id: principalId,
    external_authentication_identity_id: externalId, issued_at: clock,
    expires_at: "2026-07-29T11:00:00.000Z", assurance: "MULTI_FACTOR",
    lifecycle_state: "ACTIVE",
  });
  await repositories.organizations.createTenant({
    version: 1, tenant_id: tenantId, lifecycle_state: "ACTIVE", created_at: clock,
  });
  await repositories.organizations.createCompany({
    version: 1, company_id: companyId, lifecycle_state: "ACTIVE", created_at: clock,
  });
  await repositories.organizations.assignOwnership({
    version: 1, company_id: companyId, tenant_id: tenantId,
    effective_from: "2026-07-29T09:00:00.000Z", ownership_reference: "ownership-wu5a",
  });
  await repositories.memberships.createPending({
    version: 1, membership_id: membershipId, principal_id: principalId,
    company_id: companyId,
    lifecycle_state: "REQUESTED", created_at: clock,
    invitation_or_request_reference: "membership-request",
  });
  await repositories.memberships.activate(membershipId, "membership-activation", clock);
  const roleId = identifier("PlatformRoleId", "role-uploader");
  const permissionId = identifier("PlatformPermissionId", "permission-upload");
  await repositories.platformAccess.createRole({ platform_role_id: roleId, name: "Uploader" });
  await repositories.platformAccess.createPermission({
    version: 1, platform_permission_id: permissionId,
    code: "UPLOAD_DATA", description: "Request governed upload admission",
  });
  await repositories.platformAccess.assignPermission(
    roleId, permissionId, clock, "role-permission-upload",
  );
  await repositories.platformAccess.assignRole(
    membershipId, roleId, clock, "membership-role-uploader",
  );
});

describe("OIR-WU5A governed upload authorization runtime", () => {
  it("issues an immutable admitted decision and canonical governed context", async () => {
    const result = await authorize();
    expect(result.authorization.decision).toMatchObject({
      decision: "ADMITTED", permission: "UPLOAD_DATA",
      principal_id: principalId, session_id: sessionId, membership_id: membershipId,
      company_id: companyId, tenant_id: tenantId,
      resource: "governed-upload:industrial-file", purpose: "operational-planning",
    });
    expect(result.governed_context).toMatchObject({
      upload_id: uploadId,
      authorization_decision_id: result.authorization.decision.authorization_decision_id,
      correlation_id: correlationId,
    });
    expect(Object.isFrozen(result.governed_context)).toBe(true);
    expect(Object.keys(result.governed_context!).join(" ")).not.toMatch(/oag|supervisor|delegat|financial_authority/i);
  });

  it("persists denied policy decisions when permission, resource, or purpose is insufficient", async () => {
    const role = identifier("PlatformRoleId", "role-uploader");
    await repositories.platformAccess.revokeRole(membershipId, role, clock, "revoke-upload");
    const deniedPermission = await authorize(await context());
    expect(deniedPermission.authorization.decision.decision).toBe("DENIED");
    expect(deniedPermission.authorization.decision.reason_codes).toContain("BASELINE_PERMISSION_MISSING");
    expect(deniedPermission.governed_context).toBeUndefined();

    const current = await context();
    const deniedResource = await authorizationRuntime().authorize({
      version: 1, participation: current, upload_id: identifier("UploadId", "upload-resource"),
      resource: "uncontrolled:resource", purpose: "operational-planning",
      correlation_id: correlationId, causal_references: [],
    });
    expect(deniedResource.authorization.decision.reason_codes).toContain("RESOURCE_NOT_ALLOWED");
    const deniedPurpose = await authorizationRuntime().authorize({
      version: 1, participation: current, upload_id: identifier("UploadId", "upload-purpose"),
      resource: "governed-upload:file", purpose: "unapproved-purpose",
      correlation_id: correlationId, causal_references: [],
    });
    expect(deniedPurpose.authorization.decision.reason_codes).toContain("PURPOSE_NOT_ALLOWED");
  });

  it.each([
    ["session", async () => repositories.sessions.revoke(sessionId, "revoked"), "AUTHORIZATION_SESSION_INELIGIBLE"],
    ["principal", async () => repositories.principals.setLifecycle(principalId, "SUSPENDED"), "AUTHORIZATION_PRINCIPAL_INELIGIBLE"],
    ["membership", async () => repositories.memberships.transition(membershipId, "SUSPENDED", "suspended", clock), "AUTHORIZATION_MEMBERSHIP_INELIGIBLE"],
    ["ownership", async () => db.prepare("DELETE FROM oir_tenant_company_ownership WHERE company_id = ?").bind(companyId).run(), "AUTHORIZATION_TENANT_COMPANY_CONTRADICTORY"],
  ])("rejects stale current %s state", async (_label, mutate, code) => {
    const participation = await context();
    await mutate();
    await expectCode(authorize(participation), code);
  });

  it("atomically consumes once and rejects replay", async () => {
    const result = await authorize();
    const governed = result.governed_context!;
    await authorizationRuntime().consume(governed, consumption(governed));
    await expectCode(
      authorizationRuntime().consume(governed, consumption(governed)),
      "AUTHORIZATION_ALREADY_CONSUMED",
    );
  });

  it("rejects expired authorization before consumption", async () => {
    const result = await authorize();
    clock = "2026-07-29T10:06:00.000Z";
    await expectCode(
      authorizationRuntime().consume(result.governed_context!, consumption(result.governed_context!)),
      "AUTHORIZATION_EXPIRED",
    );
  });

  it.each([
    ["upload_id", identifier("UploadId", "upload-substituted")],
    ["principal_id", identifier("PrincipalId", "principal-substituted")],
    ["session_id", identifier("SessionId", "session-substituted")],
    ["membership_id", identifier("MembershipId", "membership-substituted")],
    ["company_id", identifier("CompanyId", "company-substituted")],
    ["tenant_id", identifier("TenantId", "tenant-substituted")],
    ["resource", "governed-upload:other"],
    ["purpose", "other-purpose"],
  ] as const)("rejects %s substitution", async (field, value) => {
    const result = await authorize();
    const governed = result.governed_context!;
    await expectCode(authorizationRuntime().consume(governed, {
      ...consumption(governed), [field]: value,
    }), "AUTHORIZATION_SUBSTITUTED");
  });

  it("rejects context-side identity substitution", async () => {
    const result = await authorize();
    const governed = result.governed_context!;
    await expectCode(authorizationRuntime().consume({
      ...governed, company_id: identifier("CompanyId", "context-company-substitution"),
    }, consumption(governed)), "AUTHORIZATION_SUBSTITUTED");
  });

  it("persists immutable decision, upload binding, consumption, and audit history", async () => {
    const result = await authorize();
    const governed = result.governed_context!;
    await authorizationRuntime().consume(governed, consumption(governed));
    await expect(db.prepare(`UPDATE oir_authorization_decisions SET purpose = 'tampered'`).run())
      .rejects.toThrow(/IMMUTABLE/);
    await expect(db.prepare(`UPDATE oir_governed_upload_authorizations SET upload_id = 'tampered'`).run())
      .rejects.toThrow(/IMMUTABLE/);
    await expect(db.prepare(`DELETE FROM oir_authorization_audit_events`).run())
      .rejects.toThrow(/IMMUTABLE/);
    expect((await db.prepare(`SELECT COUNT(*) AS count FROM oir_authorization_audit_events`)
      .first<{ count: number }>())?.count).toBe(3);
  });

  it("adapts to WU8's frozen authorization boundary without changing semantics", async () => {
    const result = await authorize();
    const boundary = createWu8UploadAuthorizationBoundary(
      authorizationRuntime(), result.governed_context!,
    );
    const admitted = await boundary.authorize({
      uploadId, tenantId, companyId, workloadId: "wu8-workload",
    });
    expect(admitted).toEqual({
      authorized: true, uploadId, tenantId, companyId,
      authorizationReference: result.authorization.decision.authorization_decision_id,
    });
    const replay = await boundary.authorize({
      uploadId, tenantId, companyId, workloadId: "wu8-workload",
    });
    expect(replay.authorized).toBe(false);
  });

  it("rejects WU8 upload, tenant, and company substitution at the boundary", async () => {
    const result = await authorize();
    const boundary = createWu8UploadAuthorizationBoundary(
      authorizationRuntime(), result.governed_context!,
    );
    for (const attempt of [
      { uploadId: "other-upload", tenantId, companyId, workloadId: "workload" },
      { uploadId, tenantId: "other-tenant", companyId, workloadId: "workload" },
      { uploadId, tenantId, companyId: "other-company", workloadId: "workload" },
    ]) {
      expect((await boundary.authorize(attempt)).authorized).toBe(false);
    }
  });
});
