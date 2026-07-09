// ============================================================
// PlannerAgent — Provider Runtime Verification
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9L.provider.runtime.verification.ts
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
// P9L.1 — Provider Runtime Verification
//
// PURPOSE
// ------------------------------------------------------------
// Decide whether an integrated provider
// runtime outcome is verified,
// not verified, or verification denied.
//
// P9L receives runtime intake material
// prepared by P9K.
//
// P9L verifies runtime outcome.
//
// P9L does not classify runtime
// failure.
//
// P9L does not decide recovery.
//
// P9L does not decide retry, failover,
// degradation, stop, or escalation.
//
// P9L does not write evidence, ledger,
// or audit.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// P9K prepares runtime intake.
//
// P9L verifies runtime outcome.
//
// P9M classifies failure and decides
// runtime response.
//
// Runtime Verified
// ≠
// Runtime Failure Classified
//
// Runtime Not Verified
// ≠
// Recovery Decided
//
// ============================================================

import type {
  ProviderRuntimeIntegrationResult,
} from "../runtime-integration/P9K.provider.runtime.integration.contract";

import type {
  ProviderRuntimeVerificationIntakeTranslationResult,
} from "../runtime-integration/P9K.provider.runtime.verification.intake.translation";

import type {
  ProviderRuntimeFailureIntakeTranslationResult,
} from "../runtime-integration/P9K.provider.runtime.failure.intake.translation";

import type {
  ProviderRuntimeRecoveryIntakeAssessmentResult,
} from "../runtime-integration/P9K.provider.runtime.recovery.intake.assessment";


// ============================================================
// VERIFICATION STATUS
// ============================================================

export type ProviderRuntimeVerificationStatus =
  | "PROVIDER_RUNTIME_VERIFIED"
  | "PROVIDER_RUNTIME_NOT_VERIFIED"
  | "PROVIDER_RUNTIME_VERIFICATION_DENIED";


// ============================================================
// VERIFICATION DECISION
// ============================================================

export type ProviderRuntimeVerificationDecision =
  | "VERIFY_PROVIDER_RUNTIME_OUTCOME"
  | "REJECT_PROVIDER_RUNTIME_VERIFICATION";


// ============================================================
// VERIFICATION DENIAL REASON
// ============================================================

export type ProviderRuntimeVerificationDenialReason =
  | "RUNTIME_VERIFICATION_NOT_ALLOWED"
  | "PROVIDER_RUNTIME_INTEGRATION_NOT_READY"
  | "VERIFICATION_INTAKE_NOT_TRANSLATED"
  | "VERIFICATION_INTAKE_NOT_READY";


// ============================================================
// VERIFICATION FAILURE REASON
// ============================================================

export type ProviderRuntimeVerificationFailureReason =
  | "PROVIDER_EXECUTION_NOT_OBSERVED"
  | "PROVIDER_EXECUTION_NOT_COMPLETED"
  | "PROVIDER_FAILURE_SURFACE_PRESENT";


// ============================================================
// VERIFICATION INPUT
// ============================================================

export interface ProviderRuntimeVerificationInput {

  integration:
    ProviderRuntimeIntegrationResult;

  verificationIntake:
    ProviderRuntimeVerificationIntakeTranslationResult;

  failureIntake:
    ProviderRuntimeFailureIntakeTranslationResult;

  recoveryIntake?:
    ProviderRuntimeRecoveryIntakeAssessmentResult;

  verificationDecision:
    ProviderRuntimeVerificationDecision;

}


// ============================================================
// VERIFICATION RESULT
// ============================================================

export interface ProviderRuntimeVerificationResult {

  verificationStatus:
    ProviderRuntimeVerificationStatus;

  verificationDecision:
    ProviderRuntimeVerificationDecision;

  runtimeVerificationAttempted:
    boolean;

  runtimeVerified:
    boolean;

  runtimeNotVerified:
    boolean;

  runtimeVerificationDenied:
    boolean;

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

  providerExecutionObserved:
    boolean;

  providerExecutionCompleted:
    boolean;

  providerReference?:
    string;

  providerRawStatus?:
    string;

  providerRawErrorCode?:
    string;

  failureIntakeRequired:
    boolean;

  failureSurfacePresent:
    boolean;

  recoveryIntakeRequired:
    boolean;

  verificationDenialReason?:
    ProviderRuntimeVerificationDenialReason;

  verificationFailureReason?:
    ProviderRuntimeVerificationFailureReason;

  integrationSummary:
    string[];

  verificationIntakeSummary:
    string[];

  failureIntakeSummary:
    string[];

  recoveryIntakeSummary?:
    string[];

  summary:
    string[];

}


// ============================================================
// FAILURE SURFACE PRESENCE
// ============================================================

function isFailureSurfacePresent(
  failureIntake: ProviderRuntimeFailureIntakeTranslationResult
): boolean {

  return (
    failureIntake.failureIntakeTranslated === true &&
    failureIntake.failureIntakeReady === true &&
    failureIntake.failureIntake?.failureSurface !== undefined
  );

}


// ============================================================
// DENIED RESULT
// ============================================================

function buildDeniedResult(
  input: ProviderRuntimeVerificationInput,
  verificationDenialReason: ProviderRuntimeVerificationDenialReason,
  summaryToken: string
): ProviderRuntimeVerificationResult {

  const integration =
    input.integration;

  const verificationIntake =
    input.verificationIntake;

  const failureIntake =
    input.failureIntake;

  const recoveryIntake =
    input.recoveryIntake;

  const failureSurfacePresent =
    isFailureSurfacePresent(
      failureIntake
    );

  return {

    verificationStatus:
      "PROVIDER_RUNTIME_VERIFICATION_DENIED",

    verificationDecision:
      input.verificationDecision,

    runtimeVerificationAttempted:
      false,

    runtimeVerified:
      false,

    runtimeNotVerified:
      false,

    runtimeVerificationDenied:
      true,

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

    providerExecutionObserved:
      verificationIntake.providerExecutionObserved,

    providerExecutionCompleted:
      verificationIntake.providerExecutionCompleted,

    providerReference:
      verificationIntake.providerReference,

    providerRawStatus:
      verificationIntake.providerRawStatus,

    providerRawErrorCode:
      verificationIntake.providerRawErrorCode,

    failureIntakeRequired:
      integration.failureIntakeRequired,

    failureSurfacePresent,

    recoveryIntakeRequired:
      integration.recoveryIntakeRequired,

    verificationDenialReason,

    integrationSummary: [
      ...integration.summary,
    ],

    verificationIntakeSummary: [
      ...verificationIntake.summary,
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
      ...integration.summary,
      "provider_runtime_verification_denied",
      summaryToken,
    ],

  };

}


// ============================================================
// NOT VERIFIED RESULT
// ============================================================

function buildNotVerifiedResult(
  input: ProviderRuntimeVerificationInput,
  verificationFailureReason: ProviderRuntimeVerificationFailureReason,
  summaryToken: string
): ProviderRuntimeVerificationResult {

  const integration =
    input.integration;

  const verificationIntake =
    input.verificationIntake;

  const failureIntake =
    input.failureIntake;

  const recoveryIntake =
    input.recoveryIntake;

  const failureSurfacePresent =
    isFailureSurfacePresent(
      failureIntake
    );

  return {

    verificationStatus:
      "PROVIDER_RUNTIME_NOT_VERIFIED",

    verificationDecision:
      input.verificationDecision,

    runtimeVerificationAttempted:
      true,

    runtimeVerified:
      false,

    runtimeNotVerified:
      true,

    runtimeVerificationDenied:
      false,

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

    providerExecutionObserved:
      verificationIntake.providerExecutionObserved,

    providerExecutionCompleted:
      verificationIntake.providerExecutionCompleted,

    providerReference:
      verificationIntake.providerReference,

    providerRawStatus:
      verificationIntake.providerRawStatus,

    providerRawErrorCode:
      verificationIntake.providerRawErrorCode,

    failureIntakeRequired:
      integration.failureIntakeRequired,

    failureSurfacePresent,

    recoveryIntakeRequired:
      integration.recoveryIntakeRequired,

    verificationFailureReason,

    integrationSummary: [
      ...integration.summary,
    ],

    verificationIntakeSummary: [
      ...verificationIntake.summary,
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
      ...integration.summary,
      "provider_runtime_verification_failed",
      summaryToken,
    ],

  };

}


// ============================================================
// PROVIDER RUNTIME VERIFICATION
// ============================================================

export function verifyProviderRuntimeOutcome(
  input: ProviderRuntimeVerificationInput
): ProviderRuntimeVerificationResult {

  const integration =
    input.integration;

  const verificationIntake =
    input.verificationIntake;

  const failureIntake =
    input.failureIntake;

  const recoveryIntake =
    input.recoveryIntake;

  if (
    input.verificationDecision ===
    "REJECT_PROVIDER_RUNTIME_VERIFICATION"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_VERIFICATION_NOT_ALLOWED",
      "runtime_verification_not_allowed"
    );

  }

  if (integration.runtimeIntegrationReady !== true) {

    return buildDeniedResult(
      input,
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",
      "provider_runtime_integration_not_ready"
    );

  }

  if (
    verificationIntake.verificationIntakeTranslated !== true
  ) {

    return buildDeniedResult(
      input,
      "VERIFICATION_INTAKE_NOT_TRANSLATED",
      "verification_intake_not_translated"
    );

  }

  if (
    verificationIntake.verificationIntakeReady !== true
  ) {

    return buildDeniedResult(
      input,
      "VERIFICATION_INTAKE_NOT_READY",
      "verification_intake_not_ready"
    );

  }

  const providerExecutionObserved =
    verificationIntake.providerExecutionObserved;

  const providerExecutionCompleted =
    verificationIntake.providerExecutionCompleted;

  const failureSurfacePresent =
    isFailureSurfacePresent(
      failureIntake
    );

  if (providerExecutionObserved !== true) {

    return buildNotVerifiedResult(
      input,
      "PROVIDER_EXECUTION_NOT_OBSERVED",
      "provider_execution_not_observed"
    );

  }

  if (providerExecutionCompleted !== true) {

    return buildNotVerifiedResult(
      input,
      "PROVIDER_EXECUTION_NOT_COMPLETED",
      "provider_execution_not_completed"
    );

  }

  if (failureSurfacePresent) {

    return buildNotVerifiedResult(
      input,
      "PROVIDER_FAILURE_SURFACE_PRESENT",
      "provider_failure_surface_present"
    );

  }

  return {

    verificationStatus:
      "PROVIDER_RUNTIME_VERIFIED",

    verificationDecision:
      input.verificationDecision,

    runtimeVerificationAttempted:
      true,

    runtimeVerified:
      true,

    runtimeNotVerified:
      false,

    runtimeVerificationDenied:
      false,

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

    providerExecutionObserved,

    providerExecutionCompleted,

    providerReference:
      verificationIntake.providerReference,

    providerRawStatus:
      verificationIntake.providerRawStatus,

    providerRawErrorCode:
      verificationIntake.providerRawErrorCode,

    failureIntakeRequired:
      integration.failureIntakeRequired,

    failureSurfacePresent,

    recoveryIntakeRequired:
      integration.recoveryIntakeRequired,

    integrationSummary: [
      ...integration.summary,
    ],

    verificationIntakeSummary: [
      ...verificationIntake.summary,
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
      ...integration.summary,
      "provider_runtime_verification_passed",
      "provider_runtime_verified",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Runtime Verification receives
// P9K-prepared runtime intake material:
//
// - ProviderRuntimeIntegrationResult
// - ProviderRuntimeVerificationIntakeTranslationResult
// - ProviderRuntimeFailureIntakeTranslationResult
// - optional ProviderRuntimeRecoveryIntakeAssessmentResult
//
// It decides only whether the provider
// runtime outcome is:
//
// - verified
// - not verified
// - verification denied
//
// It does not classify runtime failure.
//
// ============================================================


// ============================================================
// VERIFICATION PRINCIPLES
// ============================================================
//
// Provider Runtime Integration
// ≠
// Provider Runtime Verification
//
// Runtime Verification
// ≠
// Runtime Failure Classification
//
// Runtime Not Verified
// ≠
// Recovery Decided
//
// Provider Execution Not Completed
// ≠
// Failure Classified
//
// Failure Surface Present
// ≠
// Failure Classified
//
// Verification answers:
//
// Can this provider runtime outcome be
// considered verified?
//
// Failure classification answers:
//
// If not verified, what kind of failure
// is it?
//
// ============================================================


// ============================================================
// FAILURE REASON BOUNDARY
// ============================================================
//
// P9L.1 verification failure reasons
// are not failure classifications.
//
// Allowed verification failure reasons:
//
// - PROVIDER_EXECUTION_NOT_OBSERVED
// - PROVIDER_EXECUTION_NOT_COMPLETED
// - PROVIDER_FAILURE_SURFACE_PRESENT
//
// P9L.1 must not introduce provider-
// specific or recovery-oriented labels.
//
// Classification belongs to the next
// runtime family.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - classify runtime failure
// - assign runtime failure severity
// - decide retry
// - decide recovery
// - decide failover
// - decide degradation
// - decide stop
// - generate evidence
// - write ledger
// - perform audit
// - call provider SDKs
// - call provider APIs
// - re-sanitize provider errors
// - alter sanitized failure surfaces
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive P9K-prepared runtime
//   intake material
//
// ✓ require integration readiness
//
// ✓ require verification intake
//   translation and readiness
//
// ✓ decide runtime verification
//   status
//
// ✓ distinguish verification denial
//   from verification failure
//
// ✓ preserve provider context
//
// ✓ preserve verification and intake
//   summaries
//
// ✗ classify runtime failure
//
// ✗ decide recovery
//
// ✗ retry
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
