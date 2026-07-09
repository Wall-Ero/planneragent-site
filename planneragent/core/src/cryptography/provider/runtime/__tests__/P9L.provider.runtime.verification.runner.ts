// ============================================================
// PlannerAgent — Provider Runtime Verification Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9L.provider.runtime.verification.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL TEST RUNNER
//
// CATEGORY
// ------------------------------------------------------------
// Provider Runtime
//
// DOMAIN
// ------------------------------------------------------------
// P9L.1 — Provider Runtime Verification Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify P9L.1 Provider Runtime
// Verification contract.
//
// This runner verifies:
//
// 1. verification rejected
// 2. integration not ready
// 3. verification intake not translated
// 4. verification intake not ready
// 5. provider execution not observed
// 6. provider execution not completed
// 7. failure surface present
// 8. runtime verified
// 9. boundary verification
//
// It also verifies that P9L.1 does not:
//
// - classify runtime failure
// - assign runtime failure severity
// - decide recovery
// - decide retry
// - decide failover
// - decide degradation
// - decide stop
// - generate evidence
// - write ledger
// - perform audit
//
// ============================================================

import assert from "node:assert/strict";

import {
  verifyProviderRuntimeOutcome,
} from "../P9L.provider.runtime.verification";

import type {
  ProviderRuntimeVerificationInput,
} from "../P9L.provider.runtime.verification";

import type {
  ProviderRuntimeIntegrationResult,
} from "../../runtime-integration/P9K.provider.runtime.integration.contract";

import type {
  ProviderRuntimeVerificationIntakeTranslationResult,
} from "../../runtime-integration/P9K.provider.runtime.verification.intake.translation";

import type {
  ProviderRuntimeFailureIntakeTranslationResult,
} from "../../runtime-integration/P9K.provider.runtime.failure.intake.translation";

import type {
  ProviderRuntimeRecoveryIntakeAssessmentResult,
} from "../../runtime-integration/P9K.provider.runtime.recovery.intake.assessment";


// ============================================================
// TEST UTILITIES
// ============================================================

function pass(
  label: string
): void {

  console.log(
    `✅ ${label}`
  );

}


function assertNoCrossLayerFields(
  value: Record<string, unknown>
): void {

  const forbiddenFields = [

    "runtimeFailureClassified",

    "runtimeFailureSeverity",

    "failureSeverityAssigned",

    "retryDecision",

    "recoveryDecision",

    "recoveryDecided",

    "failoverDecision",

    "degradationDecision",

    "stopDecision",

    "evidenceGenerated",

    "evidenceWritten",

    "ledgerWritten",

    "auditPerformed",

    "providerSdkCalled",

    "providerApiCalled",

    "providerErrorResanitized",

    "sanitizedFailureSurfaceAltered",

  ];

  for (const field of forbiddenFields) {

    assert(
      !(field in value),
      `cross-layer field not exposed: ${field}`
    );

    pass(
      `cross-layer field not exposed: ${field}`
    );

  }

}


// ============================================================
// FIXTURES — INTEGRATION
// ============================================================

function buildVerifiedIntegration(): ProviderRuntimeIntegrationResult {

  return {

    integrationStatus:
      "PROVIDER_RUNTIME_INTEGRATION_READY",

    integrationDecision:
      "INTEGRATE_PROVIDER_RUNTIME_OUTCOME",

    runtimeIntegrationReady:
      true,

    verificationIntakeRequired:
      true,

    failureIntakeRequired:
      false,

    recoveryIntakeRequired:
      false,

    providerContract:
      "KEY_MANAGEMENT",

    providerImplementation:
      "AWS_KMS",

    operation:
      "REWRAP_KEY",

    providerResourceId:
      "kms-key-verified",

    providerConfigurationRef:
      "cfg/aws-kms-prod",

    providerCredentialRef:
      "cred/aws-kms-prod",

    executionMetadata: {
      tenantId: "tenant-001",
      runtimeBatchId: "runtime-verified",
    },

    providerExecutionFacts: {

      providerCallAttempted:
        true,

      providerCallCompleted:
        true,

      providerReference:
        "aws-kms-op-verified",

      providerRawStatus:
        "KMS_SUCCESS",

    },

    runtimeIntakeMaterial: {
  verificationIntake: {
    verificationIntakeReady: true,
    providerExecutionObserved: true,
    providerExecutionCompleted: true,
    providerReference: "aws-kms-op-success",
    providerRawStatus: "KMS_SUCCESS",
    providerRawErrorCode: undefined,
    summary: [
      "provider_runtime_verification_intake_ready",
      "provider_execution_observed",
      "provider_execution_completed",
    ],
  },

  recoveryIntake: {
    recoveryIntakeRequired: false,
    recoveryIntakeReady: false,
    recoveryReason: "RECOVERY_INTAKE_NOT_REQUIRED",
    summary: [
      "provider_runtime_recovery_intake_not_required",
    ],
  },

  summary: [
    "runtime_intake_material_ready",
    "verification_intake_available",
    "failure_intake_not_required",
    "recovery_intake_not_required",
  ],
},

    summary: [
      "provider_runtime_integration_ready",
      "provider_runtime_intake_material_ready",
      "provider_execution_completed",
    ],

  };

}


function buildFailureIntegration(): ProviderRuntimeIntegrationResult {

  return {

    integrationStatus:
      "PROVIDER_RUNTIME_INTEGRATION_READY",

    integrationDecision:
      "INTEGRATE_PROVIDER_RUNTIME_OUTCOME",

    runtimeIntegrationReady:
      true,

    verificationIntakeRequired:
      true,

    failureIntakeRequired:
      true,

    recoveryIntakeRequired:
      true,

    providerContract:
      "KEY_MANAGEMENT",

    providerImplementation:
      "AWS_KMS",

    operation:
      "REWRAP_KEY",

    providerResourceId:
      "kms-key-failure",

    providerConfigurationRef:
      "cfg/aws-kms-prod",

    providerCredentialRef:
      "cred/aws-kms-prod",

    executionMetadata: {
      tenantId: "tenant-001",
      runtimeBatchId: "runtime-failure",
    },

    providerExecutionFacts: {

      providerCallAttempted:
        true,

      providerCallCompleted:
        false,

      providerReference:
        "aws-kms-op-failure",

      providerRawStatus:
        "KMS_ERROR",

      providerRawErrorCode:
        "AccessDeniedException",

    },

    runtimeIntakeMaterial: {

      verificationIntake: {

        verificationIntakeReady:
          true,

        providerExecutionObserved:
          true,

        providerExecutionCompleted:
          false,

        providerReference:
          "aws-kms-op-failure",

        providerRawStatus:
          "KMS_ERROR",

        providerRawErrorCode:
          "AccessDeniedException",

        summary: [
          "provider_runtime_verification_intake_ready",
          "provider_execution_observed",
          "provider_execution_not_completed",
        ],

      },

      failureIntake: {

        failureIntakeReady:
          true,

        failureSurface: {

          failureCode:
            "PROVIDER_CALL_UNAUTHORIZED",

          providerRawStatus:
            "KMS_ERROR",

          providerRawErrorCode:
            "AccessDeniedException",

          providerSanitizedErrorMessage:
            "provider authorization failed",

          retryable:
            false,

          summary: [
            "provider_failure_surface_sanitized",
          ],

        },

        summary: [
          "provider_runtime_failure_intake_ready",
          "provider_failure_not_retryable",
        ],

      },

      recoveryIntake: {

        recoveryIntakeRequired:
          true,

        recoveryIntakeReady:
          true,

        recoveryReason:
          "PROVIDER_FAILURE_SURFACE_PRESENT",

        summary: [
          "provider_runtime_recovery_intake_ready",
        ],

      },

      summary: [
        "runtime_intake_material_ready",
        "verification_intake_available",
        "failure_intake_available",
        "recovery_intake_available",
      ],

    },

    summary: [
      "provider_runtime_integration_ready",
      "provider_runtime_intake_material_ready",
      "provider_runtime_failure_surface_available",
    ],

  };

}


function buildIntegrationNotReady(): ProviderRuntimeIntegrationResult {

  return {

    ...buildFailureIntegration(),

    integrationStatus:
      "PROVIDER_RUNTIME_INTEGRATION_DENIED",

    runtimeIntegrationReady:
      false,

    denialReason:
      "ADAPTER_OUTPUT_NOT_COMPATIBLE",

    summary: [
      "provider_runtime_integration_denied",
      "adapter_output_not_compatible",
    ],

  };

}


// ============================================================
// FIXTURES — VERIFICATION INTAKE
// ============================================================

function buildVerificationIntakeTranslated(
  integration: ProviderRuntimeIntegrationResult
): ProviderRuntimeVerificationIntakeTranslationResult {

  const facts =
    integration.providerExecutionFacts!;

  return {

    translationStatus:
      "PROVIDER_RUNTIME_VERIFICATION_INTAKE_TRANSLATED",

    translationDecision:
      "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

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

    providerExecutionFacts:
      facts,

    providerExecutionObserved:
      facts.providerCallAttempted,

    providerExecutionCompleted:
      facts.providerCallCompleted,

    providerReference:
      facts.providerReference,

    providerRawStatus:
      facts.providerRawStatus,

    providerRawErrorCode:
      facts.providerRawErrorCode,

    verificationIntake: {

      verificationIntakeReady:
        true,

      providerExecutionObserved:
        facts.providerCallAttempted,

      providerExecutionCompleted:
        facts.providerCallCompleted,

      providerReference:
        facts.providerReference,

      providerRawStatus:
        facts.providerRawStatus,

      providerRawErrorCode:
        facts.providerRawErrorCode,

      summary: [
        "provider_runtime_verification_intake_ready",
        facts.providerCallAttempted
          ? "provider_execution_observed"
          : "provider_execution_not_observed",
        facts.providerCallCompleted
          ? "provider_execution_completed"
          : "provider_execution_not_completed",
      ],

    },

    integrationSummary: [
      ...integration.summary,
    ],

    summary: [
      ...integration.summary,
      "provider_runtime_verification_intake_translated",
    ],

  };

}


function buildVerificationIntakeNotTranslated(
  integration: ProviderRuntimeIntegrationResult
): ProviderRuntimeVerificationIntakeTranslationResult {

  return {

    ...buildVerificationIntakeTranslated(
      integration
    ),

    translationStatus:
      "PROVIDER_RUNTIME_VERIFICATION_INTAKE_NOT_TRANSLATED",

    verificationIntakeTranslated:
      false,

    verificationIntakeReady:
      false,

    denialReason:
      "VERIFICATION_INTAKE_TRANSLATION_NOT_ALLOWED",

    summary: [
      ...integration.summary,
      "verification_intake_translation_not_allowed",
      "provider_runtime_verification_intake_not_translated",
    ],

  };

}


function buildVerificationIntakeNotReady(
  integration: ProviderRuntimeIntegrationResult
): ProviderRuntimeVerificationIntakeTranslationResult {

  return {

    ...buildVerificationIntakeTranslated(
      integration
    ),

    verificationIntakeReady:
      false,

    denialReason:
      "VERIFICATION_INTAKE_TRANSLATION_NOT_ALLOWED",

    summary: [
      ...integration.summary,
      "verification_intake_not_ready",
      "provider_runtime_verification_intake_not_translated",
    ],

  };

}


function buildVerificationIntakeNotObserved(
  integration: ProviderRuntimeIntegrationResult
): ProviderRuntimeVerificationIntakeTranslationResult {

  const translated =
    buildVerificationIntakeTranslated(
      integration
    );

  return {

    ...translated,

    providerExecutionObserved:
      false,

    providerExecutionCompleted:
      false,

    verificationIntake: {

      ...translated.verificationIntake!,

      providerExecutionObserved:
        false,

      providerExecutionCompleted:
        false,

      summary: [
        "provider_runtime_verification_intake_ready",
        "provider_execution_not_observed",
        "provider_execution_not_completed",
      ],

    },

  };

}


// ============================================================
// FIXTURES — FAILURE INTAKE
// ============================================================

function buildFailureIntakeNotRequired(
  integration: ProviderRuntimeIntegrationResult
): ProviderRuntimeFailureIntakeTranslationResult {

  return {

    translationStatus:
      "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_REQUIRED",

    translationDecision:
      "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    failureIntakeTranslated:
      false,

    failureIntakeReady:
      false,

    failureIntakeRequired:
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


function buildFailureIntakeTranslated(
  integration: ProviderRuntimeIntegrationResult
): ProviderRuntimeFailureIntakeTranslationResult {

  const surface =
    integration.runtimeIntakeMaterial!
      .failureIntake!
      .failureSurface;

  return {

    translationStatus:
      "PROVIDER_RUNTIME_FAILURE_INTAKE_TRANSLATED",

    translationDecision:
      "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    failureIntakeTranslated:
      true,

    failureIntakeReady:
      true,

    failureIntakeRequired:
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

    sanitizedFailureSurface:
      surface,

    failureCode:
      surface.failureCode,

    providerRawStatus:
      surface.providerRawStatus,

    providerRawErrorCode:
      surface.providerRawErrorCode,

    providerSanitizedErrorMessage:
      surface.providerSanitizedErrorMessage,

    retryable:
      surface.retryable,

    failureIntake: {

      failureIntakeReady:
        true,

      failureSurface:
        surface,

      summary: [
        "provider_runtime_failure_intake_ready",
        surface.retryable
          ? "provider_failure_retryable"
          : "provider_failure_not_retryable",
      ],

    },

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
// FIXTURES — RECOVERY INTAKE
// ============================================================

function buildRecoveryIntakeNotRequired(
  integration: ProviderRuntimeIntegrationResult
): ProviderRuntimeRecoveryIntakeAssessmentResult {

  return {

    assessmentStatus:
      "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_REQUIRED",

    assessmentDecision:
      "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    recoveryIntakeAssessed:
      false,

    recoveryIntakeRequired:
      false,

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


function buildRecoveryIntakeAssessed(
  integration: ProviderRuntimeIntegrationResult
): ProviderRuntimeRecoveryIntakeAssessmentResult {

  const recovery =
    integration.runtimeIntakeMaterial!
      .recoveryIntake!;

  return {

    assessmentStatus:
      "PROVIDER_RUNTIME_RECOVERY_INTAKE_ASSESSED",

    assessmentDecision:
      "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    recoveryIntakeAssessed:
      true,

    recoveryIntakeRequired:
      true,

    recoveryIntakeReady:
      recovery.recoveryIntakeReady,

    recoveryReason:
      recovery.recoveryReason,

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

    recoveryIntake:
      recovery,

    integrationSummary: [
      ...integration.summary,
    ],

    summary: [
      ...integration.summary,
      "provider_runtime_recovery_intake_assessed",
      recovery.recoveryIntakeReady
        ? "provider_runtime_recovery_intake_ready"
        : "provider_runtime_recovery_intake_not_ready",
    ],

  };

}


// ============================================================
// INPUT BUILDER
// ============================================================

function buildInput(
  integration: ProviderRuntimeIntegrationResult,
  verificationIntake: ProviderRuntimeVerificationIntakeTranslationResult,
  failureIntake: ProviderRuntimeFailureIntakeTranslationResult,
  recoveryIntake:
    | ProviderRuntimeRecoveryIntakeAssessmentResult
    | undefined,
  verificationDecision:
    ProviderRuntimeVerificationInput["verificationDecision"]
): ProviderRuntimeVerificationInput {

  return {

    integration,

    verificationIntake,

    failureIntake,

    recoveryIntake,

    verificationDecision,

  };

}


// ============================================================
// SCENARIO 1 — VERIFICATION REJECTED
// ============================================================

function runVerificationRejectedScenario(): void {

  const integration =
    buildVerifiedIntegration();

  const result =
    verifyProviderRuntimeOutcome(
      buildInput(
        integration,
        buildVerificationIntakeTranslated(
          integration
        ),
        buildFailureIntakeNotRequired(
          integration
        ),
        buildRecoveryIntakeNotRequired(
          integration
        ),
        "REJECT_PROVIDER_RUNTIME_VERIFICATION"
      )
    );

  assert(
    result.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFICATION_DENIED",
    "verification rejected status preserved"
  );

  assert(
    result.runtimeVerificationAttempted === false,
    "verification rejected prevents verification attempt"
  );

  assert(
    result.verificationDenialReason ===
      "RUNTIME_VERIFICATION_NOT_ALLOWED",
    "verification rejected denial reason preserved"
  );

  pass("verification rejected");
  pass("verification rejected denial reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 2 — INTEGRATION NOT READY
// ============================================================

function runIntegrationNotReadyScenario(): void {

  const integration =
    buildIntegrationNotReady();

  const result =
    verifyProviderRuntimeOutcome(
      buildInput(
        integration,
        buildVerificationIntakeTranslated(
          integration
        ),
        buildFailureIntakeTranslated(
          integration
        ),
        buildRecoveryIntakeAssessed(
          integration
        ),
        "VERIFY_PROVIDER_RUNTIME_OUTCOME"
      )
    );

  assert(
    result.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFICATION_DENIED",
    "integration not ready denies runtime verification"
  );

  assert(
    result.verificationDenialReason ===
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",
    "integration not ready denial reason preserved"
  );

  pass("integration not ready");
  pass("integration not ready denial reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — VERIFICATION INTAKE NOT TRANSLATED
// ============================================================

function runVerificationIntakeNotTranslatedScenario(): void {

  const integration =
    buildVerifiedIntegration();

  const result =
    verifyProviderRuntimeOutcome(
      buildInput(
        integration,
        buildVerificationIntakeNotTranslated(
          integration
        ),
        buildFailureIntakeNotRequired(
          integration
        ),
        buildRecoveryIntakeNotRequired(
          integration
        ),
        "VERIFY_PROVIDER_RUNTIME_OUTCOME"
      )
    );

  assert(
    result.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFICATION_DENIED",
    "verification intake not translated denies verification"
  );

  assert(
    result.verificationDenialReason ===
      "VERIFICATION_INTAKE_NOT_TRANSLATED",
    "verification intake not translated reason preserved"
  );

  pass("verification intake not translated");
  pass("verification intake not translated reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 4 — VERIFICATION INTAKE NOT READY
// ============================================================

function runVerificationIntakeNotReadyScenario(): void {

  const integration =
    buildVerifiedIntegration();

  const result =
    verifyProviderRuntimeOutcome(
      buildInput(
        integration,
        {
          ...buildVerificationIntakeTranslated(
            integration
          ),
          verificationIntakeReady:
            false,
          summary: [
            ...integration.summary,
            "verification_intake_not_ready",
          ],
        },
        buildFailureIntakeNotRequired(
          integration
        ),
        buildRecoveryIntakeNotRequired(
          integration
        ),
        "VERIFY_PROVIDER_RUNTIME_OUTCOME"
      )
    );

  assert(
    result.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFICATION_DENIED",
    "verification intake not ready denies verification"
  );

  assert(
    result.verificationDenialReason ===
      "VERIFICATION_INTAKE_NOT_READY",
    "verification intake not ready reason preserved"
  );

  pass("verification intake not ready");
  pass("verification intake not ready reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 5 — PROVIDER EXECUTION NOT OBSERVED
// ============================================================

function runProviderExecutionNotObservedScenario(): void {

  const integration =
    buildVerifiedIntegration();

  const result =
    verifyProviderRuntimeOutcome(
      buildInput(
        integration,
        buildVerificationIntakeNotObserved(
          integration
        ),
        buildFailureIntakeNotRequired(
          integration
        ),
        buildRecoveryIntakeNotRequired(
          integration
        ),
        "VERIFY_PROVIDER_RUNTIME_OUTCOME"
      )
    );

  assert(
    result.verificationStatus ===
      "PROVIDER_RUNTIME_NOT_VERIFIED",
    "provider execution not observed produces not verified"
  );

  assert(
    result.verificationFailureReason ===
      "PROVIDER_EXECUTION_NOT_OBSERVED",
    "provider execution not observed failure reason preserved"
  );

  assert(
    result.runtimeVerificationAttempted === true,
    "provider execution not observed still attempts verification"
  );

  pass("provider execution not observed");
  pass("provider execution not observed failure reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 6 — PROVIDER EXECUTION NOT COMPLETED
// ============================================================

function runProviderExecutionNotCompletedScenario(): void {

  const integration =
    buildFailureIntegration();

  const result =
    verifyProviderRuntimeOutcome(
      buildInput(
        integration,
        buildVerificationIntakeTranslated(
          integration
        ),
        buildFailureIntakeTranslated(
          integration
        ),
        buildRecoveryIntakeAssessed(
          integration
        ),
        "VERIFY_PROVIDER_RUNTIME_OUTCOME"
      )
    );

  assert(
    result.verificationStatus ===
      "PROVIDER_RUNTIME_NOT_VERIFIED",
    "provider execution not completed produces not verified"
  );

  assert(
    result.verificationFailureReason ===
      "PROVIDER_EXECUTION_NOT_COMPLETED",
    "provider execution not completed has priority over failure surface"
  );

  assert(
    result.failureSurfacePresent === true,
    "failure surface presence preserved"
  );

  pass("provider execution not completed");
  pass("provider execution not completed priority preserved");
  pass("failure surface presence preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 7 — FAILURE SURFACE PRESENT
// ============================================================

function runFailureSurfacePresentScenario(): void {

  const integration =
    buildVerifiedIntegration();

  const failureIntegration =
    buildFailureIntegration();

  const result =
    verifyProviderRuntimeOutcome(
      buildInput(
        integration,
        buildVerificationIntakeTranslated(
          integration
        ),
        buildFailureIntakeTranslated(
          failureIntegration
        ),
        buildRecoveryIntakeAssessed(
          failureIntegration
        ),
        "VERIFY_PROVIDER_RUNTIME_OUTCOME"
      )
    );

  assert(
    result.verificationStatus ===
      "PROVIDER_RUNTIME_NOT_VERIFIED",
    "failure surface present produces not verified"
  );

  assert(
    result.verificationFailureReason ===
      "PROVIDER_FAILURE_SURFACE_PRESENT",
    "failure surface present failure reason preserved"
  );

  assert(
    result.providerExecutionCompleted === true,
    "failure surface present checked after execution completed"
  );

  pass("failure surface present");
  pass("failure surface present failure reason preserved");
  pass("failure surface checked after completion");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 8 — RUNTIME VERIFIED
// ============================================================

function runRuntimeVerifiedScenario(): void {

  const integration =
    buildVerifiedIntegration();

  const result =
    verifyProviderRuntimeOutcome(
      buildInput(
        integration,
        buildVerificationIntakeTranslated(
          integration
        ),
        buildFailureIntakeNotRequired(
          integration
        ),
        buildRecoveryIntakeNotRequired(
          integration
        ),
        "VERIFY_PROVIDER_RUNTIME_OUTCOME"
      )
    );

  assert(
    result.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFIED",
    "runtime verified status preserved"
  );

  assert(
    result.runtimeVerified === true,
    "runtime verified flag set"
  );

  assert(
    result.runtimeNotVerified === false,
    "runtime not verified flag not set"
  );

  assert(
    result.runtimeVerificationDenied === false,
    "runtime verification denied flag not set"
  );

  pass("runtime verified");
  pass("runtime verified flags preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SUMMARY AND PROPAGATION CHECKS
// ============================================================

function runPropagationChecks(): void {

  const integration =
    buildFailureIntegration();

  const result =
    verifyProviderRuntimeOutcome(
      buildInput(
        integration,
        buildVerificationIntakeTranslated(
          integration
        ),
        buildFailureIntakeTranslated(
          integration
        ),
        buildRecoveryIntakeAssessed(
          integration
        ),
        "VERIFY_PROVIDER_RUNTIME_OUTCOME"
      )
    );

  assert(
    result.providerContract ===
      integration.providerContract,
    "providerContract propagated"
  );

  assert(
    result.providerImplementation ===
      integration.providerImplementation,
    "providerImplementation propagated"
  );

  assert(
    result.operation ===
      integration.operation,
    "operation propagated"
  );

  assert(
    result.providerResourceId ===
      integration.providerResourceId,
    "providerResourceId propagated"
  );

  assert(
    result.providerConfigurationRef ===
      integration.providerConfigurationRef,
    "providerConfigurationRef propagated"
  );

  assert(
    result.providerCredentialRef ===
      integration.providerCredentialRef,
    "providerCredentialRef propagated"
  );

  assert(
    result.providerReference ===
      integration.providerExecutionFacts.providerReference,
    "providerReference propagated"
  );

  assert(
    result.providerRawStatus ===
      integration.providerExecutionFacts.providerRawStatus,
    "providerRawStatus propagated"
  );

  assert(
    result.providerRawErrorCode ===
      integration.providerExecutionFacts.providerRawErrorCode,
    "providerRawErrorCode propagated"
  );

  assert(
    result.integrationSummary.includes(
      "provider_runtime_integration_ready"
    ),
    "integration summary propagated"
  );

  assert(
    result.summary.includes(
      "provider_runtime_verification_failed"
    ),
    "verification failure summary preserved"
  );

  pass("provider context propagated");
  pass("provider execution facts propagated");
  pass("summary propagation verified");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runVerificationRejectedScenario();

  runIntegrationNotReadyScenario();

  runVerificationIntakeNotTranslatedScenario();

  runVerificationIntakeNotReadyScenario();

  runProviderExecutionNotObservedScenario();

  runProviderExecutionNotCompletedScenario();

  runFailureSurfacePresentScenario();

  runRuntimeVerifiedScenario();

  runPropagationChecks();

  console.log("");
  console.log("========================================");
  console.log("P9L PROVIDER RUNTIME VERIFICATION");
  console.log("========================================");
  console.log("");

  console.log("Scenarios:");
  console.log("✓ verification rejected");
  console.log("✓ integration not ready");
  console.log("✓ verification intake not translated");
  console.log("✓ verification intake not ready");
  console.log("✓ provider execution not observed");
  console.log("✓ provider execution not completed");
  console.log("✓ failure surface present");
  console.log("✓ runtime verified");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime failure classification");
  console.log("✓ no runtime failure severity");
  console.log("✓ no recovery decision");
  console.log("✓ no retry/failover/degradation/stop decision");
  console.log("✓ no evidence / ledger / audit");
  console.log("✓ no provider API / SDK call");
  console.log("✓ no re-sanitization");
  console.log("✓ sanitized failure surface not altered");

  console.log("");
  console.log("========================================");
  console.log("P9L.1 PROVIDER RUNTIME VERIFICATION VERIFIED");
  console.log("========================================");

}

main();


