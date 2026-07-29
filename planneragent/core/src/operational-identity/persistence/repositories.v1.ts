import type {
  ExternalAuthenticationIdentityId,
  MembershipId,
  PlatformPermissionId,
  PlatformRoleId,
  PrincipalId,
  SessionId,
  TenantId,
  CompanyId,
  AuthorizationDecisionId,
} from "../contracts/identifiers.v1";
import type {
  AuthorizationDecisionV1,
  BaselinePlatformPermissionV1,
  DurablePrincipalV1,
  ExternalAuthenticationIdentityV1,
  IdentityAccessAuditEnvelopeV1,
  OrganizationMembershipV1,
  ServerSessionV1,
  TenantCompanyOwnershipV1,
  TenantV1,
  CompanyV1,
} from "../contracts/track-a.v1";

export interface ExternalAuthenticationBindingRepository {
  create(binding: ExternalAuthenticationIdentityV1, principalId: PrincipalId): Promise<void>;
  resolve(provider: string, issuer: string, subject: string): Promise<Readonly<{ binding: ExternalAuthenticationIdentityV1; principal_id: PrincipalId }> | null>;
}

export interface PrincipalRepository {
  create(principal: DurablePrincipalV1): Promise<void>;
  find(principalId: PrincipalId): Promise<DurablePrincipalV1 | null>;
  setLifecycle(principalId: PrincipalId, state: DurablePrincipalV1["lifecycle_state"]): Promise<boolean>;
}

export interface ServerSessionRepository {
  create(session: ServerSessionV1): Promise<void>;
  find(sessionId: SessionId): Promise<ServerSessionV1 | null>;
  rotate(sessionId: SessionId, replacement: ServerSessionV1, reference: string): Promise<boolean>;
  expire(sessionId: SessionId, reference: string): Promise<boolean>;
  revoke(sessionId: SessionId, reference: string): Promise<boolean>;
  logout(sessionId: SessionId, reference: string): Promise<boolean>;
}

export interface OrganizationRepository {
  createTenant(tenant: TenantV1): Promise<void>;
  createCompany(company: CompanyV1): Promise<void>;
  assignOwnership(ownership: TenantCompanyOwnershipV1): Promise<void>;
  resolveTenant(companyId: CompanyId, at: string): Promise<TenantId | null>;
}

export interface MembershipRepository {
  createPending(membership: Extract<OrganizationMembershipV1, { lifecycle_state: "REQUESTED" | "INVITED" }>): Promise<void>;
  find(membershipId: MembershipId): Promise<OrganizationMembershipV1 | null>;
  activate(membershipId: MembershipId, activationReference: string, activatedAt: string): Promise<boolean>;
  transition(membershipId: MembershipId, state: "SUSPENDED" | "REVOKED" | "REMOVED", decisionReference: string, changedAt: string): Promise<boolean>;
}

export interface PlatformAccessRepository {
  createRole(role: Readonly<{ platform_role_id: PlatformRoleId; name: string }>): Promise<void>;
  createPermission(permission: BaselinePlatformPermissionV1): Promise<void>;
  assignPermission(roleId: PlatformRoleId, permissionId: PlatformPermissionId, assignedAt: string, reference: string): Promise<void>;
  assignRole(membershipId: MembershipId, roleId: PlatformRoleId, assignedAt: string, reference: string): Promise<void>;
  revokeRole(membershipId: MembershipId, roleId: PlatformRoleId, revokedAt: string, reference: string): Promise<boolean>;
}

export interface AuthorizationRepository {
  create(decision: AuthorizationDecisionV1): Promise<void>;
  find(decisionId: AuthorizationDecisionId): Promise<AuthorizationDecisionV1 | null>;
  issueConsumption(decisionId: AuthorizationDecisionId, issuedAt: string): Promise<void>;
  consume(decisionId: AuthorizationDecisionId, consumedAt: string, reference: string): Promise<boolean>;
}

export interface IdentityAuditRepository {
  append(event: IdentityAccessAuditEnvelopeV1): Promise<void>;
  find(eventId: string): Promise<IdentityAccessAuditEnvelopeV1 | null>;
}

export interface OperationalIdentityRepositories {
  readonly externalBindings: ExternalAuthenticationBindingRepository;
  readonly principals: PrincipalRepository;
  readonly sessions: ServerSessionRepository;
  readonly organizations: OrganizationRepository;
  readonly memberships: MembershipRepository;
  readonly platformAccess: PlatformAccessRepository;
  readonly authorizations: AuthorizationRepository;
  readonly audit: IdentityAuditRepository;
}
