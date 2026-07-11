// ============================================================
// PlannerAgent — Provider Runtime Execution Outcome Certification Family Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9P.provider.runtime.family.runner.ts
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
// P9P — Provider Runtime Execution Outcome Certification Family Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9P execution-outcome certification family boundary.
//
// Chain verified:
//
// P9O produces governed runtime execution outcome.
// ↓
// P9P certifies canonical execution outcome.
//
// P9P certifies:
//
// - successful NO_ACTION outcome
// - successful RETRY outcome
// - successful RECOVER outcome
// - successful FAILOVER outcome
// - successful STOP outcome
// - successful ESCALATE outcome
// - contained executor failure outcomes
//
// P9P does not:
//
// - verify runtime
// - classify runtime failure
// - decide runtime response
// - execute runtime response
// - invoke governed executors
// - call provider SDKs or APIs
// - persist evidence
// - write ledger
// - perform audit
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

    "governedExecutorInvoked",

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


function assertCertificationDenied(
  result:
    ProviderRuntimeExecutionOutcomeCertificationResult,
  expectedReason:
    ProviderRuntimeExecutionOutcomeCertificationResult["certificationDenialReason"],
  label:
    string
): void {

  assert.equal(
    result.certificationStatus,
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_DENIED",
    `${label} certification denied`
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertificationAttempted,
    false,
    `${label} certification not attempted`
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertified,
    false,
    `${label} outcome not certified`
  );

  assert.equal(
    result.runtimeExecutionOutcomeCertificationDenied,
    true,
    `${label} denial flag preserved`
  );

  assert.equal(
    result.certificationDenialReason,
    expectedReason,
    `${label} denial reason preserved`
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
  "kms-key-runtime-certification-family";

const providerConfigurationRef =
  "cfg/aws-kms-prod";

const providerCredentialRef =
  "cred/aws-kms-prod";

const executionMetadata = {

  tenantId:
    "tenant-001",

  runtimeBatchId:
    "runtime-certification-family-001",

};


// ============================================================
// EXECUTION SUPPORT
// ============================================================

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


function failureSeverityForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): "MEDIUM" | "HIGH" | undefined {

  switch (runtimeResponse) {

    case "RETRY":
    case "RECOVER":
      return "MEDIUM";

    case "FAILOVER":
    case "STOP":
    case "ESCALATE":
      return "HIGH";

    case "NO_ACTION":
      return undefined;

  }

}


function failureCodeForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): string | undefined {

  switch (runtimeResponse) {

    case "RETRY":
      return "PROVIDER_CALL_TIMEOUT";

    case "ESCALATE":
      return "PROVIDER_CALL_UNAUTHORIZED";

    default:
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
// P9O EXECUTION FIXTURES
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
      runtimeResponse ===
        "NO_ACTION"
        ? "PROVIDER_RUNTIME_VERIFIED"
        : "PROVIDER_RUNTIME_NOT_VERIFIED",

    verificationFailureReason:
      runtimeResponse ===
        "NO_ACTION"
        ? undefined
        : runtimeResponse ===
            "RECOVER"
          ? "PROVIDER_EXECUTION_NOT_COMPLETED"
          : "PROVIDER_FAILURE_SURFACE_PRESENT",

    classificationStatus:
      runtimeResponse ===
        "NO_ACTION"
        ? "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED"
        : "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",

    runtimeFailureClass:
      failureClassForResponse(
        runtimeResponse
      ),

    runtimeFailureSeverity:
      failureSeverityForResponse(
        runtimeResponse
      ),

    failureCode:
      failureCodeForResponse(
        runtimeResponse
      ),

    providerRawStatus:
      runtimeResponse ===
        "NO_ACTION"
        ? "KMS_SUCCESS"
        : "KMS_ERROR",

    providerRawErrorCode:
      rawErrorCodeForResponse(
        runtimeResponse
      ),

    providerSanitizedErrorMessage:
      runtimeResponse ===
        "NO_ACTION"
        ? undefined
        : "provider runtime failure classified",

    retryable:
      runtimeResponse ===
        "RETRY"
        ? true
        : runtimeResponse ===
            "NO_ACTION"
          ? undefined
          : false,

    recoveryIntakeRequired:
      runtimeResponse !==
        "NO_ACTION",

    recoveryIntakeReady:
      runtimeResponse ===
        "RECOVER" ||
      runtimeResponse ===
        "FAILOVER",

    recoveryReason:
      runtimeResponse ===
        "RECOVER" ||
      runtimeResponse ===
        "FAILOVER"
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
      runtimeResponse ===
        "NO_ACTION"
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
// SCENARIO A — SUCCESSFUL OUTCOME FAMILY
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

    const execution =
      buildExecutedResponse(
        runtimeResponse
      );

    const result =
      certifyProviderRuntimeExecutionOutcome(
        buildInput(
          execution
        )
      );

    assertCertified(
      result,
      expectedOutcome,
      runtimeResponse
    );

    assert.equal(
      result.runtimeResponse,
      runtimeResponse,
      `${runtimeResponse} selected response preserved`
    );

    assert.equal(
      result.responseExecutionStatus,
      "PROVIDER_RUNTIME_RESPONSE_EXECUTED",
      `${runtimeResponse} P9O executed state preserved`
    );

    assert.equal(
      result.executionEvidence?.executorFailureContained,
      false,
      `${runtimeResponse} is not contained executor failure`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

    pass(
      `${expectedOutcome} family member verified`
    );

  }

}


// ============================================================
// SCENARIO B — CONTAINED FAILURE OUTCOME FAMILY
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

    const execution =
      buildFailedResponse(
        runtimeResponse
      );

    const result =
      certifyProviderRuntimeExecutionOutcome(
        buildInput(
          execution
        )
      );

    assertCertified(
      result,
      expectedOutcome,
      runtimeResponse
    );

    assert.equal(
      result.responseExecutionStatus,
      "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",
      `${runtimeResponse} contained failure state preserved`
    );

    assert.equal(
      result.runtimeResponseExecuted,
      false,
      `${runtimeResponse} unsuccessful execution preserved`
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

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

    pass(
      `${expectedOutcome} family member verified`
    );

  }

}


// ============================================================
// SCENARIO C — CERTIFICATION GATE
// ============================================================

function runCertificationGateScenario(): void {

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

  assertCertificationDenied(
    result,
    "RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_NOT_ALLOWED",
    "certification gate"
  );

  assert(
    result.summary.includes(
      "runtime_execution_outcome_certification_not_allowed"
    ),
    "certification gate summary preserved"
  );

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

  pass(
    "certification gate precedence verified"
  );

}


// ============================================================
// SCENARIO D — P9O EXECUTION DENIED
// ============================================================

function runExecutionDeniedScenario(): void {

  const result =
    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        buildExecutionDenied()
      )
    );

  assertCertificationDenied(
    result,
    "RUNTIME_RESPONSE_EXECUTION_DENIED",
    "P9O execution denied"
  );

  assert.equal(
    result.responseExecutionStatus,
    "PROVIDER_RUNTIME_RESPONSE_EXECUTION_DENIED",
    "P9O execution denial state preserved"
  );

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

  pass(
    "P9O execution denial blocks certification"
  );

}


// ============================================================
// SCENARIO E — INCOHERENT EXECUTION NOT CERTIFIED
// ============================================================

function runIncoherentExecutionScenario(): void {

  const coherent =
    buildExecutedResponse(
      "RETRY"
    );

  const incoherent = {

    ...coherent,

    retryExecuted:
      false,

    recoveryExecuted:
      true,

  } as ProviderRuntimeResponseExecutionResult;

  const result =
    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        incoherent
      )
    );

  assertNotCertified(
    result,
    "RUNTIME_RESPONSE_EXECUTION_STATE_INCOHERENT",
    "runtime_response_execution_state_incoherent",
    "incoherent P9O execution"
  );

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

  pass(
    "incoherent P9O execution rejected"
  );

}


// ============================================================
// SCENARIO F — EVIDENCE COMPOSITION
// ============================================================

function runEvidenceCompositionChecks(): void {

  const execution =
    buildExecutedResponse(
      "RECOVER"
    );

  const sourceResponseDecisionSummary = [
    ...execution.responseDecisionSummary,
  ];

  const sourceExecutorSummary = [
    ...(execution.executorSummary ?? []),
  ];

  const sourceExecutionSummary = [
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
    "RECOVERY_COMPLETED",
    "evidence composition"
  );

  const evidence =
    result.executionEvidence;

  assert(
    evidence,
    "execution evidence composed"
  );

  assert.equal(
    evidence?.evidenceType,
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME",
    "canonical evidence type preserved"
  );

  assert.equal(
    evidence?.providerContract,
    execution.providerContract,
    "providerContract preserved in evidence"
  );

  assert.equal(
    evidence?.providerImplementation,
    execution.providerImplementation,
    "providerImplementation preserved in evidence"
  );

  assert.equal(
    evidence?.operation,
    execution.operation,
    "operation preserved in evidence"
  );

  assert.deepEqual(
    evidence?.executionMetadata,
    execution.executionMetadata,
    "executionMetadata preserved in evidence"
  );

  assert.equal(
    evidence?.verificationStatus,
    execution.verificationStatus,
    "verification status preserved in evidence"
  );

  assert.equal(
    evidence?.classificationStatus,
    execution.classificationStatus,
    "classification status preserved in evidence"
  );

  assert.equal(
    evidence?.runtimeFailureClass,
    execution.runtimeFailureClass,
    "runtime failure class preserved in evidence"
  );

  assert.equal(
    evidence?.runtimeResponse,
    execution.runtimeResponse,
    "P9N-selected response preserved in evidence"
  );

  assert.equal(
    evidence?.responseExecutionStatus,
    execution.responseExecutionStatus,
    "P9O execution status preserved in evidence"
  );

  assert.deepEqual(
    evidence?.responseDecisionSummary,
    sourceResponseDecisionSummary,
    "response decision summary copied"
  );

  assert.deepEqual(
    evidence?.executorSummary,
    sourceExecutorSummary,
    "executor summary copied"
  );

  assert.deepEqual(
    evidence?.responseExecutionSummary,
    sourceExecutionSummary,
    "response execution summary copied"
  );

  assert.notEqual(
    evidence?.responseDecisionSummary,
    execution.responseDecisionSummary,
    "response decision summary copied defensively"
  );

  assert.notEqual(
    evidence?.executorSummary,
    execution.executorSummary,
    "executor summary copied defensively"
  );

  assert.notEqual(
    evidence?.responseExecutionSummary,
    execution.summary,
    "response execution summary copied defensively"
  );

  assert.deepEqual(
    execution.responseDecisionSummary,
    sourceResponseDecisionSummary,
    "source response decision summary not mutated"
  );

  assert.deepEqual(
    execution.executorSummary,
    sourceExecutorSummary,
    "source executor summary not mutated"
  );

  assert.deepEqual(
    execution.summary,
    sourceExecutionSummary,
    "source execution summary not mutated"
  );

  assert(
    result.summary.includes(
      "provider_runtime_execution_outcome_certified"
    ),
    "terminal certification summary preserved"
  );

  assert(
    result.summary.includes(
      "recovery_completed"
    ),
    "certified outcome summary token preserved"
  );

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

  pass(
    "canonical execution evidence composition verified"
  );

  pass(
    "source summary immutability verified"
  );

}


// ============================================================
// SCENARIO G — OUTCOME EXCLUSIVITY
// ============================================================

function runOutcomeExclusivityChecks(): void {

  const successful =
    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        buildExecutedResponse(
          "FAILOVER"
        )
      )
    );

  const failed =
    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        buildFailedResponse(
          "FAILOVER"
        )
      )
    );

  assert.equal(
    successful.certifiedExecutionOutcome,
    "FAILOVER_COMPLETED",
    "successful FAILOVER outcome exclusive"
  );

  assert.equal(
    failed.certifiedExecutionOutcome,
    "FAILOVER_FAILED",
    "failed FAILOVER outcome exclusive"
  );

  assert.notEqual(
    successful.certifiedExecutionOutcome,
    failed.certifiedExecutionOutcome,
    "successful and failed outcomes remain distinct"
  );

  assert.equal(
    successful.executionEvidence?.executorFailureContained,
    false,
    "successful outcome does not claim contained executor failure"
  );

  assert.equal(
    failed.executionEvidence?.executorFailureContained,
    true,
    "failed outcome claims contained executor failure"
  );

  assertNoCrossLayerFields(
    successful as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    failed as unknown as Record<string, unknown>
  );

  pass(
    "successful and contained-failure outcome exclusivity verified"
  );

}


// ============================================================
// SCENARIO H — CONTRACT PROPAGATION
// ============================================================

function runContractPropagationChecks(): void {

  const execution =
    buildExecutedResponse(
      "ESCALATE"
    );

  const result =
    certifyProviderRuntimeExecutionOutcome(
      buildInput(
        execution
      )
    );

  assert.equal(
    result.providerContract,
    execution.providerContract,
    "providerContract propagated"
  );

  assert.equal(
    result.providerImplementation,
    execution.providerImplementation,
    "providerImplementation propagated"
  );

  assert.equal(
    result.operation,
    execution.operation,
    "operation propagated"
  );

  assert.equal(
    result.providerResourceId,
    execution.providerResourceId,
    "providerResourceId propagated"
  );

  assert.equal(
    result.providerConfigurationRef,
    execution.providerConfigurationRef,
    "providerConfigurationRef propagated"
  );

  assert.equal(
    result.providerCredentialRef,
    execution.providerCredentialRef,
    "providerCredentialRef propagated"
  );

  assert.deepEqual(
    result.executionMetadata,
    execution.executionMetadata,
    "executionMetadata propagated"
  );

  assert.equal(
    result.verificationStatus,
    execution.verificationStatus,
    "verificationStatus propagated"
  );

  assert.equal(
    result.verificationFailureReason,
    execution.verificationFailureReason,
    "verificationFailureReason propagated"
  );

  assert.equal(
    result.classificationStatus,
    execution.classificationStatus,
    "classificationStatus propagated"
  );

  assert.equal(
    result.runtimeFailureClass,
    execution.runtimeFailureClass,
    "runtimeFailureClass propagated"
  );

  assert.equal(
    result.runtimeFailureSeverity,
    execution.runtimeFailureSeverity,
    "runtimeFailureSeverity propagated"
  );

  assert.equal(
    result.failureCode,
    execution.failureCode,
    "failureCode propagated"
  );

  assert.equal(
    result.providerRawStatus,
    execution.providerRawStatus,
    "providerRawStatus propagated"
  );

  assert.equal(
    result.providerRawErrorCode,
    execution.providerRawErrorCode,
    "providerRawErrorCode propagated"
  );

  assert.equal(
    result.providerSanitizedErrorMessage,
    execution.providerSanitizedErrorMessage,
    "providerSanitizedErrorMessage propagated"
  );

  assert.equal(
    result.retryable,
    execution.retryable,
    "retryable propagated"
  );

  assert.equal(
    result.recoveryIntakeRequired,
    execution.recoveryIntakeRequired,
    "recoveryIntakeRequired propagated"
  );

  assert.equal(
    result.recoveryIntakeReady,
    execution.recoveryIntakeReady,
    "recoveryIntakeReady propagated"
  );

  assert.equal(
    result.recoveryReason,
    execution.recoveryReason,
    "recoveryReason propagated"
  );

  assert.equal(
    result.runtimeResponse,
    execution.runtimeResponse,
    "runtimeResponse propagated"
  );

  assert.equal(
    result.responseExecutionStatus,
    execution.responseExecutionStatus,
    "responseExecutionStatus propagated"
  );

  assert.equal(
    result.runtimeResponseExecutionAttempted,
    execution.runtimeResponseExecutionAttempted,
    "runtimeResponseExecutionAttempted propagated"
  );

  assert.equal(
    result.runtimeResponseExecuted,
    execution.runtimeResponseExecuted,
    "runtimeResponseExecuted propagated"
  );

  assert.equal(
    result.runtimeInterventionNotRequired,
    execution.runtimeInterventionNotRequired,
    "runtimeInterventionNotRequired propagated"
  );

  assert.equal(
    result.escalationDispatched,
    execution.escalationDispatched,
    "escalationDispatched propagated"
  );

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

  pass(
    "provider/runtime context propagation verified"
  );

  pass(
    "P9L/P9M/P9N/P9O lineage propagation verified"
  );

}


// ============================================================
// SCENARIO I — BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const results:
    ProviderRuntimeExecutionOutcomeCertificationResult[] = [

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
          buildExecutedResponse(
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
          buildExecutedResponse(
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

      certifyProviderRuntimeExecutionOutcome(
        buildInput(
          buildFailedResponse(
            "RETRY"
          )
        )
      ),

      certifyProviderRuntimeExecutionOutcome(
        buildInput(
          buildExecutionDenied()
        )
      ),

  ];

  for (const result of results) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass(
    "P9P family boundary verification completed"
  );

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runSuccessfulOutcomeFamily();

  runContainedFailureOutcomeFamily();

  runCertificationGateScenario();

  runExecutionDeniedScenario();

  runIncoherentExecutionScenario();

  runEvidenceCompositionChecks();

  runOutcomeExclusivityChecks();

  runContractPropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9P PROVIDER RUNTIME FAMILY");
  console.log("========================================");
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
  console.log("✓ RETRY → RETRY_FAILED");
  console.log("✓ RECOVER → RECOVERY_FAILED");
  console.log("✓ FAILOVER → FAILOVER_FAILED");
  console.log("✓ STOP → STOP_FAILED");
  console.log("✓ ESCALATE → ESCALATION_FAILED");

  console.log("");
  console.log("Certification Gates:");
  console.log("✓ certification gate has precedence");
  console.log("✓ denied P9O execution blocks certification");
  console.log("✓ incoherent P9O execution is not certified");

  console.log("");
  console.log("Outcome Semantics:");
  console.log("✓ successful execution and certified success remain distinct");
  console.log("✓ contained executor failure remains certifiable");
  console.log("✓ successful and failed certified outcomes remain exclusive");
  console.log("✓ P9N-selected response remains authoritative");
  console.log("✓ P9O execution state remains authoritative");

  console.log("");
  console.log("Evidence Composition:");
  console.log("✓ canonical execution evidence composed");
  console.log("✓ provider/runtime context preserved");
  console.log("✓ verification context preserved");
  console.log("✓ classification context preserved");
  console.log("✓ failure context preserved");
  console.log("✓ recovery context preserved");
  console.log("✓ response decision summary copied");
  console.log("✓ executor summary copied");
  console.log("✓ response execution summary copied");
  console.log("✓ source summaries not mutated");

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
  console.log("P9P PROVIDER RUNTIME FAMILY VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();