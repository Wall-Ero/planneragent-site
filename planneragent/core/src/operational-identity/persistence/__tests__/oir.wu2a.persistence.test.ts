import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import migration from "../../../../migrations/0007_oir_track_a_persistence.sql?raw";
import { identifier } from "../../contracts/identifiers.v1";
import type {
  AuthorizationDecisionV1,
  ExternalAuthenticationIdentityV1,
  OrganizationMembershipV1,
  ServerSessionV1,
} from "../../contracts/track-a.v1";
import { D1OperationalIdentityRepositories } from "../operational-identity.d1";

const at = "2026-07-29T10:00:00.000Z";
const later = "2026-07-29T11:00:00.000Z";
const expires = "2026-07-29T12:00:00.000Z";
const principalId = identifier("PrincipalId", "principal-1");
const otherPrincipalId = identifier("PrincipalId", "principal-2");
const externalId = identifier("ExternalAuthenticationIdentityId", "external-1");
const sessionId = identifier("SessionId", "session-1");
const tenantId = identifier("TenantId", "tenant-1");
const otherTenantId = identifier("TenantId", "tenant-2");
const companyId = identifier("CompanyId", "company-1");
const membershipId = identifier("MembershipId", "membership-1");
const decisionId = identifier("AuthorizationDecisionId", "decision-1");

const db = env.POLICIES_DB;
const repositories = new D1OperationalIdentityRepositories(db);

function binding(subject = "subject-1"): ExternalAuthenticationIdentityV1 {
  return {
    version: 1,
    external_authentication_identity_id: externalId,
    actor_kind: "HUMAN",
    provider: "OIDC",
    issuer: "https://issuer.example",
    external_subject: subject,
    authentication_method: "authorization_code",
    assurance: "MULTI_FACTOR",
    verified_at: at,
    verification_reference: "verification-1",
  };
}

function activeSession(id = sessionId, principal = principalId): ServerSessionV1 {
  return {
    version: 1,
    session_id: id,
    principal_id: principal,
    external_authentication_identity_id: externalId,
    issued_at: at,
    expires_at: expires,
    assurance: "MULTI_FACTOR",
    lifecycle_state: "ACTIVE",
  };
}

function requestedMembership(id = membershipId, principal = principalId): Extract<OrganizationMembershipV1, { lifecycle_state: "REQUESTED" | "INVITED" }> {
  return {
    version: 1,
    membership_id: id,
    principal_id: principal,
    company_id: companyId,
    lifecycle_state: "REQUESTED",
    created_at: at,
    invitation_or_request_reference: "request-1",
  };
}

function decision(id = decisionId, tenant = tenantId): AuthorizationDecisionV1 {
  return {
    version: 1,
    authorization_decision_id: id,
    permission: "UPLOAD_DATA",
    decision: "ADMITTED",
    principal_id: principalId,
    session_id: sessionId,
    membership_id: membershipId,
    tenant_id: tenant,
    company_id: companyId,
    resource: "upload:1",
    purpose: "planning-import",
    policy_version: identifier("PolicyVersionId", "policy-1"),
    issued_at: later,
    expires_at: expires,
    reason_codes: [],
  };
}

beforeAll(async () => {
  const queries = migration
    .split(/;\s*\r?\n(?=CREATE (?:TABLE|UNIQUE INDEX|TRIGGER))/)
    .map(query => query.trim())
    .filter(Boolean)
    .map(query => query.endsWith(";") ? query : `${query};`);
  await applyD1Migrations(db, [{ name: "0007_oir_track_a_persistence.sql", queries }]);
});

beforeEach(async () => {
  await repositories.principals.create({ version: 1, principal_id: principalId, actor_kind: "HUMAN", lifecycle_state: "ACTIVE", created_at: at });
  await repositories.principals.create({ version: 1, principal_id: otherPrincipalId, actor_kind: "HUMAN", lifecycle_state: "ACTIVE", created_at: at });
  await repositories.externalBindings.create(binding(), principalId);
  await repositories.sessions.create(activeSession());
  await repositories.organizations.createTenant({ version: 1, tenant_id: tenantId, lifecycle_state: "ACTIVE", created_at: at });
  await repositories.organizations.createTenant({ version: 1, tenant_id: otherTenantId, lifecycle_state: "ACTIVE", created_at: at });
  await repositories.organizations.createCompany({ version: 1, company_id: companyId, lifecycle_state: "ACTIVE", created_at: at });
  await repositories.organizations.assignOwnership({ version: 1, company_id: companyId, tenant_id: tenantId, effective_from: at, ownership_reference: "ownership-1" });
  await repositories.memberships.createPending(requestedMembership());
});

describe("OIR-WU2A migration integrity", () => {
  it("creates every Track A durable table with foreign keys enabled", async () => {
    const tables = await db.prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'oir_%' ORDER BY name`,
    ).all<{ name: string }>();
    expect(tables.results.map(row => row.name)).toEqual([
      "oir_authorization_consumptions",
      "oir_authorization_decisions",
      "oir_companies",
      "oir_external_authentication_bindings",
      "oir_identity_audit_events",
      "oir_membership_role_assignments",
      "oir_organization_memberships",
      "oir_platform_permissions",
      "oir_platform_roles",
      "oir_principals",
      "oir_role_permission_assignments",
      "oir_server_sessions",
      "oir_tenant_company_ownership",
      "oir_tenants",
    ]);
    expect((await db.prepare("PRAGMA foreign_keys").first<{ foreign_keys: number }>())?.foreign_keys).toBe(1);
  });
});

describe("OIR-WU2A D1 repositories and persistence boundaries", () => {
  it("persists the Track A graph and resolves external identity and ownership", async () => {
    expect((await repositories.externalBindings.resolve("OIDC", "https://issuer.example", "subject-1"))?.principal_id).toBe(principalId);
    expect(await repositories.organizations.resolveTenant(companyId, later)).toBe(tenantId);
    expect((await repositories.sessions.find(sessionId))?.assurance).toBe("MULTI_FACTOR");
    expect((await repositories.memberships.find(membershipId))?.lifecycle_state).toBe("REQUESTED");
  });

  it("enforces provider identity uniqueness and principal/binding coherence", async () => {
    await expect(repositories.externalBindings.create({
      ...binding(), external_authentication_identity_id: identifier("ExternalAuthenticationIdentityId", "external-duplicate"),
    }, otherPrincipalId)).rejects.toThrow();
    await expect(repositories.sessions.create({
      ...activeSession(identifier("SessionId", "session-wrong-principal"), otherPrincipalId),
    })).rejects.toThrow();
  });

  it("requires governed membership activation and enforces lifecycle transitions", async () => {
    expect(await repositories.memberships.activate(membershipId, "activation-decision-1", later)).toBe(true);
    expect((await repositories.memberships.find(membershipId))?.lifecycle_state).toBe("ACTIVE");
    expect(await repositories.memberships.transition(membershipId, "SUSPENDED", "suspension-1", expires)).toBe(true);
    expect(await repositories.memberships.transition(membershipId, "REMOVED", "removal-1", expires)).toBe(true);
    await expect(db.prepare(`UPDATE oir_organization_memberships SET lifecycle_state = 'ACTIVE',
      activation_reference = 'bad', activated_at = ? WHERE membership_id = ?`).bind(expires, membershipId).run()).rejects.toThrow();

    await expect(db.prepare(`INSERT INTO oir_organization_memberships (
      membership_id, principal_id, company_id, lifecycle_state, created_at, activation_reference, activated_at
    ) VALUES ('membership-direct-active', ?, ?, 'ACTIVE', ?, 'caller', ?)`)
      .bind(principalId, companyId, at, later).run()).rejects.toThrow(/ACTIVATION_REQUIRES/);
  });

  it("prevents a company from having two current tenants", async () => {
    await expect(repositories.organizations.assignOwnership({
      version: 1, company_id: companyId, tenant_id: otherTenantId,
      effective_from: later, ownership_reference: "ownership-cross-tenant",
    })).rejects.toThrow();
  });

  it("persists baseline platform roles, permissions, assignment, and revocation history", async () => {
    const roleId = identifier("PlatformRoleId", "role-uploader");
    const permissionId = identifier("PlatformPermissionId", "permission-upload");
    await repositories.platformAccess.createRole({ platform_role_id: roleId, name: "Uploader" });
    await repositories.platformAccess.createPermission({ version: 1, platform_permission_id: permissionId, code: "UPLOAD_DATA", description: "Upload governed data" });
    await repositories.platformAccess.assignPermission(roleId, permissionId, at, "role-permission-1");
    await repositories.platformAccess.assignRole(membershipId, roleId, at, "membership-role-1");
    expect(await repositories.platformAccess.revokeRole(membershipId, roleId, later, "membership-role-revoke-1")).toBe(true);
    expect(await repositories.platformAccess.revokeRole(membershipId, roleId, expires, "membership-role-revoke-2")).toBe(false);
  });

  it("enforces authorization sovereignty, immutability, and atomic single consumption", async () => {
    const activeMembershipId = identifier("MembershipId", "membership-active-for-auth");
    await repositories.memberships.createPending(requestedMembership(activeMembershipId));
    await repositories.memberships.activate(activeMembershipId, "activation-auth", later);
    const auth = { ...decision(), membership_id: activeMembershipId };
    await repositories.authorizations.create(auth);
    expect((await repositories.authorizations.find(decisionId))?.reason_codes).toEqual([]);

    await expect(repositories.authorizations.create({
      ...auth,
      authorization_decision_id: identifier("AuthorizationDecisionId", "decision-cross-tenant"),
      tenant_id: otherTenantId,
    })).rejects.toThrow();
    await expect(db.prepare(`UPDATE oir_authorization_decisions SET purpose = 'tampered'
      WHERE authorization_decision_id = ?`).bind(decisionId).run()).rejects.toThrow(/IMMUTABLE/);
    await expect(db.prepare(`DELETE FROM oir_authorization_decisions
      WHERE authorization_decision_id = ?`).bind(decisionId).run()).rejects.toThrow(/IMMUTABLE/);

    await repositories.authorizations.issueConsumption(decisionId, later);
    const attempts = await Promise.all([
      repositories.authorizations.consume(decisionId, expires, "consume-1"),
      repositories.authorizations.consume(decisionId, expires, "consume-2"),
    ]);
    expect(attempts.filter(Boolean)).toHaveLength(1);
    expect(await repositories.authorizations.consume(decisionId, expires, "replay")).toBe(false);
  });

  it("rotates sessions atomically and preserves revoked session history", async () => {
    const replacementId = identifier("SessionId", "session-2");
    await repositories.sessions.rotate(sessionId, {
      ...activeSession(replacementId), issued_at: later,
    }, "rotation-1");
    expect((await repositories.sessions.find(sessionId))?.lifecycle_state).toBe("ROTATED");
    expect((await repositories.sessions.find(replacementId))?.lifecycle_state).toBe("ACTIVE");
    expect(await repositories.sessions.logout(replacementId, "user-request")).toBe(true);
    expect((await repositories.sessions.find(replacementId))?.revocation_reference).toBe("LOGOUT:user-request");

    const orphanId = identifier("SessionId", "session-orphan");
    await expect(repositories.sessions.rotate(replacementId, {
      ...activeSession(orphanId), issued_at: later,
    }, "invalid-rotation")).rejects.toThrow("OIR_SESSION_ROTATION_REJECTED");
    expect(await repositories.sessions.find(orphanId)).toBeNull();
  });

  it("appends immutable identity audit history", async () => {
    const auditId = identifier("AuditEventId", "audit-1");
    await repositories.audit.append({
      version: 1,
      audit_event_id: auditId,
      authenticated_actor: { actor_kind: "HUMAN", external_authentication_identity_id: externalId },
      executing_component: "oir.persistence.test",
      principal_id: principalId,
      session_id: sessionId,
      correlation_id: identifier("CorrelationId", "correlation-1"),
      caused_by: [],
      recorded_at: expires,
    });
    expect((await repositories.audit.find(auditId))?.executing_component).toBe("oir.persistence.test");
    await expect(db.prepare(`UPDATE oir_identity_audit_events SET executing_component = 'tampered'
      WHERE audit_event_id = ?`).bind(auditId).run()).rejects.toThrow(/IMMUTABLE/);
    await expect(db.prepare(`DELETE FROM oir_identity_audit_events WHERE audit_event_id = ?`)
      .bind(auditId).run()).rejects.toThrow(/IMMUTABLE/);
  });
});
