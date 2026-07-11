// ============================================================
// PlannerAgent — Provider Runtime Evidence Persistence / Ledger Write Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9R.provider.runtime.evidence.persistence.ledger.write.runner.ts
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
// P9R.1 — Provider Runtime Evidence Persistence / Ledger Write Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9R.1 governed persistence and
// canonical ledger-write contract.
//
// This runner verifies:
//
// 1. write decision rejected
// 2. P9Q admission denied
// 3. P9Q evidence not admitted
// 4. admission material missing
// 5. admission material incoherent
// 6. governed ledger writer missing
// 7. ledger writer throws
// 8. coherent writer-reported failure
// 9. incoherent failed writer result
// 10. incoherent completed writer result
// 11. all successful certified outcomes written
// 12. all contained-failure certified outcomes written
// 13. exactly one governed writer invocation
// 14. canonical ledger-entry composition
// 15. defensive summary copying
// 16. source immutability
// 17. durable identifier propagation
// 18. P9L/P9M/P9N/P9O/P9P/P9Q lineage propagation
// 19. boundary verification
//
// P9R persists only P9Q-admitted evidence.
//
// P9R does not verify, classify, decide,
// execute, certify, admit, or audit.
//
// ============================================================

import assert from "node:assert/strict";

import {
  writeProviderRuntimeEvidenceToLedger,
} from "../P9R.provider.runtime.evidence.persistence.ledger.write";

import type {
  ProviderRuntimeEvidenceLedgerEntry,
  ProviderRuntimeEvidenceLedgerWriteInput,
  ProviderRuntimeEvidenceLedgerWriteResult,
  ProviderRuntimeEvidenceLedgerWriter,
  ProviderRuntimeEvidenceLedgerWriterInput,
  ProviderRuntimeEvidenceLedgerWriterResult,
} from "../P9R.provider.runtime.evidence.persistence.ledger.write";

import type {
  ProviderRuntimeEvidenceLedgerAdmissionMaterial,
  ProviderRuntimeEvidenceLedgerAdmissionResult,
} from "../P9Q.provider.runtime.evidence.persistence.ledger.admission";

import type {
  ProviderRuntimeCertifiedExecutionOutcome,
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

    "runtimeVerifiedByLedgerWrite",

    "runtimeFailureClassifiedByLedgerWrite",

    "runtimeResponseDecidedByLedgerWrite",

    "runtimeResponseExecutedByLedgerWrite",

    "executionOutcomeCertifiedByLedgerWrite",

    "runtimeEvidenceAdmittedByLedgerWrite",

    "governedExecutorInvoked",

    "providerSdkCalled",

    "providerApiCalled",

    "providerExecutionInvoked",

    "providerErrorResanitized",

    "sanitizedFailureSurfaceAltered",

    "runtimeResponseReplaced",

    "executionResultAltered",

    "certificationResultAltered",

    "admissionResultAltered",

    "persistenceIdManufactured",

    "ledgerEntryIdManufactured",

    "ledgerSequenceManufactured",

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


function assertDenied(
  result:
    ProviderRuntimeEvidenceLedgerWriteResult,
  expectedReason:
    ProviderRuntimeEvidenceLedgerWriteResult["writeDenialReason"],
  label:
    string
): void {

  assert.equal(
    result.writeStatus,
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITE_DENIED",
    `${label} write status`
  );

  assert.equal(
    result.runtimeEvidenceLedgerWriteAttempted,
    false,
    `${label} write not attempted`
  );

  assert.equal(
    result.runtimeEvidencePersisted,
    false,
    `${label} evidence not persisted`
  );

  assert.equal(
    result.runtimeEvidenceLedgerWritten,
    false,
    `${label} ledger not written`
  );

  assert.equal(
    result.runtimeEvidenceLedgerWriteDenied,
    true,
    `${label} denial flag preserved`
  );

  assert.equal(
    result.writeDenialReason,
    expectedReason,
    `${label} denial reason preserved`
  );

  assert.equal(
    result.writeFailureReason,
    undefined,
    `${label} exposes no failure reason`
  );

  assert.equal(
    result.ledgerEntry,
    undefined,
    `${label} exposes no canonical ledger entry`
  );

  assert.equal(
    result.persistenceId,
    undefined,
    `${label} exposes no persistence identifier`
  );

  assert.equal(
    result.ledgerEntryId,
    undefined,
    `${label} exposes no ledger-entry identifier`
  );

  assert.equal(
    result.ledgerSequence,
    undefined,
    `${label} exposes no ledger sequence`
  );

  assert.equal(
    result.persistedAt,
    undefined,
    `${label} exposes no persistence timestamp`
  );

}


function assertNotWritten(
  result:
    ProviderRuntimeEvidenceLedgerWriteResult,
  expectedReason:
    ProviderRuntimeEvidenceLedgerWriteResult["writeFailureReason"],
  summaryToken:
    string,
  label:
    string
): void {

  assert.equal(
    result.writeStatus,
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_WRITTEN",
    `${label} not-written status`
  );

  assert.equal(
    result.runtimeEvidenceLedgerWriteAttempted,
    true,
    `${label} write attempted`
  );

  assert.equal(
    result.runtimeEvidencePersisted,
    false,
    `${label} evidence not persisted`
  );

  assert.equal(
    result.runtimeEvidenceLedgerWritten,
    false,
    `${label} ledger not written`
  );

  assert.equal(
    result.runtimeEvidenceLedgerWriteDenied,
    false,
    `${label} is not write denial`
  );

  assert.equal(
    result.writeFailureReason,
    expectedReason,
    `${label} failure reason preserved`
  );

  assert.equal(
    result.writeDenialReason,
    undefined,
    `${label} exposes no denial reason`
  );

  assert.equal(
    result.persistenceId,
    undefined,
    `${label} exposes no persistence identifier`
  );

  assert.equal(
    result.ledgerEntryId,
    undefined,
    `${label} exposes no ledger-entry identifier`
  );

  assert.equal(
    result.ledgerSequence,
    undefined,
    `${label} exposes no ledger sequence`
  );

  assert.equal(
    result.persistedAt,
    undefined,
    `${label} exposes no persistence timestamp`
  );

  assert(
    result.summary.includes(
      summaryToken
    ),
    `${label} summary token preserved`
  );

}


function assertWritten(
  result:
    ProviderRuntimeEvidenceLedgerWriteResult,
  expectedOutcome:
    ProviderRuntimeCertifiedExecutionOutcome,
  label:
    string
): void {

  assert.equal(
    result.writeStatus,
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITTEN",
    `${label} written status`
  );

  assert.equal(
    result.runtimeEvidenceLedgerWriteAttempted,
    true,
    `${label} write attempted`
  );

  assert.equal(
    result.runtimeEvidencePersisted,
    true,
    `${label} evidence persisted`
  );

  assert.equal(
    result.runtimeEvidenceLedgerWritten,
    true,
    `${label} ledger written`
  );

  assert.equal(
    result.runtimeEvidenceLedgerWriteDenied,
    false,
    `${label} write not denied`
  );

  assert.equal(
    result.writeDenialReason,
    undefined,
    `${label} exposes no denial reason`
  );

  assert.equal(
    result.writeFailureReason,
    undefined,
    `${label} exposes no failure reason`
  );

  assert.equal(
    result.certifiedExecutionOutcome,
    expectedOutcome,
    `${label} certified outcome preserved`
  );

  assert(
    result.ledgerEntry,
    `${label} canonical ledger entry exposed`
  );

  assert.equal(
    result.ledgerEntry?.certifiedExecutionOutcome,
    expectedOutcome,
    `${label} ledger-entry outcome preserved`
  );

  assert.equal(
    typeof result.persistenceId,
    "string",
    `${label} persistence identifier exposed`
  );

  assert.equal(
    typeof result.ledgerEntryId,
    "string",
    `${label} ledger-entry identifier exposed`
  );

  assert.equal(
    typeof result.ledgerSequence,
    "number",
    `${label} ledger sequence exposed`
  );

  assert.equal(
    typeof result.persistedAt,
    "string",
    `${label} persistence timestamp exposed`
  );

  assert(
    result.summary.includes(
      "provider_runtime_evidence_persisted"
    ),
    `${label} persistence summary preserved`
  );

  assert(
    result.summary.includes(
      "provider_runtime_evidence_ledger_written"
    ),
    `${label} ledger-write summary preserved`
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
  "kms-key-runtime-ledger-write";

const providerConfigurationRef =
  "cfg/aws-kms-prod";

const providerCredentialRef =
  "cred/aws-kms-prod";

const executionMetadata = {

  tenantId:
    "tenant-001",

  runtimeBatchId:
    "runtime-ledger-write-001",

};


// ============================================================
// OUTCOME SUPPORT
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
// P9Q ADMISSION FIXTURES
// ============================================================

function buildAdmissionMaterial(
  certifiedExecutionOutcome:
    ProviderRuntimeCertifiedExecutionOutcome
): ProviderRuntimeEvidenceLedgerAdmissionMaterial {

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

  return {

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

    runtimeInterventionNotRequired:
      runtimeResponse === "NO_ACTION",

    executorFailureContained,

    responseDecisionSummary,

    executorSummary,

    responseExecutionSummary,

    certificationSummary,

  } as ProviderRuntimeEvidenceLedgerAdmissionMaterial;

}


function buildAdmittedResult(
  certifiedExecutionOutcome:
    ProviderRuntimeCertifiedExecutionOutcome
): ProviderRuntimeEvidenceLedgerAdmissionResult {

  const material =
    buildAdmissionMaterial(
      certifiedExecutionOutcome
    );

  return {

    admissionStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMITTED",

    admissionDecision:
      "ADMIT_PROVIDER_RUNTIME_EVIDENCE_TO_LEDGER",

    runtimeEvidenceLedgerAdmissionAttempted:
      true,

    runtimeEvidenceLedgerAdmitted:
      true,

    runtimeEvidenceLedgerAdmissionDenied:
      false,

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

    ledgerAdmissionMaterial:
      material,

    certificationSummary: [
      ...material.certificationSummary,
    ],

    summary: [
      ...material.certificationSummary,
      "provider_runtime_evidence_ledger_admitted",
      certifiedExecutionOutcome.toLowerCase(),
    ],

  } as unknown as ProviderRuntimeEvidenceLedgerAdmissionResult;

}


function buildAdmissionDenied():
  ProviderRuntimeEvidenceLedgerAdmissionResult {

  const base =
    buildAdmittedResult(
      "RETRY_COMPLETED"
    );

  return {

    ...base,

    admissionStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION_DENIED",

    runtimeEvidenceLedgerAdmissionAttempted:
      false,

    runtimeEvidenceLedgerAdmitted:
      false,

    runtimeEvidenceLedgerAdmissionDenied:
      true,

    admissionDenialReason:
      "RUNTIME_EVIDENCE_LEDGER_ADMISSION_NOT_ALLOWED",

    ledgerAdmissionMaterial:
      undefined,

    summary: [
      "provider_runtime_evidence_ledger_admission_denied",
      "runtime_evidence_ledger_admission_not_allowed",
    ],

  } as unknown as ProviderRuntimeEvidenceLedgerAdmissionResult;

}


function buildNotAdmitted():
  ProviderRuntimeEvidenceLedgerAdmissionResult {

  const base =
    buildAdmittedResult(
      "RETRY_COMPLETED"
    );

  return {

    ...base,

    admissionStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_ADMITTED",

    runtimeEvidenceLedgerAdmissionAttempted:
      true,

    runtimeEvidenceLedgerAdmitted:
      false,

    runtimeEvidenceLedgerAdmissionDenied:
      false,

    admissionFailureReason:
      "CANONICAL_EXECUTION_EVIDENCE_INVALID",

    ledgerAdmissionMaterial:
      undefined,

    summary: [
      "provider_runtime_evidence_ledger_not_admitted",
      "canonical_execution_evidence_invalid",
    ],

  } as unknown as ProviderRuntimeEvidenceLedgerAdmissionResult;

}


// ============================================================
// WRITER FIXTURES
// ============================================================

function buildCompletedWriterResult(
  sequence:
    number = 41
): ProviderRuntimeEvidenceLedgerWriterResult {

  return {

    writerStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITER_COMPLETED",

    writerAttempted:
      true,

    writerCompleted:
      true,

    persistenceId:
      `persist-runtime-${sequence}`,

    ledgerEntryId:
      `ledger-runtime-${sequence}`,

    ledgerSequence:
      sequence,

    persistedAt:
      "2026-07-12T00:00:00.000Z",

    summary: [
      "provider_runtime_evidence_ledger_writer_completed",
      "provider_runtime_evidence_persisted",
      "provider_runtime_ledger_entry_written",
    ],

  };

}


function buildFailedWriterResult():
  ProviderRuntimeEvidenceLedgerWriterResult {

  return {

    writerStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITER_FAILED",

    writerAttempted:
      true,

    writerCompleted:
      false,

    writerFailureReason:
      "LEDGER_STORAGE_UNAVAILABLE",

    summary: [
      "provider_runtime_evidence_ledger_writer_failed",
      "ledger_storage_unavailable",
    ],

  };

}


function buildInput(
  admission:
    ProviderRuntimeEvidenceLedgerAdmissionResult,
  overrides?:
    Partial<ProviderRuntimeEvidenceLedgerWriteInput>
): ProviderRuntimeEvidenceLedgerWriteInput {

  return {

    admission,

    writeDecision:
      "WRITE_PROVIDER_RUNTIME_EVIDENCE_TO_LEDGER",

    ledgerWriter:
      () =>
        buildCompletedWriterResult(),

    ...overrides,

  };

}


// ============================================================
// SCENARIO 1 — WRITE DECISION REJECTED
// ============================================================

function runWriteDecisionRejectedScenario(): void {

  let writerCalls = 0;

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        buildAdmittedResult(
          "RETRY_COMPLETED"
        ),
        {

          writeDecision:
            "REJECT_PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITE",

          ledgerWriter:
            () => {

              writerCalls += 1;

              return buildCompletedWriterResult();

            },

        }
      )
    );

  assertDenied(
    result,
    "RUNTIME_EVIDENCE_LEDGER_WRITE_NOT_ALLOWED",
    "write decision rejected"
  );

  assert.equal(
    writerCalls,
    0,
    "write rejection prevents writer invocation"
  );

  assert(
    result.summary.includes(
      "runtime_evidence_ledger_write_not_allowed"
    ),
    "write rejection summary preserved"
  );

  pass("write decision rejected");
  pass("write rejection prevents ledger writer invocation");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 2 — P9Q ADMISSION DENIED
// ============================================================

function runAdmissionDeniedScenario(): void {

  let writerCalls = 0;

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        buildAdmissionDenied(),
        {

          ledgerWriter:
            () => {

              writerCalls += 1;

              return buildCompletedWriterResult();

            },

        }
      )
    );

  assertDenied(
    result,
    "RUNTIME_EVIDENCE_LEDGER_ADMISSION_DENIED",
    "P9Q admission denied"
  );

  assert.equal(
    writerCalls,
    0,
    "P9Q denial prevents writer invocation"
  );

  pass("P9Q admission denial blocks ledger write");
  pass("P9Q admission authority preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — EVIDENCE NOT ADMITTED
// ============================================================

function runEvidenceNotAdmittedScenario(): void {

  let writerCalls = 0;

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        buildNotAdmitted(),
        {

          ledgerWriter:
            () => {

              writerCalls += 1;

              return buildCompletedWriterResult();

            },

        }
      )
    );

  assertNotWritten(
    result,
    "RUNTIME_EVIDENCE_NOT_ADMITTED",
    "runtime_evidence_not_admitted",
    "evidence not admitted"
  );

  assert.equal(
    writerCalls,
    0,
    "not-admitted evidence prevents writer invocation"
  );

  pass("not-admitted evidence not written");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 4 — ADMISSION MATERIAL MISSING
// ============================================================

function runAdmissionMaterialMissingScenario(): void {

  const admission = {

    ...buildAdmittedResult(
      "RECOVERY_COMPLETED"
    ),

    ledgerAdmissionMaterial:
      undefined,

  } as unknown as ProviderRuntimeEvidenceLedgerAdmissionResult;

  let writerCalls = 0;

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        admission,
        {

          ledgerWriter:
            () => {

              writerCalls += 1;

              return buildCompletedWriterResult();

            },

        }
      )
    );

  assertNotWritten(
    result,
    "LEDGER_ADMISSION_MATERIAL_MISSING",
    "ledger_admission_material_missing",
    "admission material missing"
  );

  assert.equal(
    writerCalls,
    0,
    "missing material prevents writer invocation"
  );

  pass("missing admission material rejected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 5 — ADMISSION MATERIAL INCOHERENT
// ============================================================

function runAdmissionMaterialIncoherentScenario(): void {

  const admission =
    buildAdmittedResult(
      "FAILOVER_COMPLETED"
    );

  const incoherentMaterial = {

    ...admission.ledgerAdmissionMaterial!,

    providerResourceId:
      "kms-key-other-runtime",

  };

  const incoherentAdmission = {

    ...admission,

    ledgerAdmissionMaterial:
      incoherentMaterial,

  } as ProviderRuntimeEvidenceLedgerAdmissionResult;

  let writerCalls = 0;

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        incoherentAdmission,
        {

          ledgerWriter:
            () => {

              writerCalls += 1;

              return buildCompletedWriterResult();

            },

        }
      )
    );

  assertNotWritten(
    result,
    "LEDGER_ADMISSION_MATERIAL_INCOHERENT",
    "ledger_admission_material_incoherent",
    "admission material incoherent"
  );

  assert.equal(
    writerCalls,
    0,
    "incoherent material prevents writer invocation"
  );

  pass("admission material coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 6 — LEDGER WRITER MISSING
// ============================================================

function runLedgerWriterMissingScenario(): void {

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        buildAdmittedResult(
          "STOP_COMPLETED"
        ),
        {

          ledgerWriter:
            undefined,

        }
      )
    );

  assertNotWritten(
    result,
    "LEDGER_WRITER_MISSING",
    "ledger_writer_missing",
    "ledger writer missing"
  );

  assert.equal(
    result.ledgerEntry,
    undefined,
    "missing writer exposes no canonical ledger entry"
  );

  pass("governed ledger writer required");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 7 — LEDGER WRITER THROWS
// ============================================================

function runLedgerWriterThrowsScenario(): void {

  let writerCalls = 0;

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        buildAdmittedResult(
          "ESCALATION_COMPLETED"
        ),
        {

          ledgerWriter:
            () => {

              writerCalls += 1;

              throw new Error(
                "ledger transport unavailable"
              );

            },

        }
      )
    );

  assertNotWritten(
    result,
    "LEDGER_WRITER_FAILED",
    "ledger_writer_failed",
    "ledger writer throws"
  );

  assert.equal(
    writerCalls,
    1,
    "throwing writer invoked exactly once"
  );

  assert(
    result.ledgerEntry,
    "throwing writer path preserves attempted canonical ledger entry"
  );

  assert(
    result.writerSummary?.includes(
      "provider_runtime_evidence_ledger_writer_threw"
    ),
    "writer exception containment summary preserved"
  );

  pass("ledger writer exception contained");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 8 — COHERENT WRITER-REPORTED FAILURE
// ============================================================

function runWriterReportedFailureScenario(): void {

  let writerCalls = 0;

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        buildAdmittedResult(
          "RETRY_FAILED"
        ),
        {

          ledgerWriter:
            () => {

              writerCalls += 1;

              return buildFailedWriterResult();

            },

        }
      )
    );

  assertNotWritten(
    result,
    "LEDGER_WRITER_FAILED",
    "ledger_writer_failed",
    "writer-reported failure"
  );

  assert.equal(
    writerCalls,
    1,
    "failed writer invoked exactly once"
  );

  assert(
    result.ledgerEntry,
    "writer failure preserves canonical entry attempt"
  );

  assert(
    result.writerSummary?.includes(
      "provider_runtime_evidence_ledger_writer_failed"
    ),
    "writer failure summary preserved"
  );

  pass("writer-reported failure contained");
  pass("writer failure does not claim persistence");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 9 — INCOHERENT FAILED WRITER RESULT
// ============================================================

function runIncoherentFailedWriterResultScenario(): void {

  const incoherentFailure:
    ProviderRuntimeEvidenceLedgerWriterResult = {

      ...buildFailedWriterResult(),

      writerCompleted:
        true,

      persistenceId:
        "persistence-must-not-exist",

    };

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        buildAdmittedResult(
          "RECOVERY_FAILED"
        ),
        {

          ledgerWriter:
            () =>
              incoherentFailure,

        }
      )
    );

  assertNotWritten(
    result,
    "LEDGER_WRITER_RESULT_INCOHERENT",
    "ledger_writer_result_incoherent",
    "incoherent failed writer result"
  );

  pass("incoherent failed writer result rejected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 10 — INCOHERENT COMPLETED WRITER RESULTS
// ============================================================

function runIncoherentCompletedWriterResultScenarios(): void {

  const cases: Array<{

    label:
      string;

    result:
      ProviderRuntimeEvidenceLedgerWriterResult;

  }> = [

    {

      label:
        "completed writer without persistence id",

      result: {

        ...buildCompletedWriterResult(),

        persistenceId:
          undefined,

      },

    },

    {

      label:
        "completed writer without ledger entry id",

      result: {

        ...buildCompletedWriterResult(),

        ledgerEntryId:
          undefined,

      },

    },

    {

      label:
        "completed writer with invalid ledger sequence",

      result: {

        ...buildCompletedWriterResult(),

        ledgerSequence:
          0,

      },

    },

    {

      label:
        "completed writer without persistence timestamp",

      result: {

        ...buildCompletedWriterResult(),

        persistedAt:
          undefined,

      },

    },

    {

      label:
        "completed writer with failure reason",

      result: {

        ...buildCompletedWriterResult(),

        writerFailureReason:
          "IMPOSSIBLE_COMPLETED_FAILURE",

      },

    },

    {

      label:
        "completed writer without summary",

      result: {

        ...buildCompletedWriterResult(),

        summary:
          [],

      },

    },

    {

      label:
        "completed writer without attempt",

      result: {

        ...buildCompletedWriterResult(),

        writerAttempted:
          false,

      },

    },

    {

      label:
        "completed writer without completion flag",

      result: {

        ...buildCompletedWriterResult(),

        writerCompleted:
          false,

      },

    },

  ];

  for (const testCase of cases) {

    const result =
      writeProviderRuntimeEvidenceToLedger(
        buildInput(
          buildAdmittedResult(
            "FAILOVER_FAILED"
          ),
          {

            ledgerWriter:
              () =>
                testCase.result,

          }
        )
      );

    assertNotWritten(
      result,
      "LEDGER_WRITER_RESULT_INCOHERENT",
      "ledger_writer_result_incoherent",
      testCase.label
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("incoherent completed writer results rejected");

}


// ============================================================
// SCENARIO 11 — SUCCESSFUL OUTCOME FAMILY
// ============================================================

function runSuccessfulOutcomeFamily(): void {

  let sequence = 100;

  for (const outcome of successfulOutcomes) {

    let writerCalls = 0;

    let receivedEntry:
      ProviderRuntimeEvidenceLedgerEntry | undefined;

    const writer:
      ProviderRuntimeEvidenceLedgerWriter =
        (
          input:
            ProviderRuntimeEvidenceLedgerWriterInput
        ) => {

          writerCalls += 1;

          receivedEntry =
            input.ledgerEntry;

          return buildCompletedWriterResult(
            sequence++
          );

        };

    const result =
      writeProviderRuntimeEvidenceToLedger(
        buildInput(
          buildAdmittedResult(
            outcome
          ),
          {

            ledgerWriter:
              writer,

          }
        )
      );

    assertWritten(
      result,
      outcome,
      outcome
    );

    assert.equal(
      writerCalls,
      1,
      `${outcome} invokes writer exactly once`
    );

    assert.deepEqual(
      receivedEntry,
      result.ledgerEntry,
      `${outcome} writer receives returned canonical entry`
    );

    assert.equal(
      result.executorFailureContained,
      false,
      `${outcome} successful outcome remains non-contained failure`
    );

    pass(
      `${outcome} written`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 12 — CONTAINED-FAILURE OUTCOME FAMILY
// ============================================================

function runContainedFailureOutcomeFamily(): void {

  let sequence = 200;

  for (const outcome of containedFailureOutcomes) {

    let writerCalls = 0;

    const result =
      writeProviderRuntimeEvidenceToLedger(
        buildInput(
          buildAdmittedResult(
            outcome
          ),
          {

            ledgerWriter:
              () => {

                writerCalls += 1;

                return buildCompletedWriterResult(
                  sequence++
                );

              },

          }
        )
      );

    assertWritten(
      result,
      outcome,
      outcome
    );

    assert.equal(
      writerCalls,
      1,
      `${outcome} invokes writer exactly once`
    );

    assert.equal(
      result.executorFailureContained,
      true,
      `${outcome} contained runtime failure preserved`
    );

    assert(
      result.ledgerEntry?.executorSummary?.includes(
        "executor_failure_contained"
      ),
      `${outcome} contained-failure summary persisted`
    );

    pass(
      `${outcome} written`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 13 — EXACTLY ONE WRITER INVOCATION
// ============================================================

function runExactlyOneWriterInvocationCheck(): void {

  let writerCalls = 0;

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        buildAdmittedResult(
          "RECOVERY_COMPLETED"
        ),
        {

          ledgerWriter:
            () => {

              writerCalls += 1;

              return buildCompletedWriterResult(
                301
              );

            },

        }
      )
    );

  assertWritten(
    result,
    "RECOVERY_COMPLETED",
    "exactly one writer invocation"
  );

  assert.equal(
    writerCalls,
    1,
    "governed writer invoked exactly once"
  );

  pass("exactly one governed ledger writer invocation verified");

}


// ============================================================
// SCENARIO 14 — LEDGER ENTRY COMPOSITION / IMMUTABILITY
// ============================================================

function runLedgerEntryCompositionChecks(): void {

  const admission =
    buildAdmittedResult(
      "ESCALATION_FAILED"
    );

  const material =
    admission.ledgerAdmissionMaterial!;

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

  let writerEntry:
    ProviderRuntimeEvidenceLedgerEntry | undefined;

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        admission,
        {

          ledgerWriter:
            (
              input:
                ProviderRuntimeEvidenceLedgerWriterInput
            ) => {

              writerEntry =
                input.ledgerEntry;

              return buildCompletedWriterResult(
                401
              );

            },

        }
      )
    );

  assertWritten(
    result,
    "ESCALATION_FAILED",
    "ledger entry composition"
  );

  const ledgerEntry =
    result.ledgerEntry!;

  assert.equal(
    ledgerEntry.ledgerEntryType,
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME",
    "canonical ledger entry type preserved"
  );

  assert.equal(
    ledgerEntry.ledgerEntryVersion,
    "P9R.1",
    "canonical ledger entry version preserved"
  );

  assert.equal(
    ledgerEntry.certifiedExecutionOutcome,
    material.certifiedExecutionOutcome,
    "certified execution outcome preserved"
  );

  assert.equal(
    ledgerEntry.providerContract,
    material.providerContract,
    "provider contract preserved"
  );

  assert.equal(
    ledgerEntry.providerImplementation,
    material.providerImplementation,
    "provider implementation preserved"
  );

  assert.equal(
    ledgerEntry.operation,
    material.operation,
    "operation preserved"
  );

  assert.equal(
    ledgerEntry.providerResourceId,
    material.providerResourceId,
    "provider resource preserved"
  );

  assert.deepEqual(
    ledgerEntry.executionMetadata,
    material.executionMetadata,
    "execution metadata preserved"
  );

  assert.equal(
    ledgerEntry.verificationStatus,
    material.verificationStatus,
    "P9L verification status preserved"
  );

  assert.equal(
    ledgerEntry.classificationStatus,
    material.classificationStatus,
    "P9M classification status preserved"
  );

  assert.equal(
    ledgerEntry.runtimeResponse,
    material.runtimeResponse,
    "P9N selected response preserved"
  );

  assert.equal(
    ledgerEntry.responseExecutionStatus,
    material.responseExecutionStatus,
    "P9O execution status preserved"
  );

  assert.equal(
    ledgerEntry.runtimeResponseExecuted,
    material.runtimeResponseExecuted,
    "P9O execution completion preserved"
  );

  assert.equal(
    ledgerEntry.certifiedExecutionOutcome,
    admission.certifiedExecutionOutcome,
    "P9P certified outcome preserved"
  );

  assert.equal(
    ledgerEntry.executorFailureContained,
    material.executorFailureContained,
    "P9P failure-containment posture preserved"
  );

  assert.deepEqual(
    writerEntry,
    ledgerEntry,
    "writer receives exact canonical ledger entry"
  );

  assert.deepEqual(
    ledgerEntry.responseDecisionSummary,
    responseDecisionSummaryBefore,
    "response-decision summary copied"
  );

  assert.deepEqual(
    ledgerEntry.executorSummary,
    executorSummaryBefore,
    "executor summary copied"
  );

  assert.deepEqual(
    ledgerEntry.responseExecutionSummary,
    responseExecutionSummaryBefore,
    "response-execution summary copied"
  );

  assert.deepEqual(
    ledgerEntry.certificationSummary,
    certificationSummaryBefore,
    "certification summary copied"
  );

  assert.notEqual(
    ledgerEntry.responseDecisionSummary,
    material.responseDecisionSummary,
    "response-decision summary copied defensively"
  );

  assert.notEqual(
    ledgerEntry.executorSummary,
    material.executorSummary,
    "executor summary copied defensively"
  );

  assert.notEqual(
    ledgerEntry.responseExecutionSummary,
    material.responseExecutionSummary,
    "response-execution summary copied defensively"
  );

  assert.notEqual(
    ledgerEntry.certificationSummary,
    material.certificationSummary,
    "certification summary copied defensively"
  );

  ledgerEntry.responseDecisionSummary.push(
    "ledger_entry_mutation_probe"
  );

  ledgerEntry.executorSummary?.push(
    "ledger_entry_mutation_probe"
  );

  ledgerEntry.responseExecutionSummary.push(
    "ledger_entry_mutation_probe"
  );

  ledgerEntry.certificationSummary.push(
    "ledger_entry_mutation_probe"
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

  pass("canonical ledger-entry composition verified");
  pass("defensive ledger-entry summary copying verified");
  pass("P9Q admission material immutability verified");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 15 — DURABLE IDENTIFIER PROPAGATION
// ============================================================

function runDurableIdentifierPropagationChecks(): void {

  const writerResult:
    ProviderRuntimeEvidenceLedgerWriterResult = {

      writerStatus:
        "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITER_COMPLETED",

      writerAttempted:
        true,

      writerCompleted:
        true,

      persistenceId:
        "persist-explicit-001",

      ledgerEntryId:
        "ledger-explicit-001",

      ledgerSequence:
        9001,

      persistedAt:
        "2026-07-12T12:34:56.789Z",

      summary: [
        "provider_runtime_evidence_ledger_writer_completed",
        "explicit_identifiers_assigned",
      ],

    };

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        buildAdmittedResult(
          "STOP_FAILED"
        ),
        {

          ledgerWriter:
            () =>
              writerResult,

        }
      )
    );

  assertWritten(
    result,
    "STOP_FAILED",
    "durable identifier propagation"
  );

  assert.equal(
    result.persistenceId,
    writerResult.persistenceId,
    "persistence identifier propagated from writer"
  );

  assert.equal(
    result.ledgerEntryId,
    writerResult.ledgerEntryId,
    "ledger-entry identifier propagated from writer"
  );

  assert.equal(
    result.ledgerSequence,
    writerResult.ledgerSequence,
    "ledger sequence propagated from writer"
  );

  assert.equal(
    result.persistedAt,
    writerResult.persistedAt,
    "persistence timestamp propagated from writer"
  );

  assert.deepEqual(
    result.writerSummary,
    writerResult.summary,
    "writer summary propagated"
  );

  pass("durable writer identifiers propagated");

}


// ============================================================
// SCENARIO 16 — CONTRACT PROPAGATION
// ============================================================

function runContractPropagationChecks(): void {

  const admission =
    buildAdmittedResult(
      "RECOVERY_COMPLETED"
    );

  const result =
    writeProviderRuntimeEvidenceToLedger(
      buildInput(
        admission,
        {

          ledgerWriter:
            () =>
              buildCompletedWriterResult(
                501
              ),

        }
      )
    );

  assertWritten(
    result,
    "RECOVERY_COMPLETED",
    "contract propagation"
  );

  assert.equal(
    result.providerContract,
    admission.providerContract,
    "providerContract propagated"
  );

  assert.equal(
    result.providerImplementation,
    admission.providerImplementation,
    "providerImplementation propagated"
  );

  assert.equal(
    result.operation,
    admission.operation,
    "operation propagated"
  );

  assert.equal(
    result.providerResourceId,
    admission.providerResourceId,
    "providerResourceId propagated"
  );

  assert.equal(
    result.providerConfigurationRef,
    admission.providerConfigurationRef,
    "providerConfigurationRef propagated"
  );

  assert.equal(
    result.providerCredentialRef,
    admission.providerCredentialRef,
    "providerCredentialRef propagated"
  );

  assert.deepEqual(
    result.executionMetadata,
    admission.executionMetadata,
    "executionMetadata propagated"
  );

  assert.equal(
    result.verificationStatus,
    admission.verificationStatus,
    "verificationStatus propagated"
  );

  assert.equal(
    result.verificationFailureReason,
    admission.verificationFailureReason,
    "verificationFailureReason propagated"
  );

  assert.equal(
    result.classificationStatus,
    admission.classificationStatus,
    "classificationStatus propagated"
  );

  assert.equal(
    result.runtimeFailureClass,
    admission.runtimeFailureClass,
    "runtimeFailureClass propagated"
  );

  assert.equal(
    result.runtimeFailureSeverity,
    admission.runtimeFailureSeverity,
    "runtimeFailureSeverity propagated"
  );

  assert.equal(
    result.failureCode,
    admission.failureCode,
    "failureCode propagated"
  );

  assert.equal(
    result.providerRawStatus,
    admission.providerRawStatus,
    "providerRawStatus propagated"
  );

  assert.equal(
    result.providerRawErrorCode,
    admission.providerRawErrorCode,
    "providerRawErrorCode propagated"
  );

  assert.equal(
    result.providerSanitizedErrorMessage,
    admission.providerSanitizedErrorMessage,
    "providerSanitizedErrorMessage propagated"
  );

  assert.equal(
    result.retryable,
    admission.retryable,
    "retryable propagated"
  );

  assert.equal(
    result.recoveryIntakeRequired,
    admission.recoveryIntakeRequired,
    "recoveryIntakeRequired propagated"
  );

  assert.equal(
    result.recoveryIntakeReady,
    admission.recoveryIntakeReady,
    "recoveryIntakeReady propagated"
  );

  assert.equal(
    result.recoveryReason,
    admission.recoveryReason,
    "recoveryReason propagated"
  );

  assert.equal(
    result.runtimeResponse,
    admission.runtimeResponse,
    "runtimeResponse propagated"
  );

  assert.equal(
    result.responseExecutionStatus,
    admission.responseExecutionStatus,
    "responseExecutionStatus propagated"
  );

  assert.equal(
    result.runtimeResponseExecutionAttempted,
    admission.runtimeResponseExecutionAttempted,
    "runtimeResponseExecutionAttempted propagated"
  );

  assert.equal(
    result.runtimeResponseExecuted,
    admission.runtimeResponseExecuted,
    "runtimeResponseExecuted propagated"
  );

  assert.equal(
    result.runtimeInterventionNotRequired,
    admission.runtimeInterventionNotRequired,
    "runtimeInterventionNotRequired propagated"
  );

  assert.equal(
    result.executorFailureContained,
    admission.executorFailureContained,
    "executorFailureContained propagated"
  );

  assert.deepEqual(
    result.admissionSummary,
    admission.summary,
    "P9Q admission summary copied"
  );

  assert.notEqual(
    result.admissionSummary,
    admission.summary,
    "P9Q admission summary copied defensively"
  );

  pass("provider/runtime context propagated");
  pass("P9L/P9M/P9N/P9O/P9P/P9Q lineage propagated");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 17 — BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const results:
    ProviderRuntimeEvidenceLedgerWriteResult[] = [

      writeProviderRuntimeEvidenceToLedger(
        buildInput(
          buildAdmittedResult(
            "NO_ACTION_COMPLETED"
          )
        )
      ),

      writeProviderRuntimeEvidenceToLedger(
        buildInput(
          buildAdmittedResult(
            "RETRY_COMPLETED"
          )
        )
      ),

      writeProviderRuntimeEvidenceToLedger(
        buildInput(
          buildAdmittedResult(
            "RECOVERY_FAILED"
          ),
          {

            ledgerWriter:
              () =>
                buildFailedWriterResult(),

          }
        )
      ),

      writeProviderRuntimeEvidenceToLedger(
        buildInput(
          buildAdmissionDenied()
        )
      ),

      writeProviderRuntimeEvidenceToLedger(
        buildInput(
          buildNotAdmitted()
        )
      ),

      writeProviderRuntimeEvidenceToLedger(
        buildInput(
          buildAdmittedResult(
            "FAILOVER_COMPLETED"
          ),
          {

            writeDecision:
              "REJECT_PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITE",

          }
        )
      ),

  ];

  for (const result of results) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("P9R ledger-write boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runWriteDecisionRejectedScenario();

  runAdmissionDeniedScenario();

  runEvidenceNotAdmittedScenario();

  runAdmissionMaterialMissingScenario();

  runAdmissionMaterialIncoherentScenario();

  runLedgerWriterMissingScenario();

  runLedgerWriterThrowsScenario();

  runWriterReportedFailureScenario();

  runIncoherentFailedWriterResultScenario();

  runIncoherentCompletedWriterResultScenarios();

  runSuccessfulOutcomeFamily();

  runContainedFailureOutcomeFamily();

  runExactlyOneWriterInvocationCheck();

  runLedgerEntryCompositionChecks();

  runDurableIdentifierPropagationChecks();

  runContractPropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9R PROVIDER RUNTIME EVIDENCE LEDGER WRITE");
  console.log("========================================");
  console.log("");

  console.log("Write Gates:");
  console.log("✓ write decision rejected → DENIED");
  console.log("✓ P9Q admission denied → DENIED");
  console.log("✓ evidence not admitted → NOT_WRITTEN");
  console.log("✓ denied and not-written states remain distinct");

  console.log("");
  console.log("Admission Requirements:");
  console.log("✓ ledger-admission material required");
  console.log("✓ ledger-admission material coherence required");
  console.log("✓ incoherent admission material never reaches writer");

  console.log("");
  console.log("Governed Writer:");
  console.log("✓ governed ledger writer required");
  console.log("✓ exactly one writer invocation");
  console.log("✓ writer exception contained");
  console.log("✓ writer-reported failure contained");
  console.log("✓ incoherent failed writer result rejected");
  console.log("✓ incoherent completed writer result rejected");
  console.log("✓ writer failure never claims persistence");

  console.log("");
  console.log("Successful Outcome Persistence:");
  console.log("✓ NO_ACTION_COMPLETED");
  console.log("✓ RETRY_COMPLETED");
  console.log("✓ RECOVERY_COMPLETED");
  console.log("✓ FAILOVER_COMPLETED");
  console.log("✓ STOP_COMPLETED");
  console.log("✓ ESCALATION_COMPLETED");

  console.log("");
  console.log("Contained-Failure Outcome Persistence:");
  console.log("✓ RETRY_FAILED");
  console.log("✓ RECOVERY_FAILED");
  console.log("✓ FAILOVER_FAILED");
  console.log("✓ STOP_FAILED");
  console.log("✓ ESCALATION_FAILED");

  console.log("");
  console.log("Canonical Ledger Entry:");
  console.log("✓ entry type PROVIDER_RUNTIME_EXECUTION_OUTCOME");
  console.log("✓ entry version P9R.1");
  console.log("✓ P9L verification context preserved");
  console.log("✓ P9M classification context preserved");
  console.log("✓ P9N selected response preserved");
  console.log("✓ P9O execution state preserved");
  console.log("✓ P9P certified outcome preserved");
  console.log("✓ P9Q admitted evidence preserved");
  console.log("✓ summaries copied defensively");
  console.log("✓ source admission material not mutated");

  console.log("");
  console.log("Durable Write Claims:");
  console.log("✓ evidence persisted only after coherent writer completion");
  console.log("✓ ledger written only after coherent writer completion");
  console.log("✓ persistence identifier propagated from writer");
  console.log("✓ ledger-entry identifier propagated from writer");
  console.log("✓ ledger sequence propagated from writer");
  console.log("✓ persistence timestamp propagated from writer");
  console.log("✓ durable identifiers are never manufactured");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime verification");
  console.log("✓ no runtime failure classification");
  console.log("✓ no runtime response decision");
  console.log("✓ no runtime response execution");
  console.log("✓ no governed response executor invocation");
  console.log("✓ no execution-outcome certification");
  console.log("✓ no evidence admission");
  console.log("✓ no provider API / SDK calls");
  console.log("✓ no provider-error re-sanitization");
  console.log("✓ no sanitized failure-surface alteration");
  console.log("✓ no response replacement");
  console.log("✓ no P9O result alteration");
  console.log("✓ no P9P result alteration");
  console.log("✓ no P9Q result alteration");
  console.log("✓ no audit");

  console.log("");
  console.log("========================================");
  console.log("P9R.1 PROVIDER RUNTIME EVIDENCE LEDGER WRITE VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();