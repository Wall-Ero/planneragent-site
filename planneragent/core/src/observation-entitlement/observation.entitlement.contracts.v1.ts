import type {
  AuditLineageReference,
  CorrelationId,
  PrincipalId,
  SessionId,
} from "../operational-identity/contracts/identifiers.v1";
import type {
  AuthenticatedOperationalSessionV1,
} from "../operational-identity/authentication";

export type ObservationEntitlementId = string & {
  readonly __observationEntitlementId: unique symbol;
};

export type ObservationSourceKind = "FILE" | "API" | "MANUAL_INPUT";

export interface PrivateObservationScopeV1 {
  readonly source_kind: ObservationSourceKind;
  readonly source_reference: string;
  readonly dataset_kind: string;
  readonly dataset_reference: string;
  readonly purpose: string;
  readonly operational_question: string;
}

export interface ObservationEntitlementRequestV1 {
  readonly version: 1;
  readonly authenticated_session: AuthenticatedOperationalSessionV1;
  readonly scope: PrivateObservationScopeV1;
  readonly requested_validity_ms: number;
  readonly correlation_id: CorrelationId;
  readonly causal_references: readonly AuditLineageReference[];
}

export interface ObservationEntitlementV1 {
  readonly version: 1;
  readonly observation_entitlement_id: ObservationEntitlementId;
  readonly principal_id: PrincipalId;
  readonly session_id: SessionId;
  readonly scope: PrivateObservationScopeV1;
  readonly issued_at: string;
  readonly expires_at: string;
  readonly state: "ACTIVE";
  readonly privacy: "PRIVATE_TO_AUTHENTICATED_PRINCIPAL";
  readonly authority_effect: "NONE";
  readonly organizational_representation: "NONE";
  readonly membership_required: false;
  readonly company_verification_required: false;
  readonly correlation_id: CorrelationId;
  readonly audit_lineage: readonly AuditLineageReference[];
}

export interface TemporaryPrivateObservationRequestV1 {
  readonly version: 1;
  readonly entitlement: ObservationEntitlementV1;
  readonly authenticated_session: AuthenticatedOperationalSessionV1;
  readonly scope: PrivateObservationScopeV1;
  readonly correlation_id: CorrelationId;
}

export interface TemporaryPrivateObservationContextV1 {
  readonly version: 1;
  readonly observation_entitlement_id: ObservationEntitlementId;
  readonly principal_id: PrincipalId;
  readonly session_id: SessionId;
  readonly scope: PrivateObservationScopeV1;
  readonly admitted_at: string;
  readonly expires_at: string;
  readonly processing_boundary: "TEMPORARY_PRIVATE_OBSERVATION";
  readonly retention: "TRANSIENT_UNTIL_EXPIRY";
  readonly sharing: "DENIED";
  readonly observation_memory_write: "DENIED";
  readonly organizational_memory_write: "DENIED";
  readonly authority_effect: "NONE";
  readonly execution: "DENIED";
  readonly provider_credentials: "DENIED";
  readonly correlation_id: CorrelationId;
}

export type ObservationEntitlementFailureCode =
  | "OBSERVATION_ENTITLEMENT_INPUT_INVALID"
  | "OBSERVATION_ENTITLEMENT_SESSION_INELIGIBLE"
  | "OBSERVATION_ENTITLEMENT_PRINCIPAL_INELIGIBLE"
  | "OBSERVATION_ENTITLEMENT_SCOPE_SUBSTITUTED"
  | "OBSERVATION_ENTITLEMENT_EXPIRED"
  | "OBSERVATION_ENTITLEMENT_REVOKED"
  | "OBSERVATION_ENTITLEMENT_ALREADY_CONSUMED"
  | "OBSERVATION_ENTITLEMENT_UNKNOWN";

export class ObservationEntitlementError extends Error {
  constructor(readonly code: ObservationEntitlementFailureCode) {
    super(code);
    this.name = "ObservationEntitlementError";
  }
}
