// ============================================================
// PlannerAgent — Provider Runtime Evidence Persistence / Ledger Write
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9R.provider.runtime.evidence.persistence.ledger.write.ts
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
// P9R.1 — Provider Runtime Evidence Persistence / Ledger Write
//
// PURPOSE
// ------------------------------------------------------------
// Persist P9Q-admitted provider runtime evidence
// and write one canonical ledger entry through a
// governed persistence boundary.
//
// P9R receives:
//
// - ProviderRuntimeEvidenceLedgerAdmissionResult
// - an explicit ledger-write decision gate
// - a governed ledger writer
//
// P9R validates:
//
// - P9Q admission state
// - ledger-admission material presence
// - admitted outcome / material coherence
// - provider/runtime context coherence
// - response and execution-state coherence
// - writer-result coherence
//
// P9R writes:
//
// - one governed persistence record
// - one canonical provider-runtime ledger entry
//
// P9R does not verify runtime.
//
// P9R does not classify runtime failure.
//
// P9R does not decide runtime response.
//
// P9R does not execute runtime response.
//
// P9R does not certify execution outcome.
//
// P9R does not admit evidence.
//
// P9R does not audit.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// P9P certifies execution outcome.
//
// P9Q admits canonical evidence.
//
// P9R persists admitted evidence and writes
// the canonical ledger entry.
//
// Evidence Admitted
// ≠
// Evidence Persisted
//
// Evidence Persisted
// ≠
// Ledger Write Completed
//
// Ledger Write Completed
// ≠
// Audit Performed
//
// ============================================================

import type {
  ProviderRuntimeEvidenceLedgerAdmissionMaterial,
  ProviderRuntimeEvidenceLedgerAdmissionResult,
} from "./P9Q.provider.runtime.evidence.persistence.ledger.admission";


// ============================================================
// WRITE STATUS
// ============================================================

export type ProviderRuntimeEvidenceLedgerWriteStatus =
  | "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITTEN"
  | "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_WRITTEN"
  | "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITE_DENIED";


// ============================================================
// WRITE DECISION GATE
// ============================================================

export type ProviderRuntimeEvidenceLedgerWriteDecision =
  | "WRITE_PROVIDER_RUNTIME_EVIDENCE_TO_LEDGER"
  | "REJECT_PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITE";


// ============================================================
// WRITE DENIAL REASON
// ============================================================

export type ProviderRuntimeEvidenceLedgerWriteDenialReason =
  | "RUNTIME_EVIDENCE_LEDGER_WRITE_NOT_ALLOWED"
  | "RUNTIME_EVIDENCE_LEDGER_ADMISSION_DENIED";


// ============================================================
// WRITE FAILURE REASON
// ============================================================

export type ProviderRuntimeEvidenceLedgerWriteFailureReason =
  | "RUNTIME_EVIDENCE_NOT_ADMITTED"
  | "LEDGER_ADMISSION_MATERIAL_MISSING"
  | "LEDGER_ADMISSION_MATERIAL_INCOHERENT"
  | "LEDGER_WRITER_MISSING"
  | "LEDGER_WRITER_FAILED"
  | "LEDGER_WRITER_RESULT_INCOHERENT"
  | "LEDGER_WRITE_NOT_COMPLETED";


// ============================================================
// CANONICAL LEDGER ENTRY
// ============================================================

export interface ProviderRuntimeEvidenceLedgerEntry {

  ledgerEntryType:
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME";

  ledgerEntryVersion:
    "P9R.1";

  certifiedExecutionOutcome:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["certifiedExecutionOutcome"];

  providerContract:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["providerContract"];

  providerImplementation:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["providerImplementation"];

  operation:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["operation"];

  providerResourceId?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["executionMetadata"];

  verificationStatus:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["failureCode"];

  providerRawStatus?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["recoveryIntakeRequired"];

  recoveryIntakeReady:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["recoveryIntakeReady"];

  recoveryReason?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["recoveryReason"];

  runtimeResponse:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["runtimeResponse"];

  responseExecutionStatus:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["responseExecutionStatus"];

  runtimeResponseExecutionAttempted:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["runtimeResponseExecutionAttempted"];

  runtimeResponseExecuted:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["runtimeResponseExecuted"];

  runtimeInterventionNotRequired:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["runtimeInterventionNotRequired"];

  executorFailureContained:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial["executorFailureContained"];

  responseDecisionSummary:
    string[];

  executorSummary?:
    string[];

  responseExecutionSummary:
    string[];

  certificationSummary:
    string[];

}


// ============================================================
// GOVERNED LEDGER WRITER CONTRACT
// ============================================================

export interface ProviderRuntimeEvidenceLedgerWriterInput {

  ledgerEntry:
    ProviderRuntimeEvidenceLedgerEntry;

}


export interface ProviderRuntimeEvidenceLedgerWriterResult {

  writerStatus:
    | "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITER_COMPLETED"
    | "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITER_FAILED";

  writerAttempted:
    boolean;

  writerCompleted:
    boolean;

  persistenceId?:
    string;

  ledgerEntryId?:
    string;

  ledgerSequence?:
    number;

  persistedAt?:
    string;

  writerFailureReason?:
    string;

  summary:
    string[];

}


export type ProviderRuntimeEvidenceLedgerWriter =
  (
    input:
      ProviderRuntimeEvidenceLedgerWriterInput
  ) =>
    ProviderRuntimeEvidenceLedgerWriterResult;


// ============================================================
// INPUT
// ============================================================

export interface ProviderRuntimeEvidenceLedgerWriteInput {

  admission:
    ProviderRuntimeEvidenceLedgerAdmissionResult;

  writeDecision:
    ProviderRuntimeEvidenceLedgerWriteDecision;

  ledgerWriter?:
    ProviderRuntimeEvidenceLedgerWriter;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderRuntimeEvidenceLedgerWriteResult {

  writeStatus:
    ProviderRuntimeEvidenceLedgerWriteStatus;

  writeDecision:
    ProviderRuntimeEvidenceLedgerWriteDecision;

  runtimeEvidenceLedgerWriteAttempted:
    boolean;

  runtimeEvidencePersisted:
    boolean;

  runtimeEvidenceLedgerWritten:
    boolean;

  runtimeEvidenceLedgerWriteDenied:
    boolean;

  writeDenialReason?:
    ProviderRuntimeEvidenceLedgerWriteDenialReason;

  writeFailureReason?:
    ProviderRuntimeEvidenceLedgerWriteFailureReason;

  certifiedExecutionOutcome?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["certifiedExecutionOutcome"];

  providerContract:
    ProviderRuntimeEvidenceLedgerAdmissionResult["providerContract"];

  providerImplementation:
    ProviderRuntimeEvidenceLedgerAdmissionResult["providerImplementation"];

  operation:
    ProviderRuntimeEvidenceLedgerAdmissionResult["operation"];

  providerResourceId?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["executionMetadata"];

  verificationStatus:
    ProviderRuntimeEvidenceLedgerAdmissionResult["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeEvidenceLedgerAdmissionResult["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["failureCode"];

  providerRawStatus?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeEvidenceLedgerAdmissionResult["recoveryIntakeRequired"];

  recoveryIntakeReady:
    ProviderRuntimeEvidenceLedgerAdmissionResult["recoveryIntakeReady"];

  recoveryReason?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["recoveryReason"];

  runtimeResponse?:
    ProviderRuntimeEvidenceLedgerAdmissionResult["runtimeResponse"];

  responseExecutionStatus:
    ProviderRuntimeEvidenceLedgerAdmissionResult["responseExecutionStatus"];

  runtimeResponseExecutionAttempted:
    ProviderRuntimeEvidenceLedgerAdmissionResult["runtimeResponseExecutionAttempted"];

  runtimeResponseExecuted:
    ProviderRuntimeEvidenceLedgerAdmissionResult["runtimeResponseExecuted"];

  runtimeInterventionNotRequired:
    ProviderRuntimeEvidenceLedgerAdmissionResult["runtimeInterventionNotRequired"];

  executorFailureContained:
    ProviderRuntimeEvidenceLedgerAdmissionResult["executorFailureContained"];

  ledgerEntry?:
    ProviderRuntimeEvidenceLedgerEntry;

  persistenceId?:
    string;

  ledgerEntryId?:
    string;

  ledgerSequence?:
    number;

  persistedAt?:
    string;

  admissionSummary:
    string[];

  writerSummary?:
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
// ADMISSION MATERIAL COHERENCE
// ============================================================

function admissionMaterialIsCoherent(
  admission:
    ProviderRuntimeEvidenceLedgerAdmissionResult,
  material:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial
): boolean {

  return (

    material.evidenceType ===
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME" &&

    admission.certifiedExecutionOutcome ===
      material.certifiedExecutionOutcome &&

    admission.providerContract ===
      material.providerContract &&

    admission.providerImplementation ===
      material.providerImplementation &&

    admission.operation ===
      material.operation &&

    admission.providerResourceId ===
      material.providerResourceId &&

    admission.providerConfigurationRef ===
      material.providerConfigurationRef &&

    admission.providerCredentialRef ===
      material.providerCredentialRef &&

    admission.verificationStatus ===
      material.verificationStatus &&

    admission.verificationFailureReason ===
      material.verificationFailureReason &&

    admission.classificationStatus ===
      material.classificationStatus &&

    admission.runtimeFailureClass ===
      material.runtimeFailureClass &&

    admission.runtimeFailureSeverity ===
      material.runtimeFailureSeverity &&

    admission.failureCode ===
      material.failureCode &&

    admission.providerRawStatus ===
      material.providerRawStatus &&

    admission.providerRawErrorCode ===
      material.providerRawErrorCode &&

    admission.providerSanitizedErrorMessage ===
      material.providerSanitizedErrorMessage &&

    admission.retryable ===
      material.retryable &&

    admission.recoveryIntakeRequired ===
      material.recoveryIntakeRequired &&

    admission.recoveryIntakeReady ===
      material.recoveryIntakeReady &&

    admission.recoveryReason ===
      material.recoveryReason &&

    admission.runtimeResponse ===
      material.runtimeResponse &&

    admission.responseExecutionStatus ===
      material.responseExecutionStatus &&

    admission.runtimeResponseExecutionAttempted ===
      material.runtimeResponseExecutionAttempted &&

    admission.runtimeResponseExecuted ===
      material.runtimeResponseExecuted &&

    admission.runtimeInterventionNotRequired ===
      material.runtimeInterventionNotRequired &&

    admission.executorFailureContained ===
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

    (
      material.executorFailureContained === false ||
      copySummary(
        material.executorSummary
      ).length > 0
    )

  );

}


// ============================================================
// CANONICAL LEDGER ENTRY COMPOSITION
// ============================================================

function buildCanonicalLedgerEntry(
  material:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial
): ProviderRuntimeEvidenceLedgerEntry {

  const executorSummary =
    copySummary(
      material.executorSummary
    );

  return {

    ledgerEntryType:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME",

    ledgerEntryVersion:
      "P9R.1",

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

  };

}


// ============================================================
// WRITER RESULT VALIDATION
// ============================================================

function writerResultIsCompleted(
  result:
    ProviderRuntimeEvidenceLedgerWriterResult
): boolean {

  return (

    result.writerStatus ===
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITER_COMPLETED" &&

    result.writerAttempted === true &&

    result.writerCompleted === true &&

    hasNonEmptyString(
      result.persistenceId
    ) &&

    hasNonEmptyString(
      result.ledgerEntryId
    ) &&

    isPositiveInteger(
      result.ledgerSequence
    ) &&

    hasNonEmptyString(
      result.persistedAt
    ) &&

    result.writerFailureReason ===
      undefined &&

    copySummary(
      result.summary
    ).length > 0

  );

}


function writerResultIsFailed(
  result:
    ProviderRuntimeEvidenceLedgerWriterResult
): boolean {

  return (

    result.writerStatus ===
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITER_FAILED" &&

    result.writerAttempted === true &&

    result.writerCompleted === false &&

    hasNonEmptyString(
      result.writerFailureReason
    ) &&

    result.persistenceId ===
      undefined &&

    result.ledgerEntryId ===
      undefined &&

    result.ledgerSequence ===
      undefined &&

    result.persistedAt ===
      undefined &&

    copySummary(
      result.summary
    ).length > 0

  );

}


// ============================================================
// SHARED RESULT CONTEXT
// ============================================================

function resultContext(
  admission:
    ProviderRuntimeEvidenceLedgerAdmissionResult
) {

  return {

    certifiedExecutionOutcome:
      admission.certifiedExecutionOutcome,

    providerContract:
      admission.providerContract,

    providerImplementation:
      admission.providerImplementation,

    operation:
      admission.operation,

    providerResourceId:
      admission.providerResourceId,

    providerConfigurationRef:
      admission.providerConfigurationRef,

    providerCredentialRef:
      admission.providerCredentialRef,

    executionMetadata:
      admission.executionMetadata,

    verificationStatus:
      admission.verificationStatus,

    verificationFailureReason:
      admission.verificationFailureReason,

    classificationStatus:
      admission.classificationStatus,

    runtimeFailureClass:
      admission.runtimeFailureClass,

    runtimeFailureSeverity:
      admission.runtimeFailureSeverity,

    failureCode:
      admission.failureCode,

    providerRawStatus:
      admission.providerRawStatus,

    providerRawErrorCode:
      admission.providerRawErrorCode,

    providerSanitizedErrorMessage:
      admission.providerSanitizedErrorMessage,

    retryable:
      admission.retryable,

    recoveryIntakeRequired:
      admission.recoveryIntakeRequired,

    recoveryIntakeReady:
      admission.recoveryIntakeReady,

    recoveryReason:
      admission.recoveryReason,

    runtimeResponse:
      admission.runtimeResponse,

    responseExecutionStatus:
      admission.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      admission.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      admission.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      admission.runtimeInterventionNotRequired,

    executorFailureContained:
      admission.executorFailureContained,

    admissionSummary:
      copySummary(
        admission.summary
      ),

  };

}


// ============================================================
// DENIED RESULT
// ============================================================

function buildDeniedResult(
  input:
    ProviderRuntimeEvidenceLedgerWriteInput,
  writeDenialReason:
    ProviderRuntimeEvidenceLedgerWriteDenialReason,
  summaryToken:
    string
): ProviderRuntimeEvidenceLedgerWriteResult {

  return {

    writeStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITE_DENIED",

    writeDecision:
      input.writeDecision,

    runtimeEvidenceLedgerWriteAttempted:
      false,

    runtimeEvidencePersisted:
      false,

    runtimeEvidenceLedgerWritten:
      false,

    runtimeEvidenceLedgerWriteDenied:
      true,

    writeDenialReason,

    ...resultContext(
      input.admission
    ),

    summary: [
      ...copySummary(
        input.admission.summary
      ),
      "provider_runtime_evidence_ledger_write_denied",
      summaryToken,
    ],

  };

}


// ============================================================
// NOT WRITTEN RESULT
// ============================================================

function buildNotWrittenResult(
  input:
    ProviderRuntimeEvidenceLedgerWriteInput,
  writeFailureReason:
    ProviderRuntimeEvidenceLedgerWriteFailureReason,
  summaryToken:
    string,
  ledgerEntry?:
    ProviderRuntimeEvidenceLedgerEntry,
  writerSummary?:
    string[]
): ProviderRuntimeEvidenceLedgerWriteResult {

  return {

    writeStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_WRITTEN",

    writeDecision:
      input.writeDecision,

    runtimeEvidenceLedgerWriteAttempted:
      true,

    runtimeEvidencePersisted:
      false,

    runtimeEvidenceLedgerWritten:
      false,

    runtimeEvidenceLedgerWriteDenied:
      false,

    writeFailureReason,

    ...resultContext(
      input.admission
    ),

    ledgerEntry,

    writerSummary:
      writerSummary &&
      writerSummary.length > 0
        ? [
            ...writerSummary,
          ]
        : undefined,

    summary: [
      ...copySummary(
        input.admission.summary
      ),
      ...(writerSummary ?? []),
      "provider_runtime_evidence_ledger_not_written",
      summaryToken,
    ],

  };

}


// ============================================================
// LEDGER WRITE
// ============================================================

export function writeProviderRuntimeEvidenceToLedger(
  input:
    ProviderRuntimeEvidenceLedgerWriteInput
): ProviderRuntimeEvidenceLedgerWriteResult {

  const admission =
    input.admission;

  // ----------------------------------------------------------
  // 1. WRITE DECISION REJECTED
  // ----------------------------------------------------------

  if (
    input.writeDecision ===
    "REJECT_PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITE"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_EVIDENCE_LEDGER_WRITE_NOT_ALLOWED",
      "runtime_evidence_ledger_write_not_allowed"
    );

  }

  // ----------------------------------------------------------
  // 2. P9Q ADMISSION DENIED
  // ----------------------------------------------------------

  if (
    admission.admissionStatus ===
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION_DENIED"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_EVIDENCE_LEDGER_ADMISSION_DENIED",
      "runtime_evidence_ledger_admission_denied"
    );

  }

  // ----------------------------------------------------------
  // 3. EVIDENCE MUST BE ADMITTED
  // ----------------------------------------------------------

  if (
    admission.admissionStatus !==
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMITTED" ||
    admission.runtimeEvidenceLedgerAdmitted !==
      true
  ) {

    return buildNotWrittenResult(
      input,
      "RUNTIME_EVIDENCE_NOT_ADMITTED",
      "runtime_evidence_not_admitted"
    );

  }

  // ----------------------------------------------------------
  // 4. ADMISSION MATERIAL REQUIRED
  // ----------------------------------------------------------

  const material =
    admission.ledgerAdmissionMaterial;

  if (!material) {

    return buildNotWrittenResult(
      input,
      "LEDGER_ADMISSION_MATERIAL_MISSING",
      "ledger_admission_material_missing"
    );

  }

  // ----------------------------------------------------------
  // 5. ADMISSION MATERIAL COHERENCE
  // ----------------------------------------------------------

  if (
    !admissionMaterialIsCoherent(
      admission,
      material
    )
  ) {

    return buildNotWrittenResult(
      input,
      "LEDGER_ADMISSION_MATERIAL_INCOHERENT",
      "ledger_admission_material_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 6. GOVERNED LEDGER WRITER REQUIRED
  // ----------------------------------------------------------

  const ledgerWriter =
    input.ledgerWriter;

  if (!ledgerWriter) {

    return buildNotWrittenResult(
      input,
      "LEDGER_WRITER_MISSING",
      "ledger_writer_missing"
    );

  }

  // ----------------------------------------------------------
  // 7. COMPOSE CANONICAL LEDGER ENTRY
  // ----------------------------------------------------------

  const ledgerEntry =
    buildCanonicalLedgerEntry(
      material
    );

  // ----------------------------------------------------------
  // 8. INVOKE GOVERNED LEDGER WRITER
  // ----------------------------------------------------------

  let writerResult:
    ProviderRuntimeEvidenceLedgerWriterResult;

  try {

    writerResult =
      ledgerWriter({
        ledgerEntry,
      });

  } catch {

    return buildNotWrittenResult(
      input,
      "LEDGER_WRITER_FAILED",
      "ledger_writer_failed",
      ledgerEntry,
      [
        "provider_runtime_evidence_ledger_writer_threw",
      ]
    );

  }

  const writerSummary =
    copySummary(
      writerResult.summary
    );

  // ----------------------------------------------------------
  // 9. WRITER FAILURE CONTAINMENT
  // ----------------------------------------------------------

  if (
    writerResult.writerStatus ===
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITER_FAILED"
  ) {

    if (
      !writerResultIsFailed(
        writerResult
      )
    ) {

      return buildNotWrittenResult(
        input,
        "LEDGER_WRITER_RESULT_INCOHERENT",
        "ledger_writer_result_incoherent",
        ledgerEntry,
        writerSummary
      );

    }

    return buildNotWrittenResult(
      input,
      "LEDGER_WRITER_FAILED",
      "ledger_writer_failed",
      ledgerEntry,
      writerSummary
    );

  }

  // ----------------------------------------------------------
  // 10. WRITER SUCCESS COHERENCE
  // ----------------------------------------------------------

  if (
    !writerResultIsCompleted(
      writerResult
    )
  ) {

    return buildNotWrittenResult(
      input,
      "LEDGER_WRITER_RESULT_INCOHERENT",
      "ledger_writer_result_incoherent",
      ledgerEntry,
      writerSummary
    );

  }

  // ----------------------------------------------------------
  // 11. WRITE COMPLETED
  // ----------------------------------------------------------

  return {

    writeStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_WRITTEN",

    writeDecision:
      input.writeDecision,

    runtimeEvidenceLedgerWriteAttempted:
      true,

    runtimeEvidencePersisted:
      true,

    runtimeEvidenceLedgerWritten:
      true,

    runtimeEvidenceLedgerWriteDenied:
      false,

    ...resultContext(
      admission
    ),

    ledgerEntry,

    persistenceId:
      writerResult.persistenceId,

    ledgerEntryId:
      writerResult.ledgerEntryId,

    ledgerSequence:
      writerResult.ledgerSequence,

    persistedAt:
      writerResult.persistedAt,

    writerSummary,

    summary: [
      ...copySummary(
        admission.summary
      ),
      ...writerSummary,
      "provider_runtime_evidence_persisted",
      "provider_runtime_evidence_ledger_written",
      material.certifiedExecutionOutcome.toLowerCase(),
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Runtime Evidence Persistence / Ledger Write
// receives:
//
// - P9Q admission result
// - explicit write decision
// - governed ledger writer
//
// It composes one canonical ledger entry.
//
// It invokes exactly one governed writer.
//
// It exposes durable identifiers only when
// the writer reports a coherent completed write.
//
// P9R does not audit the resulting ledger entry.
//
// ============================================================


// ============================================================
// WRITE PRINCIPLES
// ============================================================
//
// Evidence Admitted
// ≠
// Evidence Persisted
//
// Evidence Persisted
// ≠
// Ledger Write Completed
//
// Writer Invoked
// ≠
// Writer Completed
//
// Writer Completed
// ≠
// Writer Result Coherent
//
// Ledger Entry Written
// ≠
// Audit Performed
//
// Contained Runtime Failure
// ≠
// Ledger Write Failure
//
// A certified contained runtime failure may be
// successfully persisted as a canonical fact.
//
// ============================================================


// ============================================================
// PERSISTENCE BOUNDARY
// ============================================================
//
// P9R is the first provider-runtime boundary
// permitted to claim:
//
// - evidence persisted
// - ledger entry written
// - persistence identifier assigned
// - ledger entry identifier assigned
// - ledger sequence assigned
// - persistence timestamp assigned
//
// Those claims are allowed only after a coherent
// governed writer result.
//
// P9R must never manufacture durable identifiers.
//
// P9R must never claim persistence after writer failure.
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
// - invoke response executors
// - certify execution outcome
// - admit evidence
// - repair P9Q admission material
// - infer missing ledger material
// - replace the P9N-selected response
// - alter the P9O execution result
// - alter the P9P certification result
// - alter the P9Q admission result
// - call provider SDKs
// - call provider APIs
// - re-sanitize provider errors
// - alter sanitized failure surfaces
// - manufacture persistence identifiers
// - manufacture ledger entry identifiers
// - manufacture ledger sequence
// - perform audit
// - write audit records
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive P9Q admission result
//
// ✓ distinguish write denied from
//   write not completed
//
// ✓ require admitted canonical evidence
//
// ✓ require coherent admission material
//
// ✓ compose one canonical ledger entry
//
// ✓ require one governed ledger writer
//
// ✓ contain writer exceptions
//
// ✓ contain writer-reported failure
//
// ✓ reject incoherent writer results
//
// ✓ expose durable identifiers only after
//   coherent completed write
//
// ✓ persist successful certified outcomes
//
// ✓ persist contained-failure certified outcomes
//
// ✓ copy summary material defensively
//
// ✓ preserve P9L/P9M/P9N/P9O/P9P/P9Q lineage
//
// ✗ verify runtime
//
// ✗ classify runtime failure
//
// ✗ decide runtime response
//
// ✗ execute runtime response
//
// ✗ certify outcome
//
// ✗ admit evidence
//
// ✗ manufacture durable identifiers
//
// ✗ audit
//
// ============================================================