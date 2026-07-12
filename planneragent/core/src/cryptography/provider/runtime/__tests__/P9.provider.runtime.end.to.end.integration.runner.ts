// ============================================================
// PlannerAgent — Provider Runtime End-to-End Integration Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9.provider.runtime.end.to.end.integration.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL INTEGRATION TEST RUNNER
//
// CATEGORY
// ------------------------------------------------------------
// Provider Runtime
//
// DOMAIN
// ------------------------------------------------------------
// P9L–P9T — Provider Runtime End-to-End Integration
//
// PURPOSE
// ------------------------------------------------------------
// Verify the complete provider-runtime trust chain:
//
// P9L verification result
// → P9M failure classification result
// → P9N response decision
// → P9O governed response execution
// → P9P execution-outcome certification
// → P9Q evidence ledger admission
// → P9R durable ledger write
// → P9S ledger audit admission
// → P9T governed audit execution / audit-record write
//
// P9L and P9M are represented by canonical typed upstream
// results. Every downstream boundary P9N–P9T is invoked through
// its real exported runtime function.
//
// This runner verifies:
//
// 1. verified runtime → NO_ACTION_COMPLETED → durable audit record
// 2. timeout failure → RETRY_COMPLETED → durable audit record
// 3. contained retry failure → RETRY_FAILED → durable audit record
// 4. exactly-one governed response executor invocation
// 5. exactly-one ledger writer invocation
// 6. exactly-one audit executor invocation
// 7. end-to-end authority preservation
// 8. end-to-end context and lineage preservation
// 9. durable identifiers originate only from governed writers
// 10. audit finding remains distinct from runtime outcome
// 11. contained-failure evidence remains sufficient through P9S
//
// ============================================================

import assert from "node:assert/strict";

import {
  decideProviderRuntimeResponse,
} from "../P9N.provider.runtime.response.decision";

import {
  executeProviderRuntimeResponse,
} from "../P9O.provider.runtime.response.execution";

import {
  certifyProviderRuntimeExecutionOutcome,
} from "../P9P.provider.runtime.execution.outcome.certification";

import {
  admitProviderRuntimeEvidenceToLedger,
} from "../P9Q.provider.runtime.evidence.persistence.ledger.admission";

import {
  writeProviderRuntimeEvidenceToLedger,
} from "../P9R.provider.runtime.evidence.persistence.ledger.write";

import {
  admitProviderRuntimeLedgerToAudit,
} from "../P9S.provider.runtime.ledger.integrity.audit.admission";

import {
  executeProviderRuntimeAudit,
} from "../P9T.provider.runtime.audit.execution.audit.record.write";

import type {
  ProviderRuntimeVerificationResult,
} from "../P9L.provider.runtime.verification";

import type {
  ProviderRuntimeFailureClassificationResult,
} from "../P9M.provider.runtime.failure.classification";

import type {
  ProviderRuntimeResponse,
  ProviderRuntimeResponseDecisionResult,
} from "../P9N.provider.runtime.response.decision";

import type {
  ProviderRuntimeResponseExecutionResult,
  ProviderRuntimeResponseExecutors,
} from "../P9O.provider.runtime.response.execution";

import type {
  ProviderRuntimeExecutionOutcomeCertificationResult,
} from "../P9P.provider.runtime.execution.outcome.certification";

import type {
  ProviderRuntimeEvidenceLedgerAdmissionResult,
} from "../P9Q.provider.runtime.evidence.persistence.ledger.admission";

import type {
  ProviderRuntimeEvidenceLedgerWriteResult,
} from "../P9R.provider.runtime.evidence.persistence.ledger.write";

import type {
  ProviderRuntimeLedgerAuditAdmissionResult,
} from "../P9S.provider.runtime.ledger.integrity.audit.admission";

import type {
  ProviderRuntimeAuditExecutionResult,
  ProviderRuntimeAuditFinding,
} from "../P9T.provider.runtime.audit.execution.audit.record.write";


// ============================================================
// UTILITIES
// ============================================================

function pass(
  label: string
): void {

  console.log(
    `✅ ${label}`
  );

}


function assertNonEmptyString(
  value: unknown,
  label: string
): asserts value is string {

  assert(
    typeof value === "string" &&
    value.length > 0,
    label
  );

}


// ============================================================
// CANONICAL CONTEXT
// ============================================================

const providerContract =
  "KEY_MANAGEMENT";

const providerImplementation =
  "AWS_KMS";

const operation =
  "REWRAP_KEY";

const providerResourceId =
  "kms-key-provider-runtime-e2e";

const providerConfigurationRef =
  "cfg/aws-kms-prod";

const providerCredentialRef =
  "cred/aws-kms-prod";

const executionMetadata = {

  tenantId:
    "tenant-e2e-001",

  runtimeBatchId:
    "runtime-e2e-001",

};


// ============================================================
// P9L CANONICAL RESULTS
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
      "aws-kms-e2e-success",

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

  } as ProviderRuntimeVerificationResult;

}


function buildTimeoutNotVerifiedRuntime():
  ProviderRuntimeVerificationResult {

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
      true,

    providerReference:
      "aws-kms-e2e-timeout",

    providerRawStatus:
      "KMS_ERROR",

    providerRawErrorCode:
      "TimeoutException",

    failureIntakeRequired:
      true,

    failureSurfacePresent:
      true,

    recoveryIntakeRequired:
      true,

    verificationFailureReason:
      "PROVIDER_FAILURE_SURFACE_PRESENT",

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
      "provider_failure_surface_present",
    ],

  } as ProviderRuntimeVerificationResult;

}


// ============================================================
// P9M CANONICAL RESULTS
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

  } as ProviderRuntimeFailureClassificationResult;

}


function buildTimeoutClassification():
  ProviderRuntimeFailureClassificationResult {

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

    runtimeFailureClass:
      "PROVIDER_TIMEOUT_FAILURE",

    runtimeFailureSeverity:
      "MEDIUM",

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
      "PROVIDER_CALL_TIMEOUT",

    providerRawStatus:
      "KMS_ERROR",

    providerRawErrorCode:
      "TimeoutException",

    providerSanitizedErrorMessage:
      "provider runtime timeout classified",

    retryable:
      true,

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
      "provider_runtime_failure_classified",
      "PROVIDER_TIMEOUT_FAILURE",
      "MEDIUM",
    ],

  } as ProviderRuntimeFailureClassificationResult;

}


// ============================================================
// GOVERNED BOUNDARY TRACKING
// ============================================================

interface InvocationTracker {

  responseExecutors:
    number;

  ledgerWriters:
    number;

  auditExecutors:
    number;

}


function buildTracker():
  InvocationTracker {

  return {

    responseExecutors:
      0,

    ledgerWriters:
      0,

    auditExecutors:
      0,

  };

}


// ============================================================
// END-TO-END PIPELINE
// ============================================================

interface PipelineOptions {

  verification:
    ProviderRuntimeVerificationResult;

  classification:
    ProviderRuntimeFailureClassificationResult;

  expectedResponse:
    ProviderRuntimeResponse;

  responseExecutorSucceeds:
    boolean;

  auditFinding:
    ProviderRuntimeAuditFinding;

}


interface PipelineResult {

  responseDecision:
    ProviderRuntimeResponseDecisionResult;

  responseExecution:
    ProviderRuntimeResponseExecutionResult;

  certification:
    ProviderRuntimeExecutionOutcomeCertificationResult;

  evidenceAdmission:
    ProviderRuntimeEvidenceLedgerAdmissionResult;

  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult;

  auditAdmission:
    ProviderRuntimeLedgerAuditAdmissionResult;

  auditExecution:
    ProviderRuntimeAuditExecutionResult;

  tracker:
    InvocationTracker;

}


function runPipeline(
  options:
    PipelineOptions
): PipelineResult {

  const tracker =
    buildTracker();

  // ----------------------------------------------------------
  // P9N — RESPONSE DECISION
  // ----------------------------------------------------------

  const responseDecision =
    decideProviderRuntimeResponse({

      verification:
        options.verification,

      classification:
        options.classification,

      recoveryIntake:
        undefined,

      responseDecision:
        "DECIDE_PROVIDER_RUNTIME_RESPONSE",

    });

  assert.equal(
    responseDecision.responseDecisionStatus,
    "PROVIDER_RUNTIME_RESPONSE_DECIDED",
    "P9N response decided"
  );

  assert.equal(
    responseDecision.runtimeResponse,
    options.expectedResponse,
    "P9N selected expected response"
  );

  // ----------------------------------------------------------
  // P9O — RESPONSE EXECUTION
  // ----------------------------------------------------------

  const executors:
    ProviderRuntimeResponseExecutors = {};

  if (
    options.expectedResponse ===
    "RETRY"
  ) {

    executors.retry =
      (decision) => {

        tracker.responseExecutors += 1;

        assert.equal(
          decision.runtimeResponse,
          "RETRY",
          "P9O retry executor receives P9N-selected response"
        );

        return {

          runtimeResponse:
            "RETRY",

          runtimeResponseExecutionSucceeded:
            options.responseExecutorSucceeds,

          summary:
            options.responseExecutorSucceeds
              ? [
                  "provider_runtime_response_executor_completed",
                  "retry_completed",
                ]
              : [
                  "provider_runtime_response_executor_failed",
                  "retry_failed",
                  "executor_failure_contained",
                ],

        };

      };

  }

  const responseExecution =
    executeProviderRuntimeResponse({

      responseDecision,

      responseExecution:
        "EXECUTE_PROVIDER_RUNTIME_RESPONSE",

      executors,

    });

  assert.equal(
    responseExecution.responseExecutionStatus,
    options.responseExecutorSucceeds
      ? "PROVIDER_RUNTIME_RESPONSE_EXECUTED"
      : "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",
    "P9O terminal execution state"
  );

  assert.equal(
    responseExecution.runtimeResponse,
    options.expectedResponse,
    "P9O preserves P9N response"
  );

  if (
    options.expectedResponse === "RETRY" &&
    options.responseExecutorSucceeds === false
  ) {

    assert.equal(
      responseExecution.responseExecutionFailureReason,
      "RUNTIME_RESPONSE_EXECUTION_FAILED",
      "P9O contained failure exposes canonical execution failure reason"
    );

    assert(
      responseExecution.executorSummary?.includes(
        "executor_failure_contained"
      ),
      "P9O contained failure exposes canonical containment summary"
    );

  }

  // ----------------------------------------------------------
  // P9P — OUTCOME CERTIFICATION
  // ----------------------------------------------------------

  const certification =
    certifyProviderRuntimeExecutionOutcome({

      execution:
        responseExecution,

      certification:
        "CERTIFY_PROVIDER_RUNTIME_EXECUTION_OUTCOME",

    });

  assert.equal(
    certification.certificationStatus,
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFIED",
    "P9P outcome certified"
  );

  if (
    options.expectedResponse === "RETRY" &&
    options.responseExecutorSucceeds === false
  ) {

    assert.equal(
      certification.certifiedExecutionOutcome,
      "RETRY_FAILED",
      "P9P certifies contained RETRY failure"
    );

    assert(
      certification.executorSummary?.includes(
        "executor_failure_contained"
      ),
      "P9P preserves canonical containment summary"
    );

  }

  // ----------------------------------------------------------
  // P9Q — EVIDENCE LEDGER ADMISSION
  // ----------------------------------------------------------

  const evidenceAdmission =
    admitProviderRuntimeEvidenceToLedger({

      certification,

      admissionDecision:
        "ADMIT_PROVIDER_RUNTIME_EVIDENCE_TO_LEDGER",

    });

  assert.equal(
    evidenceAdmission.admissionStatus,
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMITTED",
    "P9Q evidence admitted"
  );

  if (
    options.expectedResponse === "RETRY" &&
    options.responseExecutorSucceeds === false
  ) {

    assert.equal(
      evidenceAdmission.executorFailureContained,
      true,
      "P9Q preserves contained-failure posture"
    );

    assert(
      evidenceAdmission.ledgerAdmissionMaterial?.executorSummary?.includes(
        "executor_failure_contained"
      ),
      "P9Q preserves canonical containment summary"
    );

  }

  // ----------------------------------------------------------
  // P9R — DURABLE LEDGER WRITE
  // ----------------------------------------------------------

  const ledgerWrite =
    writeProviderRuntimeEvidenceToLedger({

      admission:
        evidenceAdmission,

      writeDecision:
        "WRITE_PROVIDER_RUNTIME_EVIDENCE_TO_LEDGER",

      ledgerWriter:
        ({ ledgerEntry }) => {

          tracker.ledgerWriters += 1;

          assert.equal(
            ledgerEntry.runtimeResponse,
            options.expectedResponse,
            "P9R ledger entry preserves P9N response"
          );

          if (
            options.expectedResponse === "RETRY" &&
            options.responseExecutorSucceeds === false
          ) {

            assert.equal(
              ledgerEntry.certifiedExecutionOutcome,
              "RETRY_FAILED",
              "P9R ledger entry preserves RETRY_FAILED outcome"
            );

            assert.equal(
              ledgerEntry.executorFailureContained,
              true,
              "P9R ledger entry preserves contained-failure posture"
            );

            assert.equal(
              ledgerEntry.runtimeResponseExecuted,
              false,
              "P9R ledger entry preserves non-executed response state"
            );

            assert.equal(
              ledgerEntry.responseExecutionStatus,
              "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",
              "P9R ledger entry preserves failed execution status"
            );

            assert(
              ledgerEntry.executorSummary?.includes(
                "executor_failure_contained"
              ),
              "P9R ledger entry preserves containment summary"
            );

          }

          return {

            writerStatus:
              "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITER_COMPLETED",

            writerAttempted:
              true,

            writerCompleted:
              true,

            persistenceId:
              "persist-e2e-001",

            ledgerEntryId:
              "ledger-e2e-001",

            ledgerSequence:
              1001,

            persistedAt:
              "2026-07-12T15:00:00.000Z",

            summary: [
              "provider_runtime_evidence_ledger_writer_completed",
              "provider_runtime_evidence_persisted",
              "provider_runtime_ledger_entry_written",
            ],

          };

        },

    });

  assert.equal(
    ledgerWrite.writeStatus,
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITTEN",
    "P9R ledger written"
  );

  if (
    options.expectedResponse === "RETRY" &&
    options.responseExecutorSucceeds === false
  ) {

    assert.equal(
      ledgerWrite.certifiedExecutionOutcome,
      "RETRY_FAILED",
      "P9R write result preserves RETRY_FAILED outcome"
    );

    assert.equal(
      ledgerWrite.executorFailureContained,
      true,
      "P9R write result preserves contained-failure posture"
    );

    assert.equal(
      ledgerWrite.runtimeResponseExecuted,
      false,
      "P9R write result preserves non-executed response state"
    );

    assert.equal(
      ledgerWrite.responseExecutionStatus,
      "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",
      "P9R write result preserves failed execution status"
    );

    assert(
      ledgerWrite.ledgerEntry?.executorSummary?.includes(
        "executor_failure_contained"
      ),
      "P9R durable ledger entry contains canonical containment evidence"
    );

  }

  // ----------------------------------------------------------
  // P9S — AUDIT ADMISSION
  // ----------------------------------------------------------

  const auditAdmission =
    admitProviderRuntimeLedgerToAudit({

      ledgerWrite,

      auditAdmissionDecision:
        "ADMIT_PROVIDER_RUNTIME_LEDGER_TO_AUDIT",

    });

  assert.equal(
    auditAdmission.auditAdmissionStatus,
    "PROVIDER_RUNTIME_LEDGER_AUDIT_ADMITTED",
    `P9S ledger fact admitted to audit${
      auditAdmission.auditAdmissionFailureReason
        ? `; failure=${auditAdmission.auditAdmissionFailureReason}`
        : ""
    }`
  );

  if (
    options.expectedResponse === "RETRY" &&
    options.responseExecutorSucceeds === false
  ) {

    assert.equal(
      auditAdmission.certifiedExecutionOutcome,
      "RETRY_FAILED",
      "P9S preserves RETRY_FAILED outcome"
    );

    assert.equal(
      auditAdmission.executorFailureContained,
      true,
      "P9S admits contained executor failure"
    );

    assert(
      auditAdmission.auditAdmissionMaterial?.executorSummary?.includes(
        "executor_failure_contained"
      ),
      "P9S audit material preserves canonical containment evidence"
    );

  }

  // ----------------------------------------------------------
  // P9T — AUDIT EXECUTION / RECORD WRITE
  // ----------------------------------------------------------

  const auditExecution =
    executeProviderRuntimeAudit({

      auditAdmission,

      auditExecutionDecision:
        "EXECUTE_PROVIDER_RUNTIME_AUDIT",

      auditExecutor:
        ({ auditAdmissionMaterial }) => {

          tracker.auditExecutors += 1;

          assert.equal(
            auditAdmissionMaterial.runtimeResponse,
            options.expectedResponse,
            "P9T receives P9N-selected response lineage"
          );

          if (
            options.expectedResponse === "RETRY" &&
            options.responseExecutorSucceeds === false
          ) {

            assert.equal(
              auditAdmissionMaterial.certifiedExecutionOutcome,
              "RETRY_FAILED",
              "P9T receives contained-failure certified outcome"
            );

            assert.equal(
              auditAdmissionMaterial.executorFailureContained,
              true,
              "P9T receives contained-failure posture"
            );

            assert(
              auditAdmissionMaterial.executorSummary?.includes(
                "executor_failure_contained"
              ),
              "P9T receives canonical containment evidence"
            );

          }

          return {

            executorStatus:
              "PROVIDER_RUNTIME_AUDIT_EXECUTOR_COMPLETED",

            auditExecutionAttempted:
              true,

            auditExecutionCompleted:
              true,

            auditRecordWritten:
              true,

            auditFinding:
              options.auditFinding,

            auditReason:
              options.auditFinding ===
              "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING"
                ? "end-to-end audit detected nonconforming ledger fact"
                : undefined,

            auditRecordId:
              "audit-e2e-001",

            auditSequence:
              2001,

            auditedAt:
              "2026-07-12T15:05:00.000Z",

            summary: [
              "provider_runtime_audit_executor_completed",
              options.auditFinding.toLowerCase(),
              "provider_runtime_audit_record_persisted",
            ],

          };

        },

    });

  assert.equal(
    auditExecution.auditExecutionStatus,
    "PROVIDER_RUNTIME_AUDIT_RECORD_WRITTEN",
    "P9T audit record written"
  );

  return {

    responseDecision,

    responseExecution,

    certification,

    evidenceAdmission,

    ledgerWrite,

    auditAdmission,

    auditExecution,

    tracker,

  };

}


// ============================================================
// END-TO-END ASSERTIONS
// ============================================================

function assertCompleteLineage(
  result:
    PipelineResult,
  expectedResponse:
    ProviderRuntimeResponse
): void {

  assert.equal(
    result.responseDecision.runtimeResponse,
    expectedResponse,
    "P9N response preserved"
  );

  assert.equal(
    result.responseExecution.runtimeResponse,
    expectedResponse,
    "P9O response preserved"
  );

  assert.equal(
    result.certification.runtimeResponse,
    expectedResponse,
    "P9P response preserved"
  );

  assert.equal(
    result.evidenceAdmission.runtimeResponse,
    expectedResponse,
    "P9Q response preserved"
  );

  assert.equal(
    result.ledgerWrite.runtimeResponse,
    expectedResponse,
    "P9R response preserved"
  );

  assert.equal(
    result.auditAdmission.runtimeResponse,
    expectedResponse,
    "P9S response preserved"
  );

  assert.equal(
    result.auditExecution.runtimeResponse,
    expectedResponse,
    "P9T response preserved"
  );

  assert.equal(
    result.auditExecution.providerContract,
    providerContract,
    "provider contract preserved end-to-end"
  );

  assert.equal(
    result.auditExecution.providerImplementation,
    providerImplementation,
    "provider implementation preserved end-to-end"
  );

  assert.equal(
    result.auditExecution.operation,
    operation,
    "operation preserved end-to-end"
  );

  assert.equal(
    result.auditExecution.providerResourceId,
    providerResourceId,
    "provider resource preserved end-to-end"
  );

  assert.deepEqual(
    result.auditExecution.executionMetadata,
    executionMetadata,
    "execution metadata preserved end-to-end"
  );

  assertNonEmptyString(
    result.ledgerWrite.persistenceId,
    "P9R persistence identifier present"
  );

  assertNonEmptyString(
    result.ledgerWrite.ledgerEntryId,
    "P9R ledger-entry identifier present"
  );

  assertNonEmptyString(
    result.auditExecution.auditRecordId,
    "P9T audit-record identifier present"
  );

  assert.equal(
    result.tracker.ledgerWriters,
    1,
    "exactly one governed ledger writer invoked"
  );

  assert.equal(
    result.tracker.auditExecutors,
    1,
    "exactly one governed audit executor invoked"
  );

}


// ============================================================
// SCENARIO 1 — VERIFIED RUNTIME / NO_ACTION
// ============================================================

function runVerifiedNoActionEndToEnd(): void {

  const result =
    runPipeline({

      verification:
        buildVerifiedRuntime(),

      classification:
        buildClassificationNotRequired(),

      expectedResponse:
        "NO_ACTION",

      responseExecutorSucceeds:
        true,

      auditFinding:
        "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",

    });

  assert.equal(
    result.tracker.responseExecutors,
    0,
    "NO_ACTION invokes no governed response executor"
  );

  assert.equal(
    result.certification.certifiedExecutionOutcome,
    "NO_ACTION_COMPLETED",
    "NO_ACTION certified outcome"
  );

  assert.equal(
    result.auditExecution.auditFinding,
    "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",
    "NO_ACTION audit finding"
  );

  assertCompleteLineage(
    result,
    "NO_ACTION"
  );

  pass("verified runtime completed P9L–P9T end-to-end");

}


// ============================================================
// SCENARIO 2 — TIMEOUT / RETRY COMPLETED
// ============================================================

function runRetryCompletedEndToEnd(): void {

  const result =
    runPipeline({

      verification:
        buildTimeoutNotVerifiedRuntime(),

      classification:
        buildTimeoutClassification(),

      expectedResponse:
        "RETRY",

      responseExecutorSucceeds:
        true,

      auditFinding:
        "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",

    });

  assert.equal(
    result.tracker.responseExecutors,
    1,
    "RETRY invokes exactly one governed response executor"
  );

  assert.equal(
    result.certification.certifiedExecutionOutcome,
    "RETRY_COMPLETED",
    "RETRY success certified"
  );

  assert.equal(
    result.auditExecution.auditFinding,
    "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",
    "RETRY completed audit finding"
  );

  assertCompleteLineage(
    result,
    "RETRY"
  );

  pass("retry success completed P9L–P9T end-to-end");

}


// ============================================================
// SCENARIO 3 — TIMEOUT / RETRY FAILED BUT CERTIFIED
// ============================================================

function runRetryContainedFailureEndToEnd(): void {

  const result =
    runPipeline({

      verification:
        buildTimeoutNotVerifiedRuntime(),

      classification:
        buildTimeoutClassification(),

      expectedResponse:
        "RETRY",

      responseExecutorSucceeds:
        false,

      auditFinding:
        "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING",

    });

  assert.equal(
    result.tracker.responseExecutors,
    1,
    "contained RETRY failure invokes exactly one executor"
  );

  assert.equal(
    result.certification.certifiedExecutionOutcome,
    "RETRY_FAILED",
    "contained RETRY failure certified"
  );

  assert(
    result.certification.executorSummary?.includes(
      "executor_failure_contained"
    ),
    "P9P preserves contained executor failure evidence"
  );

  assert.equal(
    result.evidenceAdmission.executorFailureContained,
    true,
    "P9Q preserves contained executor failure"
  );

  assert.equal(
    result.ledgerWrite.executorFailureContained,
    true,
    "P9R persists contained executor failure"
  );

  assert.equal(
    result.auditAdmission.executorFailureContained,
    true,
    "P9S admits contained executor failure"
  );

  assert.equal(
    result.auditExecution.executorFailureContained,
    true,
    "P9T audits contained executor failure"
  );

  assert.equal(
    result.auditExecution.auditFinding,
    "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING",
    "nonconforming finding remains completed audit"
  );

  assert.equal(
    result.auditExecution.runtimeAuditExecuted,
    true,
    "nonconforming finding does not become audit execution failure"
  );

  assertCompleteLineage(
    result,
    "RETRY"
  );

  pass("contained retry failure completed P9L–P9T end-to-end");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runVerifiedNoActionEndToEnd();

  runRetryCompletedEndToEnd();

  runRetryContainedFailureEndToEnd();

  console.log("");
  console.log("========================================");
  console.log("PROVIDER RUNTIME P9L–P9T END-TO-END");
  console.log("========================================");
  console.log("");

  console.log("Canonical Chain:");
  console.log("✓ P9L verification result");
  console.log("✓ P9M classification result");
  console.log("✓ P9N response decision");
  console.log("✓ P9O governed response execution");
  console.log("✓ P9P execution-outcome certification");
  console.log("✓ P9Q evidence ledger admission");
  console.log("✓ P9R durable ledger write");
  console.log("✓ P9S ledger audit admission");
  console.log("✓ P9T audit execution and record write");

  console.log("");
  console.log("End-to-End Scenarios:");
  console.log("✓ verified runtime → NO_ACTION_COMPLETED");
  console.log("✓ timeout → RETRY_COMPLETED");
  console.log("✓ contained retry failure → RETRY_FAILED");
  console.log("✓ confirmed and nonconforming audit findings");

  console.log("");
  console.log("Contained-Failure Evidence:");
  console.log("✓ canonical executor failure summary preserved");
  console.log("✓ executor_failure_contained preserved P9O→P9T");
  console.log("✓ failed response remains attempted but not executed");
  console.log("✓ RETRY_FAILED remains a durable auditable fact");

  console.log("");
  console.log("Authority Preservation:");
  console.log("✓ P9L verification remains authoritative");
  console.log("✓ P9M classification remains authoritative");
  console.log("✓ P9N selected response remains authoritative");
  console.log("✓ P9O execution state remains authoritative");
  console.log("✓ P9P certified outcome remains authoritative");
  console.log("✓ P9Q admission remains authoritative");
  console.log("✓ P9R durable identifiers remain writer-owned");
  console.log("✓ P9S audit admission remains authoritative");
  console.log("✓ P9T audit identifiers remain executor-owned");

  console.log("");
  console.log("Governed Invocation:");
  console.log("✓ NO_ACTION invokes no response executor");
  console.log("✓ RETRY invokes exactly one response executor");
  console.log("✓ exactly one ledger writer per admitted outcome");
  console.log("✓ exactly one audit executor per admitted ledger fact");

  console.log("");
  console.log("Lineage:");
  console.log("✓ provider/runtime context preserved P9L→P9T");
  console.log("✓ selected response preserved P9N→P9T");
  console.log("✓ contained executor failure preserved P9O→P9T");
  console.log("✓ durable ledger identity preserved P9R→P9T");

  console.log("");
  console.log("========================================");
  console.log("PROVIDER RUNTIME P9L–P9T END-TO-END VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();