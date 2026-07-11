// ============================================================
// PlannerAgent — Provider Runtime Response Execution
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9O.provider.runtime.response.execution.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Provider Runtime
//
// DOMAIN
// ------------------------------------------------------------
// P9O.1 — Provider Runtime Response Execution
//
// PURPOSE
// ------------------------------------------------------------
// Execute the canonical governed runtime
// response selected by P9N.
//
// P9O receives:
//
// - ProviderRuntimeResponseDecisionResult
// - governed runtime response executors
// - ProviderRuntimeResponseExecution gate
//
// P9O first validates that the upstream
// response decision is executable.
//
// P9O then routes exactly one canonical
// runtime response through its governed
// execution boundary.
//
// P9O does not verify runtime.
//
// P9O does not classify runtime failure.
//
// P9O does not decide runtime response.
//
// P9O does not directly call provider SDKs.
//
// P9O does not directly call provider APIs.
//
// P9O does not generate evidence.
//
// P9O does not write ledger.
//
// P9O does not perform audit.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// P9K prepares runtime intake.
//
// P9L verifies runtime outcome.
//
// P9M classifies runtime failure.
//
// P9N decides runtime response.
//
// P9O executes governed response.
//
// Runtime Response Decided
// ≠
// Runtime Response Executed
//
// Runtime Response Selected
// ≠
// Runtime Response Authorized For Execution
//
// Governed Executor Available
// ≠
// Governed Execution Successful
//
// Execution Attempted
// ≠
// Execution Completed
//
// ============================================================

import type {
  ProviderRuntimeResponse,
  ProviderRuntimeResponseDecisionResult,
} from "./P9N.provider.runtime.response.decision";


// ============================================================
// RESPONSE EXECUTION STATUS
// ============================================================

export type ProviderRuntimeResponseExecutionStatus =
  | "PROVIDER_RUNTIME_RESPONSE_EXECUTED"
  | "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED"
  | "PROVIDER_RUNTIME_RESPONSE_EXECUTION_DENIED";


// ============================================================
// RESPONSE EXECUTION GATE
// ============================================================

export type ProviderRuntimeResponseExecution =
  | "EXECUTE_PROVIDER_RUNTIME_RESPONSE"
  | "REJECT_PROVIDER_RUNTIME_RESPONSE_EXECUTION";


// ============================================================
// RESPONSE EXECUTION DENIAL REASON
// ============================================================

export type ProviderRuntimeResponseExecutionDenialReason =
  | "RUNTIME_RESPONSE_EXECUTION_NOT_ALLOWED"
  | "RUNTIME_RESPONSE_DECISION_DENIED"
  | "RUNTIME_RESPONSE_NOT_DECIDED";


// ============================================================
// RESPONSE EXECUTION FAILURE REASON
// ============================================================

export type ProviderRuntimeResponseExecutionFailureReason =
  | "RUNTIME_RESPONSE_MISSING"
  | "RUNTIME_RESPONSE_EXECUTOR_NOT_AVAILABLE"
  | "RUNTIME_RESPONSE_EXECUTION_FAILED"
  | "RUNTIME_RESPONSE_EXECUTION_RESULT_INCOHERENT";


// ============================================================
// EXECUTOR RESULT
// ============================================================

export interface ProviderRuntimeResponseExecutorResult {

  runtimeResponse:
    ProviderRuntimeResponse;

  runtimeResponseExecutionSucceeded:
    boolean;

  summary:
    string[];

}


// ============================================================
// GOVERNED RESPONSE EXECUTOR
// ============================================================

export type ProviderRuntimeResponseExecutor =
  (
    decision:
      ProviderRuntimeResponseDecisionResult
  ) =>
    ProviderRuntimeResponseExecutorResult;


// ============================================================
// GOVERNED RESPONSE EXECUTORS
// ============================================================

export interface ProviderRuntimeResponseExecutors {

  retry?:
    ProviderRuntimeResponseExecutor;

  recover?:
    ProviderRuntimeResponseExecutor;

  failover?:
    ProviderRuntimeResponseExecutor;

  stop?:
    ProviderRuntimeResponseExecutor;

  escalate?:
    ProviderRuntimeResponseExecutor;

}


// ============================================================
// INPUT
// ============================================================

export interface ProviderRuntimeResponseExecutionInput {

  responseDecision:
    ProviderRuntimeResponseDecisionResult;

  executors:
    ProviderRuntimeResponseExecutors;

  responseExecution:
    ProviderRuntimeResponseExecution;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderRuntimeResponseExecutionResult {

  responseExecutionStatus:
    ProviderRuntimeResponseExecutionStatus;

  responseExecution:
    ProviderRuntimeResponseExecution;

  runtimeResponseExecutionAttempted:
    boolean;

  runtimeResponseExecuted:
    boolean;

  runtimeResponseExecutionDenied:
    boolean;

  runtimeInterventionNotRequired:
    boolean;

  runtimeResponse?:
    ProviderRuntimeResponse;

  responseExecutionDenialReason?:
    ProviderRuntimeResponseExecutionDenialReason;

  responseExecutionFailureReason?:
    ProviderRuntimeResponseExecutionFailureReason;

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

  providerContract:
    ProviderRuntimeResponseDecisionResult["providerContract"];

  providerImplementation:
    ProviderRuntimeResponseDecisionResult["providerImplementation"];

  operation:
    ProviderRuntimeResponseDecisionResult["operation"];

  providerResourceId?:
    ProviderRuntimeResponseDecisionResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeResponseDecisionResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeResponseDecisionResult["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeResponseDecisionResult["executionMetadata"];

  verificationStatus:
    ProviderRuntimeResponseDecisionResult["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeResponseDecisionResult["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeResponseDecisionResult["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeResponseDecisionResult["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeResponseDecisionResult["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeResponseDecisionResult["failureCode"];

  providerRawStatus?:
    ProviderRuntimeResponseDecisionResult["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeResponseDecisionResult["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeResponseDecisionResult["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeResponseDecisionResult["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeResponseDecisionResult["recoveryIntakeRequired"];

  recoveryIntakeReady:
    ProviderRuntimeResponseDecisionResult["recoveryIntakeReady"];

  recoveryReason?:
    ProviderRuntimeResponseDecisionResult["recoveryReason"];

  responseDecisionSummary:
    string[];

  executorSummary?:
    string[];

  summary:
    string[];

}


// ============================================================
// EXECUTION FLAGS
// ============================================================

interface ProviderRuntimeResponseExecutionFlags {

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


function emptyExecutionFlags():
  ProviderRuntimeResponseExecutionFlags {

  return {

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

  };

}


function executionFlagsForResponse(
  runtimeResponse:
    ProviderRuntimeResponse
): ProviderRuntimeResponseExecutionFlags {

  const flags =
    emptyExecutionFlags();

  switch (runtimeResponse) {

    case "NO_ACTION":
      return flags;

    case "RETRY":
      return {

        ...flags,

        retryExecuted:
          true,

      };

    case "RECOVER":
      return {

        ...flags,

        recoveryExecuted:
          true,

      };

    case "FAILOVER":
      return {

        ...flags,

        failoverExecuted:
          true,

      };

    case "STOP":
      return {

        ...flags,

        stopExecuted:
          true,

      };

    case "ESCALATE":
      return {

        ...flags,

        escalationDispatched:
          true,

      };

  }

}


// ============================================================
// CONTEXT PROPAGATION
// ============================================================

function responseDecisionContext(
  responseDecision:
    ProviderRuntimeResponseDecisionResult
) {

  return {

    providerContract:
      responseDecision.providerContract,

    providerImplementation:
      responseDecision.providerImplementation,

    operation:
      responseDecision.operation,

    providerResourceId:
      responseDecision.providerResourceId,

    providerConfigurationRef:
      responseDecision.providerConfigurationRef,

    providerCredentialRef:
      responseDecision.providerCredentialRef,

    executionMetadata:
      responseDecision.executionMetadata,

    verificationStatus:
      responseDecision.verificationStatus,

    verificationFailureReason:
      responseDecision.verificationFailureReason,

    classificationStatus:
      responseDecision.classificationStatus,

    runtimeFailureClass:
      responseDecision.runtimeFailureClass,

    runtimeFailureSeverity:
      responseDecision.runtimeFailureSeverity,

    failureCode:
      responseDecision.failureCode,

    providerRawStatus:
      responseDecision.providerRawStatus,

    providerRawErrorCode:
      responseDecision.providerRawErrorCode,

    providerSanitizedErrorMessage:
      responseDecision.providerSanitizedErrorMessage,

    retryable:
      responseDecision.retryable,

    recoveryIntakeRequired:
      responseDecision.recoveryIntakeRequired,

    recoveryIntakeReady:
      responseDecision.recoveryIntakeReady,

    recoveryReason:
      responseDecision.recoveryReason,

    responseDecisionSummary: [
      ...responseDecision.summary,
    ],

  };

}


// ============================================================
// DENIED RESULT
// ============================================================

function buildDeniedResult(
  input:
    ProviderRuntimeResponseExecutionInput,
  responseExecutionDenialReason:
    ProviderRuntimeResponseExecutionDenialReason,
  summaryToken:
    string
): ProviderRuntimeResponseExecutionResult {

  const responseDecision =
    input.responseDecision;

  return {

    responseExecutionStatus:
      "PROVIDER_RUNTIME_RESPONSE_EXECUTION_DENIED",

    responseExecution:
      input.responseExecution,

    runtimeResponseExecutionAttempted:
      false,

    runtimeResponseExecuted:
      false,

    runtimeResponseExecutionDenied:
      true,

    runtimeInterventionNotRequired:
      responseDecision.runtimeInterventionNotRequired,

    runtimeResponse:
      responseDecision.runtimeResponse,

    responseExecutionDenialReason,

    ...emptyExecutionFlags(),

    ...responseDecisionContext(
      responseDecision
    ),

    summary: [
      ...responseDecision.summary,
      "provider_runtime_response_execution_denied",
      summaryToken,
    ],

  };

}


// ============================================================
// NOT EXECUTED RESULT
// ============================================================

function buildNotExecutedResult(
  input:
    ProviderRuntimeResponseExecutionInput,
  responseExecutionFailureReason:
    ProviderRuntimeResponseExecutionFailureReason,
  summaryToken:
    string,
  executorSummary?:
    string[]
): ProviderRuntimeResponseExecutionResult {

  const responseDecision =
    input.responseDecision;

  return {

    responseExecutionStatus:
      "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",

    responseExecution:
      input.responseExecution,

    runtimeResponseExecutionAttempted:
      true,

    runtimeResponseExecuted:
      false,

    runtimeResponseExecutionDenied:
      false,

    runtimeInterventionNotRequired:
      responseDecision.runtimeInterventionNotRequired,

    runtimeResponse:
      responseDecision.runtimeResponse,

    responseExecutionFailureReason,

    ...emptyExecutionFlags(),

    ...responseDecisionContext(
      responseDecision
    ),

    executorSummary:
      executorSummary
        ? [
            ...executorSummary,
          ]
        : undefined,

    summary: [
      ...responseDecision.summary,
      ...(executorSummary ?? []),
      "provider_runtime_response_not_executed",
      summaryToken,
    ],

  };

}


// ============================================================
// NO ACTION RESULT
// ============================================================

function buildNoActionResult(
  input:
    ProviderRuntimeResponseExecutionInput
): ProviderRuntimeResponseExecutionResult {

  const responseDecision =
    input.responseDecision;

  return {

    responseExecutionStatus:
      "PROVIDER_RUNTIME_RESPONSE_EXECUTED",

    responseExecution:
      input.responseExecution,

    runtimeResponseExecutionAttempted:
      true,

    runtimeResponseExecuted:
      true,

    runtimeResponseExecutionDenied:
      false,

    runtimeInterventionNotRequired:
      true,

    runtimeResponse:
      "NO_ACTION",

    ...emptyExecutionFlags(),

    ...responseDecisionContext(
      responseDecision
    ),

    summary: [
      ...responseDecision.summary,
      "provider_runtime_response_executed",
      "no_action",
    ],

  };

}


// ============================================================
// EXECUTED RESULT
// ============================================================

function buildExecutedResult(
  input:
    ProviderRuntimeResponseExecutionInput,
  executorResult:
    ProviderRuntimeResponseExecutorResult
): ProviderRuntimeResponseExecutionResult {

  const responseDecision =
    input.responseDecision;

  const runtimeResponse =
    executorResult.runtimeResponse;

  return {

    responseExecutionStatus:
      "PROVIDER_RUNTIME_RESPONSE_EXECUTED",

    responseExecution:
      input.responseExecution,

    runtimeResponseExecutionAttempted:
      true,

    runtimeResponseExecuted:
      true,

    runtimeResponseExecutionDenied:
      false,

    runtimeInterventionNotRequired:
      false,

    runtimeResponse,

    ...executionFlagsForResponse(
      runtimeResponse
    ),

    ...responseDecisionContext(
      responseDecision
    ),

    executorSummary: [
      ...executorResult.summary,
    ],

    summary: [
      ...responseDecision.summary,
      ...executorResult.summary,
      "provider_runtime_response_executed",
      runtimeResponse.toLowerCase(),
    ],

  };

}


// ============================================================
// EXECUTOR SELECTION
// ============================================================

function executorForResponse(
  runtimeResponse:
    ProviderRuntimeResponse,
  executors:
    ProviderRuntimeResponseExecutors
): ProviderRuntimeResponseExecutor | undefined {

  switch (runtimeResponse) {

    case "NO_ACTION":
      return undefined;

    case "RETRY":
      return executors.retry;

    case "RECOVER":
      return executors.recover;

    case "FAILOVER":
      return executors.failover;

    case "STOP":
      return executors.stop;

    case "ESCALATE":
      return executors.escalate;

  }

}


// ============================================================
// RESPONSE EXECUTION
// ============================================================

export function executeProviderRuntimeResponse(
  input:
    ProviderRuntimeResponseExecutionInput
): ProviderRuntimeResponseExecutionResult {

  const responseDecision =
    input.responseDecision;

  // ----------------------------------------------------------
  // 1. RESPONSE EXECUTION REJECTED
  // ----------------------------------------------------------

  if (
    input.responseExecution ===
    "REJECT_PROVIDER_RUNTIME_RESPONSE_EXECUTION"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_RESPONSE_EXECUTION_NOT_ALLOWED",
      "runtime_response_execution_not_allowed"
    );

  }

  // ----------------------------------------------------------
  // 2. RESPONSE DECISION DENIED
  // ----------------------------------------------------------

  if (
    responseDecision.responseDecisionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_DECISION_DENIED" ||
    responseDecision.runtimeResponseDecisionDenied ===
      true
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_RESPONSE_DECISION_DENIED",
      "runtime_response_decision_denied"
    );

  }

  // ----------------------------------------------------------
  // 3. RESPONSE NOT DECIDED
  // ----------------------------------------------------------

  if (
    responseDecision.responseDecisionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_NOT_DECIDED" ||
    responseDecision.runtimeResponseDecided ===
      false
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_RESPONSE_NOT_DECIDED",
      "runtime_response_not_decided"
    );

  }

  // ----------------------------------------------------------
  // 4. RESPONSE MISSING
  // ----------------------------------------------------------

  if (!responseDecision.runtimeResponse) {

    return buildNotExecutedResult(
      input,
      "RUNTIME_RESPONSE_MISSING",
      "runtime_response_missing"
    );

  }

  const runtimeResponse =
    responseDecision.runtimeResponse;

  // ----------------------------------------------------------
  // 5. NO_ACTION
  // ----------------------------------------------------------

  if (
    runtimeResponse ===
    "NO_ACTION"
  ) {

    return buildNoActionResult(
      input
    );

  }

  // ----------------------------------------------------------
  // 6. GOVERNED EXECUTOR REQUIRED
  // ----------------------------------------------------------

  const executor =
    executorForResponse(
      runtimeResponse,
      input.executors
    );

  if (!executor) {

    return buildNotExecutedResult(
      input,
      "RUNTIME_RESPONSE_EXECUTOR_NOT_AVAILABLE",
      "runtime_response_executor_not_available"
    );

  }

  // ----------------------------------------------------------
  // 7. GOVERNED EXECUTION
  // ----------------------------------------------------------

  const executorResult =
    executor(
      responseDecision
    );

  // ----------------------------------------------------------
  // 8. EXECUTOR RESPONSE COHERENCE
  // ----------------------------------------------------------

  if (
    executorResult.runtimeResponse !==
    runtimeResponse
  ) {

    return buildNotExecutedResult(
      input,
      "RUNTIME_RESPONSE_EXECUTION_RESULT_INCOHERENT",
      "runtime_response_execution_result_incoherent",
      executorResult.summary
    );

  }

  // ----------------------------------------------------------
  // 9. EXECUTION FAILURE
  // ----------------------------------------------------------

  if (
    executorResult.runtimeResponseExecutionSucceeded !==
    true
  ) {

    return buildNotExecutedResult(
      input,
      "RUNTIME_RESPONSE_EXECUTION_FAILED",
      "runtime_response_execution_failed",
      executorResult.summary
    );

  }

  // ----------------------------------------------------------
  // 10. RESPONSE EXECUTED
  // ----------------------------------------------------------

  return buildExecutedResult(
    input,
    executorResult
  );

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Runtime Response Execution
// receives one P9N response decision.
//
// P9O does not reinterpret the failure.
//
// P9O does not select a different response.
//
// P9O validates that P9N produced an
// executable decision.
//
// NO_ACTION is executed as an explicit
// no-intervention runtime outcome.
//
// RETRY, RECOVER, FAILOVER, STOP, and
// ESCALATE require a governed executor.
//
// P9O routes the selected response to
// exactly one governed executor.
//
// Executor success is accepted only when
// the executor preserves the response
// selected by P9N.
//
// ============================================================


// ============================================================
// RESPONSE EXECUTION PRINCIPLES
// ============================================================
//
// Runtime Response Decided
// ≠
// Runtime Response Executed
//
// Response Execution Allowed
// ≠
// Response Decision Valid
//
// Response Decision Valid
// ≠
// Governed Executor Available
//
// Governed Executor Available
// ≠
// Governed Execution Successful
//
// Retry Selected
// ≠
// Retry Executed
//
// Recovery Selected
// ≠
// Recovery Executed
//
// Failover Selected
// ≠
// Failover Executed
//
// Stop Selected
// ≠
// Runtime Stopped
//
// Escalation Selected
// ≠
// Escalation Dispatched
//
// Executor Returned
// ≠
// Executor Result Coherent
//
// ============================================================


// ============================================================
// EXECUTION BOUNDARY
// ============================================================
//
// P9O.1 is an execution router.
//
// It crosses the response execution
// boundary only through governed
// executors supplied to the contract.
//
// P9O does not know whether a governed
// executor uses:
//
// - AWS SDK
// - Vault API
// - HSM interface
// - internal runtime control
// - recovery coordinator
// - escalation authority
//
// That implementation belongs behind
// the governed executor boundary.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - verify runtime outcome
// - classify runtime failure
// - decide runtime response
// - reinterpret runtime failure
// - replace the P9N-selected response
// - directly call provider SDKs
// - directly call provider APIs
// - re-sanitize provider errors
// - alter sanitized failure surfaces
// - generate evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive P9N response decision
//
// ✓ enforce response execution gate
//
// ✓ reject denied response decisions
//
// ✓ reject not-decided response results
//
// ✓ require a selected runtime response
//
// ✓ execute NO_ACTION explicitly without
//   corrective intervention
//
// ✓ require governed executor for RETRY
//
// ✓ require governed executor for RECOVER
//
// ✓ require governed executor for FAILOVER
//
// ✓ require governed executor for STOP
//
// ✓ require governed executor for ESCALATE
//
// ✓ route exactly one selected response
//
// ✓ preserve P9N response selection
//
// ✓ reject incoherent executor response
//
// ✓ distinguish execution denied from
//   execution not completed
//
// ✓ preserve provider/runtime context
//
// ✓ preserve verification context
//
// ✓ preserve classification context
//
// ✓ preserve failure context
//
// ✓ preserve recovery context
//
// ✗ verify runtime
//
// ✗ classify runtime failure
//
// ✗ decide runtime response
//
// ✗ directly call provider SDKs
//
// ✗ directly call provider APIs
//
// ✗ re-sanitize provider errors
//
// ✗ generate evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================