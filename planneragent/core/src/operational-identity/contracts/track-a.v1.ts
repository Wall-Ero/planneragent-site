// Operational Identity Runtime — Track A contracts v1
// External identity and organizational participation only.

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
  ReplayStateReference,
  SessionId,
  TenantId,
  UploadId,
  UploadOperationalContextId,
} from "./identifiers.v1";

export type AuthenticationActorKind = "HUMAN" | "WORKLOAD";
export type AuthenticationAssurance =
  | "SINGLE_FACTOR"
  | "MULTI_FACTOR"
  | "PHISHING_RESISTANT"
  | "WORKLOAD_ATTESTED";

export interface ExternalAuthenticationIdentityV1 {
  readonly version: 1;
  readonly external_authentication_identity_id:
    ExternalAuthenticationIdentityId;
  readonly actor_kind: AuthenticationActorKind;
  readonly provider: string;
  readonly issuer: string;
  readonly external_subject: string;
  readonly authentication_method: string;
  readonly assurance: AuthenticationAssurance;
  readonly verified_at: string;
  readonly verification_reference: string;
}

export type PrincipalLifecycleState =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

export interface DurablePrincipalV1 {
  readonly version: 1;
  readonly principal_id: PrincipalId;
  readonly actor_kind: AuthenticationActorKind;
  readonly lifecycle_state: PrincipalLifecycleState;
  readonly created_at: string;
}

export type ServerSessionLifecycleState =
  | "ACTIVE"
  | "ROTATED"
  | "EXPIRED"
  | "REVOKED";

export interface ServerSessionV1 {
  readonly version: 1;
  readonly session_id: SessionId;
  readonly principal_id: PrincipalId;
  readonly external_authentication_identity_id:
    ExternalAuthenticationIdentityId;
  readonly issued_at: string;
  readonly expires_at: string;
  readonly assurance: AuthenticationAssurance;
  readonly lifecycle_state: ServerSessionLifecycleState;
  readonly revocation_reference?: string;
}

export interface TenantV1 {
  readonly version: 1;
  readonly tenant_id: TenantId;
  readonly lifecycle_state: "ACTIVE" | "SUSPENDED" | "REVOKED";
  readonly created_at: string;
}

export interface CompanyV1 {
  readonly version: 1;
  readonly company_id: CompanyId;
  readonly lifecycle_state: "PENDING" | "ACTIVE" | "SUSPENDED" | "REVOKED";
  readonly created_at: string;
}

export interface TenantCompanyOwnershipV1 {
  readonly version: 1;
  readonly company_id: CompanyId;
  readonly tenant_id: TenantId;
  readonly effective_from: string;
  readonly effective_until?: string;
  readonly ownership_reference: string;
}

interface MembershipBaseV1 {
  readonly version: 1;
  readonly membership_id: MembershipId;
  readonly principal_id: PrincipalId;
  readonly company_id: CompanyId;
  readonly created_at: string;
}

export type OrganizationMembershipV1 =
  | (MembershipBaseV1 & {
      readonly lifecycle_state: "INVITED" | "REQUESTED";
      readonly invitation_or_request_reference: string;
    })
  | (MembershipBaseV1 & {
      readonly lifecycle_state: "ACTIVE";
      readonly activation_reference: string;
      readonly activated_at: string;
    })
  | (MembershipBaseV1 & {
      readonly lifecycle_state: "SUSPENDED" | "REMOVED" | "REVOKED";
      readonly lifecycle_decision_reference: string;
      readonly lifecycle_changed_at: string;
    });

export interface BaselinePlatformRoleV1 {
  readonly version: 1;
  readonly platform_role_id: PlatformRoleId;
  readonly name: string;
  readonly permission_ids: readonly PlatformPermissionId[];
}

export type BaselinePlatformPermissionCode =
  | "VIEW_COCKPIT"
  | "UPLOAD_DATA"
  | "MANAGE_PROFILE"
  | "SELECT_COMPANY"
  | "REQUEST_ROLE_CONFIRMATION";

export interface BaselinePlatformPermissionV1 {
  readonly version: 1;
  readonly platform_permission_id: PlatformPermissionId;
  readonly code: BaselinePlatformPermissionCode;
  readonly description: string;
}

export interface ResolvedOperationalParticipationContextV1 {
  readonly version: 1;
  readonly participation_context_id: ParticipationContextId;
  readonly principal_id: PrincipalId;
  readonly session_id: SessionId;
  readonly membership_id: MembershipId;
  readonly selected_company_id: CompanyId;
  readonly owning_tenant_id: TenantId;
  readonly resolved_at: string;
}

export type AuthorizationDecisionOutcome = "ADMITTED" | "DENIED";

export interface AuthorizationDecisionV1 {
  readonly version: 1;
  readonly authorization_decision_id: AuthorizationDecisionId;
  readonly permission: BaselinePlatformPermissionCode;
  readonly decision: AuthorizationDecisionOutcome;
  readonly principal_id: PrincipalId;
  readonly session_id: SessionId;
  readonly membership_id: MembershipId;
  readonly tenant_id: TenantId;
  readonly company_id: CompanyId;
  readonly resource: string;
  readonly purpose: string;
  readonly policy_version: PolicyVersionId;
  readonly issued_at: string;
  readonly expires_at: string;
  readonly reason_codes: readonly string[];
}

export interface GovernedUploadOperationalContextV1 {
  readonly version: 1;
  readonly upload_operational_context_id: UploadOperationalContextId;
  readonly principal_id: PrincipalId;
  readonly session_id: SessionId;
  readonly membership_id: MembershipId;
  readonly tenant_id: TenantId;
  readonly company_id: CompanyId;
  readonly authorization_decision_id: AuthorizationDecisionId;
  readonly permission: "UPLOAD_DATA";
  readonly upload_id: UploadId;
  readonly resource: string;
  readonly purpose: string;
  readonly policy_version: PolicyVersionId;
  readonly issued_at: string;
  readonly expires_at: string;
  readonly replay_state_reference: ReplayStateReference;
  readonly audit_lineage: readonly AuditLineageReference[];
}

export interface IdentityAccessAuditEnvelopeV1 {
  readonly version: 1;
  readonly audit_event_id: AuditEventId;
  readonly authenticated_actor: Readonly<{
    actor_kind: AuthenticationActorKind;
    external_authentication_identity_id:
      ExternalAuthenticationIdentityId;
  }>;
  readonly executing_component: string;
  readonly principal_id: PrincipalId;
  readonly session_id: SessionId;
  readonly participation_context_id?: ParticipationContextId;
  readonly authorization_decision_id?: AuthorizationDecisionId;
  readonly correlation_id: CorrelationId;
  readonly caused_by: readonly AuditLineageReference[];
  readonly recorded_at: string;
}
