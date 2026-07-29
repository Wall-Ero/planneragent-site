import type {
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
  OrganizationMembershipV1,
} from "../contracts/track-a.v1";
import type { ParticipationAuditEventV1 } from "./participation.contracts.v1";

export interface ParticipationMembershipRecord {
  readonly membership_id: MembershipId;
  readonly principal_id: PrincipalId;
  readonly company_id: CompanyId;
  readonly lifecycle_state: OrganizationMembershipV1["lifecycle_state"];
  readonly state_version: string;
}

export interface CompanySelectionRecord {
  readonly company_selection_id: string;
  readonly session_id: SessionId;
  readonly principal_id: PrincipalId;
  readonly membership_id: MembershipId;
  readonly company_id: CompanyId;
  readonly selected_at: string;
  readonly selection_reference: string;
  readonly invalidated_at: string | null;
  readonly invalidation_reason: string | null;
}

export interface ParticipationOwnershipRecord {
  readonly company_id: CompanyId;
  readonly tenant_id: TenantId;
  readonly ownership_reference: string;
}

export interface ParticipationRolePermissionRecord {
  readonly platform_role_id: PlatformRoleId;
  readonly platform_permission_id: PlatformPermissionId | null;
  readonly permission_code: BaselinePlatformPermissionCode | null;
}

export class D1ParticipationRepository {
  constructor(private readonly db: D1Database) {}

  async membershipsForPrincipal(principalId: PrincipalId): Promise<readonly ParticipationMembershipRecord[]> {
    const rows = await this.db.prepare(`SELECT membership_id, principal_id, company_id,
      lifecycle_state, COALESCE(lifecycle_changed_at, activated_at, created_at) AS state_version
      FROM oir_organization_memberships WHERE principal_id = ?
      ORDER BY company_id, membership_id`).bind(principalId).all<ParticipationMembershipRecord>();
    return Object.freeze(rows.results.map(row => Object.freeze({ ...row })));
  }

  async membershipById(membershipId: MembershipId): Promise<ParticipationMembershipRecord | null> {
    const row = await this.db.prepare(`SELECT membership_id, principal_id, company_id,
      lifecycle_state, COALESCE(lifecycle_changed_at, activated_at, created_at) AS state_version
      FROM oir_organization_memberships WHERE membership_id = ?`)
      .bind(membershipId).first<ParticipationMembershipRecord>();
    return row ? Object.freeze({ ...row }) : null;
  }

  async currentOwnerships(companyId: CompanyId, at: string): Promise<readonly ParticipationOwnershipRecord[]> {
    const rows = await this.db.prepare(`SELECT ownership.company_id, ownership.tenant_id,
      ownership.ownership_reference
      FROM oir_tenant_company_ownership ownership
      JOIN oir_companies company ON company.company_id = ownership.company_id
      JOIN oir_tenants tenant ON tenant.tenant_id = ownership.tenant_id
      WHERE ownership.company_id = ? AND ownership.effective_from <= ?
      AND (ownership.effective_until IS NULL OR ownership.effective_until > ?)
      AND company.lifecycle_state = 'ACTIVE' AND tenant.lifecycle_state = 'ACTIVE'
      ORDER BY ownership.tenant_id`).bind(companyId, at, at).all<ParticipationOwnershipRecord>();
    return Object.freeze(rows.results.map(row => Object.freeze({ ...row })));
  }

  async rolePermissions(membershipId: MembershipId): Promise<readonly ParticipationRolePermissionRecord[]> {
    const rows = await this.db.prepare(`SELECT membership_roles.platform_role_id,
      permissions.platform_permission_id, permissions.code AS permission_code
      FROM oir_membership_role_assignments membership_roles
      JOIN oir_platform_roles roles
        ON roles.platform_role_id = membership_roles.platform_role_id
      LEFT JOIN oir_role_permission_assignments role_permissions
        ON role_permissions.platform_role_id = roles.platform_role_id
      LEFT JOIN oir_platform_permissions permissions
        ON permissions.platform_permission_id = role_permissions.platform_permission_id
      WHERE membership_roles.membership_id = ? AND membership_roles.revoked_at IS NULL
      ORDER BY membership_roles.platform_role_id, permissions.code, permissions.platform_permission_id`)
      .bind(membershipId).all<ParticipationRolePermissionRecord>();
    return Object.freeze(rows.results.map(row => Object.freeze({ ...row })));
  }

  async latestSelection(sessionId: SessionId): Promise<CompanySelectionRecord | null> {
    const row = await this.db.prepare(`SELECT selections.company_selection_id,
      selections.session_id, selections.principal_id, selections.membership_id,
      selections.company_id, selections.selected_at, selections.selection_reference,
      CASE
        WHEN selections.invalidated_at IS NOT NULL THEN selections.invalidated_at
        WHEN sessions.lifecycle_state <> 'ACTIVE' THEN COALESCE(sessions.revocation_reference, sessions.expires_at)
        WHEN memberships.lifecycle_state <> 'ACTIVE' THEN COALESCE(memberships.lifecycle_changed_at, memberships.created_at)
        ELSE NULL
      END AS invalidated_at,
      CASE
        WHEN selections.invalidation_reason IS NOT NULL THEN selections.invalidation_reason
        WHEN sessions.lifecycle_state <> 'ACTIVE' THEN 'SESSION_' || sessions.lifecycle_state
        WHEN memberships.lifecycle_state <> 'ACTIVE' THEN 'MEMBERSHIP_' || memberships.lifecycle_state
        ELSE NULL
      END AS invalidation_reason
      FROM oir_company_selections selections
      JOIN oir_server_sessions sessions ON sessions.session_id = selections.session_id
      JOIN oir_organization_memberships memberships
        ON memberships.membership_id = selections.membership_id
      WHERE selections.session_id = ?
      ORDER BY selections.selected_at DESC, selections.company_selection_id DESC LIMIT 1`)
      .bind(sessionId).first<CompanySelectionRecord>();
    return row ? Object.freeze({ ...row }) : null;
  }

  async select(input: Readonly<{
    company_selection_id: string;
    session_id: SessionId;
    principal_id: PrincipalId;
    membership_id: MembershipId;
    company_id: CompanyId;
    selected_at: string;
    selection_reference: string;
  }>): Promise<CompanySelectionRecord> {
    const invalidate = this.db.prepare(`UPDATE oir_company_selections
      SET invalidated_at = ?, invalidation_reason = 'RESELECTED'
      WHERE session_id = ? AND invalidated_at IS NULL`).bind(input.selected_at, input.session_id);
    const insert = this.db.prepare(`INSERT INTO oir_company_selections (
      company_selection_id, session_id, principal_id, membership_id, company_id,
      selected_at, selection_reference
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(
      input.company_selection_id, input.session_id, input.principal_id,
      input.membership_id, input.company_id, input.selected_at, input.selection_reference,
    );
    await this.db.batch([invalidate, insert]);
    return Object.freeze({ ...input, invalidated_at: null, invalidation_reason: null });
  }

  async appendAudit(event: ParticipationAuditEventV1): Promise<void> {
    await this.db.prepare(`INSERT INTO oir_participation_audit_events (
      participation_audit_event_id, event_kind, decision_result, principal_id,
      session_id, membership_id, company_id, tenant_id, evaluated_role_ids_json,
      evaluated_permissions_json, failure_code, correlation_id,
      causal_references_json, executing_component, recorded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      event.participation_audit_event_id, event.event_kind, event.decision_result,
      event.principal_id, event.session_id, event.membership_id ?? null,
      event.company_id ?? null, event.tenant_id ?? null,
      JSON.stringify(event.evaluated_role_ids), JSON.stringify(event.evaluated_permissions),
      event.failure_code ?? null, event.correlation_id,
      JSON.stringify(event.causal_references), event.executing_component, event.recorded_at,
    ).run();
  }
}
