// ============================================================
// PlannerAgent — Runtime Failure Intake Translation
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime-integration/
// P9K.provider.runtime.failure.intake.translation.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Provider Runtime Integration
//
// DOMAIN
// ------------------------------------------------------------
// P9K.3 — Runtime Failure Intake Translation
//
// PURPOSE
// ------------------------------------------------------------
// Translate an integration-ready
// ProviderRuntimeIntegrationResult into
// runtime failure intake material.
//
// Runtime Failure Intake Translation
// prepares failure intake.
//
// It does not classify runtime failure.
//
// It does not decide recovery.
//
// It does not verify runtime.
//
// It does not generate evidence.
//
// It does not write ledger.
//
// It does not perform audit.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Runtime Integration
// prepares re-entry.
//
// Runtime Failure Intake Translation
// prepares failure intake.
//
// Failure Intake Ready
// ≠
// Runtime Failure Classified
//
// Sanitized Provider Failure
// ≠
// Runtime Failure Classification
//
// ============================================================

import type {
  ProviderRuntimeFailureIntake,
  ProviderRuntimeIntegrationResult,
} from "./P9K.provider.runtime.integration.contract";

import type {
  ProviderAdapterFailureSurface,
} from "../adapters/P9I.provider.adapter.contract";


// ============================================================
// FAILURE INTAKE TRANSLATION STATUS
// ============================================================

export type ProviderRuntimeFailureIntakeTranslationStatus =
  | "PROVIDER_RUNTIME_FAILURE_INTAKE_TRANSLATED"
  | "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_TRANSLATED"
  | "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_REQUIRED";


// ============================================================
// FAILURE INTAKE TRANSLATION DECISION
// ============================================================

export type ProviderRuntimeFailureIntakeTranslationDecision =
  | "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE"
  | "REJECT_PROVIDER_RUNTIME_FAILURE_INTAKE_TRANSLATION";


// ============================================================
// FAILURE INTAKE TRANSLATION DENIAL REASON
// ============================================================

export type ProviderRuntimeFailureIntakeTranslationDenialReason =
  | "PROVIDER_RUNTIME_INTEGRATION_NOT_READY"
  | "FAILURE_INTAKE_TRANSLATION_NOT_ALLOWED"
  | "FAILURE_INTAKE_NOT_REQUIRED"
  | "SANITIZED_FAILURE_SURFACE_MISSING";


// ============================================================
// FAILURE INTAKE TRANSLATION INPUT
// ============================================================

export interface ProviderRuntimeFailureIntakeTranslationInput {

  integration:
    ProviderRuntimeIntegrationResult;

  translationDecision:
    ProviderRuntimeFailureIntakeTranslationDecision;

}


// ============================================================
// FAILURE INTAKE TRANSLATION RESULT
// ============================================================

export interface ProviderRuntimeFailureIntakeTranslationResult {

  translationStatus:
    ProviderRuntimeFailureIntakeTranslationStatus;

  translationDecision:
    ProviderRuntimeFailureIntakeTranslationDecision;

  failureIntakeTranslated:
    boolean;

  failureIntakeReady:
    boolean;

  failureIntakeRequired:
    ProviderRuntimeIntegrationResult["failureIntakeRequired"];

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

  sanitizedFailureSurface?:
    ProviderAdapterFailureSurface;

  failureCode?:
    ProviderAdapterFailureSurface["failureCode"];

  providerRawStatus?:
    ProviderAdapterFailureSurface["providerRawStatus"];

  providerRawErrorCode?:
    ProviderAdapterFailureSurface["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderAdapterFailureSurface["providerSanitizedErrorMessage"];

  retryable?:
    ProviderAdapterFailureSurface["retryable"];

  failureIntake?:
    ProviderRuntimeFailureIntake;

  denialReason?:
    ProviderRuntimeFailureIntakeTranslationDenialReason;

  integrationSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// FAILURE INTAKE TRANSLATION
// ============================================================

export function translateProviderRuntimeFailureIntake(
  input: ProviderRuntimeFailureIntakeTranslationInput
): ProviderRuntimeFailureIntakeTranslationResult {

  const integration =
    input.integration;

  const sanitizedFailureSurface =
    integration.runtimeIntakeMaterial?.failureIntake
      ?.failureSurface;

  const failureIntakeRequired =
    integration.failureIntakeRequired;

  if (!integration.runtimeIntegrationReady) {

    return {

      translationStatus:
        "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_TRANSLATED",

      translationDecision:
        input.translationDecision,

      failureIntakeTranslated:
        false,

      failureIntakeReady:
        false,

      failureIntakeRequired,

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

      denialReason:
        "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",

      integrationSummary: [
        ...integration.summary,
      ],

      summary: [
        ...integration.summary,
        "provider_runtime_integration_not_ready",
        "provider_runtime_failure_intake_not_translated",
      ],

    };

  }

  if (
    input.translationDecision ===
    "REJECT_PROVIDER_RUNTIME_FAILURE_INTAKE_TRANSLATION"
  ) {

    return {

      translationStatus:
        "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_TRANSLATED",

      translationDecision:
        input.translationDecision,

      failureIntakeTranslated:
        false,

      failureIntakeReady:
        false,

      failureIntakeRequired,

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

      sanitizedFailureSurface,

      failureCode:
        sanitizedFailureSurface?.failureCode,

      providerRawStatus:
        sanitizedFailureSurface?.providerRawStatus,

      providerRawErrorCode:
        sanitizedFailureSurface?.providerRawErrorCode,

      providerSanitizedErrorMessage:
        sanitizedFailureSurface?.providerSanitizedErrorMessage,

      retryable:
        sanitizedFailureSurface?.retryable,

      denialReason:
        "FAILURE_INTAKE_TRANSLATION_NOT_ALLOWED",

      integrationSummary: [
        ...integration.summary,
      ],

      summary: [
        ...integration.summary,
        "failure_intake_translation_not_allowed",
        "provider_runtime_failure_intake_not_translated",
      ],

    };

  }

  if (!failureIntakeRequired) {

    return {

      translationStatus:
        "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_REQUIRED",

      translationDecision:
        input.translationDecision,

      failureIntakeTranslated:
        false,

      failureIntakeReady:
        false,

      failureIntakeRequired,

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

      denialReason:
        "FAILURE_INTAKE_NOT_REQUIRED",

      integrationSummary: [
        ...integration.summary,
      ],

      summary: [
        ...integration.summary,
        "failure_intake_not_required",
        "provider_runtime_failure_intake_not_required",
      ],

    };

  }

  if (!sanitizedFailureSurface) {

    return {

      translationStatus:
        "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_TRANSLATED",

      translationDecision:
        input.translationDecision,

      failureIntakeTranslated:
        false,

      failureIntakeReady:
        false,

      failureIntakeRequired,

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

      denialReason:
        "SANITIZED_FAILURE_SURFACE_MISSING",

      integrationSummary: [
        ...integration.summary,
      ],

      summary: [
        ...integration.summary,
        "sanitized_failure_surface_missing",
        "provider_runtime_failure_intake_not_translated",
      ],

    };

  }

  const failureIntake:
    ProviderRuntimeFailureIntake = {

      failureIntakeReady:
        true,

      failureSurface:
        sanitizedFailureSurface,

      summary: [
        "provider_runtime_failure_intake_ready",
        sanitizedFailureSurface.retryable
          ? "provider_failure_retryable"
          : "provider_failure_not_retryable",
      ],

    };

  return {

    translationStatus:
      "PROVIDER_RUNTIME_FAILURE_INTAKE_TRANSLATED",

    translationDecision:
      input.translationDecision,

    failureIntakeTranslated:
      true,

    failureIntakeReady:
      true,

    failureIntakeRequired,

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

    sanitizedFailureSurface,

    failureCode:
      sanitizedFailureSurface.failureCode,

    providerRawStatus:
      sanitizedFailureSurface.providerRawStatus,

    providerRawErrorCode:
      sanitizedFailureSurface.providerRawErrorCode,

    providerSanitizedErrorMessage:
      sanitizedFailureSurface.providerSanitizedErrorMessage,

    retryable:
      sanitizedFailureSurface.retryable,

    failureIntake,

    integrationSummary: [
      ...integration.summary,
    ],

    summary: [
      ...integration.summary,
      "provider_runtime_failure_intake_translated",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Runtime Failure Intake Translation
// receives ProviderRuntimeIntegrationResult.
//
// It preserves:
//
// ✓ providerContract
// ✓ providerImplementation
// ✓ operation
// ✓ providerResourceId
// ✓ providerConfigurationRef
// ✓ providerCredentialRef
// ✓ executionMetadata
// ✓ failureIntakeRequired
// ✓ sanitizedFailureSurface
// ✓ failureCode
// ✓ providerRawStatus
// ✓ providerRawErrorCode
// ✓ providerSanitizedErrorMessage
// ✓ retryable
// ✓ integrationSummary
//
// It prepares:
//
// ✓ failureIntakeReady
// ✓ ProviderRuntimeFailureIntake
//
// It does not:
//
// - classify runtime failure
// - assign runtime failure severity
// - decide retry
// - decide recovery
// - verify runtime
// - write evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// FAILURE INTAKE PRINCIPLES
// ============================================================
//
// Provider Runtime Integration
// ≠
// Runtime Failure Intake Translation
//
// Runtime Failure Intake Translation
// ≠
// Runtime Failure Classification
//
// Failure Intake Ready
// ≠
// Runtime Failure Classified
//
// Sanitized Provider Failure
// ≠
// Runtime Failure Classification
//
// Retryable Provider Failure
// ≠
// Retry Decision
//
// Runtime Failure Intake
// prepares.
//
// Runtime Failure Classification
// decides.
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
// - verify runtime
// - generate evidence
// - write ledger
// - perform audit
// - call provider SDKs
// - call provider APIs
// - re-sanitize provider errors
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive ProviderRuntimeIntegrationResult
//
// ✓ require runtimeIntegrationReady
//
// ✓ require failureIntakeRequired
//
// ✓ require sanitized failure surface
//
// ✓ prepare failure intake
//
// ✓ preserve failureCode
//
// ✓ preserve providerRawStatus
//
// ✓ preserve providerRawErrorCode
//
// ✓ preserve providerSanitizedErrorMessage
//
// ✓ preserve retryable signal
//
// ✗ classify runtime failure
//
// ✗ decide retry
//
// ✗ decide recovery
//
// ✗ verify runtime
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================


