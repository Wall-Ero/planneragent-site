// ============================================================
// PlannerAgent — Provider Runtime Cryptographic Ledger Binding
// and Chain Verification Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9U.provider.runtime.cryptographic.ledger.binding.chain.verification.runner.ts
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
// P9U.1 — Provider Runtime Cryptographic
// Ledger Binding & Chain Verification Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify the P9U.1 contract.
//
// This runner verifies:
//
// 1. binding decision rejected
// 2. P9R ledger write not completed
// 3. P9R durable identity missing
// 4. sovereign tenant context missing
// 5. sovereign company context missing
// 6. runtime tenant mismatch
// 7. canonical genesis binding
// 8. canonical chained binding
// 9. P9R durable identity preservation
// 10. provider-runtime lineage preservation
// 11. contained-failure lineage preservation
// 12. immutable-chain identity preservation
// 13. payload-integrity verification
// 14. record-hash verification
// 15. chain/sequence continuity verification
// 16. append tenant crossing rejected
// 17. append company crossing rejected
// 18. append ledger-domain crossing rejected
// 19. append encryption-domain crossing rejected
// 20. previous payload missing
// 21. previous payload tampering
// 22. defensive summary and metadata copying
// 23. source P9R result immutability
// 24. boundary verification
//
// P9U cryptographically binds one durable P9R fact.
//
// P9U does not reinterpret or re-execute upstream runtime
// governance.
//
// ============================================================

import assert from "node:assert/strict";

import {
  bindAndVerifyProviderRuntimeLedger,
} from "../P9U.provider.runtime.cryptographic.ledger.binding.chain.verification";

import type {
  ProviderRuntimeCryptographicLedgerBindingInput,
  ProviderRuntimeCryptographicLedgerBindingResult,
  ProviderRuntimeCryptographicLedgerPayload,
} from "../P9U.provider.runtime.cryptographic.ledger.binding.chain.verification";

import type {
  ProviderRuntimeEvidenceLedgerWriteResult,
} from "../P9R.provider.runtime.evidence.persistence.ledger.write";

import type {
  ImmutableChainRecord,
} from "../../../../ledger/immutable.chain";

import type {
  EncryptionDomain,
} from "../../../../security/encryption.domains";


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

    "runtimeVerifiedByCryptographicBinding",

    "runtimeFailureClassifiedByCryptographicBinding",

    "runtimeResponseDecidedByCryptographicBinding",

    "runtimeResponseExecutedByCryptographicBinding",

    "executionOutcomeCertifiedByCryptographicBinding",

    "runtimeEvidenceAdmittedByCryptographicBinding",

    "runtimeEvidencePersistedByCryptographicBinding",

    "runtimeLedgerWrittenByCryptographicBinding",

    "runtimeLedgerAuditAdmittedByCryptographicBinding",

    "runtimeAuditExecutedByCryptographicBinding",

    "providerSdkCalled",

    "providerApiCalled",

    "providerExecutionInvoked",

    "providerErrorResanitized",

    "sanitizedFailureSurfaceAltered",

    "runtimeResponseReplaced",

    "payloadEncrypted",

    "payloadDecrypted",

    "payloadSigned",

    "payloadSignatureVerified",

    "payloadAuthenticityVerified",

    "signerIdentityVerified",

    "persistenceIdManufactured",

    "ledgerEntryIdManufactured",

    "ledgerSequenceManufactured",

    "auditRecordWritten",

    "auditPerformed",

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
    ProviderRuntimeCryptographicLedgerBindingResult,
  expectedReason:
    ProviderRuntimeCryptographicLedgerBindingResult["bindingDenialReason"],
  label:
    string
): void {

  assert.equal(
    result.bindingStatus,
    "PROVIDER_RUNTIME_LEDGER_BINDING_DENIED",
    `${label} status`
  );

  assert.equal(
    result.runtimeLedgerBindingAttempted,
    false,
    `${label} binding not attempted`
  );

  assert.equal(
    result.runtimeLedgerCryptographicallyBound,
    false,
    `${label} not cryptographically bound`
  );

  assert.equal(
    result.runtimeLedgerBindingDenied,
    true,
    `${label} denied`
  );

  assert.equal(
    result.immutableChainVerificationAttempted,
    false,
    `${label} chain verification not attempted`
  );

  assert.equal(
    result.immutableChainVerified,
    false,
    `${label} chain not verified`
  );

  assert.equal(
    result.bindingDenialReason,
    expectedReason,
    `${label} denial reason preserved`
  );

  assert.equal(
    result.bindingFailureReason,
    undefined,
    `${label} exposes no failure reason`
  );

  assert.equal(
    result.chainPayload,
    undefined,
    `${label} exposes no chain payload`
  );

  assert.equal(
    result.chainRecord,
    undefined,
    `${label} exposes no chain record`
  );

  assert.equal(
    result.chainVerification,
    undefined,
    `${label} exposes no chain verification`
  );

}


function assertNotBound(
  result:
    ProviderRuntimeCryptographicLedgerBindingResult,
  expectedReason:
    ProviderRuntimeCryptographicLedgerBindingResult["bindingFailureReason"],
  summaryToken:
    string,
  label:
    string
): void {

  assert.equal(
    result.bindingStatus,
    "PROVIDER_RUNTIME_LEDGER_NOT_BOUND",
    `${label} status`
  );

  assert.equal(
    result.runtimeLedgerBindingAttempted,
    true,
    `${label} binding attempted`
  );

  assert.equal(
    result.runtimeLedgerCryptographicallyBound,
    false,
    `${label} not cryptographically bound`
  );

  assert.equal(
    result.runtimeLedgerBindingDenied,
    false,
    `${label} not denied`
  );

  assert.equal(
    result.immutableChainVerified,
    false,
    `${label} chain not verified`
  );

  assert.equal(
    result.bindingFailureReason,
    expectedReason,
    `${label} failure reason preserved`
  );

  assert.equal(
    result.bindingDenialReason,
    undefined,
    `${label} exposes no denial reason`
  );

  assert(
    result.summary.includes(
      summaryToken
    ),
    `${label} summary token preserved`
  );

}


function assertBound(
  result:
    ProviderRuntimeCryptographicLedgerBindingResult,
  label:
    string
): void {

  assert.equal(
    result.bindingStatus,
    "PROVIDER_RUNTIME_LEDGER_CRYPTOGRAPHICALLY_BOUND",
    `${label} status`
  );

  assert.equal(
    result.runtimeLedgerBindingAttempted,
    true,
    `${label} binding attempted`
  );

  assert.equal(
    result.runtimeLedgerCryptographicallyBound,
    true,
    `${label} cryptographically bound`
  );

  assert.equal(
    result.runtimeLedgerBindingDenied,
    false,
    `${label} not denied`
  );

  assert.equal(
    result.immutableChainVerificationAttempted,
    true,
    `${label} chain verification attempted`
  );

  assert.equal(
    result.immutableChainVerified,
    true,
    `${label} chain verified`
  );

  assert.equal(
    result.bindingDenialReason,
    undefined,
    `${label} exposes no denial reason`
  );

  assert.equal(
    result.bindingFailureReason,
    undefined,
    `${label} exposes no failure reason`
  );

  assert(
    result.chainPayload,
    `${label} chain payload exposed`
  );

  assert(
    result.chainRecord,
    `${label} chain record exposed`
  );

  assert(
    result.chainVerification,
    `${label} chain verification exposed`
  );

  assert.equal(
    result.chainVerification?.valid,
    true,
    `${label} immutable-chain verification valid`
  );

  assert.equal(
    result.chainVerification?.payloadIntegrityValid,
    true,
    `${label} payload integrity verified`
  );

  assert.equal(
    result.chainVerification?.recordHashIntegrityValid,
    true,
    `${label} record-hash integrity verified`
  );

  assert.equal(
    result.chainVerification?.chainIdentityValid,
    true,
    `${label} chain identity verified`
  );

  assert.equal(
    result.chainVerification?.tenantContinuityValid,
    true,
    `${label} tenant continuity verified`
  );

  assert.equal(
    result.chainVerification?.companyContinuityValid,
    true,
    `${label} company continuity verified`
  );

  assert.equal(
    result.chainVerification?.domainContinuityValid,
    true,
    `${label} ledger-domain continuity verified`
  );

  assert.equal(
    result.chainVerification?.encryptionDomainContinuityValid,
    true,
    `${label} encryption-domain continuity verified`
  );

  assert(
    result.summary.includes(
      "provider_runtime_ledger_cryptographically_bound"
    ),
    `${label} binding summary preserved`
  );

  assert(
    result.summary.includes(
      "provider_runtime_immutable_chain_verified"
    ),
    `${label} verification summary preserved`
  );

}


// ============================================================
// BASE CONTEXT
// ============================================================

const tenantId =
  "tenant-001";

const companyId =
  "company-001";

const encryptionDomain =
  "EXECUTION" as EncryptionDomain;

const alternateEncryptionDomain =
  "AUDIT" as EncryptionDomain;


// ============================================================
// P9R FIXTURES
// ============================================================

function buildWrittenLedgerResult(
  sequence:
    number = 701,
  containedFailure:
    boolean = false
): ProviderRuntimeEvidenceLedgerWriteResult {

  const persistenceId =
    `persist-provider-runtime-${sequence}`;

  const ledgerEntryId =
    `ledger-provider-runtime-${sequence}`;

  const persistedAt =
    `2026-07-12T${String(
      10 + (sequence % 10)
    ).padStart(2, "0")}:00:00.000Z`;

  const certifiedExecutionOutcome =
    containedFailure
      ? "RETRY_FAILED"
      : "RETRY_COMPLETED";

  const responseExecutionStatus =
    containedFailure
      ? "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED"
      : "PROVIDER_RUNTIME_RESPONSE_EXECUTED";

  const executorSummary =
    containedFailure
      ? [
          "provider_runtime_response_executor_failed",
          "retry_failed",
          "executor_failure_contained",
        ]
      : [
          "provider_runtime_response_executor_completed",
          "retry_completed",
        ];

  const responseExecutionSummary =
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
        ];

  const certificationSummary =
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
        ];

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

    certifiedExecutionOutcome,

    providerContract:
      "KEY_MANAGEMENT",

    providerImplementation:
      "AWS_KMS",

    operation:
      "REWRAP_KEY",

    providerResourceId:
      "kms-key-runtime-binding",

    providerConfigurationRef:
      "cfg/aws-kms-prod",

    providerCredentialRef:
      "cred/aws-kms-prod",

    executionMetadata: {

      tenantId,

      runtimeBatchId:
        "runtime-binding-001",

    },

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

    responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      true,

    runtimeResponseExecuted:
      containedFailure === false,

    runtimeInterventionNotRequired:
      false,

    executorFailureContained:
      containedFailure,

    ledgerEntry: {

      ledgerEntryType:
        "PROVIDER_RUNTIME_EXECUTION_OUTCOME",

      ledgerEntryVersion:
        "P9R.1",

      certifiedExecutionOutcome,

      providerContract:
        "KEY_MANAGEMENT",

      providerImplementation:
        "AWS_KMS",

      operation:
        "REWRAP_KEY",

      providerResourceId:
        "kms-key-runtime-binding",

      providerConfigurationRef:
        "cfg/aws-kms-prod",

      providerCredentialRef:
        "cred/aws-kms-prod",

      executionMetadata: {

        tenantId,

        runtimeBatchId:
          "runtime-binding-001",

      },

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

      responseExecutionStatus,

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

      executorSummary,

      responseExecutionSummary,

      certificationSummary,

    },

    persistenceId,

    ledgerEntryId,

    ledgerSequence:
      sequence,

    persistedAt,

    admissionSummary: [
      "provider_runtime_evidence_ledger_admitted",
    ],

    writerSummary: [
      "provider_runtime_evidence_ledger_writer_completed",
    ],

    summary: [
      "provider_runtime_evidence_ledger_admitted",
      "provider_runtime_evidence_persisted",
      "provider_runtime_evidence_ledger_written",
      certifiedExecutionOutcome.toLowerCase(),
    ],

  };

}


function buildNotWrittenLedgerResult():
  ProviderRuntimeEvidenceLedgerWriteResult {

  return {

    ...buildWrittenLedgerResult(),

    writeStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_WRITTEN",

    runtimeEvidencePersisted:
      false,

    runtimeEvidenceLedgerWritten:
      false,

    persistenceId:
      undefined,

    ledgerEntryId:
      undefined,

    ledgerSequence:
      undefined,

    persistedAt:
      undefined,

    writeFailureReason:
      "LEDGER_WRITE_NOT_COMPLETED",

    summary: [
      "provider_runtime_evidence_ledger_not_written",
      "ledger_write_not_completed",
    ],

  };

}


function buildInput(
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult =
      buildWrittenLedgerResult(),
  overrides?:
    Partial<ProviderRuntimeCryptographicLedgerBindingInput>
): ProviderRuntimeCryptographicLedgerBindingInput {

  return {

    ledgerWrite,

    tenantId,

    companyId,

    encryptionDomain,

    previousRecord:
      null,

    previousPayloads:
      [],

    bindingDecision:
      "BIND_PROVIDER_RUNTIME_LEDGER_TO_CRYPTOGRAPHIC_CHAIN",

    ...overrides,

  };

}


// ============================================================
// SCENARIO 1 — BINDING DECISION REJECTED
// ============================================================

async function runBindingDecisionRejectedScenario(): Promise<void> {

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(),
        {

          bindingDecision:
            "REJECT_PROVIDER_RUNTIME_LEDGER_CRYPTOGRAPHIC_BINDING",

        }
      )
    );

  assertDenied(
    result,
    "RUNTIME_LEDGER_BINDING_NOT_ALLOWED",
    "binding decision rejected"
  );

  pass("binding decision rejected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 2 — P9R WRITE NOT COMPLETED
// ============================================================

async function runLedgerWriteNotCompletedScenario(): Promise<void> {

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildNotWrittenLedgerResult()
      )
    );

  assertDenied(
    result,
    "RUNTIME_LEDGER_WRITE_NOT_COMPLETED",
    "P9R write not completed"
  );

  pass("P9R ledger write required");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — DURABLE IDENTITY MISSING
// ============================================================

async function runDurableIdentityMissingScenarios(): Promise<void> {

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
        "persistenceId missing",

      mutate:
        value => ({

          ...value,

          persistenceId:
            undefined,

        }),

    },

    {

      label:
        "ledgerEntryId missing",

      mutate:
        value => ({

          ...value,

          ledgerEntryId:
            undefined,

        }),

    },

    {

      label:
        "ledgerSequence invalid",

      mutate:
        value => ({

          ...value,

          ledgerSequence:
            0,

        }),

    },

    {

      label:
        "persistedAt missing",

      mutate:
        value => ({

          ...value,

          persistedAt:
            undefined,

        }),

    },

  ];

  for (const testCase of cases) {

    const result =
      await bindAndVerifyProviderRuntimeLedger(
        buildInput(
          testCase.mutate(
            buildWrittenLedgerResult()
          )
        )
      );

    assertDenied(
      result,
      "RUNTIME_LEDGER_DURABLE_IDENTITY_MISSING",
      testCase.label
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("P9R durable identity required");

}


// ============================================================
// SCENARIOS 4–6 — SOVEREIGN CONTEXT GATES
// ============================================================

async function runSovereignContextGateScenarios(): Promise<void> {

  const tenantMissing =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(),
        {

          tenantId:
            "",

        }
      )
    );

  assertDenied(
    tenantMissing,
    "SOVEREIGN_TENANT_CONTEXT_MISSING",
    "sovereign tenant context missing"
  );

  const companyMissing =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(),
        {

          companyId:
            "",

        }
      )
    );

  assertDenied(
    companyMissing,
    "SOVEREIGN_COMPANY_CONTEXT_MISSING",
    "sovereign company context missing"
  );

  const mismatchedLedgerWrite = {

    ...buildWrittenLedgerResult(),

    executionMetadata: {

      tenantId:
        "tenant-other",

      runtimeBatchId:
        "runtime-binding-001",

    },

  };

  const tenantMismatch =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        mismatchedLedgerWrite
      )
    );

  assertDenied(
    tenantMismatch,
    "RUNTIME_LEDGER_TENANT_MISMATCH",
    "runtime tenant mismatch"
  );

  pass("sovereign tenant and company context enforced");
  pass("runtime tenant ownership coherence enforced");

}


// ============================================================
// SCENARIO 7 — CANONICAL GENESIS BINDING
// ============================================================

async function runCanonicalGenesisBindingScenario(): Promise<{
  result:
    ProviderRuntimeCryptographicLedgerBindingResult;
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult;
}> {

  const ledgerWrite =
    buildWrittenLedgerResult(
      701
    );

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        ledgerWrite
      )
    );

  assertBound(
    result,
    "canonical genesis binding"
  );

  assert.equal(
    result.chainRecord?.previous_hash,
    null,
    "genesis previous hash is null"
  );

  assert.equal(
    result.chainRecord?.sequence_number,
    1,
    "genesis chain sequence begins at one"
  );

  assert.equal(
    result.chainRecord?.tenant_id,
    tenantId,
    "genesis tenant identity bound"
  );

  assert.equal(
    result.chainRecord?.company_id,
    companyId,
    "genesis company identity bound"
  );

  assert.equal(
    result.chainRecord?.domain,
    "EXECUTION",
    "genesis ledger domain bound"
  );

  assert.equal(
    result.chainRecord?.encryption_domain,
    encryptionDomain,
    "genesis encryption domain bound"
  );

  assert.equal(
    result.chainPayload?.payloadType,
    "PROVIDER_RUNTIME_DURABLE_LEDGER_FACT",
    "canonical payload type preserved"
  );

  assert.equal(
    result.chainPayload?.payloadVersion,
    "P9U.1",
    "canonical payload version preserved"
  );

  pass("canonical genesis provider-runtime fact bound");
  pass("genesis immutable-chain verification completed");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

  return {
    result,
    ledgerWrite,
  };

}


// ============================================================
// SCENARIO 8 — CANONICAL CHAINED BINDING
// ============================================================

async function runCanonicalChainedBindingScenario(): Promise<void> {

  const first =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(
          701
        )
      )
    );

  assertBound(
    first,
    "first chain binding"
  );

  const second =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(
          702
        ),
        {

          previousRecord:
            first.chainRecord!,

          previousPayloads: [
            first.chainPayload!,
          ],

        }
      )
    );

  assertBound(
    second,
    "second chain binding"
  );

  assert.equal(
    second.chainRecord?.chain_id,
    first.chainRecord?.chain_id,
    "one chain identity preserved"
  );

  assert.notEqual(
    second.chainRecord?.record_id,
    first.chainRecord?.record_id,
    "distinct record identity assigned"
  );

  assert.equal(
    second.chainRecord?.previous_hash,
    first.chainRecord?.current_hash,
    "previous hash continuity preserved"
  );

  assert.equal(
    second.chainRecord?.sequence_number,
    2,
    "chain sequence continuity preserved"
  );

  assert.equal(
    second.chainVerification?.summary.includes(
      "records:2"
    ),
    true,
    "two-record verification preserved"
  );

  pass("canonical chained provider-runtime fact bound");
  pass("chain identity and sequence continuity preserved");

  assertNoCrossLayerFields(
    second as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIOS 9–11 — LINEAGE PRESERVATION
// ============================================================

async function runLineagePreservationChecks(): Promise<void> {

  const ledgerWrite =
    buildWrittenLedgerResult(
      703,
      true
    );

  const before =
    structuredClone(
      ledgerWrite
    );

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        ledgerWrite
      )
    );

  assertBound(
    result,
    "contained-failure lineage"
  );

  assert.equal(
    result.persistenceId,
    ledgerWrite.persistenceId,
    "persistenceId preserved from P9R"
  );

  assert.equal(
    result.ledgerEntryId,
    ledgerWrite.ledgerEntryId,
    "ledgerEntryId preserved from P9R"
  );

  assert.equal(
    result.ledgerSequence,
    ledgerWrite.ledgerSequence,
    "ledgerSequence preserved from P9R"
  );

  assert.equal(
    result.persistedAt,
    ledgerWrite.persistedAt,
    "persistedAt preserved from P9R"
  );

  assert.equal(
    result.certifiedExecutionOutcome,
    "RETRY_FAILED",
    "contained certified outcome preserved"
  );

  assert.equal(
    result.providerContract,
    ledgerWrite.providerContract,
    "provider contract preserved"
  );

  assert.equal(
    result.providerImplementation,
    ledgerWrite.providerImplementation,
    "provider implementation preserved"
  );

  assert.equal(
    result.operation,
    ledgerWrite.operation,
    "operation preserved"
  );

  assert.equal(
    result.verificationStatus,
    ledgerWrite.verificationStatus,
    "P9L verification state preserved"
  );

  assert.equal(
    result.classificationStatus,
    ledgerWrite.classificationStatus,
    "P9M classification state preserved"
  );

  assert.equal(
    result.runtimeFailureClass,
    ledgerWrite.runtimeFailureClass,
    "P9M failure class preserved"
  );

  assert.equal(
    result.runtimeResponse,
    ledgerWrite.runtimeResponse,
    "P9N runtime response preserved"
  );

  assert.equal(
    result.responseExecutionStatus,
    ledgerWrite.responseExecutionStatus,
    "P9O execution status preserved"
  );

  assert.equal(
    result.runtimeResponseExecutionAttempted,
    true,
    "P9O attempted state preserved"
  );

  assert.equal(
    result.runtimeResponseExecuted,
    false,
    "P9O non-executed state preserved"
  );

  assert.equal(
    result.executorFailureContained,
    true,
    "contained executor failure preserved"
  );

  assert.equal(
    result.chainPayload?.executorFailureContained,
    true,
    "contained executor failure bound into payload"
  );

  assert(
    result.chainPayload?.executorSummary?.includes(
      "executor_failure_contained"
    ),
    "contained executor summary bound into payload"
  );

  assert.deepEqual(
    ledgerWrite,
    before,
    "source P9R result not mutated"
  );

  pass("P9R durable identity preserved");
  pass("P9L–P9R provider-runtime lineage preserved");
  pass("contained-failure lineage preserved");
  pass("source P9R result not mutated");

}


// ============================================================
// SCENARIOS 12–15 — CRYPTOGRAPHIC CLAIMS
// ============================================================

async function runCryptographicClaimChecks(): Promise<void> {

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(
          704
        )
      )
    );

  assertBound(
    result,
    "cryptographic claims"
  );

  assert.equal(
    result.chainVerification?.continuityValid,
    true,
    "chain continuity verified"
  );

  assert.equal(
    result.chainVerification?.hashValid,
    true,
    "cryptographic hash claims verified"
  );

  assert.equal(
    result.chainVerification?.immutable,
    true,
    "immutable record claim verified"
  );

  assert.equal(
    result.chainVerification?.payloadIntegrityValid,
    true,
    "payload hash recomputed and verified"
  );

  assert.equal(
    result.chainVerification?.recordHashIntegrityValid,
    true,
    "record hash recomputed and verified"
  );

  pass("payload integrity verified");
  pass("record-hash integrity verified");
  pass("sovereign chain continuity verified");

}


// ============================================================
// SCENARIOS 16–19 — CROSSING REJECTION
// ============================================================

async function runSovereignCrossingRejectionScenarios(): Promise<void> {

  const genesis =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(
          705
        )
      )
    );

  assertBound(
    genesis,
    "crossing-test genesis"
  );

  const cases: Array<{

    label:
      string;

    previousRecord:
      ImmutableChainRecord;

  }> = [

    {

      label:
        "tenant crossing",

      previousRecord: {

        ...genesis.chainRecord!,

        tenant_id:
          "tenant-other",

      },

    },

    {

      label:
        "company crossing",

      previousRecord: {

        ...genesis.chainRecord!,

        company_id:
          "company-other",

      },

    },

    {

      label:
        "ledger-domain crossing",

      previousRecord: {

        ...genesis.chainRecord!,

        domain:
          "AUDIT",

      },

    },

    {

      label:
        "encryption-domain crossing",

      previousRecord: {

        ...genesis.chainRecord!,

        encryption_domain:
          alternateEncryptionDomain,

      },

    },

  ];

  for (const testCase of cases) {

    const result =
      await bindAndVerifyProviderRuntimeLedger(
        buildInput(
          buildWrittenLedgerResult(
            706
          ),
          {

            previousRecord:
              testCase.previousRecord,

            previousPayloads: [
              genesis.chainPayload!,
            ],

          }
        )
      );

    assertNotBound(
      result,
      "IMMUTABLE_CHAIN_APPEND_FAILED",
      "immutable_chain_append_failed",
      testCase.label
    );

    assert.equal(
      result.chainRecord,
      undefined,
      `${testCase.label} creates no chain record`
    );

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("tenant/company/domain/encryption-domain crossings rejected");

}


// ============================================================
// SCENARIO 20 — PREVIOUS PAYLOAD MISSING
// ============================================================

async function runPreviousPayloadMissingScenario(): Promise<void> {

  const genesis =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(
          707
        )
      )
    );

  assertBound(
    genesis,
    "missing-payload genesis"
  );

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(
          708
        ),
        {

          previousRecord:
            genesis.chainRecord!,

          previousPayloads:
            [],

        }
      )
    );

  assertNotBound(
    result,
    "IMMUTABLE_CHAIN_VERIFICATION_FAILED",
    "immutable_chain_payload_record_count_mismatch",
    "previous payload missing"
  );

  assert(
    result.chainRecord,
    "record created before complete-chain material validation"
  );

  pass("previous payload / record count mismatch rejected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 21 — PREVIOUS PAYLOAD TAMPERING
// ============================================================

async function runPreviousPayloadTamperingScenario(): Promise<void> {

  const genesis =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(
          709
        )
      )
    );

  assertBound(
    genesis,
    "tampering-test genesis"
  );

  const tamperedPreviousPayload: ProviderRuntimeCryptographicLedgerPayload = {

    ...genesis.chainPayload!,

    certifiedExecutionOutcome:
      "REWRITTEN_OUTCOME",

  };

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(
          710
        ),
        {

          previousRecord:
            genesis.chainRecord!,

          previousPayloads: [
            tamperedPreviousPayload,
          ],

        }
      )
    );

  assertNotBound(
    result,
    "IMMUTABLE_CHAIN_VERIFICATION_FAILED",
    "immutable_chain_verification_failed",
    "previous payload tampering"
  );

  assert.equal(
    result.chainVerification?.valid,
    false,
    "tampered previous payload invalidates chain"
  );

  assert.equal(
    result.chainVerification?.payloadIntegrityValid,
    false,
    "tampered previous payload invalidates payload integrity"
  );

  assert.equal(
    result.chainVerification?.failureReason,
    "payload_hash_mismatch",
    "tampered previous payload failure reason preserved"
  );

  pass("previous canonical payload tampering detected");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


// ============================================================
// SCENARIOS 22–23 — DEFENSIVE COPYING / IMMUTABILITY
// ============================================================

async function runDefensiveCopyingChecks(): Promise<void> {

  const ledgerWrite =
    buildWrittenLedgerResult(
      711,
      true
    );

  const sourceSummaryBefore = [
    ...ledgerWrite.summary,
  ];

  const executionMetadataBefore = {
    ...ledgerWrite.executionMetadata,
  };

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        ledgerWrite
      )
    );

  assertBound(
    result,
    "defensive copying"
  );

  assert.deepEqual(
    result.ledgerWriteSummary,
    sourceSummaryBefore,
    "ledger-write summary value preserved"
  );

  assert.notEqual(
    result.ledgerWriteSummary,
    ledgerWrite.summary,
    "ledger-write summary copied defensively"
  );

  assert.deepEqual(
    result.chainPayload?.sourceSummary,
    sourceSummaryBefore,
    "source summary copied into canonical payload"
  );

  assert.notEqual(
    result.chainPayload?.sourceSummary,
    ledgerWrite.summary,
    "canonical payload source summary copied defensively"
  );

  assert.deepEqual(
    result.executionMetadata,
    executionMetadataBefore,
    "execution metadata value preserved"
  );

  assert.notEqual(
    result.executionMetadata,
    ledgerWrite.executionMetadata,
    "result execution metadata copied defensively"
  );

  assert.notEqual(
    result.chainPayload?.executionMetadata,
    ledgerWrite.executionMetadata,
    "payload execution metadata copied defensively"
  );

  result.ledgerWriteSummary.push(
    "mutation_probe"
  );

  result.chainPayload?.sourceSummary.push(
    "mutation_probe"
  );

  if (result.executionMetadata) {

    result.executionMetadata.runtimeBatchId =
      "mutation-probe";

  }

  assert.deepEqual(
    ledgerWrite.summary,
    sourceSummaryBefore,
    "source ledger-write summary not mutated"
  );

  assert.deepEqual(
    ledgerWrite.executionMetadata,
    executionMetadataBefore,
    "source execution metadata not mutated"
  );

  pass("summary arrays copied defensively");
  pass("execution metadata copied defensively");
  pass("source P9R result remains immutable");

}


// ============================================================
// SCENARIO 24 — BOUNDARY VERIFICATION
// ============================================================

async function runBoundaryVerification(): Promise<void> {

  const results: ProviderRuntimeCryptographicLedgerBindingResult[] = [

    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(
          712
        )
      )
    ),

    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(
          713,
          true
        )
      )
    ),

    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildNotWrittenLedgerResult()
      )
    ),

    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenLedgerResult(
          714
        ),
        {

          bindingDecision:
            "REJECT_PROVIDER_RUNTIME_LEDGER_CRYPTOGRAPHIC_BINDING",

        }
      )
    ),

  ];

  for (const result of results) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("P9U cryptographic-binding boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

async function main(): Promise<void> {

  await runBindingDecisionRejectedScenario();

  await runLedgerWriteNotCompletedScenario();

  await runDurableIdentityMissingScenarios();

  await runSovereignContextGateScenarios();

  await runCanonicalGenesisBindingScenario();

  await runCanonicalChainedBindingScenario();

  await runLineagePreservationChecks();

  await runCryptographicClaimChecks();

  await runSovereignCrossingRejectionScenarios();

  await runPreviousPayloadMissingScenario();

  await runPreviousPayloadTamperingScenario();

  await runDefensiveCopyingChecks();

  await runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9U PROVIDER RUNTIME CRYPTOGRAPHIC LEDGER BINDING");
  console.log("========================================");
  console.log("");

  console.log("Binding Gates:");
  console.log("✓ binding decision rejected → DENIED");
  console.log("✓ incomplete P9R ledger write → DENIED");
  console.log("✓ missing durable P9R identity → DENIED");
  console.log("✓ missing tenant/company context → DENIED");
  console.log("✓ runtime tenant mismatch → DENIED");

  console.log("");
  console.log("Canonical Binding:");
  console.log("✓ canonical P9U.1 payload created");
  console.log("✓ genesis provider-runtime fact bound");
  console.log("✓ chained provider-runtime fact bound");
  console.log("✓ one chain identity preserved");
  console.log("✓ distinct record identities preserved");
  console.log("✓ previous-hash continuity preserved");
  console.log("✓ sequence continuity preserved");

  console.log("");
  console.log("Cryptographic Integrity:");
  console.log("✓ payload hash recomputed and verified");
  console.log("✓ record hash recomputed and verified");
  console.log("✓ immutable-chain verification completed");
  console.log("✓ previous payload tampering detected");
  console.log("✓ payload / record count mismatch detected");

  console.log("");
  console.log("Sovereign Continuity:");
  console.log("✓ tenant identity bound");
  console.log("✓ company identity bound");
  console.log("✓ EXECUTION ledger domain bound");
  console.log("✓ encryption domain bound");
  console.log("✓ tenant crossing rejected");
  console.log("✓ company crossing rejected");
  console.log("✓ ledger-domain crossing rejected");
  console.log("✓ encryption-domain crossing rejected");

  console.log("");
  console.log("Lineage:");
  console.log("✓ P9R durable identifiers preserved");
  console.log("✓ P9L verification state preserved");
  console.log("✓ P9M classification state preserved");
  console.log("✓ P9N selected response preserved");
  console.log("✓ P9O execution state preserved");
  console.log("✓ P9P certified outcome preserved");
  console.log("✓ contained executor failure preserved");
  console.log("✓ upstream summaries preserved");

  console.log("");
  console.log("Immutability:");
  console.log("✓ summary arrays copied defensively");
  console.log("✓ execution metadata copied defensively");
  console.log("✓ source P9R result not mutated");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no provider runtime verification");
  console.log("✓ no failure classification");
  console.log("✓ no response decision");
  console.log("✓ no response execution");
  console.log("✓ no outcome certification");
  console.log("✓ no evidence admission");
  console.log("✓ no P9R persistence or ledger write");
  console.log("✓ no audit admission or execution");
  console.log("✓ no provider API / SDK calls");
  console.log("✓ no error re-sanitization");
  console.log("✓ no payload encryption or decryption");
  console.log("✓ no payload signature or authenticity claim");
  console.log("✓ no durable identifier manufacturing");

  console.log("");
  console.log("========================================");
  console.log("P9U.1 PROVIDER RUNTIME CRYPTOGRAPHIC LEDGER BINDING VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}


main().catch(
  error => {

    console.error(
      error
    );

    process.exitCode =
      1;

  }
);