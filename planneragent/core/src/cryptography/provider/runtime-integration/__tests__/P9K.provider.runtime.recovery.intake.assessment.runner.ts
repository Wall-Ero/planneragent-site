// ============================================================
// PlannerAgent — Runtime Recovery Intake Assessment Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime-integration/__tests__/
// P9K.provider.runtime.recovery.intake.assessment.runner.ts
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
// P9K.4 — Runtime Recovery Intake Assessment Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify P9K.4 Runtime Recovery Intake
// Assessment contract.
//
// This runner verifies:
//
// 1. integration not ready
// 2. assessment rejected
// 3. recovery intake not required
// 4. recovery intake material missing
// 5. successful recovery intake assessment
//
// It also verifies that P9K.4 does not:
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
//
// ============================================================

import assert from "node:assert/strict";

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

    "recoveryDecided",

    "retryDecision",

    "failoverDecision",

    "degradationDecision",

    "stopDecision",

    "runtimeFailureClassified",

    "runtimeFailureSeverity",

    "runtimeVerified",

    "providerVerificationPassed",

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
// FIXTURES
// ============================================================

function buildIntegrationReadyWithoutRecovery(): ProviderRuntimeIntegrationResult {

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


function buildIntegrationReadyWithRecovery(): ProviderRuntimeIntegrationResult {

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
      "provider_runtime_recovery_intake_available",
    ],

  };

}


function buildIntegrationNotReady(): ProviderRuntimeIntegrationResult {

  return {

    ...buildIntegrationReadyWithRecovery(),

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


function buildIntegrationReadyWithMissingRecoveryIntake(): ProviderRuntimeIntegrationResult {

  const integration =
    buildIntegrationReadyWithRecovery();

  return {

    ...integration,

    runtimeIntakeMaterial: {

      verificationIntake:
        integration.runtimeIntakeMaterial!
          .verificationIntake,

      failureIntake:
        integration.runtimeIntakeMaterial!
          .failureIntake,

      recoveryIntake:
        undefined as never,

      summary: [
        "runtime_intake_material_ready",
        "recovery_intake_removed_for_test",
      ],

    },

    summary: [
      "provider_runtime_integration_ready",
      "recovery_intake_required_but_material_missing",
    ],

  };

}


// ============================================================
// SCENARIO 1 — INTEGRATION NOT READY
// ============================================================

function runIntegrationNotReadyScenario(): void {

  const result =
    assessProviderRuntimeRecoveryIntake({

      integration:
        buildIntegrationNotReady(),

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  assert(
    result.recoveryIntakeAssessed === false,
    "integration not ready prevents recovery intake assessment"
  );

  assert(
    result.recoveryIntakeReady === false,
    "integration not ready keeps recovery intake not ready"
  );

  assert(
    result.denialReason ===
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",
    "integration not ready denial reason preserved"
  );

  assert(
    result.summary.includes(
      "provider_runtime_recovery_intake_not_assessed"
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
// SCENARIO 2 — ASSESSMENT REJECTED
// ============================================================

function runAssessmentRejectedScenario(): void {

  const result =
    assessProviderRuntimeRecoveryIntake({

      integration:
        buildIntegrationReadyWithRecovery(),

      assessmentDecision:
        "REJECT_PROVIDER_RUNTIME_RECOVERY_INTAKE_ASSESSMENT",

    });

  assert(
    result.recoveryIntakeAssessed === false,
    "assessment rejected prevents recovery intake assessment"
  );

  assert(
    result.recoveryIntakeReady === false,
    "assessment rejected keeps recovery intake not ready"
  );

  assert(
    result.denialReason ===
      "RECOVERY_INTAKE_ASSESSMENT_NOT_ALLOWED",
    "assessment rejected denial reason preserved"
  );

  assert(
    result.recoveryReason ===
      "PROVIDER_FAILURE_SURFACE_PRESENT",
    "assessment rejected preserves recovery reason"
  );

  pass("assessment rejected");
  pass("assessment rejected denial reason preserved");
  pass("assessment rejected preserves recovery context");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — RECOVERY INTAKE NOT REQUIRED
// ============================================================

function runRecoveryIntakeNotRequiredScenario(): void {

  const result =
    assessProviderRuntimeRecoveryIntake({

      integration:
        buildIntegrationReadyWithoutRecovery(),

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  assert(
    result.assessmentStatus ===
      "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_REQUIRED",
    "recovery intake not required status preserved"
  );

  assert(
    result.recoveryIntakeRequired === false,
    "recovery intake not required flag preserved"
  );

  assert(
    result.recoveryIntakeAssessed === false,
    "recovery intake not required does not assess recovery intake"
  );

  assert(
    result.denialReason ===
      "RECOVERY_INTAKE_NOT_REQUIRED",
    "recovery intake not required reason preserved"
  );

  pass("recovery intake not required");
  pass("recovery intake not required reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 4 — RECOVERY INTAKE MATERIAL MISSING
// ============================================================

function runRecoveryIntakeMaterialMissingScenario(): void {

  const result =
    assessProviderRuntimeRecoveryIntake({

      integration:
        buildIntegrationReadyWithMissingRecoveryIntake(),

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  assert(
    result.recoveryIntakeRequired === true,
    "recovery intake required preserved when material missing"
  );

  assert(
    result.recoveryIntakeAssessed === false,
    "missing recovery intake material prevents assessment"
  );

  assert(
    result.denialReason ===
      "RECOVERY_INTAKE_MATERIAL_MISSING",
    "missing recovery intake material denial reason preserved"
  );

  pass("recovery intake material missing");
  pass("recovery intake material missing denial reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 5 — SUCCESSFUL RECOVERY INTAKE ASSESSMENT
// ============================================================

function runSuccessfulRecoveryIntakeAssessmentScenario(): void {

  const result =
    assessProviderRuntimeRecoveryIntake({

      integration:
        buildIntegrationReadyWithRecovery(),

      assessmentDecision:
        "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    });

  assert(
    result.assessmentStatus ===
      "PROVIDER_RUNTIME_RECOVERY_INTAKE_ASSESSED",
    "successful recovery intake assessment status preserved"
  );

  assert(
    result.recoveryIntakeAssessed === true,
    "recovery intake assessed"
  );

  assert(
    result.recoveryIntakeRequired === true,
    "recovery intake required preserved"
  );

  assert(
    result.recoveryIntakeReady === true,
    "recovery intake ready"
  );

  assert(
    result.recoveryReason ===
      "PROVIDER_FAILURE_SURFACE_PRESENT",
    "recovery reason preserved"
  );

  assert(
    result.recoveryIntake?.recoveryIntakeReady === true,
    "recovery intake material preserved"
  );

  assert(
    result.recoveryIntake?.summary.includes(
      "provider_runtime_recovery_intake_ready"
    ),
    "recovery intake summary preserved"
  );

  pass("successful recovery intake assessment");
  pass("recovery intake required preserved");
  pass("recovery intake ready");
  pass("recovery reason preserved");
  pass("recovery intake material preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runIntegrationNotReadyScenario();

  runAssessmentRejectedScenario();

  runRecoveryIntakeNotRequiredScenario();

  runRecoveryIntakeMaterialMissingScenario();

  runSuccessfulRecoveryIntakeAssessmentScenario();

  console.log("");
  console.log("========================================");
  console.log("P9K RUNTIME RECOVERY INTAKE ASSESSMENT");
  console.log("========================================");
  console.log("");

  console.log("Scenarios:");
  console.log("✓ integration not ready");
  console.log("✓ assessment rejected");
  console.log("✓ recovery intake not required");
  console.log("✓ recovery intake material missing");
  console.log("✓ successful recovery intake assessment");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no recovery decision");
  console.log("✓ no retry decision");
  console.log("✓ no failover/degradation/stop decision");
  console.log("✓ no runtime failure classification");
  console.log("✓ no runtime verification");
  console.log("✓ no evidence / ledger / audit");

  console.log("");
  console.log("========================================");
  console.log("P9K.4 RECOVERY INTAKE ASSESSMENT VERIFIED");
  console.log("========================================");

}

main();


