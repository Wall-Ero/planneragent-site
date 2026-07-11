// ============================================================
// PlannerAgent — Provider Runtime Audit Execution / Audit Record Write
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9T.provider.runtime.audit.execution.audit.record.write.ts
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
// P9T.1 — Provider Runtime Audit Execution / Audit Record Write
//
// PURPOSE
// ------------------------------------------------------------
// Execute one governed audit over a P9S-admitted
// provider-runtime ledger fact and write one
// canonical audit record.
//
// P9T receives:
//
// - ProviderRuntimeLedgerAuditAdmissionResult
// - an explicit audit-execution decision gate
// - one governed audit executor
//
// P9T validates:
//
// - P9S audit admission
// - audit-admission material presence
// - audit-admission material coherence
// - governed audit-executor availability
// - audit-executor result coherence
// - audit-record durable identifier presence
//
// P9T produces:
//
// - one canonical provider-runtime audit record
// - one durable audit-record identifier
// - one durable audit sequence
// - one audit timestamp
// - one canonical audit finding
//
// P9T does not verify runtime.
//
// P9T does not classify runtime failure.
//
// P9T does not decide runtime response.
//
// P9T does not execute runtime response.
//
// P9T does not certify execution outcome.
//
// P9T does not admit evidence to ledger.
//
// P9T does not persist runtime evidence.
//
// P9T does not write the provider-runtime ledger.
//
// P9T does not admit ledger facts to audit.
//
// P9T does not verify historical ledger continuity.
//
// P9T does not verify cryptographic chain proofs.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// P9R writes the durable ledger fact.
//
// P9S validates and admits that fact to audit.
//
// P9T executes the governed audit and writes
// the canonical audit record.
//
// Audit Admission Granted
// ≠
// Audit Executed
//
// Audit Executed
// ≠
// Audit Record Written
//
// Audit Record Written
// ≠
// Ledger History Verified
//
// Audit Finding Nonconforming
// ≠
// Audit Execution Failed
//
// ============================================================

import type {
  ProviderRuntimeLedgerAuditAdmissionMaterial,
  ProviderRuntimeLedgerAuditAdmissionResult,
} from "./P9S.provider.runtime.ledger.integrity.audit.admission";


// ============================================================
// AUDIT EXECUTION STATUS
// ============================================================

export type ProviderRuntimeAuditExecutionStatus =
  | "PROVIDER_RUNTIME_AUDIT_RECORD_WRITTEN"
  | "PROVIDER_RUNTIME_AUDIT_NOT_COMPLETED"
  | "PROVIDER_RUNTIME_AUDIT_EXECUTION_DENIED";


// ============================================================
// AUDIT EXECUTION DECISION
// ============================================================

export type ProviderRuntimeAuditExecutionDecision =
  | "EXECUTE_PROVIDER_RUNTIME_AUDIT"
  | "REJECT_PROVIDER_RUNTIME_AUDIT_EXECUTION";


// ============================================================
// AUDIT FINDING
// ============================================================

export type ProviderRuntimeAuditFinding =
  | "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED"
  | "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING";


// ============================================================
// AUDIT EXECUTION DENIAL REASON
// ============================================================

export type ProviderRuntimeAuditExecutionDenialReason =
  | "RUNTIME_AUDIT_EXECUTION_NOT_ALLOWED"
  | "RUNTIME_LEDGER_AUDIT_ADMISSION_DENIED";


// ============================================================
// AUDIT EXECUTION FAILURE REASON
// ============================================================

export type ProviderRuntimeAuditExecutionFailureReason =
  | "RUNTIME_LEDGER_NOT_ADMITTED_TO_AUDIT"
  | "AUDIT_ADMISSION_MATERIAL_MISSING"
  | "AUDIT_ADMISSION_MATERIAL_INCOHERENT"
  | "AUDIT_EXECUTOR_MISSING"
  | "AUDIT_EXECUTOR_FAILED"
  | "AUDIT_EXECUTOR_RESULT_INCOHERENT"
  | "AUDIT_RECORD_NOT_WRITTEN";


// ============================================================
// CANONICAL AUDIT RECORD
// ============================================================

export interface ProviderRuntimeAuditRecord {

  auditRecordType:
    "PROVIDER_RUNTIME_LEDGER_FACT_AUDIT";

  auditRecordVersion:
    "P9T.1";

  auditFinding:
    ProviderRuntimeAuditFinding;

  auditReason?:
    string;

  persistenceId:
    ProviderRuntimeLedgerAuditAdmissionMaterial["persistenceId"];

  ledgerEntryId:
    ProviderRuntimeLedgerAuditAdmissionMaterial["ledgerEntryId"];

  ledgerSequence:
    ProviderRuntimeLedgerAuditAdmissionMaterial["ledgerSequence"];

  persistedAt:
    ProviderRuntimeLedgerAuditAdmissionMaterial["persistedAt"];

  ledgerEntryType:
    ProviderRuntimeLedgerAuditAdmissionMaterial["ledgerEntryType"];

  ledgerEntryVersion:
    ProviderRuntimeLedgerAuditAdmissionMaterial["ledgerEntryVersion"];

  certifiedExecutionOutcome:
    ProviderRuntimeLedgerAuditAdmissionMaterial["certifiedExecutionOutcome"];

  providerContract:
    ProviderRuntimeLedgerAuditAdmissionMaterial["providerContract"];

  providerImplementation:
    ProviderRuntimeLedgerAuditAdmissionMaterial["providerImplementation"];

  operation:
    ProviderRuntimeLedgerAuditAdmissionMaterial["operation"];

  providerResourceId?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["executionMetadata"];

  verificationStatus:
    ProviderRuntimeLedgerAuditAdmissionMaterial["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeLedgerAuditAdmissionMaterial["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["failureCode"];

  providerRawStatus?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeLedgerAuditAdmissionMaterial["recoveryIntakeRequired"];

  recoveryIntakeReady:
    ProviderRuntimeLedgerAuditAdmissionMaterial["recoveryIntakeReady"];

  recoveryReason?:
    ProviderRuntimeLedgerAuditAdmissionMaterial["recoveryReason"];

  runtimeResponse:
    ProviderRuntimeLedgerAuditAdmissionMaterial["runtimeResponse"];

  responseExecutionStatus:
    ProviderRuntimeLedgerAuditAdmissionMaterial["responseExecutionStatus"];

  runtimeResponseExecutionAttempted:
    ProviderRuntimeLedgerAuditAdmissionMaterial["runtimeResponseExecutionAttempted"];

  runtimeResponseExecuted:
    ProviderRuntimeLedgerAuditAdmissionMaterial["runtimeResponseExecuted"];

  runtimeInterventionNotRequired:
    ProviderRuntimeLedgerAuditAdmissionMaterial["runtimeInterventionNotRequired"];

  executorFailureContained:
    ProviderRuntimeLedgerAuditAdmissionMaterial["executorFailureContained"];

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

  auditAdmissionSummary:
    string[];

}


// ============================================================
// GOVERNED AUDIT EXECUTOR CONTRACT
// ============================================================

export interface ProviderRuntimeAuditExecutorInput {

  auditAdmissionMaterial:
    ProviderRuntimeLedgerAuditAdmissionMaterial;

}


export interface ProviderRuntimeAuditExecutorResult {

  executorStatus:
    | "PROVIDER_RUNTIME_AUDIT_EXECUTOR_COMPLETED"
    | "PROVIDER_RUNTIME_AUDIT_EXECUTOR_FAILED";

  auditExecutionAttempted:
    boolean;

  auditExecutionCompleted:
    boolean;

  auditRecordWritten:
    boolean;

  auditFinding?:
    ProviderRuntimeAuditFinding;

  auditReason?:
    string;

  auditRecordId?:
    string;

  auditSequence?:
    number;

  auditedAt?:
    string;

  executorFailureReason?:
    string;

  summary:
    string[];

}


export type ProviderRuntimeAuditExecutor =
  (
    input:
      ProviderRuntimeAuditExecutorInput
  ) =>
    ProviderRuntimeAuditExecutorResult;


// ============================================================
// INPUT
// ============================================================

export interface ProviderRuntimeAuditExecutionInput {

  auditAdmission:
    ProviderRuntimeLedgerAuditAdmissionResult;

  auditExecutionDecision:
    ProviderRuntimeAuditExecutionDecision;

  auditExecutor?:
    ProviderRuntimeAuditExecutor;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderRuntimeAuditExecutionResult {

  auditExecutionStatus:
    ProviderRuntimeAuditExecutionStatus;

  auditExecutionDecision:
    ProviderRuntimeAuditExecutionDecision;

  runtimeAuditExecutionAttempted:
    boolean;

  runtimeAuditExecuted:
    boolean;

  runtimeAuditRecordWritten:
    boolean;

  runtimeAuditExecutionDenied:
    boolean;

  auditExecutionDenialReason?:
    ProviderRuntimeAuditExecutionDenialReason;

  auditExecutionFailureReason?:
    ProviderRuntimeAuditExecutionFailureReason;

  auditFinding?:
    ProviderRuntimeAuditFinding;

  auditReason?:
    string;

  auditRecordId?:
    string;

  auditSequence?:
    number;

  auditedAt?:
    string;

  persistenceId?:
    ProviderRuntimeLedgerAuditAdmissionResult["persistenceId"];

  ledgerEntryId?:
    ProviderRuntimeLedgerAuditAdmissionResult["ledgerEntryId"];

  ledgerSequence?:
    ProviderRuntimeLedgerAuditAdmissionResult["ledgerSequence"];

  persistedAt?:
    ProviderRuntimeLedgerAuditAdmissionResult["persistedAt"];

  certifiedExecutionOutcome?:
    ProviderRuntimeLedgerAuditAdmissionResult["certifiedExecutionOutcome"];

  providerContract:
    ProviderRuntimeLedgerAuditAdmissionResult["providerContract"];

  providerImplementation:
    ProviderRuntimeLedgerAuditAdmissionResult["providerImplementation"];

  operation:
    ProviderRuntimeLedgerAuditAdmissionResult["operation"];

  providerResourceId?:
    ProviderRuntimeLedgerAuditAdmissionResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeLedgerAuditAdmissionResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeLedgerAuditAdmissionResult["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeLedgerAuditAdmissionResult["executionMetadata"];

  verificationStatus:
    ProviderRuntimeLedgerAuditAdmissionResult["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeLedgerAuditAdmissionResult["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeLedgerAuditAdmissionResult["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeLedgerAuditAdmissionResult["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeLedgerAuditAdmissionResult["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeLedgerAuditAdmissionResult["failureCode"];

  providerRawStatus?:
    ProviderRuntimeLedgerAuditAdmissionResult["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeLedgerAuditAdmissionResult["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeLedgerAuditAdmissionResult["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeLedgerAuditAdmissionResult["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeLedgerAuditAdmissionResult["recoveryIntakeRequired"];

  recoveryIntakeReady:
    ProviderRuntimeLedgerAuditAdmissionResult["recoveryIntakeReady"];

  recoveryReason?:
    ProviderRuntimeLedgerAuditAdmissionResult["recoveryReason"];

  runtimeResponse?:
    ProviderRuntimeLedgerAuditAdmissionResult["runtimeResponse"];

  responseExecutionStatus:
    ProviderRuntimeLedgerAuditAdmissionResult["responseExecutionStatus"];

  runtimeResponseExecutionAttempted:
    ProviderRuntimeLedgerAuditAdmissionResult["runtimeResponseExecutionAttempted"];

  runtimeResponseExecuted:
    ProviderRuntimeLedgerAuditAdmissionResult["runtimeResponseExecuted"];

  runtimeInterventionNotRequired:
    ProviderRuntimeLedgerAuditAdmissionResult["runtimeInterventionNotRequired"];

  executorFailureContained:
    ProviderRuntimeLedgerAuditAdmissionResult["executorFailureContained"];

  auditRecord?:
    ProviderRuntimeAuditRecord;

  auditAdmissionSummary:
    string[];

  auditExecutorSummary?:
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
// AUDIT-ADMISSION MATERIAL COHERENCE
// ============================================================

function auditAdmissionMaterialIsCoherent(
  auditAdmission:
    ProviderRuntimeLedgerAuditAdmissionResult,
  material:
    ProviderRuntimeLedgerAuditAdmissionMaterial
): boolean {

  return (

    material.auditMaterialType ===
      "PROVIDER_RUNTIME_LEDGER_WRITE" &&

    material.auditMaterialVersion ===
      "P9S.1" &&

    auditAdmission.persistenceId ===
      material.persistenceId &&

    auditAdmission.ledgerEntryId ===
      material.ledgerEntryId &&

    auditAdmission.ledgerSequence ===
      material.ledgerSequence &&

    auditAdmission.persistedAt ===
      material.persistedAt &&

    auditAdmission.certifiedExecutionOutcome ===
      material.certifiedExecutionOutcome &&

    auditAdmission.providerContract ===
      material.providerContract &&

    auditAdmission.providerImplementation ===
      material.providerImplementation &&

    auditAdmission.operation ===
      material.operation &&

    auditAdmission.providerResourceId ===
      material.providerResourceId &&

    auditAdmission.providerConfigurationRef ===
      material.providerConfigurationRef &&

    auditAdmission.providerCredentialRef ===
      material.providerCredentialRef &&

    auditAdmission.verificationStatus ===
      material.verificationStatus &&

    auditAdmission.verificationFailureReason ===
      material.verificationFailureReason &&

    auditAdmission.classificationStatus ===
      material.classificationStatus &&

    auditAdmission.runtimeFailureClass ===
      material.runtimeFailureClass &&

    auditAdmission.runtimeFailureSeverity ===
      material.runtimeFailureSeverity &&

    auditAdmission.failureCode ===
      material.failureCode &&

    auditAdmission.providerRawStatus ===
      material.providerRawStatus &&

    auditAdmission.providerRawErrorCode ===
      material.providerRawErrorCode &&

    auditAdmission.providerSanitizedErrorMessage ===
      material.providerSanitizedErrorMessage &&

    auditAdmission.retryable ===
      material.retryable &&

    auditAdmission.recoveryIntakeRequired ===
      material.recoveryIntakeRequired &&

    auditAdmission.recoveryIntakeReady ===
      material.recoveryIntakeReady &&

    auditAdmission.recoveryReason ===
      material.recoveryReason &&

    auditAdmission.runtimeResponse ===
      material.runtimeResponse &&

    auditAdmission.responseExecutionStatus ===
      material.responseExecutionStatus &&

    auditAdmission.runtimeResponseExecutionAttempted ===
      material.runtimeResponseExecutionAttempted &&

    auditAdmission.runtimeResponseExecuted ===
      material.runtimeResponseExecuted &&

    auditAdmission.runtimeInterventionNotRequired ===
      material.runtimeInterventionNotRequired &&

    auditAdmission.executorFailureContained ===
      material.executorFailureContained &&

    copySummary(
      material.responseDecisionSummary
    ).length > 0 &&

    copySummary(
      material.responseExecutionSummary
    ).length > 0 &&

    copySummary(
      material.certificationSummary
    ).length > 0 &&

    copySummary(
      material.ledgerWriteSummary
    ).length > 0 &&

    (
      material.executorFailureContained === false ||
      copySummary(
        material.executorSummary
      ).includes(
        "executor_failure_contained"
      )
    )

  );

}


// ============================================================
// AUDIT EXECUTOR RESULT VALIDATION
// ============================================================

function auditExecutorResultIsCompleted(
  result:
    ProviderRuntimeAuditExecutorResult
): boolean {

  const findingIsValid =
    result.auditFinding ===
      "PROVIDER_RUNTIME_LEDGER_FACT_CONFIRMED" ||
    result.auditFinding ===
      "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING";

  return (

    result.executorStatus ===
      "PROVIDER_RUNTIME_AUDIT_EXECUTOR_COMPLETED" &&

    result.auditExecutionAttempted ===
      true &&

    result.auditExecutionCompleted ===
      true &&

    result.auditRecordWritten ===
      true &&

    findingIsValid &&

    (
      result.auditFinding !==
        "PROVIDER_RUNTIME_LEDGER_FACT_NONCONFORMING" ||
      hasNonEmptyString(
        result.auditReason
      )
    ) &&

    hasNonEmptyString(
      result.auditRecordId
    ) &&

    isPositiveInteger(
      result.auditSequence
    ) &&

    hasNonEmptyString(
      result.auditedAt
    ) &&

    result.executorFailureReason ===
      undefined &&

    copySummary(
      result.summary
    ).length > 0

  );

}


function auditExecutorResultIsFailed(
  result:
    ProviderRuntimeAuditExecutorResult
): boolean {

  return (

    result.executorStatus ===
      "PROVIDER_RUNTIME_AUDIT_EXECUTOR_FAILED" &&

    result.auditExecutionAttempted ===
      true &&

    result.auditExecutionCompleted ===
      false &&

    result.auditRecordWritten ===
      false &&

    result.auditFinding ===
      undefined &&

    result.auditReason ===
      undefined &&

    result.auditRecordId ===
      undefined &&

    result.auditSequence ===
      undefined &&

    result.auditedAt ===
      undefined &&

    hasNonEmptyString(
      result.executorFailureReason
    ) &&

    copySummary(
      result.summary
    ).length > 0

  );

}


// ============================================================
// CANONICAL AUDIT RECORD COMPOSITION
// ============================================================

function buildCanonicalAuditRecord(
  material:
    ProviderRuntimeLedgerAuditAdmissionMaterial,
  executorResult:
    ProviderRuntimeAuditExecutorResult,
  auditAdmissionSummary:
    string[]
): ProviderRuntimeAuditRecord {

  const executorSummary =
    copySummary(
      material.executorSummary
    );

  return {

    auditRecordType:
      "PROVIDER_RUNTIME_LEDGER_FACT_AUDIT",

    auditRecordVersion:
      "P9T.1",

    auditFinding:
      executorResult.auditFinding!,

    auditReason:
      executorResult.auditReason,

    persistenceId:
      material.persistenceId,

    ledgerEntryId:
      material.ledgerEntryId,

    ledgerSequence:
      material.ledgerSequence,

    persistedAt:
      material.persistedAt,

    ledgerEntryType:
      material.ledgerEntryType,

    ledgerEntryVersion:
      material.ledgerEntryVersion,

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

    responseDecisionSummary:
      copySummary(
        material.responseDecisionSummary
      ),

    executorSummary:
      executorSummary.length > 0
        ? executorSummary
        : undefined,

    responseExecutionSummary:
      copySummary(
        material.responseExecutionSummary
      ),

    certificationSummary:
      copySummary(
        material.certificationSummary
      ),

    ledgerWriteSummary:
      copySummary(
        material.ledgerWriteSummary
      ),

    auditAdmissionSummary: [
      ...auditAdmissionSummary,
    ],

  };

}


// ============================================================
// SHARED RESULT CONTEXT
// ============================================================

function resultContext(
  auditAdmission:
    ProviderRuntimeLedgerAuditAdmissionResult
) {

  return {

    persistenceId:
      auditAdmission.persistenceId,

    ledgerEntryId:
      auditAdmission.ledgerEntryId,

    ledgerSequence:
      auditAdmission.ledgerSequence,

    persistedAt:
      auditAdmission.persistedAt,

    certifiedExecutionOutcome:
      auditAdmission.certifiedExecutionOutcome,

    providerContract:
      auditAdmission.providerContract,

    providerImplementation:
      auditAdmission.providerImplementation,

    operation:
      auditAdmission.operation,

    providerResourceId:
      auditAdmission.providerResourceId,

    providerConfigurationRef:
      auditAdmission.providerConfigurationRef,

    providerCredentialRef:
      auditAdmission.providerCredentialRef,

    executionMetadata:
      auditAdmission.executionMetadata,

    verificationStatus:
      auditAdmission.verificationStatus,

    verificationFailureReason:
      auditAdmission.verificationFailureReason,

    classificationStatus:
      auditAdmission.classificationStatus,

    runtimeFailureClass:
      auditAdmission.runtimeFailureClass,

    runtimeFailureSeverity:
      auditAdmission.runtimeFailureSeverity,

    failureCode:
      auditAdmission.failureCode,

    providerRawStatus:
      auditAdmission.providerRawStatus,

    providerRawErrorCode:
      auditAdmission.providerRawErrorCode,

    providerSanitizedErrorMessage:
      auditAdmission.providerSanitizedErrorMessage,

    retryable:
      auditAdmission.retryable,

    recoveryIntakeRequired:
      auditAdmission.recoveryIntakeRequired,

    recoveryIntakeReady:
      auditAdmission.recoveryIntakeReady,

    recoveryReason:
      auditAdmission.recoveryReason,

    runtimeResponse:
      auditAdmission.runtimeResponse,

    responseExecutionStatus:
      auditAdmission.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      auditAdmission.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      auditAdmission.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      auditAdmission.runtimeInterventionNotRequired,

    executorFailureContained:
      auditAdmission.executorFailureContained,

    auditAdmissionSummary:
      copySummary(
        auditAdmission.summary
      ),

  };

}


// ============================================================
// DENIED RESULT
// ============================================================

function buildDeniedResult(
  input:
    ProviderRuntimeAuditExecutionInput,
  auditExecutionDenialReason:
    ProviderRuntimeAuditExecutionDenialReason,
  summaryToken:
    string
): ProviderRuntimeAuditExecutionResult {

  return {

    auditExecutionStatus:
      "PROVIDER_RUNTIME_AUDIT_EXECUTION_DENIED",

    auditExecutionDecision:
      input.auditExecutionDecision,

    runtimeAuditExecutionAttempted:
      false,

    runtimeAuditExecuted:
      false,

    runtimeAuditRecordWritten:
      false,

    runtimeAuditExecutionDenied:
      true,

    auditExecutionDenialReason,

    ...resultContext(
      input.auditAdmission
    ),

    summary: [
      ...copySummary(
        input.auditAdmission.summary
      ),
      "provider_runtime_audit_execution_denied",
      summaryToken,
    ],

  };

}


// ============================================================
// NOT COMPLETED RESULT
// ============================================================

function buildNotCompletedResult(
  input:
    ProviderRuntimeAuditExecutionInput,
  auditExecutionFailureReason:
    ProviderRuntimeAuditExecutionFailureReason,
  summaryToken:
    string,
  auditExecutorSummary?:
    string[]
): ProviderRuntimeAuditExecutionResult {

  return {

    auditExecutionStatus:
      "PROVIDER_RUNTIME_AUDIT_NOT_COMPLETED",

    auditExecutionDecision:
      input.auditExecutionDecision,

    runtimeAuditExecutionAttempted:
      true,

    runtimeAuditExecuted:
      false,

    runtimeAuditRecordWritten:
      false,

    runtimeAuditExecutionDenied:
      false,

    auditExecutionFailureReason,

    ...resultContext(
      input.auditAdmission
    ),

    auditExecutorSummary:
      auditExecutorSummary &&
      auditExecutorSummary.length > 0
        ? [
            ...auditExecutorSummary,
          ]
        : undefined,

    summary: [
      ...copySummary(
        input.auditAdmission.summary
      ),
      ...(auditExecutorSummary ?? []),
      "provider_runtime_audit_not_completed",
      summaryToken,
    ],

  };

}


// ============================================================
// AUDIT EXECUTION
// ============================================================

export function executeProviderRuntimeAudit(
  input:
    ProviderRuntimeAuditExecutionInput
): ProviderRuntimeAuditExecutionResult {

  const auditAdmission =
    input.auditAdmission;

  // ----------------------------------------------------------
  // 1. AUDIT EXECUTION REJECTED
  // ----------------------------------------------------------

  if (
    input.auditExecutionDecision ===
    "REJECT_PROVIDER_RUNTIME_AUDIT_EXECUTION"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_AUDIT_EXECUTION_NOT_ALLOWED",
      "runtime_audit_execution_not_allowed"
    );

  }

  // ----------------------------------------------------------
  // 2. P9S AUDIT ADMISSION DENIED
  // ----------------------------------------------------------

  if (
    auditAdmission.auditAdmissionStatus ===
    "PROVIDER_RUNTIME_LEDGER_AUDIT_ADMISSION_DENIED"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_LEDGER_AUDIT_ADMISSION_DENIED",
      "runtime_ledger_audit_admission_denied"
    );

  }

  // ----------------------------------------------------------
  // 3. LEDGER FACT MUST BE ADMITTED TO AUDIT
  // ----------------------------------------------------------

  if (
    auditAdmission.auditAdmissionStatus !==
      "PROVIDER_RUNTIME_LEDGER_AUDIT_ADMITTED" ||
    auditAdmission.runtimeLedgerAuditAdmitted !==
      true
  ) {

    return buildNotCompletedResult(
      input,
      "RUNTIME_LEDGER_NOT_ADMITTED_TO_AUDIT",
      "runtime_ledger_not_admitted_to_audit"
    );

  }

  // ----------------------------------------------------------
  // 4. AUDIT-ADMISSION MATERIAL REQUIRED
  // ----------------------------------------------------------

  const auditAdmissionMaterial =
    auditAdmission.auditAdmissionMaterial;

  if (!auditAdmissionMaterial) {

    return buildNotCompletedResult(
      input,
      "AUDIT_ADMISSION_MATERIAL_MISSING",
      "audit_admission_material_missing"
    );

  }

  // ----------------------------------------------------------
  // 5. AUDIT-ADMISSION MATERIAL COHERENCE
  // ----------------------------------------------------------

  if (
    !auditAdmissionMaterialIsCoherent(
      auditAdmission,
      auditAdmissionMaterial
    )
  ) {

    return buildNotCompletedResult(
      input,
      "AUDIT_ADMISSION_MATERIAL_INCOHERENT",
      "audit_admission_material_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 6. GOVERNED AUDIT EXECUTOR REQUIRED
  // ----------------------------------------------------------

  const auditExecutor =
    input.auditExecutor;

  if (!auditExecutor) {

    return buildNotCompletedResult(
      input,
      "AUDIT_EXECUTOR_MISSING",
      "audit_executor_missing"
    );

  }

  // ----------------------------------------------------------
  // 7. INVOKE GOVERNED AUDIT EXECUTOR
  // ----------------------------------------------------------

  let executorResult:
    ProviderRuntimeAuditExecutorResult;

  try {

    executorResult =
      auditExecutor({
        auditAdmissionMaterial,
      });

  } catch {

    return buildNotCompletedResult(
      input,
      "AUDIT_EXECUTOR_FAILED",
      "audit_executor_failed",
      [
        "provider_runtime_audit_executor_threw",
      ]
    );

  }

  const auditExecutorSummary =
    copySummary(
      executorResult.summary
    );

  // ----------------------------------------------------------
  // 8. AUDIT EXECUTOR FAILURE CONTAINMENT
  // ----------------------------------------------------------

  if (
    executorResult.executorStatus ===
    "PROVIDER_RUNTIME_AUDIT_EXECUTOR_FAILED"
  ) {

    if (
      !auditExecutorResultIsFailed(
        executorResult
      )
    ) {

      return buildNotCompletedResult(
        input,
        "AUDIT_EXECUTOR_RESULT_INCOHERENT",
        "audit_executor_result_incoherent",
        auditExecutorSummary
      );

    }

    return buildNotCompletedResult(
      input,
      "AUDIT_EXECUTOR_FAILED",
      "audit_executor_failed",
      auditExecutorSummary
    );

  }

  // ----------------------------------------------------------
  // 9. COMPLETED AUDIT RESULT COHERENCE
  // ----------------------------------------------------------

  if (
    !auditExecutorResultIsCompleted(
      executorResult
    )
  ) {

    return buildNotCompletedResult(
      input,
      executorResult.auditExecutionCompleted === true &&
      executorResult.auditRecordWritten !== true
        ? "AUDIT_RECORD_NOT_WRITTEN"
        : "AUDIT_EXECUTOR_RESULT_INCOHERENT",
      executorResult.auditExecutionCompleted === true &&
      executorResult.auditRecordWritten !== true
        ? "audit_record_not_written"
        : "audit_executor_result_incoherent",
      auditExecutorSummary
    );

  }

  // ----------------------------------------------------------
  // 10. COMPOSE CANONICAL AUDIT RECORD
  // ----------------------------------------------------------

  const auditRecord =
    buildCanonicalAuditRecord(
      auditAdmissionMaterial,
      executorResult,
      copySummary(
        auditAdmission.summary
      )
    );

  // ----------------------------------------------------------
  // 11. AUDIT EXECUTED / RECORD WRITTEN
  // ----------------------------------------------------------

  return {

    auditExecutionStatus:
      "PROVIDER_RUNTIME_AUDIT_RECORD_WRITTEN",

    auditExecutionDecision:
      input.auditExecutionDecision,

    runtimeAuditExecutionAttempted:
      true,

    runtimeAuditExecuted:
      true,

    runtimeAuditRecordWritten:
      true,

    runtimeAuditExecutionDenied:
      false,

    auditFinding:
      executorResult.auditFinding,

    auditReason:
      executorResult.auditReason,

    auditRecordId:
      executorResult.auditRecordId,

    auditSequence:
      executorResult.auditSequence,

    auditedAt:
      executorResult.auditedAt,

    ...resultContext(
      auditAdmission
    ),

    auditRecord,

    auditExecutorSummary,

    summary: [
      ...copySummary(
        auditAdmission.summary
      ),
      ...auditExecutorSummary,
      "provider_runtime_audit_executed",
      "provider_runtime_audit_record_written",
      executorResult.auditFinding!.toLowerCase(),
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Runtime Audit Execution / Audit Record Write
// receives:
//
// - P9S audit-admission result
// - explicit audit-execution decision
// - governed audit executor
//
// It invokes exactly one governed audit executor.
//
// It writes exactly one canonical audit record.
//
// It exposes durable audit identifiers only after
// coherent audit execution and audit-record write.
//
// A NONCONFORMING finding is a completed audit,
// not an audit-execution failure.
//
// ============================================================


// ============================================================
// AUDIT EXECUTION PRINCIPLES
// ============================================================
//
// Audit Admission Granted
// ≠
// Audit Executed
//
// Audit Executed
// ≠
// Audit Record Written
//
// Audit Finding Confirmed
// ≠
// Audit Finding Nonconforming
//
// Audit Finding Nonconforming
// ≠
// Audit Execution Failed
//
// Audit Record Written
// ≠
// Ledger History Verified
//
// Audit Record Written
// ≠
// Cryptographic Chain Verified
//
// ============================================================


// ============================================================
// AUDIT RECORD BOUNDARY
// ============================================================
//
// P9T is the first provider-runtime boundary
// permitted to claim:
//
// - audit execution attempted
// - audit executed
// - canonical audit finding issued
// - audit record written
// - audit-record identifier assigned
// - audit sequence assigned
// - audit timestamp assigned
//
// Those claims are allowed only after a coherent
// governed audit-executor result.
//
// P9T must never manufacture audit identifiers.
//
// P9T must never convert a NONCONFORMING finding
// into an executor failure.
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
// - persist runtime evidence
// - invoke provider-runtime ledger writer
// - write provider-runtime ledger
// - admit ledger fact to audit
// - repair P9S material
// - infer missing audit-admission context
// - manufacture audit-record identifiers
// - manufacture audit sequence
// - manufacture audit timestamp
// - replace P9N-selected response
// - alter P9O execution state
// - alter P9P certification
// - alter P9Q admission
// - alter P9R ledger write
// - alter P9S audit admission
// - call provider SDKs
// - call provider APIs
// - re-sanitize provider errors
// - alter sanitized failure surfaces
// - verify ledger history
// - verify chain continuity
// - verify cryptographic chain proof
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive P9S audit-admission result
//
// ✓ distinguish execution denied from
//   audit not completed
//
// ✓ require admitted audit material
//
// ✓ validate audit material coherence
//
// ✓ require one governed audit executor
//
// ✓ invoke exactly one audit executor
//
// ✓ contain audit-executor exceptions
//
// ✓ contain audit-executor failure
//
// ✓ reject incoherent executor results
//
// ✓ distinguish nonconforming finding from
//   execution failure
//
// ✓ compose one canonical audit record
//
// ✓ expose durable audit identifiers only
//   after coherent record write
//
// ✓ copy summaries defensively
//
// ✓ preserve P9L/P9M/P9N/P9O/P9P/P9Q/P9R/P9S lineage
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
// ✗ admit evidence
//
// ✗ persist runtime evidence
//
// ✗ write provider-runtime ledger
//
// ✗ admit ledger fact to audit
//
// ✗ manufacture audit identifiers
//
// ✗ verify ledger history
//
// ✗ verify cryptographic chain proof
//
// ============================================================