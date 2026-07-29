import type {
  AuthorizationDecisionId,
  CompanyId,
  MembershipId,
  PrincipalId,
  SessionId,
  TenantId,
  UploadId,
} from "../contracts/identifiers.v1";
import type { BaselinePlatformPermissionCode } from "../contracts/track-a.v1";
import type { ResolvedOperationalParticipationV1 } from "../participation";

export interface CurrentAuthorizationState {
  readonly session_active: number;
  readonly principal_active: number;
  readonly membership_active: number;
  readonly ownership_count: number;
  readonly selection_current: number;
  readonly permissions: readonly BaselinePlatformPermissionCode[];
}

export interface GovernedUploadAuthorizationBinding {
  readonly authorization_decision_id: AuthorizationDecisionId;
  readonly participation_context_id: string;
  readonly upload_id: UploadId;
  readonly correlation_id: string;
  readonly audit_lineage_json: string;
  readonly created_at: string;
}

export interface AuthorizationAuditRecord {
  readonly event_kind: "POLICY_EVALUATED" | "DECISION_ISSUED" | "CONSUMPTION_ADMITTED" | "CONSUMPTION_REJECTED";
  readonly authorization_decision_id?: AuthorizationDecisionId;
  readonly decision_result: "ADMITTED" | "DENIED";
  readonly principal_id: PrincipalId;
  readonly session_id: SessionId;
  readonly membership_id: MembershipId;
  readonly company_id: CompanyId;
  readonly tenant_id: TenantId;
  readonly upload_id: UploadId;
  readonly resource: string;
  readonly purpose: string;
  readonly policy_version: string;
  readonly reason_codes: readonly string[];
  readonly failure_code?: string;
  readonly correlation_id: string;
  readonly causal_references: readonly string[];
  readonly executing_component: string;
  readonly recorded_at: string;
}

export class D1UploadAuthorizationPersistence {
  constructor(private readonly db: D1Database) {}

  async currentState(
    context: ResolvedOperationalParticipationV1,
    at: string,
  ): Promise<CurrentAuthorizationState> {
    const [session, principal, membership, ownership, selection, permissionRows] = await Promise.all([
      this.db.prepare(`SELECT COUNT(*) AS count FROM oir_server_sessions
        WHERE session_id = ? AND principal_id = ? AND lifecycle_state = 'ACTIVE'
        AND expires_at > ?`).bind(context.session_id, context.principal_id, at).first<{ count: number }>(),
      this.db.prepare(`SELECT COUNT(*) AS count FROM oir_principals
        WHERE principal_id = ? AND lifecycle_state = 'ACTIVE'`)
        .bind(context.principal_id).first<{ count: number }>(),
      this.db.prepare(`SELECT COUNT(*) AS count FROM oir_organization_memberships
        WHERE membership_id = ? AND principal_id = ? AND company_id = ?
        AND lifecycle_state = 'ACTIVE'`)
        .bind(context.membership_id, context.principal_id, context.selected_company_id)
        .first<{ count: number }>(),
      this.db.prepare(`SELECT COUNT(*) AS count FROM oir_tenant_company_ownership ownership
        JOIN oir_companies company ON company.company_id = ownership.company_id
        JOIN oir_tenants tenant ON tenant.tenant_id = ownership.tenant_id
        WHERE ownership.company_id = ? AND ownership.tenant_id = ?
        AND ownership.effective_from <= ?
        AND (ownership.effective_until IS NULL OR ownership.effective_until > ?)
        AND ownership.ownership_reference = ?
        AND company.lifecycle_state = 'ACTIVE' AND tenant.lifecycle_state = 'ACTIVE'`)
        .bind(context.selected_company_id, context.owning_tenant_id, at, at, context.ownership_reference)
        .first<{ count: number }>(),
      this.db.prepare(`SELECT COUNT(*) AS count FROM oir_company_selections
        WHERE session_id = ? AND principal_id = ? AND membership_id = ? AND company_id = ?
        AND selection_reference = ? AND invalidated_at IS NULL`)
        .bind(context.session_id, context.principal_id, context.membership_id,
          context.selected_company_id, context.company_selection_reference)
        .first<{ count: number }>(),
      this.db.prepare(`SELECT DISTINCT permissions.code AS code
        FROM oir_membership_role_assignments membership_roles
        JOIN oir_role_permission_assignments role_permissions
          ON role_permissions.platform_role_id = membership_roles.platform_role_id
        JOIN oir_platform_permissions permissions
          ON permissions.platform_permission_id = role_permissions.platform_permission_id
        WHERE membership_roles.membership_id = ? AND membership_roles.revoked_at IS NULL
        ORDER BY permissions.code`).bind(context.membership_id)
        .all<{ code: BaselinePlatformPermissionCode }>(),
    ]);
    return Object.freeze({
      session_active: session?.count ?? 0,
      principal_active: principal?.count ?? 0,
      membership_active: membership?.count ?? 0,
      ownership_count: ownership?.count ?? 0,
      selection_current: selection?.count ?? 0,
      permissions: Object.freeze(permissionRows.results.map(row => row.code)),
    });
  }

  async sessionExpiry(sessionId: SessionId): Promise<string | null> {
    const row = await this.db.prepare(
      "SELECT expires_at FROM oir_server_sessions WHERE session_id = ?",
    ).bind(sessionId).first<{ expires_at: string }>();
    return row?.expires_at ?? null;
  }

  async currentOwnershipReference(
    companyId: CompanyId,
    tenantId: TenantId,
    at: string,
  ): Promise<string | null> {
    const row = await this.db.prepare(`SELECT ownership_reference
      FROM oir_tenant_company_ownership
      WHERE company_id = ? AND tenant_id = ? AND effective_from <= ?
      AND (effective_until IS NULL OR effective_until > ?)`)
      .bind(companyId, tenantId, at, at).first<{ ownership_reference: string }>();
    return row?.ownership_reference ?? null;
  }

  async currentSelectionReference(sessionId: SessionId): Promise<string | null> {
    const row = await this.db.prepare(`SELECT selection_reference FROM oir_company_selections
      WHERE session_id = ? AND invalidated_at IS NULL ORDER BY selected_at DESC LIMIT 1`)
      .bind(sessionId).first<{ selection_reference: string }>();
    return row?.selection_reference ?? null;
  }

  async bindGovernedUpload(input: GovernedUploadAuthorizationBinding): Promise<void> {
    await this.db.prepare(`INSERT INTO oir_governed_upload_authorizations (
      authorization_decision_id, participation_context_id, upload_id,
      correlation_id, audit_lineage_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)`).bind(
      input.authorization_decision_id, input.participation_context_id,
      input.upload_id, input.correlation_id, input.audit_lineage_json, input.created_at,
    ).run();
  }

  async binding(decisionId: AuthorizationDecisionId): Promise<GovernedUploadAuthorizationBinding | null> {
    const row = await this.db.prepare(`SELECT * FROM oir_governed_upload_authorizations
      WHERE authorization_decision_id = ?`).bind(decisionId)
      .first<GovernedUploadAuthorizationBinding>();
    return row ? Object.freeze({ ...row }) : null;
  }

  async appendAudit(id: string, record: AuthorizationAuditRecord): Promise<void> {
    await this.db.prepare(`INSERT INTO oir_authorization_audit_events (
      authorization_audit_event_id, event_kind, authorization_decision_id,
      decision_result, principal_id, session_id, membership_id, company_id,
      tenant_id, upload_id, resource, purpose, policy_version, reason_codes_json,
      failure_code, correlation_id, causal_references_json, executing_component, recorded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, record.event_kind, record.authorization_decision_id ?? null,
      record.decision_result, record.principal_id, record.session_id,
      record.membership_id, record.company_id, record.tenant_id, record.upload_id,
      record.resource, record.purpose, record.policy_version,
      JSON.stringify(record.reason_codes), record.failure_code ?? null,
      record.correlation_id, JSON.stringify(record.causal_references),
      record.executing_component, record.recorded_at,
    ).run();
  }
}
