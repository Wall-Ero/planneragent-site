// ============================================================
// PlannerAgent — Provider Cryptographic Operation Binding Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9V.provider.cryptographic.operation.binding.runner.ts
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
// P9V.1 — Provider Cryptographic Operation Binding Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify P9V.1 Provider Cryptographic
// Operation Binding.
//
// This runner verifies:
//
// 1. explicit binding decision rejection
// 2. completed P9U binding requirement
// 3. verified immutable-chain requirement
// 4. durable P9R / P9U identity requirement
// 5. observed cryptographic operation requirement
// 6. cryptographic operation identity requirement
// 7. cryptographic context identity requirement
// 8. provider key-reference requirement
// 9. cryptographic artifact-lineage requirement
// 10. provider context coherence
// 11. runtime operation coherence
// 12. cryptographic operation-kind coherence
// 13. provider key-reference coherence
// 14. sovereign tenant coherence
// 15. cryptographic context coherence
// 16. cryptographic artifact-lineage coherence
// 17. canonical operation binding creation
// 18. deterministic binding-digest creation
// 19. P9R durable identity propagation
// 20. P9U immutable-chain identity propagation
// 21. cryptographic operation context propagation
// 22. defensive copying
// 23. source immutability
// 24. explicit boundary preservation
//
// P9V binds an observed cryptographic
// operation fact to an existing P9U
// cryptographic ledger-chain record.
//
// P9V does not execute cryptography.
//
// P9V does not call provider APIs.
//
// P9V does not claim provider or artifact
// authenticity.
//
// ============================================================

import assert from "node:assert/strict";

import {
  bindProviderCryptographicOperation,
} from "../P9V.provider.cryptographic.operation.binding";

import type {
  ProviderCryptographicArtifactIdentity,
  ProviderCryptographicOperationBindingInput,
  ProviderCryptographicOperationBindingResult,
  ProviderCryptographicOperationFact,
} from "../P9V.provider.cryptographic.operation.binding";

import type {
  ProviderRuntimeCryptographicLedgerBindingResult,
} from "../P9U.provider.runtime.cryptographic.ledger.binding.chain.verification";


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


function cloneValue<T>(
  value: T
): T {

  return JSON.parse(
    JSON.stringify(
      value
    )
  ) as T;

}


function assertDenied(
  result:
    ProviderCryptographicOperationBindingResult,
  denialReason:
    ProviderCryptographicOperationBindingResult["bindingDenialReason"],
  label:
    string
): void {

  assert(
    result.bindingStatus ===
      "PROVIDER_CRYPTOGRAPHIC_OPERATION_BINDING_DENIED",
    `${label} binding status`
  );

  assert(
    result.cryptographicOperationBindingAttempted ===
      false,
    `${label} prevents binding attempt`
  );

  assert(
    result.cryptographicOperationBound ===
      false,
    `${label} prevents cryptographic operation binding`
  );

  assert(
    result.cryptographicOperationBindingDenied ===
      true,
    `${label} binding denied`
  );

  assert(
    result.bindingDenialReason ===
      denialReason,
    `${label} denial reason preserved`
  );

  assert(
    result.bindingFailureReason ===
      undefined,
    `${label} exposes no binding failure reason`
  );

  assert(
    result.canonicalBinding ===
      undefined,
    `${label} exposes no canonical binding`
  );

  assert(
    result.cryptographicOperationBindingDigest ===
      undefined,
    `${label} exposes no binding digest`
  );

}


function assertNotBound(
  result:
    ProviderCryptographicOperationBindingResult,
  failureReason:
    ProviderCryptographicOperationBindingResult["bindingFailureReason"],
  label:
    string
): void {

  assert(
    result.bindingStatus ===
      "PROVIDER_CRYPTOGRAPHIC_OPERATION_NOT_BOUND",
    `${label} binding status`
  );

  assert(
    result.cryptographicOperationBindingAttempted ===
      true,
    `${label} binding attempted`
  );

  assert(
    result.cryptographicOperationBound ===
      false,
    `${label} cryptographic operation not bound`
  );

  assert(
    result.cryptographicOperationBindingDenied ===
      false,
    `${label} is not a binding denial`
  );

  assert(
    result.bindingDenialReason ===
      undefined,
    `${label} exposes no denial reason`
  );

  assert(
    result.bindingFailureReason ===
      failureReason,
    `${label} failure reason preserved`
  );

  assert(
    result.cryptographicOperationBindingDigest ===
      undefined,
    `${label} exposes no successful binding digest`
  );

}


function assertBound(
  result:
    ProviderCryptographicOperationBindingResult,
  label:
    string
): void {

  assert(
    result.bindingStatus ===
      "PROVIDER_CRYPTOGRAPHIC_OPERATION_BOUND",
    `${label} binding status`
  );

  assert(
    result.cryptographicOperationBindingAttempted ===
      true,
    `${label} binding attempted`
  );

  assert(
    result.cryptographicOperationBound ===
      true,
    `${label} cryptographic operation bound`
  );

  assert(
    result.cryptographicOperationBindingDenied ===
      false,
    `${label} binding not denied`
  );

  assert(
    result.bindingDenialReason ===
      undefined,
    `${label} exposes no denial reason`
  );

  assert(
    result.bindingFailureReason ===
      undefined,
    `${label} exposes no failure reason`
  );

  assert(
    result.canonicalBinding !==
      undefined,
    `${label} canonical binding created`
  );

  assert(
    typeof result.cryptographicOperationBindingDigest ===
      "string" &&
    result.cryptographicOperationBindingDigest.length ===
      64,
    `${label} SHA-256 binding digest created`
  );

  assert(
    result.cryptographicOperationBindingDigestAlgorithm ===
      "SHA-256",
    `${label} binding digest algorithm preserved`
  );

}


function assertNoCrossLayerFields(
  value:
    Record<string, unknown>
): void {

  const forbiddenFields = [

    "providerApiCalled",

    "providerSdkCalled",

    "providerExecutionInvoked",

    "cryptographicOperationExecuted",

    "cryptographicOperationAuthorized",

    "payloadEncrypted",

    "payloadDecrypted",

    "keyWrapped",

    "keyUnwrapped",

    "keyRewrapped",

    "keyRotated",

    "dataKeyGenerated",

    "providerSignatureVerified",

    "providerAuthenticityVerified",

    "providerAuthenticityProven",

    "cryptographicArtifactAuthenticityVerified",

    "cryptographicArtifactAuthenticityProven",

    "signerIdentityVerified",

    "runtimeVerified",

    "providerVerificationPassed",

    "runtimeFailureClassified",

    "runtimeFailureSeverity",

    "failureSeverityAssigned",

    "runtimeResponseDecided",

    "runtimeResponseExecuted",

    "retryDecision",

    "retryExecuted",

    "recoveryDecision",

    "recoveryExecuted",

    "failoverDecision",

    "failoverExecuted",

    "stopDecision",

    "stopExecuted",

    "escalationDispatched",

    "outcomeCertified",

    "evidenceAdmitted",

    "evidencePersisted",

    "ledgerWritten",

    "ledgerEntryCreated",

    "auditAdmissionDecided",

    "auditExecuted",

    "auditRecordWritten",

    "fullLedgerHistoryVerified",

    "p9uRecordAppended",

    "p9uChainRewritten",

    "durableIdentifierManufactured",

    "providerErrorResanitized",

    "sanitizedFailureSurfaceAltered",

    "rawPlaintext",

    "plaintext",

    "decryptedPayload",

    "rawDataKey",

    "unwrappedKeyMaterial",

    "privateKey",

    "providerCredential",

    "secretValue",

  ];

  for (const field of forbiddenFields) {

    assert(
      !(field in value),
      `cross-layer field not exposed: ${field}`
    );

    pass(
      `cross-layer field not exposed: ${field}`
    );

  }

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
  "arn:aws:kms:eu-west-1:123456789012:key/key-runtime-001";

const tenantId =
  "tenant-001";

const companyId =
  "company-001";

const cryptographicOperationId =
  "crypto-operation-001";

const cryptographicContextId =
  "crypto-context-001";

const providerOperationReference =
  "aws-kms-request-001";

const persistenceId =
  "provider-runtime-persistence-001";

const ledgerEntryId =
  "provider-runtime-ledger-entry-001";

const ledgerSequence =
  101;

const persistedAt =
  "2026-07-12T18:00:00.000Z";

const p9uChainId =
  "provider-runtime-chain-001";

const p9uChainRecordId =
  "provider-runtime-chain-record-101";

const p9uChainRecordHash =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const p9uChainPayloadHash =
  "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const p9uChainSequence =
  101;


// ============================================================
// ARTIFACT FIXTURES
// ============================================================

function buildInputArtifact():
  ProviderCryptographicArtifactIdentity {

  return {

    artifactId:
      "wrapped-key-before-rewrap-001",

    artifactKind:
      "WRAPPED_KEY",

    artifactDigest:
      "1111111111111111111111111111111111111111111111111111111111111111",

    artifactDigestAlgorithm:
      "SHA-256",

  };

}


function buildOutputArtifact():
  ProviderCryptographicArtifactIdentity {

  return {

    artifactId:
      "wrapped-key-after-rewrap-001",

    artifactKind:
      "WRAPPED_KEY",

    artifactDigest:
      "2222222222222222222222222222222222222222222222222222222222222222",

    artifactDigestAlgorithm:
      "SHA-256",

  };

}


// ============================================================
// P9U FIXTURE
// ============================================================
//
// The explicit cast keeps this dedicated P9V runner isolated
// from unrelated optional fields in the wider P9U result.
//
// Every field consumed by P9V is nevertheless represented
// explicitly.
//
// ============================================================

function buildP9URuntimeLedgerBinding():
  ProviderRuntimeCryptographicLedgerBindingResult {

  const fixture = {

    bindingStatus:
      "PROVIDER_RUNTIME_LEDGER_CRYPTOGRAPHICALLY_BOUND",

    bindingDecision:
      "BIND_PROVIDER_RUNTIME_LEDGER",

    runtimeLedgerBindingAttempted:
      true,

    runtimeLedgerCryptographicallyBound:
      true,

    runtimeLedgerBindingDenied:
      false,

    immutableChainVerificationAttempted:
      true,

    immutableChainVerified:
      true,

    providerContract,

    providerImplementation,

    operation,

    providerResourceId,

    providerConfigurationRef:
      "cfg/aws-kms-prod",

    providerCredentialRef:
      "cred/aws-kms-prod",

    tenantId,

    companyId,

    ledgerDomain:
      "EXECUTION",

    encryptionDomain:
      "provider-runtime-encryption-domain-001",

    persistenceId,

    ledgerEntryId,

    ledgerSequence,

    persistedAt,

    executionMetadata: {

      tenantId,

      companyId,

      runtimeRequestId:
        "runtime-request-001",

      cryptographicContextId,

    },

    chainRecord: {

      chain_id:
        p9uChainId,

      record_id:
        p9uChainRecordId,

      sequence_number:
        p9uChainSequence,

      previous_hash:
        "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",

      payload_hash:
        p9uChainPayloadHash,

      current_hash:
        p9uChainRecordHash,

    },

    chainVerification: {

      valid:
        true,

      payloadIntegrityValid:
        true,

      recordHashIntegrityValid:
        true,

      chainIdentityValid:
        true,

      sequenceContinuityValid:
        true,

      previousHashContinuityValid:
        true,

      summary: [
        "immutable_chain_verified",
      ],

    },

    summary: [
      "provider_runtime_ledger_cryptographically_bound",
      "immutable_chain_verified",
      "p9r_durable_identity_preserved",
      "provider_runtime_lineage_preserved",
    ],

  };

  return fixture as unknown as
    ProviderRuntimeCryptographicLedgerBindingResult;

}


// ============================================================
// CRYPTOGRAPHIC OPERATION FACT FIXTURE
// ============================================================

function buildCryptographicOperationFact():
  ProviderCryptographicOperationFact {

  return {

    cryptographicOperationObserved:
      true,

    cryptographicOperationId,

    cryptographicContextId,

    cryptographicOperationKind:
      "REWRAP_KEY",

    providerContract,

    providerImplementation,

    providerOperation:
      operation,

    providerResourceId,

    providerKeyReference:
      providerResourceId,

    tenantId,

    inputArtifact:
      buildInputArtifact(),

    outputArtifact:
      buildOutputArtifact(),

    observedAt:
      "2026-07-12T17:59:58.000Z",

    providerOperationReference,

    summary: [
      "provider_cryptographic_operation_observed",
      "provider_key_reference_preserved",
      "cryptographic_artifact_lineage_preserved",
    ],

  };

}


// ============================================================
// INPUT FIXTURE
// ============================================================

function buildInput(
  overrides?:
    Partial<ProviderCryptographicOperationBindingInput>
): ProviderCryptographicOperationBindingInput {

  return {

    runtimeLedgerBinding:
      buildP9URuntimeLedgerBinding(),

    cryptographicOperationFact:
      buildCryptographicOperationFact(),

    bindingDecision:
      "BIND_PROVIDER_CRYPTOGRAPHIC_OPERATION",

    ...overrides,

  };

}


// ============================================================
// SCENARIO 1 — BINDING DECISION REJECTED
// ============================================================

function runBindingDecisionRejectedScenario(): void {

  const result =
    bindProviderCryptographicOperation(
      buildInput({

        bindingDecision:
          "REJECT_PROVIDER_CRYPTOGRAPHIC_OPERATION_BINDING",

      })
    );

  assertDenied(
    result,
    "CRYPTOGRAPHIC_OPERATION_BINDING_NOT_ALLOWED",
    "binding decision rejected"
  );

  assert(
    result.summary.includes(
      "cryptographic_operation_binding_not_allowed"
    ),
    "binding rejection summary preserved"
  );

  pass("binding decision rejected");
  pass("binding rejection reason preserved");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 2 — P9U BINDING REQUIRED
// ============================================================

function runP9UBindingRequiredScenario(): void {

  const runtimeLedgerBinding = {

    ...buildP9URuntimeLedgerBinding(),

    bindingStatus:
      "PROVIDER_RUNTIME_LEDGER_NOT_CRYPTOGRAPHICALLY_BOUND",

    runtimeLedgerCryptographicallyBound:
      false,

  } as unknown as
    ProviderRuntimeCryptographicLedgerBindingResult;

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        runtimeLedgerBinding,
      })
    );

  assertDenied(
    result,
    "P9U_RUNTIME_LEDGER_NOT_CRYPTOGRAPHICALLY_BOUND",
    "P9U binding required"
  );

  assert(
    result.summary.includes(
      "p9u_runtime_ledger_not_cryptographically_bound"
    ),
    "P9U binding requirement summary preserved"
  );

  pass("completed P9U binding required");
  pass("unbound P9U result rejected");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 3 — IMMUTABLE CHAIN VERIFICATION REQUIRED
// ============================================================

function runImmutableChainVerificationRequiredScenario(): void {

  const runtimeLedgerBinding = {

    ...buildP9URuntimeLedgerBinding(),

    immutableChainVerified:
      false,

    chainVerification: {

      ...(
        buildP9URuntimeLedgerBinding()
          .chainVerification ?? {}
      ),

      valid:
        false,

      payloadIntegrityValid:
        true,

      recordHashIntegrityValid:
        true,

      chainIdentityValid:
        true,

    },

  } as unknown as
    ProviderRuntimeCryptographicLedgerBindingResult;

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        runtimeLedgerBinding,
      })
    );

  assertDenied(
    result,
    "P9U_IMMUTABLE_CHAIN_NOT_VERIFIED",
    "immutable chain verification required"
  );

  assert(
    result.summary.includes(
      "p9u_immutable_chain_not_verified"
    ),
    "immutable-chain denial summary preserved"
  );

  pass("verified P9U immutable chain required");
  pass("unverified immutable chain rejected");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 4 — DURABLE IDENTITY REQUIRED
// ============================================================

function runDurableIdentityRequiredScenario(): void {

  const runtimeLedgerBinding = {

    ...buildP9URuntimeLedgerBinding(),

    persistenceId:
      "",

  } as unknown as
    ProviderRuntimeCryptographicLedgerBindingResult;

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        runtimeLedgerBinding,
      })
    );

  assertDenied(
    result,
    "P9U_DURABLE_RUNTIME_IDENTITY_MISSING",
    "durable P9U identity required"
  );

  assert(
    result.summary.includes(
      "p9u_durable_runtime_identity_missing"
    ),
    "durable identity denial summary preserved"
  );

  pass("P9R durable identity required");
  pass("missing durable identity rejected");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 5 — OPERATION OBSERVATION REQUIRED
// ============================================================

function runOperationObservationRequiredScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    cryptographicOperationObserved:
      false,

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertDenied(
    result,
    "CRYPTOGRAPHIC_OPERATION_NOT_OBSERVED",
    "operation observation required"
  );

  assert(
    result.summary.includes(
      "cryptographic_operation_not_observed"
    ),
    "operation-observation denial summary preserved"
  );

  pass("observed cryptographic operation required");
  pass("unobserved cryptographic operation rejected");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 6 — OPERATION IDENTITY REQUIRED
// ============================================================

function runOperationIdentityRequiredScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    cryptographicOperationId:
      "",

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertDenied(
    result,
    "CRYPTOGRAPHIC_OPERATION_IDENTITY_MISSING",
    "operation identity required"
  );

  assert(
    result.summary.includes(
      "cryptographic_operation_identity_missing"
    ),
    "operation identity denial summary preserved"
  );

  pass("cryptographic operation identity required");
  pass("missing operation identity rejected");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 7 — CRYPTOGRAPHIC CONTEXT REQUIRED
// ============================================================

function runCryptographicContextRequiredScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    cryptographicContextId:
      "",

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertDenied(
    result,
    "CRYPTOGRAPHIC_CONTEXT_IDENTITY_MISSING",
    "cryptographic context identity required"
  );

  assert(
    result.summary.includes(
      "cryptographic_context_identity_missing"
    ),
    "cryptographic context denial summary preserved"
  );

  pass("cryptographic context identity required");
  pass("missing cryptographic context rejected");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 8 — PROVIDER KEY REFERENCE REQUIRED
// ============================================================

function runProviderKeyReferenceRequiredScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    providerKeyReference:
      "",

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertDenied(
    result,
    "PROVIDER_KEY_REFERENCE_MISSING",
    "provider key reference required"
  );

  assert(
    result.summary.includes(
      "provider_key_reference_missing"
    ),
    "provider key reference denial summary preserved"
  );

  pass("provider key reference required");
  pass("missing provider key reference rejected");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 9 — ARTIFACT LINEAGE REQUIRED
// ============================================================

function runArtifactLineageRequiredScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    inputArtifact:
      undefined,

    outputArtifact:
      undefined,

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertDenied(
    result,
    "CRYPTOGRAPHIC_ARTIFACT_LINEAGE_MISSING",
    "cryptographic artifact lineage required"
  );

  assert(
    result.summary.includes(
      "cryptographic_artifact_lineage_missing"
    ),
    "artifact-lineage denial summary preserved"
  );

  pass("cryptographic artifact lineage required");
  pass("missing artifact lineage rejected");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 10 — PROVIDER CONTEXT MISMATCH
// ============================================================

function runProviderContextMismatchScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    providerImplementation:
      "VAULT_TRANSIT",

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertNotBound(
    result,
    "PROVIDER_CONTEXT_MISMATCH",
    "provider context mismatch"
  );

  assert(
    result.summary.includes(
      "provider_context_mismatch"
    ),
    "provider context mismatch summary preserved"
  );

  pass("provider context mismatch rejected");
  pass("provider implementation ownership coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 11 — RUNTIME OPERATION MISMATCH
// ============================================================

function runRuntimeOperationMismatchScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    providerOperation:
      "ENCRYPT",

    cryptographicOperationKind:
      "ENCRYPT" as const,

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertNotBound(
    result,
    "RUNTIME_OPERATION_MISMATCH",
    "runtime operation mismatch"
  );

  assert(
    result.summary.includes(
      "runtime_operation_mismatch"
    ),
    "runtime operation mismatch summary preserved"
  );

  pass("runtime operation mismatch rejected");
  pass("governed operation ownership coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 12 — OPERATION KIND MISMATCH
// ============================================================

function runOperationKindMismatchScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    cryptographicOperationKind:
      "ENCRYPT" as const,

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertNotBound(
    result,
    "RUNTIME_OPERATION_MISMATCH",
    "cryptographic operation kind mismatch"
  );

  assert(
    result.summary.includes(
      "runtime_operation_mismatch"
    ),
    "operation-kind mismatch summary preserved"
  );

  pass("cryptographic operation kind mismatch rejected");
  pass("canonical operation kind coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 13 — PROVIDER KEY REFERENCE MISMATCH
// ============================================================

function runProviderKeyReferenceMismatchScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    providerKeyReference:
      "arn:aws:kms:eu-west-1:123456789012:key/key-different",

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertNotBound(
    result,
    "PROVIDER_KEY_REFERENCE_MISMATCH",
    "provider key reference mismatch"
  );

  assert(
    result.summary.includes(
      "provider_key_reference_mismatch"
    ),
    "key-reference mismatch summary preserved"
  );

  pass("provider key reference mismatch rejected");
  pass("provider key-reference coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 14 — SOVEREIGN TENANT MISMATCH
// ============================================================

function runSovereignTenantMismatchScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    tenantId:
      "tenant-other",

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertNotBound(
    result,
    "SOVEREIGN_TENANT_CONTEXT_MISMATCH",
    "sovereign tenant context mismatch"
  );

  assert(
    result.summary.includes(
      "sovereign_tenant_context_mismatch"
    ),
    "tenant mismatch summary preserved"
  );

  pass("sovereign tenant mismatch rejected");
  pass("tenant ownership coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 15 — CRYPTOGRAPHIC CONTEXT MISMATCH
// ============================================================

function runCryptographicContextMismatchScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    cryptographicContextId:
      "crypto-context-other",

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertNotBound(
    result,
    "CRYPTOGRAPHIC_CONTEXT_MISMATCH",
    "cryptographic context mismatch"
  );

  assert(
    result.summary.includes(
      "cryptographic_context_mismatch"
    ),
    "cryptographic context mismatch summary preserved"
  );

  pass("cryptographic context mismatch rejected");
  pass("cryptographic context lineage coherence enforced");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 16 — ARTIFACT LINEAGE INCOHERENT
// ============================================================

function runArtifactLineageIncoherentScenario(): void {

  const sharedArtifactId =
    "wrapped-key-shared-identity";

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    inputArtifact: {

      ...buildInputArtifact(),

      artifactId:
        sharedArtifactId,

    },

    outputArtifact: {

      ...buildOutputArtifact(),

      artifactId:
        sharedArtifactId,

    },

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertNotBound(
    result,
    "CRYPTOGRAPHIC_ARTIFACT_LINEAGE_INCOHERENT",
    "artifact lineage incoherent"
  );

  assert(
    result.summary.includes(
      "cryptographic_artifact_lineage_incoherent"
    ),
    "artifact-lineage incoherence summary preserved"
  );

  pass("incoherent cryptographic artifact lineage rejected");
  pass("same artifact identity with conflicting digest rejected");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 17 — INPUT-ONLY ARTIFACT LINEAGE
// ============================================================

function runInputOnlyArtifactLineageScenario(): void {

  const cryptographicOperationFact = {

    ...buildCryptographicOperationFact(),

    outputArtifact:
      undefined,

  };

  const result =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact,
      })
    );

  assertBound(
    result,
    "input-only artifact lineage"
  );

  assert(
    result.inputArtifact !==
      undefined,
    "input-only artifact identity preserved"
  );

  assert(
    result.outputArtifact ===
      undefined,
    "missing output artifact not manufactured"
  );

  pass("input-only artifact lineage accepted");
  pass("missing output artifact not manufactured");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

}


// ============================================================
// SCENARIO 18 — HAPPY PATH BINDING
// ============================================================

function runHappyPathBindingScenario():
  ProviderCryptographicOperationBindingResult {

  const input =
    buildInput();

  const result =
    bindProviderCryptographicOperation(
      input
    );

  assertBound(
    result,
    "happy path"
  );

  assert(
    result.summary.includes(
      "provider_cryptographic_operation_bound"
    ),
    "bound summary token preserved"
  );

  assert(
    result.summary.includes(
      "cryptographic_operation_runtime_fact_bound"
    ),
    "runtime-fact binding summary preserved"
  );

  assert(
    result.summary.includes(
      "provider_key_reference_bound"
    ),
    "provider key-reference binding summary preserved"
  );

  assert(
    result.summary.includes(
      "cryptographic_artifact_lineage_bound"
    ),
    "artifact-lineage binding summary preserved"
  );

  assert(
    result.summary.includes(
      "p9u_chain_identity_bound"
    ),
    "P9U chain binding summary preserved"
  );

  pass("provider cryptographic operation bound");
  pass("canonical operation binding created");
  pass("cryptographic operation binding digest created");

  assertNoCrossLayerFields(
    result as unknown as
      Record<string, unknown>
  );

  return result;

}


// ============================================================
// CANONICAL BINDING CHECKS
// ============================================================

function runCanonicalBindingChecks(
  result:
    ProviderCryptographicOperationBindingResult
): void {

  const canonicalBinding =
    result.canonicalBinding;

  assert(
    canonicalBinding !==
      undefined,
    "canonical binding available"
  );

  assert(
    canonicalBinding.bindingType ===
      "PROVIDER_CRYPTOGRAPHIC_OPERATION_RUNTIME_FACT_BINDING",
    "canonical binding type preserved"
  );

  assert(
    canonicalBinding.bindingVersion ===
      "P9V.1",
    "canonical binding version preserved"
  );

  assert(
    canonicalBinding.cryptographicOperationId ===
      cryptographicOperationId,
    "cryptographicOperationId bound"
  );

  assert(
    canonicalBinding.cryptographicContextId ===
      cryptographicContextId,
    "cryptographicContextId bound"
  );

  assert(
    canonicalBinding.cryptographicOperationKind ===
      "REWRAP_KEY",
    "cryptographic operation kind bound"
  );

  assert(
    canonicalBinding.providerContract ===
      providerContract,
    "providerContract bound"
  );

  assert(
    canonicalBinding.providerImplementation ===
      providerImplementation,
    "providerImplementation bound"
  );

  assert(
    canonicalBinding.providerOperation ===
      operation,
    "provider operation bound"
  );

  assert(
    canonicalBinding.providerResourceId ===
      providerResourceId,
    "provider resource identity bound"
  );

  assert(
    canonicalBinding.providerKeyReference ===
      providerResourceId,
    "provider key reference bound"
  );

  assert(
    canonicalBinding.tenantId ===
      tenantId,
    "tenant identity bound"
  );

  assert(
    canonicalBinding.companyId ===
      companyId,
    "company identity bound"
  );

  assert(
    canonicalBinding.providerOperationReference ===
      providerOperationReference,
    "provider operation reference bound"
  );

  assert(
    canonicalBinding.persistenceId ===
      persistenceId,
    "P9R persistence identity bound"
  );

  assert(
    canonicalBinding.ledgerEntryId ===
      ledgerEntryId,
    "P9R ledger entry identity bound"
  );

  assert(
    canonicalBinding.ledgerSequence ===
      ledgerSequence,
    "P9R ledger sequence bound"
  );

  assert(
    canonicalBinding.persistedAt ===
      persistedAt,
    "P9R persistence timestamp bound"
  );

  assert(
    canonicalBinding.p9uChainId ===
      p9uChainId,
    "P9U chain identity bound"
  );

  assert(
    canonicalBinding.p9uChainRecordId ===
      p9uChainRecordId,
    "P9U record identity bound"
  );

  assert(
    canonicalBinding.p9uChainRecordHash ===
      p9uChainRecordHash,
    "P9U record hash bound"
  );

  assert(
    canonicalBinding.p9uChainSequence ===
      p9uChainSequence,
    "P9U chain sequence bound"
  );

  assert(
    canonicalBinding.p9uChainPayloadHash ===
      p9uChainPayloadHash,
    "P9U canonical payload hash bound"
  );

  assert.deepEqual(
    canonicalBinding.inputArtifact,
    buildInputArtifact(),
    "input artifact identity bound"
  );

  assert.deepEqual(
    canonicalBinding.outputArtifact,
    buildOutputArtifact(),
    "output artifact identity bound"
  );

  pass("canonical binding identity verified");
  pass("cryptographic operation context bound");
  pass("provider key reference bound");
  pass("cryptographic artifacts bound");
  pass("P9R durable identity bound");
  pass("P9U immutable-chain identity bound");

}


// ============================================================
// DETERMINISTIC DIGEST CHECKS
// ============================================================

function runDeterministicDigestChecks(): void {

  const first =
    bindProviderCryptographicOperation(
      buildInput()
    );

  const second =
    bindProviderCryptographicOperation(
      buildInput()
    );

  assertBound(
    first,
    "first deterministic binding"
  );

  assertBound(
    second,
    "second deterministic binding"
  );

  assert(
    first.cryptographicOperationBindingDigest ===
      second.cryptographicOperationBindingDigest,
    "same canonical operation produces same digest"
  );

  const changedFact = {

    ...buildCryptographicOperationFact(),

    outputArtifact: {

      ...buildOutputArtifact(),

      artifactDigest:
        "3333333333333333333333333333333333333333333333333333333333333333",

    },

  };

  const changed =
    bindProviderCryptographicOperation(
      buildInput({
        cryptographicOperationFact:
          changedFact,
      })
    );

  assertBound(
    changed,
    "changed artifact binding"
  );

  assert(
    first.cryptographicOperationBindingDigest !==
      changed.cryptographicOperationBindingDigest,
    "changed artifact identity changes binding digest"
  );

  pass("binding digest deterministic");
  pass("same canonical binding produces same digest");
  pass("changed artifact lineage changes digest");

}


// ============================================================
// CONTEXT PROPAGATION CHECKS
// ============================================================

function runContextPropagationChecks(
  result:
    ProviderCryptographicOperationBindingResult
): void {

  assert(
    result.cryptographicOperationId ===
      cryptographicOperationId,
    "cryptographicOperationId propagated"
  );

  assert(
    result.cryptographicContextId ===
      cryptographicContextId,
    "cryptographicContextId propagated"
  );

  assert(
    result.cryptographicOperationKind ===
      "REWRAP_KEY",
    "cryptographicOperationKind propagated"
  );

  assert(
    result.providerContract ===
      providerContract,
    "providerContract propagated"
  );

  assert(
    result.providerImplementation ===
      providerImplementation,
    "providerImplementation propagated"
  );

  assert(
    result.providerOperation ===
      operation,
    "providerOperation propagated"
  );

  assert(
    result.providerResourceId ===
      providerResourceId,
    "providerResourceId propagated"
  );

  assert(
    result.providerKeyReference ===
      providerResourceId,
    "providerKeyReference propagated"
  );

  assert(
    result.tenantId ===
      tenantId,
    "tenantId propagated"
  );

  assert(
    result.companyId ===
      companyId,
    "companyId propagated"
  );

  assert(
    result.providerOperationReference ===
      providerOperationReference,
    "providerOperationReference propagated"
  );

  assert(
    result.persistenceId ===
      persistenceId,
    "persistenceId propagated"
  );

  assert(
    result.ledgerEntryId ===
      ledgerEntryId,
    "ledgerEntryId propagated"
  );

  assert(
    result.ledgerSequence ===
      ledgerSequence,
    "ledgerSequence propagated"
  );

  assert(
    result.persistedAt ===
      persistedAt,
    "persistedAt propagated"
  );

  assert(
    result.p9uChainId ===
      p9uChainId,
    "P9U chain id propagated"
  );

  assert(
    result.p9uChainRecordId ===
      p9uChainRecordId,
    "P9U record id propagated"
  );

  assert(
    result.p9uChainRecordHash ===
      p9uChainRecordHash,
    "P9U record hash propagated"
  );

  assert(
    result.p9uChainSequence ===
      p9uChainSequence,
    "P9U chain sequence propagated"
  );

  assert(
    result.p9uChainPayloadHash ===
      p9uChainPayloadHash,
    "P9U payload hash propagated"
  );

  assert(
    result.runtimeLedgerBindingSummary.includes(
      "provider_runtime_ledger_cryptographically_bound"
    ),
    "P9U summary propagated"
  );

  assert(
    result.cryptographicOperationFactSummary.includes(
      "provider_cryptographic_operation_observed"
    ),
    "cryptographic operation fact summary propagated"
  );

  pass("provider/runtime context propagated");
  pass("cryptographic operation context propagated");
  pass("P9R durable identity propagated");
  pass("P9U immutable-chain context propagated");
  pass("summary lineage propagated");

}


// ============================================================
// DEFENSIVE COPY AND SOURCE IMMUTABILITY
// ============================================================

function runImmutabilityChecks(): void {

  const runtimeLedgerBinding =
    buildP9URuntimeLedgerBinding();

  const cryptographicOperationFact =
    buildCryptographicOperationFact();

  const runtimeLedgerBindingBefore =
    cloneValue(
      runtimeLedgerBinding
    );

  const cryptographicOperationFactBefore =
    cloneValue(
      cryptographicOperationFact
    );

  const result =
    bindProviderCryptographicOperation({

      runtimeLedgerBinding,

      cryptographicOperationFact,

      bindingDecision:
        "BIND_PROVIDER_CRYPTOGRAPHIC_OPERATION",

    });

  assertBound(
    result,
    "immutability binding"
  );

  assert.deepEqual(
    runtimeLedgerBinding,
    runtimeLedgerBindingBefore,
    "source P9U result remains immutable"
  );

  assert.deepEqual(
    cryptographicOperationFact,
    cryptographicOperationFactBefore,
    "source cryptographic operation fact remains immutable"
  );

  assert.notStrictEqual(
    result.runtimeLedgerBindingSummary,
    runtimeLedgerBinding.summary,
    "P9U summary copied defensively"
  );

  assert.notStrictEqual(
    result.cryptographicOperationFactSummary,
    cryptographicOperationFact.summary,
    "operation fact summary copied defensively"
  );

  assert.notStrictEqual(
    result.inputArtifact,
    cryptographicOperationFact.inputArtifact,
    "input artifact copied defensively"
  );

  assert.notStrictEqual(
    result.outputArtifact,
    cryptographicOperationFact.outputArtifact,
    "output artifact copied defensively"
  );

  assert.notStrictEqual(
    result.canonicalBinding?.inputArtifact,
    cryptographicOperationFact.inputArtifact,
    "canonical input artifact copied defensively"
  );

  assert.notStrictEqual(
    result.canonicalBinding?.outputArtifact,
    cryptographicOperationFact.outputArtifact,
    "canonical output artifact copied defensively"
  );

  result.runtimeLedgerBindingSummary.push(
    "mutated_result_summary"
  );

  result.cryptographicOperationFactSummary.push(
    "mutated_operation_summary"
  );

  if (result.inputArtifact) {

    result.inputArtifact.artifactId =
      "mutated-result-input-artifact";

  }

  if (
    result.canonicalBinding
      ?.outputArtifact
  ) {

    result.canonicalBinding
      .outputArtifact
      .artifactId =
        "mutated-canonical-output-artifact";

  }

  assert.deepEqual(
    runtimeLedgerBinding,
    runtimeLedgerBindingBefore,
    "result mutation does not alter P9U source"
  );

  assert.deepEqual(
    cryptographicOperationFact,
    cryptographicOperationFactBefore,
    "result mutation does not alter operation fact source"
  );

  pass("P9U summary copied defensively");
  pass("cryptographic operation summary copied defensively");
  pass("artifact identities copied defensively");
  pass("source P9U result not mutated");
  pass("source cryptographic operation fact not mutated");

}


// ============================================================
// BOUNDARY VERIFICATION
// ============================================================

function runBoundaryVerification(): void {

  const results:
    ProviderCryptographicOperationBindingResult[] = [

      bindProviderCryptographicOperation(
        buildInput()
      ),

      bindProviderCryptographicOperation(
        buildInput({

          bindingDecision:
            "REJECT_PROVIDER_CRYPTOGRAPHIC_OPERATION_BINDING",

        })
      ),

      bindProviderCryptographicOperation(
        buildInput({

          cryptographicOperationFact: {

            ...buildCryptographicOperationFact(),

            providerKeyReference:
              "different-key-reference",

          },

        })
      ),

  ];

  for (const result of results) {

    assertNoCrossLayerFields(
      result as unknown as
        Record<string, unknown>
    );

  }

  pass("P9V cryptographic-operation binding boundary verified");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runBindingDecisionRejectedScenario();

  runP9UBindingRequiredScenario();

  runImmutableChainVerificationRequiredScenario();

  runDurableIdentityRequiredScenario();

  runOperationObservationRequiredScenario();

  runOperationIdentityRequiredScenario();

  runCryptographicContextRequiredScenario();

  runProviderKeyReferenceRequiredScenario();

  runArtifactLineageRequiredScenario();

  runProviderContextMismatchScenario();

  runRuntimeOperationMismatchScenario();

  runOperationKindMismatchScenario();

  runProviderKeyReferenceMismatchScenario();

  runSovereignTenantMismatchScenario();

  runCryptographicContextMismatchScenario();

  runArtifactLineageIncoherentScenario();

  runInputOnlyArtifactLineageScenario();

  const happyPath =
    runHappyPathBindingScenario();

  runCanonicalBindingChecks(
    happyPath
  );

  runDeterministicDigestChecks();

  runContextPropagationChecks(
    happyPath
  );

  runImmutabilityChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9V PROVIDER CRYPTOGRAPHIC OPERATION BINDING");
  console.log("========================================");
  console.log("");

  console.log("Binding Gates:");
  console.log("✓ explicit binding decision enforced");
  console.log("✓ completed P9U binding required");
  console.log("✓ verified P9U immutable chain required");
  console.log("✓ P9R durable identity required");
  console.log("✓ observed cryptographic operation required");
  console.log("✓ cryptographic operation identity required");
  console.log("✓ cryptographic context identity required");
  console.log("✓ provider key reference required");
  console.log("✓ cryptographic artifact lineage required");

  console.log("");
  console.log("Coherence Gates:");
  console.log("✓ provider context coherence");
  console.log("✓ runtime operation coherence");
  console.log("✓ cryptographic operation-kind coherence");
  console.log("✓ provider key-reference coherence");
  console.log("✓ sovereign tenant coherence");
  console.log("✓ cryptographic context coherence");
  console.log("✓ cryptographic artifact-lineage coherence");

  console.log("");
  console.log("Canonical Binding:");
  console.log("✓ cryptographic operation identity bound");
  console.log("✓ cryptographic context identity bound");
  console.log("✓ provider key reference bound");
  console.log("✓ input artifact identity bound");
  console.log("✓ output artifact identity bound");
  console.log("✓ provider operation reference bound");
  console.log("✓ P9R durable runtime fact bound");
  console.log("✓ P9U immutable-chain record bound");

  console.log("");
  console.log("Cryptographic Integrity:");
  console.log("✓ deterministic SHA-256 binding digest created");
  console.log("✓ identical canonical binding produces identical digest");
  console.log("✓ changed artifact lineage changes binding digest");
  console.log("✓ digest does not claim provider authenticity");
  console.log("✓ digest does not claim artifact authenticity");

  console.log("");
  console.log("Lineage:");
  console.log("✓ provider/runtime context preserved");
  console.log("✓ cryptographic operation context preserved");
  console.log("✓ P9R durable identifiers preserved");
  console.log("✓ P9U chain identity preserved");
  console.log("✓ P9U record identity and hash preserved");
  console.log("✓ P9U chain sequence preserved");
  console.log("✓ P9U canonical payload hash preserved");

  console.log("");
  console.log("Immutability:");
  console.log("✓ P9U summary copied defensively");
  console.log("✓ operation summary copied defensively");
  console.log("✓ artifact identities copied defensively");
  console.log("✓ source P9U result not mutated");
  console.log("✓ source cryptographic operation fact not mutated");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no provider API / SDK calls");
  console.log("✓ no cryptographic operation execution");
  console.log("✓ no cryptographic operation authorization");
  console.log("✓ no payload encryption or decryption");
  console.log("✓ no key wrap / unwrap / rewrap / rotation");
  console.log("✓ no provider signature verification");
  console.log("✓ no provider authenticity claim");
  console.log("✓ no artifact authenticity claim");
  console.log("✓ no runtime verification");
  console.log("✓ no failure classification");
  console.log("✓ no response decision or execution");
  console.log("✓ no outcome certification");
  console.log("✓ no evidence admission or persistence");
  console.log("✓ no P9R ledger write");
  console.log("✓ no P9U chain append or rewrite");
  console.log("✓ no audit admission or execution");
  console.log("✓ no full ledger-history verification");
  console.log("✓ no durable identifier manufacturing");
  console.log("✓ no raw cryptographic material exposure");

  console.log("");
  console.log("========================================");
  console.log("P9V.1 PROVIDER CRYPTOGRAPHIC OPERATION BINDING VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();