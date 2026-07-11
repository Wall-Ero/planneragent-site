// ============================================================
// PlannerAgent — Provider Runtime Evidence Persistence / Ledger Admission
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9Q.provider.runtime.evidence.persistence.ledger.admission.ts
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
// P9Q.1 — Provider Runtime Evidence Persistence / Ledger Admission
//
// PURPOSE
// ------------------------------------------------------------
// Decide whether a P9P-certified provider runtime
// execution outcome is admissible for governed
// persistence and ledger recording.
//
// P9Q receives:
//
// - ProviderRuntimeExecutionOutcomeCertificationResult
// - an explicit ledger-admission decision gate
//
// P9Q validates:
//
// - P9P certification state
// - certified execution outcome presence
// - canonical execution evidence presence
// - evidence/result runtime-context coherence
// - evidence/result response coherence
// - evidence/result execution-state coherence
// - summary shape and evidence sufficiency
//
// P9Q decides:
//
// - evidence admitted for governed persistence
// - evidence not admitted
// - evidence admission denied
//
// P9Q does not persist evidence.
//
// P9Q does not write ledger.
//
// P9Q does not write audit.
//
// P9Q does not verify runtime.
//
// P9Q does not classify failure.
//
// P9Q does not decide or execute runtime response.
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// P9P certifies canonical execution outcome.
//
// P9Q admits certified evidence for governed
// persistence and ledger recording.
//
// A later persistence boundary writes.
//
// Certified Evidence
// ≠
// Evidence Admitted
//
// Evidence Admitted
// ≠
// Evidence Persisted
//
// Evidence Persisted
// ≠
// Ledger Entry Written
//
// ============================================================

import type {
  ProviderRuntimeCertifiedExecutionOutcome,
  ProviderRuntimeExecutionOutcomeCertificationResult,
} from "./P9P.provider.runtime.execution.outcome.certification";


// ============================================================
// ADMISSION STATUS
// ============================================================

export type ProviderRuntimeEvidenceLedgerAdmissionStatus =
  | "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMITTED"
  | "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_ADMITTED"
  | "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION_DENIED";


// ============================================================
// ADMISSION DECISION GATE
// ============================================================

export type ProviderRuntimeEvidenceLedgerAdmissionDecision =
  | "ADMIT_PROVIDER_RUNTIME_EVIDENCE_TO_LEDGER"
  | "REJECT_PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION";


// ============================================================
// ADMISSION DENIAL REASON
// ============================================================

export type ProviderRuntimeEvidenceLedgerAdmissionDenialReason =
  | "RUNTIME_EVIDENCE_LEDGER_ADMISSION_NOT_ALLOWED"
  | "RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_DENIED";


// ============================================================
// ADMISSION FAILURE REASON
// ============================================================

export type ProviderRuntimeEvidenceLedgerAdmissionFailureReason =
  | "RUNTIME_EXECUTION_OUTCOME_NOT_CERTIFIED"
  | "CERTIFIED_EXECUTION_OUTCOME_MISSING"
  | "CANONICAL_EXECUTION_EVIDENCE_MISSING"
  | "CANONICAL_EXECUTION_EVIDENCE_INVALID"
  | "RUNTIME_EVIDENCE_CONTEXT_INCOHERENT"
  | "RUNTIME_EVIDENCE_RESPONSE_INCOHERENT"
  | "RUNTIME_EVIDENCE_EXECUTION_STATE_INCOHERENT"
  | "RUNTIME_EVIDENCE_SUMMARY_INVALID"
  | "RUNTIME_EVIDENCE_NOT_ADMISSIBLE";


// ============================================================
// LEDGER ADMISSION MATERIAL
// ============================================================

export interface ProviderRuntimeEvidenceLedgerAdmissionMaterial {

  evidenceType:
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME";

  certifiedExecutionOutcome:
    ProviderRuntimeCertifiedExecutionOutcome;

  providerContract:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerContract"];

  providerImplementation:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerImplementation"];

  operation:
    ProviderRuntimeExecutionOutcomeCertificationResult["operation"];

  providerResourceId?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeExecutionOutcomeCertificationResult["executionMetadata"];

  verificationStatus:
    ProviderRuntimeExecutionOutcomeCertificationResult["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeExecutionOutcomeCertificationResult["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeExecutionOutcomeCertificationResult["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeExecutionOutcomeCertificationResult["failureCode"];

  providerRawStatus?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeExecutionOutcomeCertificationResult["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeExecutionOutcomeCertificationResult["recoveryIntakeRequired"];

  recoveryIntakeReady:
    ProviderRuntimeExecutionOutcomeCertificationResult["recoveryIntakeReady"];

  recoveryReason?:
    ProviderRuntimeExecutionOutcomeCertificationResult["recoveryReason"];

  runtimeResponse:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeResponse"];

  responseExecutionStatus:
    ProviderRuntimeExecutionOutcomeCertificationResult["responseExecutionStatus"];

  runtimeResponseExecutionAttempted:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeResponseExecutionAttempted"];

  runtimeResponseExecuted:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeResponseExecuted"];

  runtimeInterventionNotRequired:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeInterventionNotRequired"];

  executorFailureContained:
    boolean;

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
// INPUT
// ============================================================

export interface ProviderRuntimeEvidenceLedgerAdmissionInput {

  certification:
    ProviderRuntimeExecutionOutcomeCertificationResult;

  admissionDecision:
    ProviderRuntimeEvidenceLedgerAdmissionDecision;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderRuntimeEvidenceLedgerAdmissionResult {

  admissionStatus:
    ProviderRuntimeEvidenceLedgerAdmissionStatus;

  admissionDecision:
    ProviderRuntimeEvidenceLedgerAdmissionDecision;

  runtimeEvidenceLedgerAdmissionAttempted:
    boolean;

  runtimeEvidenceLedgerAdmitted:
    boolean;

  runtimeEvidenceLedgerAdmissionDenied:
    boolean;

  admissionDenialReason?:
    ProviderRuntimeEvidenceLedgerAdmissionDenialReason;

  admissionFailureReason?:
    ProviderRuntimeEvidenceLedgerAdmissionFailureReason;

  certifiedExecutionOutcome?:
    ProviderRuntimeExecutionOutcomeCertificationResult["certifiedExecutionOutcome"];

  providerContract:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerContract"];

  providerImplementation:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerImplementation"];

  operation:
    ProviderRuntimeExecutionOutcomeCertificationResult["operation"];

  providerResourceId?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerCredentialRef"];

  executionMetadata?:
    ProviderRuntimeExecutionOutcomeCertificationResult["executionMetadata"];

  verificationStatus:
    ProviderRuntimeExecutionOutcomeCertificationResult["verificationStatus"];

  verificationFailureReason?:
    ProviderRuntimeExecutionOutcomeCertificationResult["verificationFailureReason"];

  classificationStatus:
    ProviderRuntimeExecutionOutcomeCertificationResult["classificationStatus"];

  runtimeFailureClass?:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeFailureClass"];

  runtimeFailureSeverity?:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeFailureSeverity"];

  failureCode?:
    ProviderRuntimeExecutionOutcomeCertificationResult["failureCode"];

  providerRawStatus?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerRawStatus"];

  providerRawErrorCode?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerRawErrorCode"];

  providerSanitizedErrorMessage?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerSanitizedErrorMessage"];

  retryable?:
    ProviderRuntimeExecutionOutcomeCertificationResult["retryable"];

  recoveryIntakeRequired:
    ProviderRuntimeExecutionOutcomeCertificationResult["recoveryIntakeRequired"];

  recoveryIntakeReady:
    ProviderRuntimeExecutionOutcomeCertificationResult["recoveryIntakeReady"];

  recoveryReason?:
    ProviderRuntimeExecutionOutcomeCertificationResult["recoveryReason"];

  runtimeResponse?:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeResponse"];

  responseExecutionStatus:
    ProviderRuntimeExecutionOutcomeCertificationResult["responseExecutionStatus"];

  runtimeResponseExecutionAttempted:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeResponseExecutionAttempted"];

  runtimeResponseExecuted:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeResponseExecuted"];

  runtimeInterventionNotRequired:
    ProviderRuntimeExecutionOutcomeCertificationResult["runtimeInterventionNotRequired"];

  executorFailureContained:
    boolean;

  ledgerAdmissionMaterial?:
    ProviderRuntimeEvidenceLedgerAdmissionMaterial;

  certificationSummary:
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
// OBJECT / VALUE HELPERS
// ============================================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {

  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );

}


function hasNonEmptyString(
  value: unknown
): value is string {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );

}


// ============================================================
// CERTIFIED OUTCOME VALIDATION
// ============================================================

function isCertifiedExecutionOutcome(
  value: unknown
): value is ProviderRuntimeCertifiedExecutionOutcome {

  return (
    value === "NO_ACTION_COMPLETED" ||
    value === "RETRY_COMPLETED" ||
    value === "RECOVERY_COMPLETED" ||
    value === "FAILOVER_COMPLETED" ||
    value === "STOP_COMPLETED" ||
    value === "ESCALATION_COMPLETED" ||
    value === "RETRY_FAILED" ||
    value === "RECOVERY_FAILED" ||
    value === "FAILOVER_FAILED" ||
    value === "STOP_FAILED" ||
    value === "ESCALATION_FAILED"
  );

}


// ============================================================
// CANONICAL EVIDENCE ACCESS
// ============================================================

function executionEvidenceOf(
  certification:
    ProviderRuntimeExecutionOutcomeCertificationResult
): Record<string, unknown> | undefined {

  const evidence =
    certification.executionEvidence;

  return isRecord(evidence)
    ? evidence
    : undefined;

}


// ============================================================
// RUNTIME CONTEXT COMPARISON
// ============================================================

interface ProviderRuntimeContext {

  providerContract:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerContract"];

  providerImplementation:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerImplementation"];

  operation:
    ProviderRuntimeExecutionOutcomeCertificationResult["operation"];

  providerResourceId?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerResourceId"];

  providerConfigurationRef?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerConfigurationRef"];

  providerCredentialRef?:
    ProviderRuntimeExecutionOutcomeCertificationResult["providerCredentialRef"];

}


function runtimeContextsMatch(
  left: ProviderRuntimeContext,
  right: Record<string, unknown>
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


// ============================================================
// EVIDENCE SHAPE VALIDATION
// ============================================================

function canonicalEvidenceShapeIsValid(
  certification:
    ProviderRuntimeExecutionOutcomeCertificationResult,
  evidence:
    Record<string, unknown>
): boolean {

  return (
    evidence.evidenceType ===
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME" &&

    isCertifiedExecutionOutcome(
      evidence.certifiedExecutionOutcome
    ) &&

    hasNonEmptyString(
      evidence.providerContract
    ) &&

    hasNonEmptyString(
      evidence.providerImplementation
    ) &&

    hasNonEmptyString(
      evidence.operation
    ) &&

    Array.isArray(
      evidence.responseDecisionSummary
    ) &&

    Array.isArray(
      evidence.responseExecutionSummary
    ) &&

    evidence.certifiedExecutionOutcome ===
      certification.certifiedExecutionOutcome
  );

}


// ============================================================
// EVIDENCE / CERTIFICATION COHERENCE
// ============================================================

function evidenceContextIsCoherent(
  certification:
    ProviderRuntimeExecutionOutcomeCertificationResult,
  evidence:
    Record<string, unknown>
): boolean {

  return runtimeContextsMatch(
    certification,
    evidence
  );

}


function evidenceResponseIsCoherent(
  certification:
    ProviderRuntimeExecutionOutcomeCertificationResult,
  evidence:
    Record<string, unknown>
): boolean {

  return (
    evidence.runtimeResponse ===
      certification.runtimeResponse &&

    evidence.certifiedExecutionOutcome ===
      certification.certifiedExecutionOutcome
  );

}


function evidenceExecutionStateIsCoherent(
  certification:
    ProviderRuntimeExecutionOutcomeCertificationResult,
  evidence:
    Record<string, unknown>
): boolean {

  return (
    evidence.responseExecutionStatus ===
      certification.responseExecutionStatus &&

    evidence.runtimeResponseExecutionAttempted ===
      certification.runtimeResponseExecutionAttempted &&

    evidence.runtimeResponseExecuted ===
      certification.runtimeResponseExecuted &&

    evidence.runtimeInterventionNotRequired ===
      certification.runtimeInterventionNotRequired
  );

}


function evidenceSummariesAreValid(
  certification:
    ProviderRuntimeExecutionOutcomeCertificationResult,
  evidence:
    Record<string, unknown>
): boolean {

  const responseDecisionSummary =
    copySummary(
      evidence.responseDecisionSummary
    );

  const responseExecutionSummary =
    copySummary(
      evidence.responseExecutionSummary
    );

  const certificationSummary =
    copySummary(
      certification.summary
    );

  if (
    responseDecisionSummary.length === 0 ||
    responseExecutionSummary.length === 0 ||
    certificationSummary.length === 0
  ) {

    return false;

  }

  if (
    evidence.executorFailureContained === true &&
    copySummary(
      evidence.executorSummary
    ).length === 0
  ) {

    return false;

  }

  return true;

}


// ============================================================
// ADMISSION MATERIAL BUILDER
// ============================================================

function buildLedgerAdmissionMaterial(
  certification:
    ProviderRuntimeExecutionOutcomeCertificationResult,
  evidence:
    Record<string, unknown>
): ProviderRuntimeEvidenceLedgerAdmissionMaterial {

  return {

    evidenceType:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME",

    certifiedExecutionOutcome:
      certification.certifiedExecutionOutcome as
        ProviderRuntimeCertifiedExecutionOutcome,

    providerContract:
      certification.providerContract,

    providerImplementation:
      certification.providerImplementation,

    operation:
      certification.operation,

    providerResourceId:
      certification.providerResourceId,

    providerConfigurationRef:
      certification.providerConfigurationRef,

    providerCredentialRef:
      certification.providerCredentialRef,

    executionMetadata:
      certification.executionMetadata,

    verificationStatus:
      certification.verificationStatus,

    verificationFailureReason:
      certification.verificationFailureReason,

    classificationStatus:
      certification.classificationStatus,

    runtimeFailureClass:
      certification.runtimeFailureClass,

    runtimeFailureSeverity:
      certification.runtimeFailureSeverity,

    failureCode:
      certification.failureCode,

    providerRawStatus:
      certification.providerRawStatus,

    providerRawErrorCode:
      certification.providerRawErrorCode,

    providerSanitizedErrorMessage:
      certification.providerSanitizedErrorMessage,

    retryable:
      certification.retryable,

    recoveryIntakeRequired:
      certification.recoveryIntakeRequired,

    recoveryIntakeReady:
      certification.recoveryIntakeReady,

    recoveryReason:
      certification.recoveryReason,

    runtimeResponse:
      certification.runtimeResponse,

    responseExecutionStatus:
      certification.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      certification.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      certification.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      certification.runtimeInterventionNotRequired,

    executorFailureContained:
      evidence.executorFailureContained === true,

    responseDecisionSummary:
      copySummary(
        evidence.responseDecisionSummary
      ),

    executorSummary:
      copySummary(
        evidence.executorSummary
      ).length > 0
        ? copySummary(
            evidence.executorSummary
          )
        : undefined,

    responseExecutionSummary:
      copySummary(
        evidence.responseExecutionSummary
      ),

    certificationSummary:
      copySummary(
        certification.summary
      ),

  };

}


// ============================================================
// SHARED RESULT CONTEXT
// ============================================================

function resultContext(
  certification:
    ProviderRuntimeExecutionOutcomeCertificationResult
) {

  const evidence =
    executionEvidenceOf(
      certification
    );

  return {

    certifiedExecutionOutcome:
      certification.certifiedExecutionOutcome,

    providerContract:
      certification.providerContract,

    providerImplementation:
      certification.providerImplementation,

    operation:
      certification.operation,

    providerResourceId:
      certification.providerResourceId,

    providerConfigurationRef:
      certification.providerConfigurationRef,

    providerCredentialRef:
      certification.providerCredentialRef,

    executionMetadata:
      certification.executionMetadata,

    verificationStatus:
      certification.verificationStatus,

    verificationFailureReason:
      certification.verificationFailureReason,

    classificationStatus:
      certification.classificationStatus,

    runtimeFailureClass:
      certification.runtimeFailureClass,

    runtimeFailureSeverity:
      certification.runtimeFailureSeverity,

    failureCode:
      certification.failureCode,

    providerRawStatus:
      certification.providerRawStatus,

    providerRawErrorCode:
      certification.providerRawErrorCode,

    providerSanitizedErrorMessage:
      certification.providerSanitizedErrorMessage,

    retryable:
      certification.retryable,

    recoveryIntakeRequired:
      certification.recoveryIntakeRequired,

    recoveryIntakeReady:
      certification.recoveryIntakeReady,

    recoveryReason:
      certification.recoveryReason,

    runtimeResponse:
      certification.runtimeResponse,

    responseExecutionStatus:
      certification.responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      certification.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      certification.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      certification.runtimeInterventionNotRequired,

    executorFailureContained:
      evidence?.executorFailureContained === true,

    certificationSummary:
      copySummary(
        certification.summary
      ),

  };

}


// ============================================================
// DENIED RESULT
// ============================================================

function buildDeniedResult(
  input:
    ProviderRuntimeEvidenceLedgerAdmissionInput,
  admissionDenialReason:
    ProviderRuntimeEvidenceLedgerAdmissionDenialReason,
  summaryToken:
    string
): ProviderRuntimeEvidenceLedgerAdmissionResult {

  return {

    admissionStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION_DENIED",

    admissionDecision:
      input.admissionDecision,

    runtimeEvidenceLedgerAdmissionAttempted:
      false,

    runtimeEvidenceLedgerAdmitted:
      false,

    runtimeEvidenceLedgerAdmissionDenied:
      true,

    admissionDenialReason,

    ...resultContext(
      input.certification
    ),

    summary: [
      ...copySummary(
        input.certification.summary
      ),
      "provider_runtime_evidence_ledger_admission_denied",
      summaryToken,
    ],

  };

}


// ============================================================
// NOT ADMITTED RESULT
// ============================================================

function buildNotAdmittedResult(
  input:
    ProviderRuntimeEvidenceLedgerAdmissionInput,
  admissionFailureReason:
    ProviderRuntimeEvidenceLedgerAdmissionFailureReason,
  summaryToken:
    string
): ProviderRuntimeEvidenceLedgerAdmissionResult {

  return {

    admissionStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_ADMITTED",

    admissionDecision:
      input.admissionDecision,

    runtimeEvidenceLedgerAdmissionAttempted:
      true,

    runtimeEvidenceLedgerAdmitted:
      false,

    runtimeEvidenceLedgerAdmissionDenied:
      false,

    admissionFailureReason,

    ...resultContext(
      input.certification
    ),

    summary: [
      ...copySummary(
        input.certification.summary
      ),
      "provider_runtime_evidence_ledger_not_admitted",
      summaryToken,
    ],

  };

}


// ============================================================
// ADMISSION
// ============================================================

export function admitProviderRuntimeEvidenceToLedger(
  input:
    ProviderRuntimeEvidenceLedgerAdmissionInput
): ProviderRuntimeEvidenceLedgerAdmissionResult {

  const certification =
    input.certification;

  // ----------------------------------------------------------
  // 1. ADMISSION REJECTED
  // ----------------------------------------------------------

  if (
    input.admissionDecision ===
    "REJECT_PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_EVIDENCE_LEDGER_ADMISSION_NOT_ALLOWED",
      "runtime_evidence_ledger_admission_not_allowed"
    );

  }

  // ----------------------------------------------------------
  // 2. P9P CERTIFICATION DENIED
  // ----------------------------------------------------------

  if (
    certification.certificationStatus ===
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_DENIED"
  ) {

    return buildDeniedResult(
      input,
      "RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_DENIED",
      "runtime_execution_outcome_certification_denied"
    );

  }

  // ----------------------------------------------------------
  // 3. P9P OUTCOME NOT CERTIFIED
  // ----------------------------------------------------------

  if (
    certification.certificationStatus !==
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME_CERTIFIED" ||
    certification.runtimeExecutionOutcomeCertified !==
      true
  ) {

    return buildNotAdmittedResult(
      input,
      "RUNTIME_EXECUTION_OUTCOME_NOT_CERTIFIED",
      "runtime_execution_outcome_not_certified"
    );

  }

  // ----------------------------------------------------------
  // 4. CERTIFIED OUTCOME REQUIRED
  // ----------------------------------------------------------

  if (
    !isCertifiedExecutionOutcome(
      certification.certifiedExecutionOutcome
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "CERTIFIED_EXECUTION_OUTCOME_MISSING",
      "certified_execution_outcome_missing"
    );

  }

  // ----------------------------------------------------------
  // 5. CANONICAL EVIDENCE REQUIRED
  // ----------------------------------------------------------

  const evidence =
    executionEvidenceOf(
      certification
    );

  if (!evidence) {

    return buildNotAdmittedResult(
      input,
      "CANONICAL_EXECUTION_EVIDENCE_MISSING",
      "canonical_execution_evidence_missing"
    );

  }

  // ----------------------------------------------------------
  // 6. CANONICAL EVIDENCE SHAPE
  // ----------------------------------------------------------

  if (
    !canonicalEvidenceShapeIsValid(
      certification,
      evidence
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "CANONICAL_EXECUTION_EVIDENCE_INVALID",
      "canonical_execution_evidence_invalid"
    );

  }

  // ----------------------------------------------------------
  // 7. PROVIDER / RUNTIME CONTEXT COHERENCE
  // ----------------------------------------------------------

  if (
    !evidenceContextIsCoherent(
      certification,
      evidence
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "RUNTIME_EVIDENCE_CONTEXT_INCOHERENT",
      "runtime_evidence_context_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 8. RESPONSE COHERENCE
  // ----------------------------------------------------------

  if (
    !evidenceResponseIsCoherent(
      certification,
      evidence
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "RUNTIME_EVIDENCE_RESPONSE_INCOHERENT",
      "runtime_evidence_response_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 9. EXECUTION-STATE COHERENCE
  // ----------------------------------------------------------

  if (
    !evidenceExecutionStateIsCoherent(
      certification,
      evidence
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "RUNTIME_EVIDENCE_EXECUTION_STATE_INCOHERENT",
      "runtime_evidence_execution_state_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 10. SUMMARY SUFFICIENCY
  // ----------------------------------------------------------

  if (
    !evidenceSummariesAreValid(
      certification,
      evidence
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "RUNTIME_EVIDENCE_SUMMARY_INVALID",
      "runtime_evidence_summary_invalid"
    );

  }

  // ----------------------------------------------------------
  // 11. ADMIT CANONICAL EVIDENCE
  // ----------------------------------------------------------

  const ledgerAdmissionMaterial =
    buildLedgerAdmissionMaterial(
      certification,
      evidence
    );

  return {

    admissionStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMITTED",

    admissionDecision:
      input.admissionDecision,

    runtimeEvidenceLedgerAdmissionAttempted:
      true,

    runtimeEvidenceLedgerAdmitted:
      true,

    runtimeEvidenceLedgerAdmissionDenied:
      false,

    ...resultContext(
      certification
    ),

    ledgerAdmissionMaterial,

    summary: [
      ...copySummary(
        certification.summary
      ),
      "provider_runtime_evidence_ledger_admitted",
      certification.certifiedExecutionOutcome.toLowerCase(),
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// Provider Runtime Evidence Persistence / Ledger Admission
// receives:
//
// - P9P execution-outcome certification
// - an explicit admission decision
//
// It validates that certified evidence is:
//
// - present
// - canonical
// - context coherent
// - response coherent
// - execution-state coherent
// - summary sufficient
//
// It then prepares immutable admission material
// for a later governed persistence boundary.
//
// P9Q does not persist.
//
// P9Q does not write ledger.
//
// P9Q does not audit.
//
// ============================================================


// ============================================================
// ADMISSION PRINCIPLES
// ============================================================
//
// Certified Outcome
// ≠
// Evidence Admitted
//
// Evidence Admitted
// ≠
// Evidence Persisted
//
// Evidence Persisted
// ≠
// Ledger Entry Written
//
// Canonical Evidence Present
// ≠
// Canonical Evidence Coherent
//
// Contained Executor Failure
// ≠
// Uncertifiable Outcome
//
// A certified contained failure may be admitted
// because the certified fact is the failure outcome
// itself.
//
// Admission validates evidence.
//
// Persistence writes evidence.
//
// Ledger recording establishes durable chronology.
//
// Audit interprets recorded chronology.
//
// ============================================================


// ============================================================
// EVIDENCE ADMISSION BOUNDARY
// ============================================================
//
// P9Q.1 returns an admission decision and
// canonical ledger-admission material.
//
// The admission material is not proof that:
//
// - persistence occurred
// - a ledger entry exists
// - an audit record exists
//
// P9Q must not claim durable state.
//
// P9Q must not assign persistence identifiers.
//
// P9Q must not assign ledger sequence numbers.
//
// P9Q must not assign audit identifiers.
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
// - invoke governed executors
// - repair P9P evidence
// - infer missing evidence
// - replace the P9N-selected response
// - alter the P9O execution result
// - alter the P9P certification result
// - call provider SDKs
// - call provider APIs
// - re-sanitize provider errors
// - alter sanitized failure surfaces
// - persist evidence
// - write ledger
// - assign ledger sequence
// - write audit
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive P9P certification result
//
// ✓ distinguish admission denied from
//   evidence not admitted
//
// ✓ require certified execution outcome
//
// ✓ require canonical execution evidence
//
// ✓ validate evidence shape
//
// ✓ validate provider/runtime context coherence
//
// ✓ validate response coherence
//
// ✓ validate execution-state coherence
//
// ✓ validate summary sufficiency
//
// ✓ admit successful certified outcomes
//
// ✓ admit certified contained-failure outcomes
//
// ✓ prepare canonical ledger-admission material
//
// ✓ copy summaries defensively
//
// ✓ preserve P9L/P9M/P9N/P9O/P9P lineage
//
// ✗ verify runtime
//
// ✗ classify runtime failure
//
// ✗ decide runtime response
//
// ✗ execute runtime response
//
// ✗ persist evidence
//
// ✗ write ledger
//
// ✗ audit
//
// ============================================================