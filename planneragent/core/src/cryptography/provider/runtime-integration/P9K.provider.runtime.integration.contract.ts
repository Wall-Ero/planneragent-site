// ============================================================
// PlannerAgent — Provider Runtime Integration Contract
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime-integration/
// P9K.provider.runtime.integration.contract.ts
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
// P9K.1 — Provider Runtime Integration Contract
//
// PURPOSE
// ------------------------------------------------------------
// Define the canonical contract for
// Provider Runtime Integration.
//
// P9K receives adapter-safe provider
// execution output and re-enters
// Provider Runtime with integration-
// safe runtime intake material.
//
// P9K preserves provider execution
// facts.
//
// P9K validates that provider output
// is safe and complete enough to
// re-enter runtime evaluation.
//
// P9K prepares runtime verification,
// runtime failure, and recovery
// intake.
//
// P9K does not perform runtime
// verification.
//
// P9K does not classify runtime
// failure.
//
// P9K does not decide recovery.
//
// P9K does not write evidence,
// ledger, or audit.
//
// ============================================================

import type {
  ProviderAdapterFailureSurface,
} from "../adapters/P9I.provider.adapter.contract";


// ============================================================
// PROVIDER RUNTIME INTEGRATION STATUS
// ============================================================

export type ProviderRuntimeIntegrationStatus =
  | "PROVIDER_RUNTIME_INTEGRATION_READY"
  | "PROVIDER_RUNTIME_INTEGRATION_DENIED";


// ============================================================
// PROVIDER RUNTIME INTEGRATION DECISION
// ============================================================

export type ProviderRuntimeIntegrationDecision =
  | "INTEGRATE_PROVIDER_RUNTIME_OUTCOME"
  | "REJECT_PROVIDER_RUNTIME_OUTCOME";


// ============================================================
// PROVIDER RUNTIME INTEGRATION DENIAL REASON
// ============================================================

export type ProviderRuntimeIntegrationDenialReason =
  | "PROVIDER_RUNTIME_INTEGRATION_NOT_ALLOWED"
  | "ADAPTER_OUTPUT_NOT_COMPATIBLE"
  | "PROVIDER_ERROR_NOT_SANITIZED"
  | "SANITIZED_FAILURE_SURFACE_MISSING"
  | "RAW_PROVIDER_FAILURE_MATERIAL_DETECTED"
  | "PROVIDER_OUTCOME_INCOMPLETE";


// ============================================================
// PROVIDER EXECUTION FACTS
// ============================================================

export interface ProviderRuntimeExecutionFacts {

  providerCallAttempted:
    boolean;

  providerCallCompleted:
    boolean;

  providerReference?:
    string;

  providerRawStatus?:
    string;

  providerRawErrorCode?:
    string;

}


// ============================================================
// PROVIDER RUNTIME VERIFICATION INTAKE
// ============================================================

export interface ProviderRuntimeVerificationIntake {

  verificationIntakeReady:
    boolean;

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

  summary:
    string[];

}


// ============================================================
// PROVIDER RUNTIME FAILURE INTAKE
// ============================================================

export interface ProviderRuntimeFailureIntake {

  failureIntakeReady:
    boolean;

  failureSurface:
    ProviderAdapterFailureSurface;

  summary:
    string[];

}


// ============================================================
// PROVIDER RUNTIME RECOVERY INTAKE
// ============================================================

export interface ProviderRuntimeRecoveryIntake {

  recoveryIntakeRequired:
    boolean;

  recoveryIntakeReady:
    boolean;

  recoveryReason:
    string;

  summary:
    string[];

}


// ============================================================
// PROVIDER RUNTIME INTAKE MATERIAL
// ============================================================

export interface ProviderRuntimeIntakeMaterial {

  verificationIntake:
    ProviderRuntimeVerificationIntake;

  failureIntake?:
    ProviderRuntimeFailureIntake;

  recoveryIntake:
    ProviderRuntimeRecoveryIntake;

  summary:
    string[];

}


// ============================================================
// PROVIDER RUNTIME INTEGRATION INPUT
// ============================================================

export interface ProviderRuntimeIntegrationInput {

  providerContract:
    string;

  providerImplementation:
    string;

  operation:
    string;

  providerResourceId?:
    string;

  providerConfigurationRef?:
    string;

  providerCredentialRef?:
    string;

  executionMetadata?:
    Record<string, unknown>;

  adapterCompatible:
    boolean;

  providerErrorSanitized:
    boolean;

  sanitizationRequired:
    boolean;

  providerCallAttempted:
    boolean;

  providerCallCompleted:
    boolean;

  providerReference?:
    string;

  providerRawStatus?:
    string;

  providerRawErrorCode?:
    string;

  sanitizedFailureSurface?:
    ProviderAdapterFailureSurface;

  integrationDecision:
    ProviderRuntimeIntegrationDecision;

  summary:
    string[];

}


// ============================================================
// PROVIDER RUNTIME INTEGRATION RESULT
// ============================================================

export interface ProviderRuntimeIntegrationResult {

  integrationStatus:
    ProviderRuntimeIntegrationStatus;

  integrationDecision:
    ProviderRuntimeIntegrationDecision;

  runtimeIntegrationReady:
    boolean;

  verificationIntakeRequired:
    boolean;

  failureIntakeRequired:
    boolean;

  recoveryIntakeRequired:
    boolean;

  providerContract:
    ProviderRuntimeIntegrationInput["providerContract"];

  providerImplementation:
    ProviderRuntimeIntegrationInput["providerImplementation"];

  operation:
    ProviderRuntimeIntegrationInput["operation"];

  providerResourceId?:
    ProviderRuntimeIntegrationInput["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeIntegrationInput["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeIntegrationInput["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeIntegrationInput["executionMetadata"];

  providerExecutionFacts:
    ProviderRuntimeExecutionFacts;

  runtimeIntakeMaterial?:
    ProviderRuntimeIntakeMaterial;

  denialReason?:
    ProviderRuntimeIntegrationDenialReason;

  summary:
    string[];

}


// ============================================================
// CONTRACT PRINCIPLES
// ============================================================
//
// Provider Runtime Integration Input
// receives only adapter-safe provider
// output.
//
// Provider Runtime Integration Result
// preserves provider execution facts
// and prepares runtime intake
// material.
//
// Runtime Integration Ready
// ≠
// Runtime Verified
//
// Failure Intake Required
// ≠
// Runtime Failure Classified
//
// Recovery Intake Required
// ≠
// Recovery Decided
//
// Recovery Intake Ready
// ≠
// Recovery Decided
//
// Provider Runtime Integration
// does not decide operational meaning.
//
// ============================================================


// ============================================================
// INPUT CONTRACT PRINCIPLE
// ============================================================
//
// ProviderRuntimeIntegrationInput must
// represent provider outcome that is
// already safe to leave P9J.
//
// It must preserve:
//
// ✓ providerContract
// ✓ providerImplementation
// ✓ operation
// ✓ providerResourceId
// ✓ providerConfigurationRef
// ✓ providerCredentialRef
// ✓ executionMetadata
// ✓ adapterCompatible
// ✓ providerErrorSanitized
// ✓ sanitizationRequired
// ✓ providerCallAttempted
// ✓ providerCallCompleted
// ✓ providerReference
// ✓ providerRawStatus
// ✓ providerRawErrorCode
// ✓ sanitizedFailureSurface, when
//   present
// ✓ integrationDecision
// ✓ summary
//
// It must not contain:
//
// - raw provider error messages
// - raw provider diagnostics
// - raw SDK payloads
// - secrets
// - credentials
// - tokens
// - key material
//
// ============================================================


// ============================================================
// RESULT CONTRACT PRINCIPLE
// ============================================================
//
// ProviderRuntimeIntegrationResult must
// preserve provider execution facts and
// prepare runtime-facing intake
// material.
//
// It must expose:
//
// ✓ runtimeIntegrationReady
// ✓ verificationIntakeRequired
// ✓ failureIntakeRequired
// ✓ recoveryIntakeRequired
// ✓ providerExecutionFacts
// ✓ runtimeIntakeMaterial, when
//   integration succeeds
// ✓ denialReason, when integration is
//   denied
//
// It must not expose:
//
// - runtimeVerified
// - runtimeFailureClassified
// - recoveryDecided
// - evidenceWritten
// - ledgerWritten
// - auditPerformed
//
// ============================================================


// ============================================================
// VERIFICATION INTAKE PRINCIPLE
// ============================================================
//
// ProviderRuntimeVerificationIntake
// prepares runtime verification
// material.
//
// It may expose:
//
// ✓ providerExecutionObserved
// ✓ providerExecutionCompleted
// ✓ providerReference
// ✓ providerRawStatus
// ✓ providerRawErrorCode
//
// It must not expose:
//
// - providerVerificationPassed
// - runtimeVerified
// - runtimeSuccess
//
// ============================================================


// ============================================================
// FAILURE INTAKE PRINCIPLE
// ============================================================
//
// ProviderRuntimeFailureIntake
// prepares runtime failure intake
// material from sanitized provider
// failure surfaces.
//
// It may expose:
//
// ✓ failureSurface
//
// It must not expose:
//
// - runtimeFailureClassified
// - runtimeFailureSeverity
// - recoveryDecision
//
// ============================================================


// ============================================================
// RECOVERY INTAKE PRINCIPLE
// ============================================================
//
// ProviderRuntimeRecoveryIntake
// prepares recovery intake readiness.
//
// It may expose:
//
// ✓ recoveryIntakeRequired
// ✓ recoveryIntakeReady
// ✓ recoveryReason
//
// It must not expose:
//
// - recoveryEligible
// - retryDecision
// - fallbackDecision
// - rollbackDecision
// - escalationDecision
//
// Recovery intake readiness means
// only that recovery intake material
// is ready to be handed to the
// recovery domain.
//
// It does not mean recovery has been
// selected, approved, or decided.
//
// ============================================================


// ============================================================
// SECURITY PRINCIPLE
// ============================================================
//
// No raw provider failure material may
// enter P9K.
//
// ProviderRuntimeIntegrationInput
// must only contain sanitized failure
// material.
//
// If sanitization is required,
// providerErrorSanitized must be true
// before integration may succeed.
//
// If sanitized failure material is
// required but missing, integration
// must be denied.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This contract MUST NOT be used to:
//
// - perform runtime verification
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


