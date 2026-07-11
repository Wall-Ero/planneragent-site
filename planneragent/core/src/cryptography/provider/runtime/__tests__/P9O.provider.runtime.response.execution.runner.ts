// ============================================================
// PlannerAgent — Provider Runtime Response Execution Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9O.provider.runtime.response.execution.runner.ts
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
// P9O.1 — Provider Runtime Response Execution Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify P9O.1 Provider Runtime Response
// Execution contract.
//
// This runner verifies:
//
// 1. response execution rejected
// 2. P9N response decision denied
// 3. P9N response not decided
// 4. decided response missing
// 5. NO_ACTION executed explicitly
// 6. RETRY executed
// 7. RECOVER executed
// 8. FAILOVER executed
// 9. STOP executed
// 10. ESCALATE dispatched
// 11. selected executor unavailable
// 12. governed executor failure
// 13. governed executor result incoherent
// 14. exactly one executor invoked
// 15. context propagation
// 16. executor summary propagation
// 17. boundary verification
//
// P9O executes the response selected
// by P9N.
//
// P9O does not verify runtime.
//
// P9O does not classify runtime failure.
//
// P9O does not decide runtime response.
//
// P9O does not directly call provider
// SDKs or APIs.
//
// ============================================================

import assert from "node:assert/strict";

import {
  executeProviderRuntimeResponse,
} from "../P9O.provider.runtime.response.execution";

import type {
  ProviderRuntimeResponseExecutionInput,
  ProviderRuntimeResponseExecutionResult,
  ProviderRuntimeResponseExecutor,
  ProviderRuntimeResponseExecutors,
} from "../P9O.provider.runtime.response.execution";

import type {
  ProviderRuntimeResponse,
  ProviderRuntimeResponseDecisionResult,
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

    "runtimeVerifiedByResponseExecution",

    "runtimeFailureClassifiedByResponseExecution",

    "failureSeverityAssignedByResponseExecution",

    "runtimeResponseDecidedByExecution",

    "runtimeResponseReplaced",

    "runtimeResponseReclassified",

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


function assertExecutionDenied(
  result:
    ProviderRuntimeResponseExecutionResult,
  denialReason:
    ProviderRuntimeResponseExecutionResult[
      "responseExecutionDenialReason"
    ],
  label:
    string
): void {

  assert(
    result.responseExecutionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_EXECUTION_DENIED",
    `${label} execution denied status`
  );

  assert(
    result.runtimeResponseExecutionAttempted === false,
    `${label} execution not attempted`
  );

  assert(
    result.runtimeResponseExecuted === false,
    `${label} response not executed`
  );

  assert(
    result.runtimeResponseExecutionDenied === true,
    `${label} execution denial flag`
  );

  assert(
    result.responseExecutionDenialReason ===
      denialReason,
    `${label} denial reason preserved`
  );

  assertExecutionFlags(
    result,
    {
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
    },
    `${label} execution flags`
  );

}


function assertNotExecuted(
  result:
    ProviderRuntimeResponseExecutionResult,
  failureReason:
    ProviderRuntimeResponseExecutionResult[
      "responseExecutionFailureReason"
    ],
  label:
    string
): void {

  assert(
    result.responseExecutionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",
    `${label} response not executed status`
  );

  assert(
    result.runtimeResponseExecutionAttempted === true,
    `${label} execution attempted`
  );

  assert(
    result.runtimeResponseExecuted === false,
    `${label} response not executed`
  );

  assert(
    result.runtimeResponseExecutionDenied === false,
    `${label} execution not denied`
  );

  assert(
    result.responseExecutionFailureReason ===
      failureReason,
    `${label} execution failure reason preserved`
  );

  assertExecutionFlags(
    result,
    {
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
    },
    `${label} execution flags`
  );

}


function assertExecuted(
  result:
    ProviderRuntimeResponseExecutionResult,
  runtimeResponse:
    ProviderRuntimeResponse,
  label:
    string
): void {

  assert(
    result.responseExecutionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_EXECUTED",
    `${label} response executed status`
  );

  assert(
    result.runtimeResponseExecutionAttempted === true,
    `${label} execution attempted`
  );

  assert(
    result.runtimeResponseExecuted === true,
    `${label} response executed`
  );

  assert(
    result.runtimeResponseExecutionDenied === false,
    `${label} execution not denied`
  );

  assert(
    result.runtimeResponse ===
      runtimeResponse,
    `${label} runtime response preserved`
  );

  assert(
    result.responseExecutionDenialReason ===
      undefined,
    `${label} exposes no execution denial reason`
  );

  assert(
    result.responseExecutionFailureReason ===
      undefined,
    `${label} exposes no execution failure reason`
  );

}


interface ExpectedExecutionFlags {

  retryExecuted:
    boolean;

  recoveryExecuted:
    boolean;

  failoverExecuted:
    boolean;

  stopExecuted:
    boolean;

  escalationDispatched:
    boolean;

}


function assertExecutionFlags(
  result:
    ProviderRuntimeResponseExecutionResult,
  expected:
    ExpectedExecutionFlags,
  label:
    string
): void {

  assert(
    result.retryExecuted ===
      expected.retryExecuted,
    `${label} retryExecuted`
  );

  assert(
    result.recoveryExecuted ===
      expected.recoveryExecuted,
    `${label} recoveryExecuted`
  );

  assert(
    result.failoverExecuted ===
      expected.failoverExecuted,
    `${label} failoverExecuted`
  );

  assert(
    result.stopExecuted ===
      expected.stopExecuted,
    `${label} stopExecuted`
  );

  assert(
    result.escalationDispatched ===
      expected.escalationDispatched,
    `${label} escalationDispatched`
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
  "kms-key-runtime-execution";

const providerConfigurationRef =
  "cfg/aws-kms-prod";

const providerCredentialRef =
  "cred/aws-kms-prod";

const executionMetadata = {

  tenantId:
    "tenant-001",

  runtimeBatchId:
    "runtime-execution-001",

};


// ============================================================
// P9N DECISION FIXTURES
// ============================================================

function buildDecidedResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): ProviderRuntimeResponseDecisionResult {

  const noAction =
    runtimeResponse ===
    "NO_ACTION";

  return {

    responseDecisionStatus:
      "PROVIDER_RUNTIME_RESPONSE_DECIDED",

    responseDecision:
      "DECIDE_PROVIDER_RUNTIME_RESPONSE",

    runtimeResponseDecisionAttempted:
      true,

    runtimeResponseDecided:
      true,

    runtimeResponseDecisionDenied:
      false,

    runtimeInterventionNotRequired:
      noAction,

    runtimeResponse,

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    verificationStatus:
      noAction
        ? "PROVIDER_RUNTIME_VERIFIED"
        : "PROVIDER_RUNTIME_NOT_VERIFIED",

    verificationFailureReason:
      noAction
        ? undefined
        : verificationFailureReasonForResponse(
            runtimeResponse
          ),

    classificationStatus:
      noAction
        ? "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED"
        : "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",

    runtimeFailureClass:
      noAction
        ? undefined
        : failureClassForResponse(
            runtimeResponse
          ),

    runtimeFailureSeverity:
      noAction
        ? undefined
        : failureSeverityForResponse(
            runtimeResponse
          ),

    failureCode:
      noAction
        ? undefined
        : failureCodeForResponse(
            runtimeResponse
          ),

    providerRawStatus:
      noAction
        ? "KMS_SUCCESS"
        : "KMS_ERROR",

    providerRawErrorCode:
      noAction
        ? undefined
        : rawErrorCodeForResponse(
            runtimeResponse
          ),

    providerSanitizedErrorMessage:
      noAction
        ? undefined
        : "provider runtime failure requires governed response",

    retryable:
      runtimeResponse === "RETRY"
        ? true
        : false,

    recoveryIntakeRequired:
      recoveryRequiredForResponse(
        runtimeResponse
      ),

    recoveryIntakeReady:
      recoveryReadyForResponse(
        runtimeResponse
      ),

    recoveryReason:
      recoveryRequiredForResponse(
        runtimeResponse
      )
        ? "PROVIDER_FAILURE_SURFACE_PRESENT"
        : undefined,

    verificationSummary:
      noAction
        ? [
            "provider_runtime_verified",
          ]
        : [
            "provider_runtime_verification_failed",
          ],

    classificationSummary:
      noAction
        ? [
            "provider_runtime_failure_classification_not_required",
          ]
        : [
            "provider_runtime_failure_classified",
          ],

    recoveryIntakeSummary:
      recoveryRequiredForResponse(
        runtimeResponse
      )
        ? [
            "provider_runtime_recovery_intake_assessed",
            "provider_runtime_recovery_intake_ready",
          ]
        : undefined,

    summary: [
      noAction
        ? "provider_runtime_verified"
        : "provider_runtime_verification_failed",

      noAction
        ? "provider_runtime_failure_classification_not_required"
        : "provider_runtime_failure_classified",

      "provider_runtime_response_decided",

      runtimeResponse.toLowerCase(),
    ],

  };

}


function buildDecisionDenied():
  ProviderRuntimeResponseDecisionResult {

  return {

    ...buildDecidedResponse(
      "ESCALATE"
    ),

    responseDecisionStatus:
      "PROVIDER_RUNTIME_RESPONSE_DECISION_DENIED",

    runtimeResponseDecisionAttempted:
      false,

    runtimeResponseDecided:
      false,

    runtimeResponseDecisionDenied:
      true,

    runtimeInterventionNotRequired:
      false,

    runtimeResponse:
      undefined,

    responseDecisionDenialReason:
      "RUNTIME_FAILURE_CLASSIFICATION_DENIED",

    summary: [
      "provider_runtime_failure_classification_denied",
      "provider_runtime_response_decision_denied",
      "runtime_failure_classification_denied",
    ],

  };

}


function buildResponseNotDecided():
  ProviderRuntimeResponseDecisionResult {

  return {

    ...buildDecidedResponse(
      "ESCALATE"
    ),

    responseDecisionStatus:
      "PROVIDER_RUNTIME_RESPONSE_NOT_DECIDED",

    runtimeResponseDecisionAttempted:
      true,

    runtimeResponseDecided:
      false,

    runtimeResponseDecisionDenied:
      false,

    runtimeInterventionNotRequired:
      false,

    runtimeResponse:
      undefined,

    responseDecisionFailureReason:
      "RUNTIME_RESPONSE_NOT_DETERMINABLE",

    summary: [
      "provider_runtime_failure_classified",
      "provider_runtime_response_not_decided",
      "runtime_response_not_determinable",
    ],

  };

}


function buildDecidedResponseMissingRuntimeResponse():
  ProviderRuntimeResponseDecisionResult {

  return {

    ...buildDecidedResponse(
      "ESCALATE"
    ),

    runtimeResponse:
      undefined,

    summary: [
      "provider_runtime_failure_classified",
      "provider_runtime_response_decided",
      "runtime_response_missing",
    ],

  };

}


// ============================================================
// RESPONSE FIXTURE SUPPORT
// ============================================================

function verificationFailureReasonForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): ProviderRuntimeResponseDecisionResult[
  "verificationFailureReason"
] {

  switch (runtimeResponse) {

    case "NO_ACTION":
      return undefined;

    case "RECOVER":
      return "PROVIDER_EXECUTION_NOT_COMPLETED";

    case "RETRY":
    case "FAILOVER":
    case "STOP":
    case "ESCALATE":
      return "PROVIDER_FAILURE_SURFACE_PRESENT";

  }

}


function failureClassForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): ProviderRuntimeResponseDecisionResult[
  "runtimeFailureClass"
] {

  switch (runtimeResponse) {

    case "NO_ACTION":
      return undefined;

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

  }

}


function failureSeverityForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): ProviderRuntimeResponseDecisionResult[
  "runtimeFailureSeverity"
] {

  switch (runtimeResponse) {

    case "NO_ACTION":
      return undefined;

    case "RETRY":
    case "RECOVER":
      return "MEDIUM";

    case "FAILOVER":
    case "STOP":
    case "ESCALATE":
      return "HIGH";

  }

}


function failureCodeForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): ProviderRuntimeResponseDecisionResult[
  "failureCode"
] {

  switch (runtimeResponse) {

    case "NO_ACTION":
      return undefined;

    case "RETRY":
      return "PROVIDER_CALL_TIMEOUT";

    case "ESCALATE":
      return "PROVIDER_CALL_UNAUTHORIZED";

    case "RECOVER":
    case "FAILOVER":
    case "STOP":
      return undefined;

  }

}


function rawErrorCodeForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): string | undefined {

  switch (runtimeResponse) {

    case "NO_ACTION":
      return undefined;

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

  }

}


function recoveryRequiredForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): boolean {

  return (
    runtimeResponse === "RECOVER" ||
    runtimeResponse === "FAILOVER"
  );

}


function recoveryReadyForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): boolean {

  return (
    runtimeResponse === "RECOVER" ||
    runtimeResponse === "FAILOVER"
  );

}


// ============================================================
// EXECUTOR TRACKER
// ============================================================

interface ExecutorTracker {

  retry:
    number;

  recover:
    number;

  failover:
    number;

  stop:
    number;

  escalate:
    number;

}


function buildExecutorTracker():
  ExecutorTracker {

  return {

    retry:
      0,

    recover:
      0,

    failover:
      0,

    stop:
      0,

    escalate:
      0,

  };

}


function totalExecutorInvocations(
  tracker:
    ExecutorTracker
): number {

  return (
    tracker.retry +
    tracker.recover +
    tracker.failover +
    tracker.stop +
    tracker.escalate
  );

}


// ============================================================
// EXECUTOR BUILDERS
// ============================================================

function buildSuccessfulExecutor(
  runtimeResponse:
    ProviderRuntimeResponse,
  summaryToken:
    string,
  onInvocation?:
    () => void
): ProviderRuntimeResponseExecutor {

  return (
    decision
  ) => {

    onInvocation?.();

    assert(
      decision.runtimeResponse ===
        runtimeResponse,
      `${runtimeResponse} executor receives matching response`
    );

    return {

      runtimeResponse,

      runtimeResponseExecutionSucceeded:
        true,

      summary: [
        summaryToken,
      ],

    };

  };

}


function buildFailedExecutor(
  runtimeResponse:
    ProviderRuntimeResponse,
  summaryToken:
    string,
  onInvocation?:
    () => void
): ProviderRuntimeResponseExecutor {

  return (
    decision
  ) => {

    onInvocation?.();

    assert(
      decision.runtimeResponse ===
        runtimeResponse,
      `${runtimeResponse} failed executor receives matching response`
    );

    return {

      runtimeResponse,

      runtimeResponseExecutionSucceeded:
        false,

      summary: [
        summaryToken,
      ],

    };

  };

}


function buildIncoherentExecutor(
  selectedResponse:
    ProviderRuntimeResponse,
  returnedResponse:
    ProviderRuntimeResponse,
  summaryToken:
    string,
  onInvocation?:
    () => void
): ProviderRuntimeResponseExecutor {

  return (
    decision
  ) => {

    onInvocation?.();

    assert(
      decision.runtimeResponse ===
        selectedResponse,
      "incoherent executor receives selected P9N response"
    );

    return {

      runtimeResponse:
        returnedResponse,

      runtimeResponseExecutionSucceeded:
        true,

      summary: [
        summaryToken,
      ],

    };

  };

}


function buildSuccessfulExecutors(
  tracker?:
    ExecutorTracker
): ProviderRuntimeResponseExecutors {

  return {

    retry:
      buildSuccessfulExecutor(
        "RETRY",
        "provider_runtime_retry_executor_succeeded",
        tracker
          ? () => {
              tracker.retry += 1;
            }
          : undefined
      ),

    recover:
      buildSuccessfulExecutor(
        "RECOVER",
        "provider_runtime_recovery_executor_succeeded",
        tracker
          ? () => {
              tracker.recover += 1;
            }
          : undefined
      ),

    failover:
      buildSuccessfulExecutor(
        "FAILOVER",
        "provider_runtime_failover_executor_succeeded",
        tracker
          ? () => {
              tracker.failover += 1;
            }
          : undefined
      ),

    stop:
      buildSuccessfulExecutor(
        "STOP",
        "provider_runtime_stop_executor_succeeded",
        tracker
          ? () => {
              tracker.stop += 1;
            }
          : undefined
      ),

    escalate:
      buildSuccessfulExecutor(
        "ESCALATE",
        "provider_runtime_escalation_executor_succeeded",
        tracker
          ? () => {
              tracker.escalate += 1;
            }
          : undefined
      ),

  };

}


// ============================================================
// INPUT BUILDER
// ============================================================

function buildInput(
  overrides?:
    Partial<ProviderRuntimeResponseExecutionInput>
): ProviderRuntimeResponseExecutionInput {

  return {

    responseDecision:
      buildDecidedResponse(
        "ESCALATE"
      ),

    executors:
      buildSuccessfulExecutors(),

    responseExecution:
      "EXECUTE_PROVIDER_RUNTIME_RESPONSE",

    ...overrides,

  };

}


// ============================================================
// SCENARIO 1 — RESPONSE EXECUTION REJECTED
// ============================================================

function runResponseExecutionRejectedScenario(): void {

  const tracker =
    buildExecutorTracker();

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildDecidedResponse(
            "RETRY"
          ),

        executors:
          buildSuccessfulExecutors(
            tracker
          ),

        responseExecution:
          "REJECT_PROVIDER_RUNTIME_RESPONSE_EXECUTION",

      })
    );

  assertExecutionDenied(
    result,
    "RUNTIME_RESPONSE_EXECUTION_NOT_ALLOWED",
    "response execution rejected"
  );

  assert(
    result.runtimeResponse ===
      "RETRY",
    "rejected execution preserves selected response"
  );

  assert(
    totalExecutorInvocations(
      tracker
    ) === 0,
    "rejected execution invokes no executor"
  );

  assert(
    result.summary.includes(
      "runtime_response_execution_not_allowed"
    ),
    "execution rejection summary token preserved"
  );

  pass("response execution rejected");
  pass("response execution rejection reason preserved");
  pass("rejected execution invokes no executor");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 2 — RESPONSE DECISION DENIED
// ============================================================

function runResponseDecisionDeniedScenario(): void {

  const tracker =
    buildExecutorTracker();

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildDecisionDenied(),

        executors:
          buildSuccessfulExecutors(
            tracker
          ),

      })
    );

  assertExecutionDenied(
    result,
    "RUNTIME_RESPONSE_DECISION_DENIED",
    "response decision denied"
  );

  assert(
    totalExecutorInvocations(
      tracker
    ) === 0,
    "denied response decision invokes no executor"
  );

  assert(
    result.summary.includes(
      "runtime_response_decision_denied"
    ),
    "response decision denial summary token preserved"
  );

  pass("response decision denied");
  pass("denied response decision blocks execution");
  pass("denied response decision invokes no executor");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — RESPONSE NOT DECIDED
// ============================================================

function runResponseNotDecidedScenario(): void {

  const tracker =
    buildExecutorTracker();

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildResponseNotDecided(),

        executors:
          buildSuccessfulExecutors(
            tracker
          ),

      })
    );

  assertExecutionDenied(
    result,
    "RUNTIME_RESPONSE_NOT_DECIDED",
    "response not decided"
  );

  assert(
    totalExecutorInvocations(
      tracker
    ) === 0,
    "not-decided response invokes no executor"
  );

  assert(
    result.summary.includes(
      "runtime_response_not_decided"
    ),
    "response not decided summary token preserved"
  );

  pass("response not decided");
  pass("not-decided response blocks execution");
  pass("not-decided response invokes no executor");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 4 — DECIDED RESPONSE MISSING
// ============================================================

function runRuntimeResponseMissingScenario(): void {

  const tracker =
    buildExecutorTracker();

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildDecidedResponseMissingRuntimeResponse(),

        executors:
          buildSuccessfulExecutors(
            tracker
          ),

      })
    );

  assertNotExecuted(
    result,
    "RUNTIME_RESPONSE_MISSING",
    "runtime response missing"
  );

  assert(
    result.runtimeResponse ===
      undefined,
    "missing response remains undefined"
  );

  assert(
    totalExecutorInvocations(
      tracker
    ) === 0,
    "missing response invokes no executor"
  );

  assert(
    result.summary.includes(
      "runtime_response_missing"
    ),
    "missing response summary token preserved"
  );

  pass("decided response missing");
  pass("missing response not executed");
  pass("missing response invokes no executor");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 5 — NO_ACTION
// ============================================================

function runNoActionScenario(): void {

  const tracker =
    buildExecutorTracker();

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildDecidedResponse(
            "NO_ACTION"
          ),

        executors:
          buildSuccessfulExecutors(
            tracker
          ),

      })
    );

  assertExecuted(
    result,
    "NO_ACTION",
    "NO_ACTION"
  );

  assert(
    result.runtimeInterventionNotRequired ===
      true,
    "NO_ACTION requires no corrective intervention"
  );

  assertExecutionFlags(
    result,
    {
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
    },
    "NO_ACTION"
  );

  assert(
    totalExecutorInvocations(
      tracker
    ) === 0,
    "NO_ACTION invokes no governed executor"
  );

  assert(
    result.executorSummary ===
      undefined,
    "NO_ACTION exposes no executor summary"
  );

  assert(
    result.summary.includes(
      "provider_runtime_response_executed"
    ),
    "NO_ACTION execution summary preserved"
  );

  assert(
    result.summary.includes(
      "no_action"
    ),
    "NO_ACTION terminal token preserved"
  );

  pass("NO_ACTION executed explicitly");
  pass("NO_ACTION requires no intervention");
  pass("NO_ACTION invokes no executor");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 6 — RETRY
// ============================================================

function runRetryExecutionScenario(): void {

  const tracker =
    buildExecutorTracker();

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildDecidedResponse(
            "RETRY"
          ),

        executors:
          buildSuccessfulExecutors(
            tracker
          ),

      })
    );

  assertExecuted(
    result,
    "RETRY",
    "RETRY"
  );

  assertExecutionFlags(
    result,
    {
      retryExecuted:
        true,

      recoveryExecuted:
        false,

      failoverExecuted:
        false,

      stopExecuted:
        false,

      escalationDispatched:
        false,
    },
    "RETRY"
  );

  assert(
    tracker.retry === 1,
    "RETRY executor invoked once"
  );

  assert(
    totalExecutorInvocations(
      tracker
    ) === 1,
    "RETRY invokes exactly one executor"
  );

  assert(
    result.executorSummary?.includes(
      "provider_runtime_retry_executor_succeeded"
    ),
    "RETRY executor summary propagated"
  );

  pass("RETRY executed");
  pass("RETRY executor invoked exactly once");
  pass("only retry execution flag asserted");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 7 — RECOVER
// ============================================================

function runRecoveryExecutionScenario(): void {

  const tracker =
    buildExecutorTracker();

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildDecidedResponse(
            "RECOVER"
          ),

        executors:
          buildSuccessfulExecutors(
            tracker
          ),

      })
    );

  assertExecuted(
    result,
    "RECOVER",
    "RECOVER"
  );

  assertExecutionFlags(
    result,
    {
      retryExecuted:
        false,

      recoveryExecuted:
        true,

      failoverExecuted:
        false,

      stopExecuted:
        false,

      escalationDispatched:
        false,
    },
    "RECOVER"
  );

  assert(
    result.recoveryIntakeRequired ===
      true,
    "RECOVER preserves recovery intake requirement"
  );

  assert(
    result.recoveryIntakeReady ===
      true,
    "RECOVER preserves recovery intake readiness"
  );

  assert(
    tracker.recover === 1,
    "RECOVER executor invoked once"
  );

  assert(
    totalExecutorInvocations(
      tracker
    ) === 1,
    "RECOVER invokes exactly one executor"
  );

  pass("RECOVER executed");
  pass("RECOVER executor invoked exactly once");
  pass("recovery context preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 8 — FAILOVER
// ============================================================

function runFailoverExecutionScenario(): void {

  const tracker =
    buildExecutorTracker();

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildDecidedResponse(
            "FAILOVER"
          ),

        executors:
          buildSuccessfulExecutors(
            tracker
          ),

      })
    );

  assertExecuted(
    result,
    "FAILOVER",
    "FAILOVER"
  );

  assertExecutionFlags(
    result,
    {
      retryExecuted:
        false,

      recoveryExecuted:
        false,

      failoverExecuted:
        true,

      stopExecuted:
        false,

      escalationDispatched:
        false,
    },
    "FAILOVER"
  );

  assert(
    result.recoveryIntakeRequired ===
      true,
    "FAILOVER preserves recovery intake requirement"
  );

  assert(
    result.recoveryIntakeReady ===
      true,
    "FAILOVER preserves recovery intake readiness"
  );

  assert(
    tracker.failover === 1,
    "FAILOVER executor invoked once"
  );

  assert(
    totalExecutorInvocations(
      tracker
    ) === 1,
    "FAILOVER invokes exactly one executor"
  );

  pass("FAILOVER executed");
  pass("FAILOVER executor invoked exactly once");
  pass("failover execution flag asserted");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 9 — STOP
// ============================================================

function runStopExecutionScenario(): void {

  const tracker =
    buildExecutorTracker();

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildDecidedResponse(
            "STOP"
          ),

        executors:
          buildSuccessfulExecutors(
            tracker
          ),

      })
    );

  assertExecuted(
    result,
    "STOP",
    "STOP"
  );

  assertExecutionFlags(
    result,
    {
      retryExecuted:
        false,

      recoveryExecuted:
        false,

      failoverExecuted:
        false,

      stopExecuted:
        true,

      escalationDispatched:
        false,
    },
    "STOP"
  );

  assert(
    tracker.stop === 1,
    "STOP executor invoked once"
  );

  assert(
    totalExecutorInvocations(
      tracker
    ) === 1,
    "STOP invokes exactly one executor"
  );

  pass("STOP executed");
  pass("STOP executor invoked exactly once");
  pass("stop execution flag asserted");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 10 — ESCALATE
// ============================================================

function runEscalationExecutionScenario(): void {

  const tracker =
    buildExecutorTracker();

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildDecidedResponse(
            "ESCALATE"
          ),

        executors:
          buildSuccessfulExecutors(
            tracker
          ),

      })
    );

  assertExecuted(
    result,
    "ESCALATE",
    "ESCALATE"
  );

  assertExecutionFlags(
    result,
    {
      retryExecuted:
        false,

      recoveryExecuted:
        false,

      failoverExecuted:
        false,

      stopExecuted:
        false,

      escalationDispatched:
        true,
    },
    "ESCALATE"
  );

  assert(
    tracker.escalate === 1,
    "ESCALATE executor invoked once"
  );

  assert(
    totalExecutorInvocations(
      tracker
    ) === 1,
    "ESCALATE invokes exactly one executor"
  );

  pass("ESCALATE dispatched");
  pass("ESCALATE executor invoked exactly once");
  pass("escalation dispatch flag asserted");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 11 — EXECUTOR NOT AVAILABLE
// ============================================================

function runExecutorNotAvailableScenarios(): void {

  const responsesRequiringExecutor:
    ProviderRuntimeResponse[] = [

      "RETRY",

      "RECOVER",

      "FAILOVER",

      "STOP",

      "ESCALATE",

    ];

  for (
    const runtimeResponse
    of responsesRequiringExecutor
  ) {

    const result =
      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildDecidedResponse(
              runtimeResponse
            ),

          executors:
            {},

        })
      );

    assertNotExecuted(
      result,
      "RUNTIME_RESPONSE_EXECUTOR_NOT_AVAILABLE",
      `${runtimeResponse} executor unavailable`
    );

    assert(
      result.runtimeResponse ===
        runtimeResponse,
      `${runtimeResponse} selection preserved when executor unavailable`
    );

    assert(
      result.summary.includes(
        "runtime_response_executor_not_available"
      ),
      `${runtimeResponse} missing executor summary preserved`
    );

    pass(
      `${runtimeResponse} without executor not executed`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 12 — EXECUTOR FAILURE
// ============================================================

function runExecutorFailureScenarios(): void {

  const executionCases: Array<{
    runtimeResponse:
      Exclude<
        ProviderRuntimeResponse,
        "NO_ACTION"
      >;
    executors:
      ProviderRuntimeResponseExecutors;
  }> = [

    {
      runtimeResponse:
        "RETRY",

      executors: {
        retry:
          buildFailedExecutor(
            "RETRY",
            "provider_runtime_retry_executor_failed"
          ),
      },
    },

    {
      runtimeResponse:
        "RECOVER",

      executors: {
        recover:
          buildFailedExecutor(
            "RECOVER",
            "provider_runtime_recovery_executor_failed"
          ),
      },
    },

    {
      runtimeResponse:
        "FAILOVER",

      executors: {
        failover:
          buildFailedExecutor(
            "FAILOVER",
            "provider_runtime_failover_executor_failed"
          ),
      },
    },

    {
      runtimeResponse:
        "STOP",

      executors: {
        stop:
          buildFailedExecutor(
            "STOP",
            "provider_runtime_stop_executor_failed"
          ),
      },
    },

    {
      runtimeResponse:
        "ESCALATE",

      executors: {
        escalate:
          buildFailedExecutor(
            "ESCALATE",
            "provider_runtime_escalation_executor_failed"
          ),
      },
    },

  ];

  for (
    const executionCase
    of executionCases
  ) {

    const result =
      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildDecidedResponse(
              executionCase.runtimeResponse
            ),

          executors:
            executionCase.executors,

        })
      );

    assertNotExecuted(
      result,
      "RUNTIME_RESPONSE_EXECUTION_FAILED",
      `${executionCase.runtimeResponse} executor failure`
    );

    assert(
      result.runtimeResponse ===
        executionCase.runtimeResponse,
      `${executionCase.runtimeResponse} preserved after executor failure`
    );

    assert(
      result.executorSummary !==
        undefined,
      `${executionCase.runtimeResponse} failed executor summary propagated`
    );

    assert(
      result.summary.includes(
        "runtime_response_execution_failed"
      ),
      `${executionCase.runtimeResponse} execution failure summary preserved`
    );

    pass(
      `${executionCase.runtimeResponse} executor failure preserved`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 13 — EXECUTOR RESULT INCOHERENT
// ============================================================

function runExecutorResultIncoherentScenario(): void {

  let executorInvocations =
    0;

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildDecidedResponse(
            "RETRY"
          ),

        executors: {

          retry:
            buildIncoherentExecutor(
              "RETRY",
              "STOP",
              "provider_runtime_executor_returned_wrong_response",
              () => {
                executorInvocations += 1;
              }
            ),

        },

      })
    );

  assertNotExecuted(
    result,
    "RUNTIME_RESPONSE_EXECUTION_RESULT_INCOHERENT",
    "executor result incoherent"
  );

  assert(
    result.runtimeResponse ===
      "RETRY",
    "P9N-selected response remains authoritative"
  );

  assert(
    executorInvocations === 1,
    "incoherent executor invoked once"
  );

  assert(
    result.executorSummary?.includes(
      "provider_runtime_executor_returned_wrong_response"
    ),
    "incoherent executor summary propagated"
  );

  assert(
    result.summary.includes(
      "runtime_response_execution_result_incoherent"
    ),
    "executor incoherence summary token preserved"
  );

  pass("incoherent executor result rejected");
  pass("P9N-selected response remains authoritative");
  pass("incoherent executor result does not set execution flags");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 14 — EXACTLY ONE EXECUTOR INVOKED
// ============================================================

function runExactlyOneExecutorInvokedScenario(): void {

  const runtimeResponses:
    Array<
      Exclude<
        ProviderRuntimeResponse,
        "NO_ACTION"
      >
    > = [

      "RETRY",

      "RECOVER",

      "FAILOVER",

      "STOP",

      "ESCALATE",

    ];

  for (
    const runtimeResponse
    of runtimeResponses
  ) {

    const tracker =
      buildExecutorTracker();

    const result =
      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildDecidedResponse(
              runtimeResponse
            ),

          executors:
            buildSuccessfulExecutors(
              tracker
            ),

        })
      );

    assertExecuted(
      result,
      runtimeResponse,
      `${runtimeResponse} single routing`
    );

    assert(
      totalExecutorInvocations(
        tracker
      ) === 1,
      `${runtimeResponse} invokes exactly one governed executor`
    );

    switch (runtimeResponse) {

      case "RETRY":

        assert(
          tracker.retry === 1,
          "RETRY routes only to retry executor"
        );

        break;

      case "RECOVER":

        assert(
          tracker.recover === 1,
          "RECOVER routes only to recovery executor"
        );

        break;

      case "FAILOVER":

        assert(
          tracker.failover === 1,
          "FAILOVER routes only to failover executor"
        );

        break;

      case "STOP":

        assert(
          tracker.stop === 1,
          "STOP routes only to stop executor"
        );

        break;

      case "ESCALATE":

        assert(
          tracker.escalate === 1,
          "ESCALATE routes only to escalation executor"
        );

        break;

    }

    pass(
      `${runtimeResponse} routes to exactly one executor`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 15 — CONTEXT PROPAGATION
// ============================================================

function runContextPropagationChecks(): void {

  const responseDecision =
    buildDecidedResponse(
      "RECOVER"
    );

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision,

        executors: {

          recover:
            buildSuccessfulExecutor(
              "RECOVER",
              "provider_runtime_recovery_executor_succeeded"
            ),

        },

      })
    );

  assertExecuted(
    result,
    "RECOVER",
    "context propagation"
  );

  assert(
    result.providerContract ===
      responseDecision.providerContract,
    "providerContract propagated"
  );

  assert(
    result.providerImplementation ===
      responseDecision.providerImplementation,
    "providerImplementation propagated"
  );

  assert(
    result.operation ===
      responseDecision.operation,
    "operation propagated"
  );

  assert(
    result.providerResourceId ===
      responseDecision.providerResourceId,
    "providerResourceId propagated"
  );

  assert(
    result.providerConfigurationRef ===
      responseDecision.providerConfigurationRef,
    "providerConfigurationRef propagated"
  );

  assert(
    result.providerCredentialRef ===
      responseDecision.providerCredentialRef,
    "providerCredentialRef propagated"
  );

  assert.deepEqual(
    result.executionMetadata,
    responseDecision.executionMetadata,
    "executionMetadata propagated"
  );

  assert(
    result.verificationStatus ===
      responseDecision.verificationStatus,
    "verificationStatus propagated"
  );

  assert(
    result.verificationFailureReason ===
      responseDecision.verificationFailureReason,
    "verificationFailureReason propagated"
  );

  assert(
    result.classificationStatus ===
      responseDecision.classificationStatus,
    "classificationStatus propagated"
  );

  assert(
    result.runtimeFailureClass ===
      responseDecision.runtimeFailureClass,
    "runtimeFailureClass propagated"
  );

  assert(
    result.runtimeFailureSeverity ===
      responseDecision.runtimeFailureSeverity,
    "runtimeFailureSeverity propagated"
  );

  assert(
    result.failureCode ===
      responseDecision.failureCode,
    "failureCode propagated"
  );

  assert(
    result.providerRawStatus ===
      responseDecision.providerRawStatus,
    "providerRawStatus propagated"
  );

  assert(
    result.providerRawErrorCode ===
      responseDecision.providerRawErrorCode,
    "providerRawErrorCode propagated"
  );

  assert(
    result.providerSanitizedErrorMessage ===
      responseDecision.providerSanitizedErrorMessage,
    "providerSanitizedErrorMessage propagated"
  );

  assert(
    result.retryable ===
      responseDecision.retryable,
    "retryable propagated"
  );

  assert(
    result.recoveryIntakeRequired ===
      responseDecision.recoveryIntakeRequired,
    "recoveryIntakeRequired propagated"
  );

  assert(
    result.recoveryIntakeReady ===
      responseDecision.recoveryIntakeReady,
    "recoveryIntakeReady propagated"
  );

  assert(
    result.recoveryReason ===
      responseDecision.recoveryReason,
    "recoveryReason propagated"
  );

  assert.deepEqual(
    result.responseDecisionSummary,
    responseDecision.summary,
    "response decision summary propagated"
  );

  assert.notEqual(
    result.responseDecisionSummary,
    responseDecision.summary,
    "response decision summary copied"
  );

  pass("provider/runtime context propagated");
  pass("verification context propagated");
  pass("classification context propagated");
  pass("failure context propagated");
  pass("recovery context propagated");
  pass("response decision summary propagated by copy");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 16 — EXECUTOR SUMMARY PROPAGATION
// ============================================================

function runExecutorSummaryPropagationChecks(): void {

  const executorSummary = [
    "provider_runtime_retry_executor_started",
    "provider_runtime_retry_executor_succeeded",
  ];

  const result =
    executeProviderRuntimeResponse(
      buildInput({

        responseDecision:
          buildDecidedResponse(
            "RETRY"
          ),

        executors: {

          retry:
            () => {

              return {

                runtimeResponse:
                  "RETRY",

                runtimeResponseExecutionSucceeded:
                  true,

                summary:
                  executorSummary,

              };

            },

        },

      })
    );

  assertExecuted(
    result,
    "RETRY",
    "executor summary propagation"
  );

  assert.deepEqual(
    result.executorSummary,
    executorSummary,
    "executor summary propagated"
  );

  assert.notEqual(
    result.executorSummary,
    executorSummary,
    "executor summary copied"
  );

  assert(
    result.summary.includes(
      "provider_runtime_retry_executor_started"
    ),
    "executor start summary token propagated"
  );

  assert(
    result.summary.includes(
      "provider_runtime_retry_executor_succeeded"
    ),
    "executor success summary token propagated"
  );

  assert(
    result.summary.includes(
      "provider_runtime_response_executed"
    ),
    "execution terminal summary token preserved"
  );

  assert(
    result.summary.includes(
      "retry"
    ),
    "executed response summary token preserved"
  );

  pass("executor summary propagated");
  pass("executor summary copied");
  pass("execution terminal summary preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 17 — BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const results:
    ProviderRuntimeResponseExecutionResult[] = [

      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildDecidedResponse(
              "NO_ACTION"
            ),

        })
      ),

      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildDecidedResponse(
              "RETRY"
            ),

          executors: {

            retry:
              buildSuccessfulExecutor(
                "RETRY",
                "provider_runtime_retry_executor_succeeded"
              ),

          },

        })
      ),

      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildDecidedResponse(
              "RECOVER"
            ),

          executors: {

            recover:
              buildSuccessfulExecutor(
                "RECOVER",
                "provider_runtime_recovery_executor_succeeded"
              ),

          },

        })
      ),

      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildDecidedResponse(
              "FAILOVER"
            ),

          executors: {

            failover:
              buildSuccessfulExecutor(
                "FAILOVER",
                "provider_runtime_failover_executor_succeeded"
              ),

          },

        })
      ),

      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildDecidedResponse(
              "STOP"
            ),

          executors: {

            stop:
              buildSuccessfulExecutor(
                "STOP",
                "provider_runtime_stop_executor_succeeded"
              ),

          },

        })
      ),

      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildDecidedResponse(
              "ESCALATE"
            ),

          executors: {

            escalate:
              buildSuccessfulExecutor(
                "ESCALATE",
                "provider_runtime_escalation_executor_succeeded"
              ),

          },

        })
      ),

      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildDecisionDenied(),

        })
      ),

      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildResponseNotDecided(),

        })
      ),

      executeProviderRuntimeResponse(
        buildInput({

          responseDecision:
            buildDecidedResponse(
              "RETRY"
            ),

          executors:
            {},

        })
      ),

  ];

  for (const result of results) {

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

  runResponseExecutionRejectedScenario();

  runResponseDecisionDeniedScenario();

  runResponseNotDecidedScenario();

  runRuntimeResponseMissingScenario();

  runNoActionScenario();

  runRetryExecutionScenario();

  runRecoveryExecutionScenario();

  runFailoverExecutionScenario();

  runStopExecutionScenario();

  runEscalationExecutionScenario();

  runExecutorNotAvailableScenarios();

  runExecutorFailureScenarios();

  runExecutorResultIncoherentScenario();

  runExactlyOneExecutorInvokedScenario();

  runContextPropagationChecks();

  runExecutorSummaryPropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9O PROVIDER RUNTIME RESPONSE EXECUTION");
  console.log("========================================");
  console.log("");

  console.log("Execution Gates:");
  console.log("✓ response execution rejected → DENIED");
  console.log("✓ response decision denied → DENIED");
  console.log("✓ response not decided → DENIED");

  console.log("");
  console.log("Execution Preconditions:");
  console.log("✓ decided response missing → NOT_EXECUTED");
  console.log("✓ selected executor unavailable → NOT_EXECUTED");
  console.log("✓ executor failure → NOT_EXECUTED");
  console.log("✓ incoherent executor result → NOT_EXECUTED");

  console.log("");
  console.log("No-Intervention Execution:");
  console.log("✓ NO_ACTION executed explicitly");
  console.log("✓ NO_ACTION invokes no governed executor");
  console.log("✓ NO_ACTION sets no corrective execution flag");

  console.log("");
  console.log("Governed Execution:");
  console.log("✓ RETRY → retry executor");
  console.log("✓ RECOVER → recovery executor");
  console.log("✓ FAILOVER → failover executor");
  console.log("✓ STOP → stop executor");
  console.log("✓ ESCALATE → escalation executor");

  console.log("");
  console.log("Execution Exclusivity:");
  console.log("✓ exactly one selected executor invoked");
  console.log("✓ only the matching execution flag is asserted");
  console.log("✓ P9N-selected response remains authoritative");
  console.log("✓ executor cannot replace selected response");

  console.log("");
  console.log("Contract Propagation:");
  console.log("✓ provider/runtime context");
  console.log("✓ verification context");
  console.log("✓ classification context");
  console.log("✓ failure context");
  console.log("✓ recovery context");
  console.log("✓ response decision summary");
  console.log("✓ executor summary");
  console.log("✓ execution terminal summary");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime verification");
  console.log("✓ no runtime failure classification");
  console.log("✓ no runtime response decision");
  console.log("✓ no response replacement");
  console.log("✓ no direct provider API / SDK calls");
  console.log("✓ no provider-error re-sanitization");
  console.log("✓ no sanitized failure-surface alteration");
  console.log("✓ no evidence generation or write");
  console.log("✓ no ledger write");
  console.log("✓ no audit");

  console.log("");
  console.log("========================================");
  console.log("P9O.1 PROVIDER RUNTIME RESPONSE EXECUTION VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();