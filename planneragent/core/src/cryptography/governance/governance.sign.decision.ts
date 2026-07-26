// ============================================================
// PlannerAgent - Governance SIGN Decision
// ============================================================
//
// Governance determines whether one exact request is
// legitimately authorized to execute the Cryptographic
// Operation SIGN.
//
// This module does not execute SIGN, select a provider,
// coordinate replay, or materialize signing input.
// ============================================================

export type GovernanceSignOperation = "SIGN";

export type GovernanceSignDecision = "AUTHORIZED" | "DENIED";

export type GovernanceSignDenialReason =
  | "GOVERNANCE_SIGN_REQUEST_INCOMPLETE"
  | "GOVERNANCE_SIGN_REQUEST_IDENTITY_INVALID"
  | "GOVERNANCE_SIGN_REQUEST_SCOPE_INCOHERENT"
  | "GOVERNANCE_SIGN_REQUEST_VALIDITY_INVALID"
  | "GOVERNANCE_SIGN_OPERATION_UNSUPPORTED"
  | "GOVERNANCE_SIGN_LEGITIMACY_NOT_AUTHORIZED";

export interface GovernanceSignRequest {
  readonly requestId: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly operation: GovernanceSignOperation;
  readonly subjectId: string;
  readonly authorityReference: string;
  readonly requestedAt: string;
  readonly validFrom: string;
  readonly validUntil: string;
}

export interface GovernanceSignDecisionEnvelope {
  readonly decisionId: string;
  readonly decision: GovernanceSignDecision;
  readonly decidedAt: string;
  readonly request: Readonly<GovernanceSignRequest>;
  readonly denialReason?: GovernanceSignDenialReason;
  readonly summary: readonly string[];
}

export interface GovernanceSignDecisionInput {
  readonly request: GovernanceSignRequest;
  readonly decisionId: string;
  readonly decidedAt: string;
  readonly determination: "AUTHORIZE" | "DENY";
}

export interface GovernanceSignExecutionEligibility {
  readonly eligible: boolean;
  readonly decisionAuthorized: boolean;
  readonly withinValidityWindow: boolean;
  readonly evaluatedAt: string;
  readonly reason?:
    | "GOVERNANCE_SIGN_DECISION_DENIED"
    | "GOVERNANCE_SIGN_DECISION_NOT_YET_VALID"
    | "GOVERNANCE_SIGN_DECISION_EXPIRED"
    | "GOVERNANCE_SIGN_ELIGIBILITY_TIME_INVALID";
}

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const EXACT_UTC_MILLISECONDS =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isUuidV4(value: unknown): value is string {
  return typeof value === "string" && UUID_V4.test(value);
}

function isExactTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    EXACT_UTC_MILLISECONDS.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function copyRequest(
  request: GovernanceSignRequest,
): Readonly<GovernanceSignRequest> {
  return Object.freeze({
    requestId: request.requestId,
    tenantId: request.tenantId,
    companyId: request.companyId,
    operation: request.operation,
    subjectId: request.subjectId,
    authorityReference: request.authorityReference,
    requestedAt: request.requestedAt,
    validFrom: request.validFrom,
    validUntil: request.validUntil,
  });
}

function requestDenialReason(
  request: GovernanceSignRequest,
): GovernanceSignDenialReason | undefined {
  if (
    !isNonEmptyString(request?.requestId) ||
    !isNonEmptyString(request?.tenantId) ||
    !isNonEmptyString(request?.companyId) ||
    !isNonEmptyString(request?.subjectId) ||
    !isNonEmptyString(request?.authorityReference) ||
    !isNonEmptyString(request?.requestedAt) ||
    !isNonEmptyString(request?.validFrom) ||
    !isNonEmptyString(request?.validUntil)
  ) {
    return "GOVERNANCE_SIGN_REQUEST_INCOMPLETE";
  }

  if (!isUuidV4(request.requestId)) {
    return "GOVERNANCE_SIGN_REQUEST_IDENTITY_INVALID";
  }

  if (request.operation !== "SIGN") {
    return "GOVERNANCE_SIGN_OPERATION_UNSUPPORTED";
  }

  if (
    request.tenantId === request.companyId ||
    request.subjectId === request.authorityReference
  ) {
    return "GOVERNANCE_SIGN_REQUEST_SCOPE_INCOHERENT";
  }

  if (
    !isExactTimestamp(request.requestedAt) ||
    !isExactTimestamp(request.validFrom) ||
    !isExactTimestamp(request.validUntil) ||
    Date.parse(request.validFrom) > Date.parse(request.validUntil) ||
    Date.parse(request.requestedAt) > Date.parse(request.validUntil)
  ) {
    return "GOVERNANCE_SIGN_REQUEST_VALIDITY_INVALID";
  }

  return undefined;
}

function freezeEnvelope(
  envelope: GovernanceSignDecisionEnvelope,
): Readonly<GovernanceSignDecisionEnvelope> {
  return Object.freeze({
    ...envelope,
    request: copyRequest(envelope.request),
    summary: Object.freeze([...envelope.summary]),
  });
}

export function decideGovernanceSignRequest(
  input: GovernanceSignDecisionInput,
): Readonly<GovernanceSignDecisionEnvelope> {
  const requestReason = requestDenialReason(input.request);

  const decisionIdentityValid = isUuidV4(input.decisionId);
  const decisionTimestampValid = isExactTimestamp(input.decidedAt);

  const structuralReason =
    requestReason ??
    (!decisionIdentityValid
      ? "GOVERNANCE_SIGN_REQUEST_IDENTITY_INVALID"
      : !decisionTimestampValid
        ? "GOVERNANCE_SIGN_REQUEST_VALIDITY_INVALID"
        : undefined);

  if (structuralReason) {
    return freezeEnvelope({
      decisionId: input.decisionId,
      decision: "DENIED",
      decidedAt: input.decidedAt,
      request: input.request,
      denialReason: structuralReason,
      summary: [
        "governance_sign_request_rejected",
        structuralReason.toLowerCase(),
        "fail_closed",
      ],
    });
  }

  if (input.determination !== "AUTHORIZE") {
    return freezeEnvelope({
      decisionId: input.decisionId,
      decision: "DENIED",
      decidedAt: input.decidedAt,
      request: input.request,
      denialReason: "GOVERNANCE_SIGN_LEGITIMACY_NOT_AUTHORIZED",
      summary: [
        "governance_sign_legitimacy_not_authorized",
        "governance_sign_decision_denied",
      ],
    });
  }

  return freezeEnvelope({
    decisionId: input.decisionId,
    decision: "AUTHORIZED",
    decidedAt: input.decidedAt,
    request: input.request,
    summary: [
      "governance_sign_request_legitimately_authorized",
      "governance_sign_decision_authorized",
    ],
  });
}

export function evaluateGovernanceSignExecutionEligibility(
  envelope: GovernanceSignDecisionEnvelope,
  evaluatedAt: string,
): Readonly<GovernanceSignExecutionEligibility> {
  if (!isExactTimestamp(evaluatedAt)) {
    return Object.freeze({
      eligible: false,
      decisionAuthorized: envelope.decision === "AUTHORIZED",
      withinValidityWindow: false,
      evaluatedAt,
      reason: "GOVERNANCE_SIGN_ELIGIBILITY_TIME_INVALID",
    });
  }

  if (envelope.decision !== "AUTHORIZED") {
    return Object.freeze({
      eligible: false,
      decisionAuthorized: false,
      withinValidityWindow: false,
      evaluatedAt,
      reason: "GOVERNANCE_SIGN_DECISION_DENIED",
    });
  }

  const instant = Date.parse(evaluatedAt);
  const validFrom = Date.parse(envelope.request.validFrom);
  const validUntil = Date.parse(envelope.request.validUntil);

  if (instant < validFrom) {
    return Object.freeze({
      eligible: false,
      decisionAuthorized: true,
      withinValidityWindow: false,
      evaluatedAt,
      reason: "GOVERNANCE_SIGN_DECISION_NOT_YET_VALID",
    });
  }

  if (instant > validUntil) {
    return Object.freeze({
      eligible: false,
      decisionAuthorized: true,
      withinValidityWindow: false,
      evaluatedAt,
      reason: "GOVERNANCE_SIGN_DECISION_EXPIRED",
    });
  }

  return Object.freeze({
    eligible: true,
    decisionAuthorized: true,
    withinValidityWindow: true,
    evaluatedAt,
  });
}

