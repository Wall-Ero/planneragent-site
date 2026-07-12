// ============================================================
// PlannerAgent — Provider Runtime Cryptographic Ledger Binding
// Family Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9U.provider.runtime.family.runner.ts
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
// P9U — Provider Runtime Cryptographic Ledger Binding Family
//
// PURPOSE
// ------------------------------------------------------------
// Verify the complete P9U provider-runtime cryptographic
// ledger-binding family boundary.
//
// P9U receives one durable P9R fact, creates one canonical
// P9U.1 payload, binds it to the immutable governance chain,
// and verifies cryptographic and sovereign continuity.
//
// P9U binds.
//
// P9U does not reinterpret.
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

    "runtimeVerifiedByBinding",

    "runtimeFailureClassifiedByBinding",

    "runtimeResponseDecidedByBinding",

    "runtimeResponseExecutedByBinding",

    "executionOutcomeCertifiedByBinding",

    "runtimeEvidenceAdmittedByBinding",

    "runtimeEvidencePersistedByBinding",

    "runtimeLedgerWrittenByBinding",

    "runtimeLedgerAuditAdmittedByBinding",

    "auditPerformed",

    "auditWritten",

    "providerSdkCalled",

    "providerApiCalled",

    "providerErrorResanitized",

    "payloadEncrypted",

    "payloadDecrypted",

    "payloadSigned",

    "payloadAuthenticated",

    "signerIdentityVerified",

    "persistenceIdManufactured",

    "ledgerEntryIdManufactured",

    "ledgerSequenceManufactured",

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
    `${label} binding status`
  );

  assert.equal(
    result.runtimeLedgerBindingAttempted,
    false,
    `${label} binding not attempted`
  );

  assert.equal(
    result.runtimeLedgerCryptographicallyBound,
    false,
    `${label} ledger not bound`
  );

  assert.equal(
    result.runtimeLedgerBindingDenied,
    true,
    `${label} denial preserved`
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
    `${label} denial reason`
  );

  assert.equal(
    result.bindingFailureReason,
    undefined,
    `${label} exposes no binding failure reason`
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
    `${label} binding status`
  );

  assert.equal(
    result.runtimeLedgerBindingAttempted,
    true,
    `${label} binding attempted`
  );

  assert.equal(
    result.runtimeLedgerCryptographicallyBound,
    true,
    `${label} ledger bound`
  );

  assert.equal(
    result.runtimeLedgerBindingDenied,
    false,
    `${label} binding not denied`
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
    `${label} canonical payload exists`
  );

  assert(
    result.chainRecord,
    `${label} chain record exists`
  );

  assert(
    result.chainVerification,
    `${label} chain verification exists`
  );

  assert.equal(
    result.chainVerification!.valid,
    true,
    `${label} immutable chain valid`
  );

}


// ============================================================
// BASE CONTEXT
// ============================================================

const tenantId =
  "tenant-p9u-family-001";

const companyId =
  "company-p9u-family-001";

const encryptionDomain =
  "EXECUTION" as EncryptionDomain;


// ============================================================
// P9R FIXTURE
// ============================================================

function buildWrittenResult(
  sequence:
    number = 1,
  outcome:
    string = "RETRY_COMPLETED",
  containedFailure:
    boolean = false
): ProviderRuntimeEvidenceLedgerWriteResult {

  const executorSummary =
    containedFailure
      ? [
          "provider_runtime_response_executor_failed",
          "executor_failure_contained",
        ]
      : undefined;

  const responseExecutionStatus =
    containedFailure
      ? "PROVIDER_RUNTIME_RESPONSE_NOT_EXECUTED"
      : "PROVIDER_RUNTIME_RESPONSE_EXECUTED";

  const runtimeResponseExecuted =
    !containedFailure;

  const runtimeResponse =
    "RETRY";

  const ledgerEntry = {

    ledgerEntryType:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME",

    ledgerEntryVersion:
      "P9R.1",

    certifiedExecutionOutcome:
      outcome,

    providerContract:
      "MANAGED_KMS",

    providerImplementation:
      "AWS_KMS",

    operation:
      "ENCRYPT",

    providerResourceId:
      "kms-key-p9u-family-001",

    providerConfigurationRef:
      "provider-config-p9u-family-001",

    providerCredentialRef:
      "provider-credential-p9u-family-001",

    executionMetadata: {
      tenantId,
      runtimeId:
        "runtime-p9u-family-001",
    },

    verificationStatus:
      containedFailure
        ? "PROVIDER_RUNTIME_NOT_VERIFIED"
        : "PROVIDER_RUNTIME_VERIFIED",

    verificationFailureReason:
      containedFailure
        ? "PROVIDER_EXECUTION_NOT_COMPLETED"
        : undefined,

    classificationStatus:
      containedFailure
        ? "PROVIDER_RUNTIME_FAILURE_CLASSIFIED"
        : "PROVIDER_RUNTIME_NO_FAILURE",

    runtimeFailureClass:
      containedFailure
        ? "TRANSIENT_PROVIDER_FAILURE"
        : undefined,

    runtimeFailureSeverity:
      containedFailure
        ? "RECOVERABLE"
        : undefined,

    failureCode:
      containedFailure
        ? "PROVIDER_TIMEOUT"
        : undefined,

    providerRawStatus:
      containedFailure
        ? "TIMEOUT"
        : "SUCCESS",

    providerRawErrorCode:
      containedFailure
        ? "REQUEST_TIMEOUT"
        : undefined,

    providerSanitizedErrorMessage:
      containedFailure
        ? "Provider request timed out."
        : undefined,

    retryable:
      containedFailure
        ? true
        : undefined,

    recoveryIntakeRequired:
      containedFailure,

    recoveryIntakeReady:
      containedFailure,

    recoveryReason:
      containedFailure
        ? "TRANSIENT_PROVIDER_FAILURE"
        : undefined,

    runtimeResponse,

    responseExecutionStatus,

    runtimeResponseExecutionAttempted:
      true,

    runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      false,

    executorFailureContained:
      containedFailure,

    responseDecisionSummary: [
      "runtime_response_decided",
      "retry_selected",
    ],

    executorSummary,

    responseExecutionSummary: [
      containedFailure
        ? "provider_runtime_response_not_executed"
        : "provider_runtime_response_executed",
    ],

    certificationSummary: [
      "execution_outcome_certified",
      outcome.toLowerCase(),
    ],

  };

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
      ledgerEntry.certifiedExecutionOutcome as any,

    providerContract:
      ledgerEntry.providerContract as any,

    providerImplementation:
      ledgerEntry.providerImplementation as any,

    operation:
      ledgerEntry.operation as any,

    providerResourceId:
      ledgerEntry.providerResourceId,

    providerConfigurationRef:
      ledgerEntry.providerConfigurationRef,

    providerCredentialRef:
      ledgerEntry.providerCredentialRef,

    executionMetadata:
      {
        ...ledgerEntry.executionMetadata,
      },

    verificationStatus:
      ledgerEntry.verificationStatus as any,

    verificationFailureReason:
      ledgerEntry.verificationFailureReason as any,

    classificationStatus:
      ledgerEntry.classificationStatus as any,

    runtimeFailureClass:
      ledgerEntry.runtimeFailureClass as any,

    runtimeFailureSeverity:
      ledgerEntry.runtimeFailureSeverity as any,

    failureCode:
      ledgerEntry.failureCode as any,

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
      ledgerEntry.runtimeResponse as any,

    responseExecutionStatus:
      ledgerEntry.responseExecutionStatus as any,

    runtimeResponseExecutionAttempted:
      ledgerEntry.runtimeResponseExecutionAttempted,

    runtimeResponseExecuted:
      ledgerEntry.runtimeResponseExecuted,

    runtimeInterventionNotRequired:
      ledgerEntry.runtimeInterventionNotRequired,

    executorFailureContained:
      ledgerEntry.executorFailureContained,

    ledgerEntry:
      ledgerEntry as any,

    persistenceId:
      `persistence-p9u-${sequence}`,

    ledgerEntryId:
      `ledger-entry-p9u-${sequence}`,

    ledgerSequence:
      sequence,

    persistedAt:
      new Date(
        Date.UTC(
          2026,
          6,
          12,
          18,
          0,
          sequence
        )
      ).toISOString(),

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
    ],

  } as ProviderRuntimeEvidenceLedgerWriteResult;

}


// ============================================================
// INPUT FIXTURE
// ============================================================

function buildInput(
  ledgerWrite:
    ProviderRuntimeEvidenceLedgerWriteResult,
  overrides?:
    Partial<ProviderRuntimeCryptographicLedgerBindingInput>
): ProviderRuntimeCryptographicLedgerBindingInput {

  return {

    ledgerWrite,

    tenantId,

    companyId,

    encryptionDomain,

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
        buildWrittenResult(),
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
// SCENARIO 2 — P9R WRITE REQUIRED
// ============================================================

async function runLedgerWriteRequiredScenario(): Promise<void> {

  const ledgerWrite = {

    ...buildWrittenResult(),

    writeStatus:
      "PROVIDER_RUNTIME_EVIDENCE_LEDGER_NOT_WRITTEN",

    runtimeEvidenceLedgerWritten:
      false,

  } as ProviderRuntimeEvidenceLedgerWriteResult;

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        ledgerWrite
      )
    );

  assertDenied(
    result,
    "RUNTIME_LEDGER_WRITE_NOT_COMPLETED",
    "P9R ledger write required"
  );

  pass("P9R ledger write required");

}


// ============================================================
// SCENARIO 3 — DURABLE IDENTITY REQUIRED
// ============================================================

async function runDurableIdentityRequiredScenario(): Promise<void> {

  const fields = [
    "persistenceId",
    "ledgerEntryId",
    "ledgerSequence",
    "persistedAt",
  ] as const;

  for (const field of fields) {

    const ledgerWrite = {

      ...buildWrittenResult(),

      [field]:
        field === "ledgerSequence"
          ? 0
          : undefined,

    } as ProviderRuntimeEvidenceLedgerWriteResult;

    const result =
      await bindAndVerifyProviderRuntimeLedger(
        buildInput(
          ledgerWrite
        )
      );

    assertDenied(
      result,
      "RUNTIME_LEDGER_DURABLE_IDENTITY_MISSING",
      `durable identity ${field}`
    );

  }

  pass("P9R durable identity required");

}


// ============================================================
// SCENARIO 4 — SOVEREIGN CONTEXT REQUIRED
// ============================================================

async function runSovereignContextRequiredScenario(): Promise<void> {

  const missingTenant =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenResult(),
        {
          tenantId:
            "",
        }
      )
    );

  assertDenied(
    missingTenant,
    "SOVEREIGN_TENANT_CONTEXT_MISSING",
    "tenant context missing"
  );

  const missingCompany =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenResult(),
        {
          companyId:
            "",
        }
      )
    );

  assertDenied(
    missingCompany,
    "SOVEREIGN_COMPANY_CONTEXT_MISSING",
    "company context missing"
  );

  pass("sovereign tenant and company context enforced");

}


// ============================================================
// SCENARIO 5 — RUNTIME TENANT OWNERSHIP
// ============================================================

async function runRuntimeTenantOwnershipScenario(): Promise<void> {

  const ledgerWrite = {

    ...buildWrittenResult(),

    executionMetadata: {
      tenantId:
        "tenant-other",
    },

  } as ProviderRuntimeEvidenceLedgerWriteResult;

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        ledgerWrite
      )
    );

  assertDenied(
    result,
    "RUNTIME_LEDGER_TENANT_MISMATCH",
    "runtime tenant mismatch"
  );

  pass("runtime tenant ownership coherence enforced");

}


// ============================================================
// SCENARIO 6 — CANONICAL GENESIS BINDING
// ============================================================

async function runCanonicalGenesisBindingScenario(): Promise<
  ProviderRuntimeCryptographicLedgerBindingResult
> {

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenResult(
          1,
          "RETRY_COMPLETED"
        )
      )
    );

  assertBound(
    result,
    "canonical genesis"
  );

  assert.equal(
    result.chainPayload!.payloadType,
    "PROVIDER_RUNTIME_DURABLE_LEDGER_FACT",
    "canonical payload type"
  );

  assert.equal(
    result.chainPayload!.payloadVersion,
    "P9U.1",
    "canonical payload version"
  );

  assert.equal(
    result.chainRecord!.previous_hash,
    null,
    "genesis previous hash"
  );

  assert.equal(
    result.chainRecord!.sequence_number,
    1,
    "genesis chain sequence"
  );

  assert.equal(
    result.chainRecord!.domain,
    "EXECUTION",
    "execution ledger domain bound"
  );

  assert.equal(
    result.chainRecord!.tenant_id,
    tenantId,
    "tenant identity bound"
  );

  assert.equal(
    result.chainRecord!.company_id,
    companyId,
    "company identity bound"
  );

  assert.equal(
    result.chainRecord!.encryption_domain,
    encryptionDomain,
    "encryption domain bound"
  );

  pass("canonical genesis provider-runtime fact bound");
  pass("genesis immutable-chain verification completed");

  return result;

}


// ============================================================
// SCENARIO 7 — CANONICAL CHAINED BINDING
// ============================================================

async function runCanonicalChainedBindingScenario(): Promise<void> {

  const genesis =
    await runCanonicalGenesisBindingScenario();

  const chained =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenResult(
          2,
          "RETRY_COMPLETED"
        ),
        {
          previousRecord:
            genesis.chainRecord!,

          previousPayloads: [
            genesis.chainPayload!,
          ],
        }
      )
    );

  assertBound(
    chained,
    "canonical chained binding"
  );

  assert.equal(
    chained.chainRecord!.chain_id,
    genesis.chainRecord!.chain_id,
    "chain identity preserved"
  );

  assert.notEqual(
    chained.chainRecord!.record_id,
    genesis.chainRecord!.record_id,
    "record identity remains distinct"
  );

  assert.equal(
    chained.chainRecord!.previous_hash,
    genesis.chainRecord!.current_hash,
    "previous hash preserved"
  );

  assert.equal(
    chained.chainRecord!.sequence_number,
    2,
    "chain sequence incremented"
  );

  pass("canonical chained provider-runtime fact bound");
  pass("chain identity and sequence continuity preserved");

}


// ============================================================
// SCENARIO 8 — LINEAGE PRESERVATION
// ============================================================

async function runLineagePreservationScenario(): Promise<void> {

  const ledgerWrite =
    buildWrittenResult(
      7,
      "RETRY_FAILED",
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
    "contained failure lineage"
  );

  const payload =
    result.chainPayload!;

  assert.equal(
    payload.persistenceId,
    ledgerWrite.persistenceId,
    "P9R persistence identity preserved"
  );

  assert.equal(
    payload.ledgerEntryId,
    ledgerWrite.ledgerEntryId,
    "P9R ledger-entry identity preserved"
  );

  assert.equal(
    payload.ledgerSequence,
    ledgerWrite.ledgerSequence,
    "P9R ledger sequence preserved"
  );

  assert.equal(
    payload.certifiedExecutionOutcome,
    ledgerWrite.certifiedExecutionOutcome,
    "P9P certified outcome preserved"
  );

  assert.equal(
    payload.verificationStatus,
    ledgerWrite.verificationStatus,
    "P9L verification state preserved"
  );

  assert.equal(
    payload.classificationStatus,
    ledgerWrite.classificationStatus,
    "P9M classification state preserved"
  );

  assert.equal(
    payload.runtimeResponse,
    ledgerWrite.runtimeResponse,
    "P9N response preserved"
  );

  assert.equal(
    payload.responseExecutionStatus,
    ledgerWrite.responseExecutionStatus,
    "P9O execution state preserved"
  );

  assert.equal(
    payload.executorFailureContained,
    true,
    "contained executor failure preserved"
  );

  assert(
    payload.executorSummary?.includes(
      "executor_failure_contained"
    ),
    "contained executor summary preserved"
  );

  assert.deepEqual(
    ledgerWrite,
    before,
    "source P9R result preserved"
  );

  pass("P9R durable identity preserved");
  pass("P9L–P9R provider-runtime lineage preserved");
  pass("contained-failure lineage preserved");
  pass("source P9R result not mutated");

}


// ============================================================
// SCENARIO 9 — PREVIOUS PAYLOAD / RECORD COUNT
// ============================================================

async function runPreviousMaterialCountMismatchScenario(): Promise<void> {

  const genesis =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenResult(
          1
        )
      )
    );

  assertBound(
    genesis,
    "count mismatch genesis"
  );

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenResult(
          2
        ),
        {
          previousRecord:
            genesis.chainRecord!,

          previousPayloads:
            [],
        }
      )
    );

  assert.equal(
    result.bindingStatus,
    "PROVIDER_RUNTIME_LEDGER_NOT_BOUND",
    "count mismatch not bound"
  );

  assert.equal(
    result.bindingFailureReason,
    "IMMUTABLE_CHAIN_VERIFICATION_FAILED",
    "count mismatch failure reason"
  );

  assert(
    result.summary.includes(
      "immutable_chain_payload_record_count_mismatch"
    ),
    "count mismatch summary preserved"
  );

  pass("previous payload / record count mismatch rejected");

}


// ============================================================
// SCENARIO 10 — PREVIOUS PAYLOAD TAMPERING
// ============================================================

async function runPreviousPayloadTamperingScenario(): Promise<void> {

  const genesis =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenResult(
          1
        )
      )
    );

  assertBound(
    genesis,
    "tampering genesis"
  );

  const tamperedPayload = {

    ...genesis.chainPayload!,

    certifiedExecutionOutcome:
      "RETRY_FAILED",

  } as ProviderRuntimeCryptographicLedgerPayload;

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenResult(
          2
        ),
        {
          previousRecord:
            genesis.chainRecord!,

          previousPayloads: [
            tamperedPayload,
          ],
        }
      )
    );

  assert.equal(
    result.bindingStatus,
    "PROVIDER_RUNTIME_LEDGER_NOT_BOUND",
    "tampered previous payload not bound"
  );

  assert.equal(
    result.bindingFailureReason,
    "IMMUTABLE_CHAIN_VERIFICATION_FAILED",
    "tampered previous payload failure reason"
  );

  assert.equal(
    result.chainVerification?.valid,
    false,
    "tampered previous payload chain invalid"
  );

  assert.equal(
    result.chainVerification?.payloadIntegrityValid,
    false,
    "tampered previous payload integrity invalid"
  );

  pass("previous canonical payload tampering detected");

}


// ============================================================
// SCENARIO 11 — DEFENSIVE COPYING
// ============================================================

async function runDefensiveCopyingScenario(): Promise<void> {

  const ledgerWrite =
    buildWrittenResult(
      3,
      "RETRY_FAILED",
      true
    );

  const sourceMetadata =
    ledgerWrite.executionMetadata!;

  const sourceDecisionSummary =
    ledgerWrite.ledgerEntry!.responseDecisionSummary;

  const sourceExecutorSummary =
    ledgerWrite.ledgerEntry!.executorSummary!;

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

  assert.notEqual(
    result.chainPayload!.executionMetadata,
    sourceMetadata,
    "execution metadata copied"
  );

  assert.notEqual(
    result.chainPayload!.responseDecisionSummary,
    sourceDecisionSummary,
    "response decision summary copied"
  );

  assert.notEqual(
    result.chainPayload!.executorSummary,
    sourceExecutorSummary,
    "executor summary copied"
  );

  result.chainPayload!.responseDecisionSummary.push(
    "mutation_probe"
  );

  result.chainPayload!.executorSummary!.push(
    "mutation_probe"
  );

  result.chainPayload!.executionMetadata!.runtimeId =
    "mutation-probe";

  assert(
    !sourceDecisionSummary.includes(
      "mutation_probe"
    ),
    "source response decision summary immutable"
  );

  assert(
    !sourceExecutorSummary.includes(
      "mutation_probe"
    ),
    "source executor summary immutable"
  );

  assert.equal(
    sourceMetadata.runtimeId,
    "runtime-p9u-family-001",
    "source execution metadata immutable"
  );

  pass("summary arrays copied defensively");
  pass("execution metadata copied defensively");
  pass("source P9R result remains immutable");

}


// ============================================================
// SCENARIO 12 — BOUNDARY VERIFICATION
// ============================================================

async function runBoundaryVerification(): Promise<void> {

  const result =
    await bindAndVerifyProviderRuntimeLedger(
      buildInput(
        buildWrittenResult()
      )
    );

  assertBound(
    result,
    "boundary verification"
  );

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

  assert.equal(
    result.persistenceId,
    result.chainPayload!.persistenceId,
    "P9R persistence identifier preserved"
  );

  assert.equal(
    result.ledgerEntryId,
    result.chainPayload!.ledgerEntryId,
    "P9R ledger-entry identifier preserved"
  );

  assert.equal(
    result.ledgerSequence,
    result.chainPayload!.ledgerSequence,
    "P9R ledger sequence preserved"
  );

  pass("P9U cryptographic-binding boundary verification completed");

}


// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {

  await runBindingDecisionRejectedScenario();

  await runLedgerWriteRequiredScenario();

  await runDurableIdentityRequiredScenario();

  await runSovereignContextRequiredScenario();

  await runRuntimeTenantOwnershipScenario();

  await runCanonicalGenesisBindingScenario();

  await runCanonicalChainedBindingScenario();

  await runLineagePreservationScenario();

  await runPreviousMaterialCountMismatchScenario();

  await runPreviousPayloadTamperingScenario();

  await runDefensiveCopyingScenario();

  await runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9U PROVIDER RUNTIME CRYPTOGRAPHIC LEDGER BINDING FAMILY");
  console.log("========================================");

  console.log("");
  console.log("Binding Gates:");
  console.log("✓ explicit binding decision enforced");
  console.log("✓ completed P9R ledger write required");
  console.log("✓ durable P9R identity required");
  console.log("✓ sovereign tenant context required");
  console.log("✓ sovereign company context required");
  console.log("✓ runtime tenant ownership coherence enforced");

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
  console.log("✓ payload integrity verified");
  console.log("✓ record-hash integrity verified");
  console.log("✓ immutable-chain verification completed");
  console.log("✓ previous canonical payload tampering detected");
  console.log("✓ payload / record count mismatch detected");

  console.log("");
  console.log("Sovereign Continuity:");
  console.log("✓ tenant identity bound");
  console.log("✓ company identity bound");
  console.log("✓ EXECUTION ledger domain bound");
  console.log("✓ encryption domain bound");

  console.log("");
  console.log("Lineage:");
  console.log("✓ P9R durable identifiers preserved");
  console.log("✓ P9L verification state preserved");
  console.log("✓ P9M classification state preserved");
  console.log("✓ P9N selected response preserved");
  console.log("✓ P9O execution state preserved");
  console.log("✓ P9P certified outcome preserved");
  console.log("✓ contained executor failure preserved");
  console.log("✓ contained executor summary preserved");

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
  console.log("P9U PROVIDER RUNTIME CRYPTOGRAPHIC LEDGER BINDING FAMILY VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();