import type { OrganizationalRepresentationEligibilityV1 } from "../organizational-representation";
import type {
  ConfirmationChainV1,
  OagActorBindingV1,
  OrganizationalPositionDeclarationV1,
  OrganizationalResponsibilityScopeV1,
} from "../../operational-identity/contracts/track-b.v1";

export const OAG_AUTHORITY_POLICY_ID_V1 = "OAG_AUTHORITY_POLICY_V1" as const;
export type CanonicalAuthorityStateKindV1 = "ACTOR_BINDING"|"POSITION"|"RESPONSIBILITY"|"ROOT"|"CONFIRMATION"|"DELEGATION";
export type OagCanonicalFailureCodeV1 =
  |"OAG_CAN_POLICY_INVALID"|"OAG_CAN_POLICY_STALE"|"OAG_CAN_ACTOR_BINDING_INVALID"|"OAG_CAN_MEMBERSHIP_INVALID"
  |"OAG_CAN_TENANT_MISMATCH"|"OAG_CAN_COMPANY_MISMATCH"|"OAG_CAN_ROOT_BOOTSTRAP_UNAUTHORIZED"|"OAG_CAN_ROOT_INVALID"
  |"OAG_CAN_ROOT_REVOKED"|"OAG_CAN_RESPONSIBILITY_INVALID"|"OAG_CAN_RESPONSIBILITY_UNCONFIRMED"|"OAG_CAN_CONFIRMATION_INVALID"
  |"OAG_CAN_CONFIRMATION_SELF_REFERENCE"|"OAG_CAN_DELEGATION_INVALID"|"OAG_CAN_DELEGATION_SCOPE_EXPANDED"
  |"OAG_CAN_DELEGATION_DEPTH_EXCEEDED"|"OAG_CAN_DELEGATION_EXPIRED"|"OAG_CAN_DELEGATION_REVOKED"
  |"OAG_CAN_GRAPH_VERSION_INVALID"|"OAG_CAN_GRAPH_VERSION_AMBIGUOUS"|"OAG_CAN_GRAPH_DIGEST_MISMATCH"
  |"OAG_CAN_PERSISTENCE_FAILED"|"OAG_CAN_AUDIT_FAILED";
export class OagCanonicalErrorV1 extends Error { constructor(readonly code:OagCanonicalFailureCodeV1,options?:ErrorOptions){super(code,options);this.name="OagCanonicalErrorV1";} }

export interface OrganizationalAuthorityPolicyV1 {
  readonly version:1; readonly policy_id:typeof OAG_AUTHORITY_POLICY_ID_V1; readonly policy_version:1;
  readonly effective_from:string; readonly effective_until?:string;
  readonly root_activation_rule:"CURRENT_ORPA_PLATFORM_ONBOARDING_REPRESENTATION";
  readonly responsibility_confirmation_rule:"ONE_QUALIFYING_CURRENT_ROOT";
  readonly delegation_confirmation_rule:"ONE_QUALIFYING_CURRENT_AUTHORITY";
  readonly max_delegation_depth:1; readonly proof_validity_rule:"EARLIEST_SOURCE_VALIDITY_AND_CURRENT_STATE";
  readonly graph_supersession_rule:"NO_GRANDFATHERING"; readonly correlation_id:string; readonly causal_references:readonly string[];
}
export interface CanonicalActorBindingV1 { readonly version:1;readonly tenant_id:string;readonly binding:OagActorBindingV1;readonly effective_from:string;readonly policy_id:typeof OAG_AUTHORITY_POLICY_ID_V1;readonly causal_references:readonly string[]; }
export interface CanonicalPositionV1 {readonly version:1;readonly position:OrganizationalPositionDeclarationV1;readonly effective_from:string;readonly effective_until?:string;readonly causal_references:readonly string[];}
export interface CanonicalResponsibilityV1 {readonly version:1;readonly responsibility_id:string;readonly declaration_version_id:string;readonly tenant_id:string;readonly company_id:string;readonly subject_actor_id:string;readonly scope:OrganizationalResponsibilityScopeV1;readonly effective_from:string;readonly effective_until?:string;readonly lifecycle_state:"DECLARED"|"ACTIVE";readonly confirmation_chain_id?:string;readonly policy_id:typeof OAG_AUTHORITY_POLICY_ID_V1;readonly causal_references:readonly string[];}
export interface CanonicalAuthorityRootV1 {readonly version:1;readonly root_id:string;readonly tenant_id:string;readonly company_id:string;readonly oag_actor_id:string;readonly actor_binding_id:string;readonly principal_id:string;readonly membership_id:string;readonly domain:string;readonly permitted_scope:OrganizationalResponsibilityScopeV1;readonly effective_from:string;readonly effective_until?:string;readonly bootstrap_eligibility_id:string;readonly bootstrap_authority_id:string;readonly legal_entity_id:string;readonly company_binding_id:string;readonly policy_id:typeof OAG_AUTHORITY_POLICY_ID_V1;readonly graph_version_id:string;readonly causal_references:readonly string[];}
export interface CanonicalConfirmationChainV1 {readonly version:1;readonly chain:ConfirmationChainV1;readonly authority_source_id:string;readonly authority_source_actor_id:string;readonly subject_fact_id:string;readonly policy_id:typeof OAG_AUTHORITY_POLICY_ID_V1;readonly effective_from:string;readonly effective_until?:string;readonly evidence_references:readonly string[];readonly causal_references:readonly string[];}
export interface OperationalAuthorityDelegationV1 {readonly version:1;readonly delegation_id:string;readonly tenant_id:string;readonly company_id:string;readonly source_authority_id:string;readonly source_actor_id:string;readonly target_actor_id:string;readonly target_actor_binding_id:string;readonly domain:string;readonly delegated_scope:OrganizationalResponsibilityScopeV1;readonly effective_from:string;readonly effective_until:string;readonly depth:1;readonly parent_delegation_id?:never;readonly confirmation_chain_id:string;readonly policy_id:typeof OAG_AUTHORITY_POLICY_ID_V1;readonly graph_version_id:string;readonly causal_references:readonly string[];}
export interface OagGraphStateReferenceV1 {readonly kind:CanonicalAuthorityStateKindV1;readonly identity:string;readonly semantic_digest:string;}
export interface OagGraphVersionV1 {readonly version:1;readonly graph_version_id:string;readonly tenant_id:string;readonly company_id:string;readonly policy_id:typeof OAG_AUTHORITY_POLICY_ID_V1;readonly state_references:readonly OagGraphStateReferenceV1[];readonly graph_digest:string;readonly effective_from:string;readonly correlation_id:string;readonly causal_references:readonly string[];}
export interface RootBootstrapContextV1 {readonly eligibility:OrganizationalRepresentationEligibilityV1;readonly actor_binding:CanonicalActorBindingV1;readonly tenant_id:string;readonly company_id:string;readonly legal_entity_id:string;readonly company_binding_id:string;readonly requested_at:string;}
