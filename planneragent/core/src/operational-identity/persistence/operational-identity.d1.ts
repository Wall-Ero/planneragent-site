import type {
  AuditEventId,
  AuditLineageReference,
  AuthorizationDecisionId,
  CompanyId,
  CorrelationId,
  ExternalAuthenticationIdentityId,
  MembershipId,
  ParticipationContextId,
  PlatformPermissionId,
  PlatformRoleId,
  PolicyVersionId,
  PrincipalId,
  SessionId,
  TenantId,
} from "../contracts/identifiers.v1";
import type {
  AuthorizationDecisionV1,
  BaselinePlatformPermissionCode,
  BaselinePlatformPermissionV1,
  CompanyV1,
  DurablePrincipalV1,
  ExternalAuthenticationIdentityV1,
  IdentityAccessAuditEnvelopeV1,
  OrganizationMembershipV1,
  ServerSessionV1,
  TenantCompanyOwnershipV1,
  TenantV1,
} from "../contracts/track-a.v1";
import type {
  AuthorizationRepository,
  ExternalAuthenticationBindingRepository,
  IdentityAuditRepository,
  MembershipRepository,
  OperationalIdentityRepositories,
  OrganizationRepository,
  PlatformAccessRepository,
  PrincipalRepository,
  ServerSessionRepository,
} from "./repositories.v1";

type Row = Record<string, unknown>;
const json = (value: readonly string[]) => JSON.stringify(value);
const changed = (result: D1Result<unknown>) => (result.meta.changes ?? 0) === 1;

function external(row: Row): ExternalAuthenticationIdentityV1 {
  return Object.freeze({
    version: 1,
    external_authentication_identity_id: row.external_authentication_identity_id as ExternalAuthenticationIdentityId,
    actor_kind: row.actor_kind as ExternalAuthenticationIdentityV1["actor_kind"],
    provider: row.provider as string,
    issuer: row.issuer as string,
    external_subject: row.external_subject as string,
    authentication_method: row.authentication_method as string,
    assurance: row.assurance as ExternalAuthenticationIdentityV1["assurance"],
    verified_at: row.verified_at as string,
    verification_reference: row.verification_reference as string,
  });
}

function session(row: Row): ServerSessionV1 {
  const value: ServerSessionV1 = {
    version: 1,
    session_id: row.session_id as SessionId,
    principal_id: row.principal_id as PrincipalId,
    external_authentication_identity_id: row.external_authentication_identity_id as ExternalAuthenticationIdentityId,
    issued_at: row.issued_at as string,
    expires_at: row.expires_at as string,
    assurance: row.assurance as ServerSessionV1["assurance"],
    lifecycle_state: row.lifecycle_state as ServerSessionV1["lifecycle_state"],
    ...(row.revocation_reference === null ? {} : { revocation_reference: row.revocation_reference as string }),
  };
  return Object.freeze(value);
}

function membership(row: Row): OrganizationMembershipV1 {
  const base = {
    version: 1 as const,
    membership_id: row.membership_id as MembershipId,
    principal_id: row.principal_id as PrincipalId,
    company_id: row.company_id as CompanyId,
    created_at: row.created_at as string,
  };
  if (row.lifecycle_state === "REQUESTED" || row.lifecycle_state === "INVITED") {
    return Object.freeze({ ...base, lifecycle_state: row.lifecycle_state, invitation_or_request_reference: row.invitation_or_request_reference as string });
  }
  if (row.lifecycle_state === "ACTIVE") {
    return Object.freeze({ ...base, lifecycle_state: "ACTIVE", activation_reference: row.activation_reference as string, activated_at: row.activated_at as string });
  }
  return Object.freeze({
    ...base,
    lifecycle_state: row.lifecycle_state as "SUSPENDED" | "REVOKED" | "REMOVED",
    lifecycle_decision_reference: row.lifecycle_decision_reference as string,
    lifecycle_changed_at: row.lifecycle_changed_at as string,
  });
}

function authorization(row: Row): AuthorizationDecisionV1 {
  return Object.freeze({
    version: 1,
    authorization_decision_id: row.authorization_decision_id as AuthorizationDecisionId,
    permission: row.permission as BaselinePlatformPermissionCode,
    decision: row.decision as AuthorizationDecisionV1["decision"],
    principal_id: row.principal_id as PrincipalId,
    session_id: row.session_id as SessionId,
    membership_id: row.membership_id as MembershipId,
    tenant_id: row.tenant_id as TenantId,
    company_id: row.company_id as CompanyId,
    resource: row.resource as string,
    purpose: row.purpose as string,
    policy_version: row.policy_version as PolicyVersionId,
    issued_at: row.issued_at as string,
    expires_at: row.expires_at as string,
    reason_codes: Object.freeze(JSON.parse(row.reason_codes_json as string) as string[]),
  });
}

export class D1OperationalIdentityRepositories implements OperationalIdentityRepositories {
  readonly externalBindings: ExternalAuthenticationBindingRepository;
  readonly principals: PrincipalRepository;
  readonly sessions: ServerSessionRepository;
  readonly organizations: OrganizationRepository;
  readonly memberships: MembershipRepository;
  readonly platformAccess: PlatformAccessRepository;
  readonly authorizations: AuthorizationRepository;
  readonly audit: IdentityAuditRepository;

  constructor(private readonly db: D1Database) {
    this.externalBindings = {
      create: async (binding, principalId) => {
        await db.prepare(`INSERT INTO oir_external_authentication_bindings (
          external_authentication_identity_id, principal_id, actor_kind, provider, issuer,
          external_subject, authentication_method, assurance, verified_at, verification_reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
          binding.external_authentication_identity_id, principalId, binding.actor_kind,
          binding.provider, binding.issuer, binding.external_subject,
          binding.authentication_method, binding.assurance, binding.verified_at,
          binding.verification_reference,
        ).run();
      },
      resolve: async (provider, issuer, subject) => {
        const row = await db.prepare(`SELECT * FROM oir_external_authentication_bindings
          WHERE provider = ? AND issuer = ? AND external_subject = ?`)
          .bind(provider, issuer, subject).first<Row>();
        return row ? Object.freeze({ binding: external(row), principal_id: row.principal_id as PrincipalId }) : null;
      },
    };

    this.principals = {
      create: async principal => {
        await db.prepare(`INSERT INTO oir_principals
          (principal_id, actor_kind, lifecycle_state, created_at) VALUES (?, ?, ?, ?)`)
          .bind(principal.principal_id, principal.actor_kind, principal.lifecycle_state, principal.created_at).run();
      },
      find: async principalId => {
        const row = await db.prepare(`SELECT * FROM oir_principals WHERE principal_id = ?`)
          .bind(principalId).first<Row>();
        return row ? Object.freeze({
          version: 1, principal_id: row.principal_id as PrincipalId,
          actor_kind: row.actor_kind as DurablePrincipalV1["actor_kind"],
          lifecycle_state: row.lifecycle_state as DurablePrincipalV1["lifecycle_state"],
          created_at: row.created_at as string,
        }) : null;
      },
      setLifecycle: async (principalId, state) => changed(await db.prepare(
        `UPDATE oir_principals SET lifecycle_state = ? WHERE principal_id = ? AND lifecycle_state <> ?`,
      ).bind(state, principalId, state).run()),
    };

    const endSession = async (sessionId: SessionId, state: "EXPIRED" | "REVOKED", reference: string) =>
      changed(await db.prepare(`UPDATE oir_server_sessions
        SET lifecycle_state = ?, revocation_reference = ?
        WHERE session_id = ? AND lifecycle_state = 'ACTIVE'`)
        .bind(state, reference, sessionId).run());
    this.sessions = {
      create: value => this.insertSession(value),
      find: async sessionId => {
        const row = await db.prepare(`SELECT * FROM oir_server_sessions WHERE session_id = ?`)
          .bind(sessionId).first<Row>();
        return row ? session(row) : null;
      },
      rotate: async (sessionId, replacement, reference) => {
        const statements = [
          db.prepare(`INSERT INTO oir_server_sessions (
            session_id, principal_id, external_authentication_identity_id, issued_at,
            expires_at, assurance, lifecycle_state, revocation_reference, rotated_to_session_id
          ) SELECT ?, ?, ?, ?, ?, ?, ?, ?, NULL
          WHERE EXISTS (
            SELECT 1 FROM oir_server_sessions
            WHERE session_id = ? AND lifecycle_state = 'ACTIVE'
          )`).bind(
            replacement.session_id, replacement.principal_id,
            replacement.external_authentication_identity_id, replacement.issued_at,
            replacement.expires_at, replacement.assurance, replacement.lifecycle_state,
            replacement.revocation_reference ?? null, sessionId,
          ),
          db.prepare(`UPDATE oir_server_sessions SET lifecycle_state = 'ROTATED',
            revocation_reference = ?, rotated_to_session_id = ?
            WHERE session_id = ? AND lifecycle_state = 'ACTIVE'`)
            .bind(reference, replacement.session_id, sessionId),
        ];
        const results = await db.batch(statements);
        if (!changed(results[0]!) || !changed(results[1]!)) {
          throw new Error("OIR_SESSION_ROTATION_REJECTED");
        }
        return true;
      },
      expire: (id, reference) => endSession(id, "EXPIRED", reference),
      revoke: (id, reference) => endSession(id, "REVOKED", reference),
      logout: (id, reference) => endSession(id, "REVOKED", `LOGOUT:${reference}`),
    };

    this.organizations = {
      createTenant: async tenant => {
        await db.prepare(`INSERT INTO oir_tenants (tenant_id, lifecycle_state, created_at) VALUES (?, ?, ?)`)
          .bind(tenant.tenant_id, tenant.lifecycle_state, tenant.created_at).run();
      },
      createCompany: async company => {
        await db.prepare(`INSERT INTO oir_companies (company_id, lifecycle_state, created_at) VALUES (?, ?, ?)`)
          .bind(company.company_id, company.lifecycle_state, company.created_at).run();
      },
      assignOwnership: async ownership => {
        await db.prepare(`INSERT INTO oir_tenant_company_ownership
          (company_id, tenant_id, effective_from, effective_until, ownership_reference)
          VALUES (?, ?, ?, ?, ?)`).bind(
          ownership.company_id, ownership.tenant_id, ownership.effective_from,
          ownership.effective_until ?? null, ownership.ownership_reference,
        ).run();
      },
      resolveTenant: async (companyId, at) => {
        const row = await db.prepare(`SELECT tenant_id FROM oir_tenant_company_ownership
          WHERE company_id = ? AND effective_from <= ?
          AND (effective_until IS NULL OR effective_until > ?)
          ORDER BY effective_from DESC LIMIT 1`).bind(companyId, at, at).first<{ tenant_id: string }>();
        return row?.tenant_id as TenantId | undefined ?? null;
      },
    };

    this.memberships = {
      createPending: async value => {
        await db.prepare(`INSERT INTO oir_organization_memberships (
          membership_id, principal_id, company_id, lifecycle_state, created_at,
          invitation_or_request_reference
        ) VALUES (?, ?, ?, ?, ?, ?)`).bind(
          value.membership_id, value.principal_id, value.company_id,
          value.lifecycle_state, value.created_at, value.invitation_or_request_reference,
        ).run();
      },
      find: async id => {
        const row = await db.prepare(`SELECT * FROM oir_organization_memberships WHERE membership_id = ?`)
          .bind(id).first<Row>();
        return row ? membership(row) : null;
      },
      activate: async (id, reference, at) => changed(await db.prepare(`
        UPDATE oir_organization_memberships SET lifecycle_state = 'ACTIVE',
          activation_reference = ?, activated_at = ?,
          lifecycle_decision_reference = NULL, lifecycle_changed_at = NULL
        WHERE membership_id = ? AND lifecycle_state IN ('REQUESTED', 'INVITED', 'SUSPENDED')
      `).bind(reference, at, id).run()),
      transition: async (id, state, reference, at) => changed(await db.prepare(`
        UPDATE oir_organization_memberships SET lifecycle_state = ?,
          lifecycle_decision_reference = ?, lifecycle_changed_at = ?
        WHERE membership_id = ? AND lifecycle_state IN ('REQUESTED', 'INVITED', 'ACTIVE', 'SUSPENDED')
      `).bind(state, reference, at, id).run()),
    };

    this.platformAccess = {
      createRole: async role => {
        await db.prepare(`INSERT INTO oir_platform_roles (platform_role_id, name) VALUES (?, ?)`)
          .bind(role.platform_role_id, role.name).run();
      },
      createPermission: async permission => {
        await db.prepare(`INSERT INTO oir_platform_permissions
          (platform_permission_id, code, description) VALUES (?, ?, ?)`)
          .bind(permission.platform_permission_id, permission.code, permission.description).run();
      },
      assignPermission: async (roleId, permissionId, at, reference) => {
        await db.prepare(`INSERT INTO oir_role_permission_assignments
          (platform_role_id, platform_permission_id, assigned_at, assignment_reference)
          VALUES (?, ?, ?, ?)`).bind(roleId, permissionId, at, reference).run();
      },
      assignRole: async (membershipId, roleId, at, reference) => {
        await db.prepare(`INSERT INTO oir_membership_role_assignments
          (membership_id, platform_role_id, assigned_at, assignment_reference)
          VALUES (?, ?, ?, ?)`).bind(membershipId, roleId, at, reference).run();
      },
      revokeRole: async (membershipId, roleId, at, reference) => changed(await db.prepare(`
        UPDATE oir_membership_role_assignments SET revoked_at = ?, revocation_reference = ?
        WHERE membership_id = ? AND platform_role_id = ? AND revoked_at IS NULL
      `).bind(at, reference, membershipId, roleId).run()),
    };

    this.authorizations = {
      create: async decision => {
        await db.prepare(`INSERT INTO oir_authorization_decisions (
          authorization_decision_id, permission, decision, principal_id, session_id,
          membership_id, tenant_id, company_id, resource, purpose, policy_version,
          issued_at, expires_at, reason_codes_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
          decision.authorization_decision_id, decision.permission, decision.decision,
          decision.principal_id, decision.session_id, decision.membership_id,
          decision.tenant_id, decision.company_id, decision.resource, decision.purpose,
          decision.policy_version, decision.issued_at, decision.expires_at,
          json(decision.reason_codes),
        ).run();
      },
      find: async id => {
        const row = await db.prepare(`SELECT * FROM oir_authorization_decisions WHERE authorization_decision_id = ?`)
          .bind(id).first<Row>();
        return row ? authorization(row) : null;
      },
      issueConsumption: async (id, at) => {
        await db.prepare(`INSERT INTO oir_authorization_consumptions
          (authorization_decision_id, lifecycle_state, issued_at) VALUES (?, 'ISSUED', ?)`)
          .bind(id, at).run();
      },
      consume: async (id, at, reference) => changed(await db.prepare(`
        UPDATE oir_authorization_consumptions SET lifecycle_state = 'CONSUMED',
          consumed_at = ?, consumption_reference = ?
        WHERE authorization_decision_id = ? AND lifecycle_state = 'ISSUED'
      `).bind(at, reference, id).run()),
    };

    this.audit = {
      append: async event => {
        await db.prepare(`INSERT INTO oir_identity_audit_events (
          audit_event_id, actor_kind, external_authentication_identity_id,
          executing_component, principal_id, session_id, participation_context_id,
          authorization_decision_id, correlation_id, caused_by_json, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
          event.audit_event_id, event.authenticated_actor.actor_kind,
          event.authenticated_actor.external_authentication_identity_id,
          event.executing_component, event.principal_id, event.session_id,
          event.participation_context_id ?? null, event.authorization_decision_id ?? null,
          event.correlation_id, json(event.caused_by), event.recorded_at,
        ).run();
      },
      find: async id => {
        const row = await db.prepare(`SELECT * FROM oir_identity_audit_events WHERE audit_event_id = ?`)
          .bind(id).first<Row>();
        if (!row) return null;
        return Object.freeze({
          version: 1,
          audit_event_id: row.audit_event_id as AuditEventId,
          authenticated_actor: Object.freeze({
            actor_kind: row.actor_kind as ExternalAuthenticationIdentityV1["actor_kind"],
            external_authentication_identity_id: row.external_authentication_identity_id as ExternalAuthenticationIdentityId,
          }),
          executing_component: row.executing_component as string,
          principal_id: row.principal_id as PrincipalId,
          session_id: row.session_id as SessionId,
          ...(row.participation_context_id === null ? {} : { participation_context_id: row.participation_context_id as ParticipationContextId }),
          ...(row.authorization_decision_id === null ? {} : { authorization_decision_id: row.authorization_decision_id as AuthorizationDecisionId }),
          correlation_id: row.correlation_id as CorrelationId,
          caused_by: Object.freeze(JSON.parse(row.caused_by_json as string) as AuditLineageReference[]),
          recorded_at: row.recorded_at as string,
        });
      },
    };
  }

  private sessionInsert(value: ServerSessionV1): D1PreparedStatement {
    return this.db.prepare(`INSERT INTO oir_server_sessions (
      session_id, principal_id, external_authentication_identity_id, issued_at,
      expires_at, assurance, lifecycle_state, revocation_reference, rotated_to_session_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`).bind(
      value.session_id, value.principal_id, value.external_authentication_identity_id,
      value.issued_at, value.expires_at, value.assurance, value.lifecycle_state,
      value.revocation_reference ?? null,
    );
  }

  private async insertSession(value: ServerSessionV1): Promise<void> {
    await this.sessionInsert(value).run();
  }
}
