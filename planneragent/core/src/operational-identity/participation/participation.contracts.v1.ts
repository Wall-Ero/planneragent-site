import type {
  AuditLineageReference,
  CompanyId,
  CorrelationId,
  MembershipId,
  ParticipationContextId,
  PlatformPermissionId,
  PlatformRoleId,
  PrincipalId,
  SessionId,
  TenantId,
} from "../contracts/identifiers.v1";
import type {
  BaselinePlatformPermissionCode,
  ResolvedOperationalParticipationContextV1,
} from "../contracts/track-a.v1";

export interface ParticipationResolutionRequestV1 {
  readonly version: 1;
  readonly session_id: SessionId;
  readonly selected_company_id?: CompanyId;
  readonly claimed_principal_id?: PrincipalId;
  readonly claimed_membership_id?: MembershipId;
  readonly claimed_tenant_id?: TenantId;
  readonly claimed_role_ids?: readonly PlatformRoleId[];
  readonly claimed_permissions?: readonly BaselinePlatformPermissionCode[];
  readonly correlation_id: CorrelationId;
  readonly causal_references: readonly AuditLineageReference[];
}

export type ResolvedOperationalParticipationV1 =
  ResolvedOperationalParticipationContextV1 & Readonly<{
    platform_role_ids: readonly PlatformRoleId[];
    platform_permission_ids: readonly PlatformPermissionId[];
    baseline_permissions: readonly BaselinePlatformPermissionCode[];
    membership_state_version: string;
    ownership_reference: string;
    company_selection_reference: string;
    audit_lineage: readonly AuditLineageReference[];
    correlation_id: CorrelationId;
  }>;

export type ParticipationFailureCode =
  | "SESSION_INVALID"
  | "PRINCIPAL_INELIGIBLE"
  | "NO_ACTIVE_MEMBERSHIP"
  | "MULTIPLE_COMPANIES_REQUIRE_SELECTION"
  | "MEMBERSHIP_INACTIVE"
  | "MEMBERSHIP_PRINCIPAL_MISMATCH"
  | "COMPANY_NOT_ELIGIBLE"
  | "COMPANY_SELECTION_STALE"
  | "COMPANY_SELECTION_SUBSTITUTED"
  | "TENANT_OWNERSHIP_MISSING"
  | "TENANT_OWNERSHIP_AMBIGUOUS"
  | "TENANT_COMPANY_MISMATCH"
  | "ROLE_ASSIGNMENT_INVALID"
  | "PERMISSION_ASSIGNMENT_INVALID"
  | "PARTICIPATION_CONTEXT_CONTRADICTORY";

export class ParticipationRuntimeError extends Error {
  constructor(readonly code: ParticipationFailureCode) {
    super(code);
    this.name = "ParticipationRuntimeError";
  }
}

export interface ParticipationAuditEventV1 {
  readonly participation_audit_event_id: string;
  readonly event_kind:
    | "MEMBERSHIP_RESOLUTION" | "COMPANY_RESOLUTION" | "COMPANY_SELECTION"
    | "TENANT_RESOLUTION" | "ROLE_RESOLUTION" | "PERMISSION_RESOLUTION"
    | "PARTICIPATION_CONTEXT_ISSUED" | "PARTICIPATION_REJECTED"
    | "STALE_CONTEXT_REJECTED" | "CROSS_COMPANY_DENIED" | "CROSS_TENANT_DENIED";
  readonly decision_result: "ADMITTED" | "DENIED";
  readonly principal_id: PrincipalId;
  readonly session_id: SessionId;
  readonly membership_id?: MembershipId;
  readonly company_id?: CompanyId;
  readonly tenant_id?: TenantId;
  readonly evaluated_role_ids: readonly PlatformRoleId[];
  readonly evaluated_permissions: readonly BaselinePlatformPermissionCode[];
  readonly failure_code?: ParticipationFailureCode;
  readonly correlation_id: CorrelationId;
  readonly causal_references: readonly AuditLineageReference[];
  readonly executing_component: string;
  readonly recorded_at: string;
}
