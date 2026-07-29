import type {
  AuditLineageReference,
  CompanyId,
  MembershipId,
  PlatformPermissionId,
  PlatformRoleId,
  PrincipalId,
  SessionId,
  TenantId,
} from "../contracts/identifiers.v1";
import type {
  BaselinePlatformPermissionCode,
  ServerSessionV1,
} from "../contracts/track-a.v1";
import type {
  PrincipalRepository,
  ServerSessionRepository,
} from "../persistence/repositories.v1";
import {
  ParticipationRuntimeError,
  type ParticipationAuditEventV1,
  type ParticipationFailureCode,
  type ParticipationResolutionRequestV1,
  type ResolvedOperationalParticipationV1,
} from "./participation.contracts.v1";
import {
  D1ParticipationRepository,
  type CompanySelectionRecord,
  type ParticipationMembershipRecord,
} from "./participation.persistence.d1";

export interface ParticipationRuntimeIds {
  participationContextId(): import("../contracts/identifiers.v1").ParticipationContextId;
  companySelectionId(): string;
  participationAuditEventId(): string;
}

export interface ParticipationRuntimeDependencies {
  readonly sessions: ServerSessionRepository;
  readonly principals: PrincipalRepository;
  readonly participation: Pick<D1ParticipationRepository,
    "membershipsForPrincipal" | "membershipById" | "currentOwnerships" |
    "rolePermissions" | "latestSelection" | "select" | "appendAudit">;
  readonly ids: ParticipationRuntimeIds;
  readonly now: () => string;
}

export interface ParticipationRuntimePolicy {
  readonly executing_component: string;
}

function fail(code: ParticipationFailureCode): never {
  throw new ParticipationRuntimeError(code);
}

export class OrganizationalParticipationRuntime {
  constructor(
    private readonly dependencies: ParticipationRuntimeDependencies,
    private readonly policy: ParticipationRuntimePolicy,
  ) {}

  async resolve(request: ParticipationResolutionRequestV1): Promise<ResolvedOperationalParticipationV1> {
    const session = await this.validateSession(request.session_id);
    const principal = await this.dependencies.principals.find(session.principal_id);
    if (!principal || principal.lifecycle_state !== "ACTIVE") fail("PRINCIPAL_INELIGIBLE");
    if (request.claimed_principal_id && request.claimed_principal_id !== principal.principal_id) {
      return this.deny(request, session, "PARTICIPATION_CONTEXT_CONTRADICTORY");
    }

    let membership: ParticipationMembershipRecord | undefined;
    let companyId: CompanyId | undefined;
    let tenantId: TenantId | undefined;
    let roleIds: readonly PlatformRoleId[] = Object.freeze([]);
    let permissionIds: readonly PlatformPermissionId[] = Object.freeze([]);
    let permissions: readonly BaselinePlatformPermissionCode[] = Object.freeze([]);
    try {
      const allMemberships = await this.dependencies.participation.membershipsForPrincipal(principal.principal_id);
      const active = allMemberships.filter(value => value.lifecycle_state === "ACTIVE");
      await this.audit(request, session, "MEMBERSHIP_RESOLUTION", "ADMITTED", {
        membership_id: active.length === 1 ? active[0]!.membership_id : undefined,
      });
      if (active.length === 0) {
        const latest = await this.dependencies.participation.latestSelection(session.session_id);
        if (!request.selected_company_id && latest && latest.invalidated_at !== null) {
          fail("COMPANY_SELECTION_STALE");
        }
        if (request.selected_company_id) {
          const inactive = allMemberships.find(value => value.company_id === request.selected_company_id);
          if (inactive) fail("MEMBERSHIP_INACTIVE");
        }
        fail("NO_ACTIVE_MEMBERSHIP");
      }

      const byCompany = new Map<CompanyId, ParticipationMembershipRecord[]>();
      for (const candidate of active) {
        const values = byCompany.get(candidate.company_id) ?? [];
        values.push(candidate);
        byCompany.set(candidate.company_id, values);
      }
      if ([...byCompany.values()].some(values => values.length !== 1)) {
        fail("PARTICIPATION_CONTEXT_CONTRADICTORY");
      }

      const selection = await this.resolveSelection(request, session, byCompany);
      membership = byCompany.get(selection.company_id)?.[0];
      if (!membership) fail("COMPANY_NOT_ELIGIBLE");
      companyId = membership.company_id;
      if (membership.principal_id !== principal.principal_id) fail("MEMBERSHIP_PRINCIPAL_MISMATCH");
      if (request.claimed_membership_id && request.claimed_membership_id !== membership.membership_id) {
        fail("COMPANY_SELECTION_SUBSTITUTED");
      }
      await this.audit(request, session, "COMPANY_RESOLUTION", "ADMITTED", {
        membership_id: membership.membership_id, company_id: companyId,
      });

      const ownerships = await this.dependencies.participation.currentOwnerships(companyId, this.dependencies.now());
      if (ownerships.length === 0) fail("TENANT_OWNERSHIP_MISSING");
      if (ownerships.length !== 1) fail("TENANT_OWNERSHIP_AMBIGUOUS");
      const ownership = ownerships[0]!;
      tenantId = ownership.tenant_id;
      if (request.claimed_tenant_id && request.claimed_tenant_id !== tenantId) {
        fail("TENANT_COMPANY_MISMATCH");
      }
      await this.audit(request, session, "TENANT_RESOLUTION", "ADMITTED", {
        membership_id: membership.membership_id, company_id: companyId, tenant_id: tenantId,
      });

      const assignments = await this.dependencies.participation.rolePermissions(membership.membership_id);
      roleIds = Object.freeze([...new Set(assignments.map(value => value.platform_role_id))].sort());
      permissionIds = Object.freeze([...new Set(assignments
        .map(value => value.platform_permission_id)
        .filter((value): value is PlatformPermissionId => value !== null))].sort());
      permissions = Object.freeze([...new Set(assignments
        .map(value => value.permission_code)
        .filter((value): value is BaselinePlatformPermissionCode => value !== null))].sort());
      await this.audit(request, session, "ROLE_RESOLUTION", "ADMITTED", {
        membership_id: membership.membership_id, company_id: companyId,
        tenant_id: tenantId, role_ids: roleIds,
      });
      await this.audit(request, session, "PERMISSION_RESOLUTION", "ADMITTED", {
        membership_id: membership.membership_id, company_id: companyId,
        tenant_id: tenantId, role_ids: roleIds, permissions,
      });

      const context = Object.freeze({
        version: 1 as const,
        participation_context_id: this.dependencies.ids.participationContextId(),
        principal_id: principal.principal_id,
        session_id: session.session_id,
        membership_id: membership.membership_id,
        selected_company_id: companyId,
        owning_tenant_id: tenantId,
        resolved_at: this.dependencies.now(),
        platform_role_ids: Object.freeze([...roleIds]),
        platform_permission_ids: Object.freeze([...permissionIds]),
        baseline_permissions: Object.freeze([...permissions]),
        membership_state_version: membership.state_version,
        ownership_reference: ownership.ownership_reference,
        company_selection_reference: selection.selection_reference,
        audit_lineage: Object.freeze([...request.causal_references]),
        correlation_id: request.correlation_id,
      });
      await this.audit(request, session, "PARTICIPATION_CONTEXT_ISSUED", "ADMITTED", {
        membership_id: membership.membership_id, company_id: companyId,
        tenant_id: tenantId, role_ids: roleIds, permissions,
      });
      return context;
    } catch (error) {
      if (!(error instanceof ParticipationRuntimeError)) throw error;
      await this.audit(request, session, this.failureEventKind(error.code), "DENIED", {
        membership_id: membership?.membership_id,
        company_id: companyId,
        tenant_id: tenantId,
        role_ids: roleIds,
        permissions,
        failure_code: error.code,
      });
      throw error;
    }
  }

  private async validateSession(sessionId: SessionId): Promise<ServerSessionV1> {
    const session = await this.dependencies.sessions.find(sessionId);
    if (
      !session ||
      session.lifecycle_state !== "ACTIVE" ||
      Date.parse(session.expires_at) <= Date.parse(this.dependencies.now())
    ) {
      fail("SESSION_INVALID");
    }
    return session;
  }

  private async resolveSelection(
    request: ParticipationResolutionRequestV1,
    session: ServerSessionV1,
    memberships: ReadonlyMap<CompanyId, ParticipationMembershipRecord[]>,
  ): Promise<CompanySelectionRecord> {
    const explicit = request.selected_company_id;
    if (explicit) {
      const membership = memberships.get(explicit)?.[0];
      if (!membership) fail("COMPANY_NOT_ELIGIBLE");
      const selected = await this.persistSelection(session, membership, request);
      await this.audit(request, session, "COMPANY_SELECTION", "ADMITTED", {
        membership_id: membership.membership_id, company_id: membership.company_id,
      });
      return selected;
    }

    const latest = await this.dependencies.participation.latestSelection(session.session_id);
    if (latest) {
      if (latest.invalidated_at !== null) fail("COMPANY_SELECTION_STALE");
      const membership = memberships.get(latest.company_id)?.[0];
      if (
        !membership ||
        latest.principal_id !== session.principal_id ||
        latest.membership_id !== membership.membership_id
      ) {
        fail("COMPANY_SELECTION_STALE");
      }
      return latest;
    }
    if (memberships.size !== 1) fail("MULTIPLE_COMPANIES_REQUIRE_SELECTION");
    const membership = [...memberships.values()][0]![0]!;
    return this.persistSelection(session, membership, request);
  }

  private persistSelection(
    session: ServerSessionV1,
    membership: ParticipationMembershipRecord,
    request: ParticipationResolutionRequestV1,
  ): Promise<CompanySelectionRecord> {
    const selectionId = this.dependencies.ids.companySelectionId();
    return this.dependencies.participation.select({
      company_selection_id: selectionId,
      session_id: session.session_id,
      principal_id: session.principal_id,
      membership_id: membership.membership_id,
      company_id: membership.company_id,
      selected_at: this.dependencies.now(),
      selection_reference: `participation-selection:${selectionId}:${request.correlation_id}`,
    });
  }

  private failureEventKind(code: ParticipationFailureCode): ParticipationAuditEventV1["event_kind"] {
    if (code === "COMPANY_SELECTION_STALE") return "STALE_CONTEXT_REJECTED";
    if (code === "COMPANY_NOT_ELIGIBLE" || code === "COMPANY_SELECTION_SUBSTITUTED") {
      return "CROSS_COMPANY_DENIED";
    }
    if (code === "TENANT_COMPANY_MISMATCH") return "CROSS_TENANT_DENIED";
    return "PARTICIPATION_REJECTED";
  }

  private async deny(
    request: ParticipationResolutionRequestV1,
    session: ServerSessionV1,
    code: ParticipationFailureCode,
  ): Promise<never> {
    await this.audit(request, session, "PARTICIPATION_REJECTED", "DENIED", { failure_code: code });
    fail(code);
  }

  private audit(
    request: ParticipationResolutionRequestV1,
    session: ServerSessionV1,
    eventKind: ParticipationAuditEventV1["event_kind"],
    result: "ADMITTED" | "DENIED",
    values: Readonly<{
      membership_id?: MembershipId;
      company_id?: CompanyId;
      tenant_id?: TenantId;
      role_ids?: readonly PlatformRoleId[];
      permissions?: readonly BaselinePlatformPermissionCode[];
      failure_code?: ParticipationFailureCode;
    }>,
  ): Promise<void> {
    return this.dependencies.participation.appendAudit(Object.freeze({
      participation_audit_event_id: this.dependencies.ids.participationAuditEventId(),
      event_kind: eventKind,
      decision_result: result,
      principal_id: session.principal_id,
      session_id: session.session_id,
      ...(values.membership_id ? { membership_id: values.membership_id } : {}),
      ...(values.company_id ? { company_id: values.company_id } : {}),
      ...(values.tenant_id ? { tenant_id: values.tenant_id } : {}),
      evaluated_role_ids: Object.freeze([...(values.role_ids ?? [])]),
      evaluated_permissions: Object.freeze([...(values.permissions ?? [])]),
      ...(values.failure_code ? { failure_code: values.failure_code } : {}),
      correlation_id: request.correlation_id,
      causal_references: Object.freeze([...request.causal_references]),
      executing_component: this.policy.executing_component,
      recorded_at: this.dependencies.now(),
    }));
  }
}
