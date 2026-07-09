// ============================================================
// PlannerAgent — Provider Runtime Failure Classification
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9M.provider.runtime.failure.classification.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Provider Runtime
//
// DOMAIN
// ------------------------------------------------------------
// P9M.1 — Provider Runtime Failure Classification
//
// PURPOSE
// ------------------------------------------------------------
// Classify provider runtime failure
// after P9L runtime verification.
//
// ============================================================

import type {
  ProviderRuntimeIntegrationResult,
} from "../runtime-integration/P9K.provider.runtime.integration.contract";

import type {
  ProviderRuntimeFailureIntakeTranslationResult,
} from "../runtime-integration/P9K.provider.runtime.failure.intake.translation";

import type {
  ProviderRuntimeRecoveryIntakeAssessmentResult,
} from "../runtime-integration/P9K.provider.runtime.recovery.intake.assessment";

import type {
  ProviderRuntimeVerificationResult,
} from "./P9L.provider.runtime.verification";


// ============================================================
// CLASSIFICATION STATUS
// ============================================================

export type ProviderRuntimeFailureClassificationStatus =
  | "PROVIDER_RUNTIME_FAILURE_CLASSIFIED"
  | "PROVIDER_RUNTIME_FAILURE_NOT_CLASSIFIED"
  | "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED"
  | "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_DENIED";


// ============================================================
// CLASSIFICATION DECISION
// ============================================================

export type ProviderRuntimeFailureClassificationDecision =
  | "CLASSIFY_PROVIDER_RUNTIME_FAILURE"
  | "REJECT_PROVIDER_RUNTIME_FAILURE_CLASSIFICATION";


// ============================================================
// CLASSIFICATION DENIAL REASON
// ============================================================

export type ProviderRuntimeFailureClassificationDenialReason =
  | "RUNTIME_FAILURE_CLASSIFICATION_NOT_ALLOWED"
  | "RUNTIME_VERIFICATION_DENIED"
  | "RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED"
  | "FAILURE_INTAKE_NOT_TRANSLATED"
  | "FAILURE_INTAKE_NOT_READY";


// ============================================================
// CLASSIFICATION FAILURE REASON
// ============================================================

export type ProviderRuntimeFailureClassificationFailureReason =
  | "RUNTIME_VERIFIED"
  | "FAILURE_SURFACE_MISSING"
  | "FAILURE_SURFACE_INSUFFICIENT"
  | "FAILURE_CLASS_NOT_DETERMINABLE";


// ============================================================
// RUNTIME FAILURE CLASS
// ============================================================

export type ProviderRuntimeFailureClass =
  | "PROVIDER_AUTHORIZATION_FAILURE"
  | "PROVIDER_AUTHENTICATION_FAILURE"
  | "PROVIDER_CONFIGURATION_FAILURE"
  | "PROVIDER_INVALID_REQUEST_FAILURE"
  | "PROVIDER_RATE_LIMIT_FAILURE"
  | "PROVIDER_TIMEOUT_FAILURE"
  | "PROVIDER_UNAVAILABLE_FAILURE"
  | "PROVIDER_DEPENDENCY_FAILURE"
  | "PROVIDER_CONTRACT_FAILURE"
  | "PROVIDER_EXECUTION_INCOMPLETE_FAILURE"
  | "PROVIDER_UNKNOWN_FAILURE";


// ============================================================
// RUNTIME FAILURE SEVERITY
// ============================================================

export type ProviderRuntimeFailureSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";


// ============================================================
// CLASSIFICATION INPUT
// ============================================================

export interface ProviderRuntimeFailureClassificationInput {

  integration:
    ProviderRuntimeIntegrationResult;

  verification:
    ProviderRuntimeVerificationResult;

  failureIntake:
    ProviderRuntimeFailureIntakeTranslationResult;

  recoveryIntake?:
    ProviderRuntimeRecoveryIntakeAssessmentResult;

  classificationDecision:
    ProviderRuntimeFailureClassificationDecision;

}


// ============================================================
// CLASSIFICATION RESULT
// ============================================================

export interface ProviderRuntimeFailureClassificationResult {

  classificationStatus:
    ProviderRuntimeFailureClassificationStatus;

  classificationDecision:
    ProviderRuntimeFailureClassificationDecision;

  runtimeFailureClassificationAttempted:
    boolean;

  runtimeFailureClassified:
    boolean;

  runtimeFailureClassificationDenied:
    boolean;

  runtimeFailureClassificationNotRequired:
    boolean;

  runtimeFailureClass?:
    ProviderRuntimeFailureClass;

  runtimeFailureSeverity?:
    ProviderRuntimeFailureSeverity;

  classificationDenialReason?:
    ProviderRuntimeFailureClassificationDenialReason;

  classificationFailureReason?:
    ProviderRuntimeFailureClassificationFailureReason;

  providerContract:
    ProviderRuntimeIntegrationResult["providerContract"];

  providerImplementation:
    ProviderRuntimeIntegrationResult["providerImplementation"];

  operation:
    ProviderRuntimeIntegrationResult["operation"];

  providerResourceId?:
    ProviderRuntimeIntegrationResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeIntegrationResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeIntegrationResult["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeIntegrationResult["executionMetadata"];

  verificationStatus:
    ProviderRuntimeVerificationResult["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeVerificationResult["verificationFailureReason"];

  failureCode?:
    ProviderRuntimeFailureIntakeTranslationResult["failureCode"];

  providerRawStatus?:
    ProviderRuntimeFailureIntakeTranslationResult["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeFailureIntakeTranslationResult["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeFailureIntakeTranslationResult["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeFailureIntakeTranslationResult["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeVerificationResult["recoveryIntakeRequired"];

  integrationSummary:
    string[];

  verificationSummary:
    string[];

  failureIntakeSummary:
    string[];

  recoveryIntakeSummary?:
    string[];

  summary:
    string[];

}


// ============================================================
// FAILURE SURFACE CHECK
// ============================================================

function hasFailureSurface(
  failureIntake: ProviderRuntimeFailureIntakeTranslationResult
): boolean {

  return (
    failureIntake.failureIntakeTranslated === true &&
    failureIntake.failureIntakeReady === true &&
    failureIntake.failureIntake?.failureSurface !== undefined
  );

}


// ============================================================
// FAILURE CLASS MAPPING
// ============================================================

function classifyFailureSurface(
  failureIntake: ProviderRuntimeFailureIntakeTranslationResult,
  verification: ProviderRuntimeVerificationResult
): ProviderRuntimeFailureClass {

  const failureCode =
    failureIntake.failureCode;

  const providerRawErrorCode =
    failureIntake.providerRawErrorCode;

  if (
    verification.verificationFailureReason ===
    "PROVIDER_EXECUTION_NOT_COMPLETED"
  ) {

    return "PROVIDER_EXECUTION_INCOMPLETE_FAILURE";

  }

  if (
    failureCode === "PROVIDER_CALL_UNAUTHORIZED" ||
    providerRawErrorCode === "AccessDeniedException" ||
    providerRawErrorCode === "AuthorizationFailure"
  ) {

    return "PROVIDER_AUTHORIZATION_FAILURE";

  }

  if (
    providerRawErrorCode === "AuthenticationFailed" ||
    providerRawErrorCode === "InvalidCredentials"
  ) {

    return "PROVIDER_AUTHENTICATION_FAILURE";

  }

  if (
    providerRawErrorCode === "InvalidKeyState" ||
    providerRawErrorCode === "InvalidConfiguration"
  ) {

    return "PROVIDER_CONFIGURATION_FAILURE";

  }

  if (
    providerRawErrorCode === "InvalidRequestException" ||
    providerRawErrorCode === "ValidationException"
  ) {

    return "PROVIDER_INVALID_REQUEST_FAILURE";

  }

  if (
    failureCode === "PROVIDER_CALL_THROTTLED" ||
    providerRawErrorCode === "ThrottlingException" ||
    providerRawErrorCode === "TooManyRequestsException"
  ) {

    return "PROVIDER_RATE_LIMIT_FAILURE";

  }

  if (
    failureCode === "PROVIDER_CALL_TIMEOUT" ||
    providerRawErrorCode === "TimeoutException"
  ) {

    return "PROVIDER_TIMEOUT_FAILURE";

  }

  if (
    providerRawErrorCode === "ServiceUnavailable" ||
    providerRawErrorCode === "InternalServiceError"
  ) {

    return "PROVIDER_UNAVAILABLE_FAILURE";

  }

  if (
    providerRawErrorCode === "DependencyFailure" ||
    providerRawErrorCode === "UpstreamFailure"
  ) {

    return "PROVIDER_DEPENDENCY_FAILURE";

  }

  if (
    providerRawErrorCode === "ContractMismatch" ||
    providerRawErrorCode === "AdapterIncompatible"
  ) {

    return "PROVIDER_CONTRACT_FAILURE";

  }

  return "PROVIDER_UNKNOWN_FAILURE";

}


// ============================================================
// SEVERITY MAPPING
// ============================================================

function severityForFailureClass(
  runtimeFailureClass: ProviderRuntimeFailureClass
): ProviderRuntimeFailureSeverity {

  switch (runtimeFailureClass) {

    case "PROVIDER_AUTHORIZATION_FAILURE":
    case "PROVIDER_AUTHENTICATION_FAILURE":
    case "PROVIDER_CONTRACT_FAILURE":
      return "HIGH";

    case "PROVIDER_CONFIGURATION_FAILURE":
    case "PROVIDER_INVALID_REQUEST_FAILURE":
    case "PROVIDER_EXECUTION_INCOMPLETE_FAILURE":
      return "MEDIUM";

    case "PROVIDER_UNAVAILABLE_FAILURE":
    case "PROVIDER_DEPENDENCY_FAILURE":
      return "HIGH";

    case "PROVIDER_TIMEOUT_FAILURE":
    case "PROVIDER_RATE_LIMIT_FAILURE":
      return "MEDIUM";

    case "PROVIDER_UNKNOWN_FAILURE":
      return "MEDIUM";

  }

}


// ============================================================
// DENIED RESULT
// ============================================================

function buildDeniedResult(
  input: ProviderRuntimeFailureClassificationInput,
  classificationDenialReason:
    ProviderRuntimeFailureClassificationDenialReason,
  summaryToken: string
): ProviderRuntimeFailureClassificationResult {

  const integration =
    input.integration;

  const verification =
    input.verification;

  const failureIntake =
    input.failureIntake;

  const recoveryIntake =
    input.recoveryIntake;

  return {

    classificationStatus:
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_DENIED",

    classificationDecision:
      input.classificationDecision,

    runtimeFailureClassificationAttempted:
      false,

    runtimeFailureClassified:
      false,

    runtimeFailureClassificationDenied:
      true,

    runtimeFailureClassificationNotRequired:
      false,

    classificationDenialReason,

    providerContract:
      integration.providerContract,

    providerImplementation:
      integration.providerImplementation,

    operation:
      integration.operation,

    providerResourceId:
      integration.providerResourceId,

    providerConfigurationRef:
      integration.providerConfigurationRef,

    providerCredentialRef:
      integration.providerCredentialRef,

    executionMetadata:
      integration.executionMetadata,

    verificationStatus:
      verification.verificationStatus,

    verificationFailureReason:
      verification.verificationFailureReason,

    failureCode:
      failureIntake.failureCode,

    providerRawStatus:
      failureIntake.providerRawStatus,

    providerRawErrorCode:
      failureIntake.providerRawErrorCode,

    providerSanitizedErrorMessage:
      failureIntake.providerSanitizedErrorMessage,

    retryable:
      failureIntake.retryable,

    recoveryIntakeRequired:
      verification.recoveryIntakeRequired,

    integrationSummary: [
      ...integration.summary,
    ],

    verificationSummary: [
      ...verification.summary,
    ],

    failureIntakeSummary: [
      ...failureIntake.summary,
    ],

    recoveryIntakeSummary:
      recoveryIntake
        ? [
            ...recoveryIntake.summary,
          ]
        : undefined,

    summary: [
      ...verification.summary,
      "provider_runtime_failure_classification_denied",
      summaryToken,
    ],

  };

}


// ============================================================
// NOT REQUIRED RESULT
// ============================================================

function buildNotRequiredResult(
  input: ProviderRuntimeFailureClassificationInput
): ProviderRuntimeFailureClassificationResult {

  const integration =
    input.integration;

  const verification =
    input.verification;

  const failureIntake =
    input.failureIntake;

  const recoveryIntake =
    input.recoveryIntake;

  return {

    classificationStatus:
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED",

    classificationDecision:
      input.classificationDecision,

    runtimeFailureClassificationAttempted:
      false,

    runtimeFailureClassified:
      false,

    runtimeFailureClassificationDenied:
      false,

    runtimeFailureClassificationNotRequired:
      true,

    classificationDenialReason:
      "RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED",

    classificationFailureReason:
      "RUNTIME_VERIFIED",

    providerContract:
      integration.providerContract,

    providerImplementation:
      integration.providerImplementation,

    operation:
      integration.operation,

    providerResourceId:
      integration.providerResourceId,

    providerConfigurationRef:
      integration.providerConfigurationRef,

    providerCredentialRef:
      integration.providerCredentialRef,

    executionMetadata:
      integration.executionMetadata,

    verificationStatus:
      verification.verificationStatus,

    failureCode:
      failureIntake.failureCode,

    providerRawStatus:
      failureIntake.providerRawStatus,

    providerRawErrorCode:
      failureIntake.providerRawErrorCode,

    providerSanitizedErrorMessage:
      failureIntake.providerSanitizedErrorMessage,

    retryable:
      failureIntake.retryable,

    recoveryIntakeRequired:
      verification.recoveryIntakeRequired,

    integrationSummary: [
      ...integration.summary,
    ],

    verificationSummary: [
      ...verification.summary,
    ],

    failureIntakeSummary: [
      ...failureIntake.summary,
    ],

    recoveryIntakeSummary:
      recoveryIntake
        ? [
            ...recoveryIntake.summary,
          ]
        : undefined,

    summary: [
      ...verification.summary,
      "provider_runtime_failure_classification_not_required",
      "runtime_verified",
    ],

  };

}


// ============================================================
// NOT CLASSIFIED RESULT
// ============================================================

function buildNotClassifiedResult(
  input: ProviderRuntimeFailureClassificationInput,
  classificationFailureReason:
    ProviderRuntimeFailureClassificationFailureReason,
  summaryToken: string
): ProviderRuntimeFailureClassificationResult {

  const integration =
    input.integration;

  const verification =
    input.verification;

  const failureIntake =
    input.failureIntake;

  const recoveryIntake =
    input.recoveryIntake;

  return {

    classificationStatus:
      "PROVIDER_RUNTIME_FAILURE_NOT_CLASSIFIED",

    classificationDecision:
      input.classificationDecision,

    runtimeFailureClassificationAttempted:
      true,

    runtimeFailureClassified:
      false,

    runtimeFailureClassificationDenied:
      false,

    runtimeFailureClassificationNotRequired:
      false,

    classificationFailureReason,

    providerContract:
      integration.providerContract,

    providerImplementation:
      integration.providerImplementation,

    operation:
      integration.operation,

    providerResourceId:
      integration.providerResourceId,

    providerConfigurationRef:
      integration.providerConfigurationRef,

    providerCredentialRef:
      integration.providerCredentialRef,

    executionMetadata:
      integration.executionMetadata,

    verificationStatus:
      verification.verificationStatus,

    verificationFailureReason:
      verification.verificationFailureReason,

    failureCode:
      failureIntake.failureCode,

    providerRawStatus:
      failureIntake.providerRawStatus,

    providerRawErrorCode:
      failureIntake.providerRawErrorCode,

    providerSanitizedErrorMessage:
      failureIntake.providerSanitizedErrorMessage,

    retryable:
      failureIntake.retryable,

    recoveryIntakeRequired:
      verification.recoveryIntakeRequired,

    integrationSummary: [
      ...integration.summary,
    ],

    verificationSummary: [
      ...verification.summary,
    ],

    failureIntakeSummary: [
      ...failureIntake.summary,
    ],

    recoveryIntakeSummary:
      recoveryIntake
        ? [
            ...recoveryIntake.summary,
          ]
        : undefined,

    summary: [
      ...verification.summary,
      "provider_runtime_failure_not_classified",
      summaryToken,
    ],

  };

}


// ============================================================
// PROVIDER RUNTIME FAILURE CLASSIFICATION
// ============================================================

export function classifyProviderRuntimeFailure(
  input: ProviderRuntimeFailureClassificationInput
): ProviderRuntimeFailureClassificationResult {

  const integration =
    input.integration;

  const verification =
    input.verification;

  const failureIntake =
    input.failureIntake;

  const recoveryIntake =
    input.recoveryIntake;

  if (
    input.classificationDecision ===
    "REJECT_PROVIDER_RUNTIME_FAILURE_CLASSIFICATION"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_FAILURE_CLASSIFICATION_NOT_ALLOWED",
      "runtime_failure_classification_not_allowed"
    );

  }

  if (
    verification.verificationStatus ===
    "PROVIDER_RUNTIME_VERIFICATION_DENIED"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_VERIFICATION_DENIED",
      "runtime_verification_denied"
    );

  }

  const failureSurfacePresent =
    hasFailureSurface(
      failureIntake
    );

  if (
    verification.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFIED" &&
    failureSurfacePresent === false
  ) {

    return buildNotRequiredResult(
      input
    );

  }

  if (
    failureIntake.failureIntakeTranslated !== true
  ) {

    return buildDeniedResult(
      input,
      "FAILURE_INTAKE_NOT_TRANSLATED",
      "failure_intake_not_translated"
    );

  }

  if (
    failureIntake.failureIntakeReady !== true
  ) {

    return buildDeniedResult(
      input,
      "FAILURE_INTAKE_NOT_READY",
      "failure_intake_not_ready"
    );

  }

  if (!failureSurfacePresent) {

    return buildNotClassifiedResult(
      input,
      "FAILURE_SURFACE_MISSING",
      "failure_surface_missing"
    );

  }

  if (
    !failureIntake.failureCode &&
    !failureIntake.providerRawStatus &&
    !failureIntake.providerRawErrorCode
  ) {

    return buildNotClassifiedResult(
      input,
      "FAILURE_SURFACE_INSUFFICIENT",
      "failure_surface_insufficient"
    );

  }

  const runtimeFailureClass =
    classifyFailureSurface(
      failureIntake,
      verification
    );

  const runtimeFailureSeverity =
    severityForFailureClass(
      runtimeFailureClass
    );

  return {

    classificationStatus:
      "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",

    classificationDecision:
      input.classificationDecision,

    runtimeFailureClassificationAttempted:
      true,

    runtimeFailureClassified:
      true,

    runtimeFailureClassificationDenied:
      false,

    runtimeFailureClassificationNotRequired:
      false,

    runtimeFailureClass,

    runtimeFailureSeverity,

    providerContract:
      integration.providerContract,

    providerImplementation:
      integration.providerImplementation,

    operation:
      integration.operation,

    providerResourceId:
      integration.providerResourceId,

    providerConfigurationRef:
      integration.providerConfigurationRef,

    providerCredentialRef:
      integration.providerCredentialRef,

    executionMetadata:
      integration.executionMetadata,

    verificationStatus:
      verification.verificationStatus,

    verificationFailureReason:
      verification.verificationFailureReason,

    failureCode:
      failureIntake.failureCode,

    providerRawStatus:
      failureIntake.providerRawStatus,

    providerRawErrorCode:
      failureIntake.providerRawErrorCode,

    providerSanitizedErrorMessage:
      failureIntake.providerSanitizedErrorMessage,

    retryable:
      failureIntake.retryable,

    recoveryIntakeRequired:
      verification.recoveryIntakeRequired,

    integrationSummary: [
      ...integration.summary,
    ],

    verificationSummary: [
      ...verification.summary,
    ],

    failureIntakeSummary: [
      ...failureIntake.summary,
    ],

    recoveryIntakeSummary:
      recoveryIntake
        ? [
            ...recoveryIntake.summary,
          ]
        : undefined,

    summary: [
      ...verification.summary,
      "provider_runtime_failure_classified",
      runtimeFailureClass,
      runtimeFailureSeverity,
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Runtime Failure Classification
// receives:
//
// - ProviderRuntimeIntegrationResult
// - ProviderRuntimeVerificationResult
// - ProviderRuntimeFailureIntakeTranslationResult
// - optional ProviderRuntimeRecoveryIntakeAssessmentResult
//
// It classifies runtime failure.
//
// It does not verify runtime.
//
// It does not decide runtime response.
//
// ============================================================


// ============================================================
// CLASSIFICATION PRINCIPLES
// ============================================================
//
// Provider Runtime Verification
// ≠
// Provider Runtime Failure Classification
//
// Runtime Not Verified
// ≠
// Failure Class Assigned
//
// Failure Classified
// ≠
// Recovery Decided
//
// Failure Severity
// ≠
// Retry Decision
//
// Failure Classified
// ≠
// Failover Executed
//
// Runtime Failure Classification
// classifies.
//
// Runtime Response Decision decides.
//
// Runtime Response Execution executes.
//
// ============================================================


// ============================================================
// FAILURE CLASSIFICATION BOUNDARY
// ============================================================
//
// P9M.1 failure classes are runtime
// classification labels.
//
// They are not recovery decisions.
//
// They are not retry decisions.
//
// They are not failover decisions.
//
// They are not execution commands.
//
// P9M may preserve retryable as an
// input signal.
//
// P9M must not decide retry.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - verify runtime outcome
// - decide retry
// - decide recovery
// - decide failover
// - decide degradation
// - decide stop
// - execute recovery
// - call provider SDKs
// - call provider APIs
// - re-sanitize provider errors
// - alter sanitized failure surfaces
// - generate evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive P9L runtime verification
//   result
//
// ✓ distinguish classification denied
//   from classification not required
//   and classification failure
//
// ✓ classify runtime failure when
//   failure surface is available
//
// ✓ assign runtime failure class
//
// ✓ assign runtime failure severity
//
// ✓ preserve provider/runtime context
//
// ✓ preserve recovery intake context
//   without deciding recovery
//
// ✗ verify runtime
//
// ✗ decide retry
//
// ✗ decide recovery
//
// ✗ failover
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================