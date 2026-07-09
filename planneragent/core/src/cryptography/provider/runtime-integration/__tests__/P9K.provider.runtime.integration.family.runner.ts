// ============================================================
// PlannerAgent — Provider Runtime Integration Family Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime-integration/__tests__/
// P9K.provider.runtime.integration.family.runner.ts
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
// P9K.5 — Provider Runtime Integration Family Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9K Provider Runtime
// Integration family as a complete
// architectural chain:
//
// P9K.1 Integration Assessment
// ↓
// P9K.2 Verification Intake Translation
// ↓
// P9K.3 Failure Intake Translation
// ↓
// P9K.4 Recovery Intake Assessment
//
// This runner verifies:
//
// Scenario A — success path
// - verification intake ready
// - failure intake not required
// - recovery intake not required
//
// Scenario B — provider failure path
// - verification intake ready
// - failure intake ready
// - recovery intake ready
//
// Scenario C — integration denied path
// - no verification intake
// - no failure intake
// - no recovery intake
//
// It also verifies:
//
// - contract propagation
// - summary propagation
// - boundary preservation
// - no runtime verification
// - no runtime failure classification
// - no recovery decision
// - no evidence / ledger / audit
//
// ============================================================

import assert from "node:assert/strict";

import {
  translateProviderRuntimeVerificationIntake,
} from "../P9K.provider.runtime.verification.intake.translation";

import {
  translateProviderRuntimeFailureIntake,
} from "../P9K.provider.runtime.failure.intake.translation";

import {
  assessProviderRuntimeRecoveryIntake,
} from "../P9K.provider.runtime.recovery.intake.assessment";

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

    "runtimeVerified",

    "providerVerificationPassed",

    "runtimeSuccess",

    "runtimeFailure",

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
// FIXTURES — P9K.1 INTEGRATION OUTPUTS
// ============================================================

function buildSuccessIntegration(): ProviderRuntimeIntegrationResult {

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
      rotationBatchId: "batch-success",
    },

    providerExecutionFacts: {

      providerCallAttempted:
        true,

      providerCallCompleted:
        true,

      providerReference:
        "aws-kms-op-success-001",

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
      "kms-key-002",

    providerConfigurationRef:
      "cfg/aws-kms-prod",

    providerCredentialRef:
      "cred/aws-kms-prod",

    executionMetadata: {
      tenantId: "tenant-001",
      rotationBatchId: "batch-failure",
    },

    providerExecutionFacts: {

      providerCallAttempted:
        true,

      providerCallCompleted:
        false,

      providerReference:
        "aws-kms-op-failure-001",

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
          "aws-kms-op-failure-001",

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


function buildDeniedIntegration(): ProviderRuntimeIntegrationResult {

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
// SCENARIO A — SUCCESS PATH
// ============================================================

function runSuccessPathScenario(): void {

  const integration =
    buildSuccessIntegration();

  const verification =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failure =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recovery =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  assert(
    verification.verificationIntakeReady === true,
    "success path verification intake ready"
  );

  assert(
    verification.providerExecutionObserved === true,
    "success path provider execution observed"
  );

  assert(
    verification.providerExecutionCompleted === true,
    "success path provider execution completed"
  );

  assert(
    failure.translationStatus ===
      "PROVIDER_RUNTIME_FAILURE_INTAKE_NOT_REQUIRED",
    "success path failure intake not required"
  );

  assert(
    failure.failureIntakeReady === false,
    "success path failure intake not ready"
  );

  assert(
    recovery.assessmentStatus ===
      "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_REQUIRED",
    "success path recovery intake not required"
  );

  assert(
    recovery.recoveryIntakeReady === false,
    "success path recovery intake not ready"
  );

  pass("success path verification intake ready");
  pass("success path failure intake not required");
  pass("success path recovery intake not required");

  assertNoCrossLayerFields(
    verification as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    failure as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    recovery as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO B — PROVIDER FAILURE PATH
// ============================================================

function runProviderFailurePathScenario(): void {

  const integration =
    buildFailureIntegration();

  const verification =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failure =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recovery =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  assert(
    verification.verificationIntakeReady === true,
    "failure path verification intake ready"
  );

  assert(
    verification.providerExecutionObserved === true,
    "failure path provider execution observed"
  );

  assert(
    verification.providerExecutionCompleted === false,
    "failure path provider execution not completed"
  );

  assert(
    failure.failureIntakeReady === true,
    "failure path failure intake ready"
  );

  assert(
    failure.failureCode ===
      "PROVIDER_CALL_UNAUTHORIZED",
    "failure path failure code preserved"
  );

  assert(
    failure.providerSanitizedErrorMessage ===
      "provider authorization failed",
    "failure path sanitized message preserved"
  );

  assert(
    failure.retryable === false,
    "failure path retryable signal preserved without retry decision"
  );

  assert(
    recovery.recoveryIntakeAssessed === true,
    "failure path recovery intake assessed"
  );

  assert(
    recovery.recoveryIntakeReady === true,
    "failure path recovery intake ready"
  );

  assert(
    recovery.recoveryReason ===
      "PROVIDER_FAILURE_SURFACE_PRESENT",
    "failure path recovery reason preserved"
  );

  pass("failure path verification intake ready");
  pass("failure path failure intake ready");
  pass("failure path recovery intake ready");
  pass("failure path sanitized failure context preserved");

  assertNoCrossLayerFields(
    verification as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    failure as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    recovery as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO C — INTEGRATION DENIED PATH
// ============================================================

function runIntegrationDeniedPathScenario(): void {

  const integration =
    buildDeniedIntegration();

  const verification =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failure =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recovery =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  assert(
    verification.verificationIntakeTranslated === false,
    "integration denied prevents verification intake translation"
  );

  assert(
    verification.verificationIntakeReady === false,
    "integration denied keeps verification intake not ready"
  );

  assert(
    verification.denialReason ===
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",
    "integration denied verification denial reason preserved"
  );

  assert(
    failure.failureIntakeTranslated === false,
    "integration denied prevents failure intake translation"
  );

  assert(
    failure.failureIntakeReady === false,
    "integration denied keeps failure intake not ready"
  );

  assert(
    failure.denialReason ===
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",
    "integration denied failure denial reason preserved"
  );

  assert(
    recovery.recoveryIntakeAssessed === false,
    "integration denied prevents recovery intake assessment"
  );

  assert(
    recovery.recoveryIntakeReady === false,
    "integration denied keeps recovery intake not ready"
  );

  assert(
    recovery.denialReason ===
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",
    "integration denied recovery denial reason preserved"
  );

  pass("integration denied prevents verification intake");
  pass("integration denied prevents failure intake");
  pass("integration denied prevents recovery intake");

  assertNoCrossLayerFields(
    verification as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    failure as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    recovery as unknown as Record<string, unknown>
  );

}


// ============================================================
// CONTRACT PROPAGATION
// ============================================================

function runContractPropagationChecks(): void {

  const integration =
    buildFailureIntegration();

  const verification =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failure =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recovery =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  assert(
    verification.providerContract ===
      integration.providerContract,
    "providerContract propagated to verification intake"
  );

  assert(
    failure.providerImplementation ===
      integration.providerImplementation,
    "providerImplementation propagated to failure intake"
  );

  assert(
    recovery.operation ===
      integration.operation,
    "operation propagated to recovery intake"
  );

  assert(
    verification.providerResourceId ===
      integration.providerResourceId,
    "providerResourceId propagated"
  );

  assert(
    failure.providerConfigurationRef ===
      integration.providerConfigurationRef,
    "providerConfigurationRef propagated"
  );

  assert(
    recovery.providerCredentialRef ===
      integration.providerCredentialRef,
    "providerCredentialRef propagated"
  );

  assert(
    verification.providerReference ===
      integration.providerExecutionFacts.providerReference,
    "providerReference propagated to verification intake"
  );

  assert(
    failure.providerRawStatus ===
      integration.runtimeIntakeMaterial
        ?.failureIntake
        ?.failureSurface
        .providerRawStatus,
    "providerRawStatus propagated to failure intake"
  );

  assert(
    recovery.recoveryReason ===
      integration.runtimeIntakeMaterial
        ?.recoveryIntake
        .recoveryReason,
    "recoveryReason propagated to recovery intake"
  );

  pass("providerContract propagated");
  pass("providerImplementation propagated");
  pass("operation propagated");
  pass("resource/config/credential refs propagated");
  pass("providerReference propagated");
  pass("providerRawStatus propagated");
  pass("recoveryReason propagated");

}


// ============================================================
// SUMMARY PROPAGATION
// ============================================================

function runSummaryPropagationChecks(): void {

  const integration =
    buildFailureIntegration();

  const verification =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failure =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recovery =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  assert(
    verification.integrationSummary.includes(
      "provider_runtime_integration_ready"
    ),
    "integration summary propagated to verification intake"
  );

  assert(
    failure.integrationSummary.includes(
      "provider_runtime_failure_surface_available"
    ),
    "integration summary propagated to failure intake"
  );

  assert(
    recovery.integrationSummary.includes(
      "provider_runtime_recovery_intake_available"
    ),
    "integration summary propagated to recovery intake"
  );

  assert(
    verification.summary.includes(
      "provider_runtime_verification_intake_translated"
    ),
    "verification translation summary preserved"
  );

  assert(
    failure.summary.includes(
      "provider_runtime_failure_intake_translated"
    ),
    "failure translation summary preserved"
  );

  assert(
    recovery.summary.includes(
      "provider_runtime_recovery_intake_assessed"
    ),
    "recovery assessment summary preserved"
  );

  pass("integration summary propagated to verification intake");
  pass("integration summary propagated to failure intake");
  pass("integration summary propagated to recovery intake");
  pass("P9K translation summaries preserved");

}


// ============================================================
// BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const integration =
    buildFailureIntegration();

  const verification =
    translateProviderRuntimeVerificationIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE",

    });

  const failure =
    translateProviderRuntimeFailureIntake({

      integration,

      translationDecision:
        "TRANSLATE_PROVIDER_RUNTIME_FAILURE_INTAKE",

    });

  const recovery =
    assessProviderRuntimeRecoveryIntake({

      integration,

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  assertNoCrossLayerFields(
    verification as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    failure as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    recovery as unknown as Record<string, unknown>
  );

  pass("boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runSuccessPathScenario();

  runProviderFailurePathScenario();

  runIntegrationDeniedPathScenario();

  runContractPropagationChecks();

  runSummaryPropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9K PROVIDER RUNTIME INTEGRATION FAMILY");
  console.log("========================================");
  console.log("");

  console.log("Scenario A — Success Path:");
  console.log("✓ verification intake ready");
  console.log("✓ failure intake not required");
  console.log("✓ recovery intake not required");

  console.log("");
  console.log("Scenario B — Provider Failure Path:");
  console.log("✓ verification intake ready");
  console.log("✓ failure intake ready");
  console.log("✓ recovery intake ready");
  console.log("✓ sanitized provider failure preserved");

  console.log("");
  console.log("Scenario C — Integration Denied Path:");
  console.log("✓ no verification intake");
  console.log("✓ no failure intake");
  console.log("✓ no recovery intake");

  console.log("");
  console.log("Contract Propagation:");
  console.log("✓ providerContract");
  console.log("✓ providerImplementation");
  console.log("✓ operation");
  console.log("✓ resource/config/credential refs");
  console.log("✓ providerReference / raw status");
  console.log("✓ recoveryReason");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime verification");
  console.log("✓ no runtime failure classification");
  console.log("✓ no recovery decision");
  console.log("✓ no evidence / ledger / audit");
  console.log("✓ no provider API / SDK call");
  console.log("✓ no re-sanitization");

  console.log("");
  console.log("========================================");
  console.log("P9K PROVIDER RUNTIME INTEGRATION FAMILY VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();


