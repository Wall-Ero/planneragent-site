// ============================================================
// PlannerAgent — Provider Runtime Evidence Persistence / Ledger Admission Family Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9Q.provider.runtime.family.runner.ts
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
// P9Q — Provider Runtime Evidence Persistence / Ledger Admission Family Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify the complete P9Q evidence-admission family.
//
// Chain verified:
//
// P9P certifies provider runtime execution outcome.
// ↓
// P9Q validates certified evidence.
// ↓
// P9Q admits canonical evidence for a later
// governed persistence / ledger-write boundary.
//
// This runner verifies:
//
// - all successful certified outcomes
// - all contained-failure certified outcomes
// - admission-gate precedence
// - P9P certification authority
// - canonical evidence requirements
// - evidence/result coherence
// - family outcome exclusivity
// - admission-material composition
// - lineage propagation
// - defensive copying
// - source immutability
// - P9Q boundary integrity
//
// P9Q does not persist evidence.
//
// P9Q does not write ledger.
//
// P9Q does not audit.
//
// ============================================================

import assert from "node:assert/strict";

import {
  admitProviderRuntimeEvidenceToLedger,
} from "../P9Q.provider.runtime.evidence.persistence.ledger.admission";

import type {
  ProviderRuntimeEvidenceLedgerAdmissionInput,
  ProviderRuntimeEvidenceLedgerAdmissionMaterial,
  ProviderRuntimeEvidenceLedgerAdmissionResult,
} from "../P9Q.provider.runtime.evidence.persistence.ledger.admission";

import type {
  ProviderRuntimeCertifiedExecutionOutcome,
  ProviderRuntimeExecutionOutcomeCertificationResult,
} from "../P9P.provider.runtime.execution.outcome.certification";

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

    "runtimeVerifiedByAdmission",

    "runtimeFailureClassifiedByAdmission",

    "runtimeResponseDecidedByAdmission",

    "runtimeResponseExecutedByAdmission",

    "governedExecutorInvoked",

    "providerSdkCalled",

    "providerApiCalled",

    "providerExecutionInvoked",

    "providerErrorResanitized",

    "sanitizedFailureSurfaceAltered",

    "runtimeResponseReplaced",

    "executionResultAltered",

    "certificationResultAltered",

    "evidencePersisted",

    "evidenceWritten",

    "persistenceAttempted",

    "persistenceCompleted",

    "persistenceId",

    "ledgerWritten",

    "ledgerEntryWritten",

    "ledgerEntryId",

    "ledgerSequence",

    "ledgerTimestampAssigned",

    "auditWritten",

    "auditPerformed",

    "auditRecordId",

  ];

  for (const field of forbiddenFields) {

    assert(
      !(field in value),
      `cross-layer field not exposed: ${field}`
    );

  }

}


function assertAdmissionFlags(
  result:
    ProviderRuntimeEvidenceLedgerAdmissionResult
): void {

  const admitted =
    result.runtimeEvidenceLedgerAdmitted === true;

  const denied =
    result.runtimeEvidenceLedgerAdmissionDenied === true;

  const notAdmitted =
    result.admissionStatus ===
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_ADMITTED";

  const trueFlags = [
    admitted,
    denied,
    notAdmitted,
  ].filter(Boolean).length;

  assert.equal(
    trueFlags,
    1,
    "exactly one terminal admission posture asserted"
  );

  if (admitted) {

    assert.equal(
      result.admissionStatus,
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMITTED",
      "admitted flag matches admission status"
    );

    assert.equal(
      result.runtimeEvidenceLedgerAdmissionAttempted,
      true,
      "admitted evidence requires admission attempt"
    );

    assert.equal(
      result.ledgerAdmissionMaterial !== undefined,
      true,
      "admitted evidence exposes admission material"
    );

    assert.equal(
      result.admissionDenialReason,
      undefined,
      "admitted result exposes no denial reason"
    );

    assert.equal(
      result.admissionFailureReason,
      undefined,
      "admitted result exposes no failure reason"
    );

  }

  if (denied) {

    assert.equal(
      result.admissionStatus,
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION_DENIED",
      "denial flag matches admission status"
    );

    assert.equal(
      result.runtimeEvidenceLedgerAdmissionAttempted,
      false,
      "denied admission is not attempted"
    );

    assert.equal(
      result.ledgerAdmissionMaterial,
      undefined,
      "denied result exposes no admission material"
    );

    assert.equal(
      result.admissionDenialReason !== undefined,
      true,
      "denied result exposes denial reason"
    );

    assert.equal(
      result.admissionFailureReason,
      undefined,
      "denied result exposes no failure reason"
    );

  }

  if (notAdmitted) {

    assert.equal(
      result.runtimeEvidenceLedgerAdmissionAttempted,
      true,
      "not-admitted result occurs during admission attempt"
    );

    assert.equal(
      result.runtimeEvidenceLedgerAdmitted,
      false,
      "not-admitted result does not admit evidence"
    );

    assert.equal(
      result.runtimeEvidenceLedgerAdmissionDenied,
      false,
      "not-admitted result is not gate denial"
    );

    assert.equal(
      result.ledgerAdmissionMaterial,
      undefined,
      "not-admitted result exposes no admission material"
    );

    assert.equal(
      result.admissionFailureReason !== undefined,
      true,
      "not-admitted result exposes failure reason"
    );

    assert.equal(
      result.admissionDenialReason,
      undefined,
      "not-admitted result exposes no denial reason"
    );

  }

}


function assertAdmitted(
  result:
    ProviderRuntimeEvidenceLedgerAdmissionResult,
  expectedOutcome:
    ProviderRuntimeCertifiedExecutionOutcome,
  expectedFailureContainment:
    boolean,
  label:
    string
): void {

  assert.equal(
    result.admissionStatus,
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMITTED",
    `${label} admitted status`
  );

  assert.equal(
    result.runtimeEvidenceLedgerAdmissionAttempted,
    true,
    `${label} admission attempted`
  );

  assert.equal(
    result.runtimeEvidenceLedgerAdmitted,
    true,
    `${label} admitted`
  );

  assert.equal(
    result.runtimeEvidenceLedgerAdmissionDenied,
    false,
    `${label} not denied`
  );

  assert.equal(
    result.certifiedExecutionOutcome,
    expectedOutcome,
    `${label} certified outcome preserved`
  );

  assert(
    result.ledgerAdmissionMaterial,
    `${label} admission material present`
  );

  assert.equal(
    result.ledgerAdmissionMaterial?.certifiedExecutionOutcome,
    expectedOutcome,
    `${label} material outcome preserved`
  );

  assert.equal(
    result.ledgerAdmissionMaterial?.executorFailureContained,
    expectedFailureContainment,
    `${label} failure-containment posture preserved`
  );

  assert(
    result.summary.includes(
      "provider_runtime_evidence_ledger_admitted"
    ),
    `${label} terminal admission summary preserved`
  );

  assertAdmissionFlags(
    result
  );

}


function assertNotAdmitted(
  result:
    ProviderRuntimeEvidenceLedgerAdmissionResult,
  expectedFailureReason:
    ProviderRuntimeEvidenceLedgerAdmissionResult["admissionFailureReason"],
  expectedSummaryToken:
    string,
  label:
    string
): void {

  assert.equal(
    result.admissionStatus,
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_ADMITTED",
    `${label} not-admitted status`
  );

  assert.equal(
    result.admissionFailureReason,
    expectedFailureReason,
    `${label} failure reason preserved`
  );

  assert(
    result.summary.includes(
      expectedSummaryToken
    ),
    `${label} summary token preserved`
  );

  assertAdmissionFlags(
    result
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
  "kms-key-runtime-family-admission";

const providerConfigurationRef =
  "cfg/aws-kms-prod";

const providerCredentialRef =
  "cred/aws-kms-prod";

const executionMetadata = {

  tenantId:
    "tenant-001",

  runtimeBatchId:
    "runtime-family-admission-001",

};


// ============================================================
// CERTIFIED OUTCOME FAMILY
// ============================================================

const successfulOutcomes:
  ProviderRuntimeCertifiedExecutionOutcome[] = [

    "NO_ACTION_COMPLETED",

    "RETRY_COMPLETED",

    "RECOVERY_COMPLETED",

    "FAILOVER_COMPLETED",

    "STOP_COMPLETED",

    "ESCALATION_COMPLETED",

  ];


const containedFailureOutcomes:
  ProviderRuntimeCertifiedExecutionOutcome[] = [

    "RETRY_FAILED",

    "RECOVERY_FAILED",

    "FAILOVER_FAILED",

    "STOP_FAILED",

    "ESCALATION_FAILED",

  ];


// ============================================================
// OUTCOME SUPPORT
// ============================================================

function runtimeResponseForOutcome(
  outcome:
    ProviderRuntimeCertifiedExecutionOutcome
): ProviderRuntimeResponse {

  switch (outcome) {

    case "NO_ACTION_COMPLETED":
      return "NO_ACTION";

    case "RETRY_COMPLETED":
    case "RETRY_FAILED":
      return "RETRY";

    case "RECOVERY_COMPLETED":
    case "RECOVERY_FAILED":
      return "RECOVER";

    case "FAILOVER_COMPLETED":
    case "FAILOVER_FAILED":
      return "FAILOVER";

    case "STOP_COMPLETED":
    case "STOP_FAILED":
      return "STOP";

    case "ESCALATION_COMPLETED":
    case "ESCALATION_FAILED":
      return "ESCALATE";

  }

}


function outcomeIsContainedFailure(
  outcome:
    ProviderRuntimeCertifiedExecutionOutcome
): boolean {

  return containedFailureOutcomes.includes(
    outcome
  );

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
// P9P CERTIFICATION FIXTURE
// ============================================================

function buildCertifiedResult(
  certifiedExecutionOutcome:
    ProviderRuntimeCertifiedExecutionOutcome
): ProviderRuntimeExecutionOutcomeCertificationResult {

  const runtimeResponse =
    runtimeResponseForOutcome(
      certifiedExecutionOutcome
    );

  const executorFailureContained =
    outcomeIsContainedFailure(
      certifiedExecutionOutcome
    );

  const runtimeResponseExecuted =
    executorFailureContained === false;

  const responseExecutionStatus =
    executorFailureContained
      ? "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED"
      : "PROVIDER_RUNTIME_RESPONSE_EXECUTED";

  const runtimeInterventionNotRequired =
    runtimeResponse === "NO_ACTION";

  const verificationStatus =
    runtimeResponse === "NO_ACTION"
      ? "PROVIDER_RUNTIME_VERIFIED"
      : "PROVIDER_RUNTIME_NOT_VERIFIED";

  const verificationFailureReason =
    runtimeResponse === "NO_ACTION"
      ? undefined
      : runtimeResponse === "RECOVER"
        ? "PROVIDER_EXECUTION_NOT_COMPLETED"
        : "PROVIDER_FAILURE_SURFACE_PRESENT";

  const classificationStatus =
    runtimeResponse === "NO_ACTION"
      ? "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED"
      : "PROVIDER_RUNTIME_FAILURE_CLASSIFIED";

  const responseDecisionSummary = [
    "provider_runtime_response_decided",
    runtimeResponse.toLowerCase(),
  ];

  const executorSummary =
    runtimeResponse === "NO_ACTION"
      ? undefined
      : executorFailureContained
        ? [
            "provider_runtime_response_executor_failed",
            `${runtimeResponse.toLowerCase()}_failed`,
            "executor_failure_contained",
          ]
        : [
            "provider_runtime_response_executor_completed",
            `${runtimeResponse.toLowerCase()}_completed`,
          ];

  const responseExecutionSummary =
    executorFailureContained
      ? [
          ...responseDecisionSummary,
          "provider_runtime_response_not_executed",
          "runtime_response_execution_failed",
          "executor_failure_contained",
        ]
      : [
          ...responseDecisionSummary,
          "provider_runtime_response_executed",
          `${runtimeResponse.toLowerCase()}_executed`,
        ];

  const certificationSummary = [
    ...responseExecutionSummary,
    "provider_runtime_execution_outcome_certified",
    certifiedExecutionOutcome.toLowerCase(),
  ];

  const executionEvidence = {

    evidenceType:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME",

    certifiedExecutionOutcome,

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    verificationStatus,

    verificationFailureReason,

    classificationStatus,

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
      runtimeResponse === "NO_ACTION"
        ? "KMS_SUCCESS"
        : "KMS_ERROR",

    providerRawErrorCode:
      rawErrorCodeForResponse(
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

    responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      true,

    runtimeResponseExecuted,

    runtimeInterventionNotRequired,

    executorFailureContained,

    responseDecisionSummary,

    executorSummary,

    responseExecutionSummary,

  };

  return {

    certificationStatus:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFIED",

    certification:
      "CERTIFY_PROVIDER_RUNTIME_EXECUTION_OUTCOME",

    runtimeExecutionOutcomeCertificationAttempted:
      true,

    runtimeExecutionOutcomeCertified:
      true,

    runtimeExecutionOutcomeCertificationDenied:
      false,

    certifiedExecutionOutcome,

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef,

    providerCredentialRef,

    executionMetadata,

    verificationStatus,

    verificationFailureReason,

    classificationStatus,

    runtimeFailureClass:
      executionEvidence.runtimeFailureClass,

    runtimeFailureSeverity:
      executionEvidence.runtimeFailureSeverity,

    failureCode:
      executionEvidence.failureCode,

    providerRawStatus:
      executionEvidence.providerRawStatus,

    providerRawErrorCode:
      executionEvidence.providerRawErrorCode,

    providerSanitizedErrorMessage:
      executionEvidence.providerSanitizedErrorMessage,

    retryable:
      executionEvidence.retryable,

    recoveryIntakeRequired:
      executionEvidence.recoveryIntakeRequired,

    recoveryIntakeReady:
      executionEvidence.recoveryIntakeReady,

    recoveryReason:
      executionEvidence.recoveryReason,

    runtimeResponse,

    responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      true,

    runtimeResponseExecuted,

    runtimeInterventionNotRequired,

    retryExecuted:
      runtimeResponse === "RETRY" &&
      runtimeResponseExecuted,

    recoveryExecuted:
      runtimeResponse === "RECOVER" &&
      runtimeResponseExecuted,

    failoverExecuted:
      runtimeResponse === "FAILOVER" &&
      runtimeResponseExecuted,

    stopExecuted:
      runtimeResponse === "STOP" &&
      runtimeResponseExecuted,

    escalationDispatched:
      runtimeResponse === "ESCALATE" &&
      runtimeResponseExecuted,

    executionEvidence,

    responseDecisionSummary: [
      ...responseDecisionSummary,
    ],

    executorSummary:
      executorSummary
        ? [
            ...executorSummary,
          ]
        : undefined,

    responseExecutionSummary: [
      ...responseExecutionSummary,
    ],

    summary: [
      ...certificationSummary,
    ],

  } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult;

}


function buildCertificationDenied():
  ProviderRuntimeExecutionOutcomeCertificationResult {

  const base =
    buildCertifiedResult(
      "RETRY_COMPLETED"
    );

  return {

    ...base,

    certificationStatus:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_DENIED",

    runtimeExecutionOutcomeCertificationAttempted:
      false,

    runtimeExecutionOutcomeCertified:
      false,

    runtimeExecutionOutcomeCertificationDenied:
      true,

    certificationDenialReason:
      "RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_NOT_ALLOWED",

    certifiedExecutionOutcome:
      undefined,

    executionEvidence:
      undefined,

    summary: [
      "provider_runtime_execution_outcome_certification_denied",
      "runtime_execution_outcome_certification_not_allowed",
    ],

  } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult;

}


function buildNotCertified():
  ProviderRuntimeExecutionOutcomeCertificationResult {

  const base =
    buildCertifiedResult(
      "RETRY_COMPLETED"
    );

  return {

    ...base,

    certificationStatus:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME_NOT_CERTIFIED",

    runtimeExecutionOutcomeCertificationAttempted:
      true,

    runtimeExecutionOutcomeCertified:
      false,

    runtimeExecutionOutcomeCertificationDenied:
      false,

    certificationFailureReason:
      "RUNTIME_RESPONSE_EXECUTION_STATE_INCOHERENT",

    certifiedExecutionOutcome:
      undefined,

    executionEvidence:
      undefined,

    summary: [
      "provider_runtime_execution_outcome_not_certified",
      "runtime_response_execution_state_incoherent",
    ],

  } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult;

}


// ============================================================
// INPUT BUILDER
// ============================================================

function buildInput(
  certification:
    ProviderRuntimeExecutionOutcomeCertificationResult,
  overrides?:
    Partial<ProviderRuntimeEvidenceLedgerAdmissionInput>
): ProviderRuntimeEvidenceLedgerAdmissionInput {

  return {

    certification,

    admissionDecision:
      "ADMIT_PROVIDER_RUNTIME_EVIDENCE_TO_LEDGER",

    ...overrides,

  };

}


// ============================================================
// SUCCESSFUL OUTCOME FAMILY
// ============================================================

function runSuccessfulOutcomeFamily(): void {

  for (const outcome of successfulOutcomes) {

    const result =
      admitProviderRuntimeEvidenceToLedger(
        buildInput(
          buildCertifiedResult(
            outcome
          )
        )
      );

    assertAdmitted(
      result,
      outcome,
      false,
      outcome
    );

    assert.equal(
      result.ledgerAdmissionMaterial?.executorFailureContained,
      false,
      `${outcome} is admitted as successful outcome`
    );

    pass(
      `${outcome} family member verified`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// CONTAINED-FAILURE OUTCOME FAMILY
// ============================================================

function runContainedFailureOutcomeFamily(): void {

  for (const outcome of containedFailureOutcomes) {

    const result =
      admitProviderRuntimeEvidenceToLedger(
        buildInput(
          buildCertifiedResult(
            outcome
          )
        )
      );

    assertAdmitted(
      result,
      outcome,
      true,
      outcome
    );

    assert(
      result.ledgerAdmissionMaterial?.executorSummary?.includes(
        "executor_failure_contained"
      ),
      `${outcome} contained failure evidence preserved`
    );

    pass(
      `${outcome} family member verified`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// ADMISSION GATE PRECEDENCE
// ============================================================

function runAdmissionGatePrecedenceChecks(): void {

  const certificationDenied =
    buildCertificationDenied();

  const rejectedResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput(
        certificationDenied,
        {

          admissionDecision:
            "REJECT_PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION",

        }
      )
    );

  assert.equal(
    rejectedResult.admissionStatus,
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION_DENIED",
    "admission rejection has terminal denied status"
  );

  assert.equal(
    rejectedResult.admissionDenialReason,
    "RUNTIME_EVIDENCE_LEDGER_ADMISSION_NOT_ALLOWED",
    "explicit admission rejection has precedence over P9P denial"
  );

  assertAdmissionFlags(
    rejectedResult
  );

  const certificationDeniedResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput(
        certificationDenied
      )
    );

  assert.equal(
    certificationDeniedResult.admissionDenialReason,
    "RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_DENIED",
    "P9P certification denial blocks admission"
  );

  assertAdmissionFlags(
    certificationDeniedResult
  );

  const notCertifiedResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput(
        buildNotCertified()
      )
    );

  assertNotAdmitted(
    notCertifiedResult,
    "RUNTIME_EXECUTION_OUTCOME_NOT_CERTIFIED",
    "runtime_execution_outcome_not_certified",
    "uncertified P9P outcome"
  );

  pass("admission gate precedence verified");
  pass("P9P certification authority preserved");

  assertNoCrossLayerFields(
    rejectedResult as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    certificationDeniedResult as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    notCertifiedResult as unknown as Record<string, unknown>
  );

}


// ============================================================
// EVIDENCE REQUIREMENT FAMILY
// ============================================================

function runEvidenceRequirementChecks(): void {

  const base =
    buildCertifiedResult(
      "RETRY_COMPLETED"
    );

  const missingOutcomeResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...base,

        certifiedExecutionOutcome:
          undefined,

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    missingOutcomeResult,
    "CERTIFIED_EXECUTION_OUTCOME_MISSING",
    "certified_execution_outcome_missing",
    "certified outcome missing"
  );

  const missingEvidenceResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...base,

        executionEvidence:
          undefined,

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    missingEvidenceResult,
    "CANONICAL_EXECUTION_EVIDENCE_MISSING",
    "canonical_execution_evidence_missing",
    "canonical evidence missing"
  );

  const invalidEvidenceResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...base,

        executionEvidence: {

          ...(base.executionEvidence as unknown as Record<string, unknown>),

          evidenceType:
            "NON_CANONICAL_PROVIDER_RUNTIME_EVIDENCE",

        },

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    invalidEvidenceResult,
    "CANONICAL_EXECUTION_EVIDENCE_INVALID",
    "canonical_execution_evidence_invalid",
    "canonical evidence invalid"
  );

  const invalidSummaryResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...base,

        executionEvidence: {

          ...(base.executionEvidence as unknown as Record<string, unknown>),

          responseExecutionSummary:
            undefined,

        },

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    invalidSummaryResult,
    "CANONICAL_EXECUTION_EVIDENCE_INVALID",
    "canonical_execution_evidence_invalid",
    "canonical evidence summary shape invalid"
  );

  pass("canonical evidence requirements verified");

  for (const result of [

    missingOutcomeResult,

    missingEvidenceResult,

    invalidEvidenceResult,

    invalidSummaryResult,

  ]) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// COHERENCE FAMILY
// ============================================================

function runEvidenceCoherenceChecks(): void {

  const base =
    buildCertifiedResult(
      "RECOVERY_COMPLETED"
    );

  const contextMismatchResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...base,

        executionEvidence: {

          ...(base.executionEvidence as unknown as Record<string, unknown>),

          providerResourceId:
            "kms-key-other-runtime",

        },

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    contextMismatchResult,
    "RUNTIME_EVIDENCE_CONTEXT_INCOHERENT",
    "runtime_evidence_context_incoherent",
    "runtime context mismatch"
  );

  const responseMismatchResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...base,

        executionEvidence: {

          ...(base.executionEvidence as unknown as Record<string, unknown>),

          runtimeResponse:
            "FAILOVER",

        },

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    responseMismatchResult,
    "RUNTIME_EVIDENCE_RESPONSE_INCOHERENT",
    "runtime_evidence_response_incoherent",
    "runtime response mismatch"
  );

  const executionStateMismatchResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...base,

        executionEvidence: {

          ...(base.executionEvidence as unknown as Record<string, unknown>),

          runtimeResponseExecuted:
            false,

        },

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    executionStateMismatchResult,
    "RUNTIME_EVIDENCE_EXECUTION_STATE_INCOHERENT",
    "runtime_evidence_execution_state_incoherent",
    "execution state mismatch"
  );

  const outcomeMismatchResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...base,

        executionEvidence: {

          ...(base.executionEvidence as unknown as Record<string, unknown>),

          certifiedExecutionOutcome:
            "RECOVERY_FAILED",

        },

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    outcomeMismatchResult,
    "CANONICAL_EXECUTION_EVIDENCE_INVALID",
    "canonical_execution_evidence_invalid",
    "certified outcome mismatch"
  );

  const containedFailure =
    buildCertifiedResult(
      "RECOVERY_FAILED"
    );

  const containedFailureSummaryResult =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...containedFailure,

        executionEvidence: {

          ...(containedFailure.executionEvidence as unknown as Record<string, unknown>),

          executorSummary:
            undefined,

        },

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    containedFailureSummaryResult,
    "RUNTIME_EVIDENCE_SUMMARY_INVALID",
    "runtime_evidence_summary_invalid",
    "contained-failure executor summary missing"
  );

  pass("P9P evidence coherence family verified");

  for (const result of [

    contextMismatchResult,

    responseMismatchResult,

    executionStateMismatchResult,

    outcomeMismatchResult,

    containedFailureSummaryResult,

  ]) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// OUTCOME EXCLUSIVITY
// ============================================================

function runOutcomeExclusivityChecks(): void {

  const outcomes = [
    ...successfulOutcomes,
    ...containedFailureOutcomes,
  ];

  for (const outcome of outcomes) {

    const result =
      admitProviderRuntimeEvidenceToLedger(
        buildInput(
          buildCertifiedResult(
            outcome
          )
        )
      );

    const material =
      result.ledgerAdmissionMaterial;

    assert(
      material,
      `${outcome} admission material present`
    );

    const successful =
      outcomeIsContainedFailure(
        outcome
      ) === false;

    assert.equal(
      material.executorFailureContained,
      !successful,
      `${outcome} success/failure containment remains exclusive`
    );

    if (successful) {

      assert.equal(
        material.executorSummary?.includes(
          "executor_failure_contained"
        ) ?? false,
        false,
        `${outcome} successful outcome does not claim contained failure`
      );

    } else {

      assert.equal(
        material.executorSummary?.includes(
          "executor_failure_contained"
        ),
        true,
        `${outcome} contained failure is explicitly preserved`
      );

    }

    assertAdmissionFlags(
      result
    );

  }

  pass("successful and contained-failure admission exclusivity verified");

}


// ============================================================
// ADMISSION MATERIAL COMPOSITION
// ============================================================

function runAdmissionMaterialCompositionChecks(): void {

  const certification =
    buildCertifiedResult(
      "FAILOVER_COMPLETED"
    );

  const evidence =
    certification.executionEvidence as unknown as {

      responseDecisionSummary:
        string[];

      executorSummary?:
        string[];

      responseExecutionSummary:
        string[];

    };

  const responseDecisionSummaryBefore = [
    ...evidence.responseDecisionSummary,
  ];

  const executorSummaryBefore = [
    ...(evidence.executorSummary ?? []),
  ];

  const responseExecutionSummaryBefore = [
    ...evidence.responseExecutionSummary,
  ];

  const certificationSummaryBefore = [
    ...certification.summary,
  ];

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput(
        certification
      )
    );

  assertAdmitted(
    result,
    "FAILOVER_COMPLETED",
    false,
    "admission material composition"
  );

  const material:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial =
      result.ledgerAdmissionMaterial!;

  assert.equal(
    material.evidenceType,
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME",
    "canonical evidence type preserved"
  );

  assert.equal(
    material.certifiedExecutionOutcome,
    certification.certifiedExecutionOutcome,
    "certified execution outcome preserved"
  );

  assert.equal(
    material.providerContract,
    certification.providerContract,
    "provider contract preserved"
  );

  assert.equal(
    material.providerImplementation,
    certification.providerImplementation,
    "provider implementation preserved"
  );

  assert.equal(
    material.operation,
    certification.operation,
    "operation preserved"
  );

  assert.equal(
    material.providerResourceId,
    certification.providerResourceId,
    "provider resource preserved"
  );

  assert.deepEqual(
    material.executionMetadata,
    certification.executionMetadata,
    "execution metadata preserved"
  );

  assert.equal(
    material.verificationStatus,
    certification.verificationStatus,
    "P9L verification status preserved"
  );

  assert.equal(
    material.classificationStatus,
    certification.classificationStatus,
    "P9M classification status preserved"
  );

  assert.equal(
    material.runtimeFailureClass,
    certification.runtimeFailureClass,
    "P9M failure class preserved"
  );

  assert.equal(
    material.runtimeResponse,
    certification.runtimeResponse,
    "P9N selected response preserved"
  );

  assert.equal(
    material.responseExecutionStatus,
    certification.responseExecutionStatus,
    "P9O execution status preserved"
  );

  assert.equal(
    material.runtimeResponseExecuted,
    certification.runtimeResponseExecuted,
    "P9O execution result preserved"
  );

  assert.equal(
    material.certifiedExecutionOutcome,
    certification.certifiedExecutionOutcome,
    "P9P certification outcome preserved"
  );

  assert.deepEqual(
    material.responseDecisionSummary,
    responseDecisionSummaryBefore,
    "response decision summary copied"
  );

  assert.deepEqual(
    material.executorSummary,
    executorSummaryBefore,
    "executor summary copied"
  );

  assert.deepEqual(
    material.responseExecutionSummary,
    responseExecutionSummaryBefore,
    "response execution summary copied"
  );

  assert.deepEqual(
    material.certificationSummary,
    certificationSummaryBefore,
    "certification summary copied"
  );

  assert.notEqual(
    material.responseDecisionSummary,
    evidence.responseDecisionSummary,
    "response decision summary copied defensively"
  );

  assert.notEqual(
    material.executorSummary,
    evidence.executorSummary,
    "executor summary copied defensively"
  );

  assert.notEqual(
    material.responseExecutionSummary,
    evidence.responseExecutionSummary,
    "response execution summary copied defensively"
  );

  assert.notEqual(
    material.certificationSummary,
    certification.summary,
    "certification summary copied defensively"
  );

  material.responseDecisionSummary.push(
    "family_runner_mutation_probe"
  );

  material.executorSummary?.push(
    "family_runner_mutation_probe"
  );

  material.responseExecutionSummary.push(
    "family_runner_mutation_probe"
  );

  material.certificationSummary.push(
    "family_runner_mutation_probe"
  );

  assert.deepEqual(
    evidence.responseDecisionSummary,
    responseDecisionSummaryBefore,
    "source response-decision summary remains immutable"
  );

  assert.deepEqual(
    evidence.executorSummary,
    executorSummaryBefore,
    "source executor summary remains immutable"
  );

  assert.deepEqual(
    evidence.responseExecutionSummary,
    responseExecutionSummaryBefore,
    "source response-execution summary remains immutable"
  );

  assert.deepEqual(
    certification.summary,
    certificationSummaryBefore,
    "source certification summary remains immutable"
  );

  pass("canonical ledger-admission material composition verified");
  pass("defensive summary copying verified");
  pass("source evidence immutability verified");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// CONTRACT PROPAGATION
// ============================================================

function runContractPropagationChecks(): void {

  const certification =
    buildCertifiedResult(
      "ESCALATION_FAILED"
    );

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput(
        certification
      )
    );

  assertAdmitted(
    result,
    "ESCALATION_FAILED",
    true,
    "contract propagation"
  );

  assert.equal(
    result.providerContract,
    certification.providerContract,
    "providerContract propagated"
  );

  assert.equal(
    result.providerImplementation,
    certification.providerImplementation,
    "providerImplementation propagated"
  );

  assert.equal(
    result.operation,
    certification.operation,
    "operation propagated"
  );

  assert.equal(
    result.providerResourceId,
    certification.providerResourceId,
    "providerResourceId propagated"
  );

  assert.equal(
    result.providerConfigurationRef,
    certification.providerConfigurationRef,
    "providerConfigurationRef propagated"
  );

  assert.equal(
    result.providerCredentialRef,
    certification.providerCredentialRef,
    "providerCredentialRef propagated"
  );

  assert.deepEqual(
    result.executionMetadata,
    certification.executionMetadata,
    "executionMetadata propagated"
  );

  assert.equal(
    result.verificationStatus,
    certification.verificationStatus,
    "verificationStatus propagated"
  );

  assert.equal(
    result.verificationFailureReason,
    certification.verificationFailureReason,
    "verificationFailureReason propagated"
  );

  assert.equal(
    result.classificationStatus,
    certification.classificationStatus,
    "classificationStatus propagated"
  );

  assert.equal(
    result.runtimeFailureClass,
    certification.runtimeFailureClass,
    "runtimeFailureClass propagated"
  );

  assert.equal(
    result.runtimeFailureSeverity,
    certification.runtimeFailureSeverity,
    "runtimeFailureSeverity propagated"
  );

  assert.equal(
    result.failureCode,
    certification.failureCode,
    "failureCode propagated"
  );

  assert.equal(
    result.providerRawStatus,
    certification.providerRawStatus,
    "providerRawStatus propagated"
  );

  assert.equal(
    result.providerRawErrorCode,
    certification.providerRawErrorCode,
    "providerRawErrorCode propagated"
  );

  assert.equal(
    result.providerSanitizedErrorMessage,
    certification.providerSanitizedErrorMessage,
    "providerSanitizedErrorMessage propagated"
  );

  assert.equal(
    result.retryable,
    certification.retryable,
    "retryable propagated"
  );

  assert.equal(
    result.recoveryIntakeRequired,
    certification.recoveryIntakeRequired,
    "recoveryIntakeRequired propagated"
  );

  assert.equal(
    result.recoveryIntakeReady,
    certification.recoveryIntakeReady,
    "recoveryIntakeReady propagated"
  );

  assert.equal(
    result.recoveryReason,
    certification.recoveryReason,
    "recoveryReason propagated"
  );

  assert.equal(
    result.runtimeResponse,
    certification.runtimeResponse,
    "runtimeResponse propagated"
  );

  assert.equal(
    result.responseExecutionStatus,
    certification.responseExecutionStatus,
    "responseExecutionStatus propagated"
  );

  assert.equal(
    result.runtimeResponseExecutionAttempted,
    certification.runtimeResponseExecutionAttempted,
    "runtimeResponseExecutionAttempted propagated"
  );

  assert.equal(
    result.runtimeResponseExecuted,
    certification.runtimeResponseExecuted,
    "runtimeResponseExecuted propagated"
  );

  assert.equal(
    result.runtimeInterventionNotRequired,
    certification.runtimeInterventionNotRequired,
    "runtimeInterventionNotRequired propagated"
  );

  assert.equal(
    result.certifiedExecutionOutcome,
    certification.certifiedExecutionOutcome,
    "certifiedExecutionOutcome propagated"
  );

  assert.deepEqual(
    result.certificationSummary,
    certification.summary,
    "certificationSummary propagated"
  );

  pass("provider/runtime context propagation verified");
  pass("P9L/P9M/P9N/P9O/P9P lineage propagation verified");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const results:
    ProviderRuntimeEvidenceLedgerAdmissionResult[] = [

      admitProviderRuntimeEvidenceToLedger(
        buildInput(
          buildCertifiedResult(
            "NO_ACTION_COMPLETED"
          )
        )
      ),

      admitProviderRuntimeEvidenceToLedger(
        buildInput(
          buildCertifiedResult(
            "RETRY_COMPLETED"
          )
        )
      ),

      admitProviderRuntimeEvidenceToLedger(
        buildInput(
          buildCertifiedResult(
            "RECOVERY_FAILED"
          )
        )
      ),

      admitProviderRuntimeEvidenceToLedger(
        buildInput(
          buildCertificationDenied()
        )
      ),

      admitProviderRuntimeEvidenceToLedger(
        buildInput(
          buildNotCertified()
        )
      ),

      admitProviderRuntimeEvidenceToLedger(
        buildInput(
          buildCertifiedResult(
            "FAILOVER_COMPLETED"
          ),
          {

            admissionDecision:
              "REJECT_PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION",

          }
        )
      ),

  ];

  for (const result of results) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

    assertAdmissionFlags(
      result
    );

  }

  pass("P9Q family boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runSuccessfulOutcomeFamily();

  runContainedFailureOutcomeFamily();

  runAdmissionGatePrecedenceChecks();

  runEvidenceRequirementChecks();

  runEvidenceCoherenceChecks();

  runOutcomeExclusivityChecks();

  runAdmissionMaterialCompositionChecks();

  runContractPropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9Q PROVIDER RUNTIME FAMILY");
  console.log("========================================");
  console.log("");

  console.log("Successful Outcome Admission:");
  console.log("✓ NO_ACTION_COMPLETED");
  console.log("✓ RETRY_COMPLETED");
  console.log("✓ RECOVERY_COMPLETED");
  console.log("✓ FAILOVER_COMPLETED");
  console.log("✓ STOP_COMPLETED");
  console.log("✓ ESCALATION_COMPLETED");

  console.log("");
  console.log("Contained-Failure Outcome Admission:");
  console.log("✓ RETRY_FAILED");
  console.log("✓ RECOVERY_FAILED");
  console.log("✓ FAILOVER_FAILED");
  console.log("✓ STOP_FAILED");
  console.log("✓ ESCALATION_FAILED");

  console.log("");
  console.log("Admission Gates:");
  console.log("✓ explicit P9Q rejection has precedence");
  console.log("✓ denied P9P certification blocks admission");
  console.log("✓ uncertified P9P outcome is not admitted");
  console.log("✓ denied and not-admitted states remain distinct");

  console.log("");
  console.log("Evidence Requirements:");
  console.log("✓ certified execution outcome required");
  console.log("✓ canonical execution evidence required");
  console.log("✓ canonical evidence type required");
  console.log("✓ canonical summary shape required");
  console.log("✓ contained failure requires executor summary");

  console.log("");
  console.log("Coherence Gates:");
  console.log("✓ provider/runtime context coherence");
  console.log("✓ P9N-selected response coherence");
  console.log("✓ P9O execution-state coherence");
  console.log("✓ P9P certified-outcome coherence");
  console.log("✓ successful and contained-failure outcomes remain exclusive");

  console.log("");
  console.log("Admission Material:");
  console.log("✓ canonical ledger-admission material composed");
  console.log("✓ provider/runtime context preserved");
  console.log("✓ verification context preserved");
  console.log("✓ classification context preserved");
  console.log("✓ failure context preserved");
  console.log("✓ recovery context preserved");
  console.log("✓ P9N response preserved");
  console.log("✓ P9O execution state preserved");
  console.log("✓ P9P certification preserved");
  console.log("✓ summaries copied defensively");
  console.log("✓ source evidence not mutated");

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
  console.log("✓ no P9P result alteration");
  console.log("✓ no evidence persistence");
  console.log("✓ no persistence identifier");
  console.log("✓ no ledger write");
  console.log("✓ no ledger entry identifier");
  console.log("✓ no ledger sequence");
  console.log("✓ no audit");

  console.log("");
  console.log("========================================");
  console.log("P9Q PROVIDER RUNTIME FAMILY VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();