// ============================================================
// PlannerAgent — Runtime Recovery Intake Assessment
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime-integration/
// P9K.provider.runtime.recovery.intake.assessment.ts
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
// P9K.4 — Runtime Recovery Intake Assessment
//
// PURPOSE
// ------------------------------------------------------------
// Assess whether an integration-ready
// ProviderRuntimeIntegrationResult
// contains sufficient material to
// prepare recovery intake.
//
// Runtime Recovery Intake Assessment
// prepares recovery intake material.
//
// It does not decide recovery.
//
// It does not decide retry.
//
// It does not decide failover.
//
// It does not decide degradation.
//
// It does not decide stop.
//
// It does not classify runtime failure.
//
// It does not verify runtime.
//
// It does not write evidence, ledger,
// or audit.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Provider Runtime Integration
// prepares re-entry.
//
// Runtime Recovery Intake Assessment
// prepares recovery intake.
//
// Recovery Intake Ready
// ≠
// Recovery Decided
//
// Recovery Intake Required
// ≠
// Retry Decision
//
// ============================================================

import type {
  ProviderRuntimeIntegrationResult,
  ProviderRuntimeRecoveryIntake,
} from "./P9K.provider.runtime.integration.contract";


// ============================================================
// RECOVERY INTAKE ASSESSMENT STATUS
// ============================================================

export type ProviderRuntimeRecoveryIntakeAssessmentStatus =
  | "PROVIDER_RUNTIME_RECOVERY_INTAKE_ASSESSED"
  | "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_ASSESSED"
  | "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_REQUIRED";


// ============================================================
// RECOVERY INTAKE ASSESSMENT DECISION
// ============================================================

export type ProviderRuntimeRecoveryIntakeAssessmentDecision =
  | "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE"
  | "REJECT_PROVIDER_RUNTIME_RECOVERY_INTAKE_ASSESSMENT";


// ============================================================
// RECOVERY INTAKE DENIAL REASON
// ============================================================

export type ProviderRuntimeRecoveryIntakeAssessmentDenialReason =
  | "PROVIDER_RUNTIME_INTEGRATION_NOT_READY"
  | "RECOVERY_INTAKE_ASSESSMENT_NOT_ALLOWED"
  | "RECOVERY_INTAKE_NOT_REQUIRED"
  | "RECOVERY_INTAKE_MATERIAL_MISSING";


// ============================================================
// RECOVERY INTAKE ASSESSMENT INPUT
// ============================================================

export interface ProviderRuntimeRecoveryIntakeAssessmentInput {

  integration:
    ProviderRuntimeIntegrationResult;

  assessmentDecision:
    ProviderRuntimeRecoveryIntakeAssessmentDecision;

}


// ============================================================
// RECOVERY INTAKE ASSESSMENT RESULT
// ============================================================

export interface ProviderRuntimeRecoveryIntakeAssessmentResult {

  assessmentStatus:
    ProviderRuntimeRecoveryIntakeAssessmentStatus;

  assessmentDecision:
    ProviderRuntimeRecoveryIntakeAssessmentDecision;

  recoveryIntakeAssessed:
    boolean;

  recoveryIntakeRequired:
    ProviderRuntimeIntegrationResult["recoveryIntakeRequired"];

  recoveryIntakeReady:
    boolean;

  recoveryReason?:
    string;

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

  recoveryIntake?:
    ProviderRuntimeRecoveryIntake;

  denialReason?:
    ProviderRuntimeRecoveryIntakeAssessmentDenialReason;

  integrationSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// RECOVERY INTAKE ASSESSMENT
// ============================================================

export function assessProviderRuntimeRecoveryIntake(
  input: ProviderRuntimeRecoveryIntakeAssessmentInput
): ProviderRuntimeRecoveryIntakeAssessmentResult {

  const integration =
    input.integration;

  const recoveryIntakeRequired =
    integration.recoveryIntakeRequired;

  const recoveryIntake =
    integration.runtimeIntakeMaterial?.recoveryIntake;

  if (!integration.runtimeIntegrationReady) {

    return {

      assessmentStatus:
        "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_ASSESSED",

      assessmentDecision:
        input.assessmentDecision,

      recoveryIntakeAssessed:
        false,

      recoveryIntakeRequired,

      recoveryIntakeReady:
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

      denialReason:
        "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",

      integrationSummary: [
        ...integration.summary,
      ],

      summary: [
        ...integration.summary,
        "provider_runtime_integration_not_ready",
        "provider_runtime_recovery_intake_not_assessed",
      ],

    };

  }

  if (
    input.assessmentDecision ===
    "REJECT_PROVIDER_RUNTIME_RECOVERY_INTAKE_ASSESSMENT"
  ) {

    return {

      assessmentStatus:
        "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_ASSESSED",

      assessmentDecision:
        input.assessmentDecision,

      recoveryIntakeAssessed:
        false,

      recoveryIntakeRequired,

      recoveryIntakeReady:
        false,

      recoveryReason:
        recoveryIntake?.recoveryReason,

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

      recoveryIntake,

      denialReason:
        "RECOVERY_INTAKE_ASSESSMENT_NOT_ALLOWED",

      integrationSummary: [
        ...integration.summary,
      ],

      summary: [
        ...integration.summary,
        "recovery_intake_assessment_not_allowed",
        "provider_runtime_recovery_intake_not_assessed",
      ],

    };

  }

  if (!recoveryIntakeRequired) {

    return {

      assessmentStatus:
        "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_REQUIRED",

      assessmentDecision:
        input.assessmentDecision,

      recoveryIntakeAssessed:
        false,

      recoveryIntakeRequired,

      recoveryIntakeReady:
        false,

      recoveryReason:
        "RECOVERY_INTAKE_NOT_REQUIRED",

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
        "RECOVERY_INTAKE_NOT_REQUIRED",

      integrationSummary: [
        ...integration.summary,
      ],

      summary: [
        ...integration.summary,
        "recovery_intake_not_required",
        "provider_runtime_recovery_intake_not_required",
      ],

    };

  }

  if (!recoveryIntake) {

    return {

      assessmentStatus:
        "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_ASSESSED",

      assessmentDecision:
        input.assessmentDecision,

      recoveryIntakeAssessed:
        false,

      recoveryIntakeRequired,

      recoveryIntakeReady:
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

      denialReason:
        "RECOVERY_INTAKE_MATERIAL_MISSING",

      integrationSummary: [
        ...integration.summary,
      ],

      summary: [
        ...integration.summary,
        "recovery_intake_material_missing",
        "provider_runtime_recovery_intake_not_assessed",
      ],

    };

  }

  return {

    assessmentStatus:
      "PROVIDER_RUNTIME_RECOVERY_INTAKE_ASSESSED",

    assessmentDecision:
      input.assessmentDecision,

    recoveryIntakeAssessed:
      true,

    recoveryIntakeRequired,

    recoveryIntakeReady:
      recoveryIntake.recoveryIntakeReady,

    recoveryReason:
      recoveryIntake.recoveryReason,

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

    recoveryIntake,

    integrationSummary: [
      ...integration.summary,
    ],

    summary: [
      ...integration.summary,
      "provider_runtime_recovery_intake_assessed",
      recoveryIntake.recoveryIntakeReady
        ? "provider_runtime_recovery_intake_ready"
        : "provider_runtime_recovery_intake_not_ready",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Runtime Recovery Intake Assessment
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
// ✓ recoveryIntakeRequired
// ✓ recoveryIntakeReady
// ✓ recoveryReason
// ✓ integrationSummary
//
// It prepares:
//
// ✓ ProviderRuntimeRecoveryIntake
// ✓ recovery intake assessment result
//
// It does not:
//
// - decide recovery
// - decide retry
// - decide failover
// - decide degradation
// - decide stop
// - classify runtime failure
// - verify runtime
// - write evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// RECOVERY INTAKE PRINCIPLES
// ============================================================
//
// Provider Runtime Integration
// ≠
// Runtime Recovery Intake Assessment
//
// Runtime Recovery Intake Assessment
// ≠
// Recovery Decision
//
// Recovery Intake Ready
// ≠
// Recovery Decided
//
// Recovery Intake Required
// ≠
// Retry Decision
//
// Recovery Reason
// ≠
// Recovery Strategy
//
// Runtime Recovery Intake
// prepares.
//
// Runtime Recovery decides.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - decide recovery
// - decide retry
// - decide failover
// - decide degradation
// - decide stop
// - classify runtime failure
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
// ✓ require recoveryIntakeRequired
//
// ✓ require recovery intake material
//
// ✓ assess recovery intake readiness
//
// ✓ preserve recoveryReason
//
// ✓ preserve provider context
//
// ✗ decide recovery
//
// ✗ decide retry
//
// ✗ decide failover
//
// ✗ classify runtime failure
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


