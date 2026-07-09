// ============================================================
// PlannerAgent — Runtime Failure Intake Translation Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime-integration/__tests__/
// P9K.provider.runtime.failure.intake.translation.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL TEST RUNNER
//
// CATEGORY
// ------------------------------------------------------------
// Provider Runtime Integration
//
// DOMAIN
// ------------------------------------------------------------
// P9K.3 — Runtime Failure Intake Translation Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify P9K.3 Runtime Failure Intake
// Translation contract.
//
// This runner verifies:
//
// 1. integration not ready
// 2. translation rejected
// 3. failure intake not required
// 4. sanitized failure surface missing
// 5. successful failure intake translation
//
// It also verifies that P9K.3 does not:
//
// - classify runtime failure
// - assign failure severity
// - decide retry
// - decide recovery
// - generate evidence
// - write ledger
// - perform audit
//
// ============================================================

import assert from "node:assert/strict";

import {
  translateProviderRuntimeFailureIntake,
} from "../P9K.provider.runtime.failure.intake.translation";

import type {
  ProviderRuntimeIntegrationResult,
} from "../P9K.provider.runtime.integration.contract";


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

    "evidenceGenerated",

    "evidenceWritten",

    "ledgerWritten",

    "auditPerformed",

    "runtimeVerified",

    "providerVerificationPassed",

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
// FIXTURES
// ============================================================

function buildIntegrationReadyWithoutFailure(): ProviderRuntimeIntegrationResult {

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
      "kms-key-001",

    providerConfigurationRef:
      "cfg/aws-kms-prod",

    providerCredentialRef:
      "cred/aws-kms-prod",

    executionMetadata: {
      tenantId: "tenant-001",
    },

    providerExecutionFacts: {

      providerCallAttempted:
        true,

      providerCallCompleted:
        true,

      providerReference:
        "aws-kms-op-001",

      providerRawStatus:
        "SUCCESS",

    },

    runtimeIntakeMaterial: {

      verificationIntake: {

        verificationIntakeReady:
          true,

        providerExecutionObserved:
          true,

        providerExecutionCompleted:
          true,

        providerReference:
          "aws-kms-op-001",

        providerRawStatus:
          "SUCCESS",

        summary: [
          "provider_runtime_verification_intake_ready",
          "provider_execution_observed",
          "provider_execution_completed",
        ],

      },

      recoveryIntake: {

        recoveryIntakeRequired:
          false,

        recoveryIntakeReady:
          false,

        recoveryReason:
          "RECOVERY_INTAKE_NOT_REQUIRED",

        summary: [
          "provider_runtime_recovery_intake_not_required",
        ],

      },

      summary: [
        "runtime_intake_material_ready",
      ],

    },

    summary: [
      "provider_runtime_integration_ready",
      "provider_runtime_intake_material_ready",
    ],

  };

}


function buildIntegrationReadyWithFailure(): ProviderRuntimeIntegrationResult {

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
      "kms-key-001",

    providerConfigurationRef:
      "cfg/aws-kms-prod",

    providerCredentialRef:
      "cred/aws-kms-prod",

    executionMetadata: {
      tenantId: "tenant-001",
    },

    providerExecutionFacts: {

      providerCallAttempted:
        true,

      providerCallCompleted:
        false,

      providerReference:
        "aws-kms-op-002",

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
          "aws-kms-op-002",

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

    ...buildIntegrationReadyWithFailure(),

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


function buildIntegrationReadyWithMissingFailureSurface(): ProviderRuntimeIntegrationResult {

  const integration =
    buildIntegrationReadyWithFailure();

  return {

    ...integration,

    runtimeIntakeMaterial: {

      verificationIntake:
        integration.runtimeIntakeMaterial!
          .verificationIntake,

      recoveryIntake:
        integration.runtimeIntakeMaterial!
          .recoveryIntake,

      summary: [
        "runtime_intake_material_ready",
        "failure_surface_removed_for_test",
      ],

    },

    summary: [
      "provider_runtime_integration_ready",
      "failure_intake_required_but_surface_missing",
    ],

  };

}


// ============================================================
// SCENARIO 1 — INTEGRATION NOT READY
// ============================================================

function runIntegrationNotReadyScenario(): void {

  const result =
    translateProviderRuntimeFailureIntake({

      integration:
        buildIntegrationNotReady(),

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  assert(
    result.failureIntakeTranslated === false,
    "integration not ready prevents failure intake translation"
  );

  assert(
    result.failureIntakeReady === false,
    "integration not ready keeps failure intake not ready"
  );

  assert(
    result.denialReason ===
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",
    "integration not ready denial reason preserved"
  );

  assert(
    result.summary.includes(
      "provider_runtime_failure_intake_not_translated"
    ),
    "integration not ready summary preserved"
  );

  pass("integration not ready");
  pass("integration not ready denial reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 2 — TRANSLATION REJECTED
// ============================================================

function runTranslationRejectedScenario(): void {

  const result =
    translateProviderRuntimeFailureIntake({

      integration:
        buildIntegrationReadyWithFailure(),

      translationDecision:
        "REJECT_PROVIDER_RUNTIME_FAILURE_INTAKE_TRANSLATION",

    });

  assert(
    result.failureIntakeTranslated === false,
    "translation rejected prevents failure intake translation"
  );

  assert(
    result.failureIntakeReady === false,
    "translation rejected keeps failure intake not ready"
  );

  assert(
    result.denialReason ===
      "FAILURE_INTAKE_TRANSLATION_NOT_ALLOWED",
    "translation rejected denial reason preserved"
  );

  assert(
    result.failureCode ===
      "PROVIDER_CALL_UNAUTHORIZED",
    "translation rejected preserves sanitized failure code"
  );

  pass("translation rejected");
  pass("translation rejected denial reason preserved");
  pass("translation rejected preserves sanitized failure context");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — FAILURE INTAKE NOT REQUIRED
// ============================================================

function runFailureIntakeNotRequiredScenario(): void {

  const result =
    translateProviderRuntimeFailureIntake({

      integration:
        buildIntegrationReadyWithoutFailure(),

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  assert(
    result.translationStatus ===
      "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_REQUIRED",
    "failure intake not required status preserved"
  );

  assert(
    result.failureIntakeRequired === false,
    "failure intake not required flag preserved"
  );

  assert(
    result.failureIntakeTranslated === false,
    "failure intake not required does not translate intake"
  );

  assert(
    result.denialReason ===
      "FAILURE_INTAKE_NOT_REQUIRED",
    "failure intake not required reason preserved"
  );

  pass("failure intake not required");
  pass("failure intake not required reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 4 — SANITIZED FAILURE SURFACE MISSING
// ============================================================

function runSanitizedFailureSurfaceMissingScenario(): void {

  const result =
    translateProviderRuntimeFailureIntake({

      integration:
        buildIntegrationReadyWithMissingFailureSurface(),

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  assert(
    result.failureIntakeRequired === true,
    "failure intake required preserved when surface missing"
  );

  assert(
    result.failureIntakeTranslated === false,
    "missing sanitized failure surface prevents translation"
  );

  assert(
    result.denialReason ===
      "SANITIZED_FAILURE_SURFACE_MISSING",
    "missing sanitized failure surface denial reason preserved"
  );

  pass("sanitized failure surface missing");
  pass("sanitized failure surface missing denial reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 5 — SUCCESSFUL FAILURE INTAKE TRANSLATION
// ============================================================

function runSuccessfulFailureIntakeTranslationScenario(): void {

  const result =
    translateProviderRuntimeFailureIntake({

      integration:
        buildIntegrationReadyWithFailure(),

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  assert(
    result.translationStatus ===
      "PROVIDER_RUNTIME_FAILURE_INTAKE_TRANSLATED",
    "successful failure intake translation status preserved"
  );

  assert(
    result.failureIntakeTranslated === true,
    "failure intake translated"
  );

  assert(
    result.failureIntakeReady === true,
    "failure intake ready"
  );

  assert(
    result.failureCode ===
      "PROVIDER_CALL_UNAUTHORIZED",
    "failure code preserved"
  );

  assert(
    result.providerRawStatus ===
      "KMS_ERROR",
    "providerRawStatus preserved"
  );

  assert(
    result.providerRawErrorCode ===
      "AccessDeniedException",
    "providerRawErrorCode preserved"
  );

  assert(
    result.providerSanitizedErrorMessage ===
      "provider authorization failed",
    "providerSanitizedErrorMessage preserved"
  );

  assert(
    result.retryable === false,
    "retryable signal preserved"
  );

  assert(
    result.failureIntake?.failureSurface.failureCode ===
      "PROVIDER_CALL_UNAUTHORIZED",
    "failure intake contains sanitized failure surface"
  );

  assert(
    result.failureIntake?.summary.includes(
      "provider_failure_not_retryable"
    ),
    "failure intake summary preserves retryable state without deciding retry"
  );

  pass("successful failure intake translation");
  pass("failure code preserved");
  pass("providerRawStatus preserved");
  pass("providerRawErrorCode preserved");
  pass("providerSanitizedErrorMessage preserved");
  pass("retryable signal preserved");
  pass("failure intake contains sanitized failure surface");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runIntegrationNotReadyScenario();

  runTranslationRejectedScenario();

  runFailureIntakeNotRequiredScenario();

  runSanitizedFailureSurfaceMissingScenario();

  runSuccessfulFailureIntakeTranslationScenario();

  console.log("");
  console.log("========================================");
  console.log("P9K RUNTIME FAILURE INTAKE TRANSLATION");
  console.log("========================================");
  console.log("");

  console.log("Scenarios:");
  console.log("✓ integration not ready");
  console.log("✓ translation rejected");
  console.log("✓ failure intake not required");
  console.log("✓ sanitized failure surface missing");
  console.log("✓ successful failure intake translation");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime failure classification");
  console.log("✓ no runtime failure severity");
  console.log("✓ no retry decision");
  console.log("✓ no recovery decision");
  console.log("✓ no evidence / ledger / audit");
  console.log("✓ no runtime verification");

  console.log("");
  console.log("========================================");
  console.log("P9K.3 FAILURE INTAKE TRANSLATION VERIFIED");
  console.log("========================================");

}

main();


