import type {
  AuditLineageReference,
  AuthorizationDecisionId,
  CorrelationId,
  PolicyVersionId,
  UploadId,
} from "../contracts/identifiers.v1";
import type {
  AuthorizationDecisionV1,
  GovernedUploadOperationalContextV1,
} from "../contracts/track-a.v1";
import type { ResolvedOperationalParticipationV1 } from "../participation";

export interface GovernedUploadAuthorizationRequestV1 {
  readonly version: 1;
  readonly participation: ResolvedOperationalParticipationV1;
  readonly upload_id: UploadId;
  readonly resource: string;
  readonly purpose: string;
  readonly correlation_id: CorrelationId;
  readonly causal_references: readonly AuditLineageReference[];
}

export interface GovernedUploadAuthorizationDecisionV1 {
  readonly decision: AuthorizationDecisionV1;
  readonly participation_context_id: string;
  readonly upload_id: UploadId;
  readonly correlation_id: CorrelationId;
  readonly audit_lineage: readonly AuditLineageReference[];
}

export interface GovernedUploadAuthorizationResultV1 {
  readonly authorization: GovernedUploadAuthorizationDecisionV1;
  readonly governed_context?: GovernedUploadOperationalContextV1 & Readonly<{
    correlation_id: CorrelationId;
  }>;
}

export type UploadAuthorizationFailureCode =
  | "AUTHORIZATION_INPUT_INVALID"
  | "AUTHORIZATION_SESSION_INELIGIBLE"
  | "AUTHORIZATION_PRINCIPAL_INELIGIBLE"
  | "AUTHORIZATION_MEMBERSHIP_INELIGIBLE"
  | "AUTHORIZATION_TENANT_COMPANY_CONTRADICTORY"
  | "AUTHORIZATION_PARTICIPATION_STALE"
  | "AUTHORIZATION_POLICY_DENIED"
  | "AUTHORIZATION_EXPIRED"
  | "AUTHORIZATION_ALREADY_CONSUMED"
  | "AUTHORIZATION_SUBSTITUTED";

export class UploadAuthorizationRuntimeError extends Error {
  constructor(readonly code: UploadAuthorizationFailureCode) {
    super(code);
    this.name = "UploadAuthorizationRuntimeError";
  }
}

export interface UploadAuthorizationPolicyInputV1 {
  readonly participation: ResolvedOperationalParticipationV1;
  readonly permission: "UPLOAD_DATA";
  readonly resource: string;
  readonly purpose: string;
  readonly evaluated_at: string;
}

export interface UploadAuthorizationPolicyResultV1 {
  readonly decision: "ADMITTED" | "DENIED";
  readonly policy_version: PolicyVersionId;
  readonly reason_codes: readonly string[];
  readonly validity_ms: number;
}

export interface UploadAuthorizationConsumptionRequestV1 {
  readonly authorization_decision_id: AuthorizationDecisionId;
  readonly upload_id: UploadId;
  readonly principal_id: GovernedUploadOperationalContextV1["principal_id"];
  readonly session_id: GovernedUploadOperationalContextV1["session_id"];
  readonly membership_id: GovernedUploadOperationalContextV1["membership_id"];
  readonly company_id: GovernedUploadOperationalContextV1["company_id"];
  readonly tenant_id: GovernedUploadOperationalContextV1["tenant_id"];
  readonly resource: string;
  readonly purpose: string;
  readonly correlation_id: CorrelationId;
}
