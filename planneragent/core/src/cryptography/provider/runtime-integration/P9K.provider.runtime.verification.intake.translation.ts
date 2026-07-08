// ============================================================
// PlannerAgent — Runtime Verification Intake Translation
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime-integration/
// P9K.provider.runtime.verification.intake.translation.ts
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
// P9K.2 — Runtime Verification Intake Translation
//
// PURPOSE
// ------------------------------------------------------------
// Translate an integration-ready
// ProviderRuntimeIntegrationResult into
// runtime verification intake material.
//
// Runtime Verification Intake
// Translation prepares verification
// input.
//
// It does not verify runtime.
//
// It does not decide whether provider
// execution is operationally valid.
//
// It does not declare runtime success.
//
// It does not classify runtime failure.
//
// It does not decide recovery.
//
// It does not write evidence, ledger,
// or audit.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Runtime Integration
// prepares re-entry.
//
// Runtime Verification Intake
// Translation prepares verification
// intake.
//
// Verification Intake Ready
// ≠
// Runtime Verified
//
// Provider Execution Observed
// ≠
// Provider Execution Valid
//
// ============================================================

import type {
  ProviderRuntimeExecutionFacts,
  ProviderRuntimeIntegrationResult,
  ProviderRuntimeVerificationIntake,
} from "./P9K.provider.runtime.integration.contract";


// ============================================================
// VERIFICATION INTAKE TRANSLATION STATUS
// ============================================================

export type ProviderRuntimeVerificationIntakeTranslationStatus =
  | "PROVIDER_RUNTIME_VERIFICATION_INTAKE_TRANSLATED"
  | "PROVIDER_RUNTIME_VERIFICATION_INTAKE_NOT_TRANSLATED";


// ============================================================
// VERIFICATION INTAKE TRANSLATION DECISION
// ============================================================

export type ProviderRuntimeVerificationIntakeTranslationDecision =
  | "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE"
  | "REJECT_PROVIDER_RUNTIME_VERIFICATION_INTAKE_TRANSLATION";


// ============================================================
// VERIFICATION INTAKE TRANSLATION DENIAL REASON
// ============================================================

export type ProviderRuntimeVerificationIntakeTranslationDenialReason =
  | "PROVIDER_RUNTIME_INTEGRATION_NOT_READY"
  | "VERIFICATION_INTAKE_TRANSLATION_NOT_ALLOWED"
  | "PROVIDER_EXECUTION_FACTS_MISSING";


// ============================================================
// VERIFICATION INTAKE TRANSLATION INPUT
// ============================================================

export interface ProviderRuntimeVerificationIntakeTranslationInput {

  integration:
    ProviderRuntimeIntegrationResult;

  translationDecision:
    ProviderRuntimeVerificationIntakeTranslationDecision;

}


// ============================================================
// VERIFICATION INTAKE TRANSLATION RESULT
// ============================================================

export interface ProviderRuntimeVerificationIntakeTranslationResult {

  translationStatus:
    ProviderRuntimeVerificationIntakeTranslationStatus;

  translationDecision:
    ProviderRuntimeVerificationIntakeTranslationDecision;

  verificationIntakeTranslated:
    boolean;

  verificationIntakeReady:
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

  providerExecutionFacts?:
    ProviderRuntimeExecutionFacts;

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

  verificationIntake?:
    ProviderRuntimeVerificationIntake;

  denialReason?:
    ProviderRuntimeVerificationIntakeTranslationDenialReason;

  integrationSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// VERIFICATION INTAKE TRANSLATION
// ============================================================

export function translateProviderRuntimeVerificationIntake(
  input: ProviderRuntimeVerificationIntakeTranslationInput
): ProviderRuntimeVerificationIntakeTranslationResult {

  const integration =
    input.integration;

  const providerExecutionFacts =
    integration.providerExecutionFacts;

  const providerExecutionObserved =
    providerExecutionFacts?.providerCallAttempted ?? false;

  const providerExecutionCompleted =
    providerExecutionFacts?.providerCallCompleted ?? false;

  const providerReference =
    providerExecutionFacts?.providerReference;

  const providerRawStatus =
    providerExecutionFacts?.providerRawStatus;

  const providerRawErrorCode =
    providerExecutionFacts?.providerRawErrorCode;

  if (!integration.runtimeIntegrationReady) {

    return {

      translationStatus:
        "PROVIDER_RUNTIME_VERIFICATION_INTAKE_NOT_TRANSLATED",

      translationDecision:
        input.translationDecision,

      verificationIntakeTranslated:
        false,

      verificationIntakeReady:
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

      // preserve raw facts if they exist
      providerExecutionFacts,

      // do not promote them to verification-intake state
      // when runtime integration itself is not ready
      providerExecutionObserved:
        false,

      providerExecutionCompleted:
        false,

      providerReference:
        undefined,

      providerRawStatus:
        undefined,

      providerRawErrorCode:
        undefined,

      denialReason:
        "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",

      integrationSummary: [
        ...integration.summary,
      ],

      summary: [
        ...integration.summary,
        "provider_runtime_integration_not_ready",
        "provider_runtime_verification_intake_not_translated",
      ],

    };

  }

  if (
    input.translationDecision ===
    "REJECT_PROVIDER_RUNTIME_VERIFICATION_INTAKE_TRANSLATION"
  ) {

    return {

      translationStatus:
        "PROVIDER_RUNTIME_VERIFICATION_INTAKE_NOT_TRANSLATED",

      translationDecision:
        input.translationDecision,

      verificationIntakeTranslated:
        false,

      verificationIntakeReady:
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

      providerExecutionFacts,

      providerExecutionObserved,

      providerExecutionCompleted,

      providerReference,

      providerRawStatus,

      providerRawErrorCode,

      denialReason:
        "VERIFICATION_INTAKE_TRANSLATION_NOT_ALLOWED",

      integrationSummary: [
        ...integration.summary,
      ],

      summary: [
        ...integration.summary,
        "verification_intake_translation_not_allowed",
        "provider_runtime_verification_intake_not_translated",
      ],

    };

  }

  if (!providerExecutionFacts) {

    return {

      translationStatus:
        "PROVIDER_RUNTIME_VERIFICATION_INTAKE_NOT_TRANSLATED",

      translationDecision:
        input.translationDecision,

      verificationIntakeTranslated:
        false,

      verificationIntakeReady:
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

      providerExecutionFacts,

      providerExecutionObserved,

      providerExecutionCompleted,

      providerReference,

      providerRawStatus,

      providerRawErrorCode,

      denialReason:
        "PROVIDER_EXECUTION_FACTS_MISSING",

      integrationSummary: [
        ...integration.summary,
      ],

      summary: [
        ...integration.summary,
        "provider_execution_facts_missing",
        "provider_runtime_verification_intake_not_translated",
      ],

    };

  }

  const verificationIntake:
    ProviderRuntimeVerificationIntake = {

      verificationIntakeReady:
        true,

      providerExecutionObserved,

      providerExecutionCompleted,

      providerReference,

      providerRawStatus,

      providerRawErrorCode,

      summary: [
        "provider_runtime_verification_intake_ready",
        providerExecutionObserved
          ? "provider_execution_observed"
          : "provider_execution_not_observed",
        providerExecutionCompleted
          ? "provider_execution_completed"
          : "provider_execution_not_completed",
      ],

    };

  return {

    translationStatus:
      "PROVIDER_RUNTIME_VERIFICATION_INTAKE_TRANSLATED",

    translationDecision:
      input.translationDecision,

    verificationIntakeTranslated:
      true,

    verificationIntakeReady:
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

    providerExecutionFacts,

    providerExecutionObserved,

    providerExecutionCompleted,

    providerReference,

    providerRawStatus,

    providerRawErrorCode,

    verificationIntake,

    integrationSummary: [
      ...integration.summary,
    ],

    summary: [
      ...integration.summary,
      "provider_runtime_verification_intake_translated",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Runtime Verification Intake Translation
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
// ✓ providerExecutionFacts
// ✓ providerReference
// ✓ providerRawStatus
// ✓ providerRawErrorCode
// ✓ integrationSummary
//
// It prepares:
//
// ✓ verificationIntakeReady
// ✓ providerExecutionObserved
// ✓ providerExecutionCompleted
// ✓ ProviderRuntimeVerificationIntake
//
// It does not:
//
// - verify runtime
// - decide provider execution validity
// - declare runtime success
// - classify runtime failure
// - decide recovery
// - write evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// VERIFICATION INTAKE PRINCIPLES
// ============================================================
//
// Provider Runtime Integration
// ≠
// Runtime Verification Intake Translation
//
// Runtime Verification Intake Translation
// ≠
// Provider Runtime Verification
//
// Verification Intake Ready
// ≠
// Runtime Verified
//
// Provider Execution Observed
// ≠
// Provider Execution Valid
//
// Provider Execution Completed
// ≠
// Runtime Success
//
// Translation Denied
// ≠
// Provider Execution Not Observed
//
// Runtime Verification Intake
// prepares.
//
// Runtime Verification decides.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - verify runtime
// - decide provider execution validity
// - declare runtime success
// - classify runtime failure
// - decide recovery
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
// ✓ preserve provider execution facts
//
// ✓ preserve provider execution
//   observed/completed state even when
//   translation is denied, except when
//   runtime integration itself is not
//   ready
//
// ✓ prepare verification intake
//
// ✓ preserve providerReference
//
// ✓ preserve providerRawStatus
//
// ✓ preserve providerRawErrorCode
//
// ✗ verify runtime
//
// ✗ declare runtime success
//
// ✗ classify runtime failure
//
// ✗ decide recovery
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================
