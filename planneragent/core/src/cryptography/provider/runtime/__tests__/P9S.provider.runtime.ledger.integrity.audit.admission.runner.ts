// ============================================================
// PlannerAgent — Provider Runtime Ledger Integrity / Audit Admission Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9S.provider.runtime.ledger.integrity.audit.admission.runner.ts
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
// P9S.1 — Provider Runtime Ledger Integrity / Audit Admission Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9S.1 ledger-integrity and
// audit-admission contract.
//
// This runner verifies:
//
// 1. audit admission rejected
// 2. P9R ledger write denied
// 3. P9R ledger not written
// 4. evidence not persisted
// 5. ledger entry missing
// 6. persistence identifier missing
// 7. ledger entry identifier missing
// 8. ledger sequence invalid
// 9. persistence timestamp missing
// 10. ledger entry shape invalid
// 11. ledger result / entry context incoherent
// 12. certified outcome incoherent
// 13. selected response incoherent
// 14. execution state incoherent
// 15. contained-failure evidence insufficient
// 16. persistence summary insufficient
// 17. all successful outcomes admitted
// 18. all contained-failure outcomes admitted
// 19. canonical audit-admission material composition
// 20. defensive summary copying
// 21. source immutability
// 22. P9L/P9M/P9N/P9O/P9P/P9Q/P9R lineage propagation
// 23. boundary verification
//
// P9S validates durable ledger facts.
//
// P9S does not perform audit.
//
// P9S does not write audit records.
//
// ============================================================

import assert from "node:assert/strict";

import {
  admitProviderRuntimeLedgerToAudit,
} from "../P9S.provider.runtime.ledger.integrity.audit.admission";

import type {
  ProviderRuntimeLedgerAuditAdmissionInput,
  ProviderRuntimeLedgerAuditAdmissionMaterial,
  ProviderRuntimeLedgerAuditAdmissionResult,
} from "../P9S.provider.runtime.ledger.integrity.audit.admission";

import type {
  ProviderRuntimeEvidenceLedgerEntry,
  ProviderRuntimeEvidenceLedgerWriteResult,
} from "../P9R.provider.runtime.evidence.persistence.ledger.write";

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

    "runtimeVerifiedByAuditAdmission",

    "runtimeFailureClassifiedByAuditAdmission",

    "runtimeResponseDecidedByAuditAdmission",

    "runtimeResponseExecutedByAuditAdmission",

    "executionOutcomeCertifiedByAuditAdmission",

    "runtimeEvidenceAdmittedByAuditAdmission",

    "runtimeEvidencePersistedByAuditAdmission",

    "ledgerEntryWrittenByAuditAdmission",

    "ledgerWriterInvoked",

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

    "ledgerWriteResultAltered",

    "auditPerformed",

    "auditWritten",

    "auditRecordWritten",

    "auditRecordId",

    "auditFindingIssued",

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
    ProviderRuntimeLedgerAuditAdmissionResult,
  expectedReason:
    ProviderRuntimeLedgerAuditAdmissionResult["auditAdmissionDenialReason"],
  label:
    string
): void {

  assert.equal(
    result.auditAdmissionStatus,
    "PROVIDER_RUNTIME_LEDGER_AUDIT_ADMISSION_DENIED",
    `${label} status`
  );

  assert.equal(
    result.runtimeLedgerAuditAdmissionAttempted,
    false,
    `${label} admission not attempted`
  );

  assert.equal(
    result.runtimeLedgerAuditAdmitted,
    false,
    `${label} not admitted`
  );

  assert.equal(
    result.runtimeLedgerAuditAdmissionDenied,
    true,
    `${label} denied`
  );

  assert.equal(
    result.auditAdmissionDenialReason,
    expectedReason,
    `${label} denial reason preserved`
  );

  assert.equal(
    result.auditAdmissionFailureReason,
    undefined,
    `${label} exposes no failure reason`
  );

  assert.equal(
    result.auditAdmissionMaterial,
    undefined,
    `${label} exposes no audit material`
  );

}


function assertNotAdmitted(
  result:
    ProviderRuntimeLedgerAuditAdmissionResult,
  expectedReason:
    ProviderRuntimeLedgerAuditAdmissionResult["auditAdmissionFailureReason"],
  summaryToken:
    string,
  label:
    string
): void {

  assert.equal(
    result.auditAdmissionStatus,
    "PROVIDER_RUNTIME_LEDGER_AUDIT_NOT_ADMITTED",
    `${label} status`
  );

  assert.equal(
    result.runtimeLedgerAuditAdmissionAttempted,
    true,
    `${label} admission attempted`
  );

  assert.equal(
    result.runtimeLedgerAuditAdmitted,
    false,
    `${label} not admitted`
  );

  assert.equal(
    result.runtimeLedgerAuditAdmissionDenied,
    false,
    `${label} is not denial`
  );

  assert.equal(
    result.auditAdmissionFailureReason,
    expectedReason,
    `${label} failure reason preserved`
  );

  assert.equal(
    result.auditAdmissionDenialReason,
    undefined,
    `${label} exposes no denial reason`
  );

  assert.equal(
    result.auditAdmissionMaterial,
    undefined,
    `${label} exposes no audit material`
  );

  assert(
    result.summary.includes(
      summaryToken
    ),
    `${label} summary token preserved`
  );

}


function assertAdmitted(
  result:
    ProviderRuntimeLedgerAuditAdmissionResult,
  expectedOutcome:
    ProviderRuntimeCertifiedExecutionOutcome,
  label:
    string
): void {

  assert.equal(
    result.auditAdmissionStatus,
    "PROVIDER_RUNTIME_LEDGER_AUDIT_ADMITTED",
    `${label} status`
  );

  assert.equal(
    result.runtimeLedgerAuditAdmissionAttempted,
    true,
    `${label} admission attempted`
  );

  assert.equal(
    result.runtimeLedgerAuditAdmitted,
    true,
    `${label} admitted`
  );

  assert.equal(
    result.runtimeLedgerAuditAdmissionDenied,
    false,
    `${label} not denied`
  );

  assert.equal(
    result.auditAdmissionDenialReason,
    undefined,
    `${label} exposes no denial reason`
  );

  assert.equal(
    result.auditAdmissionFailureReason,
    undefined,
    `${label} exposes no failure reason`
  );

  assert.equal(
    result.certifiedExecutionOutcome,
    expectedOutcome,
    `${label} certified outcome preserved`
  );

  assert(
    result.auditAdmissionMaterial,
    `${label} audit material present`
  );

  assert.equal(
    result.auditAdmissionMaterial?.certifiedExecutionOutcome,
    expectedOutcome,
    `${label} material outcome preserved`
  );

  assert(
    result.summary.includes(
      "provider_runtime_ledger_integrity_validated"
    ),
    `${label} integrity summary preserved`
  );

  assert(
    result.summary.includes(
      "provider_runtime_ledger_audit_admitted"
    ),
    `${label} audit-admission summary preserved`
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
  "kms-key-runtime-audit-admission";

const providerConfigurationRef =
  "cfg/aws-kms-prod";

const providerCredentialRef =
  "cred/aws-kms-prod";

const executionMetadata = {

  tenantId:
    "tenant-001",

  runtimeBatchId:
    "runtime-audit-admission-001",

};


// ============================================================
// OUTCOME FAMILY
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
// P9R LEDGER ENTRY FIXTURE
// ============================================================

function buildLedgerEntry(
  certifiedExecutionOutcome:
    ProviderRuntimeCertifiedExecutionOutcome
): ProviderRuntimeEvidenceLedgerEntry {

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

    ledgerEntryType:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME",

    ledgerEntryVersion:
      "P9R.1",

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

  } as ProviderRuntimeEvidenceLedgerEntry;

}


// ============================================================
// P9R WRITE RESULT FIXTURES
// ============================================================

function buildWrittenResult(
  certifiedExecutionOutcome:
    ProviderRuntimeCertifiedExecutionOutcome
): ProviderRuntimeEvidenceLedgerWriteResult {

  const ledgerEntry =
    buildLedgerEntry(
      certifiedExecutionOutcome
    );

  return {

    writeStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITTEN",

    writeDecision:
      "WRITE_PROVIDER_RUNTIME_EVIDENCE_TO_LEDGER",

    runtimeEvidenceLedgerWriteAttempted:
      true,

    runtimeEvidencePersisted:
      true,

    runtimeEvidenceLedgerWritten:
      true,

    runtimeEvidenceLedgerWriteDenied:
      false,

    certifiedExecutionOutcome:
      ledgerEntry.certifiedExecutionOutcome,

    providerContract:
      ledgerEntry.providerContract,

    providerImplementation:
      ledgerEntry.providerImplementation,

    operation:
      ledgerEntry.operation,

    providerResourceId:
      ledgerEntry.providerResourceId,

    providerConfigurationRef:
      ledgerEntry.providerConfigurationRef,

    providerCredentialRef:
      ledgerEntry.providerCredentialRef,

    executionMetadata:
      ledgerEntry.executionMetadata,

    verificationStatus:
      ledgerEntry.verificationStatus,

    verificationFailureReason:
      ledgerEntry.verificationFailureReason,

    classificationStatus:
      ledgerEntry.classificationStatus,

    runtimeFailureClass:
      ledgerEntry.runtimeFailureClass,

    runtimeFailureSeverity:
      ledgerEntry.runtimeFailureSeverity,

    failureCode:
      ledgerEntry.failureCode,

    providerRawStatus:
      ledgerEntry.providerRawStatus,

    providerRawErrorCode:
      ledgerEntry.providerRawErrorCode,

    providerSanitizedErrorMessage:
      ledgerEntry.providerSanitizedErrorMessage,

    retryable:
      ledgerEntry.retryable,

    recoveryIntakeRequired:
      ledgerEntry.recoveryIntakeRequired,

    recoveryIntakeReady:
      ledgerEntry.recoveryIntakeReady,

    recoveryReason:
      ledgerEntry.recoveryReason,

    runtimeResponse:
      ledgerEntry.runtimeResponse,

    responseExecutionStatus:
      ledgerEntry.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      ledgerEntry.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      ledgerEntry.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      ledgerEntry.runtimeInterventionNotRequired,

    executorFailureContained:
      ledgerEntry.executorFailureContained,

    ledgerEntry,

    persistenceId:
      "persist-runtime-audit-001",

    ledgerEntryId:
      "ledger-runtime-audit-001",

    ledgerSequence:
      701,

    persistedAt:
      "2026-07-12T12:00:00.000Z",

    admissionSummary: [
      "provider_runtime_evidence_ledger_admitted",
      certifiedExecutionOutcome.toLowerCase(),
    ],

    writerSummary: [
      "provider_runtime_evidence_ledger_writer_completed",
      "provider_runtime_evidence_persisted",
      "provider_runtime_ledger_entry_written",
    ],

    summary: [
      "provider_runtime_evidence_ledger_admitted",
      certifiedExecutionOutcome.toLowerCase(),
      "provider_runtime_evidence_ledger_writer_completed",
      "provider_runtime_evidence_persisted",
      "provider_runtime_evidence_ledger_written",
      certifiedExecutionOutcome.toLowerCase(),
    ],

  } as unknown as ProviderRuntimeEvidenceLedgerWriteResult;

}


function buildWriteDenied():
  ProviderRuntimeEvidenceLedgerWriteResult {

  const base =
    buildWrittenResult(
      "RETRY_COMPLETED"
    );

  return {

    ...base,

    writeStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITE_DENIED",

    runtimeEvidenceLedgerWriteAttempted:
      false,

    runtimeEvidencePersisted:
      false,

    runtimeEvidenceLedgerWritten:
      false,

    runtimeEvidenceLedgerWriteDenied:
      true,

    writeDenialReason:
      "RUNTIME_EVIDENCE_LEDGER_WRITE_NOT_ALLOWED",

    ledgerEntry:
      undefined,

    persistenceId:
      undefined,

    ledgerEntryId:
      undefined,

    ledgerSequence:
      undefined,

    persistedAt:
      undefined,

    writerSummary:
      undefined,

    summary: [
      "provider_runtime_evidence_ledger_write_denied",
      "runtime_evidence_ledger_write_not_allowed",
    ],

  } as unknown as ProviderRuntimeEvidenceLedgerWriteResult;

}


function buildNotWritten():
  ProviderRuntimeEvidenceLedgerWriteResult {

  const base =
    buildWrittenResult(
      "RETRY_COMPLETED"
    );

  return {

    ...base,

    writeStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_WRITTEN",

    runtimeEvidenceLedgerWriteAttempted:
      true,

    runtimeEvidencePersisted:
      false,

    runtimeEvidenceLedgerWritten:
      false,

    runtimeEvidenceLedgerWriteDenied:
      false,

    writeFailureReason:
      "LEDGER_WRITER_FAILED",

    ledgerEntry:
      undefined,

    persistenceId:
      undefined,

    ledgerEntryId:
      undefined,

    ledgerSequence:
      undefined,

    persistedAt:
      undefined,

    writerSummary: [
      "provider_runtime_evidence_ledger_writer_failed",
    ],

    summary: [
      "provider_runtime_evidence_ledger_not_written",
      "ledger_writer_failed",
    ],

  } as unknown as ProviderRuntimeEvidenceLedgerWriteResult;

}


// ============================================================
// INPUT BUILDER
// ============================================================

function buildInput(
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult,
  overrides?:
    Partial<ProviderRuntimeLedgerAuditAdmissionInput>
): ProviderRuntimeLedgerAuditAdmissionInput {

  return {

    ledgerWrite,

    auditAdmissionDecision:
      "ADMIT_PROVIDER_RUNTIME_LEDGER_TO_AUDIT",

    ...overrides,

  };

}


// ============================================================
// SCENARIO 1 — AUDIT ADMISSION REJECTED
// ============================================================

function runAuditAdmissionRejectedScenario(): void {

  const result =
    admitProviderRuntimeLedgerToAudit(
      buildInput(
        buildWrittenResult(
          "RETRY_COMPLETED"
        ),
        {

          auditAdmissionDecision:
            "REJECT_PROVIDER_RUNTIME_LEDGER_AUDIT_ADMISSION",

        }
      )
    );

  assertDenied(
    result,
    "RUNTIME_LEDGER_AUDIT_ADMISSION_NOT_ALLOWED",
    "audit admission rejected"
  );

  pass("audit admission rejected");
  pass("audit admission rejection reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 2 — P9R WRITE DENIED
// ============================================================

function runLedgerWriteDeniedScenario(): void {

  const result =
    admitProviderRuntimeLedgerToAudit(
      buildInput(
        buildWriteDenied()
      )
    );

  assertDenied(
    result,
    "RUNTIME_EVIDENCE_LEDGER_WRITE_DENIED",
    "P9R ledger write denied"
  );

  pass("P9R ledger write denial blocks audit admission");
  pass("P9R write authority preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — LEDGER NOT WRITTEN
// ============================================================

function runLedgerNotWrittenScenario(): void {

  const result =
    admitProviderRuntimeLedgerToAudit(
      buildInput(
        buildNotWritten()
      )
    );

  assertNotAdmitted(
    result,
    "RUNTIME_EVIDENCE_LEDGER_NOT_WRITTEN",
    "runtime_evidence_ledger_not_written",
    "ledger not written"
  );

  pass("not-written ledger result not admitted");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 4 — EVIDENCE NOT PERSISTED
// ============================================================

function runEvidenceNotPersistedScenario(): void {

  const ledgerWrite = {

    ...buildWrittenResult(
      "RECOVERY_COMPLETED"
    ),

    runtimeEvidencePersisted:
      false,

  } as ProviderRuntimeEvidenceLedgerWriteResult;

  const result =
    admitProviderRuntimeLedgerToAudit(
      buildInput(
        ledgerWrite
      )
    );

  assertNotAdmitted(
    result,
    "RUNTIME_EVIDENCE_NOT_PERSISTED",
    "runtime_evidence_not_persisted",
    "evidence not persisted"
  );

  pass("non-persisted evidence not admitted");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 5 — LEDGER ENTRY MISSING
// ============================================================

function runLedgerEntryMissingScenario(): void {

  const ledgerWrite = {

    ...buildWrittenResult(
      "FAILOVER_COMPLETED"
    ),

    ledgerEntry:
      undefined,

  } as ProviderRuntimeEvidenceLedgerWriteResult;

  const result =
    admitProviderRuntimeLedgerToAudit(
      buildInput(
        ledgerWrite
      )
    );

  assertNotAdmitted(
    result,
    "LEDGER_ENTRY_MISSING",
    "ledger_entry_missing",
    "ledger entry missing"
  );

  pass("missing ledger entry rejected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIOS 6–9 — DURABLE IDENTIFIER REQUIREMENTS
// ============================================================

function runDurableIdentifierRequirementScenarios(): void {

  const cases: Array<{

    label:
      string;

    mutate:
      (
        value:
          ProviderRuntimeEvidenceLedgerWriteResult
      ) =>
        ProviderRuntimeEvidenceLedgerWriteResult;

    expectedReason:
      ProviderRuntimeLedgerAuditAdmissionResult["auditAdmissionFailureReason"];

    summaryToken:
      string;

  }> = [

    {

      label:
        "persistence identifier missing",

      mutate:
        (value) => ({

          ...value,

          persistenceId:
            undefined,

        }),

      expectedReason:
        "PERSISTENCE_ID_MISSING",

      summaryToken:
        "persistence_id_missing",

    },

    {

      label:
        "ledger entry identifier missing",

      mutate:
        (value) => ({

          ...value,

          ledgerEntryId:
            undefined,

        }),

      expectedReason:
        "LEDGER_ENTRY_ID_MISSING",

      summaryToken:
        "ledger_entry_id_missing",

    },

    {

      label:
        "ledger sequence invalid",

      mutate:
        (value) => ({

          ...value,

          ledgerSequence:
            0,

        }),

      expectedReason:
        "LEDGER_SEQUENCE_INVALID",

      summaryToken:
        "ledger_sequence_invalid",

    },

    {

      label:
        "persistence timestamp missing",

      mutate:
        (value) => ({

          ...value,

          persistedAt:
            undefined,

        }),

      expectedReason:
        "PERSISTENCE_TIMESTAMP_MISSING",

      summaryToken:
        "persistence_timestamp_missing",

    },

  ];

  for (const testCase of cases) {

    const result =
      admitProviderRuntimeLedgerToAudit(
        buildInput(
          testCase.mutate(
            buildWrittenResult(
              "STOP_COMPLETED"
            )
          )
        )
      );

    assertNotAdmitted(
      result,
      testCase.expectedReason,
      testCase.summaryToken,
      testCase.label
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("durable identifier requirements enforced");

}


// ============================================================
// SCENARIO 10 — LEDGER ENTRY SHAPE INVALID
// ============================================================

function runLedgerEntryShapeInvalidScenarios(): void {

  const cases: Array<{

    label:
      string;

    mutate:
      (
        entry:
          ProviderRuntimeEvidenceLedgerEntry
      ) =>
        ProviderRuntimeEvidenceLedgerEntry;

  }> = [

    {

      label:
        "ledger entry type invalid",

      mutate:
        (entry) => ({

          ...entry,

          ledgerEntryType:
            "INVALID_LEDGER_ENTRY_TYPE" as
              ProviderRuntimeEvidenceLedgerEntry["ledgerEntryType"],

        }),

    },

    {

      label:
        "ledger entry version invalid",

      mutate:
        (entry) => ({

          ...entry,

          ledgerEntryVersion:
            "P9R.INVALID" as
              ProviderRuntimeEvidenceLedgerEntry["ledgerEntryVersion"],

        }),

    },

    {

      label:
        "response decision summary invalid",

      mutate:
        (entry) => ({

          ...entry,

          responseDecisionSummary:
            [],

        }),

    },

    {

      label:
        "response execution summary invalid",

      mutate:
        (entry) => ({

          ...entry,

          responseExecutionSummary:
            [],

        }),

    },

    {

      label:
        "certification summary invalid",

      mutate:
        (entry) => ({

          ...entry,

          certificationSummary:
            [],

        }),

    },

  ];

  for (const testCase of cases) {

    const base =
      buildWrittenResult(
        "ESCALATION_COMPLETED"
      );

    const ledgerWrite = {

      ...base,

      ledgerEntry:
        testCase.mutate(
          base.ledgerEntry!
        ),

    } as ProviderRuntimeEvidenceLedgerWriteResult;

    const result =
      admitProviderRuntimeLedgerToAudit(
        buildInput(
          ledgerWrite
        )
      );

    assertNotAdmitted(
      result,
      "LEDGER_ENTRY_SHAPE_INVALID",
      "ledger_entry_shape_invalid",
      testCase.label
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("canonical ledger-entry shape enforced");

}


// ============================================================
// SCENARIO 11 — CONTEXT INCOHERENCE
// ============================================================

function runLedgerContextIncoherenceScenario(): void {

  const base =
    buildWrittenResult(
      "RETRY_COMPLETED"
    );

  const ledgerWrite = {

    ...base,

    ledgerEntry: {

      ...base.ledgerEntry!,

      providerResourceId:
        "kms-key-other-runtime",

    },

  } as ProviderRuntimeEvidenceLedgerWriteResult;

  const result =
    admitProviderRuntimeLedgerToAudit(
      buildInput(
        ledgerWrite
      )
    );

  assertNotAdmitted(
    result,
    "LEDGER_RESULT_CONTEXT_INCOHERENT",
    "ledger_result_context_incoherent",
    "ledger result context incoherent"
  );

  pass("ledger result / entry context coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 12 — OUTCOME INCOHERENCE
// ============================================================

function runOutcomeIncoherenceScenarios(): void {

  const base =
    buildWrittenResult(
      "RECOVERY_COMPLETED"
    );

  const resultOutcomeMismatch =
    admitProviderRuntimeLedgerToAudit(
      buildInput({

        ...base,

        ledgerEntry: {

          ...base.ledgerEntry!,

          certifiedExecutionOutcome:
            "RECOVERY_FAILED",

        },

      } as ProviderRuntimeEvidenceLedgerWriteResult)
    );

  assertNotAdmitted(
    resultOutcomeMismatch,
    "LEDGER_RESULT_OUTCOME_INCOHERENT",
    "ledger_result_outcome_incoherent",
    "result / entry outcome mismatch"
  );

  const outcomeResponseMismatch =
    admitProviderRuntimeLedgerToAudit(
      buildInput({

        ...base,

        certifiedExecutionOutcome:
          "FAILOVER_COMPLETED",

        ledgerEntry: {

          ...base.ledgerEntry!,

          certifiedExecutionOutcome:
            "FAILOVER_COMPLETED",

          runtimeResponse:
            "RECOVER",

        },

      } as ProviderRuntimeEvidenceLedgerWriteResult)
    );

  assertNotAdmitted(
    outcomeResponseMismatch,
    "LEDGER_RESULT_OUTCOME_INCOHERENT",
    "ledger_result_outcome_incoherent",
    "outcome / response mismatch"
  );

  pass("certified outcome coherence enforced");

  assertNoCrossLayerFields(
    resultOutcomeMismatch as unknown as Record<string, unknown>
  );

  assertNoCrossLayerFields(
    outcomeResponseMismatch as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 13 — RESPONSE INCOHERENCE
// ============================================================

function runResponseIncoherenceScenario(): void {

  const base =
    buildWrittenResult(
      "FAILOVER_COMPLETED"
    );

  const ledgerWrite = {

    ...base,

    runtimeResponse:
      "RECOVER",

  } as ProviderRuntimeEvidenceLedgerWriteResult;

  const result =
    admitProviderRuntimeLedgerToAudit(
      buildInput(
        ledgerWrite
      )
    );

  assertNotAdmitted(
    result,
    "LEDGER_RESULT_RESPONSE_INCOHERENT",
    "ledger_result_response_incoherent",
    "result / entry response mismatch"
  );

  pass("P9N selected response coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 14 — EXECUTION STATE INCOHERENCE
// ============================================================

function runExecutionStateIncoherenceScenarios(): void {

  const cases: Array<{

    label:
      string;

    mutate:
      (
        value:
          ProviderRuntimeEvidenceLedgerWriteResult
      ) =>
        ProviderRuntimeEvidenceLedgerWriteResult;

  }> = [

    {

      label:
        "execution status mismatch",

      mutate:
        (value) => ({

          ...value,

          responseExecutionStatus:
            "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED",

        }),

    },

    {

      label:
        "execution attempted mismatch",

      mutate:
        (value) => ({

          ...value,

          runtimeResponseExecutionAttempted:
            false,

        }),

    },

    {

      label:
        "execution completed mismatch",

      mutate:
        (value) => ({

          ...value,

          runtimeResponseExecuted:
            false,

        }),

    },

    {

      label:
        "intervention posture mismatch",

      mutate:
        (value) => ({

          ...value,

          runtimeInterventionNotRequired:
            true,

        }),

    },

    {

      label:
        "failure containment mismatch",

      mutate:
        (value) => ({

          ...value,

          executorFailureContained:
            true,

        }),

    },

  ];

  for (const testCase of cases) {

    const result =
      admitProviderRuntimeLedgerToAudit(
        buildInput(
          testCase.mutate(
            buildWrittenResult(
              "RETRY_COMPLETED"
            )
          )
        )
      );

    assertNotAdmitted(
      result,
      "LEDGER_RESULT_EXECUTION_STATE_INCOHERENT",
      "ledger_result_execution_state_incoherent",
      testCase.label
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("P9O execution-state coherence enforced");

}


// ============================================================
// SCENARIO 15 — CONTAINED FAILURE EVIDENCE INSUFFICIENT
// ============================================================

function runContainedFailureEvidenceInsufficientScenarios(): void {

  const cases: Array<{

    label:
      string;

    executorSummary:
      string[] | undefined;

  }> = [

    {

      label:
        "contained failure executor summary absent",

      executorSummary:
        undefined,

    },

    {

      label:
        "contained failure token absent",

      executorSummary: [
        "provider_runtime_response_executor_failed",
      ],

    },

  ];

  for (const testCase of cases) {

    const base =
      buildWrittenResult(
        "RETRY_FAILED"
      );

    const ledgerWrite = {

      ...base,

      ledgerEntry: {

        ...base.ledgerEntry!,

        executorSummary:
          testCase.executorSummary,

      },

    } as ProviderRuntimeEvidenceLedgerWriteResult;

    const result =
      admitProviderRuntimeLedgerToAudit(
        buildInput(
          ledgerWrite
        )
      );

    assertNotAdmitted(
      result,
      "LEDGER_CONTAINED_FAILURE_EVIDENCE_INSUFFICIENT",
      "ledger_contained_failure_evidence_insufficient",
      testCase.label
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("contained-failure evidence sufficiency enforced");

}


// ============================================================
// SCENARIO 16 — PERSISTENCE SUMMARY INSUFFICIENT
// ============================================================

function runPersistenceSummaryInsufficientScenarios(): void {

  const cases: Array<{

    label:
      string;

    mutate:
      (
        value:
          ProviderRuntimeEvidenceLedgerWriteResult
      ) =>
        ProviderRuntimeEvidenceLedgerWriteResult;

  }> = [

    {

      label:
        "persisted summary token absent",

      mutate:
        (value) => ({

          ...value,

          summary: [
            "provider_runtime_evidence_ledger_written",
          ],

        }),

    },

    {

      label:
        "ledger-written summary token absent",

      mutate:
        (value) => ({

          ...value,

          summary: [
            "provider_runtime_evidence_persisted",
          ],

        }),

    },

    {

      label:
        "writer summary absent",

      mutate:
        (value) => ({

          ...value,

          writerSummary:
            undefined,

        }),

    },

    {

      label:
        "writer summary invalid",

      mutate:
        (value) => ({

          ...value,

          writerSummary:
            [],

        }),

    },

  ];

  for (const testCase of cases) {

    const result =
      admitProviderRuntimeLedgerToAudit(
        buildInput(
          testCase.mutate(
            buildWrittenResult(
              "STOP_COMPLETED"
            )
          )
        )
      );

    assertNotAdmitted(
      result,
      "LEDGER_PERSISTENCE_SUMMARY_INSUFFICIENT",
      "ledger_persistence_summary_insufficient",
      testCase.label
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("persistence summary sufficiency enforced");

}


// ============================================================
// SCENARIO 17 — SUCCESSFUL OUTCOME FAMILY
// ============================================================

function runSuccessfulOutcomeFamily(): void {

  for (const outcome of successfulOutcomes) {

    const result =
      admitProviderRuntimeLedgerToAudit(
        buildInput(
          buildWrittenResult(
            outcome
          )
        )
      );

    assertAdmitted(
      result,
      outcome,
      outcome
    );

    assert.equal(
      result.executorFailureContained,
      false,
      `${outcome} remains successful`
    );

    pass(
      `${outcome} audit admitted`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 18 — CONTAINED-FAILURE OUTCOME FAMILY
// ============================================================

function runContainedFailureOutcomeFamily(): void {

  for (const outcome of containedFailureOutcomes) {

    const result =
      admitProviderRuntimeLedgerToAudit(
        buildInput(
          buildWrittenResult(
            outcome
          )
        )
      );

    assertAdmitted(
      result,
      outcome,
      outcome
    );

    assert.equal(
      result.executorFailureContained,
      true,
      `${outcome} failure containment preserved`
    );

    assert(
      result.auditAdmissionMaterial?.executorSummary?.includes(
        "executor_failure_contained"
      ),
      `${outcome} contained-failure evidence preserved`
    );

    pass(
      `${outcome} audit admitted`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIOS 19–21 — AUDIT MATERIAL / IMMUTABILITY
// ============================================================

function runAuditAdmissionMaterialChecks(): void {

  const ledgerWrite =
    buildWrittenResult(
      "ESCALATION_FAILED"
    );

  const ledgerEntry =
    ledgerWrite.ledgerEntry!;

  const responseDecisionSummaryBefore = [
    ...ledgerEntry.responseDecisionSummary,
  ];

  const executorSummaryBefore = [
    ...(ledgerEntry.executorSummary ?? []),
  ];

  const responseExecutionSummaryBefore = [
    ...ledgerEntry.responseExecutionSummary,
  ];

  const certificationSummaryBefore = [
    ...ledgerEntry.certificationSummary,
  ];

  const ledgerWriteSummaryBefore = [
    ...ledgerWrite.summary,
  ];

  const result =
    admitProviderRuntimeLedgerToAudit(
      buildInput(
        ledgerWrite
      )
    );

  assertAdmitted(
    result,
    "ESCALATION_FAILED",
    "audit material composition"
  );

  const material:
    ProviderRuntimeLedgerAuditAdmissionMaterial =
      result.auditAdmissionMaterial!;

  assert.equal(
    material.auditMaterialType,
    "PROVIDER_RUNTIME_LEDGER_WRITE",
    "canonical audit material type preserved"
  );

  assert.equal(
    material.auditMaterialVersion,
    "P9S.1",
    "canonical audit material version preserved"
  );

  assert.equal(
    material.persistenceId,
    ledgerWrite.persistenceId,
    "persistence identifier preserved"
  );

  assert.equal(
    material.ledgerEntryId,
    ledgerWrite.ledgerEntryId,
    "ledger-entry identifier preserved"
  );

  assert.equal(
    material.ledgerSequence,
    ledgerWrite.ledgerSequence,
    "ledger sequence preserved"
  );

  assert.equal(
    material.persistedAt,
    ledgerWrite.persistedAt,
    "persistence timestamp preserved"
  );

  assert.equal(
    material.ledgerEntryType,
    ledgerEntry.ledgerEntryType,
    "ledger entry type preserved"
  );

  assert.equal(
    material.ledgerEntryVersion,
    ledgerEntry.ledgerEntryVersion,
    "ledger entry version preserved"
  );

  assert.equal(
    material.certifiedExecutionOutcome,
    ledgerEntry.certifiedExecutionOutcome,
    "certified execution outcome preserved"
  );

  assert.equal(
    material.providerContract,
    ledgerEntry.providerContract,
    "provider contract preserved"
  );

  assert.equal(
    material.providerImplementation,
    ledgerEntry.providerImplementation,
    "provider implementation preserved"
  );

  assert.equal(
    material.operation,
    ledgerEntry.operation,
    "operation preserved"
  );

  assert.equal(
    material.runtimeResponse,
    ledgerEntry.runtimeResponse,
    "P9N selected response preserved"
  );

  assert.equal(
    material.responseExecutionStatus,
    ledgerEntry.responseExecutionStatus,
    "P9O execution state preserved"
  );

  assert.equal(
    material.executorFailureContained,
    ledgerEntry.executorFailureContained,
    "P9P failure-containment posture preserved"
  );

  assert.deepEqual(
    material.responseDecisionSummary,
    responseDecisionSummaryBefore,
    "response-decision summary copied"
  );

  assert.deepEqual(
    material.executorSummary,
    executorSummaryBefore,
    "executor summary copied"
  );

  assert.deepEqual(
    material.responseExecutionSummary,
    responseExecutionSummaryBefore,
    "response-execution summary copied"
  );

  assert.deepEqual(
    material.certificationSummary,
    certificationSummaryBefore,
    "certification summary copied"
  );

  assert.deepEqual(
    material.ledgerWriteSummary,
    ledgerWriteSummaryBefore,
    "ledger-write summary copied"
  );

  assert.notEqual(
    material.responseDecisionSummary,
    ledgerEntry.responseDecisionSummary,
    "response-decision summary copied defensively"
  );

  assert.notEqual(
    material.executorSummary,
    ledgerEntry.executorSummary,
    "executor summary copied defensively"
  );

  assert.notEqual(
    material.responseExecutionSummary,
    ledgerEntry.responseExecutionSummary,
    "response-execution summary copied defensively"
  );

  assert.notEqual(
    material.certificationSummary,
    ledgerEntry.certificationSummary,
    "certification summary copied defensively"
  );

  assert.notEqual(
    material.ledgerWriteSummary,
    ledgerWrite.summary,
    "ledger-write summary copied defensively"
  );

  material.responseDecisionSummary.push(
    "audit_material_mutation_probe"
  );

  material.executorSummary?.push(
    "audit_material_mutation_probe"
  );

  material.responseExecutionSummary.push(
    "audit_material_mutation_probe"
  );

  material.certificationSummary.push(
    "audit_material_mutation_probe"
  );

  material.ledgerWriteSummary.push(
    "audit_material_mutation_probe"
  );

  assert.deepEqual(
    ledgerEntry.responseDecisionSummary,
    responseDecisionSummaryBefore,
    "source response-decision summary not mutated"
  );

  assert.deepEqual(
    ledgerEntry.executorSummary,
    executorSummaryBefore,
    "source executor summary not mutated"
  );

  assert.deepEqual(
    ledgerEntry.responseExecutionSummary,
    responseExecutionSummaryBefore,
    "source response-execution summary not mutated"
  );

  assert.deepEqual(
    ledgerEntry.certificationSummary,
    certificationSummaryBefore,
    "source certification summary not mutated"
  );

  assert.deepEqual(
    ledgerWrite.summary,
    ledgerWriteSummaryBefore,
    "source ledger-write summary not mutated"
  );

  pass("canonical audit-admission material composition verified");
  pass("defensive audit-material summary copying verified");
  pass("P9R ledger-write result immutability verified");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 22 — LINEAGE PROPAGATION
// ============================================================

function runLineagePropagationChecks(): void {

  const ledgerWrite =
    buildWrittenResult(
      "RECOVERY_COMPLETED"
    );

  const result =
    admitProviderRuntimeLedgerToAudit(
      buildInput(
        ledgerWrite
      )
    );

  assertAdmitted(
    result,
    "RECOVERY_COMPLETED",
    "lineage propagation"
  );

  assert.equal(
    result.providerContract,
    ledgerWrite.providerContract,
    "providerContract propagated"
  );

  assert.equal(
    result.providerImplementation,
    ledgerWrite.providerImplementation,
    "providerImplementation propagated"
  );

  assert.equal(
    result.operation,
    ledgerWrite.operation,
    "operation propagated"
  );

  assert.equal(
    result.providerResourceId,
    ledgerWrite.providerResourceId,
    "providerResourceId propagated"
  );

  assert.equal(
    result.providerConfigurationRef,
    ledgerWrite.providerConfigurationRef,
    "providerConfigurationRef propagated"
  );

  assert.equal(
    result.providerCredentialRef,
    ledgerWrite.providerCredentialRef,
    "providerCredentialRef propagated"
  );

  assert.deepEqual(
    result.executionMetadata,
    ledgerWrite.executionMetadata,
    "executionMetadata propagated"
  );

  assert.equal(
    result.verificationStatus,
    ledgerWrite.verificationStatus,
    "verificationStatus propagated"
  );

  assert.equal(
    result.verificationFailureReason,
    ledgerWrite.verificationFailureReason,
    "verificationFailureReason propagated"
  );

  assert.equal(
    result.classificationStatus,
    ledgerWrite.classificationStatus,
    "classificationStatus propagated"
  );

  assert.equal(
    result.runtimeFailureClass,
    ledgerWrite.runtimeFailureClass,
    "runtimeFailureClass propagated"
  );

  assert.equal(
    result.runtimeFailureSeverity,
    ledgerWrite.runtimeFailureSeverity,
    "runtimeFailureSeverity propagated"
  );

  assert.equal(
    result.failureCode,
    ledgerWrite.failureCode,
    "failureCode propagated"
  );

  assert.equal(
    result.providerRawStatus,
    ledgerWrite.providerRawStatus,
    "providerRawStatus propagated"
  );

  assert.equal(
    result.providerRawErrorCode,
    ledgerWrite.providerRawErrorCode,
    "providerRawErrorCode propagated"
  );

  assert.equal(
    result.providerSanitizedErrorMessage,
    ledgerWrite.providerSanitizedErrorMessage,
    "providerSanitizedErrorMessage propagated"
  );

  assert.equal(
    result.retryable,
    ledgerWrite.retryable,
    "retryable propagated"
  );

  assert.equal(
    result.recoveryIntakeRequired,
    ledgerWrite.recoveryIntakeRequired,
    "recoveryIntakeRequired propagated"
  );

  assert.equal(
    result.recoveryIntakeReady,
    ledgerWrite.recoveryIntakeReady,
    "recoveryIntakeReady propagated"
  );

  assert.equal(
    result.recoveryReason,
    ledgerWrite.recoveryReason,
    "recoveryReason propagated"
  );

  assert.equal(
    result.runtimeResponse,
    ledgerWrite.runtimeResponse,
    "runtimeResponse propagated"
  );

  assert.equal(
    result.responseExecutionStatus,
    ledgerWrite.responseExecutionStatus,
    "responseExecutionStatus propagated"
  );

  assert.equal(
    result.runtimeResponseExecutionAttempted,
    ledgerWrite.runtimeResponseExecutionAttempted,
    "runtimeResponseExecutionAttempted propagated"
  );

  assert.equal(
    result.runtimeResponseExecuted,
    ledgerWrite.runtimeResponseExecuted,
    "runtimeResponseExecuted propagated"
  );

  assert.equal(
    result.runtimeInterventionNotRequired,
    ledgerWrite.runtimeInterventionNotRequired,
    "runtimeInterventionNotRequired propagated"
  );

  assert.equal(
    result.executorFailureContained,
    ledgerWrite.executorFailureContained,
    "executorFailureContained propagated"
  );

  assert.equal(
    result.persistenceId,
    ledgerWrite.persistenceId,
    "persistenceId propagated"
  );

  assert.equal(
    result.ledgerEntryId,
    ledgerWrite.ledgerEntryId,
    "ledgerEntryId propagated"
  );

  assert.equal(
    result.ledgerSequence,
    ledgerWrite.ledgerSequence,
    "ledgerSequence propagated"
  );

  assert.equal(
    result.persistedAt,
    ledgerWrite.persistedAt,
    "persistedAt propagated"
  );

  assert.deepEqual(
    result.ledgerWriteSummary,
    ledgerWrite.summary,
    "ledgerWriteSummary propagated"
  );

  assert.notEqual(
    result.ledgerWriteSummary,
    ledgerWrite.summary,
    "ledgerWriteSummary copied defensively"
  );

  pass("provider/runtime context propagated");
  pass("P9L/P9M/P9N/P9O/P9P/P9Q/P9R lineage propagated");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 23 — BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const results:
    ProviderRuntimeLedgerAuditAdmissionResult[] = [

      admitProviderRuntimeLedgerToAudit(
        buildInput(
          buildWrittenResult(
            "NO_ACTION_COMPLETED"
          )
        )
      ),

      admitProviderRuntimeLedgerToAudit(
        buildInput(
          buildWrittenResult(
            "RETRY_FAILED"
          )
        )
      ),

      admitProviderRuntimeLedgerToAudit(
        buildInput(
          buildWriteDenied()
        )
      ),

      admitProviderRuntimeLedgerToAudit(
        buildInput(
          buildNotWritten()
        )
      ),

      admitProviderRuntimeLedgerToAudit(
        buildInput(
          buildWrittenResult(
            "FAILOVER_COMPLETED"
          ),
          {

            auditAdmissionDecision:
              "REJECT_PROVIDER_RUNTIME_LEDGER_AUDIT_ADMISSION",

          }
        )
      ),

  ];

  for (const result of results) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("P9S audit-admission boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runAuditAdmissionRejectedScenario();

  runLedgerWriteDeniedScenario();

  runLedgerNotWrittenScenario();

  runEvidenceNotPersistedScenario();

  runLedgerEntryMissingScenario();

  runDurableIdentifierRequirementScenarios();

  runLedgerEntryShapeInvalidScenarios();

  runLedgerContextIncoherenceScenario();

  runOutcomeIncoherenceScenarios();

  runResponseIncoherenceScenario();

  runExecutionStateIncoherenceScenarios();

  runContainedFailureEvidenceInsufficientScenarios();

  runPersistenceSummaryInsufficientScenarios();

  runSuccessfulOutcomeFamily();

  runContainedFailureOutcomeFamily();

  runAuditAdmissionMaterialChecks();

  runLineagePropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9S PROVIDER RUNTIME LEDGER AUDIT ADMISSION");
  console.log("========================================");
  console.log("");

  console.log("Audit Admission Gates:");
  console.log("✓ audit admission rejected → DENIED");
  console.log("✓ P9R ledger write denied → DENIED");
  console.log("✓ ledger not written → NOT_ADMITTED");
  console.log("✓ denied and not-admitted states remain distinct");

  console.log("");
  console.log("Durable Ledger Requirements:");
  console.log("✓ evidence persisted");
  console.log("✓ canonical ledger entry present");
  console.log("✓ persistence identifier present");
  console.log("✓ ledger-entry identifier present");
  console.log("✓ positive ledger sequence present");
  console.log("✓ persistence timestamp present");

  console.log("");
  console.log("Integrity Gates:");
  console.log("✓ canonical ledger-entry shape");
  console.log("✓ P9R result / entry context coherence");
  console.log("✓ P9P certified-outcome coherence");
  console.log("✓ P9N selected-response coherence");
  console.log("✓ P9O execution-state coherence");
  console.log("✓ contained-failure evidence sufficiency");
  console.log("✓ persistence summary sufficiency");

  console.log("");
  console.log("Successful Outcome Audit Admission:");
  console.log("✓ NO_ACTION_COMPLETED");
  console.log("✓ RETRY_COMPLETED");
  console.log("✓ RECOVERY_COMPLETED");
  console.log("✓ FAILOVER_COMPLETED");
  console.log("✓ STOP_COMPLETED");
  console.log("✓ ESCALATION_COMPLETED");

  console.log("");
  console.log("Contained-Failure Outcome Audit Admission:");
  console.log("✓ RETRY_FAILED");
  console.log("✓ RECOVERY_FAILED");
  console.log("✓ FAILOVER_FAILED");
  console.log("✓ STOP_FAILED");
  console.log("✓ ESCALATION_FAILED");

  console.log("");
  console.log("Audit Admission Material:");
  console.log("✓ material type PROVIDER_RUNTIME_LEDGER_WRITE");
  console.log("✓ material version P9S.1");
  console.log("✓ durable identifiers preserved");
  console.log("✓ ledger-entry identity preserved");
  console.log("✓ provider/runtime context preserved");
  console.log("✓ P9L verification context preserved");
  console.log("✓ P9M classification context preserved");
  console.log("✓ P9N selected response preserved");
  console.log("✓ P9O execution state preserved");
  console.log("✓ P9P certified outcome preserved");
  console.log("✓ P9Q evidence lineage preserved");
  console.log("✓ P9R durable write preserved");
  console.log("✓ summaries copied defensively");
  console.log("✓ source ledger-write result not mutated");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no runtime verification");
  console.log("✓ no runtime failure classification");
  console.log("✓ no runtime response decision");
  console.log("✓ no runtime response execution");
  console.log("✓ no governed response executor invocation");
  console.log("✓ no execution-outcome certification");
  console.log("✓ no evidence admission");
  console.log("✓ no evidence persistence");
  console.log("✓ no ledger-writer invocation");
  console.log("✓ no ledger write");
  console.log("✓ no provider API / SDK calls");
  console.log("✓ no provider-error re-sanitization");
  console.log("✓ no sanitized failure-surface alteration");
  console.log("✓ no response replacement");
  console.log("✓ no P9O/P9P/P9Q/P9R result alteration");
  console.log("✓ no audit execution");
  console.log("✓ no audit record write");
  console.log("✓ no audit finding");
  console.log("✓ no ledger-history verification");
  console.log("✓ no chain-continuity verification");
  console.log("✓ no cryptographic-proof verification");

  console.log("");
  console.log("========================================");
  console.log("P9S.1 PROVIDER RUNTIME LEDGER AUDIT ADMISSION VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();