// ============================================================
// PlannerAgent — Provider Runtime Execution Outcome Certification
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9P.provider.runtime.execution.outcome.certification.ts
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
// P9P.1 — Provider Runtime Execution Outcome Certification
//
// PURPOSE
// ------------------------------------------------------------
// Certify the canonical execution outcome
// produced by P9O.
//
// P9P receives:
//
// - ProviderRuntimeResponseExecutionResult
// - ProviderRuntimeExecutionOutcomeCertification gate
//
// P9P validates whether the P9O terminal
// execution state is coherent and
// sufficiently represented to produce
// canonical execution evidence.
//
// P9P certifies operational fact.
//
// P9P does not require execution success
// in order to certify an outcome.
//
// A contained P9O execution failure may
// be certified as a failed execution
// outcome.
//
// P9P does not verify runtime.
//
// P9P does not classify runtime failure.
//
// P9P does not decide runtime response.
//
// P9P does not execute runtime response.
//
// P9P does not persist evidence.
//
// P9P does not write ledger.
//
// P9P does not perform audit.
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
// P9P certifies execution outcome.
//
// Execution Succeeded
// ≠
// Execution Outcome Certified
//
// Execution Failed
// ≠
// Execution Outcome Not Certifiable
//
// Evidence Composed
// ≠
// Evidence Persisted
//
// ============================================================

import type {
  ProviderRuntimeResponse,
} from "./P9N.provider.runtime.response.decision";

import type {
  ProviderRuntimeResponseExecutionResult,
} from "./P9O.provider.runtime.response.execution";


// ============================================================
// CERTIFICATION STATUS
// ============================================================

export type ProviderRuntimeExecutionOutcomeCertificationStatus =
  | "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFIED"
  | "PROVIDER_RUNTIME_EXECUTION_OUTCOME_NOT_CERTIFIED"
  | "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_DENIED";


// ============================================================
// CERTIFICATION GATE
// ============================================================

export type ProviderRuntimeExecutionOutcomeCertification =
  | "CERTIFY_PROVIDER_RUNTIME_EXECUTION_OUTCOME"
  | "REJECT_PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFICATION";


// ============================================================
// CERTIFICATION DENIAL REASON
// ============================================================

export type ProviderRuntimeExecutionOutcomeCertificationDenialReason =
  | "RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_NOT_ALLOWED"
  | "RUNTIME_RESPONSE_EXECUTION_DENIED";


// ============================================================
// CERTIFICATION FAILURE REASON
// ============================================================

export type ProviderRuntimeExecutionOutcomeCertificationFailureReason =
  | "RUNTIME_RESPONSE_EXECUTION_STATE_INCOHERENT"
  | "RUNTIME_RESPONSE_EXECUTION_CONTEXT_INCOHERENT"
  | "RUNTIME_RESPONSE_EXECUTION_EVIDENCE_INSUFFICIENT"
  | "RUNTIME_RESPONSE_EXECUTION_OUTCOME_NOT_DETERMINABLE";


// ============================================================
// CERTIFIED EXECUTION OUTCOME
// ============================================================

export type ProviderRuntimeCertifiedExecutionOutcome =
  | "NO_ACTION_COMPLETED"
  | "RETRY_COMPLETED"
  | "RECOVERY_COMPLETED"
  | "FAILOVER_COMPLETED"
  | "STOP_COMPLETED"
  | "ESCALATION_COMPLETED"
  | "RETRY_FAILED"
  | "RECOVERY_FAILED"
  | "FAILOVER_FAILED"
  | "STOP_FAILED"
  | "ESCALATION_FAILED";


// ============================================================
// EXECUTION EVIDENCE
// ============================================================

export interface ProviderRuntimeExecutionEvidence {

  evidenceType:
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME";

  providerContract:
    ProviderRuntimeResponseExecutionResult["providerContract"];

  providerImplementation:
    ProviderRuntimeResponseExecutionResult["providerImplementation"];

  operation:
    ProviderRuntimeResponseExecutionResult["operation"];

  providerResourceId?:
    ProviderRuntimeResponseExecutionResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeResponseExecutionResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeResponseExecutionResult["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeResponseExecutionResult["executionMetadata"];

  verificationStatus:
    ProviderRuntimeResponseExecutionResult["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeResponseExecutionResult["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeResponseExecutionResult["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeResponseExecutionResult["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeResponseExecutionResult["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeResponseExecutionResult["failureCode"];

  providerRawStatus?:
    ProviderRuntimeResponseExecutionResult["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeResponseExecutionResult["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeResponseExecutionResult["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeResponseExecutionResult["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeResponseExecutionResult["recoveryIntakeRequired"];

  recoveryIntakeReady:
    ProviderRuntimeResponseExecutionResult["recoveryIntakeReady"];

  recoveryReason?:
    ProviderRuntimeResponseExecutionResult["recoveryReason"];

  runtimeResponse:
    ProviderRuntimeResponse;

  responseExecutionStatus:
    ProviderRuntimeResponseExecutionResult["responseExecutionStatus"];

  runtimeResponseExecutionAttempted:
    boolean;

  runtimeResponseExecuted:
    boolean;

  runtimeInterventionNotRequired:
    boolean;

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

  certifiedExecutionOutcome:
    ProviderRuntimeCertifiedExecutionOutcome;

  executorFailureContained:
    boolean;

  responseDecisionSummary:
    string[];

  executorSummary?:
    string[];

  responseExecutionSummary:
    string[];

}


// ============================================================
// INPUT
// ============================================================

export interface ProviderRuntimeExecutionOutcomeCertificationInput {

  execution:
    ProviderRuntimeResponseExecutionResult;

  certification:
    ProviderRuntimeExecutionOutcomeCertification;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderRuntimeExecutionOutcomeCertificationResult {

  certificationStatus:
    ProviderRuntimeExecutionOutcomeCertificationStatus;

  certification:
    ProviderRuntimeExecutionOutcomeCertification;

  runtimeExecutionOutcomeCertificationAttempted:
    boolean;

  runtimeExecutionOutcomeCertified:
    boolean;

  runtimeExecutionOutcomeCertificationDenied:
    boolean;

  certificationDenialReason?:
    ProviderRuntimeExecutionOutcomeCertificationDenialReason;

  certificationFailureReason?:
    ProviderRuntimeExecutionOutcomeCertificationFailureReason;

  certifiedExecutionOutcome?:
    ProviderRuntimeCertifiedExecutionOutcome;

  executionEvidence?:
    ProviderRuntimeExecutionEvidence;

  providerContract:
    ProviderRuntimeResponseExecutionResult["providerContract"];

  providerImplementation:
    ProviderRuntimeResponseExecutionResult["providerImplementation"];

  operation:
    ProviderRuntimeResponseExecutionResult["operation"];

  providerResourceId?:
    ProviderRuntimeResponseExecutionResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeResponseExecutionResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeResponseExecutionResult["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeResponseExecutionResult["executionMetadata"];

  verificationStatus:
    ProviderRuntimeResponseExecutionResult["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeResponseExecutionResult["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeResponseExecutionResult["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeResponseExecutionResult["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeResponseExecutionResult["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeResponseExecutionResult["failureCode"];

  providerRawStatus?:
    ProviderRuntimeResponseExecutionResult["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeResponseExecutionResult["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeResponseExecutionResult["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeResponseExecutionResult["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeResponseExecutionResult["recoveryIntakeRequired"];

  recoveryIntakeReady:
    ProviderRuntimeResponseExecutionResult["recoveryIntakeReady"];

  recoveryReason?:
    ProviderRuntimeResponseExecutionResult["recoveryReason"];

  runtimeResponse?:
    ProviderRuntimeResponseExecutionResult["runtimeResponse"];

  responseExecutionStatus:
    ProviderRuntimeResponseExecutionResult["responseExecutionStatus"];

  runtimeResponseExecutionAttempted:
    boolean;

  runtimeResponseExecuted:
    boolean;

  runtimeInterventionNotRequired:
    boolean;

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

  responseDecisionSummary:
    string[];

  executorSummary?:
    string[];

  responseExecutionSummary:
    string[];

  summary:
    string[];

}



// ============================================================
// SAFE SUMMARY COPY
// ============================================================

function copySummary(
  value: unknown
): string[] {

  if (!Array.isArray(value)) {

    return [];

  }

  return value.filter(
    (item): item is string =>
      typeof item === "string"
  );

}

// ============================================================
// CONTEXT PROPAGATION
// ============================================================

function executionContext(
  execution:
    ProviderRuntimeResponseExecutionResult
) {

  return {

    providerContract:
      execution.providerContract,

    providerImplementation:
      execution.providerImplementation,

    operation:
      execution.operation,

    providerResourceId:
      execution.providerResourceId,

    providerConfigurationRef:
      execution.providerConfigurationRef,

    providerCredentialRef:
      execution.providerCredentialRef,

    executionMetadata:
      execution.executionMetadata,

    verificationStatus:
      execution.verificationStatus,

    verificationFailureReason:
      execution.verificationFailureReason,

    classificationStatus:
      execution.classificationStatus,

    runtimeFailureClass:
      execution.runtimeFailureClass,

    runtimeFailureSeverity:
      execution.runtimeFailureSeverity,

    failureCode:
      execution.failureCode,

    providerRawStatus:
      execution.providerRawStatus,

    providerRawErrorCode:
      execution.providerRawErrorCode,

    providerSanitizedErrorMessage:
      execution.providerSanitizedErrorMessage,

    retryable:
      execution.retryable,

    recoveryIntakeRequired:
      execution.recoveryIntakeRequired,

    recoveryIntakeReady:
      execution.recoveryIntakeReady,

    recoveryReason:
      execution.recoveryReason,

    runtimeResponse:
      execution.runtimeResponse,

    responseExecutionStatus:
      execution.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      execution.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      execution.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      execution.runtimeInterventionNotRequired,

    retryExecuted:
      execution.retryExecuted,

    recoveryExecuted:
      execution.recoveryExecuted,

    failoverExecuted:
      execution.failoverExecuted,

    stopExecuted:
      execution.stopExecuted,

    escalationDispatched:
      execution.escalationDispatched,

    responseDecisionSummary:
      copySummary(
        execution.responseDecisionSummary
      ),

    executorSummary:
      execution.executorSummary === undefined
        ? undefined
        : copySummary(
            execution.executorSummary
          ),

    responseExecutionSummary:
      copySummary(
        execution.summary
      ),

  };

}


// ============================================================
// EXECUTION FLAG COUNT
// ============================================================

function executionFlagCount(
  execution:
    ProviderRuntimeResponseExecutionResult
): number {

  return [

    execution.retryExecuted,

    execution.recoveryExecuted,

    execution.failoverExecuted,

    execution.stopExecuted,

    execution.escalationDispatched,

  ].filter(
    (value) =>
      value === true
  ).length;

}


// ============================================================
// EXECUTION CONTEXT COHERENCE
// ============================================================

function executionContextCoherent(
  execution:
    ProviderRuntimeResponseExecutionResult
): boolean {

  if (
    !execution.providerContract ||
    !execution.providerImplementation ||
    !execution.operation
  ) {

    return false;

  }

  if (
    !Array.isArray(
      execution.responseDecisionSummary
    ) ||
    !Array.isArray(
      execution.summary
    )
  ) {

    return false;

  }

  return true;

}


// ============================================================
// EXECUTION STATE COHERENCE
// ============================================================

function executionStateCoherent(
  execution:
    ProviderRuntimeResponseExecutionResult
): boolean {

  const flagCount =
    executionFlagCount(
      execution
    );

  if (
    execution.responseExecutionStatus ===
    "PROVIDER_RUNTIME_RESPONSE_EXECUTED"
  ) {

    if (
      execution.runtimeResponseExecutionAttempted !==
        true ||
      execution.runtimeResponseExecuted !==
        true ||
      execution.runtimeResponseExecutionDenied !==
        false ||
      !execution.runtimeResponse
    ) {

      return false;

    }

    switch (execution.runtimeResponse) {

      case "NO_ACTION":
        return (
          execution.runtimeInterventionNotRequired ===
            true &&
          flagCount ===
            0
        );

      case "RETRY":
        return (
          execution.runtimeInterventionNotRequired ===
            false &&
          flagCount ===
            1 &&
          execution.retryExecuted ===
            true
        );

      case "RECOVER":
        return (
          execution.runtimeInterventionNotRequired ===
            false &&
          flagCount ===
            1 &&
          execution.recoveryExecuted ===
            true
        );

      case "FAILOVER":
        return (
          execution.runtimeInterventionNotRequired ===
            false &&
          flagCount ===
            1 &&
          execution.failoverExecuted ===
            true
        );

      case "STOP":
        return (
          execution.runtimeInterventionNotRequired ===
            false &&
          flagCount ===
            1 &&
          execution.stopExecuted ===
            true
        );

      case "ESCALATE":
        return (
          execution.runtimeInterventionNotRequired ===
            false &&
          flagCount ===
            1 &&
          execution.escalationDispatched ===
            true
        );

    }

  }

  if (
    execution.responseExecutionStatus ===
    "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED"
  ) {

    return (
      execution.runtimeResponseExecutionAttempted ===
        true &&
      execution.runtimeResponseExecuted ===
        false &&
      execution.runtimeResponseExecutionDenied ===
        false &&
      flagCount ===
        0
    );

  }

  return false;

}


// ============================================================
// FAILED OUTCOME CERTIFIABILITY
// ============================================================

function failedOutcomeCertifiable(
  execution:
    ProviderRuntimeResponseExecutionResult
): boolean {

  return (
    execution.responseExecutionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED" &&
    execution.runtimeResponseExecutionAttempted ===
      true &&
    execution.runtimeResponseExecuted ===
      false &&
    execution.runtimeResponseExecutionDenied ===
      false &&
    execution.responseExecutionFailureReason ===
      "RUNTIME_RESPONSE_EXECUTION_FAILED" &&
    execution.runtimeResponse !==
      undefined &&
    execution.runtimeResponse !==
      "NO_ACTION" &&
    Array.isArray(
      execution.executorSummary
    )
  );

}


// ============================================================
// CERTIFIED OUTCOME DERIVATION
// ============================================================

function certifiedOutcomeForExecution(
  execution:
    ProviderRuntimeResponseExecutionResult
): ProviderRuntimeCertifiedExecutionOutcome | undefined {

  const runtimeResponse =
    execution.runtimeResponse;

  if (!runtimeResponse) {

    return undefined;

  }

  if (
    execution.responseExecutionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_EXECUTED" &&
    execution.runtimeResponseExecuted ===
      true
  ) {

    switch (runtimeResponse) {

      case "NO_ACTION":
        return "NO_ACTION_COMPLETED";

      case "RETRY":
        return "RETRY_COMPLETED";

      case "RECOVER":
        return "RECOVERY_COMPLETED";

      case "FAILOVER":
        return "FAILOVER_COMPLETED";

      case "STOP":
        return "STOP_COMPLETED";

      case "ESCALATE":
        return "ESCALATION_COMPLETED";

    }

  }

  if (
    failedOutcomeCertifiable(
      execution
    )
  ) {

    switch (runtimeResponse) {

      case "RETRY":
        return "RETRY_FAILED";

      case "RECOVER":
        return "RECOVERY_FAILED";

      case "FAILOVER":
        return "FAILOVER_FAILED";

      case "STOP":
        return "STOP_FAILED";

      case "ESCALATE":
        return "ESCALATION_FAILED";

      case "NO_ACTION":
        return undefined;

    }

  }

  return undefined;

}


// ============================================================
// DENIED RESULT
// ============================================================

function buildDeniedResult(
  input:
    ProviderRuntimeExecutionOutcomeCertificationInput,
  certificationDenialReason:
    ProviderRuntimeExecutionOutcomeCertificationDenialReason,
  summaryToken:
    string
): ProviderRuntimeExecutionOutcomeCertificationResult {

  const execution =
    input.execution;

  return {

    certificationStatus:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_DENIED",

    certification:
      input.certification,

    runtimeExecutionOutcomeCertificationAttempted:
      false,

    runtimeExecutionOutcomeCertified:
      false,

    runtimeExecutionOutcomeCertificationDenied:
      true,

    certificationDenialReason,

    ...executionContext(
      execution
    ),

    summary: [
      ...copySummary(
        execution.summary
      ),
      "provider_runtime_execution_outcome_certification_denied",
      summaryToken,
    ],

  };

}


// ============================================================
// NOT CERTIFIED RESULT
// ============================================================

function buildNotCertifiedResult(
  input:
    ProviderRuntimeExecutionOutcomeCertificationInput,
  certificationFailureReason:
    ProviderRuntimeExecutionOutcomeCertificationFailureReason,
  summaryToken:
    string
): ProviderRuntimeExecutionOutcomeCertificationResult {

  const execution =
    input.execution;

  return {

    certificationStatus:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME_NOT_CERTIFIED",

    certification:
      input.certification,

    runtimeExecutionOutcomeCertificationAttempted:
      true,

    runtimeExecutionOutcomeCertified:
      false,

    runtimeExecutionOutcomeCertificationDenied:
      false,

    certificationFailureReason,

    ...executionContext(
      execution
    ),

    summary: [
      ...copySummary(
        execution.summary
      ),
      "provider_runtime_execution_outcome_not_certified",
      summaryToken,
    ],

  };

}


// ============================================================
// EXECUTION EVIDENCE
// ============================================================

function buildExecutionEvidence(
  execution:
    ProviderRuntimeResponseExecutionResult,
  certifiedExecutionOutcome:
    ProviderRuntimeCertifiedExecutionOutcome
): ProviderRuntimeExecutionEvidence {

  const runtimeResponse =
    execution.runtimeResponse as ProviderRuntimeResponse;

  return {

    evidenceType:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME",

    providerContract:
      execution.providerContract,

    providerImplementation:
      execution.providerImplementation,

    operation:
      execution.operation,

    providerResourceId:
      execution.providerResourceId,

    providerConfigurationRef:
      execution.providerConfigurationRef,

    providerCredentialRef:
      execution.providerCredentialRef,

    executionMetadata:
      execution.executionMetadata,

    verificationStatus:
      execution.verificationStatus,

    verificationFailureReason:
      execution.verificationFailureReason,

    classificationStatus:
      execution.classificationStatus,

    runtimeFailureClass:
      execution.runtimeFailureClass,

    runtimeFailureSeverity:
      execution.runtimeFailureSeverity,

    failureCode:
      execution.failureCode,

    providerRawStatus:
      execution.providerRawStatus,

    providerRawErrorCode:
      execution.providerRawErrorCode,

    providerSanitizedErrorMessage:
      execution.providerSanitizedErrorMessage,

    retryable:
      execution.retryable,

    recoveryIntakeRequired:
      execution.recoveryIntakeRequired,

    recoveryIntakeReady:
      execution.recoveryIntakeReady,

    recoveryReason:
      execution.recoveryReason,

    runtimeResponse,

    responseExecutionStatus:
      execution.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      execution.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      execution.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      execution.runtimeInterventionNotRequired,

    retryExecuted:
      execution.retryExecuted,

    recoveryExecuted:
      execution.recoveryExecuted,

    failoverExecuted:
      execution.failoverExecuted,

    stopExecuted:
      execution.stopExecuted,

    escalationDispatched:
      execution.escalationDispatched,

    certifiedExecutionOutcome,

    executorFailureContained:
      failedOutcomeCertifiable(
        execution
      ),

    responseDecisionSummary:
      copySummary(
        execution.responseDecisionSummary
      ),

    executorSummary:
      execution.executorSummary === undefined
        ? undefined
        : copySummary(
            execution.executorSummary
          ),

    responseExecutionSummary:
      copySummary(
        execution.summary
      ),

  };

}


// ============================================================
// CERTIFIED RESULT
// ============================================================

function buildCertifiedResult(
  input:
    ProviderRuntimeExecutionOutcomeCertificationInput,
  certifiedExecutionOutcome:
    ProviderRuntimeCertifiedExecutionOutcome
): ProviderRuntimeExecutionOutcomeCertificationResult {

  const execution =
    input.execution;

  const executionEvidence =
    buildExecutionEvidence(
      execution,
      certifiedExecutionOutcome
    );

  return {

    certificationStatus:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFIED",

    certification:
      input.certification,

    runtimeExecutionOutcomeCertificationAttempted:
      true,

    runtimeExecutionOutcomeCertified:
      true,

    runtimeExecutionOutcomeCertificationDenied:
      false,

    certifiedExecutionOutcome,

    executionEvidence,

    ...executionContext(
      execution
    ),

    summary: [
      ...copySummary(
        execution.summary
      ),
      "provider_runtime_execution_outcome_certified",
      certifiedExecutionOutcome.toLowerCase(),
    ],

  };

}


// ============================================================
// EXECUTION OUTCOME CERTIFICATION
// ============================================================

export function certifyProviderRuntimeExecutionOutcome(
  input:
    ProviderRuntimeExecutionOutcomeCertificationInput
): ProviderRuntimeExecutionOutcomeCertificationResult {

  const execution =
    input.execution;

  // ----------------------------------------------------------
  // 1. CERTIFICATION REJECTED
  // ----------------------------------------------------------

  if (
    input.certification ===
    "REJECT_PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFICATION"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_NOT_ALLOWED",
      "runtime_execution_outcome_certification_not_allowed"
    );

  }

  // ----------------------------------------------------------
  // 2. RESPONSE EXECUTION DENIED
  // ----------------------------------------------------------

  if (
    execution.responseExecutionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_EXECUTION_DENIED"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_RESPONSE_EXECUTION_DENIED",
      "runtime_response_execution_denied"
    );

  }

  // ----------------------------------------------------------
  // 3. EXECUTION CONTEXT COHERENCE
  // ----------------------------------------------------------

  if (
    !executionContextCoherent(
      execution
    )
  ) {

    return buildNotCertifiedResult(
      input,
      "RUNTIME_RESPONSE_EXECUTION_CONTEXT_INCOHERENT",
      "runtime_response_execution_context_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 4. EXECUTION STATE COHERENCE
  // ----------------------------------------------------------

  if (
    !executionStateCoherent(
      execution
    )
  ) {

    return buildNotCertifiedResult(
      input,
      "RUNTIME_RESPONSE_EXECUTION_STATE_INCOHERENT",
      "runtime_response_execution_state_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 5. EVIDENCE SUFFICIENCY
  // ----------------------------------------------------------

  if (
    !execution.runtimeResponse
  ) {

    return buildNotCertifiedResult(
      input,
      "RUNTIME_RESPONSE_EXECUTION_EVIDENCE_INSUFFICIENT",
      "runtime_response_execution_evidence_insufficient"
    );

  }

  if (
    execution.responseExecutionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED" &&
    !failedOutcomeCertifiable(
      execution
    )
  ) {

    return buildNotCertifiedResult(
      input,
      "RUNTIME_RESPONSE_EXECUTION_EVIDENCE_INSUFFICIENT",
      "runtime_response_execution_evidence_insufficient"
    );

  }

  // ----------------------------------------------------------
  // 6. CERTIFIED OUTCOME DERIVATION
  // ----------------------------------------------------------

  const certifiedExecutionOutcome =
    certifiedOutcomeForExecution(
      execution
    );

  if (!certifiedExecutionOutcome) {

    return buildNotCertifiedResult(
      input,
      "RUNTIME_RESPONSE_EXECUTION_OUTCOME_NOT_DETERMINABLE",
      "runtime_response_execution_outcome_not_determinable"
    );

  }

  // ----------------------------------------------------------
  // 7. EXECUTION OUTCOME CERTIFIED
  // ----------------------------------------------------------

  return buildCertifiedResult(
    input,
    certifiedExecutionOutcome
  );

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Runtime Execution Outcome
// Certification receives one canonical
// P9O execution result.
//
// P9P certifies whether that result
// faithfully represents a terminal
// execution outcome.
//
// Successful execution may be certified.
//
// Contained executor failure may also be
// certified.
//
// Certification preserves the response
// selected by P9N and the execution state
// produced by P9O.
//
// P9P composes canonical execution
// evidence.
//
// P9P does not persist that evidence.
//
// ============================================================


// ============================================================
// CERTIFICATION PRINCIPLES
// ============================================================
//
// Execution Succeeded
// ≠
// Execution Outcome Certified
//
// Execution Failed
// ≠
// Execution Outcome Not Certifiable
//
// Certification Allowed
// ≠
// Execution State Coherent
//
// Execution State Coherent
// ≠
// Execution Evidence Sufficient
//
// Evidence Composed
// ≠
// Evidence Persisted
//
// Outcome Certified
// ≠
// Outcome Successful
//
// ============================================================


// ============================================================
// CERTIFICATION BOUNDARY
// ============================================================
//
// P9P.1 certifies execution facts.
//
// It does not perform the execution.
//
// It does not reinterpret P9N authority.
//
// It does not replace P9O execution state.
//
// A successful P9O outcome and a
// contained failed P9O outcome are both
// certifiable when their terminal state
// is coherent and sufficiently evidenced.
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
// - execute runtime response
// - invoke governed response executors
// - retry execution
// - recover execution
// - perform failover
// - stop runtime
// - dispatch escalation
// - directly call provider SDKs
// - directly call provider APIs
// - re-sanitize provider errors
// - alter sanitized failure surfaces
// - replace the P9N-selected response
// - alter the P9O execution result
// - persist evidence
// - write ledger
// - perform audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive canonical P9O execution
//   result
//
// ✓ enforce outcome certification gate
//
// ✓ reject denied P9O execution
//
// ✓ validate execution context coherence
//
// ✓ validate execution state coherence
//
// ✓ validate execution flag exclusivity
//
// ✓ preserve P9N-selected runtime response
//
// ✓ derive canonical successful outcome
//
// ✓ derive canonical contained-failure
//   outcome
//
// ✓ certify NO_ACTION completion
//
// ✓ certify RETRY completion or contained
//   failure
//
// ✓ certify RECOVER completion or
//   contained failure
//
// ✓ certify FAILOVER completion or
//   contained failure
//
// ✓ certify STOP completion or contained
//   failure
//
// ✓ certify ESCALATE completion or
//   contained failure
//
// ✓ compose canonical execution evidence
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
// ✓ preserve response decision summary
//
// ✓ preserve executor summary
//
// ✓ preserve response execution summary
//
// ✗ verify runtime
//
// ✗ classify runtime failure
//
// ✗ decide runtime response
//
// ✗ execute runtime response
//
// ✗ call provider SDKs
//
// ✗ call provider APIs
//
// ✗ re-sanitize provider errors
//
// ✗ alter execution outcome
//
// ✗ persist evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================