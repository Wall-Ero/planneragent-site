// Operational Identity Runtime — Track B contracts v1
// Organizational authority imports shared identifiers only. It never owns
// principal, membership, company, or tenant contracts.

import type {
  AuditEventId,
  AuditLineageReference,
  AuthorityProofId,
  BootstrapCeremonyId,
  CompanyId,
  ConfirmationChainId,
  ConfirmationDecisionId,
  DeclarationId,
  DeclarationVersionId,
  MembershipId,
  OagActorBindingId,
  OagActorId,
  OagGraphVersionId,
  PolicyVersionId,
  PrincipalId,
  TenantId,
} from "./identifiers.v1";

export type OagActorKind = "HUMAN" | "WORKLOAD" | "BOARD";

export interface OagActorV1 {
  readonly version: 1;
  readonly oag_actor_id: OagActorId;
  readonly kind: OagActorKind;
  readonly lifecycle_state: "INACTIVE" | "ACTIVE" | "SUSPENDED" | "REVOKED";
  readonly created_at: string;
}

export interface OagActorBindingV1 {
  readonly version: 1;
  readonly oag_actor_binding_id: OagActorBindingId;
  readonly oag_actor_id: OagActorId;
  readonly principal_id: PrincipalId;
  readonly membership_id: MembershipId;
  readonly company_id: CompanyId;
  readonly lifecycle_state: "ACTIVE" | "SUSPENDED" | "REVOKED";
  readonly bound_at: string;
  readonly binding_reference: string;
}

export type OrganizationalDeclarationLifecycleV1 =
  | "DECLARED"
  | "PENDING_SUPERVISOR_CONFIRMATION"
  | "PARTIALLY_CONFIRMED"
  | "CHAIN_CONFIRMED"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "REVOKED"
  | "DRIFTED";

export interface AuthorityLimitV1 {
  readonly kind: "BUDGET" | "TIME" | "QUANTITY" | "SYSTEM" | "CUSTOM";
  readonly value: string;
  readonly unit?: string;
}

export interface OrganizationalResponsibilityScopeV1 {
  readonly domain: string;
  readonly intents: readonly string[];
  readonly scopes: readonly string[];
  readonly limits: readonly AuthorityLimitV1[];
  readonly team_or_subordinate_actor_ids: readonly OagActorId[];
  readonly operational_constraints: readonly string[];
}

interface DeclarationBaseV1 {
  readonly version: 1;
  readonly declaration_id: DeclarationId;
  readonly declaration_version_id: DeclarationVersionId;
  readonly subject_actor_id: OagActorId;
  readonly company_id: CompanyId;
  readonly tenant_id: TenantId;
  readonly lifecycle_state: OrganizationalDeclarationLifecycleV1;
  readonly declared_at: string;
}

export interface OrganizationalPositionDeclarationV1
  extends DeclarationBaseV1 {
  readonly declaration_kind: "ORGANIZATIONAL_POSITION";
  readonly position_code: string;
  readonly position_title: string;
}

export interface OrganizationalResponsibilityDeclarationV1
  extends DeclarationBaseV1 {
  readonly declaration_kind: "ORGANIZATIONAL_RESPONSIBILITY";
  readonly responsibility: OrganizationalResponsibilityScopeV1;
}

export interface SupervisorRelationshipDeclarationV1
  extends DeclarationBaseV1 {
  readonly declaration_kind: "SUPERVISOR_RELATIONSHIP";
  readonly supervisor_actor_id: OagActorId;
  readonly relationship_scope: OrganizationalResponsibilityScopeV1;
}

export interface SubordinateRelationshipDeclarationV1
  extends DeclarationBaseV1 {
  readonly declaration_kind: "SUBORDINATE_RELATIONSHIP";
  readonly subordinate_actor_id: OagActorId;
  readonly relationship_scope: OrganizationalResponsibilityScopeV1;
}

export type SupervisorConfirmationOutcome =
  | "CONFIRMED"
  | "PARTIALLY_CONFIRMED"
  | "REJECTED"
  | "CORRECTION_REQUESTED";

export interface SupervisorConfirmationDecisionV1 {
  readonly version: 1;
  readonly confirmation_decision_id: ConfirmationDecisionId;
  readonly confirming_actor_id: OagActorId;
  readonly subject_actor_id: OagActorId;
  readonly declaration_version_id: DeclarationVersionId;
  readonly tenant_id: TenantId;
  readonly company_id: CompanyId;
  readonly outcome: SupervisorConfirmationOutcome;
  readonly submitted_scope: OrganizationalResponsibilityScopeV1;
  readonly confirmed_scope: OrganizationalResponsibilityScopeV1;
  readonly rejected_scope: OrganizationalResponsibilityScopeV1;
  readonly correction_request?: string;
  readonly graph_version: OagGraphVersionId;
  readonly policy_version: PolicyVersionId;
  readonly decided_at: string;
  readonly audit_lineage: readonly AuditLineageReference[];
}

export interface ConfirmationChainStepV1 {
  readonly ordinal: number;
  readonly confirmation_decision_id: ConfirmationDecisionId;
  readonly confirming_actor_id: OagActorId;
  readonly confirmed_scope: OrganizationalResponsibilityScopeV1;
}

export interface ConfirmationChainV1 {
  readonly version: 1;
  readonly confirmation_chain_id: ConfirmationChainId;
  readonly subject_actor_id: OagActorId;
  readonly tenant_id: TenantId;
  readonly company_id: CompanyId;
  readonly declaration_version_id: DeclarationVersionId;
  readonly steps: readonly ConfirmationChainStepV1[];
  readonly terminal_scope: OrganizationalResponsibilityScopeV1;
  readonly graph_version: OagGraphVersionId;
  readonly policy_version: PolicyVersionId;
  readonly completed_at: string;
}

export type GovernedAuthorityRootEvidenceKind =
  | "CORPORATE_DOMAIN_CONTROL"
  | "GOVERNED_INVITATION"
  | "CONTRACT_OWNERSHIP"
  | "COMPANY_ADMINISTRATOR_APPROVAL"
  | "MANUALLY_VERIFIED_ORGANIZATIONAL_EVIDENCE";

export interface GovernedAuthorityRootV1 {
  readonly version: 1;
  readonly bootstrap_ceremony_id: BootstrapCeremonyId;
  readonly tenant_id: TenantId;
  readonly company_id: CompanyId;
  readonly root_actor_id: OagActorId;
  readonly approved_by_actor_id: OagActorId;
  readonly evidence_kinds: readonly GovernedAuthorityRootEvidenceKind[];
  readonly evidence_references: readonly string[];
  readonly policy_version: PolicyVersionId;
  readonly lifecycle_state: "ACTIVE" | "SUSPENDED" | "REVOKED";
  readonly approved_at: string;
  readonly audit_lineage: readonly AuditLineageReference[];
}

export interface EffectiveOperationalAuthorityProofV1 {
  readonly version: 1;
  readonly authority_proof_id: AuthorityProofId;
  readonly oag_actor_id: OagActorId;
  readonly oag_actor_binding_id: OagActorBindingId;
  readonly principal_id: PrincipalId;
  readonly membership_id: MembershipId;
  readonly tenant_id: TenantId;
  readonly company_id: CompanyId;
  readonly declaration_version_ids: readonly DeclarationVersionId[];
  readonly confirmation_chain_id: ConfirmationChainId;
  readonly graph_version: OagGraphVersionId;
  readonly delegation_references: readonly string[];
  readonly effective_scope: OrganizationalResponsibilityScopeV1;
  readonly policy_version: PolicyVersionId;
  readonly issued_at: string;
  readonly expires_at: string;
  readonly eligibility_state: "ELIGIBLE" | "INELIGIBLE";
  readonly invalidation_reasons: readonly (
    | "MEMBERSHIP_SUSPENDED"
    | "MEMBERSHIP_REVOKED"
    | "AUTHORITY_REVOKED"
    | "AUTHORITY_DRIFTED"
    | "GRAPH_CHANGED"
  )[];
}

export interface OrganizationalAuthorityAuditEnvelopeV1 {
  readonly version: 1;
  readonly audit_event_id: AuditEventId;
  readonly event:
    | "DECLARATION_RECORDED"
    | "CONFIRMATION_DECIDED"
    | "ACTOR_ACTIVATED"
    | "DELEGATION_CHANGED"
    | "AUTHORITY_REVOKED"
    | "AUTHORITY_DRIFTED";
  readonly tenant_id: TenantId;
  readonly company_id: CompanyId;
  readonly subject_actor_id: OagActorId;
  readonly acting_actor_id?: OagActorId;
  readonly declaration_version_id?: DeclarationVersionId;
  readonly confirmation_decision_id?: ConfirmationDecisionId;
  readonly confirmation_chain_id?: ConfirmationChainId;
  readonly authority_proof_id?: AuthorityProofId;
  readonly caused_by: readonly AuditLineageReference[];
  readonly recorded_at: string;
}
