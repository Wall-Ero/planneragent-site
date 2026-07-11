// ============================================================
// PlannerAgent — Provider Runtime Execution Outcome Certification Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9P.provider.runtime.execution.outcome.certification.runner.ts
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
// P9P.1 — Provider Runtime Execution Outcome Certification Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9P.1 execution-outcome certification contract.
//
// P9P certifies operational fact produced by P9O.
//
// P9P does not verify runtime.
// P9P does not classify runtime failure.
// P9P does not decide runtime response.
// P9P does not execute runtime response.
// P9P does not persist evidence.
// P9P does not write ledger.
// P9P does not perform audit.
//
// ============================================================

import assert from "node:assert/strict";

import {
  certifyProviderRuntimeExecutionOutcome,
} from "../P9P.provider.runtime.execution.outcome.certification";

import type {
  ProviderRuntimeCertifiedExecutionOutcome,
  ProviderRuntimeExecutionOutcomeCertificationInput,
  ProviderRuntimeExecutionOutcomeCertificationResult,
} from "../P9P.provider.runtime.execution.outcome.certification";

import type {
  ProviderRuntimeResponseExecutionResult,
} from "../P9O.provider.runtime.response.execution";

import type {
  ProviderRuntimeResponse,
} from "../P9N.provider.runtime.response.decision";


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

    "runtimeVerifiedByCertification",

    "runtimeFailureClassifiedByCertification",

    "runtimeResponseDecidedByCertification",

    "runtimeResponseExecutedByCertification",

    "providerRetriedByCertification",

    "recoveryExecutedByCertification",

    "failoverExecutedByCertification",

    "runtimeStoppedByCertification",

    "escalationDispatchedByCertification",

    "providerSdkCalled",

    "providerApiCalled",

    "providerExecutionInvoked",

    "providerErrorResanitized",

    "sanitizedFailureSurfaceAltered",

    "runtimeResponseReplaced",

    "executionResultAltered",

    "evidencePersisted",

    "evidenceWritten",

    "ledgerWritten",

    "auditPerformed",

  ];

  for (const field of forbiddenFields) {

    assert(
      !(field in value),
      `cross-layer field not exposed: ${field}`
    );

  }

}


function assertCertified(
  result:
    ProviderRuntimeExecutionOutcomeCertificationResult,
  expectedOutcome:
    ProviderRuntimeCertifiedExecutionOutcome,
  label:
    string
): void {

  assert.equal(
    result.certificationStatus,
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFIED",
    `${label} certification status`
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertificationAttempted,
    true,
    `${label} certification attempted`
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertified,
    true,
    `${label} outcome certified`
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertificationDenied,
    false,
    `${label} certification not denied`
  );

  assert.equal(
    result.certificationDenialReason,
    undefined,
    `${label} exposes no denial reason`
  );

  assert.equal(
    result.certificationFailureReason,
    undefined,
    `${label} exposes no failure reason`
  );

  assert.equal(
    result.certifiedExecutionOutcome,
    expectedOutcome,
    `${label} certified outcome preserved`
  );

  assert(
    result.executionEvidence,
    `${label} execution evidence composed`
  );

  assert.equal(
    result.executionEvidence?.certifiedExecutionOutcome,
    expectedOutcome,
    `${label} evidence outcome preserved`
  );

}


function assertNotCertified(
  result:
    ProviderRuntimeExecutionOutcomeCertificationResult,
  expectedReason:
    ProviderRuntimeExecutionOutcomeCertificationResult["certificationFailureReason"],
  summaryToken:
    string,
  label:
    string
): void {

  assert.equal(
    result.certificationStatus,
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME_NOT_CERTIFIED",
    `${label} not certified status`
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertificationAttempted,
    true,
    `${label} certification attempted`
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertified,
    false,
    `${label} outcome not certified`
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertificationDenied,
    false,
    `${label} is not certification denial`
  );

  assert.equal(
    result.certificationFailureReason,
    expectedReason,
    `${label} failure reason preserved`
  );

  assert.equal(
    result.certifiedExecutionOutcome,
    undefined,
    `${label} exposes no certified outcome`
  );

  assert.equal(
    result.executionEvidence,
    undefined,
    `${label} composes no execution evidence`
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
  "kms-key-runtime-certification";

const providerConfigurationRef =
  "cfg/aws-kms-prod";

const providerCredentialRef =
  "cred/aws-kms-prod";

const executionMetadata = {

  tenantId:
    "tenant-001",

  runtimeBatchId:
    "runtime-certification-001",

};


// ============================================================
// EXECUTION FIXTURES
// ============================================================

function buildExecutedResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): ProviderRuntimeResponseExecutionResult {

  const retryExecuted =
    runtimeResponse ===
      "RETRY";

  const recoveryExecuted =
    runtimeResponse ===
      "RECOVER";

  const failoverExecuted =
    runtimeResponse ===
      "FAILOVER";

  const stopExecuted =
    runtimeResponse ===
      "STOP";

  const escalationDispatched =
    runtimeResponse ===
      "ESCALATE";

  const runtimeInterventionNotRequired =
    runtimeResponse ===
      "NO_ACTION";

  return {

    responseExecutionStatus:
      "PROVIDER_RUNTIME_RESPONSE_EXECUTED",

    responseExecution:
      "EXECUTE_PROVIDER_RUNTIME_RESPONSE",

    runtimeResponseExecutionAttempted:
      true,

    runtimeResponseExecuted:
      true,

    runtimeResponseExecutionDenied:
      false,

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    verificationStatus:
      runtimeResponse === "NO_ACTION"
        ? "PROVIDER_RUNTIME_VERIFIED"
        : "PROVIDER_RUNTIME_NOT_VERIFIED",

    verificationFailureReason:
      runtimeResponse === "NO_ACTION"
        ? undefined
        : runtimeResponse === "RECOVER"
          ? "PROVIDER_EXECUTION_NOT_COMPLETED"
          : "PROVIDER_FAILURE_SURFACE_PRESENT",

    classificationStatus:
      runtimeResponse === "NO_ACTION"
        ? "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED"
        : "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",

    runtimeFailureClass:
      runtimeResponse === "NO_ACTION"
        ? undefined
        : failureClassForResponse(
            runtimeResponse
          ),

    runtimeFailureSeverity:
      runtimeResponse === "NO_ACTION"
        ? undefined
        : "HIGH",

    failureCode:
      runtimeResponse === "RETRY"
        ? "PROVIDER_CALL_TIMEOUT"
        : undefined,

    providerRawStatus:
      runtimeResponse === "NO_ACTION"
        ? "KMS_SUCCESS"
        : "KMS_ERROR",

    providerRawErrorCode:
      runtimeResponse === "NO_ACTION"
        ? undefined
        : rawErrorCodeForResponse(
            runtimeResponse
          ),

    providerSanitizedErrorMessage:
      runtimeResponse === "NO_ACTION"
        ? undefined
        : "provider runtime failure classified",

    retryable:
      runtimeResponse === "RETRY"
        ? true
        : runtimeResponse === "NO_ACTION"
          ? undefined
          : false,

    recoveryIntakeRequired:
      runtimeResponse !== "NO_ACTION",

    recoveryIntakeReady:
      runtimeResponse === "RECOVER" ||
      runtimeResponse === "FAILOVER",

    recoveryReason:
      runtimeResponse === "RECOVER" ||
      runtimeResponse === "FAILOVER"
        ? "PROVIDER_FAILURE_SURFACE_PRESENT"
        : undefined,

    runtimeResponse,

    runtimeInterventionNotRequired,

    retryExecuted,

    recoveryExecuted,

    failoverExecuted,

    stopExecuted,

    escalationDispatched,

    responseDecisionSummary: [
      "provider_runtime_response_decided",
      runtimeResponse.toLowerCase(),
    ],

    executorSummary:
      runtimeResponse === "NO_ACTION"
        ? undefined
        : [
            "provider_runtime_response_executor_completed",
            `${runtimeResponse.toLowerCase()}_completed`,
          ],

    summary: [
      "provider_runtime_response_decided",
      runtimeResponse.toLowerCase(),
      "provider_runtime_response_executed",
      `${runtimeResponse.toLowerCase()}_executed`,
    ],

  } as unknown as ProviderRuntimeResponseExecutionResult;

}


function buildFailedResponse(
  runtimeResponse:
    Exclude<
      ProviderRuntimeResponse,
      "NO_ACTION"
    >
): ProviderRuntimeResponseExecutionResult {

  const base =
    buildExecutedResponse(
      runtimeResponse
    );

  return {

    ...base,

    responseExecutionStatus:
      "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",

    runtimeResponseExecutionAttempted:
      true,

    runtimeResponseExecuted:
      false,

    runtimeResponseExecutionDenied:
      false,

    responseExecutionFailureReason:
      "RUNTIME_RESPONSE_EXECUTION_FAILED",

    retryExecuted:
      false,

    recoveryExecuted:
      false,

    failoverExecuted:
      false,

    stopExecuted:
      false,

    escalationDispatched:
      false,

    executorSummary: [
      "provider_runtime_response_executor_failed",
      `${runtimeResponse.toLowerCase()}_failed`,
      "executor_failure_contained",
    ],

    summary: [
      ...base.responseDecisionSummary,
      "provider_runtime_response_not_executed",
      "runtime_response_execution_failed",
      "executor_failure_contained",
    ],

  } as unknown as ProviderRuntimeResponseExecutionResult;

}


function buildExecutionDenied():
  ProviderRuntimeResponseExecutionResult {

  const base =
    buildExecutedResponse(
      "RETRY"
    );

  return {

    ...base,

    responseExecutionStatus:
      "PROVIDER_RUNTIME_RESPONSE_EXECUTION_DENIED",

    runtimeResponseExecutionAttempted:
      false,

    runtimeResponseExecuted:
      false,

    runtimeResponseExecutionDenied:
      true,

    retryExecuted:
      false,

    executorSummary:
      undefined,

    summary: [
      ...base.responseDecisionSummary,
      "provider_runtime_response_execution_denied",
      "runtime_response_execution_not_allowed",
    ],

  } as unknown as ProviderRuntimeResponseExecutionResult;

}


function failureClassForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): string | undefined {

  switch (runtimeResponse) {

    case "RETRY":
      return "PROVIDER_TIMEOUT_FAILURE";

    case "RECOVER":
      return "PROVIDER_EXECUTION_INCOMPLETE_FAILURE";

    case "FAILOVER":
      return "PROVIDER_UNAVAILABLE_FAILURE";

    case "STOP":
      return "PROVIDER_CONFIGURATION_FAILURE";

    case "ESCALATE":
      return "PROVIDER_AUTHORIZATION_FAILURE";

    case "NO_ACTION":
      return undefined;

  }

}


function rawErrorCodeForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): string | undefined {

  switch (runtimeResponse) {

    case "RETRY":
      return "TimeoutException";

    case "RECOVER":
      return "ProviderExecutionIncomplete";

    case "FAILOVER":
      return "ServiceUnavailable";

    case "STOP":
      return "InvalidConfiguration";

    case "ESCALATE":
      return "AccessDeniedException";

    case "NO_ACTION":
      return undefined;

  }

}


// ============================================================
// INPUT BUILDER
// ============================================================

function buildInput(
  execution:
    ProviderRuntimeResponseExecutionResult,
  overrides?:
    Partial<ProviderRuntimeExecutionOutcomeCertificationInput>
): ProviderRuntimeExecutionOutcomeCertificationInput {

  return {

    execution,

    certification:
      "CERTIFY_PROVIDER_RUNTIME_EXECUTION_OUTCOME",

    ...overrides,

  };

}


// ============================================================
// SCENARIO 1 — CERTIFICATION REJECTED
// ============================================================

function runCertificationRejectedScenario(): void {

  const result =
    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        buildExecutedResponse(
          "RETRY"
        ),
        {

          certification:
            "REJECT_PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFICATION",

        }
      )
    );

  assert.equal(
    result.certificationStatus,
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_DENIED"
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertificationAttempted,
    false
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertified,
    false
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertificationDenied,
    true
  );

  assert.equal(
    result.certificationDenialReason,
    "RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_NOT_ALLOWED"
  );

  assert.equal(
    result.executionEvidence,
    undefined
  );

  assert(
    result.summary.includes(
      "runtime_execution_outcome_certification_not_allowed"
    )
  );

  pass("certification rejected");
  pass("certification rejection reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 2 — P9O EXECUTION DENIED
// ============================================================

function runExecutionDeniedScenario(): void {

  const result =
    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        buildExecutionDenied()
      )
    );

  assert.equal(
    result.certificationStatus,
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_DENIED"
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertificationAttempted,
    false
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertificationDenied,
    true
  );

  assert.equal(
    result.certificationDenialReason,
    "RUNTIME_RESPONSE_EXECUTION_DENIED"
  );

  assert.equal(
    result.executionEvidence,
    undefined
  );

  pass("P9O execution denied blocks certification");
  pass("P9O execution denial reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — SUCCESSFUL OUTCOME FAMILY
// ============================================================

function runSuccessfulOutcomeFamily(): void {

  const scenarios: Array<[
    ProviderRuntimeResponse,
    ProviderRuntimeCertifiedExecutionOutcome,
  ]> = [

    [
      "NO_ACTION",
      "NO_ACTION_COMPLETED",
    ],

    [
      "RETRY",
      "RETRY_COMPLETED",
    ],

    [
      "RECOVER",
      "RECOVERY_COMPLETED",
    ],

    [
      "FAILOVER",
      "FAILOVER_COMPLETED",
    ],

    [
      "STOP",
      "STOP_COMPLETED",
    ],

    [
      "ESCALATE",
      "ESCALATION_COMPLETED",
    ],

  ];

  for (
    const [
      runtimeResponse,
      expectedOutcome,
    ]
    of scenarios
  ) {

    const result =
      certifyProviderRuntimeExecutionOutcome(
        buildInput(
          buildExecutedResponse(
            runtimeResponse
          )
        )
      );

    assertCertified(
      result,
      expectedOutcome,
      runtimeResponse
    );

    assert.equal(
      result.executionEvidence?.executorFailureContained,
      false,
      `${runtimeResponse} is not contained executor failure`
    );

    pass(
      `${expectedOutcome} certified`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 4 — CONTAINED FAILURE OUTCOME FAMILY
// ============================================================

function runContainedFailureOutcomeFamily(): void {

  const scenarios: Array<[
    Exclude<
      ProviderRuntimeResponse,
      "NO_ACTION"
    >,
    ProviderRuntimeCertifiedExecutionOutcome,
  ]> = [

    [
      "RETRY",
      "RETRY_FAILED",
    ],

    [
      "RECOVER",
      "RECOVERY_FAILED",
    ],

    [
      "FAILOVER",
      "FAILOVER_FAILED",
    ],

    [
      "STOP",
      "STOP_FAILED",
    ],

    [
      "ESCALATE",
      "ESCALATION_FAILED",
    ],

  ];

  for (
    const [
      runtimeResponse,
      expectedOutcome,
    ]
    of scenarios
  ) {

    const result =
      certifyProviderRuntimeExecutionOutcome(
        buildInput(
          buildFailedResponse(
            runtimeResponse
          )
        )
      );

    assertCertified(
      result,
      expectedOutcome,
      runtimeResponse
    );

    assert.equal(
      result.executionEvidence?.executorFailureContained,
      true,
      `${runtimeResponse} executor failure contained`
    );

    assert(
      result.executionEvidence?.executorSummary?.includes(
        "executor_failure_contained"
      ),
      `${runtimeResponse} executor failure summary preserved`
    );

    pass(
      `${expectedOutcome} certified`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 5 — CONTEXT INCOHERENCE
// ============================================================

function runContextIncoherenceScenarios(): void {

  const scenarios: Array<[
    string,
    ProviderRuntimeResponseExecutionResult,
  ]> = [

    [
      "provider contract absent",
      {
        ...buildExecutedResponse(
          "RETRY"
        ),
        providerContract:
          "",
      } as ProviderRuntimeResponseExecutionResult,
    ],

    [
      "provider implementation absent",
      {
        ...buildExecutedResponse(
          "RETRY"
        ),
        providerImplementation:
          "",
      } as ProviderRuntimeResponseExecutionResult,
    ],

    [
      "operation absent",
      {
        ...buildExecutedResponse(
          "RETRY"
        ),
        operation:
          "",
      } as ProviderRuntimeResponseExecutionResult,
    ],

    [
      "response decision summary invalid",
      {
        ...buildExecutedResponse(
          "RETRY"
        ),
        responseDecisionSummary:
          undefined,
      } as unknown as ProviderRuntimeResponseExecutionResult,
    ],

    [
      "response execution summary invalid",
      {
        ...buildExecutedResponse(
          "RETRY"
        ),
        summary:
          undefined,
      } as unknown as ProviderRuntimeResponseExecutionResult,
    ],

  ];

  for (
    const [
      label,
      execution,
    ]
    of scenarios
  ) {

    const result =
      certifyProviderRuntimeExecutionOutcome(
        buildInput(
          execution
        )
      );

    assertNotCertified(
      result,
      "RUNTIME_RESPONSE_EXECUTION_CONTEXT_INCOHERENT",
      "runtime_response_execution_context_incoherent",
      label
    );

    pass(
      `${label} rejected`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 6 — EXECUTION STATE INCOHERENCE
// ============================================================

function runExecutionStateIncoherenceScenarios(): void {

  const retry =
    buildExecutedResponse(
      "RETRY"
    );

  const noAction =
    buildExecutedResponse(
      "NO_ACTION"
    );

  const failedRetry =
    buildFailedResponse(
      "RETRY"
    );

  const scenarios: Array<[
    string,
    ProviderRuntimeResponseExecutionResult,
  ]> = [

    [
      "multiple execution flags",
      {
        ...retry,
        recoveryExecuted:
          true,
      } as ProviderRuntimeResponseExecutionResult,
    ],

    [
      "execution flag mismatches selected response",
      {
        ...retry,
        retryExecuted:
          false,
        recoveryExecuted:
          true,
      } as ProviderRuntimeResponseExecutionResult,
    ],

    [
      "NO_ACTION exposes executor flag",
      {
        ...noAction,
        retryExecuted:
          true,
      } as ProviderRuntimeResponseExecutionResult,
    ],

    [
      "executed status without executed flag",
      {
        ...retry,
        runtimeResponseExecuted:
          false,
      } as ProviderRuntimeResponseExecutionResult,
    ],

    [
      "executed status without attempt",
      {
        ...retry,
        runtimeResponseExecutionAttempted:
          false,
      } as ProviderRuntimeResponseExecutionResult,
    ],

    [
      "executed status with denial flag",
      {
        ...retry,
        runtimeResponseExecutionDenied:
          true,
      } as ProviderRuntimeResponseExecutionResult,
    ],

    [
      "not-executed state with execution flag",
      {
        ...failedRetry,
        retryExecuted:
          true,
      } as ProviderRuntimeResponseExecutionResult,
    ],

    [
      "not-executed state without attempt",
      {
        ...failedRetry,
        runtimeResponseExecutionAttempted:
          false,
      } as ProviderRuntimeResponseExecutionResult,
    ],

  ];

  for (
    const [
      label,
      execution,
    ]
    of scenarios
  ) {

    const result =
      certifyProviderRuntimeExecutionOutcome(
        buildInput(
          execution
        )
      );

    assertNotCertified(
      result,
      "RUNTIME_RESPONSE_EXECUTION_STATE_INCOHERENT",
      "runtime_response_execution_state_incoherent",
      label
    );

    pass(
      `${label} rejected`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 7 — EVIDENCE INSUFFICIENCY
// ============================================================

function runEvidenceInsufficiencyScenarios(): void {

  const failedRetry =
    buildFailedResponse(
      "RETRY"
    );

  const missingResponse = {

    ...failedRetry,

    runtimeResponse:
      undefined,

  } as unknown as ProviderRuntimeResponseExecutionResult;

  const failedWithoutCanonicalReason = {

    ...failedRetry,

    responseExecutionFailureReason:
      undefined,

  } as ProviderRuntimeResponseExecutionResult;

  const failedWithoutExecutorSummary = {

    ...failedRetry,

    executorSummary:
      undefined,

  } as ProviderRuntimeResponseExecutionResult;

  const scenarios: Array<[
    string,
    ProviderRuntimeResponseExecutionResult,
  ]> = [

    [
      "runtime response absent",
      missingResponse,
    ],

    [
      "failed execution without canonical failure reason",
      failedWithoutCanonicalReason,
    ],

    [
      "contained failure without executor summary",
      failedWithoutExecutorSummary,
    ],

  ];

  for (
    const [
      label,
      execution,
    ]
    of scenarios
  ) {

    const result =
      certifyProviderRuntimeExecutionOutcome(
        buildInput(
          execution
        )
      );

    assertNotCertified(
      result,
      "RUNTIME_RESPONSE_EXECUTION_EVIDENCE_INSUFFICIENT",
      "runtime_response_execution_evidence_insufficient",
      label
    );

    pass(
      `${label} rejected as insufficient evidence`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 8 — EVIDENCE COMPOSITION
// ============================================================

function runEvidenceCompositionChecks(): void {

  const execution =
    buildFailedResponse(
      "RECOVER"
    );

  const originalResponseDecisionSummary = [
    ...execution.responseDecisionSummary,
  ];

  const originalExecutorSummary = [
    ...(execution.executorSummary ?? []),
  ];

  const originalExecutionSummary = [
    ...execution.summary,
  ];

  const result =
    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        execution
      )
    );

  assertCertified(
    result,
    "RECOVERY_FAILED",
    "evidence composition"
  );

  const evidence =
    result.executionEvidence;

  assert(
    evidence,
    "execution evidence exists"
  );

  assert.equal(
    evidence.providerContract,
    execution.providerContract
  );

  assert.equal(
    evidence.providerImplementation,
    execution.providerImplementation
  );

  assert.equal(
    evidence.operation,
    execution.operation
  );

  assert.equal(
    evidence.providerResourceId,
    execution.providerResourceId
  );

  assert.equal(
    evidence.providerConfigurationRef,
    execution.providerConfigurationRef
  );

  assert.equal(
    evidence.providerCredentialRef,
    execution.providerCredentialRef
  );

  assert.deepEqual(
    evidence.executionMetadata,
    execution.executionMetadata
  );

  assert.equal(
    evidence.verificationStatus,
    execution.verificationStatus
  );

  assert.equal(
    evidence.verificationFailureReason,
    execution.verificationFailureReason
  );

  assert.equal(
    evidence.classificationStatus,
    execution.classificationStatus
  );

  assert.equal(
    evidence.runtimeFailureClass,
    execution.runtimeFailureClass
  );

  assert.equal(
    evidence.runtimeFailureSeverity,
    execution.runtimeFailureSeverity
  );

  assert.equal(
    evidence.failureCode,
    execution.failureCode
  );

  assert.equal(
    evidence.providerRawStatus,
    execution.providerRawStatus
  );

  assert.equal(
    evidence.providerRawErrorCode,
    execution.providerRawErrorCode
  );

  assert.equal(
    evidence.providerSanitizedErrorMessage,
    execution.providerSanitizedErrorMessage
  );

  assert.equal(
    evidence.retryable,
    execution.retryable
  );

  assert.equal(
    evidence.recoveryIntakeRequired,
    execution.recoveryIntakeRequired
  );

  assert.equal(
    evidence.recoveryIntakeReady,
    execution.recoveryIntakeReady
  );

  assert.equal(
    evidence.recoveryReason,
    execution.recoveryReason
  );

  assert.equal(
    evidence.runtimeResponse,
    execution.runtimeResponse
  );

  assert.equal(
    evidence.responseExecutionStatus,
    execution.responseExecutionStatus
  );

  assert.equal(
    evidence.runtimeResponseExecutionAttempted,
    execution.runtimeResponseExecutionAttempted
  );

  assert.equal(
    evidence.runtimeResponseExecuted,
    execution.runtimeResponseExecuted
  );

  assert.equal(
    evidence.runtimeInterventionNotRequired,
    execution.runtimeInterventionNotRequired
  );

  assert.equal(
    evidence.retryExecuted,
    execution.retryExecuted
  );

  assert.equal(
    evidence.recoveryExecuted,
    execution.recoveryExecuted
  );

  assert.equal(
    evidence.failoverExecuted,
    execution.failoverExecuted
  );

  assert.equal(
    evidence.stopExecuted,
    execution.stopExecuted
  );

  assert.equal(
    evidence.escalationDispatched,
    execution.escalationDispatched
  );

  assert.deepEqual(
    evidence.responseDecisionSummary,
    execution.responseDecisionSummary
  );

  assert.deepEqual(
    evidence.executorSummary,
    execution.executorSummary
  );

  assert.deepEqual(
    evidence.responseExecutionSummary,
    execution.summary
  );

  assert.notEqual(
    evidence.responseDecisionSummary,
    execution.responseDecisionSummary,
    "response decision summary copied"
  );

  assert.notEqual(
    evidence.executorSummary,
    execution.executorSummary,
    "executor summary copied"
  );

  assert.notEqual(
    evidence.responseExecutionSummary,
    execution.summary,
    "response execution summary copied"
  );

  assert.deepEqual(
    execution.responseDecisionSummary,
    originalResponseDecisionSummary,
    "response decision summary not mutated"
  );

  assert.deepEqual(
    execution.executorSummary,
    originalExecutorSummary,
    "executor summary not mutated"
  );

  assert.deepEqual(
    execution.summary,
    originalExecutionSummary,
    "execution summary not mutated"
  );

  assert(
    result.summary.includes(
      "provider_runtime_execution_outcome_certified"
    )
  );

  assert(
    result.summary.includes(
      "recovery_failed"
    )
  );

  pass("provider/runtime context propagated");
  pass("verification context propagated");
  pass("classification context propagated");
  pass("failure context propagated");
  pass("recovery context propagated");
  pass("P9N-selected response preserved");
  pass("P9O execution state preserved");
  pass("response decision summary copied");
  pass("executor summary copied");
  pass("response execution summary copied");
  pass("source summaries not mutated");
  pass("certification summary composed");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    evidence as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 9 — RESULT CONTEXT PROPAGATION
// ============================================================

function runResultContextPropagationChecks(): void {

  const execution =
    buildExecutedResponse(
      "FAILOVER"
    );

  const result =
    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        execution
      )
    );

  assert.equal(
    result.providerContract,
    execution.providerContract
  );

  assert.equal(
    result.providerImplementation,
    execution.providerImplementation
  );

  assert.equal(
    result.operation,
    execution.operation
  );

  assert.equal(
    result.providerResourceId,
    execution.providerResourceId
  );

  assert.equal(
    result.providerConfigurationRef,
    execution.providerConfigurationRef
  );

  assert.equal(
    result.providerCredentialRef,
    execution.providerCredentialRef
  );

  assert.deepEqual(
    result.executionMetadata,
    execution.executionMetadata
  );

  assert.equal(
    result.verificationStatus,
    execution.verificationStatus
  );

  assert.equal(
    result.verificationFailureReason,
    execution.verificationFailureReason
  );

  assert.equal(
    result.classificationStatus,
    execution.classificationStatus
  );

  assert.equal(
    result.runtimeFailureClass,
    execution.runtimeFailureClass
  );

  assert.equal(
    result.runtimeFailureSeverity,
    execution.runtimeFailureSeverity
  );

  assert.equal(
    result.failureCode,
    execution.failureCode
  );

  assert.equal(
    result.providerRawStatus,
    execution.providerRawStatus
  );

  assert.equal(
    result.providerRawErrorCode,
    execution.providerRawErrorCode
  );

  assert.equal(
    result.providerSanitizedErrorMessage,
    execution.providerSanitizedErrorMessage
  );

  assert.equal(
    result.retryable,
    execution.retryable
  );

  assert.equal(
    result.recoveryIntakeRequired,
    execution.recoveryIntakeRequired
  );

  assert.equal(
    result.recoveryIntakeReady,
    execution.recoveryIntakeReady
  );

  assert.equal(
    result.recoveryReason,
    execution.recoveryReason
  );

  assert.equal(
    result.runtimeResponse,
    execution.runtimeResponse
  );

  assert.equal(
    result.responseExecutionStatus,
    execution.responseExecutionStatus
  );

  assert.equal(
    result.runtimeResponseExecutionAttempted,
    execution.runtimeResponseExecutionAttempted
  );

  assert.equal(
    result.runtimeResponseExecuted,
    execution.runtimeResponseExecuted
  );

  assert.equal(
    result.runtimeInterventionNotRequired,
    execution.runtimeInterventionNotRequired
  );

  assert.equal(
    result.retryExecuted,
    execution.retryExecuted
  );

  assert.equal(
    result.recoveryExecuted,
    execution.recoveryExecuted
  );

  assert.equal(
    result.failoverExecuted,
    execution.failoverExecuted
  );

  assert.equal(
    result.stopExecuted,
    execution.stopExecuted
  );

  assert.equal(
    result.escalationDispatched,
    execution.escalationDispatched
  );

  assert.deepEqual(
    result.responseDecisionSummary,
    execution.responseDecisionSummary
  );

  assert.deepEqual(
    result.executorSummary,
    execution.executorSummary
  );

  assert.deepEqual(
    result.responseExecutionSummary,
    execution.summary
  );

  pass("certification result context propagation verified");

}


// ============================================================
// SCENARIO 10 — BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const results = [

    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        buildExecutedResponse(
          "NO_ACTION"
        )
      )
    ),

    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        buildExecutedResponse(
          "RETRY"
        )
      )
    ),

    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        buildFailedResponse(
          "RECOVER"
        )
      )
    ),

    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        buildExecutedResponse(
          "FAILOVER"
        )
      )
    ),

    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        buildFailedResponse(
          "STOP"
        )
      )
    ),

    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        buildExecutedResponse(
          "ESCALATE"
        )
      )
    ),

  ];

  for (const result of results) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

    if (result.executionEvidence) {

      assertNoCrossLayerFields(
        result.executionEvidence as unknown as Record<string, unknown>
      );

    }

  }

  pass("P9P certification boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runCertificationRejectedScenario();

  runExecutionDeniedScenario();

  runSuccessfulOutcomeFamily();

  runContainedFailureOutcomeFamily();

  runContextIncoherenceScenarios();

  runExecutionStateIncoherenceScenarios();

  runEvidenceInsufficiencyScenarios();

  runEvidenceCompositionChecks();

  runResultContextPropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9P PROVIDER RUNTIME EXECUTION OUTCOME CERTIFICATION");
  console.log("========================================");
  console.log("");

  console.log("Certification Gates:");
  console.log("✓ certification rejected → DENIED");
  console.log("✓ denied P9O execution → DENIED");

  console.log("");
  console.log("Successful Outcome Family:");
  console.log("✓ NO_ACTION → NO_ACTION_COMPLETED");
  console.log("✓ RETRY → RETRY_COMPLETED");
  console.log("✓ RECOVER → RECOVERY_COMPLETED");
  console.log("✓ FAILOVER → FAILOVER_COMPLETED");
  console.log("✓ STOP → STOP_COMPLETED");
  console.log("✓ ESCALATE → ESCALATION_COMPLETED");

  console.log("");
  console.log("Contained Failure Outcome Family:");
  console.log("✓ RETRY failure → RETRY_FAILED");
  console.log("✓ RECOVER failure → RECOVERY_FAILED");
  console.log("✓ FAILOVER failure → FAILOVER_FAILED");
  console.log("✓ STOP failure → STOP_FAILED");
  console.log("✓ ESCALATE failure → ESCALATION_FAILED");

  console.log("");
  console.log("Coherence Gates:");
  console.log("✓ provider/runtime context required");
  console.log("✓ response decision summary shape required");
  console.log("✓ response execution summary shape required");
  console.log("✓ execution flag exclusivity");
  console.log("✓ execution flag matches selected response");
  console.log("✓ NO_ACTION exposes no executor flag");
  console.log("✓ executed state requires attempt and completion");
  console.log("✓ not-executed state exposes no execution flag");

  console.log("");
  console.log("Evidence Sufficiency:");
  console.log("✓ runtime response required");
  console.log("✓ failed outcome requires canonical execution failure reason");
  console.log("✓ contained failure requires executor summary");

  console.log("");
  console.log("Evidence Composition:");
  console.log("✓ canonical execution evidence composed");
  console.log("✓ provider/runtime context preserved");
  console.log("✓ verification context preserved");
  console.log("✓ classification context preserved");
  console.log("✓ failure context preserved");
  console.log("✓ recovery context preserved");
  console.log("✓ P9N-selected response preserved");
  console.log("✓ P9O execution state preserved");
  console.log("✓ response decision summary copied");
  console.log("✓ executor summary copied");
  console.log("✓ response execution summary copied");
  console.log("✓ source summaries not mutated");
  console.log("✓ executor failure containment certified");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime verification");
  console.log("✓ no runtime failure classification");
  console.log("✓ no runtime response decision");
  console.log("✓ no runtime response execution");
  console.log("✓ no governed executor invocation");
  console.log("✓ no provider API / SDK calls");
  console.log("✓ no provider-error re-sanitization");
  console.log("✓ no sanitized failure-surface alteration");
  console.log("✓ no response replacement");
  console.log("✓ no P9O result alteration");
  console.log("✓ no evidence persistence");
  console.log("✓ no ledger write");
  console.log("✓ no audit");

  console.log("");
  console.log("========================================");
  console.log("P9P.1 PROVIDER RUNTIME EXECUTION OUTCOME CERTIFICATION VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();