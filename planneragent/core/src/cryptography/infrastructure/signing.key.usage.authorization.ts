// ============================================================
// PlannerAgent - Infrastructure Signing-Key Usage Authorization
// ============================================================
//
// Infrastructure determines whether one exact request may use one
// logical signing key through its exact approved provider mapping.
// This module does not establish Governance legitimacy, dispatch a
// provider operation, coordinate replay, or execute SIGN.
// ============================================================

import type {
  GovernanceSignDecisionEnvelope,
} from "../governance/governance.sign.decision";

export type InfrastructureSigningKeyUsageDecision =
  | "AUTHORIZED"
  | "DENIED";

export type InfrastructureSigningKeyUsageDenialReason =
  | "INFRASTRUCTURE_SIGNING_KEY_REQUEST_INCOMPLETE"
  | "INFRASTRUCTURE_SIGNING_KEY_IDENTITY_INVALID"
  | "INFRASTRUCTURE_SIGNING_KEY_VALIDITY_INVALID"
  | "GOVERNANCE_SIGN_DECISION_NOT_AUTHORIZED"
  | "GOVERNANCE_SIGN_DECISION_REFERENCE_INCOHERENT"
  | "INFRASTRUCTURE_SIGNING_KEY_SCOPE_INCOHERENT"
  | "LOGICAL_SIGNING_KEY_NOT_FOUND"
  | "PROVIDER_SIGNING_KEY_MAPPING_NOT_FOUND"
  | "PROVIDER_SIGNING_KEY_MAPPING_AMBIGUOUS"
  | "PROVIDER_SIGNING_KEY_MAPPING_DISABLED"
  | "PROVIDER_SIGNING_KEY_MAPPING_INCOHERENT"
  | "PROVIDER_SIGNING_KEY_CAPABILITY_UNSUPPORTED";

export interface InfrastructureSigningKeyUsageRequest {
  readonly requestId: string;
  readonly governanceDecisionReference: string;
  readonly logicalSigningKeyId: string;
  readonly providerMappingId: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly requestedAt: string;
  readonly validFrom: string;
  readonly validUntil: string;
}

export interface ProviderSigningKeyMappingReference {
  readonly mappingId: string;
  readonly mappingVersion: string;
  readonly logicalSigningKeyId: string;
  readonly providerContract: "KEY_MANAGEMENT";
  readonly providerImplementation: "AWS_KMS";
  readonly providerKeyReference: string;
  readonly keyFamily: "RSA";
  readonly keySizeBits: 2048;
  readonly keyPurpose: "SIGN_VERIFY";
  readonly tenantId: string;
  readonly companyId: string;
  readonly enabled: boolean;
  readonly validFrom: string;
  readonly validUntil: string;
}

export interface InfrastructureSigningKeyUsageAuthorization {
  readonly authorizationId: string;
  readonly decision: InfrastructureSigningKeyUsageDecision;
  readonly authorizedAt: string;
  readonly request: Readonly<InfrastructureSigningKeyUsageRequest>;
  readonly providerMapping?: Readonly<ProviderSigningKeyMappingReference>;
  readonly denialReason?: InfrastructureSigningKeyUsageDenialReason;
  readonly summary: readonly string[];
}

export interface InfrastructureSigningKeyUsageAuthorizationInput {
  readonly request: InfrastructureSigningKeyUsageRequest;
  readonly governanceDecision: GovernanceSignDecisionEnvelope;
  readonly availableMappings: readonly ProviderSigningKeyMappingReference[];
  readonly authorizationId: string;
  readonly authorizedAt: string;
}

export interface InfrastructureSigningKeyUsageEligibility {
  readonly eligible: boolean;
  readonly authorizationGranted: boolean;
  readonly withinValidityWindow: boolean;
  readonly evaluatedAt: string;
  readonly reason?:
    | "INFRASTRUCTURE_SIGNING_KEY_USAGE_DENIED"
    | "INFRASTRUCTURE_SIGNING_KEY_USAGE_NOT_YET_VALID"
    | "INFRASTRUCTURE_SIGNING_KEY_USAGE_EXPIRED"
    | "INFRASTRUCTURE_SIGNING_KEY_ELIGIBILITY_TIME_INVALID";
}

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const EXACT_UTC_MILLISECONDS =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function exactTimestamp(value: unknown): value is string {
  return typeof value === "string" &&
    EXACT_UTC_MILLISECONDS.test(value) &&
    Number.isFinite(Date.parse(value));
}

function copyRequest(
  request: InfrastructureSigningKeyUsageRequest,
): Readonly<InfrastructureSigningKeyUsageRequest> {
  return Object.freeze({ ...request });
}

function copyMapping(
  mapping: ProviderSigningKeyMappingReference,
): Readonly<ProviderSigningKeyMappingReference> {
  return Object.freeze({ ...mapping });
}

function freezeAuthorization(
  authorization: InfrastructureSigningKeyUsageAuthorization,
): Readonly<InfrastructureSigningKeyUsageAuthorization> {
  return Object.freeze({
    ...authorization,
    request: copyRequest(authorization.request),
    providerMapping: authorization.providerMapping
      ? copyMapping(authorization.providerMapping)
      : undefined,
    summary: Object.freeze([...authorization.summary]),
  });
}

function deny(
  input: InfrastructureSigningKeyUsageAuthorizationInput,
  reason: InfrastructureSigningKeyUsageDenialReason,
): Readonly<InfrastructureSigningKeyUsageAuthorization> {
  return freezeAuthorization({
    authorizationId: input.authorizationId,
    decision: "DENIED",
    authorizedAt: input.authorizedAt,
    request: input.request,
    denialReason: reason,
    summary: [
      "infrastructure_signing_key_usage_denied",
      reason.toLowerCase(),
      "fail_closed",
    ],
  });
}

function requestDenial(
  input: InfrastructureSigningKeyUsageAuthorizationInput,
): InfrastructureSigningKeyUsageDenialReason | undefined {
  const request = input.request;
  if (
    !nonEmpty(request?.requestId) ||
    !nonEmpty(request?.governanceDecisionReference) ||
    !nonEmpty(request?.logicalSigningKeyId) ||
    !nonEmpty(request?.providerMappingId) ||
    !nonEmpty(request?.tenantId) ||
    !nonEmpty(request?.companyId)
  ) return "INFRASTRUCTURE_SIGNING_KEY_REQUEST_INCOMPLETE";

  if (!UUID_V4.test(request.requestId) || !UUID_V4.test(input.authorizationId)) {
    return "INFRASTRUCTURE_SIGNING_KEY_IDENTITY_INVALID";
  }

  if (
    !exactTimestamp(request.requestedAt) ||
    !exactTimestamp(request.validFrom) ||
    !exactTimestamp(request.validUntil) ||
    !exactTimestamp(input.authorizedAt) ||
    Date.parse(request.validFrom) > Date.parse(request.validUntil) ||
    Date.parse(request.requestedAt) > Date.parse(request.validUntil)
  ) return "INFRASTRUCTURE_SIGNING_KEY_VALIDITY_INVALID";

  if (input.governanceDecision.decision !== "AUTHORIZED") {
    return "GOVERNANCE_SIGN_DECISION_NOT_AUTHORIZED";
  }

  if (
    request.governanceDecisionReference !== input.governanceDecision.decisionId
  ) return "GOVERNANCE_SIGN_DECISION_REFERENCE_INCOHERENT";

  if (
    request.tenantId !== input.governanceDecision.request.tenantId ||
    request.companyId !== input.governanceDecision.request.companyId
  ) return "INFRASTRUCTURE_SIGNING_KEY_SCOPE_INCOHERENT";

  return undefined;
}

export function authorizeInfrastructureSigningKeyUsage(
  input: InfrastructureSigningKeyUsageAuthorizationInput,
): Readonly<InfrastructureSigningKeyUsageAuthorization> {
  const requestReason = requestDenial(input);
  if (requestReason) return deny(input, requestReason);

  const logicalKeyMappings = input.availableMappings.filter(
    mapping => mapping.logicalSigningKeyId === input.request.logicalSigningKeyId,
  );
  if (logicalKeyMappings.length === 0) {
    return deny(input, "LOGICAL_SIGNING_KEY_NOT_FOUND");
  }

  const exactMappings = logicalKeyMappings.filter(
    mapping => mapping.mappingId === input.request.providerMappingId,
  );
  if (exactMappings.length === 0) {
    return deny(input, "PROVIDER_SIGNING_KEY_MAPPING_NOT_FOUND");
  }
  if (exactMappings.length !== 1) {
    return deny(input, "PROVIDER_SIGNING_KEY_MAPPING_AMBIGUOUS");
  }

  const mapping = exactMappings[0];
  if (!mapping.enabled) {
    return deny(input, "PROVIDER_SIGNING_KEY_MAPPING_DISABLED");
  }
  if (
    mapping.tenantId !== input.request.tenantId ||
    mapping.companyId !== input.request.companyId ||
    !nonEmpty(mapping.mappingVersion) ||
    !nonEmpty(mapping.providerKeyReference) ||
    !exactTimestamp(mapping.validFrom) ||
    !exactTimestamp(mapping.validUntil) ||
    Date.parse(mapping.validFrom) > Date.parse(mapping.validUntil)
  ) return deny(input, "PROVIDER_SIGNING_KEY_MAPPING_INCOHERENT");

  if (
    mapping.providerContract !== "KEY_MANAGEMENT" ||
    mapping.providerImplementation !== "AWS_KMS" ||
    mapping.keyPurpose !== "SIGN_VERIFY" ||
    mapping.keyFamily !== "RSA" ||
    mapping.keySizeBits !== 2048
  ) return deny(input, "PROVIDER_SIGNING_KEY_CAPABILITY_UNSUPPORTED");

  const authorizationStart = Math.max(
    Date.parse(input.request.validFrom),
    Date.parse(mapping.validFrom),
  );
  const authorizationEnd = Math.min(
    Date.parse(input.request.validUntil),
    Date.parse(mapping.validUntil),
  );
  if (
    authorizationStart > authorizationEnd ||
    Date.parse(input.authorizedAt) < authorizationStart ||
    Date.parse(input.authorizedAt) > authorizationEnd
  ) return deny(input, "INFRASTRUCTURE_SIGNING_KEY_VALIDITY_INVALID");

  return freezeAuthorization({
    authorizationId: input.authorizationId,
    decision: "AUTHORIZED",
    authorizedAt: input.authorizedAt,
    request: input.request,
    providerMapping: mapping,
    summary: [
      "infrastructure_signing_key_usage_authorized",
      "exact_aws_kms_mapping_bound",
    ],
  });
}

export function evaluateInfrastructureSigningKeyUsageEligibility(
  authorization: InfrastructureSigningKeyUsageAuthorization,
  evaluatedAt: string,
): Readonly<InfrastructureSigningKeyUsageEligibility> {
  if (!exactTimestamp(evaluatedAt)) {
    return Object.freeze({
      eligible: false,
      authorizationGranted: authorization.decision === "AUTHORIZED",
      withinValidityWindow: false,
      evaluatedAt,
      reason: "INFRASTRUCTURE_SIGNING_KEY_ELIGIBILITY_TIME_INVALID",
    });
  }
  if (authorization.decision !== "AUTHORIZED" || !authorization.providerMapping) {
    return Object.freeze({
      eligible: false,
      authorizationGranted: false,
      withinValidityWindow: false,
      evaluatedAt,
      reason: "INFRASTRUCTURE_SIGNING_KEY_USAGE_DENIED",
    });
  }

  const instant = Date.parse(evaluatedAt);
  const validFrom = Math.max(
    Date.parse(authorization.request.validFrom),
    Date.parse(authorization.providerMapping.validFrom),
  );
  const validUntil = Math.min(
    Date.parse(authorization.request.validUntil),
    Date.parse(authorization.providerMapping.validUntil),
  );
  if (instant < validFrom) {
    return Object.freeze({
      eligible: false,
      authorizationGranted: true,
      withinValidityWindow: false,
      evaluatedAt,
      reason: "INFRASTRUCTURE_SIGNING_KEY_USAGE_NOT_YET_VALID",
    });
  }
  if (instant > validUntil) {
    return Object.freeze({
      eligible: false,
      authorizationGranted: true,
      withinValidityWindow: false,
      evaluatedAt,
      reason: "INFRASTRUCTURE_SIGNING_KEY_USAGE_EXPIRED",
    });
  }
  return Object.freeze({
    eligible: true,
    authorizationGranted: true,
    withinValidityWindow: true,
    evaluatedAt,
  });
}
