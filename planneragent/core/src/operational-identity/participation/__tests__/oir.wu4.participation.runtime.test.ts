import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import m7 from "../../../../migrations/0007_oir_track_a_persistence.sql?raw";
import m8 from "../../../../migrations/0008_oir_authentication_runtime.sql?raw";
import m9 from "../../../../migrations/0009_oir_participation_runtime.sql?raw";
import { identifier } from "../../contracts/identifiers.v1";
import { D1OperationalIdentityRepositories } from "../../persistence";
import type { ParticipationResolutionRequestV1 } from "../participation.contracts.v1";
import { D1ParticipationRepository } from "../participation.persistence.d1";
import { OrganizationalParticipationRuntime } from "../participation.runtime.v1";

const db = env.POLICIES_DB;
const repositories = new D1OperationalIdentityRepositories(db);
const participation = new D1ParticipationRepository(db);
const now = "2026-07-29T10:00:00.000Z";
const principalId = identifier("PrincipalId", "principal-wu4");
const otherPrincipalId = identifier("PrincipalId", "principal-other");
const externalId = identifier("ExternalAuthenticationIdentityId", "external-wu4");
const sessionId = identifier("SessionId", "session-wu4");
const companyA = identifier("CompanyId", "company-a");
const companyB = identifier("CompanyId", "company-b");
const tenantA = identifier("TenantId", "tenant-a");
const tenantB = identifier("TenantId", "tenant-b");
const membershipA = identifier("MembershipId", "membership-a");
const correlationId = identifier("CorrelationId", "correlation-wu4");
let sequence = 0;

function queries(sql: string) {
  return sql.split(/;\s*\r?\n(?=CREATE (?:TABLE|UNIQUE INDEX|TRIGGER))/)
    .map(query => query.trim()).filter(Boolean)
    .map(query => query.endsWith(";") ? query : `${query};`);
}

function request(overrides: Partial<ParticipationResolutionRequestV1> = {}): ParticipationResolutionRequestV1 {
  return {
    version: 1,
    session_id: sessionId,
    correlation_id: correlationId,
    causal_references: Object.freeze([]),
    ...overrides,
  };
}

function runtime(participationStore = participation) {
  return new OrganizationalParticipationRuntime({
    sessions: repositories.sessions,
    principals: repositories.principals,
    participation: participationStore,
    ids: {
      participationContextId: () => identifier("ParticipationContextId", `participation-${++sequence}`),
      companySelectionId: () => `selection-${++sequence}`,
      participationAuditEventId: () => `participation-audit-${++sequence}`,
    },
    now: () => now,
  }, { executing_component: "operational-identity.participation.v1" });
}

async function addCompany(
  companyId: typeof companyA,
  tenantId: typeof tenantA,
  membershipId: typeof membershipA,
  principal = principalId,
) {
  await repositories.organizations.createCompany({
    version: 1, company_id: companyId, lifecycle_state: "ACTIVE", created_at: now,
  });
  await repositories.organizations.assignOwnership({
    version: 1, company_id: companyId, tenant_id: tenantId,
    effective_from: "2026-07-29T09:00:00.000Z",
    ownership_reference: `ownership-${companyId}`,
  });
  await repositories.memberships.createPending({
    version: 1, membership_id: membershipId, principal_id: principal,
    company_id: companyId, lifecycle_state: "REQUESTED", created_at: now,
    invitation_or_request_reference: `request-${membershipId}`,
  });
  await repositories.memberships.activate(membershipId, `activation-${membershipId}`, now);
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
}

beforeAll(async () => {
  await applyD1Migrations(db, [
    { name: "0007_oir_track_a_persistence.sql", queries: queries(m7) },
    { name: "0008_oir_authentication_runtime.sql", queries: queries(m8) },
    { name: "0009_oir_participation_runtime.sql", queries: queries(m9) },
  ]);
});

beforeEach(async () => {
  sequence = 0;
  await repositories.principals.create({
    version: 1, principal_id: principalId, actor_kind: "HUMAN",
    lifecycle_state: "ACTIVE", created_at: now,
  });
  await repositories.principals.create({
    version: 1, principal_id: otherPrincipalId, actor_kind: "HUMAN",
    lifecycle_state: "ACTIVE", created_at: now,
  });
  await repositories.externalBindings.create({
    version: 1, external_authentication_identity_id: externalId, actor_kind: "HUMAN",
    provider: "neutral-source", issuer: "urn:issuer", external_subject: "subject",
    authentication_method: "verified", assurance: "MULTI_FACTOR",
    verified_at: now, verification_reference: "verification",
  }, principalId);
  await repositories.sessions.create({
    version: 1, session_id: sessionId, principal_id: principalId,
    external_authentication_identity_id: externalId, issued_at: now,
    expires_at: "2026-07-29T11:00:00.000Z", assurance: "MULTI_FACTOR",
    lifecycle_state: "ACTIVE",
  });
  await repositories.organizations.createTenant({
    version: 1, tenant_id: tenantA, lifecycle_state: "ACTIVE", created_at: now,
  });
  await repositories.organizations.createTenant({
    version: 1, tenant_id: tenantB, lifecycle_state: "ACTIVE", created_at: now,
  });
  await addCompany(companyA, tenantA, membershipA);
});

describe("OIR-WU4 organizational participation runtime", () => {
  it("resolves one active membership, current tenant, and no fabricated access", async () => {
    const context = await runtime().resolve(request());
    expect(context).toMatchObject({
      principal_id: principalId, session_id: sessionId, membership_id: membershipA,
      selected_company_id: companyA, owning_tenant_id: tenantA,
      platform_role_ids: [], baseline_permissions: [],
    });
    expect(Object.keys(context).join(" ")).not.toMatch(/oag|authority|supervisor|delegat|upload_operational/i);
  });

  it("requires and persists explicit selection among multiple eligible companies", async () => {
    const membershipB = identifier("MembershipId", "membership-b");
    await addCompany(companyB, tenantB, membershipB);
    await expectCode(runtime().resolve(request()), "MULTIPLE_COMPANIES_REQUIRE_SELECTION");
    const selected = await runtime().resolve(request({ selected_company_id: companyB }));
    expect(selected.membership_id).toBe(membershipB);
    expect(selected.owning_tenant_id).toBe(tenantB);
    const restored = await runtime().resolve(request());
    expect(restored.selected_company_id).toBe(companyB);
  });

  it.each(["INVITED", "SUSPENDED", "REVOKED", "REMOVED"] as const)(
    "rejects %s membership participation",
    async state => {
      if (state === "INVITED") {
        await repositories.memberships.transition(membershipA, "REMOVED", "remove-active", now);
        const invited = identifier("MembershipId", "membership-invited");
        await repositories.memberships.createPending({
          version: 1, membership_id: invited, principal_id: principalId,
          company_id: companyA, lifecycle_state: "INVITED", created_at: now,
          invitation_or_request_reference: "invitation",
        });
      } else {
        await repositories.memberships.transition(membershipA, state, `decision-${state}`, now);
      }
      await expectCode(runtime().resolve(request({ selected_company_id: companyA })), "MEMBERSHIP_INACTIVE");
    },
  );

  it("fails closed with no active membership and rejects cross-company substitution", async () => {
    await repositories.memberships.transition(membershipA, "REMOVED", "removed", now);
    await expectCode(runtime().resolve(request()), "NO_ACTIVE_MEMBERSHIP");
    await expectCode(runtime().resolve(request({ selected_company_id: companyB })), "NO_ACTIVE_MEMBERSHIP");
  });

  it("rejects caller principal, membership, company, and tenant substitutions", async () => {
    await expectCode(runtime().resolve(request({
      claimed_principal_id: otherPrincipalId,
    })), "PARTICIPATION_CONTEXT_CONTRADICTORY");
    await expectCode(runtime().resolve(request({
      claimed_membership_id: identifier("MembershipId", "caller-membership"),
    })), "COMPANY_SELECTION_SUBSTITUTED");
    await expectCode(runtime().resolve(request({
      selected_company_id: companyB,
    })), "COMPANY_NOT_ELIGIBLE");
    await expectCode(runtime().resolve(request({
      claimed_tenant_id: tenantB,
    })), "TENANT_COMPANY_MISMATCH");
    const ignoredAccessClaims = await runtime().resolve(request({
      claimed_role_ids: [identifier("PlatformRoleId", "caller-role")],
      claimed_permissions: ["UPLOAD_DATA"],
    }));
    expect(ignoredAccessClaims.platform_role_ids).toEqual([]);
    expect(ignoredAccessClaims.baseline_permissions).toEqual([]);
  });

  it("rejects contradictory duplicate memberships and membership/principal mismatch", async () => {
    await repositories.memberships.createPending({
      version: 1, membership_id: identifier("MembershipId", "membership-duplicate"),
      principal_id: principalId, company_id: companyA, lifecycle_state: "REQUESTED",
      created_at: now, invitation_or_request_reference: "duplicate-request",
    });
    await repositories.memberships.activate(
      identifier("MembershipId", "membership-duplicate"), "duplicate-activation", now,
    );
    await expectCode(runtime().resolve(request()), "PARTICIPATION_CONTEXT_CONTRADICTORY");

    const mismatchStore = Object.create(participation) as D1ParticipationRepository;
    mismatchStore.membershipsForPrincipal = async () => Object.freeze([Object.freeze({
      membership_id: membershipA,
      principal_id: otherPrincipalId,
      company_id: companyA,
      lifecycle_state: "ACTIVE" as const,
      state_version: now,
    })]);
    await expectCode(runtime(mismatchStore).resolve(request()), "MEMBERSHIP_PRINCIPAL_MISMATCH");
  });

  it("rejects missing and ambiguous current tenant ownership", async () => {
    await db.prepare("DELETE FROM oir_tenant_company_ownership WHERE company_id = ?")
      .bind(companyA).run();
    await expectCode(runtime().resolve(request()), "TENANT_OWNERSHIP_MISSING");
  });

  it("rejects overlapping contradictory ownership", async () => {
    await db.prepare(`UPDATE oir_tenant_company_ownership
      SET effective_until = '2026-07-29T10:30:00.000Z' WHERE company_id = ?`)
      .bind(companyA).run();
    await repositories.organizations.assignOwnership({
      version: 1, company_id: companyA, tenant_id: tenantB,
      effective_from: "2026-07-29T09:30:00.000Z",
      ownership_reference: "overlapping-ownership",
    });
    await expectCode(runtime().resolve(request()), "TENANT_OWNERSHIP_AMBIGUOUS");
  });

  it("resolves roles and deterministic permissions without granting every permission", async () => {
    const role = identifier("PlatformRoleId", "role-basic");
    const view = identifier("PlatformPermissionId", "permission-view");
    const profile = identifier("PlatformPermissionId", "permission-profile");
    await repositories.platformAccess.createRole({ platform_role_id: role, name: "Basic access" });
    await repositories.platformAccess.createPermission({
      version: 1, platform_permission_id: view, code: "VIEW_COCKPIT", description: "View",
    });
    await repositories.platformAccess.createPermission({
      version: 1, platform_permission_id: profile, code: "MANAGE_PROFILE", description: "Profile",
    });
    await repositories.platformAccess.assignPermission(role, profile, now, "assign-profile");
    await repositories.platformAccess.assignPermission(role, view, now, "assign-view");
    await repositories.platformAccess.assignRole(membershipA, role, now, "assign-role");
    const context = await runtime().resolve(request());
    expect(context.platform_role_ids).toEqual([role]);
    expect(context.baseline_permissions).toEqual(["MANAGE_PROFILE", "VIEW_COCKPIT"]);
    expect(context.baseline_permissions).not.toContain("UPLOAD_DATA");
  });

  it("treats missing role and UPLOAD_DATA as baseline access results, not authentication failures", async () => {
    const context = await runtime().resolve(request());
    expect(context.platform_role_ids).toEqual([]);
    expect(context.baseline_permissions).not.toContain("UPLOAD_DATA");
    expect(context.principal_id).toBe(principalId);
  });

  it("invalidates stale selection after membership or session lifecycle changes", async () => {
    await runtime().resolve(request());
    await repositories.memberships.transition(membershipA, "SUSPENDED", "suspend", now);
    await expectCode(runtime().resolve(request()), "COMPANY_SELECTION_STALE");

    const selection = await participation.latestSelection(sessionId);
    expect(selection?.invalidation_reason).toBe("MEMBERSHIP_SUSPENDED");
  });

  it.each(["rotation", "logout", "revocation"] as const)(
    "invalidates selection after session %s",
    async action => {
      await runtime().resolve(request());
      if (action === "rotation") {
        await repositories.sessions.rotate(sessionId, {
          version: 1, session_id: identifier("SessionId", "replacement-session"),
          principal_id: principalId, external_authentication_identity_id: externalId,
          issued_at: now, expires_at: "2026-07-29T11:00:00.000Z",
          assurance: "MULTI_FACTOR", lifecycle_state: "ACTIVE",
        }, "rotation");
      } else if (action === "logout") {
        await repositories.sessions.logout(sessionId, "logout");
      } else {
        await repositories.sessions.revoke(sessionId, "revocation");
      }
      expect((await participation.latestSelection(sessionId))?.invalidated_at).not.toBeNull();
      await expectCode(runtime().resolve(request()), "SESSION_INVALID");
    },
  );

  it("returns an immutable defensively copied ephemeral context", async () => {
    const causal = [identifier("AuditLineageReference", "cause-1")];
    const context = await runtime().resolve(request({ causal_references: causal }));
    causal.push(identifier("AuditLineageReference", "cause-2"));
    expect(context.audit_lineage).toEqual(["cause-1"]);
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.platform_role_ids)).toBe(true);
    expect(Object.isFrozen(context.baseline_permissions)).toBe(true);
  });

  it("persists detailed immutable Layer 2 audit without file-derived facts", async () => {
    await runtime().resolve({
      ...request(),
      filename: "tenant-b-company-b.xlsx",
      file_metadata: { claimedTenant: tenantB },
    } as ParticipationResolutionRequestV1);
    const rows = await db.prepare(`SELECT event_kind, executing_component
      FROM oir_participation_audit_events ORDER BY rowid`).all<Record<string, string>>();
    expect(rows.results.map((row: Record<string, string>) => row.event_kind)).toEqual([
      "MEMBERSHIP_RESOLUTION", "COMPANY_RESOLUTION", "TENANT_RESOLUTION",
      "ROLE_RESOLUTION", "PERMISSION_RESOLUTION", "PARTICIPATION_CONTEXT_ISSUED",
    ]);
    expect(rows.results.every((row: Record<string, string>) =>
      row.executing_component === "operational-identity.participation.v1")).toBe(true);
    await expect(db.prepare(`UPDATE oir_participation_audit_events SET decision_result = 'DENIED'`).run())
      .rejects.toThrow(/IMMUTABLE/);
    await expect(db.prepare(`DELETE FROM oir_participation_audit_events`).run())
      .rejects.toThrow(/IMMUTABLE/);
  });
});
