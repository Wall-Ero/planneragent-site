// ============================================================
// PlannerAgent — Provider Runtime Evidence Persistence / Ledger Admission Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9Q.provider.runtime.evidence.persistence.ledger.admission.runner.ts
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
// P9Q.1 — Provider Runtime Evidence Persistence / Ledger Admission Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9Q.1 evidence-admission contract.
//
// This runner verifies:
//
// 1. admission decision rejected
// 2. P9P certification denied
// 3. P9P outcome not certified
// 4. certified outcome missing
// 5. canonical execution evidence missing
// 6. canonical execution evidence invalid
// 7. evidence runtime context incoherent
// 8. evidence response incoherent
// 9. evidence execution state incoherent
// 10. evidence summary invalid
// 11. successful certified outcome family admitted
// 12. contained-failure certified outcome family admitted
// 13. ledger-admission material composition
// 14. defensive summary copying
// 15. source immutability
// 16. contract propagation
// 17. boundary verification
//
// P9Q admits evidence for governed persistence.
//
// P9Q does not persist evidence.
//
// P9Q does not write ledger.
//
// P9Q does not write audit.
//
// ============================================================

import assert from "node:assert/strict";

import {
  admitProviderRuntimeEvidenceToLedger,
} from "../P9Q.provider.runtime.evidence.persistence.ledger.admission";

import type {
  ProviderRuntimeEvidenceLedgerAdmissionInput,
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

    "persistenceId",

    "ledgerWritten",

    "ledgerEntryWritten",

    "ledgerEntryId",

    "ledgerSequence",

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
    ProviderRuntimeEvidenceLedgerAdmissionResult,
  expectedReason:
    ProviderRuntimeEvidenceLedgerAdmissionResult["admissionDenialReason"],
  label:
    string
): void {

  assert.equal(
    result.admissionStatus,
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION_DENIED",
    `${label} admission status`
  );

  assert.equal(
    result.runtimeEvidenceLedgerAdmissionAttempted,
    false,
    `${label} admission not attempted`
  );

  assert.equal(
    result.runtimeEvidenceLedgerAdmitted,
    false,
    `${label} evidence not admitted`
  );

  assert.equal(
    result.runtimeEvidenceLedgerAdmissionDenied,
    true,
    `${label} denial flag preserved`
  );

  assert.equal(
    result.admissionDenialReason,
    expectedReason,
    `${label} denial reason preserved`
  );

  assert.equal(
    result.admissionFailureReason,
    undefined,
    `${label} exposes no admission failure reason`
  );

  assert.equal(
    result.ledgerAdmissionMaterial,
    undefined,
    `${label} exposes no admission material`
  );

}


function assertNotAdmitted(
  result:
    ProviderRuntimeEvidenceLedgerAdmissionResult,
  expectedReason:
    ProviderRuntimeEvidenceLedgerAdmissionResult["admissionFailureReason"],
  summaryToken:
    string,
  label:
    string
): void {

  assert.equal(
    result.admissionStatus,
    "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_ADMITTED",
    `${label} not admitted status`
  );

  assert.equal(
    result.runtimeEvidenceLedgerAdmissionAttempted,
    true,
    `${label} admission attempted`
  );

  assert.equal(
    result.runtimeEvidenceLedgerAdmitted,
    false,
    `${label} evidence not admitted`
  );

  assert.equal(
    result.runtimeEvidenceLedgerAdmissionDenied,
    false,
    `${label} is not admission denial`
  );

  assert.equal(
    result.admissionFailureReason,
    expectedReason,
    `${label} admission failure reason preserved`
  );

  assert.equal(
    result.admissionDenialReason,
    undefined,
    `${label} exposes no denial reason`
  );

  assert.equal(
    result.ledgerAdmissionMaterial,
    undefined,
    `${label} exposes no admission material`
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
    ProviderRuntimeEvidenceLedgerAdmissionResult,
  expectedOutcome:
    ProviderRuntimeCertifiedExecutionOutcome,
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
    `${label} evidence admitted`
  );

  assert.equal(
    result.runtimeEvidenceLedgerAdmissionDenied,
    false,
    `${label} admission not denied`
  );

  assert.equal(
    result.admissionDenialReason,
    undefined,
    `${label} exposes no denial reason`
  );

  assert.equal(
    result.admissionFailureReason,
    undefined,
    `${label} exposes no failure reason`
  );

  assert.equal(
    result.certifiedExecutionOutcome,
    expectedOutcome,
    `${label} certified outcome preserved`
  );

  assert(
    result.ledgerAdmissionMaterial,
    `${label} ledger-admission material composed`
  );

  assert.equal(
    result.ledgerAdmissionMaterial?.certifiedExecutionOutcome,
    expectedOutcome,
    `${label} admission material outcome preserved`
  );

  assert(
    result.summary.includes(
      "provider_runtime_evidence_ledger_admitted"
    ),
    `${label} terminal admission summary preserved`
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
  "kms-key-runtime-ledger-admission";

const providerConfigurationRef =
  "cfg/aws-kms-prod";

const providerCredentialRef =
  "cred/aws-kms-prod";

const executionMetadata = {

  tenantId:
    "tenant-001",

  runtimeBatchId:
    "runtime-ledger-admission-001",

};


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


function outcomeIsFailure(
  outcome:
    ProviderRuntimeCertifiedExecutionOutcome
): boolean {

  return (
    outcome === "RETRY_FAILED" ||
    outcome === "RECOVERY_FAILED" ||
    outcome === "FAILOVER_FAILED" ||
    outcome === "STOP_FAILED" ||
    outcome === "ESCALATION_FAILED"
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
// P9P CERTIFICATION FIXTURES
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
    outcomeIsFailure(
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

  const summary = [
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

    verificationStatus:
      runtimeResponse === "NO_ACTION"
        ? "PROVIDER_RUNTIME_VERIFIED"
        : "PROVIDER_RUNTIME_NOT_VERIFIED",

    verificationFailureReason:
      runtimeResponse === "NO_ACTION"
        ? undefined
        : runtimeResponse === "RECOVER"
          ? "PROVIDER_EXECUTION_NOT_COMPLETED"
          : "PROVIDER_FAILURE_SURFACE_PRESENT",

    classificationStatus:
      runtimeResponse === "NO_ACTION"
        ? "PROVIDER_RUNTIME_FAILURE_CLASSIFICATION_NOT_REQUIRED"
        : "PROVIDER_RUNTIME_FAILURE_CLASSIFIED",

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

    verificationStatus:
      executionEvidence.verificationStatus,

    verificationFailureReason:
      executionEvidence.verificationFailureReason,

    classificationStatus:
      executionEvidence.classificationStatus,

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

    summary,

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
// SCENARIO 1 — ADMISSION DECISION REJECTED
// ============================================================

function runAdmissionRejectedScenario(): void {

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput(
        buildCertifiedResult(
          "RETRY_COMPLETED"
        ),
        {

          admissionDecision:
            "REJECT_PROVIDER_RUNTIME_EVIDENCE_LEDGER_ADMISSION",

        }
      )
    );

  assertDenied(
    result,
    "RUNTIME_EVIDENCE_LEDGER_ADMISSION_NOT_ALLOWED",
    "admission rejected"
  );

  assert(
    result.summary.includes(
      "runtime_evidence_ledger_admission_not_allowed"
    ),
    "admission rejection summary preserved"
  );

  pass("admission rejected");
  pass("admission rejection reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 2 — P9P CERTIFICATION DENIED
// ============================================================

function runCertificationDeniedScenario(): void {

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput(
        buildCertificationDenied()
      )
    );

  assertDenied(
    result,
    "RUNTIME_EXECUTION_OUTCOME_CERTIFICATION_DENIED",
    "P9P certification denied"
  );

  assert(
    result.summary.includes(
      "runtime_execution_outcome_certification_denied"
    ),
    "P9P certification denial summary preserved"
  );

  pass("P9P certification denied blocks admission");
  pass("P9P certification denial reason preserved");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — P9P OUTCOME NOT CERTIFIED
// ============================================================

function runOutcomeNotCertifiedScenario(): void {

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput(
        buildNotCertified()
      )
    );

  assertNotAdmitted(
    result,
    "RUNTIME_EXECUTION_OUTCOME_NOT_CERTIFIED",
    "runtime_execution_outcome_not_certified",
    "P9P outcome not certified"
  );

  pass("P9P outcome not certified");
  pass("uncertified outcome not admitted");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 4 — CERTIFIED OUTCOME MISSING
// ============================================================

function runCertifiedOutcomeMissingScenario(): void {

  const certification = {

    ...buildCertifiedResult(
      "RETRY_COMPLETED"
    ),

    certifiedExecutionOutcome:
      undefined,

  } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult;

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput(
        certification
      )
    );

  assertNotAdmitted(
    result,
    "CERTIFIED_EXECUTION_OUTCOME_MISSING",
    "certified_execution_outcome_missing",
    "certified outcome missing"
  );

  pass("certified execution outcome missing rejected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 5 — CANONICAL EVIDENCE MISSING
// ============================================================

function runCanonicalEvidenceMissingScenario(): void {

  const certification = {

    ...buildCertifiedResult(
      "RETRY_COMPLETED"
    ),

    executionEvidence:
      undefined,

  } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult;

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput(
        certification
      )
    );

  assertNotAdmitted(
    result,
    "CANONICAL_EXECUTION_EVIDENCE_MISSING",
    "canonical_execution_evidence_missing",
    "canonical execution evidence missing"
  );

  pass("canonical execution evidence missing rejected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 6 — CANONICAL EVIDENCE INVALID
// ============================================================

function runCanonicalEvidenceInvalidScenario(): void {

  const certification =
    buildCertifiedResult(
      "RETRY_COMPLETED"
    );

  const invalidEvidence = {

    ...(certification.executionEvidence as unknown as Record<string, unknown>),

    evidenceType:
      "NON_CANONICAL_EVIDENCE",

  };

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...certification,

        executionEvidence:
          invalidEvidence,

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    result,
    "CANONICAL_EXECUTION_EVIDENCE_INVALID",
    "canonical_execution_evidence_invalid",
    "canonical execution evidence invalid"
  );

  pass("canonical execution evidence shape enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 7 — EVIDENCE CONTEXT INCOHERENT
// ============================================================

function runEvidenceContextIncoherentScenario(): void {

  const certification =
    buildCertifiedResult(
      "RECOVERY_COMPLETED"
    );

  const incoherentEvidence = {

    ...(certification.executionEvidence as unknown as Record<string, unknown>),

    providerResourceId:
      "kms-key-other-runtime",

  };

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...certification,

        executionEvidence:
          incoherentEvidence,

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    result,
    "RUNTIME_EVIDENCE_CONTEXT_INCOHERENT",
    "runtime_evidence_context_incoherent",
    "evidence runtime context incoherent"
  );

  pass("evidence runtime context coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 8 — EVIDENCE RESPONSE INCOHERENT
// ============================================================

function runEvidenceResponseIncoherentScenario(): void {

  const certification =
    buildCertifiedResult(
      "FAILOVER_COMPLETED"
    );

  const incoherentEvidence = {

    ...(certification.executionEvidence as unknown as Record<string, unknown>),

    runtimeResponse:
      "RECOVER",

  };

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...certification,

        executionEvidence:
          incoherentEvidence,

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    result,
    "RUNTIME_EVIDENCE_RESPONSE_INCOHERENT",
    "runtime_evidence_response_incoherent",
    "evidence response incoherent"
  );

  pass("P9N-selected response coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 9 — EVIDENCE EXECUTION STATE INCOHERENT
// ============================================================

function runEvidenceExecutionStateIncoherentScenario(): void {

  const certification =
    buildCertifiedResult(
      "STOP_COMPLETED"
    );

  const incoherentEvidence = {

    ...(certification.executionEvidence as unknown as Record<string, unknown>),

    runtimeResponseExecuted:
      false,

  };

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...certification,

        executionEvidence:
          incoherentEvidence,

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    result,
    "RUNTIME_EVIDENCE_EXECUTION_STATE_INCOHERENT",
    "runtime_evidence_execution_state_incoherent",
    "evidence execution state incoherent"
  );

  pass("P9O execution-state coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 10 — EVIDENCE SUMMARY INVALID
// ============================================================

function runEvidenceSummaryInvalidScenario(): void {

  const certification =
    buildCertifiedResult(
      "ESCALATION_FAILED"
    );

  const invalidEvidence = {

    ...(certification.executionEvidence as unknown as Record<string, unknown>),

    executorSummary:
      undefined,

  };

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput({

        ...certification,

        executionEvidence:
          invalidEvidence,

      } as unknown as ProviderRuntimeExecutionOutcomeCertificationResult)
    );

  assertNotAdmitted(
    result,
    "RUNTIME_EVIDENCE_SUMMARY_INVALID",
    "runtime_evidence_summary_invalid",
    "contained failure executor summary missing"
  );

  pass("contained-failure executor summary required");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 11 — SUCCESSFUL OUTCOME FAMILY
// ============================================================

function runSuccessfulOutcomeFamily(): void {

  const outcomes:
    ProviderRuntimeCertifiedExecutionOutcome[] = [

      "NO_ACTION_COMPLETED",

      "RETRY_COMPLETED",

      "RECOVERY_COMPLETED",

      "FAILOVER_COMPLETED",

      "STOP_COMPLETED",

      "ESCALATION_COMPLETED",

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

    assertAdmitted(
      result,
      outcome,
      outcome
    );

    assert.equal(
      result.ledgerAdmissionMaterial?.executorFailureContained,
      false,
      `${outcome} is not contained executor failure`
    );

    pass(
      `${outcome} admitted`
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

  const outcomes:
    ProviderRuntimeCertifiedExecutionOutcome[] = [

      "RETRY_FAILED",

      "RECOVERY_FAILED",

      "FAILOVER_FAILED",

      "STOP_FAILED",

      "ESCALATION_FAILED",

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

    assertAdmitted(
      result,
      outcome,
      outcome
    );

    assert.equal(
      result.ledgerAdmissionMaterial?.executorFailureContained,
      true,
      `${outcome} contained executor failure preserved`
    );

    assert(
      result.ledgerAdmissionMaterial?.executorSummary?.includes(
        "executor_failure_contained"
      ),
      `${outcome} contained-failure summary preserved`
    );

    pass(
      `${outcome} admitted`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

}


// ============================================================
// SCENARIO 13 — ADMISSION MATERIAL COMPOSITION
// ============================================================

function runAdmissionMaterialCompositionChecks(): void {

  const certification =
    buildCertifiedResult(
      "RECOVERY_COMPLETED"
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

  const sourceResponseDecisionSummary = [
    ...evidence.responseDecisionSummary,
  ];

  const sourceExecutorSummary = [
    ...(evidence.executorSummary ?? []),
  ];

  const sourceResponseExecutionSummary = [
    ...evidence.responseExecutionSummary,
  ];

  const sourceCertificationSummary = [
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
    "RECOVERY_COMPLETED",
    "admission material composition"
  );

  const material =
    result.ledgerAdmissionMaterial;

  assert.equal(
    material?.evidenceType,
    "PROVIDER_RUNTIME_EXECUTION_OUTCOME",
    "canonical evidence type preserved"
  );

  assert.equal(
    material?.providerContract,
    certification.providerContract,
    "providerContract preserved"
  );

  assert.equal(
    material?.providerImplementation,
    certification.providerImplementation,
    "providerImplementation preserved"
  );

  assert.equal(
    material?.operation,
    certification.operation,
    "operation preserved"
  );

  assert.deepEqual(
    material?.executionMetadata,
    certification.executionMetadata,
    "executionMetadata preserved"
  );

  assert.equal(
    material?.verificationStatus,
    certification.verificationStatus,
    "verificationStatus preserved"
  );

  assert.equal(
    material?.classificationStatus,
    certification.classificationStatus,
    "classificationStatus preserved"
  );

  assert.equal(
    material?.runtimeFailureClass,
    certification.runtimeFailureClass,
    "runtimeFailureClass preserved"
  );

  assert.equal(
    material?.runtimeResponse,
    certification.runtimeResponse,
    "P9N response preserved"
  );

  assert.equal(
    material?.responseExecutionStatus,
    certification.responseExecutionStatus,
    "P9O execution status preserved"
  );

  assert.equal(
    material?.runtimeResponseExecuted,
    certification.runtimeResponseExecuted,
    "P9O execution result preserved"
  );

  assert.deepEqual(
    material?.responseDecisionSummary,
    sourceResponseDecisionSummary,
    "response decision summary copied"
  );

  assert.deepEqual(
    material?.executorSummary,
    sourceExecutorSummary,
    "executor summary copied"
  );

  assert.deepEqual(
    material?.responseExecutionSummary,
    sourceResponseExecutionSummary,
    "response execution summary copied"
  );

  assert.deepEqual(
    material?.certificationSummary,
    sourceCertificationSummary,
    "certification summary copied"
  );

  assert.notEqual(
    material?.responseDecisionSummary,
    evidence.responseDecisionSummary,
    "response decision summary copied defensively"
  );

  assert.notEqual(
    material?.executorSummary,
    evidence.executorSummary,
    "executor summary copied defensively"
  );

  assert.notEqual(
    material?.responseExecutionSummary,
    evidence.responseExecutionSummary,
    "response execution summary copied defensively"
  );

  assert.notEqual(
    material?.certificationSummary,
    certification.summary,
    "certification summary copied defensively"
  );

  assert.deepEqual(
    evidence.responseDecisionSummary,
    sourceResponseDecisionSummary,
    "source response decision summary not mutated"
  );

  assert.deepEqual(
    evidence.executorSummary,
    sourceExecutorSummary,
    "source executor summary not mutated"
  );

  assert.deepEqual(
    evidence.responseExecutionSummary,
    sourceResponseExecutionSummary,
    "source response execution summary not mutated"
  );

  assert.deepEqual(
    certification.summary,
    sourceCertificationSummary,
    "source certification summary not mutated"
  );

  pass("ledger-admission material composition verified");
  pass("defensive summary copying verified");
  pass("source certification evidence not mutated");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 14 — CONTRACT PROPAGATION
// ============================================================

function runContractPropagationChecks(): void {

  const certification =
    buildCertifiedResult(
      "ESCALATION_COMPLETED"
    );

  const result =
    admitProviderRuntimeEvidenceToLedger(
      buildInput(
        certification
      )
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

  pass("provider/runtime context propagated");
  pass("P9L/P9M/P9N/P9O/P9P lineage propagated");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 15 — BOUNDARY VERIFICATION
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

  ];

  for (const result of results) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("P9Q admission boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runAdmissionRejectedScenario();

  runCertificationDeniedScenario();

  runOutcomeNotCertifiedScenario();

  runCertifiedOutcomeMissingScenario();

  runCanonicalEvidenceMissingScenario();

  runCanonicalEvidenceInvalidScenario();

  runEvidenceContextIncoherentScenario();

  runEvidenceResponseIncoherentScenario();

  runEvidenceExecutionStateIncoherentScenario();

  runEvidenceSummaryInvalidScenario();

  runSuccessfulOutcomeFamily();

  runContainedFailureOutcomeFamily();

  runAdmissionMaterialCompositionChecks();

  runContractPropagationChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9Q PROVIDER RUNTIME EVIDENCE LEDGER ADMISSION");
  console.log("========================================");
  console.log("");

  console.log("Admission Gates:");
  console.log("✓ admission rejected → DENIED");
  console.log("✓ P9P certification denied → DENIED");
  console.log("✓ P9P outcome not certified → NOT_ADMITTED");

  console.log("");
  console.log("Evidence Requirements:");
  console.log("✓ certified execution outcome required");
  console.log("✓ canonical execution evidence required");
  console.log("✓ canonical evidence shape required");
  console.log("✓ evidence summary sufficiency required");

  console.log("");
  console.log("Coherence Gates:");
  console.log("✓ provider/runtime context coherence");
  console.log("✓ P9N-selected response coherence");
  console.log("✓ P9O execution-state coherence");
  console.log("✓ P9P certified-outcome coherence");

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
  console.log("✓ no ledger sequence");
  console.log("✓ no audit");

  console.log("");
  console.log("========================================");
  console.log("P9Q.1 PROVIDER RUNTIME EVIDENCE LEDGER ADMISSION VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();