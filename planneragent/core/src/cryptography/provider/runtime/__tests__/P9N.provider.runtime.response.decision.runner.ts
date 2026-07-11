// ============================================================
// PlannerAgent — Provider Runtime Response Decision Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9N.provider.runtime.response.decision.runner.ts
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
// P9N.1 — Provider Runtime Response Decision Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify P9N.1 Provider Runtime Response
// Decision contract.
//
// This runner verifies:
//
// 1. response decision rejected
// 2. runtime verification denied
// 3. failure classification denied
// 4. verified runtime → NO_ACTION
// 5. failure not classified → NOT_DECIDED
// 6. incoherent classification → NOT_DECIDED
// 7. timeout + retryable true → RETRY
// 8. timeout + retryable false → ESCALATE
// 9. timeout + retryable absent → ESCALATE
// 10. execution incomplete + recovery ready → RECOVER
// 11. execution incomplete + recovery not ready → ESCALATE
// 12. unavailable + recovery ready → FAILOVER
// 13. unavailable + recovery not ready → ESCALATE
// 14. authorization / authentication / unknown → ESCALATE
// 15. configuration / invalid request / contract → STOP
// 16. verified runtime + classified failure incoherence
// 17. verification status mismatch
// 18. verification failure reason mismatch
// 19. runtime context mismatch
// 20. verification/classification recovery requirement mismatch
// 21. recovery intake context mismatch
// 22. dependency failure mapping
// 23. rate-limit failure mapping
// 24. recovery intake absent
// 25. recovery-intake declared requirement mismatch
// 26. context propagation
// 27. boundary verification
//
// P9N decides response posture.
//
// P9N does not verify runtime.
//
// P9N does not classify runtime failure.
//
// P9N does not execute the selected
// response.
//
// ============================================================

import assert from "node:assert/strict";

import {
  decideProviderRuntimeResponse,
} from "../P9N.provider.runtime.response.decision";

import type {
  ProviderRuntimeResponseDecisionInput,
  ProviderRuntimeResponseDecisionResult,
} from "../P9N.provider.runtime.response.decision";

import type {
  ProviderRuntimeVerificationResult,
} from "../P9L.provider.runtime.verification";

import type {
  ProviderRuntimeFailureClassificationResult,
  ProviderRuntimeFailureClass,
  ProviderRuntimeFailureSeverity,
} from "../P9M.provider.runtime.failure.classification";

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

    "runtimeVerifiedByResponseDecision",

    "runtimeFailureClassifiedByResponseDecision",

    "failureSeverityAssignedByResponseDecision",

    "runtimeResponseDispatched",

    "runtimeResponseApplied",

    "runtimeResponseExecuted",

    "runtimeResponseExecutionAttempted",

    "retryExecuted",

    "providerRetried",

    "recoveryExecuted",

    "failoverExecuted",

    "stopExecuted",

    "runtimeStopped",

    "escalationDispatched",

    "escalationDelivered",

    "providerSdkCalled",

    "providerApiCalled",

    "providerExecutionInvoked",

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


function assertResponse(
  result: ProviderRuntimeResponseDecisionResult,
  expectedResponse:
    ProviderRuntimeResponseDecisionResult["runtimeResponse"],
  label: string
): void {

  assert(
    result.responseDecisionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_DECIDED",
    `${label} response decision status`
  );

  assert(
    result.runtimeResponseDecisionAttempted === true,
    `${label} response decision attempted`
  );

  assert(
    result.runtimeResponseDecided === true,
    `${label} response decided`
  );

  assert(
    result.runtimeResponseDecisionDenied === false,
    `${label} response decision not denied`
  );

  assert(
    result.runtimeResponse === expectedResponse,
    `${label} response preserved`
  );

  if (
    expectedResponse !== "NO_ACTION"
  ) {

    assert(
      result.runtimeInterventionNotRequired === false,
      `${label} requires runtime intervention`
    );

  }

}


function assertNotDecided(
  result: ProviderRuntimeResponseDecisionResult,
  summaryToken: string,
  label: string
): void {

  assert(
    result.responseDecisionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_NOT_DECIDED",
    `${label} produces not decided`
  );

  assert(
    result.responseDecisionFailureReason ===
      "RUNTIME_RESPONSE_NOT_DETERMINABLE",
    `${label} failure reason preserved`
  );

  assert(
    result.runtimeResponseDecisionAttempted === true,
    `${label} occurs during response decision attempt`
  );

  assert(
    result.runtimeResponseDecided === false,
    `${label} prevents response selection`
  );

  assert(
    result.runtimeResponseDecisionDenied === false,
    `${label} is not a decision denial`
  );

  assert(
    result.runtimeInterventionNotRequired === false,
    `${label} does not mark intervention unnecessary`
  );

  assert(
    result.runtimeResponse === undefined,
    `${label} selects no response`
  );

  assert(
    result.summary.includes(
      summaryToken
    ),
    `${label} summary token preserved`
  );

}


// ============================================================
// BASE CONTEXT
// ============================================================

const providerContract =
  "KEY_MANAGEMENT";

const providerImplementation =
  "AWS_KMS";

const operation =
  "REWRAP_KEY";

const providerResourceId =
  "kms-key-runtime-response";

const providerConfigurationRef =
  "cfg/aws-kms-prod";

const providerCredentialRef =
  "cred/aws-kms-prod";

const executionMetadata = {

  tenantId:
    "tenant-001",

  runtimeBatchId:
    "runtime-response-001",

};


// ============================================================
// VERIFICATION FIXTURES
// ============================================================

function buildVerifiedRuntime():
  ProviderRuntimeVerificationResult {

  return {

    verificationStatus:
      "PROVIDER_RUNTIME_VERIFIED",

    verificationDecision:
      "VERIFY_PROVIDER_RUNTIME_OUTCOME",

    runtimeVerificationAttempted:
      true,

    runtimeVerified:
      true,

    runtimeNotVerified:
      false,

    runtimeVerificationDenied:
      false,

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    providerExecutionObserved:
      true,

    providerExecutionCompleted:
      true,

    providerReference:
      "aws-kms-op-success",

    providerRawStatus:
      "KMS_SUCCESS",

    failureIntakeRequired:
      false,

    failureSurfacePresent:
      false,

    recoveryIntakeRequired:
      false,

    integrationSummary: [
      "provider_runtime_integration_ready",
    ],

    verificationIntakeSummary: [
      "provider_runtime_verification_intake_translated",
    ],

    failureIntakeSummary: [
      "provider_runtime_failure_intake_not_required",
    ],

    recoveryIntakeSummary: [
      "provider_runtime_recovery_intake_not_required",
    ],

    summary: [
      "provider_runtime_integration_ready",
      "provider_runtime_verification_passed",
      "provider_runtime_verified",
    ],

  };

}


function buildNotVerifiedRuntime(
  failureReason:
    ProviderRuntimeVerificationResult["verificationFailureReason"] =
      "PROVIDER_FAILURE_SURFACE_PRESENT"
): ProviderRuntimeVerificationResult {

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

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    providerExecutionObserved:
      true,

    providerExecutionCompleted:
      failureReason ===
      "PROVIDER_EXECUTION_NOT_COMPLETED"
        ? false
        : true,

    providerReference:
      "aws-kms-op-failure",

    providerRawStatus:
      "KMS_ERROR",

    providerRawErrorCode:
      "ProviderFailure",

    failureIntakeRequired:
      true,

    failureSurfacePresent:
      true,

    recoveryIntakeRequired:
      true,

    verificationFailureReason:
      failureReason,

    integrationSummary: [
      "provider_runtime_integration_ready",
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
      "provider_runtime_integration_ready",
      "provider_runtime_verification_failed",
      failureReason ===
      "PROVIDER_EXECUTION_NOT_COMPLETED"
        ? "provider_execution_not_completed"
        : "provider_failure_surface_present",
    ],

  };

}


function buildVerificationDeniedRuntime():
  ProviderRuntimeVerificationResult {

  return {

    ...buildNotVerifiedRuntime(),

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

    failureIntakeRequired:
      false,

    failureSurfacePresent:
      false,

    recoveryIntakeRequired:
      false,

    verificationFailureReason:
      undefined,

    verificationDenialReason:
      "PROVIDER_RUNTIME_INTEGRATION_NOT_READY",

    summary: [
      "provider_runtime_integration_not_ready",
      "provider_runtime_verification_denied",
    ],

  };

}


// ============================================================
// CLASSIFICATION FIXTURES
// ============================================================

function buildClassificationNotRequired():
  ProviderRuntimeFailureClassificationResult {

  return {

    classificationStatus:
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED",

    classificationDecision:
      "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    runtimeFailureClassificationAttempted:
      false,

    runtimeFailureClassified:
      false,

    runtimeFailureClassificationDenied:
      false,

    runtimeFailureClassificationNotRequired:
      true,

    classificationFailureReason:
      "RUNTIME_VERIFIED",

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    verificationStatus:
      "PROVIDER_RUNTIME_VERIFIED",

    recoveryIntakeRequired:
      false,

    integrationSummary: [
      "provider_runtime_integration_ready",
    ],

    verificationSummary: [
      "provider_runtime_verified",
    ],

    failureIntakeSummary: [
      "provider_runtime_failure_intake_not_required",
    ],

    recoveryIntakeSummary: [
      "provider_runtime_recovery_intake_not_required",
    ],

    summary: [
      "provider_runtime_verified",
      "provider_runtime_failure_classification_not_required",
      "runtime_verified",
    ],

  };

}


function buildClassificationDeniedByDecision():
  ProviderRuntimeFailureClassificationResult {

  return {

    classificationStatus:
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_DENIED",

    classificationDecision:
      "REJECT_PROVIDER_RUNTIME_FAILURE_CLASSIFICATION",

    runtimeFailureClassificationAttempted:
      false,

    runtimeFailureClassified:
      false,

    runtimeFailureClassificationDenied:
      true,

    runtimeFailureClassificationNotRequired:
      false,

    classificationDenialReason:
      "RUNTIME_FAILURE_CLASSIFICATION_NOT_ALLOWED",

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    verificationStatus:
      "PROVIDER_RUNTIME_NOT_VERIFIED",

    verificationFailureReason:
      "PROVIDER_FAILURE_SURFACE_PRESENT",

    failureCode:
      undefined,

    providerRawStatus:
      "KMS_ERROR",

    providerRawErrorCode:
      "ProviderFailure",

    providerSanitizedErrorMessage:
      "provider failure classification was not allowed",

    retryable:
      false,

    recoveryIntakeRequired:
      true,

    integrationSummary: [
      "provider_runtime_integration_ready",
    ],

    verificationSummary: [
      "provider_runtime_verification_failed",
      "provider_failure_surface_present",
    ],

    failureIntakeSummary: [
      "provider_runtime_failure_intake_translated",
    ],

    recoveryIntakeSummary: [
      "provider_runtime_recovery_intake_assessed",
    ],

    summary: [
      "provider_runtime_verification_failed",
      "provider_runtime_failure_classification_denied",
      "runtime_failure_classification_not_allowed",
    ],

  };

}


function buildClassificationDeniedByVerification():
  ProviderRuntimeFailureClassificationResult {

  return {

    classificationStatus:
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_DENIED",

    classificationDecision:
      "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    runtimeFailureClassificationAttempted:
      false,

    runtimeFailureClassified:
      false,

    runtimeFailureClassificationDenied:
      true,

    runtimeFailureClassificationNotRequired:
      false,

    classificationDenialReason:
      "RUNTIME_VERIFICATION_DENIED",

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    verificationStatus:
      "PROVIDER_RUNTIME_VERIFICATION_DENIED",

    recoveryIntakeRequired:
      false,

    integrationSummary: [
      "provider_runtime_integration_not_ready",
    ],

    verificationSummary: [
      "provider_runtime_verification_denied",
    ],

    failureIntakeSummary: [
      "provider_runtime_failure_intake_not_translated",
    ],

    recoveryIntakeSummary: [
      "provider_runtime_recovery_intake_not_assessed",
    ],

    summary: [
      "provider_runtime_verification_denied",
      "provider_runtime_failure_classification_denied",
      "runtime_verification_denied",
    ],

  };

}


function buildFailureNotClassified():
  ProviderRuntimeFailureClassificationResult {

  return {

    classificationStatus:
      "PROVIDER_RUNTIME_FAILURE_NOT_CLASSIFIED",

    classificationDecision:
      "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    runtimeFailureClassificationAttempted:
      true,

    runtimeFailureClassified:
      false,

    runtimeFailureClassificationDenied:
      false,

    runtimeFailureClassificationNotRequired:
      false,

    classificationFailureReason:
      "FAILURE_CLASS_NOT_DETERMINABLE",

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    verificationStatus:
      "PROVIDER_RUNTIME_NOT_VERIFIED",

    verificationFailureReason:
      "PROVIDER_FAILURE_SURFACE_PRESENT",

    failureCode:
      undefined,

    providerRawStatus:
      "KMS_ERROR",

    providerRawErrorCode:
      "UnknownProviderFailure",

    providerSanitizedErrorMessage:
      "provider failure could not be classified",

    retryable:
      false,

    recoveryIntakeRequired:
      true,

    integrationSummary: [
      "provider_runtime_integration_ready",
    ],

    verificationSummary: [
      "provider_runtime_verification_failed",
    ],

    failureIntakeSummary: [
      "provider_runtime_failure_intake_translated",
    ],

    recoveryIntakeSummary: [
      "provider_runtime_recovery_intake_assessed",
    ],

    summary: [
      "provider_runtime_verification_failed",
      "provider_runtime_failure_not_classified",
      "failure_class_not_determinable",
    ],

  };

}


function buildClassifiedFailure(
  runtimeFailureClass:
    ProviderRuntimeFailureClass,
  runtimeFailureSeverity:
    ProviderRuntimeFailureSeverity = "MEDIUM",
  retryable?: boolean
): ProviderRuntimeFailureClassificationResult {

  return {

    classificationStatus:
      "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",

    classificationDecision:
      "CLASSIFY_PROVIDER_RUNTIME_FAILURE",

    runtimeFailureClassificationAttempted:
      true,

    runtimeFailureClassified:
      true,

    runtimeFailureClassificationDenied:
      false,

    runtimeFailureClassificationNotRequired:
      false,

    runtimeFailureClass,

    runtimeFailureSeverity,

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    verificationStatus:
      "PROVIDER_RUNTIME_NOT_VERIFIED",

    verificationFailureReason:
      runtimeFailureClass ===
      "PROVIDER_EXECUTION_INCOMPLETE_FAILURE"
        ? "PROVIDER_EXECUTION_NOT_COMPLETED"
        : "PROVIDER_FAILURE_SURFACE_PRESENT",

    failureCode:
      failureCodeForClass(
        runtimeFailureClass
      ),

    providerRawStatus:
      "KMS_ERROR",

    providerRawErrorCode:
      rawErrorCodeForClass(
        runtimeFailureClass
      ),

    providerSanitizedErrorMessage:
      "provider runtime failure classified",

    retryable,

    // P9M preserves the recovery requirement received from P9L.
    // It is not derived from the runtime failure class.
    recoveryIntakeRequired:
      true,

    integrationSummary: [
      "provider_runtime_integration_ready",
    ],

    verificationSummary: [
      "provider_runtime_verification_failed",
    ],

    failureIntakeSummary: [
      "provider_runtime_failure_intake_translated",
    ],

    recoveryIntakeSummary: [
      "provider_runtime_recovery_intake_assessed",
    ],

    summary: [
      "provider_runtime_verification_failed",
      "provider_runtime_failure_classified",
      runtimeFailureClass,
      runtimeFailureSeverity,
    ],

  };

}


function buildIncoherentClassification():
  ProviderRuntimeFailureClassificationResult {

  return {

    ...buildClassifiedFailure(
      "PROVIDER_UNKNOWN_FAILURE"
    ),

    classificationStatus:
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED",

    runtimeFailureClassificationAttempted:
      false,

    runtimeFailureClassified:
      false,

    runtimeFailureClassificationNotRequired:
      false,

    runtimeFailureClass:
      undefined,

    runtimeFailureSeverity:
      undefined,

    summary: [
      "provider_runtime_failure_classification_state_incoherent",
    ],

  };

}


// ============================================================
// CLASSIFICATION SUPPORT
// ============================================================

function failureCodeForClass(
  runtimeFailureClass:
    ProviderRuntimeFailureClass
): ProviderRuntimeFailureClassificationResult["failureCode"] {

  switch (runtimeFailureClass) {

    case "PROVIDER_AUTHORIZATION_FAILURE":
      return "PROVIDER_CALL_UNAUTHORIZED";

    case "PROVIDER_RATE_LIMIT_FAILURE":
      return "PROVIDER_CALL_THROTTLED";

    case "PROVIDER_TIMEOUT_FAILURE":
      return "PROVIDER_CALL_TIMEOUT";

    default:
      return undefined;

  }

}


function rawErrorCodeForClass(
  runtimeFailureClass:
    ProviderRuntimeFailureClass
): string {

  switch (runtimeFailureClass) {

    case "PROVIDER_AUTHORIZATION_FAILURE":
      return "AccessDeniedException";

    case "PROVIDER_AUTHENTICATION_FAILURE":
      return "AuthenticationFailed";

    case "PROVIDER_CONFIGURATION_FAILURE":
      return "InvalidConfiguration";

    case "PROVIDER_INVALID_REQUEST_FAILURE":
      return "InvalidRequestException";

    case "PROVIDER_RATE_LIMIT_FAILURE":
      return "ThrottlingException";

    case "PROVIDER_TIMEOUT_FAILURE":
      return "TimeoutException";

    case "PROVIDER_UNAVAILABLE_FAILURE":
      return "ServiceUnavailable";

    case "PROVIDER_DEPENDENCY_FAILURE":
      return "DependencyFailure";

    case "PROVIDER_CONTRACT_FAILURE":
      return "ContractMismatch";

    case "PROVIDER_EXECUTION_INCOMPLETE_FAILURE":
      return "ProviderExecutionIncomplete";

    case "PROVIDER_UNKNOWN_FAILURE":
      return "UnknownProviderFailure";

  }

}


// ============================================================
// RECOVERY INTAKE FIXTURES
// ============================================================

function buildRecoveryIntake(
  ready: boolean
): ProviderRuntimeRecoveryIntakeAssessmentResult {

  return {

    assessmentStatus:
      ready
        ? "PROVIDER_RUNTIME_RECOVERY_INTAKE_ASSESSED"
        : "PROVIDER_RUNTIME_RECOVERY_INTAKE_NOT_ASSESSED",

    assessmentDecision:
      "ASSESS_PROVIDER_RUNTIME_RECOVERY_INTAKE",

    recoveryIntakeAssessed:
      ready,

    recoveryIntakeRequired:
      true,

    recoveryIntakeReady:
      ready,

    recoveryReason:
      "PROVIDER_FAILURE_SURFACE_PRESENT",

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    recoveryIntake:
      ready
        ? {

            recoveryIntakeRequired:
              true,

            recoveryIntakeReady:
              true,

            recoveryReason:
              "PROVIDER_FAILURE_SURFACE_PRESENT",

            summary: [
              "provider_runtime_recovery_intake_ready",
            ],

          }
        : undefined,

    denialReason:
      ready
        ? undefined
        : "RECOVERY_INTAKE_MATERIAL_MISSING",

    integrationSummary: [
      "provider_runtime_integration_ready",
    ],

    summary:
      ready
        ? [
            "provider_runtime_integration_ready",
            "provider_runtime_recovery_intake_assessed",
            "provider_runtime_recovery_intake_ready",
          ]
        : [
            "provider_runtime_integration_ready",
            "recovery_intake_material_missing",
            "provider_runtime_recovery_intake_not_assessed",
          ],

  };

}


// ============================================================
// INPUT BUILDER
// ============================================================

function buildInput(
  overrides?:
    Partial<ProviderRuntimeResponseDecisionInput>
): ProviderRuntimeResponseDecisionInput {

  return {

    verification:
      buildNotVerifiedRuntime(),

    classification:
      buildClassifiedFailure(
        "PROVIDER_AUTHORIZATION_FAILURE",
        "HIGH",
        false
      ),

    recoveryIntake:
      buildRecoveryIntake(
        true
      ),

    responseDecision:
      "DECIDE_PROVIDER_RUNTIME_RESPONSE",

    ...overrides,

  };

}


// ============================================================
// SCENARIO 1 — RESPONSE DECISION REJECTED
// ============================================================

function runResponseDecisionRejectedScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        responseDecision:
          "REJECT_PROVIDER_RUNTIME_RESPONSE_DECISION",

      })
    );

  assert(
    result.responseDecisionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_DECISION_DENIED",
    "response decision rejected status preserved"
  );

  assert(
    result.runtimeResponseDecisionAttempted === false,
    "response decision rejected prevents attempt"
  );

  assert(
    result.runtimeResponseDecided === false,
    "response decision rejected prevents response selection"
  );

  assert(
    result.runtimeResponseDecisionDenied === true,
    "response decision rejected denial flag preserved"
  );

  assert(
    result.responseDecisionDenialReason ===
      "RUNTIME_RESPONSE_DECISION_NOT_ALLOWED",
    "response decision rejected reason preserved"
  );

  assert(
    result.runtimeResponse === undefined,
    "denied response decision exposes no runtime response"
  );

  assert(
    result.runtimeInterventionNotRequired === false,
    "denied response decision does not mark intervention unnecessary"
  );

  pass("response decision rejected");
  pass("response decision rejected reason preserved");
  pass("denied response decision exposes no response");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 2 — RUNTIME VERIFICATION DENIED
// ============================================================

function runRuntimeVerificationDeniedScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification:
          buildVerificationDeniedRuntime(),

        classification:
          buildClassificationDeniedByVerification(),

        recoveryIntake:
          undefined,

      })
    );

  assert(
    result.responseDecisionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_DECISION_DENIED",
    "runtime verification denied blocks response decision"
  );

  assert(
    result.responseDecisionDenialReason ===
      "RUNTIME_VERIFICATION_DENIED",
    "runtime verification denial reason preserved"
  );

  assert(
    result.runtimeResponseDecisionAttempted === false,
    "verification denial prevents response decision attempt"
  );

  assert(
    result.runtimeResponse === undefined,
    "verification denial exposes no runtime response"
  );

  pass("runtime verification denied");
  pass("runtime verification denial reason preserved");
  pass("verification denial prevents response decision attempt");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — FAILURE CLASSIFICATION DENIED
// ============================================================

function runFailureClassificationDeniedScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification:
          buildNotVerifiedRuntime(),

        classification:
          buildClassificationDeniedByDecision(),

      })
    );

  assert(
    result.responseDecisionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_DECISION_DENIED",
    "failure classification denied blocks response decision"
  );

  assert(
    result.responseDecisionDenialReason ===
      "RUNTIME_FAILURE_CLASSIFICATION_DENIED",
    "failure classification denial reason preserved"
  );

  assert(
    result.verificationStatus ===
      "PROVIDER_RUNTIME_NOT_VERIFIED",
    "classification denial occurs after completed runtime verification"
  );

  assert(
    result.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_DENIED",
    "classification denied status propagated"
  );

  assert(
    result.runtimeResponseDecisionAttempted === false,
    "classification denial prevents response decision attempt"
  );

  assert(
    result.runtimeResponse === undefined,
    "classification denial exposes no runtime response"
  );

  pass("failure classification denied");
  pass("failure classification denial reason preserved");
  pass("classification denial remains distinct from verification denial");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 4 — VERIFIED RUNTIME → NO_ACTION
// ============================================================

function runVerifiedRuntimeNoActionScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification:
          buildVerifiedRuntime(),

        classification:
          buildClassificationNotRequired(),

        recoveryIntake:
          undefined,

      })
    );

  assertResponse(
    result,
    "NO_ACTION",
    "verified runtime"
  );

  assert(
    result.runtimeInterventionNotRequired === true,
    "verified runtime requires no intervention"
  );

  assert(
    result.responseDecisionDenialReason === undefined,
    "NO_ACTION exposes no denial reason"
  );

  assert(
    result.responseDecisionFailureReason === undefined,
    "NO_ACTION exposes no failure reason"
  );

  assert(
    result.summary.includes(
      "no_action"
    ),
    "NO_ACTION summary token preserved"
  );

  pass("verified runtime selects NO_ACTION");
  pass("runtime intervention not required");
  pass("NO_ACTION exposes no denial or failure reason");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 5 — FAILURE NOT CLASSIFIED
// ============================================================

function runFailureNotClassifiedScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildFailureNotClassified(),

      })
    );

  assert(
    result.responseDecisionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_NOT_DECIDED",
    "failure not classified produces not decided"
  );

  assert(
    result.runtimeResponseDecisionAttempted === true,
    "failure not classified still attempts response decision"
  );

  assert(
    result.runtimeResponseDecided === false,
    "failure not classified prevents response selection"
  );

  assert(
    result.runtimeResponseDecisionDenied === false,
    "failure not classified is not a decision denial"
  );

  assert(
    result.responseDecisionFailureReason ===
      "RUNTIME_FAILURE_NOT_CLASSIFIED",
    "failure not classified reason preserved"
  );

  assert(
    result.runtimeResponse === undefined,
    "not decided result exposes no runtime response"
  );

  assert(
    result.runtimeInterventionNotRequired === false,
    "not decided result does not mark intervention unnecessary"
  );

  pass("failure not classified");
  pass("failure not classified response not decided");
  pass("not decided result exposes no runtime response");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 6 — RESPONSE NOT DETERMINABLE
// ============================================================

function runResponseNotDeterminableScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildIncoherentClassification(),

      })
    );

  assert(
    result.responseDecisionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_NOT_DECIDED",
    "incoherent classification produces not decided"
  );

  assert(
    result.responseDecisionFailureReason ===
      "RUNTIME_RESPONSE_NOT_DETERMINABLE",
    "response not determinable reason preserved"
  );

  assert(
    result.runtimeResponse === undefined,
    "not decided result exposes no runtime response"
  );

  assert(
    result.runtimeInterventionNotRequired === false,
    "not decided result does not mark intervention unnecessary"
  );

  pass("incoherent classification");
  pass("runtime response not determinable");
  pass("not decided result exposes no runtime response");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 7 — TIMEOUT + RETRYABLE TRUE → RETRY
// ============================================================

function runTimeoutRetryableTrueScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildClassifiedFailure(
            "PROVIDER_TIMEOUT_FAILURE",
            "MEDIUM",
            true
          ),

      })
    );

  assertResponse(
    result,
    "RETRY",
    "timeout retryable true"
  );

  pass("timeout retryable true selects RETRY");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 8 — TIMEOUT + RETRYABLE FALSE → ESCALATE
// ============================================================

function runTimeoutRetryableFalseScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildClassifiedFailure(
            "PROVIDER_TIMEOUT_FAILURE",
            "MEDIUM",
            false
          ),

      })
    );

  assertResponse(
    result,
    "ESCALATE",
    "timeout retryable false"
  );

  pass("timeout retryable false selects ESCALATE");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 9 — TIMEOUT + RETRYABLE ABSENT → ESCALATE
// ============================================================

function runTimeoutRetryableAbsentScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildClassifiedFailure(
            "PROVIDER_TIMEOUT_FAILURE",
            "MEDIUM",
            undefined
          ),

      })
    );

  assertResponse(
    result,
    "ESCALATE",
    "timeout retryable absent"
  );

  pass("timeout retryable absent selects ESCALATE");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 10 — EXECUTION INCOMPLETE + RECOVERY READY
// ============================================================

function runExecutionIncompleteRecoveryReadyScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification:
          buildNotVerifiedRuntime(
            "PROVIDER_EXECUTION_NOT_COMPLETED"
          ),

        classification:
          buildClassifiedFailure(
            "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
            "MEDIUM",
            false
          ),

        recoveryIntake:
          buildRecoveryIntake(
            true
          ),

      })
    );

  assertResponse(
    result,
    "RECOVER",
    "execution incomplete recovery ready"
  );

  assert(
    result.recoveryIntakeReady === true,
    "RECOVER preserves recovery intake readiness"
  );

  pass("execution incomplete with recovery ready selects RECOVER");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 11 — EXECUTION INCOMPLETE + RECOVERY NOT READY
// ============================================================

function runExecutionIncompleteRecoveryNotReadyScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification:
          buildNotVerifiedRuntime(
            "PROVIDER_EXECUTION_NOT_COMPLETED"
          ),

        classification:
          buildClassifiedFailure(
            "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
            "MEDIUM",
            false
          ),

        recoveryIntake:
          buildRecoveryIntake(
            false
          ),

      })
    );

  assertResponse(
    result,
    "ESCALATE",
    "execution incomplete recovery not ready"
  );

  assert(
    result.recoveryIntakeReady === false,
    "recovery not ready state preserved"
  );

  pass("execution incomplete without recovery readiness selects ESCALATE");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 12 — UNAVAILABLE + RECOVERY READY → FAILOVER
// ============================================================

function runUnavailableRecoveryReadyScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildClassifiedFailure(
            "PROVIDER_UNAVAILABLE_FAILURE",
            "HIGH",
            false
          ),

        recoveryIntake:
          buildRecoveryIntake(
            true
          ),

      })
    );

  assertResponse(
    result,
    "FAILOVER",
    "provider unavailable recovery ready"
  );

  pass("provider unavailable with recovery ready selects FAILOVER");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 13 — UNAVAILABLE + RECOVERY NOT READY
// ============================================================

function runUnavailableRecoveryNotReadyScenario(): void {

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildClassifiedFailure(
            "PROVIDER_UNAVAILABLE_FAILURE",
            "HIGH",
            false
          ),

        recoveryIntake:
          buildRecoveryIntake(
            false
          ),

      })
    );

  assertResponse(
    result,
    "ESCALATE",
    "provider unavailable recovery not ready"
  );

  pass("provider unavailable without recovery readiness selects ESCALATE");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 14 — ESCALATION CLASSES
// ============================================================

function runEscalationClassesScenario(): void {

  const escalationClasses:
    ProviderRuntimeFailureClass[] = [

      "PROVIDER_AUTHORIZATION_FAILURE",

      "PROVIDER_AUTHENTICATION_FAILURE",

      "PROVIDER_UNKNOWN_FAILURE",

    ];

  for (
    const runtimeFailureClass
    of escalationClasses
  ) {

    const result =
      decideProviderRuntimeResponse(
        buildInput({

          classification:
            buildClassifiedFailure(
              runtimeFailureClass,
              "HIGH",
              false
            ),

        })
      );

    assertResponse(
      result,
      "ESCALATE",
      runtimeFailureClass
    );

    pass(
      `${runtimeFailureClass} selects ESCALATE`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 15 — STOP CLASSES
// ============================================================

function runStopClassesScenario(): void {

  const stopClasses:
    ProviderRuntimeFailureClass[] = [

      "PROVIDER_CONFIGURATION_FAILURE",

      "PROVIDER_INVALID_REQUEST_FAILURE",

      "PROVIDER_CONTRACT_FAILURE",

    ];

  for (
    const runtimeFailureClass
    of stopClasses
  ) {

    const result =
      decideProviderRuntimeResponse(
        buildInput({

          classification:
            buildClassifiedFailure(
              runtimeFailureClass,
              "HIGH",
              false
            ),

        })
      );

    assertResponse(
      result,
      "STOP",
      runtimeFailureClass
    );

    pass(
      `${runtimeFailureClass} selects STOP`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 16 — VERIFIED RUNTIME + CLASSIFIED FAILURE
// ============================================================

function runVerifiedRuntimeWithClassifiedFailureScenario(): void {

  const classification = {

    ...buildClassifiedFailure(
      "PROVIDER_TIMEOUT_FAILURE",
      "MEDIUM",
      true
    ),

    verificationStatus:
      "PROVIDER_RUNTIME_VERIFIED" as const,

    verificationFailureReason:
      undefined,

    recoveryIntakeRequired:
      false,

  };

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification:
          buildVerifiedRuntime(),

        classification,

        recoveryIntake:
          undefined,

      })
    );

  assertNotDecided(
    result,
    "verified_runtime_classification_incoherent",
    "verified runtime with classified failure"
  );

  pass("verified runtime with classified failure");
  pass("verified runtime classification incoherence rejected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 17 — VERIFICATION STATUS MISMATCH
// ============================================================

function runVerificationStatusMismatchScenario(): void {

  const verification =
    buildNotVerifiedRuntime();

  const classification = {

    ...buildClassifiedFailure(
      "PROVIDER_AUTHORIZATION_FAILURE",
      "HIGH",
      false
    ),

    verificationStatus:
      "PROVIDER_RUNTIME_VERIFIED" as const,

  };

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification,

        classification,

      })
    );

  assertNotDecided(
    result,
    "verification_classification_status_mismatch",
    "verification status mismatch"
  );

  pass("verification status mismatch");
  pass("verification status coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 18 — VERIFICATION FAILURE REASON MISMATCH
// ============================================================

function runVerificationFailureReasonMismatchScenario(): void {

  const verification =
    buildNotVerifiedRuntime(
      "PROVIDER_EXECUTION_NOT_COMPLETED"
    );

  const classification = {

    ...buildClassifiedFailure(
      "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
      "MEDIUM",
      false
    ),

    verificationFailureReason:
      "PROVIDER_FAILURE_SURFACE_PRESENT" as const,

  };

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification,

        classification,

        recoveryIntake:
          buildRecoveryIntake(
            true
          ),

      })
    );

  assertNotDecided(
    result,
    "verification_failure_reason_mismatch",
    "verification failure reason mismatch"
  );

  pass("verification failure reason mismatch");
  pass("verification failure lineage coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 19 — RUNTIME CONTEXT MISMATCH
// ============================================================

function runRuntimeContextMismatchScenario(): void {

  const classification = {

    ...buildClassifiedFailure(
      "PROVIDER_AUTHORIZATION_FAILURE",
      "HIGH",
      false
    ),

    providerResourceId:
      "kms-key-different",

  };

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification:
          buildNotVerifiedRuntime(),

        classification,

      })
    );

  assertNotDecided(
    result,
    "runtime_context_mismatch",
    "runtime context mismatch"
  );

  pass("runtime context mismatch");
  pass("provider runtime ownership coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 20 — RECOVERY REQUIREMENT MISMATCH
// ============================================================

function runRecoveryRequirementMismatchScenario(): void {

  const verification =
    buildNotVerifiedRuntime(
      "PROVIDER_EXECUTION_NOT_COMPLETED"
    );

  const classification = {

    ...buildClassifiedFailure(
      "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
      "MEDIUM",
      false
    ),

    recoveryIntakeRequired:
      false,

  };

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification,

        classification,

        recoveryIntake:
          buildRecoveryIntake(
            true
          ),

      })
    );

  assertNotDecided(
    result,
    "recovery_intake_requirement_mismatch",
    "recovery requirement mismatch"
  );

  pass("recovery requirement mismatch");
  pass("verification/classification recovery requirement coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 21 — RECOVERY INTAKE CONTEXT MISMATCH
// ============================================================

function runRecoveryIntakeContextMismatchScenario(): void {

  const recoveryIntake = {

    ...buildRecoveryIntake(
      true
    ),

    providerResourceId:
      "kms-key-recovery-other",

  };

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification:
          buildNotVerifiedRuntime(
            "PROVIDER_EXECUTION_NOT_COMPLETED"
          ),

        classification:
          buildClassifiedFailure(
            "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
            "MEDIUM",
            false
          ),

        recoveryIntake,

      })
    );

  assertNotDecided(
    result,
    "recovery_intake_context_mismatch",
    "recovery intake context mismatch"
  );

  pass("recovery intake context mismatch");
  pass("recovery intake ownership coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 22 — DEPENDENCY FAILURE MAPPING
// ============================================================

function runDependencyFailureScenarios(): void {

  const recoveryReadyResult =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildClassifiedFailure(
            "PROVIDER_DEPENDENCY_FAILURE",
            "HIGH",
            false
          ),

        recoveryIntake:
          buildRecoveryIntake(
            true
          ),

      })
    );

  assertResponse(
    recoveryReadyResult,
    "RECOVER",
    "dependency failure recovery ready"
  );

  assert(
    recoveryReadyResult.recoveryIntakeReady === true,
    "dependency failure recovery readiness preserved"
  );

  pass("dependency failure with recovery ready selects RECOVER");

  assertNoCrossLayerFields(
    recoveryReadyResult as unknown as Record<string, unknown>
  );

  const recoveryNotReadyResult =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildClassifiedFailure(
            "PROVIDER_DEPENDENCY_FAILURE",
            "HIGH",
            false
          ),

        recoveryIntake:
          buildRecoveryIntake(
            false
          ),

      })
    );

  assertResponse(
    recoveryNotReadyResult,
    "ESCALATE",
    "dependency failure recovery not ready"
  );

  assert(
    recoveryNotReadyResult.recoveryIntakeReady === false,
    "dependency failure recovery not ready preserved"
  );

  pass("dependency failure without recovery readiness selects ESCALATE");

  assertNoCrossLayerFields(
    recoveryNotReadyResult as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 23 — RATE-LIMIT FAILURE MAPPING
// ============================================================

function runRateLimitScenarios(): void {

  const retryableResult =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildClassifiedFailure(
            "PROVIDER_RATE_LIMIT_FAILURE",
            "MEDIUM",
            true
          ),

      })
    );

  assertResponse(
    retryableResult,
    "RETRY",
    "rate limit retryable true"
  );

  pass("rate limit retryable true selects RETRY");

  assertNoCrossLayerFields(
    retryableResult as unknown as Record<string, unknown>
  );

  const notRetryableResult =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildClassifiedFailure(
            "PROVIDER_RATE_LIMIT_FAILURE",
            "MEDIUM",
            false
          ),

      })
    );

  assertResponse(
    notRetryableResult,
    "ESCALATE",
    "rate limit retryable false"
  );

  pass("rate limit retryable false selects ESCALATE");

  assertNoCrossLayerFields(
    notRetryableResult as unknown as Record<string, unknown>
  );

  const retryableAbsentResult =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildClassifiedFailure(
            "PROVIDER_RATE_LIMIT_FAILURE",
            "MEDIUM",
            undefined
          ),

      })
    );

  assertResponse(
    retryableAbsentResult,
    "ESCALATE",
    "rate limit retryable absent"
  );

  pass("rate limit retryable absent selects ESCALATE");

  assertNoCrossLayerFields(
    retryableAbsentResult as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 24 — RECOVERY INTAKE ABSENT
// ============================================================

function runRecoveryIntakeAbsentScenarios(): void {

  const recoverResult =
    decideProviderRuntimeResponse(
      buildInput({

        verification:
          buildNotVerifiedRuntime(
            "PROVIDER_EXECUTION_NOT_COMPLETED"
          ),

        classification:
          buildClassifiedFailure(
            "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
            "MEDIUM",
            false
          ),

        recoveryIntake:
          undefined,

      })
    );

  assertResponse(
    recoverResult,
    "ESCALATE",
    "execution incomplete recovery intake absent"
  );

  assert(
    recoverResult.recoveryIntakeReady === false,
    "absent recovery intake is not ready"
  );

  assert(
    recoverResult.recoveryIntakeSummary === undefined,
    "absent recovery intake exposes no recovery summary"
  );

  assert(
    recoverResult.recoveryReason === undefined,
    "absent recovery intake exposes no recovery reason"
  );

  pass("execution incomplete with absent recovery intake selects ESCALATE");

  assertNoCrossLayerFields(
    recoverResult as unknown as Record<string, unknown>
  );

  const failoverResult =
    decideProviderRuntimeResponse(
      buildInput({

        classification:
          buildClassifiedFailure(
            "PROVIDER_UNAVAILABLE_FAILURE",
            "HIGH",
            false
          ),

        recoveryIntake:
          undefined,

      })
    );

  assertResponse(
    failoverResult,
    "ESCALATE",
    "provider unavailable recovery intake absent"
  );

  assert(
    failoverResult.recoveryIntakeReady === false,
    "absent failover recovery intake is not ready"
  );

  assert(
    failoverResult.recoveryIntakeSummary === undefined,
    "absent failover recovery intake exposes no recovery summary"
  );

  pass("provider unavailable with absent recovery intake selects ESCALATE");

  assertNoCrossLayerFields(
    failoverResult as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 25 — RECOVERY-INTAKE DECLARED REQUIREMENT MISMATCH
// ============================================================

function runRecoveryIntakeDeclaredRequirementMismatchScenario(): void {

  const recoveryIntake = {

    ...buildRecoveryIntake(
      true
    ),

    recoveryIntakeRequired:
      false,

  };

  const result =
    decideProviderRuntimeResponse(
      buildInput({

        verification:
          buildNotVerifiedRuntime(
            "PROVIDER_EXECUTION_NOT_COMPLETED"
          ),

        classification:
          buildClassifiedFailure(
            "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
            "MEDIUM",
            false
          ),

        recoveryIntake,

      })
    );

  assertNotDecided(
    result,
    "recovery_intake_requirement_mismatch",
    "recovery intake declared requirement mismatch"
  );

  pass("recovery intake declared requirement mismatch");
  pass("three-way recovery requirement coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 26 — CONTEXT PROPAGATION
// ============================================================

function runContextPropagationChecks(): void {

  const verification =
    buildNotVerifiedRuntime(
      "PROVIDER_EXECUTION_NOT_COMPLETED"
    );

  const classification =
    buildClassifiedFailure(
      "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
      "MEDIUM",
      false
    );

  const recoveryIntake =
    buildRecoveryIntake(
      true
    );

  const result =
    decideProviderRuntimeResponse({

      verification,

      classification,

      recoveryIntake,

      responseDecision:
        "DECIDE_PROVIDER_RUNTIME_RESPONSE",

    });

  assert(
    result.providerContract ===
      verification.providerContract,
    "providerContract propagated"
  );

  assert(
    result.providerImplementation ===
      verification.providerImplementation,
    "providerImplementation propagated"
  );

  assert(
    result.operation ===
      verification.operation,
    "operation propagated"
  );

  assert(
    result.providerResourceId ===
      verification.providerResourceId,
    "providerResourceId propagated"
  );

  assert(
    result.providerConfigurationRef ===
      verification.providerConfigurationRef,
    "providerConfigurationRef propagated"
  );

  assert(
    result.providerCredentialRef ===
      verification.providerCredentialRef,
    "providerCredentialRef propagated"
  );

  assert.deepEqual(
    result.executionMetadata,
    verification.executionMetadata,
    "executionMetadata propagated"
  );

  assert(
    result.verificationStatus ===
      verification.verificationStatus,
    "verificationStatus propagated"
  );

  assert(
    result.verificationFailureReason ===
      verification.verificationFailureReason,
    "verificationFailureReason propagated"
  );

  assert(
    result.classificationStatus ===
      classification.classificationStatus,
    "classificationStatus propagated"
  );

  assert(
    result.runtimeFailureClass ===
      classification.runtimeFailureClass,
    "runtimeFailureClass propagated"
  );

  assert(
    result.runtimeFailureSeverity ===
      classification.runtimeFailureSeverity,
    "runtimeFailureSeverity propagated"
  );

  assert(
    result.failureCode ===
      classification.failureCode,
    "failureCode propagated"
  );

  assert(
    result.providerRawStatus ===
      classification.providerRawStatus,
    "providerRawStatus propagated"
  );

  assert(
    result.providerRawErrorCode ===
      classification.providerRawErrorCode,
    "providerRawErrorCode propagated"
  );

  assert(
    result.providerSanitizedErrorMessage ===
      classification.providerSanitizedErrorMessage,
    "providerSanitizedErrorMessage propagated"
  );

  assert(
    result.retryable ===
      classification.retryable,
    "retryable propagated"
  );

  assert(
    result.recoveryIntakeRequired ===
      verification.recoveryIntakeRequired,
    "recoveryIntakeRequired propagated"
  );

  assert(
    result.recoveryIntakeReady ===
      recoveryIntake.recoveryIntakeReady,
    "recoveryIntakeReady propagated"
  );

  assert(
    result.recoveryReason ===
      recoveryIntake.recoveryReason,
    "recoveryReason propagated"
  );

  assert(
    result.verificationSummary.includes(
      "provider_runtime_verification_failed"
    ),
    "verification summary propagated"
  );

  assert(
    result.classificationSummary.includes(
      "provider_runtime_failure_classified"
    ),
    "classification summary propagated"
  );

  assert(
    result.recoveryIntakeSummary?.includes(
      "provider_runtime_recovery_intake_assessed"
    ),
    "recovery intake summary propagated"
  );

  assert(
    result.summary.includes(
      "provider_runtime_response_decided"
    ),
    "response decision terminal summary preserved"
  );

  pass("provider context propagated");
  pass("verification context propagated");
  pass("classification context propagated");
  pass("failure context propagated");
  pass("recovery context propagated");
  pass("summary propagation verified");

}


// ============================================================
// SCENARIO 27 — BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const scenarios:
    ProviderRuntimeResponseDecisionResult[] = [

      decideProviderRuntimeResponse(
        buildInput({

          classification:
            buildClassifiedFailure(
              "PROVIDER_TIMEOUT_FAILURE",
              "MEDIUM",
              true
            ),

        })
      ),

      decideProviderRuntimeResponse(
        buildInput({

          verification:
            buildNotVerifiedRuntime(
              "PROVIDER_EXECUTION_NOT_COMPLETED"
            ),

          classification:
            buildClassifiedFailure(
              "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
              "MEDIUM",
              false
            ),

          recoveryIntake:
            buildRecoveryIntake(
              true
            ),

        })
      ),

      decideProviderRuntimeResponse(
        buildInput({

          classification:
            buildClassifiedFailure(
              "PROVIDER_UNAVAILABLE_FAILURE",
              "HIGH",
              false
            ),

          recoveryIntake:
            buildRecoveryIntake(
              true
            ),

        })
      ),

      decideProviderRuntimeResponse(
        buildInput({

          classification:
            buildClassifiedFailure(
              "PROVIDER_CONFIGURATION_FAILURE",
              "HIGH",
              false
            ),

        })
      ),

      decideProviderRuntimeResponse(
        buildInput({

          classification:
            buildClassifiedFailure(
              "PROVIDER_AUTHORIZATION_FAILURE",
              "HIGH",
              false
            ),

        })
      ),

      decideProviderRuntimeResponse(
        buildInput({

          verification:
            buildNotVerifiedRuntime(
              "PROVIDER_EXECUTION_NOT_COMPLETED"
            ),

          classification:
            buildClassifiedFailure(
              "PROVIDER_EXECUTION_INCOMPLETE_FAILURE",
              "MEDIUM",
              false
            ),

          recoveryIntake:
            undefined,

        })
      ),

  ];

  for (const result of scenarios) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runResponseDecisionRejectedScenario();

  runRuntimeVerificationDeniedScenario();

  runFailureClassificationDeniedScenario();

  runVerifiedRuntimeNoActionScenario();

  runFailureNotClassifiedScenario();

  runResponseNotDeterminableScenario();

  runTimeoutRetryableTrueScenario();

  runTimeoutRetryableFalseScenario();

  runTimeoutRetryableAbsentScenario();

  runExecutionIncompleteRecoveryReadyScenario();

  runExecutionIncompleteRecoveryNotReadyScenario();

  runUnavailableRecoveryReadyScenario();

  runUnavailableRecoveryNotReadyScenario();

  runEscalationClassesScenario();

  runStopClassesScenario();

  runVerifiedRuntimeWithClassifiedFailureScenario();

  runVerificationStatusMismatchScenario();

  runVerificationFailureReasonMismatchScenario();

  runRuntimeContextMismatchScenario();

  runRecoveryRequirementMismatchScenario();

  runRecoveryIntakeContextMismatchScenario();

  runDependencyFailureScenarios();

  runRateLimitScenarios();

  runRecoveryIntakeAbsentScenarios();

  runRecoveryIntakeDeclaredRequirementMismatchScenario();

  runContextPropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9N PROVIDER RUNTIME RESPONSE DECISION");
  console.log("========================================");
  console.log("");

  console.log("Decision Gates:");
  console.log("✓ response decision rejected → DENIED");
  console.log("✓ runtime verification denied → DENIED");
  console.log("✓ failure classification denied → DENIED");

  console.log("");
  console.log("Terminal Runtime States:");
  console.log("✓ verified runtime → NO_ACTION");
  console.log("✓ failure not classified → NOT_DECIDED");
  console.log("✓ response not determinable → NOT_DECIDED");

  console.log("");
  console.log("Retry Posture:");
  console.log("✓ timeout + retryable true → RETRY");
  console.log("✓ timeout + retryable false → ESCALATE");
  console.log("✓ timeout + retryable absent → ESCALATE");
  console.log("✓ rate limit + retryable true → RETRY");
  console.log("✓ rate limit + retryable false → ESCALATE");
  console.log("✓ rate limit + retryable absent → ESCALATE");

  console.log("");
  console.log("Recovery Posture:");
  console.log("✓ execution incomplete + recovery ready → RECOVER");
  console.log("✓ execution incomplete + recovery not ready → ESCALATE");
  console.log("✓ execution incomplete + recovery absent → ESCALATE");
  console.log("✓ dependency failure + recovery ready → RECOVER");
  console.log("✓ dependency failure + recovery not ready → ESCALATE");

  console.log("");
  console.log("Failover Posture:");
  console.log("✓ unavailable + recovery ready → FAILOVER");
  console.log("✓ unavailable + recovery not ready → ESCALATE");
  console.log("✓ unavailable + recovery absent → ESCALATE");

  console.log("");
  console.log("Escalation Posture:");
  console.log("✓ authorization → ESCALATE");
  console.log("✓ authentication → ESCALATE");
  console.log("✓ unknown → ESCALATE");

  console.log("");
  console.log("Stop Posture:");
  console.log("✓ configuration → STOP");
  console.log("✓ invalid request → STOP");
  console.log("✓ contract → STOP");

  console.log("");
  console.log("Coherence Gates:");
  console.log("✓ verified runtime + classified failure rejected");
  console.log("✓ verification status coherence");
  console.log("✓ verification failure reason coherence");
  console.log("✓ provider/runtime context coherence");
  console.log("✓ verification/classification recovery requirement coherence");
  console.log("✓ recovery intake ownership coherence");
  console.log("✓ three-way recovery requirement coherence");

  console.log("");
  console.log("Contract Propagation:");
  console.log("✓ provider/runtime context");
  console.log("✓ verification context");
  console.log("✓ classification context");
  console.log("✓ failure context");
  console.log("✓ recovery context");
  console.log("✓ summary propagation");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime verification");
  console.log("✓ no runtime failure classification");
  console.log("✓ no response dispatch or application");
  console.log("✓ no response execution");
  console.log("✓ no provider retry");
  console.log("✓ no recovery execution");
  console.log("✓ no failover execution");
  console.log("✓ no runtime stop execution");
  console.log("✓ no escalation dispatch");
  console.log("✓ no provider API / SDK calls");
  console.log("✓ no re-sanitization");
  console.log("✓ no evidence / ledger / audit");

  console.log("");
  console.log("========================================");
  console.log("P9N.1 PROVIDER RUNTIME RESPONSE DECISION VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();


