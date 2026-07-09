// ============================================================
// PlannerAgent — Provider Runtime Family Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9L.provider.runtime.family.runner.ts
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
// P9L — Provider Runtime Family Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify the runtime family boundary:
//
// P9K prepares runtime intake.
// P9L verifies runtime outcome.
// P9L does not classify failure.
// P9L does not decide recovery.
//
// Chain verified:
//
// P9K.1 Integration Assessment
// ↓
// P9K.2 Verification Intake Translation
// ↓
// P9K.3 Failure Intake Translation
// ↓
// P9K.4 Recovery Intake Assessment
// ↓
// P9L.1 Provider Runtime Verification
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
// P9K.1 FIXTURES — INTEGRATION ASSESSMENT OUTPUTS
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

  assert(
    verificationIntake.verificationIntakeReady === true,
    "success path verification intake ready"
  );

  assert(
    failureIntake.translationStatus ===
      "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_REQUIRED",
    "success path failure intake not required"
  );

  assert(
    recoveryIntake.assessmentStatus ===
      "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_REQUIRED",
    "success path recovery intake not required"
  );

  assert(
    runtimeVerification.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFIED",
    "success path runtime verified"
  );

  assert(
    runtimeVerification.runtimeVerified === true,
    "success path runtime verified flag preserved"
  );

  assert(
    runtimeVerification.summary.includes(
      "provider_runtime_verified"
    ),
    "success path terminal verification summary preserved"
  );

  pass("verified success path");
  pass("verification intake ready");
  pass("failure intake not required");
  pass("recovery intake not required");
  pass("runtime verified");

  assertNoCrossLayerFields(
    runtimeVerification as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO B — PROVIDER FAILURE PATH
// ============================================================

function runProviderFailurePath(): void {

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

  assert(
    verificationIntake.verificationIntakeReady === true,
    "failure path verification intake ready"
  );

  assert(
    failureIntake.failureIntakeReady === true,
    "failure path failure intake ready"
  );

  assert(
    recoveryIntake.recoveryIntakeReady === true,
    "failure path recovery intake ready"
  );

  assert(
    runtimeVerification.verificationStatus ===
      "PROVIDER_RUNTIME_NOT_VERIFIED",
    "failure path runtime not verified"
  );

  assert(
    runtimeVerification.verificationFailureReason ===
      "PROVIDER_EXECUTION_NOT_COMPLETED",
    "execution not completed priority preserved"
  );

  assert(
    runtimeVerification.failureSurfacePresent === true,
    "failure surface presence preserved"
  );

  assert(
    runtimeVerification.recoveryIntakeRequired === true,
    "failure path recovery intake requirement preserved"
  );

  assert(
    runtimeVerification.recoveryIntakeSummary?.includes(
      "provider_runtime_recovery_intake_assessed"
    ),
    "failure path recovery context preserved without recovery decision"
  );

  assert(
    runtimeVerification.summary.includes(
      "provider_runtime_verification_failed"
    ),
    "failure path terminal verification summary preserved"
  );

  assert(
    runtimeVerification.summary.includes(
      "provider_execution_not_completed"
    ),
    "verification failure summary token preserved"
  );

  assert(
    !("runtimeFailureClassified" in runtimeVerification),
    "failure path does not classify runtime failure"
  );

  assert(
    !("recoveryDecision" in runtimeVerification),
    "failure path does not decide recovery"
  );

  pass("provider failure path");
  pass("verification intake ready");
  pass("failure intake ready");
  pass("recovery intake ready");
  pass("runtime not verified");
  pass("verification failure priority preserved");
  pass("recovery context preserved without recovery decision");

  assertNoCrossLayerFields(
    runtimeVerification as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO C — INTEGRATION DENIED PATH
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

  assert(
    verificationIntake.verificationIntakeReady === false,
    "integration denied prevents verification intake"
  );

  assert(
    verificationIntake.translationStatus ===
      "PROVIDER_RUNTIME_VERIFICATION_INTAKE_NOT_TRANSLATED",
    "integration denied verification intake status preserved"
  );

  assert(
    verificationIntake.denialReason ===
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",
    "integration denied verification intake denial reason preserved"
  );

  assert(
    failureIntake.failureIntakeReady === false,
    "integration denied prevents failure intake"
  );

  assert(
    failureIntake.translationStatus ===
      "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_TRANSLATED",
    "integration denied failure intake status preserved"
  );

  assert(
    failureIntake.denialReason ===
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",
    "integration denied failure intake denial reason preserved"
  );

  assert(
    recoveryIntake.recoveryIntakeReady === false,
    "integration denied prevents recovery intake"
  );

  assert(
    recoveryIntake.assessmentStatus ===
      "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_ASSESSED",
    "integration denied recovery intake status preserved"
  );

  assert(
    recoveryIntake.denialReason ===
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",
    "integration denied recovery intake denial reason preserved"
  );

  assert(
    runtimeVerification.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFICATION_DENIED",
    "integration denied causes verification denied"
  );

  assert(
    runtimeVerification.runtimeVerificationAttempted === false,
    "integration denied prevents runtime verification attempt"
  );

  assert(
    runtimeVerification.verificationDenialReason ===
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",
    "integration denied reason preserved"
  );

  pass("integration denied path");
  pass("no verification intake");
  pass("verification intake denial propagated");
  pass("no failure intake");
  pass("failure intake denial propagated");
  pass("no recovery intake");
  pass("recovery intake denial propagated");
  pass("runtime verification denied");

  assertNoCrossLayerFields(
    runtimeVerification as unknown as Record<string, unknown>
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

  assert(
    runtimeVerification.providerContract ===
      integration.providerContract,
    "providerContract propagated"
  );

  assert(
    runtimeVerification.providerImplementation ===
      integration.providerImplementation,
    "providerImplementation propagated"
  );

  assert(
    runtimeVerification.operation ===
      integration.operation,
    "operation propagated"
  );

  assert(
    runtimeVerification.providerResourceId ===
      integration.providerResourceId,
    "providerResourceId propagated"
  );

  assert(
    runtimeVerification.providerConfigurationRef ===
      integration.providerConfigurationRef,
    "providerConfigurationRef propagated"
  );

  assert(
    runtimeVerification.providerCredentialRef ===
      integration.providerCredentialRef,
    "providerCredentialRef propagated"
  );

  assert.deepEqual(
    runtimeVerification.executionMetadata,
    integration.executionMetadata,
    "executionMetadata propagated"
  );

  assert(
    runtimeVerification.providerReference ===
      integration.providerExecutionFacts.providerReference,
    "providerReference propagated"
  );

  assert(
    runtimeVerification.providerRawStatus ===
      integration.providerExecutionFacts.providerRawStatus,
    "providerRawStatus propagated"
  );

  assert(
    runtimeVerification.providerRawErrorCode ===
      integration.providerExecutionFacts.providerRawErrorCode,
    "providerRawErrorCode propagated"
  );

  pass("providerContract propagated");
  pass("providerImplementation propagated");
  pass("operation propagated");
  pass("resource/config/credential refs propagated");
  pass("executionMetadata propagated");
  pass("providerReference/raw status/error code propagated");

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

  assert(
    runtimeVerification.integrationSummary.includes(
      "provider_runtime_integration_ready"
    ),
    "integration summary propagated"
  );

  assert(
    runtimeVerification.verificationIntakeSummary.includes(
      "provider_runtime_verification_intake_translated"
    ),
    "verification intake summary propagated"
  );

  assert(
    runtimeVerification.failureIntakeSummary.includes(
      "provider_runtime_failure_intake_translated"
    ),
    "failure intake summary propagated"
  );

  assert(
    runtimeVerification.recoveryIntakeSummary?.includes(
      "provider_runtime_recovery_intake_assessed"
    ),
    "recovery intake summary propagated"
  );

  assert(
    runtimeVerification.summary.includes(
      "provider_runtime_verification_failed"
    ) ||
      runtimeVerification.summary.includes(
        "provider_runtime_verified"
      ),
    "runtime verification terminal summary preserved"
  );

  assert(
    runtimeVerification.summary.includes(
      "provider_execution_not_completed"
    ),
    "verification failure summary token preserved"
  );

  pass("integration summary propagated");
  pass("verification intake summary propagated");
  pass("failure intake summary propagated");
  pass("recovery intake summary propagated");
  pass("runtime verification terminal summary preserved");

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

  assertNoCrossLayerFields(
    runtimeVerification as unknown as Record<string, unknown>
  );

  pass("boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runVerifiedSuccessPath();

  runProviderFailurePath();

  runIntegrationDeniedPath();

  runContractPropagationChecks();

  runSummaryPropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9L PROVIDER RUNTIME FAMILY");
  console.log("========================================");
  console.log("");

  console.log("Scenario A — Verified Success Path:");
  console.log("✓ verification intake ready");
  console.log("✓ failure intake not required");
  console.log("✓ recovery intake not required");
  console.log("✓ runtime verified");

  console.log("");
  console.log("Scenario B — Provider Failure Path:");
  console.log("✓ verification intake ready");
  console.log("✓ failure intake ready");
  console.log("✓ recovery intake ready");
  console.log("✓ runtime not verified");
  console.log("✓ verification failure priority preserved");
  console.log("✓ recovery context preserved without recovery decision");

  console.log("");
  console.log("Scenario C — Integration Denied Path:");
  console.log("✓ no verification intake");
  console.log("✓ verification intake denial propagated");
  console.log("✓ no failure intake");
  console.log("✓ failure intake denial propagated");
  console.log("✓ no recovery intake");
  console.log("✓ recovery intake denial propagated");
  console.log("✓ runtime verification denied");

  console.log("");
  console.log("Contract Propagation:");
  console.log("✓ providerContract");
  console.log("✓ providerImplementation");
  console.log("✓ operation");
  console.log("✓ resource/config/credential refs");
  console.log("✓ executionMetadata");
  console.log("✓ providerReference / raw status / raw error code");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime failure classification");
  console.log("✓ no runtime failure severity");
  console.log("✓ no recovery decision");
  console.log("✓ no retry/failover/degradation/stop decision");
  console.log("✓ no evidence / ledger / audit");
  console.log("✓ no provider API / SDK call");
  console.log("✓ no re-sanitization");

  console.log("");
  console.log("========================================");
  console.log("P9L PROVIDER RUNTIME FAMILY VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();


