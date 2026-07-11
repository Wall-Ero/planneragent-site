// ============================================================
// PlannerAgent — Provider Runtime Response Decision
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9N.provider.runtime.response.decision.ts
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
// P9N.1 — Provider Runtime Response Decision
//
// PURPOSE
// ------------------------------------------------------------
// Decide the canonical runtime response
// after P9L runtime verification and
// P9M runtime failure classification.
//
// P9N receives:
//
// - ProviderRuntimeVerificationResult
// - ProviderRuntimeFailureClassificationResult
// - optional ProviderRuntimeRecoveryIntakeAssessmentResult
//
// P9N first verifies that all upstream
// results belong to the same coherent
// runtime outcome.
//
// P9N then selects exactly one canonical
// runtime response when decision
// prerequisites are satisfied.
//
// P9N does not verify runtime.
//
// P9N does not classify runtime failure.
//
// P9N does not execute retry.
//
// P9N does not execute recovery.
//
// P9N does not execute failover.
//
// P9N does not execute stop.
//
// P9N does not dispatch escalation.
//
// P9N does not write evidence, ledger,
// or audit.
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
// Runtime Failure Classified
// ≠
// Runtime Response Decided
//
// Runtime Response Decided
// ≠
// Runtime Response Executed
//
// Upstream Results Present
// ≠
// Upstream Results Coherent
//
// ============================================================

import type {
  ProviderRuntimeRecoveryIntakeAssessmentResult,
} from "../runtime-integration/P9K.provider.runtime.recovery.intake.assessment";

import type {
  ProviderRuntimeVerificationResult,
} from "./P9L.provider.runtime.verification";

import type {
  ProviderRuntimeFailureClassificationResult,
} from "./P9M.provider.runtime.failure.classification";


// ============================================================
// RESPONSE STATUS
// ============================================================

export type ProviderRuntimeResponseDecisionStatus =
  | "PROVIDER_RUNTIME_RESPONSE_DECIDED"
  | "PROVIDER_RUNTIME_RESPONSE_NOT_DECIDED"
  | "PROVIDER_RUNTIME_RESPONSE_DECISION_DENIED";


// ============================================================
// RESPONSE DECISION GATE
// ============================================================

export type ProviderRuntimeResponseDecision =
  | "DECIDE_PROVIDER_RUNTIME_RESPONSE"
  | "REJECT_PROVIDER_RUNTIME_RESPONSE_DECISION";


// ============================================================
// RUNTIME RESPONSE
// ============================================================

export type ProviderRuntimeResponse =
  | "NO_ACTION"
  | "RETRY"
  | "RECOVER"
  | "FAILOVER"
  | "STOP"
  | "ESCALATE";


// ============================================================
// RESPONSE DECISION DENIAL REASON
// ============================================================

export type ProviderRuntimeResponseDecisionDenialReason =
  | "RUNTIME_RESPONSE_DECISION_NOT_ALLOWED"
  | "RUNTIME_VERIFICATION_DENIED"
  | "RUNTIME_FAILURE_CLASSIFICATION_DENIED";


// ============================================================
// RESPONSE DECISION FAILURE REASON
// ============================================================

export type ProviderRuntimeResponseDecisionFailureReason =
  | "RUNTIME_FAILURE_NOT_CLASSIFIED"
  | "RUNTIME_RESPONSE_NOT_DETERMINABLE";


// ============================================================
// INPUT
// ============================================================

export interface ProviderRuntimeResponseDecisionInput {

  verification:
    ProviderRuntimeVerificationResult;

  classification:
    ProviderRuntimeFailureClassificationResult;

  recoveryIntake?:
    ProviderRuntimeRecoveryIntakeAssessmentResult;

  responseDecision:
    ProviderRuntimeResponseDecision;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderRuntimeResponseDecisionResult {

  responseDecisionStatus:
    ProviderRuntimeResponseDecisionStatus;

  responseDecision:
    ProviderRuntimeResponseDecision;

  runtimeResponseDecisionAttempted:
    boolean;

  runtimeResponseDecided:
    boolean;

  runtimeResponseDecisionDenied:
    boolean;

  runtimeInterventionNotRequired:
    boolean;

  runtimeResponse?:
    ProviderRuntimeResponse;

  responseDecisionDenialReason?:
    ProviderRuntimeResponseDecisionDenialReason;

  responseDecisionFailureReason?:
    ProviderRuntimeResponseDecisionFailureReason;

  providerContract:
    ProviderRuntimeVerificationResult["providerContract"];

  providerImplementation:
    ProviderRuntimeVerificationResult["providerImplementation"];

  operation:
    ProviderRuntimeVerificationResult["operation"];

  providerResourceId?:
    ProviderRuntimeVerificationResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeVerificationResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeVerificationResult["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeVerificationResult["executionMetadata"];

  verificationStatus:
    ProviderRuntimeVerificationResult["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeVerificationResult["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeFailureClassificationResult["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeFailureClassificationResult["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeFailureClassificationResult["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeFailureClassificationResult["failureCode"];

  providerRawStatus?:
    ProviderRuntimeFailureClassificationResult["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeFailureClassificationResult["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeFailureClassificationResult["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeFailureClassificationResult["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeVerificationResult["recoveryIntakeRequired"];

  recoveryIntakeReady:
    boolean;

  recoveryReason?:
    string;

  verificationSummary:
    string[];

  classificationSummary:
    string[];

  recoveryIntakeSummary?:
    string[];

  summary:
    string[];

}


// ============================================================
// RUNTIME CONTEXT
// ============================================================

interface ProviderRuntimeContext {

  providerContract:
    ProviderRuntimeVerificationResult["providerContract"];

  providerImplementation:
    ProviderRuntimeVerificationResult["providerImplementation"];

  operation:
    ProviderRuntimeVerificationResult["operation"];

  providerResourceId?:
    ProviderRuntimeVerificationResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeVerificationResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeVerificationResult["providerCredentialRef"];

}


// ============================================================
// COHERENCE CHECKS
// ============================================================

function runtimeContextsMatch(
  left: ProviderRuntimeContext,
  right: ProviderRuntimeContext
): boolean {

  return (
    left.providerContract ===
      right.providerContract &&
    left.providerImplementation ===
      right.providerImplementation &&
    left.operation ===
      right.operation &&
    left.providerResourceId ===
      right.providerResourceId &&
    left.providerConfigurationRef ===
      right.providerConfigurationRef &&
    left.providerCredentialRef ===
      right.providerCredentialRef
  );

}


function verificationStatusesMatch(
  verification:
    ProviderRuntimeVerificationResult,
  classification:
    ProviderRuntimeFailureClassificationResult
): boolean {

  return (
    verification.verificationStatus ===
    classification.verificationStatus
  );

}


function verificationFailureReasonsMatch(
  verification:
    ProviderRuntimeVerificationResult,
  classification:
    ProviderRuntimeFailureClassificationResult
): boolean {

  return (
    verification.verificationFailureReason ===
    classification.verificationFailureReason
  );

}


function runtimeContextsAreCoherent(
  verification:
    ProviderRuntimeVerificationResult,
  classification:
    ProviderRuntimeFailureClassificationResult
): boolean {

  return runtimeContextsMatch(
    verification,
    classification
  );

}


function recoveryRequirementsAreCoherent(
  verification:
    ProviderRuntimeVerificationResult,
  classification:
    ProviderRuntimeFailureClassificationResult,
  recoveryIntake?:
    ProviderRuntimeRecoveryIntakeAssessmentResult
): boolean {

  if (
    verification.recoveryIntakeRequired !==
    classification.recoveryIntakeRequired
  ) {

    return false;

  }

  if (
    recoveryIntake &&
    recoveryIntake.recoveryIntakeRequired !==
      verification.recoveryIntakeRequired
  ) {

    return false;

  }

  return true;

}


function recoveryIntakeContextMatches(
  verification:
    ProviderRuntimeVerificationResult,
  recoveryIntake?:
    ProviderRuntimeRecoveryIntakeAssessmentResult
): boolean {

  if (!recoveryIntake) {

    return true;

  }

  return runtimeContextsMatch(
    verification,
    recoveryIntake
  );

}


// ============================================================
// FAILURE → RESPONSE MAPPING
// ============================================================

function decideResponseForFailure(
  classification:
    ProviderRuntimeFailureClassificationResult,
  recoveryIntake?:
    ProviderRuntimeRecoveryIntakeAssessmentResult
): ProviderRuntimeResponse {

  const runtimeFailureClass =
    classification.runtimeFailureClass;

  if (!runtimeFailureClass) {

    return "ESCALATE";

  }

  switch (runtimeFailureClass) {

    case "PROVIDER_RATE_LIMIT_FAILURE":
    case "PROVIDER_TIMEOUT_FAILURE":
      return classification.retryable === true
        ? "RETRY"
        : "ESCALATE";

    case "PROVIDER_UNAVAILABLE_FAILURE":
      return recoveryIntake?.recoveryIntakeReady === true
        ? "FAILOVER"
        : "ESCALATE";

    case "PROVIDER_DEPENDENCY_FAILURE":
    case "PROVIDER_EXECUTION_INCOMPLETE_FAILURE":
      return recoveryIntake?.recoveryIntakeReady === true
        ? "RECOVER"
        : "ESCALATE";

    case "PROVIDER_AUTHORIZATION_FAILURE":
    case "PROVIDER_AUTHENTICATION_FAILURE":
    case "PROVIDER_UNKNOWN_FAILURE":
      return "ESCALATE";

    case "PROVIDER_CONFIGURATION_FAILURE":
    case "PROVIDER_INVALID_REQUEST_FAILURE":
    case "PROVIDER_CONTRACT_FAILURE":
      return "STOP";

  }

  return "ESCALATE";

}


// ============================================================
// DENIED RESULT
// ============================================================

function buildDeniedResult(
  input: ProviderRuntimeResponseDecisionInput,
  responseDecisionDenialReason:
    ProviderRuntimeResponseDecisionDenialReason,
  summaryToken: string
): ProviderRuntimeResponseDecisionResult {

  const verification =
    input.verification;

  const classification =
    input.classification;

  const recoveryIntake =
    input.recoveryIntake;

  return {

    responseDecisionStatus:
      "PROVIDER_RUNTIME_RESPONSE_DECISION_DENIED",

    responseDecision:
      input.responseDecision,

    runtimeResponseDecisionAttempted:
      false,

    runtimeResponseDecided:
      false,

    runtimeResponseDecisionDenied:
      true,

    runtimeInterventionNotRequired:
      false,

    responseDecisionDenialReason,

    providerContract:
      verification.providerContract,

    providerImplementation:
      verification.providerImplementation,

    operation:
      verification.operation,

    providerResourceId:
      verification.providerResourceId,

    providerConfigurationRef:
      verification.providerConfigurationRef,

    providerCredentialRef:
      verification.providerCredentialRef,

    executionMetadata:
      verification.executionMetadata,

    verificationStatus:
      verification.verificationStatus,

    verificationFailureReason:
      verification.verificationFailureReason,

    classificationStatus:
      classification.classificationStatus,

    runtimeFailureClass:
      classification.runtimeFailureClass,

    runtimeFailureSeverity:
      classification.runtimeFailureSeverity,

    failureCode:
      classification.failureCode,

    providerRawStatus:
      classification.providerRawStatus,

    providerRawErrorCode:
      classification.providerRawErrorCode,

    providerSanitizedErrorMessage:
      classification.providerSanitizedErrorMessage,

    retryable:
      classification.retryable,

    recoveryIntakeRequired:
      verification.recoveryIntakeRequired,

    recoveryIntakeReady:
      recoveryIntake?.recoveryIntakeReady === true,

    recoveryReason:
      recoveryIntake?.recoveryReason,

    verificationSummary: [
      ...verification.summary,
    ],

    classificationSummary: [
      ...classification.summary,
    ],

    recoveryIntakeSummary:
      recoveryIntake
        ? [
            ...recoveryIntake.summary,
          ]
        : undefined,

    summary: [
      ...classification.summary,
      "provider_runtime_response_decision_denied",
      summaryToken,
    ],

  };

}


// ============================================================
// NO ACTION RESULT
// ============================================================

function buildNoActionResult(
  input: ProviderRuntimeResponseDecisionInput
): ProviderRuntimeResponseDecisionResult {

  const verification =
    input.verification;

  const classification =
    input.classification;

  const recoveryIntake =
    input.recoveryIntake;

  return {

    responseDecisionStatus:
      "PROVIDER_RUNTIME_RESPONSE_DECIDED",

    responseDecision:
      input.responseDecision,

    runtimeResponseDecisionAttempted:
      true,

    runtimeResponseDecided:
      true,

    runtimeResponseDecisionDenied:
      false,

    runtimeInterventionNotRequired:
      true,

    runtimeResponse:
      "NO_ACTION",

    providerContract:
      verification.providerContract,

    providerImplementation:
      verification.providerImplementation,

    operation:
      verification.operation,

    providerResourceId:
      verification.providerResourceId,

    providerConfigurationRef:
      verification.providerConfigurationRef,

    providerCredentialRef:
      verification.providerCredentialRef,

    executionMetadata:
      verification.executionMetadata,

    verificationStatus:
      verification.verificationStatus,

    verificationFailureReason:
      verification.verificationFailureReason,

    classificationStatus:
      classification.classificationStatus,

    runtimeFailureClass:
      classification.runtimeFailureClass,

    runtimeFailureSeverity:
      classification.runtimeFailureSeverity,

    failureCode:
      classification.failureCode,

    providerRawStatus:
      classification.providerRawStatus,

    providerRawErrorCode:
      classification.providerRawErrorCode,

    providerSanitizedErrorMessage:
      classification.providerSanitizedErrorMessage,

    retryable:
      classification.retryable,

    recoveryIntakeRequired:
      verification.recoveryIntakeRequired,

    recoveryIntakeReady:
      recoveryIntake?.recoveryIntakeReady === true,

    recoveryReason:
      recoveryIntake?.recoveryReason,

    verificationSummary: [
      ...verification.summary,
    ],

    classificationSummary: [
      ...classification.summary,
    ],

    recoveryIntakeSummary:
      recoveryIntake
        ? [
            ...recoveryIntake.summary,
          ]
        : undefined,

    summary: [
      ...classification.summary,
      "provider_runtime_response_decided",
      "no_action",
    ],

  };

}


// ============================================================
// NOT DECIDED RESULT
// ============================================================

function buildNotDecidedResult(
  input: ProviderRuntimeResponseDecisionInput,
  responseDecisionFailureReason:
    ProviderRuntimeResponseDecisionFailureReason,
  summaryToken: string
): ProviderRuntimeResponseDecisionResult {

  const verification =
    input.verification;

  const classification =
    input.classification;

  const recoveryIntake =
    input.recoveryIntake;

  return {

    responseDecisionStatus:
      "PROVIDER_RUNTIME_RESPONSE_NOT_DECIDED",

    responseDecision:
      input.responseDecision,

    runtimeResponseDecisionAttempted:
      true,

    runtimeResponseDecided:
      false,

    runtimeResponseDecisionDenied:
      false,

    runtimeInterventionNotRequired:
      false,

    responseDecisionFailureReason,

    providerContract:
      verification.providerContract,

    providerImplementation:
      verification.providerImplementation,

    operation:
      verification.operation,

    providerResourceId:
      verification.providerResourceId,

    providerConfigurationRef:
      verification.providerConfigurationRef,

    providerCredentialRef:
      verification.providerCredentialRef,

    executionMetadata:
      verification.executionMetadata,

    verificationStatus:
      verification.verificationStatus,

    verificationFailureReason:
      verification.verificationFailureReason,

    classificationStatus:
      classification.classificationStatus,

    runtimeFailureClass:
      classification.runtimeFailureClass,

    runtimeFailureSeverity:
      classification.runtimeFailureSeverity,

    failureCode:
      classification.failureCode,

    providerRawStatus:
      classification.providerRawStatus,

    providerRawErrorCode:
      classification.providerRawErrorCode,

    providerSanitizedErrorMessage:
      classification.providerSanitizedErrorMessage,

    retryable:
      classification.retryable,

    recoveryIntakeRequired:
      verification.recoveryIntakeRequired,

    recoveryIntakeReady:
      recoveryIntake?.recoveryIntakeReady === true,

    recoveryReason:
      recoveryIntake?.recoveryReason,

    verificationSummary: [
      ...verification.summary,
    ],

    classificationSummary: [
      ...classification.summary,
    ],

    recoveryIntakeSummary:
      recoveryIntake
        ? [
            ...recoveryIntake.summary,
          ]
        : undefined,

    summary: [
      ...classification.summary,
      "provider_runtime_response_not_decided",
      summaryToken,
    ],

  };

}


// ============================================================
// RESPONSE DECISION
// ============================================================

export function decideProviderRuntimeResponse(
  input: ProviderRuntimeResponseDecisionInput
): ProviderRuntimeResponseDecisionResult {

  const verification =
    input.verification;

  const classification =
    input.classification;

  const recoveryIntake =
    input.recoveryIntake;

  // ----------------------------------------------------------
  // 1. RESPONSE DECISION REJECTED
  // ----------------------------------------------------------

  if (
    input.responseDecision ===
    "REJECT_PROVIDER_RUNTIME_RESPONSE_DECISION"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_RESPONSE_DECISION_NOT_ALLOWED",
      "runtime_response_decision_not_allowed"
    );

  }

  // ----------------------------------------------------------
  // 2. RUNTIME VERIFICATION DENIED
  // ----------------------------------------------------------

  if (
    verification.verificationStatus ===
    "PROVIDER_RUNTIME_VERIFICATION_DENIED"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_VERIFICATION_DENIED",
      "runtime_verification_denied"
    );

  }

  // ----------------------------------------------------------
  // 3. FAILURE CLASSIFICATION DENIED
  // ----------------------------------------------------------

  if (
    classification.classificationStatus ===
    "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_DENIED"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_FAILURE_CLASSIFICATION_DENIED",
      "runtime_failure_classification_denied"
    );

  }

  // ----------------------------------------------------------
  // 4. VERIFIED RUNTIME + CLASSIFIED FAILURE
  // ----------------------------------------------------------
  //
  // This gate must precede the generic verification-status
  // mismatch gate so that this specific incoherence preserves
  // its canonical summary token.
  // ----------------------------------------------------------

  if (
    verification.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFIED" &&
    classification.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFIED"
  ) {

    return buildNotDecidedResult(
      input,
      "RUNTIME_RESPONSE_NOT_DETERMINABLE",
      "verified_runtime_classification_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 5. VERIFICATION STATUS MISMATCH
  // ----------------------------------------------------------

  if (
    !verificationStatusesMatch(
      verification,
      classification
    )
  ) {

    return buildNotDecidedResult(
      input,
      "RUNTIME_RESPONSE_NOT_DETERMINABLE",
      "verification_classification_status_mismatch"
    );

  }

  // ----------------------------------------------------------
  // 6. VERIFICATION FAILURE REASON MISMATCH
  // ----------------------------------------------------------

  if (
    !verificationFailureReasonsMatch(
      verification,
      classification
    )
  ) {

    return buildNotDecidedResult(
      input,
      "RUNTIME_RESPONSE_NOT_DETERMINABLE",
      "verification_failure_reason_mismatch"
    );

  }

  // ----------------------------------------------------------
  // 7. PROVIDER / RUNTIME CONTEXT MISMATCH
  // ----------------------------------------------------------

  if (
    !runtimeContextsAreCoherent(
      verification,
      classification
    )
  ) {

    return buildNotDecidedResult(
      input,
      "RUNTIME_RESPONSE_NOT_DETERMINABLE",
      "runtime_context_mismatch"
    );

  }

  // ----------------------------------------------------------
  // 8. RECOVERY REQUIREMENT MISMATCH
  // ----------------------------------------------------------
  //
  // Enforces:
  //
  // - P9L verification requirement
  // - P9M preserved requirement
  // - P9K recovery-intake declared requirement, when present
  // ----------------------------------------------------------

  if (
    !recoveryRequirementsAreCoherent(
      verification,
      classification,
      recoveryIntake
    )
  ) {

    return buildNotDecidedResult(
      input,
      "RUNTIME_RESPONSE_NOT_DETERMINABLE",
      "recovery_intake_requirement_mismatch"
    );

  }

  // ----------------------------------------------------------
  // 9. RECOVERY INTAKE CONTEXT MISMATCH
  // ----------------------------------------------------------

  if (
    !recoveryIntakeContextMatches(
      verification,
      recoveryIntake
    )
  ) {

    return buildNotDecidedResult(
      input,
      "RUNTIME_RESPONSE_NOT_DETERMINABLE",
      "recovery_intake_context_mismatch"
    );

  }

  // ----------------------------------------------------------
  // 10. VERIFIED RUNTIME → NO_ACTION
  // ----------------------------------------------------------

  if (
    verification.verificationStatus ===
      "PROVIDER_RUNTIME_VERIFIED" &&
    classification.classificationStatus ===
      "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED"
  ) {

    return buildNoActionResult(
      input
    );

  }

  // ----------------------------------------------------------
  // 11. FAILURE NOT CLASSIFIED
  // ----------------------------------------------------------

  if (
    classification.classificationStatus ===
    "PROVIDER_RUNTIME_FAILURE_NOT_CLASSIFIED"
  ) {

    return buildNotDecidedResult(
      input,
      "RUNTIME_FAILURE_NOT_CLASSIFIED",
      "runtime_failure_not_classified"
    );

  }

  // ----------------------------------------------------------
  // 12. CLASSIFICATION STATE NOT DETERMINABLE
  // ----------------------------------------------------------

  if (
    classification.classificationStatus !==
      "PROVIDER_RUNTIME_FAILURE_CLASSIFIED" ||
    !classification.runtimeFailureClass
  ) {

    return buildNotDecidedResult(
      input,
      "RUNTIME_RESPONSE_NOT_DETERMINABLE",
      "runtime_response_not_determinable"
    );

  }

  // ----------------------------------------------------------
  // 13. CLASSIFIED FAILURE → RESPONSE MAPPING
  // ----------------------------------------------------------

  const runtimeResponse =
    decideResponseForFailure(
      classification,
      recoveryIntake
    );

  return {

    responseDecisionStatus:
      "PROVIDER_RUNTIME_RESPONSE_DECIDED",

    responseDecision:
      input.responseDecision,

    runtimeResponseDecisionAttempted:
      true,

    runtimeResponseDecided:
      true,

    runtimeResponseDecisionDenied:
      false,

    runtimeInterventionNotRequired:
      false,

    runtimeResponse,

    providerContract:
      verification.providerContract,

    providerImplementation:
      verification.providerImplementation,

    operation:
      verification.operation,

    providerResourceId:
      verification.providerResourceId,

    providerConfigurationRef:
      verification.providerConfigurationRef,

    providerCredentialRef:
      verification.providerCredentialRef,

    executionMetadata:
      verification.executionMetadata,

    verificationStatus:
      verification.verificationStatus,

    verificationFailureReason:
      verification.verificationFailureReason,

    classificationStatus:
      classification.classificationStatus,

    runtimeFailureClass:
      classification.runtimeFailureClass,

    runtimeFailureSeverity:
      classification.runtimeFailureSeverity,

    failureCode:
      classification.failureCode,

    providerRawStatus:
      classification.providerRawStatus,

    providerRawErrorCode:
      classification.providerRawErrorCode,

    providerSanitizedErrorMessage:
      classification.providerSanitizedErrorMessage,

    retryable:
      classification.retryable,

    recoveryIntakeRequired:
      verification.recoveryIntakeRequired,

    recoveryIntakeReady:
      recoveryIntake?.recoveryIntakeReady === true,

    recoveryReason:
      recoveryIntake?.recoveryReason,

    verificationSummary: [
      ...verification.summary,
    ],

    classificationSummary: [
      ...classification.summary,
    ],

    recoveryIntakeSummary:
      recoveryIntake
        ? [
            ...recoveryIntake.summary,
          ]
        : undefined,

    summary: [
      ...classification.summary,
      "provider_runtime_response_decided",
      runtimeResponse.toLowerCase(),
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Runtime Response Decision
// receives:
//
// - ProviderRuntimeVerificationResult
// - ProviderRuntimeFailureClassificationResult
// - optional ProviderRuntimeRecoveryIntakeAssessmentResult
//
// Before selecting a response, P9N
// validates that upstream results:
//
// - preserve the same verification state
// - preserve the same verification reason
// - preserve the same runtime context
// - preserve the same recovery requirement
// - refer to the same recovery context
//
// It selects exactly one canonical runtime
// response only when decision prerequisites
// and coherence requirements are satisfied.
//
// NO_ACTION is a real runtime response
// decision.
//
// runtimeInterventionNotRequired indicates
// that the selected runtime response does
// not require corrective intervention.
//
// P9N does not execute the selected
// response.
//
// ============================================================


// ============================================================
// RESPONSE DECISION PRINCIPLES
// ============================================================
//
// Provider Runtime Verification
// ≠
// Provider Runtime Failure Classification
//
// Provider Runtime Failure Classification
// ≠
// Provider Runtime Response Decision
//
// Runtime Response Decided
// ≠
// Runtime Response Executed
//
// Upstream Result Available
// ≠
// Upstream Result Coherent
//
// Verification Status Preserved
// ≠
// Verification Status Assumed
//
// Recovery Intake Ready
// ≠
// Recovery Intake Context Valid
//
// No Action Selected
// ≠
// No Decision Made
//
// Runtime Intervention Not Required
// ≠
// Runtime Response Not Decided
//
// Retryable
// ≠
// Retry Selected
//
// Retryable True
// permits
// Retry Selection
//
// Retryable False or Unknown
// prohibits
// Retry Selection
//
// Recovery Intake Ready
// ≠
// Recovery Executed
//
// Recovery Selected
// requires
// Recovery Intake Ready
//
// Failover Selected
// requires
// Recovery Intake Ready
//
// Failover Selected
// ≠
// Failover Executed
//
// Escalation Selected
// ≠
// Escalation Dispatched
//
// ============================================================


// ============================================================
// ESCALATION OBSERVATION
// ============================================================
//
// ESCALATE is a runtime response posture.
//
// It does not itself dispatch escalation.
//
// P9O must route escalation through the
// governed escalation execution boundary.
//
// ============================================================


// ============================================================
// DEGRADATION OBSERVATION
// ============================================================
//
// DEGRADE is intentionally not part of
// the P9N.1 canonical response set.
//
// Degradation requires explicit runtime
// capability and policy context, such as:
//
// - degraded runtime availability
// - degraded runtime authorization
// - degraded operating boundaries
//
// Failure class alone is insufficient
// to legitimize degradation.
//
// DEGRADE may be introduced in a future
// P9N revision when that context exists.
//
// ============================================================


// ============================================================
// RESPONSE DECISION BOUNDARY
// ============================================================
//
// P9N.1 response values are runtime
// decision labels.
//
// They are not execution commands.
//
// They are not provider API calls.
//
// They are not recovery execution.
//
// P9N may preserve retryable as an
// input signal.
//
// P9N must permit RETRY only when
// retryable is explicitly true.
//
// P9N must prevent RECOVER or FAILOVER
// when recovery intake is not ready.
//
// P9N must refuse to decide when P9L,
// P9M, and recovery-intake context are
// mutually incoherent.
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
// - repair incoherent upstream state
// - infer missing runtime context
// - execute retry
// - execute recovery
// - execute failover
// - execute stop
// - dispatch escalation
// - select degraded operation without
//   explicit capability/policy context
// - call provider SDKs
// - call provider APIs
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
// ✓ receive P9L runtime verification
//   result
//
// ✓ receive P9M runtime failure
//   classification result
//
// ✓ validate verification status
//   coherence
//
// ✓ validate verification failure reason
//   coherence
//
// ✓ validate provider/runtime context
//   coherence
//
// ✓ validate recovery requirement
//   coherence across P9L, P9M, and
//   recovery intake when present
//
// ✓ validate recovery intake ownership
//   and context
//
// ✓ reject verified-runtime / classified-
//   failure incoherence
//
// ✓ distinguish response denied from
//   response not decided
//
// ✓ decide NO_ACTION as an explicit
//   runtime response
//
// ✓ mark runtime intervention as not
//   required only for NO_ACTION
//
// ✓ permit RETRY only when retryable
//   is explicitly true
//
// ✓ require recovery intake readiness
//   before selecting RECOVER
//
// ✓ require recovery intake readiness
//   before selecting FAILOVER
//
// ✓ decide canonical runtime response
//   when prerequisites are satisfied
//
// ✓ preserve provider/runtime context
//
// ✓ preserve recovery intake context
//   without executing recovery
//
// ✗ verify runtime
//
// ✗ classify runtime failure
//
// ✗ repair upstream incoherence
//
// ✗ execute retry
//
// ✗ execute recovery
//
// ✗ execute failover
//
// ✗ execute stop
//
// ✗ dispatch escalation
//
// ✗ write evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================