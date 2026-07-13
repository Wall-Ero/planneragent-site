// ============================================================
// PlannerAgent - Provider Cryptographic Attestation Verification
// and Admission Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/__tests__/
// P9W.provider.cryptographic.attestation.verification.admission.runner.ts
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
// P9W.1 - Provider Cryptographic Attestation Verification
// and Admission Runner
//
// PURPOSE
// ------------------------------------------------------------
// Verify P9W.1 provider cryptographic attestation
// verification and admission.
//
// This runner verifies:
//
// 1. explicit admission decision rejection
// 2. P9V denied binding preservation
// 3. completed P9V binding requirement
// 4. P9V binding digest requirement
// 5. provider-independent attestation material requirement
// 6. target binding-digest coherence
// 7. operation/context coherence
// 8. provider key-reference coherence
// 9. artifact-lineage coherence
// 10. sovereign tenant/company coherence
// 11. provider/runtime coherence
// 12. P9U/P9R lineage coherence
// 13. summary sufficiency
// 14. canonical attestation admission material creation
// 15. proof present/coherent/verified/admitted state distinction
// 16. P9V/P9U/P9R lineage preservation
// 17. defensive copying
// 18. source immutability
// 19. explicit boundary preservation
//
// P9W verifies and admits provider-independent
// attestation material against a completed P9V binding.
//
// P9W does not execute cryptography.
//
// P9W does not call provider APIs.
//
// P9W does not claim provider or artifact authenticity.
//
// ============================================================

import assert from "node:assert/strict";

import {
  bindProviderCryptographicOperation,
} from "../P9V.provider.cryptographic.operation.binding";

import {
  verifyAndAdmitProviderCryptographicAttestation,
} from "../P9W.provider.cryptographic.attestation.verification.admission";

import type {
  ProviderCryptographicArtifactIdentity,
  ProviderCryptographicOperationBindingInput,
  ProviderCryptographicOperationBindingResult,
  ProviderCryptographicOperationFact,
} from "../P9V.provider.cryptographic.operation.binding";

import type {
  ProviderRuntimeCryptographicLedgerBindingResult,
} from "../P9U.provider.runtime.cryptographic.ledger.binding.chain.verification";

import type {
  ProviderCryptographicAttestationAdmissionInput,
  ProviderCryptographicAttestationAdmissionResult,
  ProviderCryptographicAttestationMaterial,
} from "../P9W.provider.cryptographic.attestation.verification.admission";


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
    ProviderCryptographicAttestationAdmissionResult,
  denialReason:
    ProviderCryptographicAttestationAdmissionResult["admissionDenialReason"],
  label:
    string
): void {

  assert.equal(
    result.admissionStatus,
    "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMISSION_DENIED",
    `${label} admission status`
  );

  assert.equal(
    result.cryptographicAttestationVerificationAttempted,
    false,
    `${label} verification not attempted`
  );

  assert.equal(
    result.cryptographicAttestationAdmitted,
    false,
    `${label} attestation not admitted`
  );

  assert.equal(
    result.cryptographicAttestationAdmissionDenied,
    true,
    `${label} admission denied`
  );

  assert.equal(
    result.admissionDenialReason,
    denialReason,
    `${label} denial reason`
  );

  assert.equal(
    result.admissionFailureReason,
    undefined,
    `${label} no failure reason`
  );

  assert.equal(
    result.attestationAdmissionMaterial,
    undefined,
    `${label} no admission material`
  );

}


function assertNotAdmitted(
  result:
    ProviderCryptographicAttestationAdmissionResult,
  failureReason:
    ProviderCryptographicAttestationAdmissionResult["admissionFailureReason"],
  label:
    string
): void {

  assert.equal(
    result.admissionStatus,
    "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_NOT_ADMITTED",
    `${label} admission status`
  );

  assert.equal(
    result.cryptographicAttestationVerificationAttempted,
    true,
    `${label} verification attempted`
  );

  assert.equal(
    result.cryptographicAttestationVerified,
    false,
    `${label} not verified`
  );

  assert.equal(
    result.cryptographicAttestationAdmitted,
    false,
    `${label} not admitted`
  );

  assert.equal(
    result.cryptographicAttestationAdmissionDenied,
    false,
    `${label} not denied`
  );

  assert.equal(
    result.admissionDenialReason,
    undefined,
    `${label} no denial reason`
  );

  assert.equal(
    result.admissionFailureReason,
    failureReason,
    `${label} failure reason`
  );

  assert.equal(
    result.attestationAdmissionMaterial,
    undefined,
    `${label} no admission material`
  );

}


function assertAdmitted(
  result:
    ProviderCryptographicAttestationAdmissionResult,
  label:
    string
): void {

  assert.equal(
    result.admissionStatus,
    "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMITTED",
    `${label} admission status`
  );

  assert.equal(
    result.cryptographicAttestationVerificationAttempted,
    true,
    `${label} verification attempted`
  );

  assert.equal(
    result.cryptographicAttestationPresent,
    true,
    `${label} proof present`
  );

  assert.equal(
    result.cryptographicAttestationCoherent,
    true,
    `${label} proof coherent`
  );

  assert.equal(
    result.cryptographicAttestationVerified,
    true,
    `${label} proof verified`
  );

  assert.equal(
    result.cryptographicAttestationAdmitted,
    true,
    `${label} proof admitted`
  );

  assert.equal(
    result.cryptographicAttestationAdmissionDenied,
    false,
    `${label} admission not denied`
  );

  assert.equal(
    result.admissionDenialReason,
    undefined,
    `${label} no denial reason`
  );

  assert.equal(
    result.admissionFailureReason,
    undefined,
    `${label} no failure reason`
  );

  assert(
    result.attestationAdmissionMaterial,
    `${label} admission material exists`
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
    "signatureGenerated",
    "providerSignatureGenerated",
    "providerSignatureVerified",
    "providerAuthenticityVerified",
    "providerAuthenticityProven",
    "cryptographicArtifactAuthenticityVerified",
    "cryptographicArtifactAuthenticityProven",
    "signerIdentityVerified",
    "authorityCreated",
    "authorityReinterpreted",
    "runtimeVerified",
    "runtimeFailureClassified",
    "runtimeResponseDecided",
    "runtimeResponseExecuted",
    "outcomeCertified",
    "evidenceAdmitted",
    "evidencePersisted",
    "ledgerWritten",
    "auditAdmissionDecided",
    "auditExecuted",
    "auditRecordWritten",
    "fullLedgerHistoryVerified",
    "p9uRecordAppended",
    "p9uChainRewritten",
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

  }

}


// ============================================================
// BASE CONTEXT
// ============================================================

const providerContract =
  "KEY_MANAGEMENT";

const providerImplementation =
  "AWS_KMS";

const providerOperation =
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
// P9V UPSTREAM FIXTURES
// ============================================================

function buildP9URuntimeLedgerBinding():
  ProviderRuntimeCryptographicLedgerBindingResult {

  const fixture = {

    bindingStatus:
      "PROVIDER_RUNTIME_LEDGER_CRYPTOGRAPHICALLY_BOUND",

    bindingDecision:
      "BIND_PROVIDER_RUNTIME_LEDGER_TO_CRYPTOGRAPHIC_CHAIN",

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

    operation:
      providerOperation,

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

    providerOperation,

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


function buildP9VInput(
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


function buildBoundP9VResult():
  ProviderCryptographicOperationBindingResult {

  const result =
    bindProviderCryptographicOperation(
      buildP9VInput()
    );

  assert.equal(
    result.bindingStatus,
    "PROVIDER_CRYPTOGRAPHIC_OPERATION_BOUND",
    "P9V fixture bound"
  );

  assert(
    result.cryptographicOperationBindingDigest,
    "P9V fixture binding digest exists"
  );

  return result;

}


// ============================================================
// ATTESTATION FIXTURE
// ============================================================

function buildAttestationMaterial(
  binding:
    ProviderCryptographicOperationBindingResult,
  overrides?:
    Partial<ProviderCryptographicAttestationMaterial>
): ProviderCryptographicAttestationMaterial {

  return {

    attestationMaterialType:
      "PROVIDER_INDEPENDENT_CRYPTOGRAPHIC_ATTESTATION",

    attestationMaterialVersion:
      "P9W.1",

    attestationId:
      "attestation-p9w-001",

    attestationObserved:
      true,

    attestationDigest:
      "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",

    attestationDigestAlgorithm:
      "SHA-256",

    targetBindingDigest:
      binding.cryptographicOperationBindingDigest!,

    targetBindingDigestAlgorithm:
      "SHA-256",

    cryptographicOperationId:
      binding.cryptographicOperationId!,

    cryptographicContextId:
      binding.cryptographicContextId!,

    cryptographicOperationKind:
      binding.cryptographicOperationKind!,

    providerContract:
      binding.providerContract,

    providerImplementation:
      binding.providerImplementation,

    providerOperation:
      binding.providerOperation,

    providerResourceId:
      binding.providerResourceId,

    providerKeyReference:
      binding.providerKeyReference!,

    tenantId:
      binding.tenantId!,

    companyId:
      binding.companyId!,

    inputArtifact:
      buildInputArtifact(),

    outputArtifact:
      buildOutputArtifact(),

    p9rPersistenceId:
      binding.persistenceId!,

    p9rLedgerEntryId:
      binding.ledgerEntryId!,

    p9rLedgerSequence:
      binding.ledgerSequence!,

    p9rPersistedAt:
      binding.persistedAt!,

    p9uChainId:
      binding.p9uChainId!,

    p9uChainRecordId:
      binding.p9uChainRecordId!,

    p9uChainRecordHash:
      binding.p9uChainRecordHash!,

    p9uChainSequence:
      binding.p9uChainSequence!,

    p9uChainPayloadHash:
      binding.p9uChainPayloadHash!,

    attestedAt:
      "2026-07-12T18:01:00.000Z",

    summary: [
      "provider_independent_attestation_observed",
      "attestation_targets_p9v_binding",
      "attestation_material_sanitized",
    ],

    ...overrides,

  };

}


function buildInput(
  overrides?:
    Partial<ProviderCryptographicAttestationAdmissionInput>
): ProviderCryptographicAttestationAdmissionInput {

  const operationBinding =
    buildBoundP9VResult();

  return {

    operationBinding,

    attestationMaterial:
      buildAttestationMaterial(
        operationBinding
      ),

    admissionDecision:
      "VERIFY_AND_ADMIT_PROVIDER_CRYPTOGRAPHIC_ATTESTATION",

    ...overrides,

  };

}


// ============================================================
// SCENARIOS
// ============================================================

function runAdmissionDecisionRejectedScenario(): void {

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({

        admissionDecision:
          "REJECT_PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMISSION",

      })
    );

  assertDenied(
    result,
    "CRYPTOGRAPHIC_ATTESTATION_ADMISSION_NOT_ALLOWED",
    "admission decision rejected"
  );

  pass("explicit attestation admission decision enforced");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

}


function runP9VBindingDeniedScenario(): void {

  const operationBinding =
    bindProviderCryptographicOperation(
      buildP9VInput({
        bindingDecision:
          "REJECT_PROVIDER_CRYPTOGRAPHIC_OPERATION_BINDING",
      })
    );

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        operationBinding,
        attestationMaterial:
          buildAttestationMaterial(
            buildBoundP9VResult()
          ),
      })
    );

  assertDenied(
    result,
    "P9V_OPERATION_BINDING_DENIED",
    "P9V binding denied"
  );

  pass("P9V binding denial preserved");

}


function runP9VBindingRequiredScenario(): void {

  const operationBinding = {
    ...buildBoundP9VResult(),
    bindingStatus:
      "PROVIDER_CRYPTOGRAPHIC_OPERATION_NOT_BOUND",
    cryptographicOperationBound:
      false,
  } as ProviderCryptographicOperationBindingResult;

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        operationBinding,
        attestationMaterial:
          buildAttestationMaterial(
            buildBoundP9VResult()
          ),
      })
    );

  assertNotAdmitted(
    result,
    "P9V_OPERATION_BINDING_NOT_COMPLETED",
    "completed P9V binding required"
  );

  pass("completed P9V binding required");

}


function runP9VBindingDigestRequiredScenario(): void {

  const operationBinding = {
    ...buildBoundP9VResult(),
    cryptographicOperationBindingDigest:
      undefined,
  } as ProviderCryptographicOperationBindingResult;

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        operationBinding,
        attestationMaterial:
          buildAttestationMaterial(
            buildBoundP9VResult()
          ),
      })
    );

  assertNotAdmitted(
    result,
    "P9V_OPERATION_BINDING_DIGEST_MISSING",
    "P9V binding digest required"
  );

  pass("P9V binding digest required");

}


function runAttestationMaterialRequiredScenario(): void {

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        attestationMaterial:
          undefined,
      })
    );

  assertNotAdmitted(
    result,
    "ATTESTATION_MATERIAL_MISSING",
    "attestation material required"
  );

  assert.equal(
    result.cryptographicAttestationPresent,
    false,
    "missing material not present"
  );

  pass("provider-independent attestation material required");

}


function runTargetDigestCoherenceScenario(): void {

  const operationBinding =
    buildBoundP9VResult();

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        operationBinding,
        attestationMaterial:
          buildAttestationMaterial(
            operationBinding,
            {
              targetBindingDigest:
                "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            }
          ),
      })
    );

  assertNotAdmitted(
    result,
    "ATTESTATION_TARGET_BINDING_DIGEST_INCOHERENT",
    "target binding digest mismatch"
  );

  assert.equal(
    result.cryptographicAttestationPresent,
    true,
    "mismatched proof present"
  );

  assert.equal(
    result.cryptographicAttestationCoherent,
    false,
    "mismatched proof not coherent"
  );

  pass("target binding-digest coherence enforced");

}


function runOperationContextCoherenceScenario(): void {

  const operationBinding =
    buildBoundP9VResult();

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        operationBinding,
        attestationMaterial:
          buildAttestationMaterial(
            operationBinding,
            {
              cryptographicContextId:
                "different-context",
            }
          ),
      })
    );

  assertNotAdmitted(
    result,
    "ATTESTATION_OPERATION_CONTEXT_INCOHERENT",
    "operation context mismatch"
  );

  pass("operation and context coherence enforced");

}


function runProviderKeyReferenceCoherenceScenario(): void {

  const operationBinding =
    buildBoundP9VResult();

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        operationBinding,
        attestationMaterial:
          buildAttestationMaterial(
            operationBinding,
            {
              providerKeyReference:
                "different-key-reference",
            }
          ),
      })
    );

  assertNotAdmitted(
    result,
    "ATTESTATION_PROVIDER_KEY_REFERENCE_INCOHERENT",
    "provider key-reference mismatch"
  );

  pass("provider key-reference coherence enforced");

}


function runArtifactLineageCoherenceScenario(): void {

  const operationBinding =
    buildBoundP9VResult();

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        operationBinding,
        attestationMaterial:
          buildAttestationMaterial(
            operationBinding,
            {
              outputArtifact: {
                ...buildOutputArtifact(),
                artifactDigest:
                  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
              },
            }
          ),
      })
    );

  assertNotAdmitted(
    result,
    "ATTESTATION_ARTIFACT_LINEAGE_INCOHERENT",
    "artifact lineage mismatch"
  );

  pass("artifact digest and lineage coherence enforced");

}


function runSovereignContextCoherenceScenario(): void {

  const operationBinding =
    buildBoundP9VResult();

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        operationBinding,
        attestationMaterial:
          buildAttestationMaterial(
            operationBinding,
            {
              tenantId:
                "different-tenant",
            }
          ),
      })
    );

  assertNotAdmitted(
    result,
    "ATTESTATION_SOVEREIGN_CONTEXT_INCOHERENT",
    "sovereign context mismatch"
  );

  pass("tenant and company coherence enforced");

}


function runProviderRuntimeContextCoherenceScenario(): void {

  const operationBinding =
    buildBoundP9VResult();

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        operationBinding,
        attestationMaterial:
          buildAttestationMaterial(
            operationBinding,
            {
              providerImplementation:
                "DIFFERENT_PROVIDER",
            }
          ),
      })
    );

  assertNotAdmitted(
    result,
    "ATTESTATION_PROVIDER_RUNTIME_CONTEXT_INCOHERENT",
    "provider runtime context mismatch"
  );

  pass("provider and runtime context coherence enforced");

}


function runP9ULineageCoherenceScenario(): void {

  const operationBinding =
    buildBoundP9VResult();

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        operationBinding,
        attestationMaterial:
          buildAttestationMaterial(
            operationBinding,
            {
              p9uChainRecordHash:
                "9999999999999999999999999999999999999999999999999999999999999999",
            }
          ),
      })
    );

  assertNotAdmitted(
    result,
    "ATTESTATION_P9U_LINEAGE_INCOHERENT",
    "P9U lineage mismatch"
  );

  pass("P9V/P9U/P9R lineage coherence enforced");

}


function runSummarySufficiencyScenario(): void {

  const operationBinding =
    buildBoundP9VResult();

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput({
        operationBinding,
        attestationMaterial:
          buildAttestationMaterial(
            operationBinding,
            {
              summary:
                [],
            }
          ),
      })
    );

  assertNotAdmitted(
    result,
    "ATTESTATION_SUMMARY_INSUFFICIENT",
    "attestation summary insufficient"
  );

  assert.equal(
    result.cryptographicAttestationPresent,
    true,
    "summary failure proof present"
  );

  assert.equal(
    result.cryptographicAttestationCoherent,
    true,
    "summary failure proof coherent"
  );

  pass("attestation summary sufficiency enforced");

}


function runHappyPathAdmissionScenario():
  ProviderCryptographicAttestationAdmissionResult {

  const result =
    verifyAndAdmitProviderCryptographicAttestation(
      buildInput()
    );

  assertAdmitted(
    result,
    "happy path"
  );

  assert(
    result.summary.includes(
      "provider_cryptographic_attestation_present"
    ),
    "proof present summary preserved"
  );

  assert(
    result.summary.includes(
      "provider_cryptographic_attestation_coherent"
    ),
    "proof coherent summary preserved"
  );

  assert(
    result.summary.includes(
      "provider_cryptographic_attestation_verified"
    ),
    "proof verified summary preserved"
  );

  assert(
    result.summary.includes(
      "provider_cryptographic_attestation_admitted"
    ),
    "proof admitted summary preserved"
  );

  pass("provider-independent attestation admitted");
  pass("proof present/coherent/verified/admitted states distinguished");

  assertNoCrossLayerFields(
    result as unknown as Record<string, unknown>
  );

  return result;

}


function runCanonicalMaterialChecks(
  result:
    ProviderCryptographicAttestationAdmissionResult
): void {

  const material =
    result.attestationAdmissionMaterial;

  assert(
    material,
    "canonical attestation admission material exists"
  );

  assert.equal(
    material!.admissionMaterialType,
    "PROVIDER_CRYPTOGRAPHIC_ATTESTATION",
    "admission material type"
  );

  assert.equal(
    material!.admissionMaterialVersion,
    "P9W.1",
    "admission material version"
  );

  assert.equal(
    material!.attestationId,
    "attestation-p9w-001",
    "attestation id preserved"
  );

  assert.equal(
    material!.targetBindingDigest,
    result.targetBindingDigest,
    "target binding digest preserved"
  );

  assert.equal(
    material!.cryptographicOperationId,
    cryptographicOperationId,
    "operation id preserved"
  );

  assert.equal(
    material!.cryptographicContextId,
    cryptographicContextId,
    "context id preserved"
  );

  assert.equal(
    material!.providerKeyReference,
    providerResourceId,
    "provider key reference preserved"
  );

  assert.deepEqual(
    material!.inputArtifact,
    buildInputArtifact(),
    "input artifact lineage preserved"
  );

  assert.deepEqual(
    material!.outputArtifact,
    buildOutputArtifact(),
    "output artifact lineage preserved"
  );

  assert.equal(
    material!.p9rPersistenceId,
    persistenceId,
    "P9R persistence id preserved"
  );

  assert.equal(
    material!.p9uChainRecordHash,
    p9uChainRecordHash,
    "P9U record hash preserved"
  );

  pass("canonical attestation admission material created");
  pass("P9V/P9U/P9R lineage preserved");

}


function runImmutabilityChecks(): void {

  const operationBinding =
    buildBoundP9VResult();

  const attestationMaterial =
    buildAttestationMaterial(
      operationBinding
    );

  const operationBindingBefore =
    cloneValue(
      operationBinding
    );

  const attestationMaterialBefore =
    cloneValue(
      attestationMaterial
    );

  const result =
    verifyAndAdmitProviderCryptographicAttestation({

      operationBinding,

      attestationMaterial,

      admissionDecision:
        "VERIFY_AND_ADMIT_PROVIDER_CRYPTOGRAPHIC_ATTESTATION",

    });

  assertAdmitted(
    result,
    "immutability admission"
  );

  assert.deepEqual(
    operationBinding,
    operationBindingBefore,
    "source P9V result remains immutable"
  );

  assert.deepEqual(
    attestationMaterial,
    attestationMaterialBefore,
    "source attestation material remains immutable"
  );

  assert.notStrictEqual(
    result.p9vBindingSummary,
    operationBinding.summary,
    "P9V summary copied defensively"
  );

  assert.notStrictEqual(
    result.attestationSummary,
    attestationMaterial.summary,
    "attestation summary copied defensively"
  );

  assert.notStrictEqual(
    result.inputArtifact,
    operationBinding.inputArtifact,
    "result input artifact copied defensively"
  );

  assert.notStrictEqual(
    result.attestationAdmissionMaterial?.inputArtifact,
    attestationMaterial.inputArtifact,
    "admission input artifact copied defensively"
  );

  result.p9vBindingSummary.push(
    "mutated_result_summary"
  );

  result.attestationSummary.push(
    "mutated_attestation_summary"
  );

  if (result.inputArtifact) {

    result.inputArtifact.artifactId =
      "mutated-result-artifact";

  }

  if (
    result.attestationAdmissionMaterial
      ?.outputArtifact
  ) {

    result.attestationAdmissionMaterial
      .outputArtifact
      .artifactId =
        "mutated-admission-artifact";

  }

  assert.deepEqual(
    operationBinding,
    operationBindingBefore,
    "result mutation does not alter P9V source"
  );

  assert.deepEqual(
    attestationMaterial,
    attestationMaterialBefore,
    "result mutation does not alter attestation source"
  );

  pass("P9V summary copied defensively");
  pass("attestation summary copied defensively");
  pass("artifact identities copied defensively");
  pass("source P9V result not mutated");
  pass("source attestation material not mutated");

}


function runBoundaryVerification(): void {

  const results:
    ProviderCryptographicAttestationAdmissionResult[] = [

      verifyAndAdmitProviderCryptographicAttestation(
        buildInput()
      ),

      verifyAndAdmitProviderCryptographicAttestation(
        buildInput({
          admissionDecision:
            "REJECT_PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMISSION",
        })
      ),

      verifyAndAdmitProviderCryptographicAttestation(
        buildInput({
          attestationMaterial:
            undefined,
        })
      ),

    ];

  for (const result of results) {

    assertNoCrossLayerFields(
      result as unknown as Record<string, unknown>
    );

  }

  pass("P9W attestation verification/admission boundary verified");

}


// ============================================================
// RUNNER
// ============================================================

function main(): void {

  runAdmissionDecisionRejectedScenario();

  runP9VBindingDeniedScenario();

  runP9VBindingRequiredScenario();

  runP9VBindingDigestRequiredScenario();

  runAttestationMaterialRequiredScenario();

  runTargetDigestCoherenceScenario();

  runOperationContextCoherenceScenario();

  runProviderKeyReferenceCoherenceScenario();

  runArtifactLineageCoherenceScenario();

  runSovereignContextCoherenceScenario();

  runProviderRuntimeContextCoherenceScenario();

  runP9ULineageCoherenceScenario();

  runSummarySufficiencyScenario();

  const happyPath =
    runHappyPathAdmissionScenario();

  runCanonicalMaterialChecks(
    happyPath
  );

  runImmutabilityChecks();

  runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("P9W PROVIDER CRYPTOGRAPHIC ATTESTATION VERIFICATION AND ADMISSION");
  console.log("========================================");

  console.log("");
  console.log("Admission Gates:");
  console.log("✓ explicit admission decision enforced");
  console.log("✓ completed P9V binding required");
  console.log("✓ P9V binding digest required");
  console.log("✓ provider-independent attestation material required");

  console.log("");
  console.log("Coherence Gates:");
  console.log("✓ target binding-digest coherence");
  console.log("✓ operation and context coherence");
  console.log("✓ provider key-reference coherence");
  console.log("✓ artifact digest and lineage coherence");
  console.log("✓ tenant and company coherence");
  console.log("✓ provider and runtime context coherence");
  console.log("✓ P9V/P9U/P9R lineage coherence");

  console.log("");
  console.log("Canonical Admission:");
  console.log("✓ proof present/coherent/verified/admitted distinguished");
  console.log("✓ canonical attestation admission material created");
  console.log("✓ P9V binding digest preserved");
  console.log("✓ P9R durable runtime fact preserved");
  console.log("✓ P9U immutable-chain identity preserved");

  console.log("");
  console.log("Immutability:");
  console.log("✓ P9V summary copied defensively");
  console.log("✓ attestation summary copied defensively");
  console.log("✓ artifact identities copied defensively");
  console.log("✓ source P9V result not mutated");
  console.log("✓ source attestation material not mutated");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no cryptographic operation execution");
  console.log("✓ no provider API / SDK calls");
  console.log("✓ no signature generation");
  console.log("✓ no provider signature verification");
  console.log("✓ no provider authenticity claim");
  console.log("✓ no artifact authenticity claim");
  console.log("✓ no signer identity claim");
  console.log("✓ no authority creation or reinterpretation");
  console.log("✓ no ledger or audit write");
  console.log("✓ no full ledger-history verification");
  console.log("✓ no raw cryptographic material exposure");

  console.log("");
  console.log("========================================");
  console.log("P9W.1 PROVIDER CRYPTOGRAPHIC ATTESTATION VERIFICATION AND ADMISSION VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}

main();
