// ============================================================
// PlannerAgent — Provider Runtime Failure Classification Family Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9M.provider.runtime.family.runner.ts
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
// P9M — Provider Runtime Failure Classification Family Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9M Provider Runtime
// Failure Classification family boundary.
//
// Chain verified:
//
// P9K prepares runtime intake.
// ↓
// P9L verifies runtime outcome.
// ↓
// P9M classifies runtime failure.
//
// P9M does not decide retry.
//
// P9M does not decide recovery.
//
// P9M does not decide failover,
// degradation, stop, or escalation.
//
// P9M does not execute recovery.
//
// P9M does not write evidence,
// ledger, or audit.
//
// ============================================================

import assert from "node:assert/strict";

import {
  translateProviderRuntimeVerificationIntake,
} from "../../runtime-integration/P9K.provider.runtime.verification.intake.translation";

import {
  translateProviderRuntimeFailureIntake,
} from "../../runtime-integration/P9K.provider.runtime.failure.intake.translation";

import {
  assessProviderRuntimeRecoveryIntake,
} from "../../runtime-integration/P9K.provider.runtime.recovery.intake.assessment";

import {
  verifyProviderRuntimeOutcome,
} from "../P9L.provider.runtime.verification";

import {
  classifyProviderRuntimeFailure,
} from "../P9M.provider.runtime.failure.classification";

import type {
  ProviderRuntimeIntegrationResult,
} from "../../runtime-integration/P9K.provider.runtime.integration.contract";


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

    "retryDecision",

    "recoveryDecision",

    "recoveryDecided",

    "failoverDecision",

    "degradationDecision",

    "stopDecision",

    "escalationDecision",

    "recoveryExecuted",

    "retryExecuted",

    "failoverExecuted",

    "degradationExecuted",

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

    pass(
      `cross-layer field not exposed: ${field}`
    );

  }

}


// ============================================================
// P9K.1 FIXTURES — INTEGRATION OUTPUTS
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


function buildProviderFailureIntegration(): ProviderRuntimeIntegrationResult {

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
      "provider_runtime_recovery_intake_available",
    ],

  };

}


function buildIntegrationDenied(): ProviderRuntimeIntegrationResult {

  return {

    ...buildProviderFailureIntegration(),

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
// SCENARIO A — VERIFIED SUCCESS PATH
// ============================================================

function runVerifiedSuccessPath(): void {

  const integration =
    buildVerifiedIntegration();

  const verificationIntake =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failureIntake =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recoveryIntake =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  const runtimeVerification =
    verifyProviderRuntimeOutcome({

      integration,

      verificationIntake,

      failureIntake,

      recoveryIntake,

      verificationDecision:
        "VERIFY_PROVIDER_RUNTIME_OUTCOME",

    });

  const classification =
    classifyProviderRuntimeFailure({

      integration,

      verification:
        runtimeVerification,

      failureIntake,

      recoveryIntake,

      classificationDecision:
        "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    });

  assert(
    runtimeVerification.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFIED",
    "verified success path runtime verified"
  );

  assert(
    classification.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED",
    "verified success path classification not required"
  );

  assert(
    classification.runtimeFailureClassificationNotRequired === true,
    "classification not required flag preserved"
  );

  assert(
    classification.classificationFailureReason ===
      "RUNTIME_VERIFIED",
    "runtime verified classification reason preserved"
  );

  assert(
    classification.classificationDenialReason === undefined,
    "classification not required does not expose denial reason"
  );

  pass("verified success path");
  pass("runtime verified");
  pass("failure classification not required");
  pass("classification not required has no denial reason");

  assertNoCrossLayerFields(
    classification as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO B — PROVIDER FAILURE CLASSIFIED
// ============================================================

function runProviderFailureClassifiedPath(): void {

  const integration =
    buildProviderFailureIntegration();

  const verificationIntake =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failureIntake =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recoveryIntake =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  const runtimeVerification =
    verifyProviderRuntimeOutcome({

      integration,

      verificationIntake,

      failureIntake,

      recoveryIntake,

      verificationDecision:
        "VERIFY_PROVIDER_RUNTIME_OUTCOME",

    });

  const classification =
    classifyProviderRuntimeFailure({

      integration,

      verification:
        runtimeVerification,

      failureIntake,

      recoveryIntake,

      classificationDecision:
        "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    });

  assert(
    runtimeVerification.verificationStatus ===
      "PROVIDER_RUNTIME_NOT_VERIFIED",
    "provider failure path runtime not verified"
  );

  assert(
    runtimeVerification.verificationFailureReason ===
      "PROVIDER_EXECUTION_NOT_COMPLETED",
    "provider failure path verification reason preserved"
  );

  assert(
    classification.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",
    "provider failure path classified"
  );

  assert(
    classification.runtimeFailureClass ===
      "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
    "execution incomplete failure class preserved"
  );

  assert(
    classification.runtimeFailureSeverity ===
      "MEDIUM",
    "execution incomplete failure severity preserved"
  );

  assert(
    classification.recoveryIntakeRequired === true,
    "recovery intake requirement preserved without recovery decision"
  );

  assert(
    classification.recoveryIntakeSummary?.includes(
      "provider_runtime_recovery_intake_assessed"
    ),
    "recovery intake context preserved without recovery decision"
  );

  pass("provider failure classified path");
  pass("runtime not verified");
  pass("runtime failure classified");
  pass("execution incomplete classification preserved");
  pass("recovery context preserved without decision");

  assertNoCrossLayerFields(
    classification as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO C — AUTHORIZATION FAILURE CLASSIFIED
// ============================================================

function runAuthorizationFailureClassifiedPath(): void {

  const integration =
    buildProviderFailureIntegration();

  const adjustedIntegration:
    ProviderRuntimeIntegrationResult = {

      ...integration,

      providerExecutionFacts: {

        ...integration.providerExecutionFacts,

        providerCallCompleted:
          true,

      },

      runtimeIntakeMaterial: {

        ...integration.runtimeIntakeMaterial!,

        verificationIntake: {

          ...integration.runtimeIntakeMaterial!
            .verificationIntake,

          providerExecutionCompleted:
            true,

          summary: [
            "provider_runtime_verification_intake_ready",
            "provider_execution_observed",
            "provider_execution_completed",
          ],

        },

      },

    };

  const verificationIntake =
    translateProviderRuntimeVerificationIntake({

      integration:
        adjustedIntegration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failureIntake =
    translateProviderRuntimeFailureIntake({

      integration:
        adjustedIntegration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recoveryIntake =
    assessProviderRuntimeRecoveryIntake({

      integration:
        adjustedIntegration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  const runtimeVerification =
    verifyProviderRuntimeOutcome({

      integration:
        adjustedIntegration,

      verificationIntake,

      failureIntake,

      recoveryIntake,

      verificationDecision:
        "VERIFY_PROVIDER_RUNTIME_OUTCOME",

    });

  const classification =
    classifyProviderRuntimeFailure({

      integration:
        adjustedIntegration,

      verification:
        runtimeVerification,

      failureIntake,

      recoveryIntake,

      classificationDecision:
        "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    });

  assert(
    runtimeVerification.verificationFailureReason ===
      "PROVIDER_FAILURE_SURFACE_PRESENT",
    "authorization failure path failure surface reason preserved"
  );

  assert(
    classification.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",
    "authorization failure path classified"
  );

  assert(
    classification.runtimeFailureClass ===
      "PROVIDER_AUTHORIZATION_FAILURE",
    "authorization failure class preserved"
  );

  assert(
    classification.runtimeFailureSeverity ===
      "HIGH",
    "authorization failure severity preserved"
  );

  assert(
    classification.retryable === false,
    "retryable signal preserved without retry decision"
  );

  pass("authorization failure classified path");
  pass("failure surface present");
  pass("authorization failure class preserved");
  pass("authorization failure severity preserved");
  pass("retryable signal preserved without retry decision");

  assertNoCrossLayerFields(
    classification as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO D — INTEGRATION DENIED PATH
// ============================================================

function runIntegrationDeniedPath(): void {

  const integration =
    buildIntegrationDenied();

  const verificationIntake =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failureIntake =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recoveryIntake =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  const runtimeVerification =
    verifyProviderRuntimeOutcome({

      integration,

      verificationIntake,

      failureIntake,

      recoveryIntake,

      verificationDecision:
        "VERIFY_PROVIDER_RUNTIME_OUTCOME",

    });

  const classification =
    classifyProviderRuntimeFailure({

      integration,

      verification:
        runtimeVerification,

      failureIntake,

      recoveryIntake,

      classificationDecision:
        "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    });

  assert(
    runtimeVerification.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFICATION_DENIED",
    "integration denied runtime verification denied"
  );

  assert(
    classification.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_DENIED",
    "integration denied classification denied"
  );

  assert(
    classification.classificationDenialReason ===
      "RUNTIME_VERIFICATION_DENIED",
    "integration denied classification denial reason preserved"
  );

  pass("integration denied path");
  pass("runtime verification denied");
  pass("classification denied");

  assertNoCrossLayerFields(
    classification as unknown as Record<string, unknown>
  );

}


// ============================================================
// CONTRACT PROPAGATION
// ============================================================

function runContractPropagationChecks(): void {

  const integration =
    buildProviderFailureIntegration();

  const verificationIntake =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failureIntake =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recoveryIntake =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  const runtimeVerification =
    verifyProviderRuntimeOutcome({

      integration,

      verificationIntake,

      failureIntake,

      recoveryIntake,

      verificationDecision:
        "VERIFY_PROVIDER_RUNTIME_OUTCOME",

    });

  const classification =
    classifyProviderRuntimeFailure({

      integration,

      verification:
        runtimeVerification,

      failureIntake,

      recoveryIntake,

      classificationDecision:
        "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    });

  assert(
    classification.providerContract ===
      integration.providerContract,
    "providerContract propagated"
  );

  assert(
    classification.providerImplementation ===
      integration.providerImplementation,
    "providerImplementation propagated"
  );

  assert(
    classification.operation ===
      integration.operation,
    "operation propagated"
  );

  assert(
    classification.providerResourceId ===
      integration.providerResourceId,
    "providerResourceId propagated"
  );

  assert(
    classification.providerConfigurationRef ===
      integration.providerConfigurationRef,
    "providerConfigurationRef propagated"
  );

  assert(
    classification.providerCredentialRef ===
      integration.providerCredentialRef,
    "providerCredentialRef propagated"
  );

  assert.deepEqual(
    classification.executionMetadata,
    integration.executionMetadata,
    "executionMetadata propagated"
  );

  assert(
    classification.verificationStatus ===
      runtimeVerification.verificationStatus,
    "verificationStatus propagated"
  );

  assert(
    classification.verificationFailureReason ===
      runtimeVerification.verificationFailureReason,
    "verificationFailureReason propagated"
  );

  assert(
    classification.failureCode ===
      failureIntake.failureCode,
    "failureCode propagated"
  );

  assert(
    classification.providerRawStatus ===
      failureIntake.providerRawStatus,
    "providerRawStatus propagated"
  );

  assert(
    classification.providerRawErrorCode ===
      failureIntake.providerRawErrorCode,
    "providerRawErrorCode propagated"
  );

  assert(
    classification.providerSanitizedErrorMessage ===
      failureIntake.providerSanitizedErrorMessage,
    "providerSanitizedErrorMessage propagated"
  );

  pass("providerContract propagated");
  pass("providerImplementation propagated");
  pass("operation propagated");
  pass("resource/config/credential refs propagated");
  pass("executionMetadata propagated");
  pass("verification status/failure reason propagated");
  pass("failure intake context propagated");

}


// ============================================================
// SUMMARY PROPAGATION
// ============================================================

function runSummaryPropagationChecks(): void {

  const integration =
    buildProviderFailureIntegration();

  const verificationIntake =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failureIntake =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recoveryIntake =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  const runtimeVerification =
    verifyProviderRuntimeOutcome({

      integration,

      verificationIntake,

      failureIntake,

      recoveryIntake,

      verificationDecision:
        "VERIFY_PROVIDER_RUNTIME_OUTCOME",

    });

  const classification =
    classifyProviderRuntimeFailure({

      integration,

      verification:
        runtimeVerification,

      failureIntake,

      recoveryIntake,

      classificationDecision:
        "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    });

  assert(
    classification.integrationSummary.includes(
      "provider_runtime_integration_ready"
    ),
    "integration summary propagated"
  );

  assert(
    classification.verificationSummary.includes(
      "provider_runtime_verification_failed"
    ),
    "verification summary propagated"
  );

  assert(
    classification.failureIntakeSummary.includes(
      "provider_runtime_failure_intake_translated"
    ),
    "failure intake summary propagated"
  );

  assert(
    classification.recoveryIntakeSummary?.includes(
      "provider_runtime_recovery_intake_assessed"
    ),
    "recovery intake summary propagated"
  );

  assert(
    classification.summary.includes(
      "provider_runtime_failure_classified"
    ),
    "classification terminal summary preserved"
  );

  pass("integration summary propagated");
  pass("verification summary propagated");
  pass("failure intake summary propagated");
  pass("recovery intake summary propagated");
  pass("classification terminal summary preserved");

}


// ============================================================
// BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const integration =
    buildProviderFailureIntegration();

  const verificationIntake =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failureIntake =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recoveryIntake =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  const runtimeVerification =
    verifyProviderRuntimeOutcome({

      integration,

      verificationIntake,

      failureIntake,

      recoveryIntake,

      verificationDecision:
        "VERIFY_PROVIDER_RUNTIME_OUTCOME",

    });

  const classification =
    classifyProviderRuntimeFailure({

      integration,

      verification:
        runtimeVerification,

      failureIntake,

      recoveryIntake,

      classificationDecision:
        "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    });

  assertNoCrossLayerFields(
    classification as unknown as Record<string, unknown>
  );

  pass("boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runVerifiedSuccessPath();

  runProviderFailureClassifiedPath();

  runAuthorizationFailureClassifiedPath();

  runIntegrationDeniedPath();

  runContractPropagationChecks();

  runSummaryPropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9M PROVIDER RUNTIME FAILURE CLASSIFICATION FAMILY");
  console.log("========================================");
  console.log("");

  console.log("Scenario A — Verified Success Path:");
  console.log("✓ runtime verified");
  console.log("✓ failure classification not required");
  console.log("✓ no classification denial reason");

  console.log("");
  console.log("Scenario B — Provider Failure Path:");
  console.log("✓ runtime not verified");
  console.log("✓ runtime failure classified");
  console.log("✓ execution incomplete classification preserved");
  console.log("✓ recovery context preserved without recovery decision");

  console.log("");
  console.log("Scenario C — Authorization Failure Path:");
  console.log("✓ failure surface present");
  console.log("✓ authorization failure classified");
  console.log("✓ retryable signal preserved without retry decision");

  console.log("");
  console.log("Scenario D — Integration Denied Path:");
  console.log("✓ runtime verification denied");
  console.log("✓ classification denied");

  console.log("");
  console.log("Contract Propagation:");
  console.log("✓ providerContract");
  console.log("✓ providerImplementation");
  console.log("✓ operation");
  console.log("✓ resource/config/credential refs");
  console.log("✓ executionMetadata");
  console.log("✓ verification status / failure reason");
  console.log("✓ failure intake context");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no retry decision");
  console.log("✓ no recovery decision");
  console.log("✓ no failover/degradation/stop decision");
  console.log("✓ no recovery execution");
  console.log("✓ no provider API / SDK call");
  console.log("✓ no re-sanitization");
  console.log("✓ no evidence / ledger / audit");

  console.log("");
  console.log("========================================");
  console.log("P9M PROVIDER RUNTIME FAILURE CLASSIFICATION FAMILY VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();
