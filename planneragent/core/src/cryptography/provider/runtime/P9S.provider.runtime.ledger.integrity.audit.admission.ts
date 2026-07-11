// ============================================================
// PlannerAgent — Provider Runtime Ledger Integrity / Audit Admission
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9S.provider.runtime.ledger.integrity.audit.admission.ts
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
// P9S.1 — Provider Runtime Ledger Integrity / Audit Admission
//
// PURPOSE
// ------------------------------------------------------------
// Validate a completed P9R provider-runtime ledger
// write and admit that durable write into the
// governed audit domain.
//
// P9S receives:
//
// - ProviderRuntimeEvidenceLedgerWriteResult
// - an explicit audit-admission decision gate
//
// P9S validates:
//
// - P9R write completion
// - durable identifier presence
// - ledger-entry presence and shape
// - P9R result / ledger-entry coherence
// - certified outcome coherence
// - response and execution-state coherence
// - contained-failure evidence sufficiency
// - persistence summary sufficiency
//
// P9S produces:
//
// - one canonical audit-admission material
//
// P9S does not verify runtime.
//
// P9S does not classify runtime failure.
//
// P9S does not decide runtime response.
//
// P9S does not execute runtime response.
//
// P9S does not certify execution outcome.
//
// P9S does not admit evidence to ledger.
//
// P9S does not persist evidence.
//
// P9S does not write ledger.
//
// P9S does not perform audit.
//
// P9S does not write audit records.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// P9P certifies execution outcome.
//
// P9Q admits canonical evidence.
//
// P9R persists evidence and writes ledger.
//
// P9S admits the durable ledger fact into
// the governed audit domain.
//
// Ledger Entry Written
// ≠
// Ledger Integrity Established
//
// Ledger Integrity Established
// ≠
// Audit Admission Granted
//
// Audit Admission Granted
// ≠
// Audit Performed
//
// ============================================================

import type {
  ProviderRuntimeEvidenceLedgerEntry,
  ProviderRuntimeEvidenceLedgerWriteResult,
} from "./P9R.provider.runtime.evidence.persistence.ledger.write";


// ============================================================
// AUDIT ADMISSION STATUS
// ============================================================

export type ProviderRuntimeLedgerAuditAdmissionStatus =
  | "PROVIDER_RUNTIME_LEDGER_AUDIT_ADMITTED"
  | "PROVIDER_RUNTIME_LEDGER_AUDIT_NOT_ADMITTED"
  | "PROVIDER_RUNTIME_LEDGER_AUDIT_ADMISSION_DENIED";


// ============================================================
// AUDIT ADMISSION DECISION
// ============================================================

export type ProviderRuntimeLedgerAuditAdmissionDecision =
  | "ADMIT_PROVIDER_RUNTIME_LEDGER_TO_AUDIT"
  | "REJECT_PROVIDER_RUNTIME_LEDGER_AUDIT_ADMISSION";


// ============================================================
// AUDIT ADMISSION DENIAL REASON
// ============================================================

export type ProviderRuntimeLedgerAuditAdmissionDenialReason =
  | "RUNTIME_LEDGER_AUDIT_ADMISSION_NOT_ALLOWED"
  | "RUNTIME_EVIDENCE_LEDGER_WRITE_DENIED";


// ============================================================
// AUDIT ADMISSION FAILURE REASON
// ============================================================

export type ProviderRuntimeLedgerAuditAdmissionFailureReason =
  | "RUNTIME_EVIDENCE_LEDGER_NOT_WRITTEN"
  | "RUNTIME_EVIDENCE_NOT_PERSISTED"
  | "LEDGER_ENTRY_MISSING"
  | "PERSISTENCE_ID_MISSING"
  | "LEDGER_ENTRY_ID_MISSING"
  | "LEDGER_SEQUENCE_INVALID"
  | "PERSISTENCE_TIMESTAMP_MISSING"
  | "LEDGER_ENTRY_SHAPE_INVALID"
  | "LEDGER_RESULT_CONTEXT_INCOHERENT"
  | "LEDGER_RESULT_OUTCOME_INCOHERENT"
  | "LEDGER_RESULT_RESPONSE_INCOHERENT"
  | "LEDGER_RESULT_EXECUTION_STATE_INCOHERENT"
  | "LEDGER_CONTAINED_FAILURE_EVIDENCE_INSUFFICIENT"
  | "LEDGER_PERSISTENCE_SUMMARY_INSUFFICIENT";


// ============================================================
// AUDIT ADMISSION MATERIAL
// ============================================================

export interface ProviderRuntimeLedgerAuditAdmissionMaterial {

  auditMaterialType:
    "PROVIDER_RUNTIME_LEDGER_WRITE";

  auditMaterialVersion:
    "P9S.1";

  persistenceId:
    string;

  ledgerEntryId:
    string;

  ledgerSequence:
    number;

  persistedAt:
    string;

  ledgerEntryType:
    ProviderRuntimeEvidenceLedgerEntry["ledgerEntryType"];

  ledgerEntryVersion:
    ProviderRuntimeEvidenceLedgerEntry["ledgerEntryVersion"];

  certifiedExecutionOutcome:
    ProviderRuntimeEvidenceLedgerEntry["certifiedExecutionOutcome"];

  providerContract:
    ProviderRuntimeEvidenceLedgerEntry["providerContract"];

  providerImplementation:
    ProviderRuntimeEvidenceLedgerEntry["providerImplementation"];

  operation:
    ProviderRuntimeEvidenceLedgerEntry["operation"];

  providerResourceId?:
    ProviderRuntimeEvidenceLedgerEntry["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeEvidenceLedgerEntry["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeEvidenceLedgerEntry["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeEvidenceLedgerEntry["executionMetadata"];

  verificationStatus:
    ProviderRuntimeEvidenceLedgerEntry["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeEvidenceLedgerEntry["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeEvidenceLedgerEntry["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeEvidenceLedgerEntry["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeEvidenceLedgerEntry["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeEvidenceLedgerEntry["failureCode"];

  providerRawStatus?:
    ProviderRuntimeEvidenceLedgerEntry["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeEvidenceLedgerEntry["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeEvidenceLedgerEntry["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeEvidenceLedgerEntry["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeEvidenceLedgerEntry["recoveryIntakeRequired"];

  recoveryIntakeReady:
    ProviderRuntimeEvidenceLedgerEntry["recoveryIntakeReady"];

  recoveryReason?:
    ProviderRuntimeEvidenceLedgerEntry["recoveryReason"];

  runtimeResponse:
    ProviderRuntimeEvidenceLedgerEntry["runtimeResponse"];

  responseExecutionStatus:
    ProviderRuntimeEvidenceLedgerEntry["responseExecutionStatus"];

  runtimeResponseExecutionAttempted:
    ProviderRuntimeEvidenceLedgerEntry["runtimeResponseExecutionAttempted"];

  runtimeResponseExecuted:
    ProviderRuntimeEvidenceLedgerEntry["runtimeResponseExecuted"];

  runtimeInterventionNotRequired:
    ProviderRuntimeEvidenceLedgerEntry["runtimeInterventionNotRequired"];

  executorFailureContained:
    ProviderRuntimeEvidenceLedgerEntry["executorFailureContained"];

  responseDecisionSummary:
    string[];

  executorSummary?:
    string[];

  responseExecutionSummary:
    string[];

  certificationSummary:
    string[];

  ledgerWriteSummary:
    string[];

}


// ============================================================
// INPUT
// ============================================================

export interface ProviderRuntimeLedgerAuditAdmissionInput {

  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult;

  auditAdmissionDecision:
    ProviderRuntimeLedgerAuditAdmissionDecision;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderRuntimeLedgerAuditAdmissionResult {

  auditAdmissionStatus:
    ProviderRuntimeLedgerAuditAdmissionStatus;

  auditAdmissionDecision:
    ProviderRuntimeLedgerAuditAdmissionDecision;

  runtimeLedgerAuditAdmissionAttempted:
    boolean;

  runtimeLedgerAuditAdmitted:
    boolean;

  runtimeLedgerAuditAdmissionDenied:
    boolean;

  auditAdmissionDenialReason?:
    ProviderRuntimeLedgerAuditAdmissionDenialReason;

  auditAdmissionFailureReason?:
    ProviderRuntimeLedgerAuditAdmissionFailureReason;

  persistenceId?:
    ProviderRuntimeEvidenceLedgerWriteResult["persistenceId"];

  ledgerEntryId?:
    ProviderRuntimeEvidenceLedgerWriteResult["ledgerEntryId"];

  ledgerSequence?:
    ProviderRuntimeEvidenceLedgerWriteResult["ledgerSequence"];

  persistedAt?:
    ProviderRuntimeEvidenceLedgerWriteResult["persistedAt"];

  certifiedExecutionOutcome?:
    ProviderRuntimeEvidenceLedgerWriteResult["certifiedExecutionOutcome"];

  providerContract:
    ProviderRuntimeEvidenceLedgerWriteResult["providerContract"];

  providerImplementation:
    ProviderRuntimeEvidenceLedgerWriteResult["providerImplementation"];

  operation:
    ProviderRuntimeEvidenceLedgerWriteResult["operation"];

  providerResourceId?:
    ProviderRuntimeEvidenceLedgerWriteResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeEvidenceLedgerWriteResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeEvidenceLedgerWriteResult["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeEvidenceLedgerWriteResult["executionMetadata"];

  verificationStatus:
    ProviderRuntimeEvidenceLedgerWriteResult["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeEvidenceLedgerWriteResult["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeEvidenceLedgerWriteResult["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeEvidenceLedgerWriteResult["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeEvidenceLedgerWriteResult["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeEvidenceLedgerWriteResult["failureCode"];

  providerRawStatus?:
    ProviderRuntimeEvidenceLedgerWriteResult["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeEvidenceLedgerWriteResult["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeEvidenceLedgerWriteResult["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeEvidenceLedgerWriteResult["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeEvidenceLedgerWriteResult["recoveryIntakeRequired"];

  recoveryIntakeReady:
    ProviderRuntimeEvidenceLedgerWriteResult["recoveryIntakeReady"];

  recoveryReason?:
    ProviderRuntimeEvidenceLedgerWriteResult["recoveryReason"];

  runtimeResponse?:
    ProviderRuntimeEvidenceLedgerWriteResult["runtimeResponse"];

  responseExecutionStatus:
    ProviderRuntimeEvidenceLedgerWriteResult["responseExecutionStatus"];

  runtimeResponseExecutionAttempted:
    ProviderRuntimeEvidenceLedgerWriteResult["runtimeResponseExecutionAttempted"];

  runtimeResponseExecuted:
    ProviderRuntimeEvidenceLedgerWriteResult["runtimeResponseExecuted"];

  runtimeInterventionNotRequired:
    ProviderRuntimeEvidenceLedgerWriteResult["runtimeInterventionNotRequired"];

  executorFailureContained:
    ProviderRuntimeEvidenceLedgerWriteResult["executorFailureContained"];

  auditAdmissionMaterial?:
    ProviderRuntimeLedgerAuditAdmissionMaterial;

  ledgerWriteSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// SAFE SUMMARY COPYING
// ============================================================

function copySummary(
  value: unknown
): string[] {

  if (!Array.isArray(value)) {

    return [];

  }

  return value.filter(
    (entry): entry is string =>
      typeof entry === "string"
  );

}


// ============================================================
// BASIC VALUE HELPERS
// ============================================================

function hasNonEmptyString(
  value: unknown
): value is string {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );

}


function isPositiveInteger(
  value: unknown
): value is number {

  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );

}


// ============================================================
// CERTIFIED OUTCOME COHERENCE
// ============================================================

function expectedRuntimeResponseForOutcome(
  outcome:
    ProviderRuntimeEvidenceLedgerEntry["certifiedExecutionOutcome"]
): ProviderRuntimeEvidenceLedgerEntry["runtimeResponse"] {

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


function outcomeRepresentsContainedFailure(
  outcome:
    ProviderRuntimeEvidenceLedgerEntry["certifiedExecutionOutcome"]
): boolean {

  switch (outcome) {

    case "RETRY_FAILED":
    case "RECOVERY_FAILED":
    case "FAILOVER_FAILED":
    case "STOP_FAILED":
    case "ESCALATION_FAILED":
      return true;

    default:
      return false;

  }

}


// ============================================================
// LEDGER ENTRY SHAPE
// ============================================================

function ledgerEntryShapeIsValid(
  ledgerEntry:
    ProviderRuntimeEvidenceLedgerEntry
): boolean {

  return (

    ledgerEntry.ledgerEntryType ===
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME" &&

    ledgerEntry.ledgerEntryVersion ===
      "P9R.1" &&

    hasNonEmptyString(
      ledgerEntry.certifiedExecutionOutcome
    ) &&

    hasNonEmptyString(
      ledgerEntry.providerContract
    ) &&

    hasNonEmptyString(
      ledgerEntry.providerImplementation
    ) &&

    hasNonEmptyString(
      ledgerEntry.operation
    ) &&

    hasNonEmptyString(
      ledgerEntry.verificationStatus
    ) &&

    hasNonEmptyString(
      ledgerEntry.classificationStatus
    ) &&

    hasNonEmptyString(
      ledgerEntry.runtimeResponse
    ) &&

    hasNonEmptyString(
      ledgerEntry.responseExecutionStatus
    ) &&

    typeof ledgerEntry.runtimeResponseExecutionAttempted ===
      "boolean" &&

    typeof ledgerEntry.runtimeResponseExecuted ===
      "boolean" &&

    typeof ledgerEntry.runtimeInterventionNotRequired ===
      "boolean" &&

    typeof ledgerEntry.executorFailureContained ===
      "boolean" &&

    copySummary(
      ledgerEntry.responseDecisionSummary
    ).length > 0 &&

    copySummary(
      ledgerEntry.responseExecutionSummary
    ).length > 0 &&

    copySummary(
      ledgerEntry.certificationSummary
    ).length > 0

  );

}


// ============================================================
// LEDGER RESULT / ENTRY CONTEXT COHERENCE
// ============================================================

function ledgerResultContextMatchesEntry(
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult,
  ledgerEntry:
    ProviderRuntimeEvidenceLedgerEntry
): boolean {

  return (

    ledgerWrite.providerContract ===
      ledgerEntry.providerContract &&

    ledgerWrite.providerImplementation ===
      ledgerEntry.providerImplementation &&

    ledgerWrite.operation ===
      ledgerEntry.operation &&

    ledgerWrite.providerResourceId ===
      ledgerEntry.providerResourceId &&

    ledgerWrite.providerConfigurationRef ===
      ledgerEntry.providerConfigurationRef &&

    ledgerWrite.providerCredentialRef ===
      ledgerEntry.providerCredentialRef &&

    ledgerWrite.verificationStatus ===
      ledgerEntry.verificationStatus &&

    ledgerWrite.verificationFailureReason ===
      ledgerEntry.verificationFailureReason &&

    ledgerWrite.classificationStatus ===
      ledgerEntry.classificationStatus &&

    ledgerWrite.runtimeFailureClass ===
      ledgerEntry.runtimeFailureClass &&

    ledgerWrite.runtimeFailureSeverity ===
      ledgerEntry.runtimeFailureSeverity &&

    ledgerWrite.failureCode ===
      ledgerEntry.failureCode &&

    ledgerWrite.providerRawStatus ===
      ledgerEntry.providerRawStatus &&

    ledgerWrite.providerRawErrorCode ===
      ledgerEntry.providerRawErrorCode &&

    ledgerWrite.providerSanitizedErrorMessage ===
      ledgerEntry.providerSanitizedErrorMessage &&

    ledgerWrite.retryable ===
      ledgerEntry.retryable &&

    ledgerWrite.recoveryIntakeRequired ===
      ledgerEntry.recoveryIntakeRequired &&

    ledgerWrite.recoveryIntakeReady ===
      ledgerEntry.recoveryIntakeReady &&

    ledgerWrite.recoveryReason ===
      ledgerEntry.recoveryReason

  );

}


// ============================================================
// OUTCOME / RESPONSE / EXECUTION COHERENCE
// ============================================================

function ledgerOutcomeIsCoherent(
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult,
  ledgerEntry:
    ProviderRuntimeEvidenceLedgerEntry
): boolean {

  return (

    ledgerWrite.certifiedExecutionOutcome ===
      ledgerEntry.certifiedExecutionOutcome &&

    expectedRuntimeResponseForOutcome(
      ledgerEntry.certifiedExecutionOutcome
    ) ===
      ledgerEntry.runtimeResponse

  );

}


function ledgerResponseIsCoherent(
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult,
  ledgerEntry:
    ProviderRuntimeEvidenceLedgerEntry
): boolean {

  return (
    ledgerWrite.runtimeResponse ===
    ledgerEntry.runtimeResponse
  );

}


function ledgerExecutionStateIsCoherent(
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult,
  ledgerEntry:
    ProviderRuntimeEvidenceLedgerEntry
): boolean {

  const containedFailure =
    outcomeRepresentsContainedFailure(
      ledgerEntry.certifiedExecutionOutcome
    );

  if (
    ledgerWrite.responseExecutionStatus !==
      ledgerEntry.responseExecutionStatus ||
    ledgerWrite.runtimeResponseExecutionAttempted !==
      ledgerEntry.runtimeResponseExecutionAttempted ||
    ledgerWrite.runtimeResponseExecuted !==
      ledgerEntry.runtimeResponseExecuted ||
    ledgerWrite.runtimeInterventionNotRequired !==
      ledgerEntry.runtimeInterventionNotRequired ||
    ledgerWrite.executorFailureContained !==
      ledgerEntry.executorFailureContained
  ) {

    return false;

  }

  if (
    ledgerEntry.runtimeResponseExecutionAttempted !==
    true
  ) {

    return false;

  }

  if (
    containedFailure
  ) {

    return (

      ledgerEntry.executorFailureContained ===
        true &&

      ledgerEntry.runtimeResponseExecuted ===
        false &&

      ledgerEntry.responseExecutionStatus ===
        "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED"

    );

  }

  return (

    ledgerEntry.executorFailureContained ===
      false &&

    ledgerEntry.runtimeResponseExecuted ===
      true &&

    ledgerEntry.responseExecutionStatus ===
      "PROVIDER_RUNTIME_RESPONSE_EXECUTED"

  );

}


// ============================================================
// CONTAINED FAILURE SUFFICIENCY
// ============================================================

function containedFailureEvidenceIsSufficient(
  ledgerEntry:
    ProviderRuntimeEvidenceLedgerEntry
): boolean {

  if (
    !outcomeRepresentsContainedFailure(
      ledgerEntry.certifiedExecutionOutcome
    )
  ) {

    return true;

  }

  const executorSummary =
    copySummary(
      ledgerEntry.executorSummary
    );

  return (

    executorSummary.length > 0 &&

    executorSummary.includes(
      "executor_failure_contained"
    ) &&

    ledgerEntry.executorFailureContained ===
      true

  );

}


// ============================================================
// PERSISTENCE SUMMARY SUFFICIENCY
// ============================================================

function persistenceSummaryIsSufficient(
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult
): boolean {

  const writeSummary =
    copySummary(
      ledgerWrite.summary
    );

  const writerSummary =
    copySummary(
      ledgerWrite.writerSummary
    );

  return (

    writeSummary.includes(
      "provider_runtime_evidence_persisted"
    ) &&

    writeSummary.includes(
      "provider_runtime_evidence_ledger_written"
    ) &&

    writerSummary.length > 0

  );

}


// ============================================================
// SHARED RESULT CONTEXT
// ============================================================

function resultContext(
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult
) {

  return {

    persistenceId:
      ledgerWrite.persistenceId,

    ledgerEntryId:
      ledgerWrite.ledgerEntryId,

    ledgerSequence:
      ledgerWrite.ledgerSequence,

    persistedAt:
      ledgerWrite.persistedAt,

    certifiedExecutionOutcome:
      ledgerWrite.certifiedExecutionOutcome,

    providerContract:
      ledgerWrite.providerContract,

    providerImplementation:
      ledgerWrite.providerImplementation,

    operation:
      ledgerWrite.operation,

    providerResourceId:
      ledgerWrite.providerResourceId,

    providerConfigurationRef:
      ledgerWrite.providerConfigurationRef,

    providerCredentialRef:
      ledgerWrite.providerCredentialRef,

    executionMetadata:
      ledgerWrite.executionMetadata,

    verificationStatus:
      ledgerWrite.verificationStatus,

    verificationFailureReason:
      ledgerWrite.verificationFailureReason,

    classificationStatus:
      ledgerWrite.classificationStatus,

    runtimeFailureClass:
      ledgerWrite.runtimeFailureClass,

    runtimeFailureSeverity:
      ledgerWrite.runtimeFailureSeverity,

    failureCode:
      ledgerWrite.failureCode,

    providerRawStatus:
      ledgerWrite.providerRawStatus,

    providerRawErrorCode:
      ledgerWrite.providerRawErrorCode,

    providerSanitizedErrorMessage:
      ledgerWrite.providerSanitizedErrorMessage,

    retryable:
      ledgerWrite.retryable,

    recoveryIntakeRequired:
      ledgerWrite.recoveryIntakeRequired,

    recoveryIntakeReady:
      ledgerWrite.recoveryIntakeReady,

    recoveryReason:
      ledgerWrite.recoveryReason,

    runtimeResponse:
      ledgerWrite.runtimeResponse,

    responseExecutionStatus:
      ledgerWrite.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      ledgerWrite.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      ledgerWrite.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      ledgerWrite.runtimeInterventionNotRequired,

    executorFailureContained:
      ledgerWrite.executorFailureContained,

    ledgerWriteSummary:
      copySummary(
        ledgerWrite.summary
      ),

  };

}


// ============================================================
// DENIED RESULT
// ============================================================

function buildDeniedResult(
  input:
    ProviderRuntimeLedgerAuditAdmissionInput,
  auditAdmissionDenialReason:
    ProviderRuntimeLedgerAuditAdmissionDenialReason,
  summaryToken:
    string
): ProviderRuntimeLedgerAuditAdmissionResult {

  return {

    auditAdmissionStatus:
      "PROVIDER_RUNTIME_LEDGER_AUDIT_ADMISSION_DENIED",

    auditAdmissionDecision:
      input.auditAdmissionDecision,

    runtimeLedgerAuditAdmissionAttempted:
      false,

    runtimeLedgerAuditAdmitted:
      false,

    runtimeLedgerAuditAdmissionDenied:
      true,

    auditAdmissionDenialReason,

    ...resultContext(
      input.ledgerWrite
    ),

    summary: [
      ...copySummary(
        input.ledgerWrite.summary
      ),
      "provider_runtime_ledger_audit_admission_denied",
      summaryToken,
    ],

  };

}


// ============================================================
// NOT ADMITTED RESULT
// ============================================================

function buildNotAdmittedResult(
  input:
    ProviderRuntimeLedgerAuditAdmissionInput,
  auditAdmissionFailureReason:
    ProviderRuntimeLedgerAuditAdmissionFailureReason,
  summaryToken:
    string
): ProviderRuntimeLedgerAuditAdmissionResult {

  return {

    auditAdmissionStatus:
      "PROVIDER_RUNTIME_LEDGER_AUDIT_NOT_ADMITTED",

    auditAdmissionDecision:
      input.auditAdmissionDecision,

    runtimeLedgerAuditAdmissionAttempted:
      true,

    runtimeLedgerAuditAdmitted:
      false,

    runtimeLedgerAuditAdmissionDenied:
      false,

    auditAdmissionFailureReason,

    ...resultContext(
      input.ledgerWrite
    ),

    summary: [
      ...copySummary(
        input.ledgerWrite.summary
      ),
      "provider_runtime_ledger_audit_not_admitted",
      summaryToken,
    ],

  };

}


// ============================================================
// AUDIT MATERIAL COMPOSITION
// ============================================================

function buildAuditAdmissionMaterial(
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult,
  ledgerEntry:
    ProviderRuntimeEvidenceLedgerEntry
): ProviderRuntimeLedgerAuditAdmissionMaterial {

  const executorSummary =
    copySummary(
      ledgerEntry.executorSummary
    );

  return {

    auditMaterialType:
      "PROVIDER_RUNTIME_LEDGER_WRITE",

    auditMaterialVersion:
      "P9S.1",

    persistenceId:
      ledgerWrite.persistenceId!,

    ledgerEntryId:
      ledgerWrite.ledgerEntryId!,

    ledgerSequence:
      ledgerWrite.ledgerSequence!,

    persistedAt:
      ledgerWrite.persistedAt!,

    ledgerEntryType:
      ledgerEntry.ledgerEntryType,

    ledgerEntryVersion:
      ledgerEntry.ledgerEntryVersion,

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

    responseDecisionSummary:
      copySummary(
        ledgerEntry.responseDecisionSummary
      ),

    executorSummary:
      executorSummary.length > 0
        ? executorSummary
        : undefined,

    responseExecutionSummary:
      copySummary(
        ledgerEntry.responseExecutionSummary
      ),

    certificationSummary:
      copySummary(
        ledgerEntry.certificationSummary
      ),

    ledgerWriteSummary:
      copySummary(
        ledgerWrite.summary
      ),

  };

}


// ============================================================
// AUDIT ADMISSION
// ============================================================

export function admitProviderRuntimeLedgerToAudit(
  input:
    ProviderRuntimeLedgerAuditAdmissionInput
): ProviderRuntimeLedgerAuditAdmissionResult {

  const ledgerWrite =
    input.ledgerWrite;

  // ----------------------------------------------------------
  // 1. AUDIT ADMISSION REJECTED
  // ----------------------------------------------------------

  if (
    input.auditAdmissionDecision ===
    "REJECT_PROVIDER_RUNTIME_LEDGER_AUDIT_ADMISSION"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_LEDGER_AUDIT_ADMISSION_NOT_ALLOWED",
      "runtime_ledger_audit_admission_not_allowed"
    );

  }

  // ----------------------------------------------------------
  // 2. P9R LEDGER WRITE DENIED
  // ----------------------------------------------------------

  if (
    ledgerWrite.writeStatus ===
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITE_DENIED"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_EVIDENCE_LEDGER_WRITE_DENIED",
      "runtime_evidence_ledger_write_denied"
    );

  }

  // ----------------------------------------------------------
  // 3. LEDGER WRITE MUST BE COMPLETED
  // ----------------------------------------------------------

  if (
    ledgerWrite.writeStatus !==
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITTEN" ||
    ledgerWrite.runtimeEvidenceLedgerWritten !==
      true
  ) {

    return buildNotAdmittedResult(
      input,
      "RUNTIME_EVIDENCE_LEDGER_NOT_WRITTEN",
      "runtime_evidence_ledger_not_written"
    );

  }

  // ----------------------------------------------------------
  // 4. EVIDENCE MUST BE PERSISTED
  // ----------------------------------------------------------

  if (
    ledgerWrite.runtimeEvidencePersisted !==
    true
  ) {

    return buildNotAdmittedResult(
      input,
      "RUNTIME_EVIDENCE_NOT_PERSISTED",
      "runtime_evidence_not_persisted"
    );

  }

  // ----------------------------------------------------------
  // 5. LEDGER ENTRY REQUIRED
  // ----------------------------------------------------------

  const ledgerEntry =
    ledgerWrite.ledgerEntry;

  if (!ledgerEntry) {

    return buildNotAdmittedResult(
      input,
      "LEDGER_ENTRY_MISSING",
      "ledger_entry_missing"
    );

  }

  // ----------------------------------------------------------
  // 6. DURABLE IDENTIFIERS REQUIRED
  // ----------------------------------------------------------

  if (
    !hasNonEmptyString(
      ledgerWrite.persistenceId
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "PERSISTENCE_ID_MISSING",
      "persistence_id_missing"
    );

  }

  if (
    !hasNonEmptyString(
      ledgerWrite.ledgerEntryId
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "LEDGER_ENTRY_ID_MISSING",
      "ledger_entry_id_missing"
    );

  }

  if (
    !isPositiveInteger(
      ledgerWrite.ledgerSequence
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "LEDGER_SEQUENCE_INVALID",
      "ledger_sequence_invalid"
    );

  }

  if (
    !hasNonEmptyString(
      ledgerWrite.persistedAt
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "PERSISTENCE_TIMESTAMP_MISSING",
      "persistence_timestamp_missing"
    );

  }

  // ----------------------------------------------------------
  // 7. LEDGER ENTRY SHAPE
  // ----------------------------------------------------------

  if (
    !ledgerEntryShapeIsValid(
      ledgerEntry
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "LEDGER_ENTRY_SHAPE_INVALID",
      "ledger_entry_shape_invalid"
    );

  }

  // ----------------------------------------------------------
  // 8. LEDGER RESULT / ENTRY CONTEXT COHERENCE
  // ----------------------------------------------------------

  if (
    !ledgerResultContextMatchesEntry(
      ledgerWrite,
      ledgerEntry
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "LEDGER_RESULT_CONTEXT_INCOHERENT",
      "ledger_result_context_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 9. CERTIFIED OUTCOME COHERENCE
  // ----------------------------------------------------------

  if (
    !ledgerOutcomeIsCoherent(
      ledgerWrite,
      ledgerEntry
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "LEDGER_RESULT_OUTCOME_INCOHERENT",
      "ledger_result_outcome_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 10. P9N RESPONSE COHERENCE
  // ----------------------------------------------------------

  if (
    !ledgerResponseIsCoherent(
      ledgerWrite,
      ledgerEntry
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "LEDGER_RESULT_RESPONSE_INCOHERENT",
      "ledger_result_response_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 11. P9O EXECUTION-STATE COHERENCE
  // ----------------------------------------------------------

  if (
    !ledgerExecutionStateIsCoherent(
      ledgerWrite,
      ledgerEntry
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "LEDGER_RESULT_EXECUTION_STATE_INCOHERENT",
      "ledger_result_execution_state_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 12. CONTAINED-FAILURE EVIDENCE SUFFICIENCY
  // ----------------------------------------------------------

  if (
    !containedFailureEvidenceIsSufficient(
      ledgerEntry
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "LEDGER_CONTAINED_FAILURE_EVIDENCE_INSUFFICIENT",
      "ledger_contained_failure_evidence_insufficient"
    );

  }

  // ----------------------------------------------------------
  // 13. PERSISTENCE SUMMARY SUFFICIENCY
  // ----------------------------------------------------------

  if (
    !persistenceSummaryIsSufficient(
      ledgerWrite
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "LEDGER_PERSISTENCE_SUMMARY_INSUFFICIENT",
      "ledger_persistence_summary_insufficient"
    );

  }

  // ----------------------------------------------------------
  // 14. AUDIT ADMISSION GRANTED
  // ----------------------------------------------------------

  const auditAdmissionMaterial =
    buildAuditAdmissionMaterial(
      ledgerWrite,
      ledgerEntry
    );

  return {

    auditAdmissionStatus:
      "PROVIDER_RUNTIME_LEDGER_AUDIT_ADMITTED",

    auditAdmissionDecision:
      input.auditAdmissionDecision,

    runtimeLedgerAuditAdmissionAttempted:
      true,

    runtimeLedgerAuditAdmitted:
      true,

    runtimeLedgerAuditAdmissionDenied:
      false,

    ...resultContext(
      ledgerWrite
    ),

    auditAdmissionMaterial,

    summary: [
      ...copySummary(
        ledgerWrite.summary
      ),
      "provider_runtime_ledger_integrity_validated",
      "provider_runtime_ledger_audit_admitted",
      ledgerEntry.certifiedExecutionOutcome.toLowerCase(),
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Runtime Ledger Integrity / Audit Admission
// receives:
//
// - P9R ledger-write result
// - explicit audit-admission decision
//
// It validates that the durable ledger fact is
// coherent with the complete provider-runtime
// lineage.
//
// It composes one canonical audit-admission
// material.
//
// P9S does not perform audit.
//
// P9S does not write audit records.
//
// ============================================================


// ============================================================
// AUDIT ADMISSION PRINCIPLES
// ============================================================
//
// Ledger Entry Written
// ≠
// Ledger Integrity Established
//
// Ledger Integrity Established
// ≠
// Audit Admission Granted
//
// Audit Admission Granted
// ≠
// Audit Performed
//
// Persisted Identifier Present
// ≠
// Persisted Identifier Validly Owned
//
// Certified Contained Failure
// ≠
// Persistence Failure
//
// A contained runtime failure may be a valid,
// durable, auditable operational fact.
//
// ============================================================


// ============================================================
// INTEGRITY BOUNDARY
// ============================================================
//
// P9S may claim:
//
// - P9R ledger write validated
// - ledger/result coherence validated
// - durable identifiers present
// - provider-runtime ledger fact admitted
//   to the audit domain
//
// P9S must not claim:
//
// - audit performed
// - audit record written
// - audit finding issued
// - ledger history verified
// - chain continuity verified
// - cryptographic proof verified
//
// Those belong to later boundaries.
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
// - certify execution outcome
// - admit evidence to ledger
// - persist evidence
// - invoke ledger writer
// - write ledger
// - repair P9R result
// - infer missing durable identifiers
// - manufacture audit identifiers
// - replace P9N-selected response
// - alter P9O execution state
// - alter P9P certification
// - alter P9Q admission
// - alter P9R ledger-write result
// - call provider SDKs
// - call provider APIs
// - re-sanitize provider errors
// - alter sanitized failure surfaces
// - perform audit
// - write audit records
// - issue audit findings
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive P9R ledger-write result
//
// ✓ distinguish admission denied from
//   audit not admitted
//
// ✓ require completed P9R ledger write
//
// ✓ require persisted evidence
//
// ✓ require canonical ledger entry
//
// ✓ require durable identifiers
//
// ✓ validate ledger-entry shape
//
// ✓ validate result/entry context coherence
//
// ✓ validate certified outcome coherence
//
// ✓ validate P9N-selected response coherence
//
// ✓ validate P9O execution-state coherence
//
// ✓ validate contained-failure evidence
//
// ✓ validate persistence summary sufficiency
//
// ✓ compose canonical audit-admission material
//
// ✓ copy summary material defensively
//
// ✓ preserve P9L/P9M/P9N/P9O/P9P/P9Q/P9R lineage
//
// ✗ verify runtime
//
// ✗ classify runtime failure
//
// ✗ decide runtime response
//
// ✗ execute runtime response
//
// ✗ certify execution outcome
//
// ✗ admit evidence to ledger
//
// ✗ persist evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================