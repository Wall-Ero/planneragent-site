// ============================================================
// PlannerAgent — Provider Runtime Family Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9O.provider.runtime.family.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL FAMILY TEST RUNNER
//
// DOMAIN
// ------------------------------------------------------------
// P9O — Provider Runtime Response Execution Family
//
// PURPOSE
// ------------------------------------------------------------
// Verify the canonical P9O response execution family:
//
// NO_ACTION / RETRY / RECOVER / FAILOVER / STOP / ESCALATE
//
// Verify gate precedence, upstream P9N decision gates,
// governed executor requirements, exactly-one routing,
// executor failure containment, executor coherence,
// P9N authority preservation, context propagation,
// summary copying, and P9O boundary isolation.
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
// UTILITIES
// ============================================================

function pass(label: string): void {
  console.log(`✅ ${label}`);
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
  }
}

function assertNoExecutionFlags(
  result: ProviderRuntimeResponseExecutionResult,
  label: string
): void {

  assert(result.retryExecuted === false, `${label} retry not executed`);
  assert(result.recoveryExecuted === false, `${label} recovery not executed`);
  assert(result.failoverExecuted === false, `${label} failover not executed`);
  assert(result.stopExecuted === false, `${label} stop not executed`);
  assert(
    result.escalationDispatched === false,
    `${label} escalation not dispatched`
  );
}

function executionFlagCount(
  result: ProviderRuntimeResponseExecutionResult
): number {

  return [
    result.retryExecuted,
    result.recoveryExecuted,
    result.failoverExecuted,
    result.stopExecuted,
    result.escalationDispatched,
  ].filter(Boolean).length;
}


// ============================================================
// CANONICAL CONTEXT
// ============================================================

const providerContract = "KEY_MANAGEMENT";
const providerImplementation = "AWS_KMS";
const operation = "REWRAP_KEY";
const providerResourceId = "kms-key-p9o-family";
const providerConfigurationRef = "cfg/aws-kms-prod";
const providerCredentialRef = "cred/aws-kms-prod";

const executionMetadata = {
  tenantId: "tenant-001",
  runtimeBatchId: "runtime-p9o-family-001",
};


// ============================================================
// RESPONSE FAMILY
// ============================================================

const responseFamily: ProviderRuntimeResponse[] = [
  "NO_ACTION",
  "RETRY",
  "RECOVER",
  "FAILOVER",
  "STOP",
  "ESCALATE",
];

const governedResponseFamily: Array<
  Exclude<ProviderRuntimeResponse, "NO_ACTION">
> = [
  "RETRY",
  "RECOVER",
  "FAILOVER",
  "STOP",
  "ESCALATE",
];


// ============================================================
// P9N FIXTURE SUPPORT
// ============================================================

function verificationFailureReasonForResponse(
  response: ProviderRuntimeResponse
): ProviderRuntimeResponseDecisionResult["verificationFailureReason"] {

  switch (response) {
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
  response: ProviderRuntimeResponse
): ProviderRuntimeResponseDecisionResult["runtimeFailureClass"] {

  switch (response) {
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
  response: ProviderRuntimeResponse
): ProviderRuntimeResponseDecisionResult["runtimeFailureSeverity"] {

  switch (response) {
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
  response: ProviderRuntimeResponse
): ProviderRuntimeResponseDecisionResult["failureCode"] {

  switch (response) {
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
  response: ProviderRuntimeResponse
): string | undefined {

  switch (response) {
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
  response: ProviderRuntimeResponse
): boolean {

  return response === "RECOVER" || response === "FAILOVER";
}

function buildDecidedResponse(
  response: ProviderRuntimeResponse
): ProviderRuntimeResponseDecisionResult {

  const noAction = response === "NO_ACTION";
  const recoveryIntakeRequired =
    recoveryRequiredForResponse(response);

  return {
    responseDecisionStatus:
      "PROVIDER_RUNTIME_RESPONSE_DECIDED",
    responseDecision:
      "DECIDE_PROVIDER_RUNTIME_RESPONSE",
    runtimeResponseDecisionAttempted: true,
    runtimeResponseDecided: true,
    runtimeResponseDecisionDenied: false,
    runtimeInterventionNotRequired: noAction,
    runtimeResponse: response,

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
      verificationFailureReasonForResponse(response),

    classificationStatus:
      noAction
        ? "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED"
        : "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",

    runtimeFailureClass:
      failureClassForResponse(response),

    runtimeFailureSeverity:
      failureSeverityForResponse(response),

    failureCode:
      failureCodeForResponse(response),

    providerRawStatus:
      noAction ? "KMS_SUCCESS" : "KMS_ERROR",

    providerRawErrorCode:
      rawErrorCodeForResponse(response),

    providerSanitizedErrorMessage:
      noAction
        ? undefined
        : "provider runtime failure requires governed response",

    retryable: response === "RETRY",

    recoveryIntakeRequired,
    recoveryIntakeReady: recoveryIntakeRequired,

    recoveryReason:
      recoveryIntakeRequired
        ? "PROVIDER_FAILURE_SURFACE_PRESENT"
        : undefined,

    verificationSummary:
      noAction
        ? ["provider_runtime_verified"]
        : ["provider_runtime_verification_failed"],

    classificationSummary:
      noAction
        ? ["provider_runtime_failure_classification_not_required"]
        : ["provider_runtime_failure_classified"],

    recoveryIntakeSummary:
      recoveryIntakeRequired
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
      response.toLowerCase(),
    ],
  };
}

function buildDecisionDenied():
  ProviderRuntimeResponseDecisionResult {

  return {
    ...buildDecidedResponse("ESCALATE"),
    responseDecisionStatus:
      "PROVIDER_RUNTIME_RESPONSE_DECISION_DENIED",
    runtimeResponseDecisionAttempted: false,
    runtimeResponseDecided: false,
    runtimeResponseDecisionDenied: true,
    runtimeInterventionNotRequired: false,
    runtimeResponse: undefined,
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
    ...buildDecidedResponse("ESCALATE"),
    responseDecisionStatus:
      "PROVIDER_RUNTIME_RESPONSE_NOT_DECIDED",
    runtimeResponseDecisionAttempted: true,
    runtimeResponseDecided: false,
    runtimeResponseDecisionDenied: false,
    runtimeInterventionNotRequired: false,
    runtimeResponse: undefined,
    responseDecisionFailureReason:
      "RUNTIME_RESPONSE_NOT_DETERMINABLE",
    summary: [
      "provider_runtime_failure_classified",
      "provider_runtime_response_not_decided",
      "runtime_response_not_determinable",
    ],
  };
}

function buildMissingResponse():
  ProviderRuntimeResponseDecisionResult {

  return {
    ...buildDecidedResponse("ESCALATE"),
    runtimeResponse: undefined,
    summary: [
      "provider_runtime_failure_classified",
      "provider_runtime_response_decided",
      "runtime_response_missing",
    ],
  };
}


// ============================================================
// EXECUTOR TRACKING
// ============================================================

interface ExecutorTracker {
  retry: number;
  recover: number;
  failover: number;
  stop: number;
  escalate: number;
}

function buildTracker(): ExecutorTracker {
  return {
    retry: 0,
    recover: 0,
    failover: 0,
    stop: 0,
    escalate: 0,
  };
}

function totalInvocations(
  tracker: ExecutorTracker
): number {

  return (
    tracker.retry +
    tracker.recover +
    tracker.failover +
    tracker.stop +
    tracker.escalate
  );
}

function incrementTracker(
  response: Exclude<ProviderRuntimeResponse, "NO_ACTION">,
  tracker: ExecutorTracker
): void {

  switch (response) {
    case "RETRY":
      tracker.retry += 1;
      return;
    case "RECOVER":
      tracker.recover += 1;
      return;
    case "FAILOVER":
      tracker.failover += 1;
      return;
    case "STOP":
      tracker.stop += 1;
      return;
    case "ESCALATE":
      tracker.escalate += 1;
      return;
  }
}

function buildExecutor(
  selectedResponse:
    Exclude<ProviderRuntimeResponse, "NO_ACTION">,
  tracker: ExecutorTracker,
  succeeded: boolean = true,
  returnedResponse:
    ProviderRuntimeResponse = selectedResponse,
  summaryToken?: string
): ProviderRuntimeResponseExecutor {

  return (decision) => {

    incrementTracker(
      selectedResponse,
      tracker
    );

    assert(
      decision.runtimeResponse === selectedResponse,
      `${selectedResponse} executor receives selected response`
    );

    return {
      runtimeResponse: returnedResponse,
      runtimeResponseExecutionSucceeded: succeeded,
      summary: [
        summaryToken ??
          `provider_runtime_${selectedResponse.toLowerCase()}_executor_${
            succeeded ? "succeeded" : "failed"
          }`,
      ],
    };
  };
}

function buildExecutors(
  tracker: ExecutorTracker
): ProviderRuntimeResponseExecutors {

  return {
    retry: buildExecutor("RETRY", tracker),
    recover: buildExecutor("RECOVER", tracker),
    failover: buildExecutor("FAILOVER", tracker),
    stop: buildExecutor("STOP", tracker),
    escalate: buildExecutor("ESCALATE", tracker),
  };
}

function executorsFor(
  response: Exclude<ProviderRuntimeResponse, "NO_ACTION">,
  executor: ProviderRuntimeResponseExecutor
): ProviderRuntimeResponseExecutors {

  switch (response) {
    case "RETRY":
      return { retry: executor };
    case "RECOVER":
      return { recover: executor };
    case "FAILOVER":
      return { failover: executor };
    case "STOP":
      return { stop: executor };
    case "ESCALATE":
      return { escalate: executor };
  }
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
      buildDecidedResponse("ESCALATE"),
    executors: {},
    responseExecution:
      "EXECUTE_PROVIDER_RUNTIME_RESPONSE",
    ...overrides,
  };
}


// ============================================================
// SCENARIO 1 — COMPLETE FAMILY MATRIX
// ============================================================

function runCompleteFamilyMatrix(): void {

  for (const response of responseFamily) {

    const tracker = buildTracker();
    const responseDecision =
      buildDecidedResponse(response);

    const result =
      executeProviderRuntimeResponse(
        buildInput({
          responseDecision,
          executors: buildExecutors(tracker),
        })
      );

    assert(
      result.responseExecutionStatus ===
        "PROVIDER_RUNTIME_RESPONSE_EXECUTED",
      `${response} executed`
    );

    assert(
      result.runtimeResponseExecutionAttempted === true,
      `${response} execution attempted`
    );

    assert(
      result.runtimeResponseExecuted === true,
      `${response} execution completed`
    );

    assert(
      result.runtimeResponseExecutionDenied === false,
      `${response} execution not denied`
    );

    assert(
      result.runtimeResponse === response,
      `${response} preserved`
    );

    if (response === "NO_ACTION") {

      assert(
        result.runtimeInterventionNotRequired === true,
        "NO_ACTION preserves no-intervention semantics"
      );

      assert(
        totalInvocations(tracker) === 0,
        "NO_ACTION invokes no executor"
      );

      assertNoExecutionFlags(result, "NO_ACTION");

    } else {

      assert(
        result.runtimeInterventionNotRequired === false,
        `${response} preserves intervention semantics`
      );

      assert(
        totalInvocations(tracker) === 1,
        `${response} invokes exactly one executor`
      );

      assert(
        executionFlagCount(result) === 1,
        `${response} asserts exactly one execution flag`
      );
    }

    assert(
      result.summary.includes(
        "provider_runtime_response_executed"
      ),
      `${response} terminal execution token preserved`
    );

    assert(
      result.summary.includes(response.toLowerCase()),
      `${response} response token preserved`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

    pass(`${response} family member verified`);
  }
}


// ============================================================
// SCENARIO 2 — EXECUTION FLAG EXCLUSIVITY
// ============================================================

function runExecutionFlagExclusivity(): void {

  const expectedFlags = {
    RETRY: "retryExecuted",
    RECOVER: "recoveryExecuted",
    FAILOVER: "failoverExecuted",
    STOP: "stopExecuted",
    ESCALATE: "escalationDispatched",
  } as const;

  for (const response of governedResponseFamily) {

    const tracker = buildTracker();

    const result =
      executeProviderRuntimeResponse(
        buildInput({
          responseDecision:
            buildDecidedResponse(response),
          executors:
            buildExecutors(tracker),
        })
      );

    const expectedFlag =
      expectedFlags[response];

    assert(
      result[expectedFlag] === true,
      `${response} asserts ${expectedFlag}`
    );

    assert(
      executionFlagCount(result) === 1,
      `${response} asserts no competing flag`
    );

    pass(`${response} execution flag exclusivity verified`);
  }
}


// ============================================================
// SCENARIO 3 — EXECUTION GATE PRECEDENCE
// ============================================================

function runExecutionGatePrecedence(): void {

  const decisions: ProviderRuntimeResponseDecisionResult[] = [
    ...responseFamily.map(buildDecidedResponse),
    buildDecisionDenied(),
    buildResponseNotDecided(),
    buildMissingResponse(),
  ];

  for (const responseDecision of decisions) {

    const tracker = buildTracker();

    const result =
      executeProviderRuntimeResponse(
        buildInput({
          responseDecision,
          executors: buildExecutors(tracker),
          responseExecution:
            "REJECT_PROVIDER_RUNTIME_RESPONSE_EXECUTION",
        })
      );

    assert(
      result.responseExecutionStatus ===
        "PROVIDER_RUNTIME_RESPONSE_EXECUTION_DENIED",
      "execution rejection has family-wide precedence"
    );

    assert(
      result.responseExecutionDenialReason ===
        "RUNTIME_RESPONSE_EXECUTION_NOT_ALLOWED",
      "execution gate denial reason preserved"
    );

    assert(
      result.runtimeResponseExecutionAttempted === false,
      "rejected execution not attempted"
    );

    assert(
      totalInvocations(tracker) === 0,
      "rejected execution invokes no executor"
    );

    assertNoExecutionFlags(
      result,
      "execution gate precedence"
    );
  }

  pass("execution gate precedence verified");
}


// ============================================================
// SCENARIO 4 — P9N DECISION GATES
// ============================================================

function runP9NDecisionGates(): void {

  const denied =
    executeProviderRuntimeResponse(
      buildInput({
        responseDecision:
          buildDecisionDenied(),
      })
    );

  assert(
    denied.responseExecutionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_EXECUTION_DENIED",
    "denied P9N decision blocks execution"
  );

  assert(
    denied.responseExecutionDenialReason ===
      "RUNTIME_RESPONSE_DECISION_DENIED",
    "P9N denial reason preserved"
  );

  assertNoExecutionFlags(
    denied,
    "denied P9N decision"
  );

  const notDecided =
    executeProviderRuntimeResponse(
      buildInput({
        responseDecision:
          buildResponseNotDecided(),
      })
    );

  assert(
    notDecided.responseExecutionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_EXECUTION_DENIED",
    "not-decided P9N result blocks execution"
  );

  assert(
    notDecided.responseExecutionDenialReason ===
      "RUNTIME_RESPONSE_NOT_DECIDED",
    "P9N not-decided reason preserved"
  );

  assertNoExecutionFlags(
    notDecided,
    "not-decided P9N result"
  );

  pass("P9N decision gates preserved");
}


// ============================================================
// SCENARIO 5 — SELECTED RESPONSE REQUIRED
// ============================================================

function runSelectedResponseRequirement(): void {

  const result =
    executeProviderRuntimeResponse(
      buildInput({
        responseDecision:
          buildMissingResponse(),
      })
    );

  assert(
    result.responseExecutionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",
    "missing selected response not executed"
  );

  assert(
    result.responseExecutionFailureReason ===
      "RUNTIME_RESPONSE_MISSING",
    "missing response reason preserved"
  );

  assert(
    result.runtimeResponseExecutionAttempted === true,
    "missing response reaches execution precondition"
  );

  assertNoExecutionFlags(
    result,
    "missing selected response"
  );

  pass("selected response requirement verified");
}


// ============================================================
// SCENARIO 6 — GOVERNED EXECUTOR REQUIRED
// ============================================================

function runGovernedExecutorRequirement(): void {

  for (const response of governedResponseFamily) {

    const result =
      executeProviderRuntimeResponse(
        buildInput({
          responseDecision:
            buildDecidedResponse(response),
          executors: {},
        })
      );

    assert(
      result.responseExecutionStatus ===
        "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",
      `${response} without executor not executed`
    );

    assert(
      result.responseExecutionFailureReason ===
        "RUNTIME_RESPONSE_EXECUTOR_NOT_AVAILABLE",
      `${response} governed executor required`
    );

    assert(
      result.runtimeResponse === response,
      `${response} selection preserved`
    );

    assertNoExecutionFlags(
      result,
      `${response} missing executor`
    );

    pass(`${response} executor requirement verified`);
  }
}


// ============================================================
// SCENARIO 7 — EXECUTOR FAILURE CONTAINMENT
// ============================================================

function runExecutorFailureContainment(): void {

  for (const response of governedResponseFamily) {

    const tracker = buildTracker();

    const executor =
      buildExecutor(
        response,
        tracker,
        false
      );

    const result =
      executeProviderRuntimeResponse(
        buildInput({
          responseDecision:
            buildDecidedResponse(response),
          executors:
            executorsFor(response, executor),
        })
      );

    assert(
      result.responseExecutionStatus ===
        "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",
      `${response} failed executor not completed`
    );

    assert(
      result.responseExecutionFailureReason ===
        "RUNTIME_RESPONSE_EXECUTION_FAILED",
      `${response} executor failure preserved`
    );

    assert(
      totalInvocations(tracker) === 1,
      `${response} failed executor invoked once`
    );

    assert(
      result.runtimeResponse === response,
      `${response} selection survives executor failure`
    );

    assertNoExecutionFlags(
      result,
      `${response} executor failure`
    );

    assert(
      result.executorSummary !== undefined,
      `${response} failed executor summary propagated`
    );

    pass(`${response} executor failure containment verified`);
  }
}


// ============================================================
// SCENARIO 8 — EXECUTOR COHERENCE / P9N AUTHORITY
// ============================================================

function runExecutorCoherenceAndAuthority(): void {

  for (
    let index = 0;
    index < governedResponseFamily.length;
    index += 1
  ) {

    const selected =
      governedResponseFamily[index];

    const replacement =
      governedResponseFamily[
        (index + 1) %
        governedResponseFamily.length
      ];

    const tracker = buildTracker();

    const executor =
      buildExecutor(
        selected,
        tracker,
        true,
        replacement,
        "provider_runtime_executor_attempted_response_replacement"
      );

    const result =
      executeProviderRuntimeResponse(
        buildInput({
          responseDecision:
            buildDecidedResponse(selected),
          executors:
            executorsFor(selected, executor),
        })
      );

    assert(
      result.responseExecutionStatus ===
        "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",
      `${selected} incoherent result rejected`
    );

    assert(
      result.responseExecutionFailureReason ===
        "RUNTIME_RESPONSE_EXECUTION_RESULT_INCOHERENT",
      `${selected} incoherence reason preserved`
    );

    assert(
      result.runtimeResponse === selected,
      `${selected} P9N selection remains authoritative`
    );

    assert(
      result.runtimeResponse !== replacement,
      `${selected} executor cannot replace response`
    );

    assert(
      totalInvocations(tracker) === 1,
      `${selected} incoherent executor invoked once`
    );

    assertNoExecutionFlags(
      result,
      `${selected} incoherent result`
    );

    pass(`${selected} coherence and P9N authority verified`);
  }
}


// ============================================================
// SCENARIO 9 — EXACTLY ONE EXECUTOR
// ============================================================

function runExactlyOneExecutorInvariant(): void {

  const expectedTrackers: Record<
    Exclude<ProviderRuntimeResponse, "NO_ACTION">,
    ExecutorTracker
  > = {
    RETRY: {
      retry: 1,
      recover: 0,
      failover: 0,
      stop: 0,
      escalate: 0,
    },
    RECOVER: {
      retry: 0,
      recover: 1,
      failover: 0,
      stop: 0,
      escalate: 0,
    },
    FAILOVER: {
      retry: 0,
      recover: 0,
      failover: 1,
      stop: 0,
      escalate: 0,
    },
    STOP: {
      retry: 0,
      recover: 0,
      failover: 0,
      stop: 1,
      escalate: 0,
    },
    ESCALATE: {
      retry: 0,
      recover: 0,
      failover: 0,
      stop: 0,
      escalate: 1,
    },
  };

  for (const response of governedResponseFamily) {

    const tracker = buildTracker();

    const result =
      executeProviderRuntimeResponse(
        buildInput({
          responseDecision:
            buildDecidedResponse(response),
          executors:
            buildExecutors(tracker),
        })
      );

    assert(
      result.runtimeResponseExecuted === true,
      `${response} execution succeeds`
    );

    assert(
      totalInvocations(tracker) === 1,
      `${response} invokes exactly one executor`
    );

    assert.deepEqual(
      tracker,
      expectedTrackers[response],
      `${response} routes exclusively to matching executor`
    );

    pass(`${response} exactly-one-executor invariant verified`);
  }
}


// ============================================================
// SCENARIO 10 — CONTEXT PROPAGATION
// ============================================================

function runContextPropagation(): void {

  for (const response of responseFamily) {

    const tracker = buildTracker();

    const decision =
      buildDecidedResponse(response);

    const result =
      executeProviderRuntimeResponse(
        buildInput({
          responseDecision: decision,
          executors: buildExecutors(tracker),
        })
      );

    assert(
      result.providerContract === decision.providerContract,
      `${response} providerContract propagated`
    );

    assert(
      result.providerImplementation ===
        decision.providerImplementation,
      `${response} providerImplementation propagated`
    );

    assert(
      result.operation === decision.operation,
      `${response} operation propagated`
    );

    assert(
      result.providerResourceId ===
        decision.providerResourceId,
      `${response} providerResourceId propagated`
    );

    assert(
      result.providerConfigurationRef ===
        decision.providerConfigurationRef,
      `${response} providerConfigurationRef propagated`
    );

    assert(
      result.providerCredentialRef ===
        decision.providerCredentialRef,
      `${response} providerCredentialRef propagated`
    );

    assert.deepEqual(
      result.executionMetadata,
      decision.executionMetadata,
      `${response} executionMetadata propagated`
    );

    assert(
      result.verificationStatus ===
        decision.verificationStatus,
      `${response} verificationStatus propagated`
    );

    assert(
      result.verificationFailureReason ===
        decision.verificationFailureReason,
      `${response} verificationFailureReason propagated`
    );

    assert(
      result.classificationStatus ===
        decision.classificationStatus,
      `${response} classificationStatus propagated`
    );

    assert(
      result.runtimeFailureClass ===
        decision.runtimeFailureClass,
      `${response} runtimeFailureClass propagated`
    );

    assert(
      result.runtimeFailureSeverity ===
        decision.runtimeFailureSeverity,
      `${response} runtimeFailureSeverity propagated`
    );

    assert(
      result.failureCode === decision.failureCode,
      `${response} failureCode propagated`
    );

    assert(
      result.providerRawStatus ===
        decision.providerRawStatus,
      `${response} providerRawStatus propagated`
    );

    assert(
      result.providerRawErrorCode ===
        decision.providerRawErrorCode,
      `${response} providerRawErrorCode propagated`
    );

    assert(
      result.providerSanitizedErrorMessage ===
        decision.providerSanitizedErrorMessage,
      `${response} sanitized error propagated`
    );

    assert(
      result.retryable === decision.retryable,
      `${response} retryable propagated`
    );

    assert(
      result.recoveryIntakeRequired ===
        decision.recoveryIntakeRequired,
      `${response} recoveryIntakeRequired propagated`
    );

    assert(
      result.recoveryIntakeReady ===
        decision.recoveryIntakeReady,
      `${response} recoveryIntakeReady propagated`
    );

    assert(
      result.recoveryReason === decision.recoveryReason,
      `${response} recoveryReason propagated`
    );

    assert.deepEqual(
      result.responseDecisionSummary,
      decision.summary,
      `${response} decision summary propagated`
    );

    assert.notEqual(
      result.responseDecisionSummary,
      decision.summary,
      `${response} decision summary copied`
    );

    pass(`${response} context propagation verified`);
  }
}


// ============================================================
// SCENARIO 11 — EXECUTOR SUMMARY COPYING
// ============================================================

function runExecutorSummaryCopying(): void {

  for (const response of governedResponseFamily) {

    const tracker = buildTracker();

    const executorSummary = [
      `provider_runtime_${response.toLowerCase()}_executor_started`,
      `provider_runtime_${response.toLowerCase()}_executor_succeeded`,
    ];

    const executor: ProviderRuntimeResponseExecutor =
      (decision) => {

        incrementTracker(response, tracker);

        assert(
          decision.runtimeResponse === response,
          `${response} summary executor receives selected response`
        );

        return {
          runtimeResponse: response,
          runtimeResponseExecutionSucceeded: true,
          summary: executorSummary,
        };
      };

    const result =
      executeProviderRuntimeResponse(
        buildInput({
          responseDecision:
            buildDecidedResponse(response),
          executors:
            executorsFor(response, executor),
        })
      );

    assert.deepEqual(
      result.executorSummary,
      executorSummary,
      `${response} executor summary propagated`
    );

    assert.notEqual(
      result.executorSummary,
      executorSummary,
      `${response} executor summary copied`
    );

    for (const token of executorSummary) {
      assert(
        result.summary.includes(token),
        `${response} terminal summary includes ${token}`
      );
    }

    assert(
      result.summary.includes(
        "provider_runtime_response_executed"
      ),
      `${response} terminal token preserved`
    );

    pass(`${response} executor summary copying verified`);
  }
}


// ============================================================
// SCENARIO 12 — BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const results:
    ProviderRuntimeResponseExecutionResult[] = [];

  for (const response of responseFamily) {

    const tracker = buildTracker();

    results.push(
      executeProviderRuntimeResponse(
        buildInput({
          responseDecision:
            buildDecidedResponse(response),
          executors:
            buildExecutors(tracker),
        })
      )
    );
  }

  results.push(
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
          buildMissingResponse(),
      })
    )
  );

  for (const result of results) {
    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );
  }

  pass("P9O family boundary verification completed");
}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runCompleteFamilyMatrix();

  runExecutionFlagExclusivity();

  runExecutionGatePrecedence();

  runP9NDecisionGates();

  runSelectedResponseRequirement();

  runGovernedExecutorRequirement();

  runExecutorFailureContainment();

  runExecutorCoherenceAndAuthority();

  runExactlyOneExecutorInvariant();

  runContextPropagation();

  runExecutorSummaryCopying();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9O PROVIDER RUNTIME FAMILY");
  console.log("========================================");
  console.log("");

  console.log("Canonical Response Family:");
  console.log("✓ NO_ACTION");
  console.log("✓ RETRY");
  console.log("✓ RECOVER");
  console.log("✓ FAILOVER");
  console.log("✓ STOP");
  console.log("✓ ESCALATE");

  console.log("");
  console.log("Execution Gates:");
  console.log("✓ response execution gate has precedence");
  console.log("✓ denied P9N decision blocks execution");
  console.log("✓ not-decided P9N result blocks execution");
  console.log("✓ selected runtime response required");

  console.log("");
  console.log("Governed Execution:");
  console.log("✓ NO_ACTION executes without executor");
  console.log("✓ corrective responses require executor");
  console.log("✓ executor failure is contained");
  console.log("✓ incoherent executor result is rejected");

  console.log("");
  console.log("Execution Exclusivity:");
  console.log("✓ exactly one governed executor invoked");
  console.log("✓ exactly one matching execution flag asserted");
  console.log("✓ P9N-selected response remains authoritative");
  console.log("✓ executor cannot replace selected response");

  console.log("");
  console.log("Contract Propagation:");
  console.log("✓ provider/runtime context");
  console.log("✓ verification context");
  console.log("✓ classification context");
  console.log("✓ failure context");
  console.log("✓ recovery context");
  console.log("✓ response decision summary copied");
  console.log("✓ executor summary copied");
  console.log("✓ terminal execution summary composed");

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
  console.log("P9O PROVIDER RUNTIME FAMILY VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();