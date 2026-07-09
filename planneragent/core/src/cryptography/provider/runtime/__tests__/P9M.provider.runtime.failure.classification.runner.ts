// ============================================================
// PlannerAgent — Provider Runtime Failure Classification Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9M.provider.runtime.failure.classification.runner.ts
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
// P9M.1 — Provider Runtime Failure Classification Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify P9M.1 Provider Runtime
// Failure Classification contract.
//
// This runner verifies:
//
// 1. classification rejected
// 2. runtime verification denied
// 3. runtime verified → classification not required
// 4. failure intake not translated
// 5. failure intake not ready
// 6. failure surface missing
// 7. failure surface insufficient
// 8. execution incomplete classified
// 9. provider authorization failure classified
// 10. boundary verification
//
// ============================================================

import assert from "node:assert/strict";

import {
  classifyProviderRuntimeFailure,
} from "../P9M.provider.runtime.failure.classification";

import type {
  ProviderRuntimeFailureClassificationInput,
} from "../P9M.provider.runtime.failure.classification";

import type {
  ProviderRuntimeIntegrationResult,
} from "../../runtime-integration/P9K.provider.runtime.integration.contract";

import type {
  ProviderRuntimeVerificationResult,
} from "../P9L.provider.runtime.verification";

import type {
  ProviderRuntimeFailureIntakeTranslationResult,
} from "../../runtime-integration/P9K.provider.runtime.failure.intake.translation";

import type {
  ProviderRuntimeRecoveryIntakeAssessmentResult,
} from "../../runtime-integration/P9K.provider.runtime.recovery.intake.assessment";


// ============================================================
// TEST UTILITIES
// ============================================================

function pass(label: string): void {
  console.log(`✅ ${label}`);
}


function assertNoCrossLayerFields(
  value: Record<string, unknown>
): void {

  const forbiddenFields = [
    "runtimeVerifiedDecided",
    "retryDecision",
    "recoveryDecision",
    "recoveryDecided",
    "failoverDecision",
    "degradationDecision",
    "stopDecision",
    "recoveryExecuted",
    "providerSdkCalled",
    "providerApiCalled",
    "providerErrorResanitized",
    "sanitizedFailureSurfaceAltered",
    "evidenceGenerated",
    "evidenceWritten",
    "ledgerWritten",
    "auditPerformed",
  ];

  for (const field of forbiddenFields) {

    assert(
      !(field in value),
      `cross-layer field not exposed: ${field}`
    );

    pass(`cross-layer field not exposed: ${field}`);

  }

}


// ============================================================
// FIXTURES
// ============================================================

function buildIntegration(): ProviderRuntimeIntegrationResult {

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


function buildVerificationNotVerified(
  reason:
    ProviderRuntimeVerificationResult["verificationFailureReason"] =
      "PROVIDER_EXECUTION_NOT_COMPLETED"
): ProviderRuntimeVerificationResult {

  const integration =
    buildIntegration();

  return {

    verificationStatus:
      "PROVIDER_RUNTIME_NOT_VERIFIED",

    verificationDecision:
      "VERIFY_PROVIDER_RUNTIME_OUTCOME",

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
      true,

    providerExecutionCompleted:
      reason === "PROVIDER_EXECUTION_NOT_COMPLETED"
        ? false
        : true,

    providerReference:
      "aws-kms-op-failure",

    providerRawStatus:
      "KMS_ERROR",

    providerRawErrorCode:
      "AccessDeniedException",

    failureIntakeRequired:
      true,

    failureSurfacePresent:
      true,

    recoveryIntakeRequired:
      true,

    verificationFailureReason:
      reason,

    integrationSummary: [
      ...integration.summary,
    ],

    verificationIntakeSummary: [
      "provider_runtime_verification_intake_translated",
    ],

    failureIntakeSummary: [
      "provider_runtime_failure_intake_translated",
    ],

    recoveryIntakeSummary: [
      "provider_runtime_recovery_intake_assessed",
    ],

    summary: [
      ...integration.summary,
      "provider_runtime_verification_failed",
      reason === "PROVIDER_EXECUTION_NOT_COMPLETED"
        ? "provider_execution_not_completed"
        : "provider_failure_surface_present",
    ],

  };

}


function buildVerificationDenied(): ProviderRuntimeVerificationResult {

  const integration =
    buildIntegration();

  return {

    ...buildVerificationNotVerified(),

    verificationStatus:
      "PROVIDER_RUNTIME_VERIFICATION_DENIED",

    runtimeVerificationAttempted:
      false,

    runtimeVerified:
      false,

    runtimeNotVerified:
      false,

    runtimeVerificationDenied:
      true,

    verificationFailureReason:
      undefined,

    verificationDenialReason:
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",

    summary: [
      ...integration.summary,
      "provider_runtime_verification_denied",
      "provider_runtime_integration_not_ready",
    ],

  };

}


function buildVerificationVerified(): ProviderRuntimeVerificationResult {

  const integration =
    buildIntegration();

  return {

    ...buildVerificationNotVerified(),

    verificationStatus:
      "PROVIDER_RUNTIME_VERIFIED",

    runtimeVerificationAttempted:
      true,

    runtimeVerified:
      true,

    runtimeNotVerified:
      false,

    runtimeVerificationDenied:
      false,

    providerExecutionObserved:
      true,

    providerExecutionCompleted:
      true,

    failureIntakeRequired:
      false,

    failureSurfacePresent:
      false,

    recoveryIntakeRequired:
      false,

    verificationFailureReason:
      undefined,

    summary: [
      ...integration.summary,
      "provider_runtime_verification_passed",
      "provider_runtime_verified",
    ],

  };

}


function buildFailureIntakeTranslated(): ProviderRuntimeFailureIntakeTranslationResult {

  const integration =
    buildIntegration();

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
        "provider_failure_not_retryable",
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


function buildFailureIntakeNotTranslated(): ProviderRuntimeFailureIntakeTranslationResult {

  return {

    ...buildFailureIntakeTranslated(),

    translationStatus:
      "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_TRANSLATED",

    failureIntakeTranslated:
      false,

    failureIntakeReady:
      false,

    denialReason:
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",

    summary: [
      "provider_runtime_failure_intake_not_translated",
    ],

  };

}


function buildFailureIntakeNotReady(): ProviderRuntimeFailureIntakeTranslationResult {

  return {

    ...buildFailureIntakeTranslated(),

    failureIntakeReady:
      false,

    denialReason:
      "FAILURE_INTAKE_TRANSLATION_NOT_ALLOWED",

    summary: [
      "failure_intake_not_ready",
    ],

  };

}


function buildFailureIntakeMissingSurface(): ProviderRuntimeFailureIntakeTranslationResult {

  return {

    ...buildFailureIntakeTranslated(),

    sanitizedFailureSurface:
      undefined,

    failureCode:
      undefined,

    providerRawStatus:
      undefined,

    providerRawErrorCode:
      undefined,

    providerSanitizedErrorMessage:
      undefined,

    retryable:
      undefined,

    failureIntake:
      undefined,

    summary: [
      "failure_surface_missing",
    ],

  };

}


function buildFailureIntakeInsufficientSurface(): ProviderRuntimeFailureIntakeTranslationResult {

  const failureIntake =
    buildFailureIntakeTranslated();

  return {

    ...failureIntake,

    failureCode:
      undefined,

    providerRawStatus:
      undefined,

    providerRawErrorCode:
      undefined,

    failureIntake: {

      failureIntakeReady:
        true,

      failureSurface: {

        failureCode:
          undefined as never,

        providerRawStatus:
          undefined,

        providerRawErrorCode:
          undefined,

        providerSanitizedErrorMessage:
          "provider failure was sanitized but insufficient",

        retryable:
          false,

        summary: [
          "provider_failure_surface_sanitized",
          "provider_failure_surface_insufficient",
        ],

      },

      summary: [
        "provider_runtime_failure_intake_ready",
        "provider_failure_surface_insufficient",
      ],

    },

    summary: [
      "failure_surface_insufficient",
    ],

  };

}


function buildRecoveryIntake(): ProviderRuntimeRecoveryIntakeAssessmentResult {

  const integration =
    buildIntegration();

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
      true,

    recoveryReason:
      "PROVIDER_FAILURE_SURFACE_PRESENT",

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

    integrationSummary: [
      ...integration.summary,
    ],

    summary: [
      ...integration.summary,
      "provider_runtime_recovery_intake_assessed",
      "provider_runtime_recovery_intake_ready",
    ],

  };

}


function buildInput(
  overrides?: Partial<ProviderRuntimeFailureClassificationInput>
): ProviderRuntimeFailureClassificationInput {

  return {

    integration:
      buildIntegration(),

    verification:
      buildVerificationNotVerified(),

    failureIntake:
      buildFailureIntakeTranslated(),

    recoveryIntake:
      buildRecoveryIntake(),

    classificationDecision:
      "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    ...overrides,

  };

}


// ============================================================
// SCENARIOS
// ============================================================

function runClassificationRejectedScenario(): void {

  const result =
    classifyProviderRuntimeFailure(
      buildInput({
        classificationDecision:
          "REJECT_PROVIDER_RUNTIME_FAILURE_CLASSIFICATION",
      })
    );

  assert(
    result.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_DENIED",
    "classification rejected"
  );

  assert(
    result.classificationDenialReason ===
      "RUNTIME_FAILURE_CLASSIFICATION_NOT_ALLOWED",
    "classification rejection reason preserved"
  );

  pass("classification rejected");
  pass("classification rejection reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


function runRuntimeVerificationDeniedScenario(): void {

  const result =
    classifyProviderRuntimeFailure(
      buildInput({
        verification:
          buildVerificationDenied(),
      })
    );

  assert(
    result.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_DENIED",
    "runtime verification denied prevents classification"
  );

  assert(
    result.classificationDenialReason ===
      "RUNTIME_VERIFICATION_DENIED",
    "runtime verification denied reason preserved"
  );

  pass("runtime verification denied");
  pass("runtime verification denied reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


function runRuntimeVerifiedNotRequiredScenario(): void {

  const result =
    classifyProviderRuntimeFailure(
      buildInput({
        verification:
          buildVerificationVerified(),
        failureIntake:
          buildFailureIntakeMissingSurface(),
      })
    );

  assert(
    result.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED",
    "runtime verified classification not required"
  );

  assert(
    result.runtimeFailureClassificationNotRequired === true,
    "classification not required flag preserved"
  );

  pass("runtime verified classification not required");
  pass("classification not required flag preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


function runFailureIntakeNotTranslatedScenario(): void {

  const result =
    classifyProviderRuntimeFailure(
      buildInput({
        failureIntake:
          buildFailureIntakeNotTranslated(),
      })
    );

  assert(
    result.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_DENIED",
    "failure intake not translated denies classification"
  );

  assert(
    result.classificationDenialReason ===
      "FAILURE_INTAKE_NOT_TRANSLATED",
    "failure intake not translated reason preserved"
  );

  pass("failure intake not translated");
  pass("failure intake not translated reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


function runFailureIntakeNotReadyScenario(): void {

  const result =
    classifyProviderRuntimeFailure(
      buildInput({
        failureIntake:
          buildFailureIntakeNotReady(),
      })
    );

  assert(
    result.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_DENIED",
    "failure intake not ready denies classification"
  );

  assert(
    result.classificationDenialReason ===
      "FAILURE_INTAKE_NOT_READY",
    "failure intake not ready reason preserved"
  );

  pass("failure intake not ready");
  pass("failure intake not ready reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


function runFailureSurfaceMissingScenario(): void {

  const result =
    classifyProviderRuntimeFailure(
      buildInput({
        failureIntake:
          buildFailureIntakeMissingSurface(),
      })
    );

  assert(
    result.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_NOT_CLASSIFIED",
    "failure surface missing not classified"
  );

  assert(
    result.classificationFailureReason ===
      "FAILURE_SURFACE_MISSING",
    "failure surface missing reason preserved"
  );

  pass("failure surface missing");
  pass("failure surface missing reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


function runFailureSurfaceInsufficientScenario(): void {

  const result =
    classifyProviderRuntimeFailure(
      buildInput({
        failureIntake:
          buildFailureIntakeInsufficientSurface(),
      })
    );

  assert(
    result.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_NOT_CLASSIFIED",
    "failure surface insufficient not classified"
  );

  assert(
    result.classificationFailureReason ===
      "FAILURE_SURFACE_INSUFFICIENT",
    "failure surface insufficient reason preserved"
  );

  pass("failure surface insufficient");
  pass("failure surface insufficient reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


function runExecutionIncompleteClassifiedScenario(): void {

  const result =
    classifyProviderRuntimeFailure(
      buildInput({
        verification:
          buildVerificationNotVerified(
            "PROVIDER_EXECUTION_NOT_COMPLETED"
          ),
      })
    );

  assert(
    result.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",
    "execution incomplete classified"
  );

  assert(
    result.runtimeFailureClass ===
      "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
    "execution incomplete class preserved"
  );

  assert(
    result.runtimeFailureSeverity ===
      "MEDIUM",
    "execution incomplete severity preserved"
  );

  pass("execution incomplete classified");
  pass("execution incomplete class preserved");
  pass("execution incomplete severity preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


function runProviderAuthorizationFailureClassifiedScenario(): void {

  const result =
    classifyProviderRuntimeFailure(
      buildInput({
        verification:
          buildVerificationNotVerified(
            "PROVIDER_FAILURE_SURFACE_PRESENT"
          ),
      })
    );

  assert(
    result.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",
    "provider authorization failure classified"
  );

  assert(
    result.runtimeFailureClass ===
      "PROVIDER_AUTHORIZATION_FAILURE",
    "provider authorization class preserved"
  );

  assert(
    result.runtimeFailureSeverity ===
      "HIGH",
    "provider authorization severity preserved"
  );

  assert(
    result.retryable === false,
    "retryable signal preserved without retry decision"
  );

  pass("provider authorization failure classified");
  pass("provider authorization class preserved");
  pass("provider authorization severity preserved");
  pass("retryable signal preserved without retry decision");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runClassificationRejectedScenario();

  runRuntimeVerificationDeniedScenario();

  runRuntimeVerifiedNotRequiredScenario();

  runFailureIntakeNotTranslatedScenario();

  runFailureIntakeNotReadyScenario();

  runFailureSurfaceMissingScenario();

  runFailureSurfaceInsufficientScenario();

  runExecutionIncompleteClassifiedScenario();

  runProviderAuthorizationFailureClassifiedScenario();

  console.log("");
  console.log("========================================");
  console.log("P9M PROVIDER RUNTIME FAILURE CLASSIFICATION");
  console.log("========================================");
  console.log("");

  console.log("Scenarios:");
  console.log("✓ classification rejected");
  console.log("✓ runtime verification denied");
  console.log("✓ runtime verified → classification not required");
  console.log("✓ failure intake not translated");
  console.log("✓ failure intake not ready");
  console.log("✓ failure surface missing");
  console.log("✓ failure surface insufficient");
  console.log("✓ execution incomplete classified");
  console.log("✓ provider authorization failure classified");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime verification decision");
  console.log("✓ no retry decision");
  console.log("✓ no recovery decision");
  console.log("✓ no failover/degradation/stop decision");
  console.log("✓ no recovery execution");
  console.log("✓ no provider API / SDK call");
  console.log("✓ no re-sanitization");
  console.log("✓ no evidence / ledger / audit");

  console.log("");
  console.log("========================================");
  console.log("P9M.1 FAILURE CLASSIFICATION VERIFIED");
  console.log("========================================");

}

main();


