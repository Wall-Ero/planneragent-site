// ============================================================
// PlannerAgent — Provider Runtime Audit Execution / Audit Record Write Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9T.provider.runtime.audit.execution.audit.record.write.runner.ts
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
// P9T.1 — Provider Runtime Audit Execution / Audit Record Write Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9T.1 governed audit-execution and
// canonical audit-record-write contract.
//
// This runner verifies:
//
// 1. audit execution rejected
// 2. P9S audit admission denied
// 3. ledger fact not admitted to audit
// 4. audit-admission material missing
// 5. audit-admission material incoherent
// 6. governed audit executor missing
// 7. audit executor throws
// 8. coherent audit-executor failure
// 9. incoherent failed executor result
// 10. audit completed but record not written
// 11. incoherent completed executor results
// 12. confirmed audit finding
// 13. nonconforming audit finding
// 14. nonconforming finding requires reason
// 15. exactly one governed audit executor invocation
// 16. canonical audit-record composition
// 17. defensive summary copying
// 18. source immutability
// 19. durable audit identifier propagation
// 20. P9L/P9M/P9N/P9O/P9P/P9Q/P9R/P9S lineage propagation
// 21. boundary verification
//
// P9T executes audit and writes one audit record.
//
// P9T does not verify ledger history.
//
// P9T does not verify chain continuity.
//
// P9T does not verify cryptographic chain proof.
//
// ============================================================

import assert from "node:assert/strict";

import {
  executeProviderRuntimeAudit,
} from "../P9T.provider.runtime.audit.execution.audit.record.write";

import type {
  ProviderRuntimeAuditExecutionInput,
  ProviderRuntimeAuditExecutionResult,
  ProviderRuntimeAuditExecutor,
  ProviderRuntimeAuditExecutorInput,
  ProviderRuntimeAuditExecutorResult,
  ProviderRuntimeAuditFinding,
  ProviderRuntimeAuditRecord,
} from "../P9T.provider.runtime.audit.execution.audit.record.write";

import type {
  ProviderRuntimeLedgerAuditAdmissionMaterial,
  ProviderRuntimeLedgerAuditAdmissionResult,
} from "../P9S.provider.runtime.ledger.integrity.audit.admission";


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

    "runtimeVerifiedByAuditExecution",

    "runtimeFailureClassifiedByAuditExecution",

    "runtimeResponseDecidedByAuditExecution",

    "runtimeResponseExecutedByAuditExecution",

    "executionOutcomeCertifiedByAuditExecution",

    "runtimeEvidenceAdmittedByAuditExecution",

    "runtimeEvidencePersistedByAuditExecution",

    "ledgerEntryWrittenByAuditExecution",

    "runtimeLedgerAuditAdmittedByAuditExecution",

    "providerSdkCalled",

    "providerApiCalled",

    "providerExecutionInvoked",

    "providerErrorResanitized",

    "sanitizedFailureSurfaceAltered",

    "runtimeResponseReplaced",

    "executionResultAltered",

    "certificationResultAltered",

    "admissionResultAltered",

    "ledgerWriteResultAltered",

    "auditAdmissionResultAltered",

    "ledgerHistoryVerified",

    "ledgerChainContinuityVerified",

    "cryptographicProofVerified",

  ];

  for (const field of forbiddenFields) {

    assert(
      !(field in value),
      `cross-layer field not exposed: ${field}`
    );

  }

}


function assertDenied(
  result:
    ProviderRuntimeAuditExecutionResult,
  expectedReason:
    ProviderRuntimeAuditExecutionResult["auditExecutionDenialReason"],
  label:
    string
): void {

  assert.equal(
    result.auditExecutionStatus,
    "PROVIDER_RUNTIME_AUDIT_EXECUTION_DENIED",
    `${label} status`
  );

  assert.equal(
    result.runtimeAuditExecutionAttempted,
    false,
    `${label} not attempted`
  );

  assert.equal(
    result.runtimeAuditExecuted,
    false,
    `${label} not executed`
  );

  assert.equal(
    result.runtimeAuditRecordWritten,
    false,
    `${label} record not written`
  );

  assert.equal(
    result.runtimeAuditExecutionDenied,
    true,
    `${label} denied`
  );

  assert.equal(
    result.auditExecutionDenialReason,
    expectedReason,
    `${label} denial reason preserved`
  );

  assert.equal(
    result.auditExecutionFailureReason,
    undefined,
    `${label} exposes no failure reason`
  );

  assert.equal(
    result.auditRecord,
    undefined,
    `${label} exposes no audit record`
  );

  assert.equal(
    result.auditRecordId,
    undefined,
    `${label} exposes no audit-record identifier`
  );

  assert.equal(
    result.auditSequence,
    undefined,
    `${label} exposes no audit sequence`
  );

  assert.equal(
    result.auditedAt,
    undefined,
    `${label} exposes no audit timestamp`
  );

}


function assertNotCompleted(
  result:
    ProviderRuntimeAuditExecutionResult,
  expectedReason:
    ProviderRuntimeAuditExecutionResult["auditExecutionFailureReason"],
  summaryToken:
    string,
  label:
    string
): void {

  assert.equal(
    result.auditExecutionStatus,
    "PROVIDER_RUNTIME_AUDIT_NOT_COMPLETED",
    `${label} status`
  );

  assert.equal(
    result.runtimeAuditExecutionAttempted,
    true,
    `${label} attempted`
  );

  assert.equal(
    result.runtimeAuditExecuted,
    false,
    `${label} not executed`
  );

  assert.equal(
    result.runtimeAuditRecordWritten,
    false,
    `${label} record not written`
  );

  assert.equal(
    result.runtimeAuditExecutionDenied,
    false,
    `${label} not denied`
  );

  assert.equal(
    result.auditExecutionFailureReason,
    expectedReason,
    `${label} failure reason preserved`
  );

  assert.equal(
    result.auditExecutionDenialReason,
    undefined,
    `${label} exposes no denial reason`
  );

  assert.equal(
    result.auditFinding,
    undefined,
    `${label} exposes no finding`
  );

  assert.equal(
    result.auditRecord,
    undefined,
    `${label} exposes no audit record`
  );

  assert.equal(
    result.auditRecordId,
    undefined,
    `${label} exposes no audit-record identifier`
  );

  assert.equal(
    result.auditSequence,
    undefined,
    `${label} exposes no audit sequence`
  );

  assert.equal(
    result.auditedAt,
    undefined,
    `${label} exposes no audit timestamp`
  );

  assert(
    result.summary.includes(
      summaryToken
    ),
    `${label} summary token preserved`
  );

}


function assertCompleted(
  result:
    ProviderRuntimeAuditExecutionResult,
  expectedFinding:
    ProviderRuntimeAuditFinding,
  label:
    string
): void {

  assert.equal(
    result.auditExecutionStatus,
    "PROVIDER_RUNTIME_AUDIT_RECORD_WRITTEN",
    `${label} status`
  );

  assert.equal(
    result.runtimeAuditExecutionAttempted,
    true,
    `${label} attempted`
  );

  assert.equal(
    result.runtimeAuditExecuted,
    true,
    `${label} executed`
  );

  assert.equal(
    result.runtimeAuditRecordWritten,
    true,
    `${label} record written`
  );

  assert.equal(
    result.runtimeAuditExecutionDenied,
    false,
    `${label} not denied`
  );

  assert.equal(
    result.auditExecutionDenialReason,
    undefined,
    `${label} exposes no denial reason`
  );

  assert.equal(
    result.auditExecutionFailureReason,
    undefined,
    `${label} exposes no failure reason`
  );

  assert.equal(
    result.auditFinding,
    expectedFinding,
    `${label} finding preserved`
  );

  assert(
    result.auditRecord,
    `${label} audit record exposed`
  );

  assert.equal(
    result.auditRecord?.auditFinding,
    expectedFinding,
    `${label} record finding preserved`
  );

  assert.equal(
    typeof result.auditRecordId,
    "string",
    `${label} audit-record identifier exposed`
  );

  assert.equal(
    typeof result.auditSequence,
    "number",
    `${label} audit sequence exposed`
  );

  assert.equal(
    typeof result.auditedAt,
    "string",
    `${label} audit timestamp exposed`
  );

  assert(
    result.summary.includes(
      "provider_runtime_audit_executed"
    ),
    `${label} execution summary preserved`
  );

  assert(
    result.summary.includes(
      "provider_runtime_audit_record_written"
    ),
    `${label} record-write summary preserved`
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
  "kms-key-runtime-audit-execution";

const providerConfigurationRef =
  "cfg/aws-kms-prod";

const providerCredentialRef =
  "cred/aws-kms-prod";

const executionMetadata = {

  tenantId:
    "tenant-001",

  runtimeBatchId:
    "runtime-audit-execution-001",

};


// ============================================================
// P9S AUDIT-ADMISSION MATERIAL FIXTURE
// ============================================================

function buildAuditAdmissionMaterial(
  containedFailure:
    boolean = false
): ProviderRuntimeLedgerAuditAdmissionMaterial {

  return {

    auditMaterialType:
      "PROVIDER_RUNTIME_LEDGER_WRITE",

    auditMaterialVersion:
      "P9S.1",

    persistenceId:
      "persist-runtime-audit-001",

    ledgerEntryId:
      "ledger-runtime-audit-001",

    ledgerSequence:
      701,

    persistedAt:
      "2026-07-12T12:00:00.000Z",

    ledgerEntryType:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME",

    ledgerEntryVersion:
      "P9R.1",

    certifiedExecutionOutcome:
      containedFailure
        ? "RETRY_FAILED"
        : "RETRY_COMPLETED",

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

    classificationStatus:
      "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",

    runtimeFailureClass:
      "PROVIDER_TIMEOUT_FAILURE",

    runtimeFailureSeverity:
      "MEDIUM",

    failureCode:
      "PROVIDER_CALL_TIMEOUT",

    providerRawStatus:
      "KMS_ERROR",

    providerRawErrorCode:
      "TimeoutException",

    providerSanitizedErrorMessage:
      "provider runtime failure classified",

    retryable:
      true,

    recoveryIntakeRequired:
      true,

    recoveryIntakeReady:
      false,

    recoveryReason:
      undefined,

    runtimeResponse:
      "RETRY",

    responseExecutionStatus:
      containedFailure
        ? "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED"
        : "PROVIDER_RUNTIME_RESPONSE_EXECUTED",

    runtimeResponseExecutionAttempted:
      true,

    runtimeResponseExecuted:
      containedFailure === false,

    runtimeInterventionNotRequired:
      false,

    executorFailureContained:
      containedFailure,

    responseDecisionSummary: [
      "provider_runtime_response_decided",
      "retry",
    ],

    executorSummary:
      containedFailure
        ? [
            "provider_runtime_response_executor_failed",
            "retry_failed",
            "executor_failure_contained",
          ]
        : [
            "provider_runtime_response_executor_completed",
            "retry_completed",
          ],

    responseExecutionSummary:
      containedFailure
        ? [
            "provider_runtime_response_decided",
            "retry",
            "provider_runtime_response_not_executed",
            "runtime_response_execution_failed",
            "executor_failure_contained",
          ]
        : [
            "provider_runtime_response_decided",
            "retry",
            "provider_runtime_response_executed",
            "retry_executed",
          ],

    certificationSummary:
      containedFailure
        ? [
            "provider_runtime_response_not_executed",
            "provider_runtime_execution_outcome_certified",
            "retry_failed",
          ]
        : [
            "provider_runtime_response_executed",
            "provider_runtime_execution_outcome_certified",
            "retry_completed",
          ],

    ledgerWriteSummary: [
      "provider_runtime_evidence_ledger_admitted",
      "provider_runtime_evidence_persisted",
      "provider_runtime_evidence_ledger_written",
    ],

  } as ProviderRuntimeLedgerAuditAdmissionMaterial;

}


// ============================================================
// P9S AUDIT-ADMISSION RESULT FIXTURES
// ============================================================

function buildAdmittedResult(
  containedFailure:
    boolean = false
): ProviderRuntimeLedgerAuditAdmissionResult {

  const material =
    buildAuditAdmissionMaterial(
      containedFailure
    );

  return {

    auditAdmissionStatus:
      "PROVIDER_RUNTIME_LEDGER_AUDIT_ADMITTED",

    auditAdmissionDecision:
      "ADMIT_PROVIDER_RUNTIME_LEDGER_TO_AUDIT",

    runtimeLedgerAuditAdmissionAttempted:
      true,

    runtimeLedgerAuditAdmitted:
      true,

    runtimeLedgerAuditAdmissionDenied:
      false,

    persistenceId:
      material.persistenceId,

    ledgerEntryId:
      material.ledgerEntryId,

    ledgerSequence:
      material.ledgerSequence,

    persistedAt:
      material.persistedAt,

    certifiedExecutionOutcome:
      material.certifiedExecutionOutcome,

    providerContract:
      material.providerContract,

    providerImplementation:
      material.providerImplementation,

    operation:
      material.operation,

    providerResourceId:
      material.providerResourceId,

    providerConfigurationRef:
      material.providerConfigurationRef,

    providerCredentialRef:
      material.providerCredentialRef,

    executionMetadata:
      material.executionMetadata,

    verificationStatus:
      material.verificationStatus,

    verificationFailureReason:
      material.verificationFailureReason,

    classificationStatus:
      material.classificationStatus,

    runtimeFailureClass:
      material.runtimeFailureClass,

    runtimeFailureSeverity:
      material.runtimeFailureSeverity,

    failureCode:
      material.failureCode,

    providerRawStatus:
      material.providerRawStatus,

    providerRawErrorCode:
      material.providerRawErrorCode,

    providerSanitizedErrorMessage:
      material.providerSanitizedErrorMessage,

    retryable:
      material.retryable,

    recoveryIntakeRequired:
      material.recoveryIntakeRequired,

    recoveryIntakeReady:
      material.recoveryIntakeReady,

    recoveryReason:
      material.recoveryReason,

    runtimeResponse:
      material.runtimeResponse,

    responseExecutionStatus:
      material.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      material.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      material.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      material.runtimeInterventionNotRequired,

    executorFailureContained:
      material.executorFailureContained,

    auditAdmissionMaterial:
      material,

    ledgerWriteSummary: [
      ...material.ledgerWriteSummary,
    ],

    summary: [
      ...material.ledgerWriteSummary,
      "provider_runtime_ledger_integrity_validated",
      "provider_runtime_ledger_audit_admitted",
      material.certifiedExecutionOutcome.toLowerCase(),
    ],

  } as ProviderRuntimeLedgerAuditAdmissionResult;

}


function buildAdmissionDenied():
  ProviderRuntimeLedgerAuditAdmissionResult {

  const base =
    buildAdmittedResult();

  return {

    ...base,

    auditAdmissionStatus:
      "PROVIDER_RUNTIME_LEDGER_AUDIT_ADMISSION_DENIED",

    runtimeLedgerAuditAdmissionAttempted:
      false,

    runtimeLedgerAuditAdmitted:
      false,

    runtimeLedgerAuditAdmissionDenied:
      true,

    auditAdmissionDenialReason:
      "RUNTIME_LEDGER_AUDIT_ADMISSION_NOT_ALLOWED",

    auditAdmissionMaterial:
      undefined,

    summary: [
      "provider_runtime_ledger_audit_admission_denied",
      "runtime_ledger_audit_admission_not_allowed",
    ],

  } as ProviderRuntimeLedgerAuditAdmissionResult;

}


function buildNotAdmitted():
  ProviderRuntimeLedgerAuditAdmissionResult {

  const base =
    buildAdmittedResult();

  return {

    ...base,

    auditAdmissionStatus:
      "PROVIDER_RUNTIME_LEDGER_AUDIT_NOT_ADMITTED",

    runtimeLedgerAuditAdmissionAttempted:
      true,

    runtimeLedgerAuditAdmitted:
      false,

    runtimeLedgerAuditAdmissionDenied:
      false,

    auditAdmissionFailureReason:
      "LEDGER_RESULT_CONTEXT_INCOHERENT",

    auditAdmissionMaterial:
      undefined,

    summary: [
      "provider_runtime_ledger_audit_not_admitted",
      "ledger_result_context_incoherent",
    ],

  } as ProviderRuntimeLedgerAuditAdmissionResult;

}


// ============================================================
// AUDIT EXECUTOR FIXTURES
// ============================================================

function buildCompletedExecutorResult(
  auditFinding:
    ProviderRuntimeAuditFinding =
      "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",
  sequence:
    number = 801
): ProviderRuntimeAuditExecutorResult {

  return {

    executorStatus:
      "PROVIDER_RUNTIME_AUDIT_EXECUTOR_COMPLETED",

    auditExecutionAttempted:
      true,

    auditExecutionCompleted:
      true,

    auditRecordWritten:
      true,

    auditFinding,

    auditReason:
      auditFinding ===
      "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING"
        ? "ledger fact does not satisfy governed audit criteria"
        : undefined,

    auditRecordId:
      `audit-record-${sequence}`,

    auditSequence:
      sequence,

    auditedAt:
      "2026-07-12T13:00:00.000Z",

    executorFailureReason:
      undefined,

    summary: [
      "provider_runtime_audit_executor_completed",
      auditFinding.toLowerCase(),
      "provider_runtime_audit_record_persisted",
    ],

  };

}


function buildFailedExecutorResult():
  ProviderRuntimeAuditExecutorResult {

  return {

    executorStatus:
      "PROVIDER_RUNTIME_AUDIT_EXECUTOR_FAILED",

    auditExecutionAttempted:
      true,

    auditExecutionCompleted:
      false,

    auditRecordWritten:
      false,

    auditFinding:
      undefined,

    auditReason:
      undefined,

    auditRecordId:
      undefined,

    auditSequence:
      undefined,

    auditedAt:
      undefined,

    executorFailureReason:
      "AUDIT_STORAGE_UNAVAILABLE",

    summary: [
      "provider_runtime_audit_executor_failed",
      "audit_storage_unavailable",
    ],

  };

}


function buildInput(
  auditAdmission:
    ProviderRuntimeLedgerAuditAdmissionResult,
  overrides?:
    Partial<ProviderRuntimeAuditExecutionInput>
): ProviderRuntimeAuditExecutionInput {

  return {

    auditAdmission,

    auditExecutionDecision:
      "EXECUTE_PROVIDER_RUNTIME_AUDIT",

    auditExecutor:
      () =>
        buildCompletedExecutorResult(),

    ...overrides,

  };

}


// ============================================================
// SCENARIO 1 — AUDIT EXECUTION REJECTED
// ============================================================

function runAuditExecutionRejectedScenario(): void {

  let executorCalls = 0;

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmittedResult(),
        {

          auditExecutionDecision:
            "REJECT_PROVIDER_RUNTIME_AUDIT_EXECUTION",

          auditExecutor:
            () => {

              executorCalls += 1;

              return buildCompletedExecutorResult();

            },

        }
      )
    );

  assertDenied(
    result,
    "RUNTIME_AUDIT_EXECUTION_NOT_ALLOWED",
    "audit execution rejected"
  );

  assert.equal(
    executorCalls,
    0,
    "audit rejection prevents executor invocation"
  );

  pass("audit execution rejected");
  pass("audit rejection prevents executor invocation");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 2 — P9S AUDIT ADMISSION DENIED
// ============================================================

function runAuditAdmissionDeniedScenario(): void {

  let executorCalls = 0;

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmissionDenied(),
        {

          auditExecutor:
            () => {

              executorCalls += 1;

              return buildCompletedExecutorResult();

            },

        }
      )
    );

  assertDenied(
    result,
    "RUNTIME_LEDGER_AUDIT_ADMISSION_DENIED",
    "P9S audit admission denied"
  );

  assert.equal(
    executorCalls,
    0,
    "P9S denial prevents executor invocation"
  );

  pass("P9S audit admission denial blocks execution");
  pass("P9S admission authority preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — LEDGER FACT NOT ADMITTED
// ============================================================

function runLedgerFactNotAdmittedScenario(): void {

  let executorCalls = 0;

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildNotAdmitted(),
        {

          auditExecutor:
            () => {

              executorCalls += 1;

              return buildCompletedExecutorResult();

            },

        }
      )
    );

  assertNotCompleted(
    result,
    "RUNTIME_LEDGER_NOT_ADMITTED_TO_AUDIT",
    "runtime_ledger_not_admitted_to_audit",
    "ledger fact not admitted"
  );

  assert.equal(
    executorCalls,
    0,
    "not-admitted ledger fact prevents executor invocation"
  );

  pass("not-admitted ledger fact not audited");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 4 — AUDIT-ADMISSION MATERIAL MISSING
// ============================================================

function runAuditAdmissionMaterialMissingScenario(): void {

  const auditAdmission = {

    ...buildAdmittedResult(),

    auditAdmissionMaterial:
      undefined,

  } as ProviderRuntimeLedgerAuditAdmissionResult;

  let executorCalls = 0;

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        auditAdmission,
        {

          auditExecutor:
            () => {

              executorCalls += 1;

              return buildCompletedExecutorResult();

            },

        }
      )
    );

  assertNotCompleted(
    result,
    "AUDIT_ADMISSION_MATERIAL_MISSING",
    "audit_admission_material_missing",
    "audit-admission material missing"
  );

  assert.equal(
    executorCalls,
    0,
    "missing material prevents executor invocation"
  );

  pass("missing audit-admission material rejected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 5 — AUDIT-ADMISSION MATERIAL INCOHERENT
// ============================================================

function runAuditAdmissionMaterialIncoherentScenario(): void {

  const auditAdmission =
    buildAdmittedResult();

  const incoherentAdmission = {

    ...auditAdmission,

    auditAdmissionMaterial: {

      ...auditAdmission.auditAdmissionMaterial!,

      ledgerEntryId:
        "ledger-other-runtime",

    },

  } as ProviderRuntimeLedgerAuditAdmissionResult;

  let executorCalls = 0;

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        incoherentAdmission,
        {

          auditExecutor:
            () => {

              executorCalls += 1;

              return buildCompletedExecutorResult();

            },

        }
      )
    );

  assertNotCompleted(
    result,
    "AUDIT_ADMISSION_MATERIAL_INCOHERENT",
    "audit_admission_material_incoherent",
    "audit-admission material incoherent"
  );

  assert.equal(
    executorCalls,
    0,
    "incoherent material prevents executor invocation"
  );

  pass("audit-admission material coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 6 — AUDIT EXECUTOR MISSING
// ============================================================

function runAuditExecutorMissingScenario(): void {

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmittedResult(),
        {

          auditExecutor:
            undefined,

        }
      )
    );

  assertNotCompleted(
    result,
    "AUDIT_EXECUTOR_MISSING",
    "audit_executor_missing",
    "audit executor missing"
  );

  pass("governed audit executor required");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 7 — AUDIT EXECUTOR THROWS
// ============================================================

function runAuditExecutorThrowsScenario(): void {

  let executorCalls = 0;

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmittedResult(),
        {

          auditExecutor:
            () => {

              executorCalls += 1;

              throw new Error(
                "audit transport unavailable"
              );

            },

        }
      )
    );

  assertNotCompleted(
    result,
    "AUDIT_EXECUTOR_FAILED",
    "audit_executor_failed",
    "audit executor throws"
  );

  assert.equal(
    executorCalls,
    1,
    "throwing executor invoked exactly once"
  );

  assert(
    result.auditExecutorSummary?.includes(
      "provider_runtime_audit_executor_threw"
    ),
    "executor exception summary preserved"
  );

  pass("audit executor exception contained");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 8 — COHERENT EXECUTOR FAILURE
// ============================================================

function runExecutorFailureScenario(): void {

  let executorCalls = 0;

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmittedResult(),
        {

          auditExecutor:
            () => {

              executorCalls += 1;

              return buildFailedExecutorResult();

            },

        }
      )
    );

  assertNotCompleted(
    result,
    "AUDIT_EXECUTOR_FAILED",
    "audit_executor_failed",
    "audit executor failure"
  );

  assert.equal(
    executorCalls,
    1,
    "failed executor invoked exactly once"
  );

  assert(
    result.auditExecutorSummary?.includes(
      "provider_runtime_audit_executor_failed"
    ),
    "executor failure summary preserved"
  );

  pass("audit executor failure contained");
  pass("audit executor failure does not claim record write");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 9 — INCOHERENT FAILED EXECUTOR RESULT
// ============================================================

function runIncoherentFailedExecutorResultScenario(): void {

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmittedResult(),
        {

          auditExecutor:
            () => ({

              ...buildFailedExecutorResult(),

              auditExecutionCompleted:
                true,

              auditRecordId:
                "must-not-exist",

            }),

        }
      )
    );

  assertNotCompleted(
    result,
    "AUDIT_EXECUTOR_RESULT_INCOHERENT",
    "audit_executor_result_incoherent",
    "incoherent failed executor result"
  );

  pass("incoherent failed executor result rejected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 10 — AUDIT COMPLETED BUT RECORD NOT WRITTEN
// ============================================================

function runAuditRecordNotWrittenScenario(): void {

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmittedResult(),
        {

          auditExecutor:
            () => ({

              ...buildCompletedExecutorResult(),

              auditRecordWritten:
                false,

            }),

        }
      )
    );

  assertNotCompleted(
    result,
    "AUDIT_RECORD_NOT_WRITTEN",
    "audit_record_not_written",
    "audit completed without record write"
  );

  pass("audit execution without record write rejected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 11 — INCOHERENT COMPLETED EXECUTOR RESULTS
// ============================================================

function runIncoherentCompletedExecutorResultScenarios(): void {

  const cases: Array<{

    label:
      string;

    result:
      ProviderRuntimeAuditExecutorResult;

  }> = [

    {

      label:
        "completed executor without attempt",

      result: {

        ...buildCompletedExecutorResult(),

        auditExecutionAttempted:
          false,

      },

    },

    {

      label:
        "completed executor without completion",

      result: {

        ...buildCompletedExecutorResult(),

        auditExecutionCompleted:
          false,

      },

    },

    {

      label:
        "completed executor without finding",

      result: {

        ...buildCompletedExecutorResult(),

        auditFinding:
          undefined,

      },

    },

    {

      label:
        "completed executor without audit-record id",

      result: {

        ...buildCompletedExecutorResult(),

        auditRecordId:
          undefined,

      },

    },

    {

      label:
        "completed executor with invalid audit sequence",

      result: {

        ...buildCompletedExecutorResult(),

        auditSequence:
          0,

      },

    },

    {

      label:
        "completed executor without audit timestamp",

      result: {

        ...buildCompletedExecutorResult(),

        auditedAt:
          undefined,

      },

    },

    {

      label:
        "completed executor with failure reason",

      result: {

        ...buildCompletedExecutorResult(),

        executorFailureReason:
          "IMPOSSIBLE_COMPLETED_FAILURE",

      },

    },

    {

      label:
        "completed executor without summary",

      result: {

        ...buildCompletedExecutorResult(),

        summary:
          [],

      },

    },

  ];

  for (const testCase of cases) {

    const result =
      executeProviderRuntimeAudit(
        buildInput(
          buildAdmittedResult(),
          {

            auditExecutor:
              () =>
                testCase.result,

          }
        )
      );

    assertNotCompleted(
      result,
      "AUDIT_EXECUTOR_RESULT_INCOHERENT",
      "audit_executor_result_incoherent",
      testCase.label
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("incoherent completed executor results rejected");

}


// ============================================================
// SCENARIO 12 — CONFIRMED FINDING
// ============================================================

function runConfirmedFindingScenario(): void {

  let executorCalls = 0;

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmittedResult(),
        {

          auditExecutor:
            () => {

              executorCalls += 1;

              return buildCompletedExecutorResult(
                "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",
                901
              );

            },

        }
      )
    );

  assertCompleted(
    result,
    "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",
    "confirmed finding"
  );

  assert.equal(
    result.auditReason,
    undefined,
    "confirmed finding does not require audit reason"
  );

  assert.equal(
    executorCalls,
    1,
    "confirmed audit invokes executor exactly once"
  );

  pass("confirmed audit finding written");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 13 — NONCONFORMING FINDING
// ============================================================

function runNonconformingFindingScenario(): void {

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmittedResult(
          true
        ),
        {

          auditExecutor:
            () =>
              buildCompletedExecutorResult(
                "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING",
                902
              ),

        }
      )
    );

  assertCompleted(
    result,
    "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING",
    "nonconforming finding"
  );

  assert.equal(
    typeof result.auditReason,
    "string",
    "nonconforming finding reason preserved"
  );

  assert.equal(
    result.auditExecutionFailureReason,
    undefined,
    "nonconforming finding is not executor failure"
  );

  pass("nonconforming audit finding written");
  pass("nonconforming finding remains completed audit");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 14 — NONCONFORMING FINDING WITHOUT REASON
// ============================================================

function runNonconformingFindingWithoutReasonScenario(): void {

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmittedResult(),
        {

          auditExecutor:
            () => ({

              ...buildCompletedExecutorResult(
                "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING"
              ),

              auditReason:
                undefined,

            }),

        }
      )
    );

  assertNotCompleted(
    result,
    "AUDIT_EXECUTOR_RESULT_INCOHERENT",
    "audit_executor_result_incoherent",
    "nonconforming finding without reason"
  );

  pass("nonconforming finding requires audit reason");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 15 — EXACTLY ONE EXECUTOR INVOCATION
// ============================================================

function runExactlyOneExecutorInvocationCheck(): void {

  let executorCalls = 0;

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmittedResult(),
        {

          auditExecutor:
            () => {

              executorCalls += 1;

              return buildCompletedExecutorResult(
                "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",
                903
              );

            },

        }
      )
    );

  assertCompleted(
    result,
    "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",
    "exactly one executor invocation"
  );

  assert.equal(
    executorCalls,
    1,
    "governed audit executor invoked exactly once"
  );

  pass("exactly one governed audit executor invocation verified");

}


// ============================================================
// SCENARIOS 16–18 — AUDIT RECORD COMPOSITION / IMMUTABILITY
// ============================================================

function runAuditRecordCompositionChecks(): void {

  const auditAdmission =
    buildAdmittedResult(
      true
    );

  const material =
    auditAdmission.auditAdmissionMaterial!;

  const responseDecisionSummaryBefore = [
    ...material.responseDecisionSummary,
  ];

  const executorSummaryBefore = [
    ...(material.executorSummary ?? []),
  ];

  const responseExecutionSummaryBefore = [
    ...material.responseExecutionSummary,
  ];

  const certificationSummaryBefore = [
    ...material.certificationSummary,
  ];

  const ledgerWriteSummaryBefore = [
    ...material.ledgerWriteSummary,
  ];

  const auditAdmissionSummaryBefore = [
    ...auditAdmission.summary,
  ];

  let receivedMaterial:
    ProviderRuntimeLedgerAuditAdmissionMaterial | undefined;

  const executor:
    ProviderRuntimeAuditExecutor =
      (
        input:
          ProviderRuntimeAuditExecutorInput
      ) => {

        receivedMaterial =
          input.auditAdmissionMaterial;

        return buildCompletedExecutorResult(
          "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING",
          904
        );

      };

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        auditAdmission,
        {

          auditExecutor:
            executor,

        }
      )
    );

  assertCompleted(
    result,
    "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING",
    "audit record composition"
  );

  assert.equal(
    receivedMaterial,
    material,
    "executor receives admitted P9S material"
  );

  const auditRecord:
    ProviderRuntimeAuditRecord =
      result.auditRecord!;

  assert.equal(
    auditRecord.auditRecordType,
    "PROVIDER_RUNTIME_LEDGER_FACT_AUDIT",
    "canonical audit-record type preserved"
  );

  assert.equal(
    auditRecord.auditRecordVersion,
    "P9T.1",
    "canonical audit-record version preserved"
  );

  assert.equal(
    auditRecord.auditFinding,
    result.auditFinding,
    "audit finding preserved"
  );

  assert.equal(
    auditRecord.auditReason,
    result.auditReason,
    "audit reason preserved"
  );

  assert.equal(
    auditRecord.persistenceId,
    material.persistenceId,
    "persistence identifier preserved"
  );

  assert.equal(
    auditRecord.ledgerEntryId,
    material.ledgerEntryId,
    "ledger-entry identifier preserved"
  );

  assert.equal(
    auditRecord.ledgerSequence,
    material.ledgerSequence,
    "ledger sequence preserved"
  );

  assert.equal(
    auditRecord.persistedAt,
    material.persistedAt,
    "persistence timestamp preserved"
  );

  assert.equal(
    auditRecord.certifiedExecutionOutcome,
    material.certifiedExecutionOutcome,
    "P9P certified outcome preserved"
  );

  assert.equal(
    auditRecord.providerContract,
    material.providerContract,
    "provider contract preserved"
  );

  assert.equal(
    auditRecord.providerImplementation,
    material.providerImplementation,
    "provider implementation preserved"
  );

  assert.equal(
    auditRecord.operation,
    material.operation,
    "operation preserved"
  );

  assert.equal(
    auditRecord.runtimeResponse,
    material.runtimeResponse,
    "P9N selected response preserved"
  );

  assert.equal(
    auditRecord.responseExecutionStatus,
    material.responseExecutionStatus,
    "P9O execution state preserved"
  );

  assert.equal(
    auditRecord.executorFailureContained,
    material.executorFailureContained,
    "contained-failure posture preserved"
  );

  assert.deepEqual(
    auditRecord.responseDecisionSummary,
    responseDecisionSummaryBefore,
    "response-decision summary copied"
  );

  assert.deepEqual(
    auditRecord.executorSummary,
    executorSummaryBefore,
    "executor summary copied"
  );

  assert.deepEqual(
    auditRecord.responseExecutionSummary,
    responseExecutionSummaryBefore,
    "response-execution summary copied"
  );

  assert.deepEqual(
    auditRecord.certificationSummary,
    certificationSummaryBefore,
    "certification summary copied"
  );

  assert.deepEqual(
    auditRecord.ledgerWriteSummary,
    ledgerWriteSummaryBefore,
    "ledger-write summary copied"
  );

  assert.deepEqual(
    auditRecord.auditAdmissionSummary,
    auditAdmissionSummaryBefore,
    "audit-admission summary copied"
  );

  assert.notEqual(
    auditRecord.responseDecisionSummary,
    material.responseDecisionSummary,
    "response-decision summary copied defensively"
  );

  assert.notEqual(
    auditRecord.executorSummary,
    material.executorSummary,
    "executor summary copied defensively"
  );

  assert.notEqual(
    auditRecord.responseExecutionSummary,
    material.responseExecutionSummary,
    "response-execution summary copied defensively"
  );

  assert.notEqual(
    auditRecord.certificationSummary,
    material.certificationSummary,
    "certification summary copied defensively"
  );

  assert.notEqual(
    auditRecord.ledgerWriteSummary,
    material.ledgerWriteSummary,
    "ledger-write summary copied defensively"
  );

  assert.notEqual(
    auditRecord.auditAdmissionSummary,
    auditAdmission.summary,
    "audit-admission summary copied defensively"
  );

  auditRecord.responseDecisionSummary.push(
    "audit_record_mutation_probe"
  );

  auditRecord.executorSummary?.push(
    "audit_record_mutation_probe"
  );

  auditRecord.responseExecutionSummary.push(
    "audit_record_mutation_probe"
  );

  auditRecord.certificationSummary.push(
    "audit_record_mutation_probe"
  );

  auditRecord.ledgerWriteSummary.push(
    "audit_record_mutation_probe"
  );

  auditRecord.auditAdmissionSummary.push(
    "audit_record_mutation_probe"
  );

  assert.deepEqual(
    material.responseDecisionSummary,
    responseDecisionSummaryBefore,
    "source response-decision summary not mutated"
  );

  assert.deepEqual(
    material.executorSummary,
    executorSummaryBefore,
    "source executor summary not mutated"
  );

  assert.deepEqual(
    material.responseExecutionSummary,
    responseExecutionSummaryBefore,
    "source response-execution summary not mutated"
  );

  assert.deepEqual(
    material.certificationSummary,
    certificationSummaryBefore,
    "source certification summary not mutated"
  );

  assert.deepEqual(
    material.ledgerWriteSummary,
    ledgerWriteSummaryBefore,
    "source ledger-write summary not mutated"
  );

  assert.deepEqual(
    auditAdmission.summary,
    auditAdmissionSummaryBefore,
    "source audit-admission summary not mutated"
  );

  pass("canonical audit-record composition verified");
  pass("defensive audit-record summary copying verified");
  pass("P9S audit-admission result immutability verified");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 19 — DURABLE AUDIT IDENTIFIER PROPAGATION
// ============================================================

function runDurableAuditIdentifierPropagationChecks(): void {

  const executorResult:
    ProviderRuntimeAuditExecutorResult = {

      executorStatus:
        "PROVIDER_RUNTIME_AUDIT_EXECUTOR_COMPLETED",

      auditExecutionAttempted:
        true,

      auditExecutionCompleted:
        true,

      auditRecordWritten:
        true,

      auditFinding:
        "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",

      auditReason:
        undefined,

      auditRecordId:
        "audit-record-explicit-001",

      auditSequence:
        9901,

      auditedAt:
        "2026-07-12T14:34:56.789Z",

      executorFailureReason:
        undefined,

      summary: [
        "provider_runtime_audit_executor_completed",
        "explicit_audit_identifiers_assigned",
      ],

    };

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        buildAdmittedResult(),
        {

          auditExecutor:
            () =>
              executorResult,

        }
      )
    );

  assertCompleted(
    result,
    "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",
    "durable audit identifier propagation"
  );

  assert.equal(
    result.auditRecordId,
    executorResult.auditRecordId,
    "audit-record identifier propagated from executor"
  );

  assert.equal(
    result.auditSequence,
    executorResult.auditSequence,
    "audit sequence propagated from executor"
  );

  assert.equal(
    result.auditedAt,
    executorResult.auditedAt,
    "audit timestamp propagated from executor"
  );

  assert.deepEqual(
    result.auditExecutorSummary,
    executorResult.summary,
    "audit executor summary propagated"
  );

  pass("durable audit identifiers propagated");

}


// ============================================================
// SCENARIO 20 — LINEAGE PROPAGATION
// ============================================================

function runLineagePropagationChecks(): void {

  const auditAdmission =
    buildAdmittedResult(
      true
    );

  const result =
    executeProviderRuntimeAudit(
      buildInput(
        auditAdmission,
        {

          auditExecutor:
            () =>
              buildCompletedExecutorResult(
                "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",
                905
              ),

        }
      )
    );

  assertCompleted(
    result,
    "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED",
    "lineage propagation"
  );

  assert.equal(
    result.persistenceId,
    auditAdmission.persistenceId,
    "persistenceId propagated"
  );

  assert.equal(
    result.ledgerEntryId,
    auditAdmission.ledgerEntryId,
    "ledgerEntryId propagated"
  );

  assert.equal(
    result.ledgerSequence,
    auditAdmission.ledgerSequence,
    "ledgerSequence propagated"
  );

  assert.equal(
    result.persistedAt,
    auditAdmission.persistedAt,
    "persistedAt propagated"
  );

  assert.equal(
    result.certifiedExecutionOutcome,
    auditAdmission.certifiedExecutionOutcome,
    "certifiedExecutionOutcome propagated"
  );

  assert.equal(
    result.providerContract,
    auditAdmission.providerContract,
    "providerContract propagated"
  );

  assert.equal(
    result.providerImplementation,
    auditAdmission.providerImplementation,
    "providerImplementation propagated"
  );

  assert.equal(
    result.operation,
    auditAdmission.operation,
    "operation propagated"
  );

  assert.equal(
    result.providerResourceId,
    auditAdmission.providerResourceId,
    "providerResourceId propagated"
  );

  assert.deepEqual(
    result.executionMetadata,
    auditAdmission.executionMetadata,
    "executionMetadata propagated"
  );

  assert.equal(
    result.verificationStatus,
    auditAdmission.verificationStatus,
    "verificationStatus propagated"
  );

  assert.equal(
    result.classificationStatus,
    auditAdmission.classificationStatus,
    "classificationStatus propagated"
  );

  assert.equal(
    result.runtimeFailureClass,
    auditAdmission.runtimeFailureClass,
    "runtimeFailureClass propagated"
  );

  assert.equal(
    result.runtimeResponse,
    auditAdmission.runtimeResponse,
    "runtimeResponse propagated"
  );

  assert.equal(
    result.responseExecutionStatus,
    auditAdmission.responseExecutionStatus,
    "responseExecutionStatus propagated"
  );

  assert.equal(
    result.runtimeResponseExecutionAttempted,
    auditAdmission.runtimeResponseExecutionAttempted,
    "runtimeResponseExecutionAttempted propagated"
  );

  assert.equal(
    result.runtimeResponseExecuted,
    auditAdmission.runtimeResponseExecuted,
    "runtimeResponseExecuted propagated"
  );

  assert.equal(
    result.runtimeInterventionNotRequired,
    auditAdmission.runtimeInterventionNotRequired,
    "runtimeInterventionNotRequired propagated"
  );

  assert.equal(
    result.executorFailureContained,
    auditAdmission.executorFailureContained,
    "executorFailureContained propagated"
  );

  assert.deepEqual(
    result.auditAdmissionSummary,
    auditAdmission.summary,
    "auditAdmissionSummary propagated"
  );

  assert.notEqual(
    result.auditAdmissionSummary,
    auditAdmission.summary,
    "auditAdmissionSummary copied defensively"
  );

  pass("provider/runtime context propagated");
  pass("P9L/P9M/P9N/P9O/P9P/P9Q/P9R/P9S lineage propagated");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 21 — BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const results:
    ProviderRuntimeAuditExecutionResult[] = [

      executeProviderRuntimeAudit(
        buildInput(
          buildAdmittedResult()
        )
      ),

      executeProviderRuntimeAudit(
        buildInput(
          buildAdmittedResult(
            true
          ),
          {

            auditExecutor:
              () =>
                buildCompletedExecutorResult(
                  "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING"
                ),

          }
        )
      ),

      executeProviderRuntimeAudit(
        buildInput(
          buildAdmissionDenied()
        )
      ),

      executeProviderRuntimeAudit(
        buildInput(
          buildNotAdmitted()
        )
      ),

      executeProviderRuntimeAudit(
        buildInput(
          buildAdmittedResult(),
          {

            auditExecutor:
              () =>
                buildFailedExecutorResult(),

          }
        )
      ),

      executeProviderRuntimeAudit(
        buildInput(
          buildAdmittedResult(),
          {

            auditExecutionDecision:
              "REJECT_PROVIDER_RUNTIME_AUDIT_EXECUTION",

          }
        )
      ),

  ];

  for (const result of results) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("P9T audit-execution boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runAuditExecutionRejectedScenario();

  runAuditAdmissionDeniedScenario();

  runLedgerFactNotAdmittedScenario();

  runAuditAdmissionMaterialMissingScenario();

  runAuditAdmissionMaterialIncoherentScenario();

  runAuditExecutorMissingScenario();

  runAuditExecutorThrowsScenario();

  runExecutorFailureScenario();

  runIncoherentFailedExecutorResultScenario();

  runAuditRecordNotWrittenScenario();

  runIncoherentCompletedExecutorResultScenarios();

  runConfirmedFindingScenario();

  runNonconformingFindingScenario();

  runNonconformingFindingWithoutReasonScenario();

  runExactlyOneExecutorInvocationCheck();

  runAuditRecordCompositionChecks();

  runDurableAuditIdentifierPropagationChecks();

  runLineagePropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9T PROVIDER RUNTIME AUDIT EXECUTION");
  console.log("========================================");
  console.log("");

  console.log("Audit Execution Gates:");
  console.log("✓ audit execution rejected → DENIED");
  console.log("✓ P9S audit admission denied → DENIED");
  console.log("✓ ledger fact not admitted → NOT_COMPLETED");
  console.log("✓ denied and not-completed states remain distinct");

  console.log("");
  console.log("Audit Admission Requirements:");
  console.log("✓ audit-admission material required");
  console.log("✓ audit-admission material coherence required");
  console.log("✓ incoherent material never reaches executor");

  console.log("");
  console.log("Governed Audit Executor:");
  console.log("✓ governed audit executor required");
  console.log("✓ exactly one audit executor invocation");
  console.log("✓ executor exception contained");
  console.log("✓ executor failure contained");
  console.log("✓ incoherent failed result rejected");
  console.log("✓ incoherent completed result rejected");
  console.log("✓ completed audit requires written audit record");
  console.log("✓ executor failure never claims audit completion");

  console.log("");
  console.log("Audit Findings:");
  console.log("✓ confirmed ledger fact");
  console.log("✓ nonconforming ledger fact");
  console.log("✓ nonconforming finding requires reason");
  console.log("✓ nonconforming finding is not executor failure");

  console.log("");
  console.log("Canonical Audit Record:");
  console.log("✓ record type PROVIDER_RUNTIME_LEDGER_FACT_AUDIT");
  console.log("✓ record version P9T.1");
  console.log("✓ durable ledger identity preserved");
  console.log("✓ provider/runtime context preserved");
  console.log("✓ P9L verification context preserved");
  console.log("✓ P9M classification context preserved");
  console.log("✓ P9N selected response preserved");
  console.log("✓ P9O execution state preserved");
  console.log("✓ P9P certified outcome preserved");
  console.log("✓ P9Q evidence admission preserved");
  console.log("✓ P9R ledger write preserved");
  console.log("✓ P9S audit admission preserved");
  console.log("✓ summaries copied defensively");
  console.log("✓ source audit-admission result not mutated");

  console.log("");
  console.log("Durable Audit Claims:");
  console.log("✓ audit executed only after coherent executor completion");
  console.log("✓ audit record written only after coherent executor completion");
  console.log("✓ audit-record identifier propagated from executor");
  console.log("✓ audit sequence propagated from executor");
  console.log("✓ audit timestamp propagated from executor");
  console.log("✓ audit identifiers are never manufactured");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime verification");
  console.log("✓ no runtime failure classification");
  console.log("✓ no runtime response decision");
  console.log("✓ no runtime response execution");
  console.log("✓ no governed response executor invocation");
  console.log("✓ no execution-outcome certification");
  console.log("✓ no evidence admission");
  console.log("✓ no runtime-evidence persistence");
  console.log("✓ no provider-runtime ledger write");
  console.log("✓ no ledger audit admission");
  console.log("✓ no provider API / SDK calls");
  console.log("✓ no provider-error re-sanitization");
  console.log("✓ no sanitized failure-surface alteration");
  console.log("✓ no response replacement");
  console.log("✓ no P9O/P9P/P9Q/P9R/P9S result alteration");
  console.log("✓ no ledger-history verification");
  console.log("✓ no chain-continuity verification");
  console.log("✓ no cryptographic-proof verification");

  console.log("");
  console.log("========================================");
  console.log("P9T.1 PROVIDER RUNTIME AUDIT EXECUTION VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();