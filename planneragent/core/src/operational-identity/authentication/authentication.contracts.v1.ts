import type {
  AuditLineageReference,
  CorrelationId,
  ExternalAuthenticationIdentityId,
  PrincipalId,
  SessionId,
} from "../contracts/identifiers.v1";
import type {
  AuthenticationActorKind,
  AuthenticationAssurance,
} from "../contracts/track-a.v1";

export type AuthenticationEvidenceId = string & {
  readonly __authenticationEvidenceId: unique symbol;
};

export interface AuthenticationEvidenceV1 {
  readonly version: 1;
  readonly evidence_id: AuthenticationEvidenceId;
  readonly authentication_source: string;
  readonly actor_kind: AuthenticationActorKind;
  readonly issuer: string;
  readonly subject: string;
  readonly audience: readonly string[];
  readonly issued_at: string;
  readonly expires_at: string;
  readonly nonce: string;
  readonly claims: Readonly<Record<string, unknown>>;
  readonly verification_method: string;
  readonly verification_result: "VERIFIED";
  readonly assurance: AuthenticationAssurance;
  readonly evidence_lineage: readonly AuditLineageReference[];
}

export interface AuthenticationRequestV1 {
  readonly version: 1;
  readonly evidence: AuthenticationEvidenceV1;
  readonly expected_issuer: string;
  readonly expected_audience: string;
  readonly minimum_assurance: AuthenticationAssurance;
  readonly requested_session_id?: SessionId;
  readonly correlation_id: CorrelationId;
}

export interface VerifiedAuthenticationIdentityV1 {
  readonly version: 1;
  readonly evidence_id: AuthenticationEvidenceId;
  readonly authentication_source: string;
  readonly actor_kind: AuthenticationActorKind;
  readonly issuer: string;
  readonly subject: string;
  readonly assurance: AuthenticationAssurance;
  readonly verified_at: string;
  readonly evidence_expires_at: string;
  readonly verification_reference: string;
  readonly evidence_lineage: readonly AuditLineageReference[];
}

export interface AuthenticatedOperationalSessionV1 {
  readonly version: 1;
  readonly principal_id: PrincipalId;
  readonly session_id: SessionId;
  readonly external_authentication_identity_id: ExternalAuthenticationIdentityId;
  readonly actor_kind: AuthenticationActorKind;
  readonly assurance: AuthenticationAssurance;
  readonly authenticated_at: string;
  readonly expires_at: string;
  readonly authentication_audit_event_id: string;
}

export type AuthenticationAuditOutcome =
  | "AUTHENTICATED"
  | "REJECTED"
  | "RESTORED"
  | "ROTATED"
  | "LOGGED_OUT"
  | "REVOKED";

export interface AuthenticationAuditEventV1 {
  readonly version: 1;
  readonly authentication_audit_event_id: string;
  readonly evidence_id: AuthenticationEvidenceId;
  readonly authentication_source: string;
  readonly issuer: string;
  readonly subject: string;
  readonly external_authentication_identity_id?: ExternalAuthenticationIdentityId;
  readonly principal_id?: PrincipalId;
  readonly session_id?: SessionId;
  readonly verification_result: "VERIFIED" | "REJECTED";
  readonly outcome: AuthenticationAuditOutcome;
  readonly assurance: AuthenticationAssurance;
  readonly verification_reference?: string;
  readonly failure_code?: string;
  readonly evidence_issued_at: string;
  readonly evidence_expires_at: string;
  readonly recorded_at: string;
  readonly correlation_id: CorrelationId;
  readonly evidence_lineage: readonly AuditLineageReference[];
  readonly executing_runtime: string;
}

export type AuthenticationFailureCode =
  | "AUTHENTICATION_EVIDENCE_MALFORMED"
  | "AUTHENTICATION_EVIDENCE_EXPIRED"
  | "AUTHENTICATION_EVIDENCE_NOT_YET_VALID"
  | "AUTHENTICATION_ISSUER_INVALID"
  | "AUTHENTICATION_AUDIENCE_INVALID"
  | "AUTHENTICATION_ASSURANCE_INSUFFICIENT"
  | "AUTHENTICATION_EVIDENCE_REPLAYED"
  | "AUTHENTICATION_VERIFICATION_REJECTED"
  | "AUTHENTICATION_BINDING_UNKNOWN"
  | "AUTHENTICATION_BINDING_DUPLICATE"
  | "AUTHENTICATION_BINDING_CONTRADICTORY"
  | "AUTHENTICATION_PRINCIPAL_UNKNOWN"
  | "AUTHENTICATION_PRINCIPAL_DISABLED"
  | "AUTHENTICATION_PRINCIPAL_REVOKED"
  | "AUTHENTICATION_SESSION_CONTRADICTORY"
  | "AUTHENTICATION_SESSION_INELIGIBLE";

export class AuthenticationRuntimeError extends Error {
  constructor(readonly code: AuthenticationFailureCode) {
    super(code);
    this.name = "AuthenticationRuntimeError";
  }
}
