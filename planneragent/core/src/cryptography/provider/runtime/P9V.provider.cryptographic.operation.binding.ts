// ============================================================
// PlannerAgent — Provider Cryptographic Operation Binding
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9V.provider.cryptographic.operation.binding.ts
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
// P9V.1 — Provider Cryptographic Operation Binding
//
// PURPOSE
// ------------------------------------------------------------
// Bind one observed provider cryptographic operation fact
// to one cryptographically chain-bound provider-runtime fact.
//
// P9V receives:
//
// - ProviderRuntimeCryptographicLedgerBindingResult from P9U
// - one observed cryptographic operation fact
// - explicit cryptographic operation binding decision
//
// P9V:
//
// - requires completed P9U cryptographic ledger binding
// - requires verified P9U immutable-chain continuity
// - requires one observed cryptographic operation fact
// - requires one cryptographic operation identity
// - requires one cryptographic context identity
// - requires one provider key reference
// - requires cryptographic artifact lineage
// - validates provider/runtime context coherence
// - validates sovereign tenant ownership coherence
// - validates cryptographic operation coherence
// - validates provider key-reference coherence
// - validates runtime operation ownership coherence
// - creates one canonical cryptographic operation binding
// - creates one deterministic binding digest
// - preserves P9U chain-bound runtime lineage
//
// P9V does not:
//
// - execute cryptographic operations
// - authorize cryptographic operations
// - call provider APIs
// - call provider SDKs
// - verify provider execution
// - classify runtime failure
// - decide runtime response
// - execute runtime response
// - certify execution outcome
// - admit evidence
// - persist evidence
// - write P9R ledger facts
// - append P9U immutable-chain records
// - verify full ledger history
// - verify provider signatures
// - claim provider authenticity
// - claim cryptographic artifact authenticity
// - encrypt payloads
// - decrypt payloads
// - wrap keys
// - unwrap keys
// - rewrap keys
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// P9U proves that one durable provider-runtime fact
// belongs to one verified immutable governance chain.
//
// P9V binds one observed cryptographic operation fact
// to that chain-bound provider-runtime fact.
//
// Provider Runtime Fact
// ≠
// Cryptographic Operation Fact
//
// Cryptographic Operation Observed
// ≠
// Cryptographic Operation Bound
//
// Provider Operation Completed
// ≠
// Cryptographic Artifact Proven
//
// Cryptographic Artifact Bound
// ≠
// Cryptographic Authenticity Proven
//
// ============================================================

import {
  createHash,
} from "node:crypto";

import type {
  ProviderRuntimeCryptographicLedgerBindingResult,
} from "./P9U.provider.runtime.cryptographic.ledger.binding.chain.verification";


// ============================================================
// BINDING STATUS
// ============================================================

export type ProviderCryptographicOperationBindingStatus =
  | "PROVIDER_CRYPTOGRAPHIC_OPERATION_BOUND"
  | "PROVIDER_CRYPTOGRAPHIC_OPERATION_NOT_BOUND"
  | "PROVIDER_CRYPTOGRAPHIC_OPERATION_BINDING_DENIED";


// ============================================================
// BINDING DECISION
// ============================================================

export type ProviderCryptographicOperationBindingDecision =
  | "BIND_PROVIDER_CRYPTOGRAPHIC_OPERATION"
  | "REJECT_PROVIDER_CRYPTOGRAPHIC_OPERATION_BINDING";


// ============================================================
// BINDING DENIAL REASON
// ============================================================

export type ProviderCryptographicOperationBindingDenialReason =
  | "CRYPTOGRAPHIC_OPERATION_BINDING_NOT_ALLOWED"
  | "P9U_RUNTIME_LEDGER_NOT_CRYPTOGRAPHICALLY_BOUND"
  | "P9U_IMMUTABLE_CHAIN_NOT_VERIFIED"
  | "P9U_DURABLE_RUNTIME_IDENTITY_MISSING"
  | "CRYPTOGRAPHIC_OPERATION_NOT_OBSERVED"
  | "CRYPTOGRAPHIC_OPERATION_IDENTITY_MISSING"
  | "CRYPTOGRAPHIC_CONTEXT_IDENTITY_MISSING"
  | "PROVIDER_KEY_REFERENCE_MISSING"
  | "CRYPTOGRAPHIC_ARTIFACT_LINEAGE_MISSING";


// ============================================================
// BINDING FAILURE REASON
// ============================================================

export type ProviderCryptographicOperationBindingFailureReason =
  | "PROVIDER_CONTEXT_MISMATCH"
  | "RUNTIME_OPERATION_MISMATCH"
  | "PROVIDER_KEY_REFERENCE_MISMATCH"
  | "SOVEREIGN_TENANT_CONTEXT_MISMATCH"
  | "CRYPTOGRAPHIC_CONTEXT_MISMATCH"
  | "CRYPTOGRAPHIC_ARTIFACT_LINEAGE_INCOHERENT"
  | "CANONICAL_OPERATION_BINDING_NOT_CREATED"
  | "CANONICAL_OPERATION_BINDING_INCOHERENT"
  | "CRYPTOGRAPHIC_OPERATION_BINDING_DIGEST_NOT_CREATED";


// ============================================================
// CRYPTOGRAPHIC OPERATION KIND
// ============================================================
//
// P9V remains provider-independent.
//
// Provider adapters may expose provider-specific operation
// names upstream, but the observed cryptographic fact must
// preserve the actual governed runtime operation.
//
// ============================================================

export type ProviderCryptographicOperationKind =
  | "ENCRYPT"
  | "DECRYPT"
  | "WRAP_KEY"
  | "UNWRAP_KEY"
  | "REWRAP_KEY"
  | "ROTATE_KEY"
  | "GENERATE_DATA_KEY"
  | "SIGN"
  | "VERIFY"
  | "OTHER_CRYPTOGRAPHIC_OPERATION";


// ============================================================
// CRYPTOGRAPHIC ARTIFACT KIND
// ============================================================

export type ProviderCryptographicArtifactKind =
  | "PLAINTEXT"
  | "CIPHERTEXT"
  | "WRAPPED_KEY"
  | "UNWRAPPED_KEY"
  | "DATA_KEY"
  | "SIGNATURE"
  | "DIGEST"
  | "KEY_REFERENCE"
  | "OTHER_CRYPTOGRAPHIC_ARTIFACT";


// ============================================================
// CRYPTOGRAPHIC ARTIFACT IDENTITY
// ============================================================
//
// Artifact identity is metadata.
//
// P9V must never require raw plaintext, raw key material,
// ciphertext contents, wrapped-key contents, or secrets.
//
// The digest identifies the observed artifact representation
// supplied by the cryptographic boundary.
//
// Artifact digest presence does not prove artifact
// authenticity.
//
// ============================================================

export interface ProviderCryptographicArtifactIdentity {

  artifactId:
    string;

  artifactKind:
    ProviderCryptographicArtifactKind;

  artifactDigest:
    string;

  artifactDigestAlgorithm:
    string;

}


// ============================================================
// OBSERVED CRYPTOGRAPHIC OPERATION FACT
// ============================================================
//
// This fact must be created by the provider cryptographic
// operation boundary after observing the provider operation.
//
// P9V does not execute or independently rediscover the
// operation.
//
// P9V binds the supplied observed fact only when its context
// is coherent with the P9U chain-bound runtime fact.
//
// ============================================================

export interface ProviderCryptographicOperationFact {

  cryptographicOperationObserved:
    boolean;

  cryptographicOperationId:
    string;

  cryptographicContextId:
    string;

  cryptographicOperationKind:
    ProviderCryptographicOperationKind;

  providerContract:
    unknown;

  providerImplementation:
    unknown;

  providerOperation:
    unknown;

  providerResourceId?:
    unknown;

  providerKeyReference:
    string;

  tenantId:
    string;

  inputArtifact?:
    ProviderCryptographicArtifactIdentity;

  outputArtifact?:
    ProviderCryptographicArtifactIdentity;

  observedAt:
    string;

  providerOperationReference?:
    string;

  summary:
    string[];

}


// ============================================================
// CANONICAL BINDING TYPE
// ============================================================

export type ProviderCryptographicOperationBindingType =
  "PROVIDER_CRYPTOGRAPHIC_OPERATION_RUNTIME_FACT_BINDING";


// ============================================================
// CANONICAL BINDING VERSION
// ============================================================

export type ProviderCryptographicOperationBindingVersion =
  "P9V.1";


// ============================================================
// CANONICAL OPERATION BINDING
// ============================================================
//
// This binding creates one deterministic relationship:
//
// cryptographic operation fact
//        ↓
// cryptographic context
//        ↓
// provider key reference
//        ↓
// input artifact identity
//        ↓
// output artifact identity
//        ↓
// provider-runtime durable fact
//        ↓
// P9U immutable-chain record
//
// The binding does not claim:
//
// - provider signature verification
// - provider authenticity
// - artifact authenticity
// - secret ownership
// - key-material possession
//
// ============================================================

export interface ProviderCryptographicOperationCanonicalBinding {

  bindingType:
    ProviderCryptographicOperationBindingType;

  bindingVersion:
    ProviderCryptographicOperationBindingVersion;

  cryptographicOperationId:
    string;

  cryptographicContextId:
    string;

  cryptographicOperationKind:
    ProviderCryptographicOperationKind;

  providerContract:
    unknown;

  providerImplementation:
    unknown;

  providerOperation:
    unknown;

  providerResourceId?:
    unknown;

  providerKeyReference:
    string;

  tenantId:
    string;

  companyId:
    string;

  inputArtifact?:
    ProviderCryptographicArtifactIdentity;

  outputArtifact?:
    ProviderCryptographicArtifactIdentity;

  observedAt:
    string;

  providerOperationReference?:
    string;

  persistenceId:
    string;

  ledgerEntryId:
    string;

  ledgerSequence:
    number;

  persistedAt:
    string;

  p9uChainId:
    string;

  p9uChainRecordId:
    string;

  p9uChainRecordHash:
    string;

  p9uChainSequence:
    number;

  p9uChainPayloadHash:
    string;

}


// ============================================================
// INPUT
// ============================================================

export interface ProviderCryptographicOperationBindingInput {

  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult;

  cryptographicOperationFact:
    ProviderCryptographicOperationFact;

  bindingDecision:
    ProviderCryptographicOperationBindingDecision;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderCryptographicOperationBindingResult {

  bindingStatus:
    ProviderCryptographicOperationBindingStatus;

  bindingDecision:
    ProviderCryptographicOperationBindingDecision;

  cryptographicOperationBindingAttempted:
    boolean;

  cryptographicOperationBound:
    boolean;

  cryptographicOperationBindingDenied:
    boolean;

  bindingDenialReason?:
    ProviderCryptographicOperationBindingDenialReason;

  bindingFailureReason?:
    ProviderCryptographicOperationBindingFailureReason;

  cryptographicOperationId?:
    string;

  cryptographicContextId?:
    string;

  cryptographicOperationKind?:
    ProviderCryptographicOperationKind;

  providerContract?:
    unknown;

  providerImplementation?:
    unknown;

  providerOperation?:
    unknown;

  providerResourceId?:
    unknown;

  providerKeyReference?:
    string;

  tenantId?:
    string;

  companyId?:
    string;

  inputArtifact?:
    ProviderCryptographicArtifactIdentity;

  outputArtifact?:
    ProviderCryptographicArtifactIdentity;

  observedAt?:
    string;

  providerOperationReference?:
    string;

  persistenceId?:
    string;

  ledgerEntryId?:
    string;

  ledgerSequence?:
    number;

  persistedAt?:
    string;

  p9uChainId?:
    string;

  p9uChainRecordId?:
    string;

  p9uChainRecordHash?:
    string;

  p9uChainSequence?:
    number;

  p9uChainPayloadHash?:
    string;

  canonicalBinding?:
    ProviderCryptographicOperationCanonicalBinding;

  cryptographicOperationBindingDigest?:
    string;

  cryptographicOperationBindingDigestAlgorithm?:
    "SHA-256";

  runtimeLedgerBindingSummary:
    string[];

  cryptographicOperationFactSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// STRING VALIDATION
// ============================================================

function isNonEmptyString(
  value:
    unknown
): value is string {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );

}


// ============================================================
// POSITIVE INTEGER VALIDATION
// ============================================================

function isPositiveInteger(
  value:
    unknown
): value is number {

  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );

}


// ============================================================
// SUMMARY COPY
// ============================================================

function copySummary(
  value:
    unknown
): string[] {

  if (!Array.isArray(value)) {

    return [];

  }

  return value.filter(
    (
      item:
        unknown
    ): item is string =>
      typeof item === "string"
  );

}


// ============================================================
// ARTIFACT COPY
// ============================================================

function copyArtifactIdentity(
  artifact:
    ProviderCryptographicArtifactIdentity | undefined
): ProviderCryptographicArtifactIdentity | undefined {

  if (!artifact) {

    return undefined;

  }

  return {

    artifactId:
      artifact.artifactId,

    artifactKind:
      artifact.artifactKind,

    artifactDigest:
      artifact.artifactDigest,

    artifactDigestAlgorithm:
      artifact.artifactDigestAlgorithm,

  };

}


// ============================================================
// ARTIFACT IDENTITY VALIDATION
// ============================================================

function artifactIdentityIsComplete(
  artifact:
    ProviderCryptographicArtifactIdentity | undefined
): boolean {

  if (!artifact) {

    return false;

  }

  return (
    isNonEmptyString(
      artifact.artifactId
    ) &&
    isNonEmptyString(
      artifact.artifactKind
    ) &&
    isNonEmptyString(
      artifact.artifactDigest
    ) &&
    isNonEmptyString(
      artifact.artifactDigestAlgorithm
    )
  );

}


// ============================================================
// ARTIFACT LINEAGE REQUIREMENT
// ============================================================
//
// P9V requires at least one artifact identity.
//
// Some cryptographic operations legitimately expose only one
// safe artifact identity at this boundary.
//
// Examples:
//
// - DECRYPT may preserve ciphertext identity without exposing
//   plaintext identity.
//
// - UNWRAP_KEY may preserve wrapped-key identity without
//   exposing unwrapped key material.
//
// - SIGN may preserve digest identity and signature identity.
//
// P9V therefore requires cryptographic artifact lineage,
// but does not force both input and output artifacts to be
// exposed.
//
// ============================================================

function cryptographicArtifactLineageExists(
  fact:
    ProviderCryptographicOperationFact
): boolean {

  return (
    artifactIdentityIsComplete(
      fact.inputArtifact
    ) ||
    artifactIdentityIsComplete(
      fact.outputArtifact
    )
  );

}


// ============================================================
// ARTIFACT LINEAGE COHERENCE
// ============================================================

function cryptographicArtifactLineageIsCoherent(
  fact:
    ProviderCryptographicOperationFact
): boolean {

  if (
    fact.inputArtifact &&
    !artifactIdentityIsComplete(
      fact.inputArtifact
    )
  ) {

    return false;

  }

  if (
    fact.outputArtifact &&
    !artifactIdentityIsComplete(
      fact.outputArtifact
    )
  ) {

    return false;

  }

  if (
    fact.inputArtifact &&
    fact.outputArtifact &&
    fact.inputArtifact.artifactId ===
      fact.outputArtifact.artifactId &&
    fact.inputArtifact.artifactDigest !==
      fact.outputArtifact.artifactDigest
  ) {

    return false;

  }

  return true;

}


// ============================================================
// P9U DURABLE IDENTITY CHECK
// ============================================================

function p9uDurableRuntimeIdentityExists(
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult
): boolean {

  return (
    isNonEmptyString(
      runtimeLedgerBinding.persistenceId
    ) &&
    isNonEmptyString(
      runtimeLedgerBinding.ledgerEntryId
    ) &&
    isPositiveInteger(
      runtimeLedgerBinding.ledgerSequence
    ) &&
    isNonEmptyString(
      runtimeLedgerBinding.persistedAt
    )
  );

}


// ============================================================
// P9U CHAIN IDENTITY CHECK
// ============================================================

function p9uChainIdentityExists(
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult
): boolean {

  const chainRecord =
    runtimeLedgerBinding.chainRecord;

  if (!chainRecord) {

    return false;

  }

  return (
    isNonEmptyString(
      chainRecord.chain_id
    ) &&
    isNonEmptyString(
      chainRecord.record_id
    ) &&
    isNonEmptyString(
      chainRecord.current_hash
    ) &&
    isPositiveInteger(
      chainRecord.sequence_number
    ) &&
    isNonEmptyString(
      chainRecord.payload_hash
    )
  );

}


// ============================================================
// P9U COMPLETED BINDING CHECK
// ============================================================

function p9uRuntimeLedgerIsCryptographicallyBound(
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult
): boolean {

  return (
    runtimeLedgerBinding.bindingStatus ===
      "PROVIDER_RUNTIME_LEDGER_CRYPTOGRAPHICALLY_BOUND" &&
    runtimeLedgerBinding.runtimeLedgerBindingAttempted ===
      true &&
    runtimeLedgerBinding.runtimeLedgerCryptographicallyBound ===
      true &&
    runtimeLedgerBinding.runtimeLedgerBindingDenied ===
      false
  );

}


// ============================================================
// P9U IMMUTABLE-CHAIN VERIFICATION CHECK
// ============================================================

function p9uImmutableChainIsVerified(
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult
): boolean {

  return (
    runtimeLedgerBinding.immutableChainVerificationAttempted ===
      true &&
    runtimeLedgerBinding.immutableChainVerified ===
      true &&
    runtimeLedgerBinding.chainVerification?.valid ===
      true &&
    runtimeLedgerBinding.chainVerification
      ?.payloadIntegrityValid ===
      true &&
    runtimeLedgerBinding.chainVerification
      ?.recordHashIntegrityValid ===
      true &&
    runtimeLedgerBinding.chainVerification
      ?.chainIdentityValid ===
      true
  );

}


// ============================================================
// PROVIDER CONTEXT COHERENCE
// ============================================================

function providerContextIsCoherent(
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult,
  fact:
    ProviderCryptographicOperationFact
): boolean {

  return (
    runtimeLedgerBinding.providerContract ===
      fact.providerContract &&

    runtimeLedgerBinding.providerImplementation ===
      fact.providerImplementation &&

    runtimeLedgerBinding.providerResourceId ===
      fact.providerResourceId
  );

}


// ============================================================
// RUNTIME OPERATION COHERENCE
// ============================================================

function runtimeOperationIsCoherent(
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult,
  fact:
    ProviderCryptographicOperationFact
): boolean {

  return (
    runtimeLedgerBinding.operation ===
      fact.providerOperation
  );

}


// ============================================================
// PROVIDER KEY REFERENCE COHERENCE
// ============================================================
//
// P9U preserves providerResourceId.
//
// P9V requires the observed provider key reference to belong
// to the same governed provider resource.
//
// The comparison is intentionally exact.
//
// P9V does not normalize, resolve, alias, or reinterpret
// provider key references.
//
// ============================================================

function providerKeyReferenceIsCoherent(
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult,
  fact:
    ProviderCryptographicOperationFact
): boolean {

  if (
    !isNonEmptyString(
      fact.providerKeyReference
    )
  ) {

    return false;

  }

  if (
    !isNonEmptyString(
      runtimeLedgerBinding.providerResourceId
    )
  ) {

    return false;

  }

  return (
    fact.providerKeyReference ===
      runtimeLedgerBinding.providerResourceId
  );

}


// ============================================================
// SOVEREIGN TENANT COHERENCE
// ============================================================

function sovereignTenantContextIsCoherent(
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult,
  fact:
    ProviderCryptographicOperationFact
): boolean {

  return (
    isNonEmptyString(
      runtimeLedgerBinding.tenantId
    ) &&
    isNonEmptyString(
      fact.tenantId
    ) &&
    runtimeLedgerBinding.tenantId ===
      fact.tenantId
  );

}


// ============================================================
// CRYPTOGRAPHIC CONTEXT COHERENCE
// ============================================================
//
// The cryptographic context identity must be present.
//
// When the runtime execution metadata already preserves a
// cryptographicContextId, P9V requires exact equality.
//
// Absence of cryptographicContextId in historical P9U runtime
// metadata does not manufacture one and does not silently
// overwrite the observed fact.
//
// ============================================================

function cryptographicContextIsCoherent(
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult,
  fact:
    ProviderCryptographicOperationFact
): boolean {

  if (
    !isNonEmptyString(
      fact.cryptographicContextId
    )
  ) {

    return false;

  }

  const runtimeCryptographicContextId =
    runtimeLedgerBinding
      .executionMetadata
      ?.cryptographicContextId;

  if (
    runtimeCryptographicContextId === undefined
  ) {

    return true;

  }

  return (
    isNonEmptyString(
      runtimeCryptographicContextId
    ) &&
    runtimeCryptographicContextId ===
      fact.cryptographicContextId
  );

}


// ============================================================
// OPERATION KIND COHERENCE
// ============================================================
//
// P9V does not infer cryptographic operation kind from a
// provider-specific error or response.
//
// The canonical cryptographic operation kind must agree with
// the governed runtime operation when the operation is one of
// the canonical cryptographic operations.
//
// Unknown future provider operations remain representable as
// OTHER_CRYPTOGRAPHIC_OPERATION.
//
// ============================================================

function cryptographicOperationKindIsCoherent(
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult,
  fact:
    ProviderCryptographicOperationFact
): boolean {

  const operation =
    runtimeLedgerBinding.operation;

  switch (operation) {

    case "ENCRYPT":
      return (
        fact.cryptographicOperationKind ===
        "ENCRYPT"
      );

    case "DECRYPT":
      return (
        fact.cryptographicOperationKind ===
        "DECRYPT"
      );

    case "WRAP_KEY":
      return (
        fact.cryptographicOperationKind ===
        "WRAP_KEY"
      );

    case "UNWRAP_KEY":
      return (
        fact.cryptographicOperationKind ===
        "UNWRAP_KEY"
      );

    case "REWRAP_KEY":
      return (
        fact.cryptographicOperationKind ===
        "REWRAP_KEY"
      );

    case "ROTATE_KEY":
      return (
        fact.cryptographicOperationKind ===
        "ROTATE_KEY"
      );

    case "GENERATE_DATA_KEY":
      return (
        fact.cryptographicOperationKind ===
        "GENERATE_DATA_KEY"
      );

    case "SIGN":
      return (
        fact.cryptographicOperationKind ===
        "SIGN"
      );

    case "VERIFY":
      return (
        fact.cryptographicOperationKind ===
        "VERIFY"
      );

    default:
      return (
        fact.cryptographicOperationKind ===
        "OTHER_CRYPTOGRAPHIC_OPERATION"
      );

  }

}


// ============================================================
// CANONICAL VALUE NORMALIZATION
// ============================================================
//
// The canonical serializer:
//
// - sorts object keys recursively
// - preserves array order
// - preserves primitive values
// - omits undefined object properties
//
// P9V hashes the canonical binding representation.
//
// This digest proves deterministic binding integrity.
//
// It does not prove provider authenticity or signer identity.
//
// ============================================================

function normalizeCanonicalValue(
  value:
    unknown
): unknown {

  if (Array.isArray(value)) {

    return value.map(
      item =>
        normalizeCanonicalValue(
          item
        )
    );

  }

  if (
    value &&
    typeof value === "object"
  ) {

    const source =
      value as Record<string, unknown>;

    const normalized:
      Record<string, unknown> = {};

    const keys =
      Object.keys(
        source
      ).sort();

    for (const key of keys) {

      const item =
        source[key];

      if (item === undefined) {

        continue;

      }

      normalized[key] =
        normalizeCanonicalValue(
          item
        );

    }

    return normalized;

  }

  return value;

}


// ============================================================
// CANONICAL SERIALIZATION
// ============================================================

function serializeCanonicalBinding(
  binding:
    ProviderCryptographicOperationCanonicalBinding
): string {

  return JSON.stringify(
    normalizeCanonicalValue(
      binding
    )
  );

}


// ============================================================
// BINDING DIGEST
// ============================================================

function createBindingDigest(
  binding:
    ProviderCryptographicOperationCanonicalBinding
): string | undefined {

  try {

    return createHash(
      "sha256"
    )
      .update(
        serializeCanonicalBinding(
          binding
        ),
        "utf8"
      )
      .digest(
        "hex"
      );

  } catch {

    return undefined;

  }

}


// ============================================================
// CANONICAL BINDING CREATION
// ============================================================

function createCanonicalOperationBinding(
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult,
  fact:
    ProviderCryptographicOperationFact
): ProviderCryptographicOperationCanonicalBinding | undefined {

  const chainRecord =
    runtimeLedgerBinding.chainRecord;

  if (
    !p9uDurableRuntimeIdentityExists(
      runtimeLedgerBinding
    ) ||
    !p9uChainIdentityExists(
      runtimeLedgerBinding
    ) ||
    !chainRecord
  ) {

    return undefined;

  }

  return {

    bindingType:
      "PROVIDER_CRYPTOGRAPHIC_OPERATION_RUNTIME_FACT_BINDING",

    bindingVersion:
      "P9V.1",

    cryptographicOperationId:
      fact.cryptographicOperationId,

    cryptographicContextId:
      fact.cryptographicContextId,

    cryptographicOperationKind:
      fact.cryptographicOperationKind,

    providerContract:
      fact.providerContract,

    providerImplementation:
      fact.providerImplementation,

    providerOperation:
      fact.providerOperation,

    providerResourceId:
      fact.providerResourceId,

    providerKeyReference:
      fact.providerKeyReference,

    tenantId:
      fact.tenantId,

    companyId:
      runtimeLedgerBinding.companyId,

    inputArtifact:
      copyArtifactIdentity(
        fact.inputArtifact
      ),

    outputArtifact:
      copyArtifactIdentity(
        fact.outputArtifact
      ),

    observedAt:
      fact.observedAt,

    providerOperationReference:
      fact.providerOperationReference,

    persistenceId:
      runtimeLedgerBinding.persistenceId!,

    ledgerEntryId:
      runtimeLedgerBinding.ledgerEntryId!,

    ledgerSequence:
      runtimeLedgerBinding.ledgerSequence!,

    persistedAt:
      runtimeLedgerBinding.persistedAt!,

    p9uChainId:
      chainRecord.chain_id,

    p9uChainRecordId:
      chainRecord.record_id,

    p9uChainRecordHash:
      chainRecord.current_hash,

    p9uChainSequence:
      chainRecord.sequence_number,

    p9uChainPayloadHash:
      chainRecord.payload_hash,

  };

}


// ============================================================
// CANONICAL BINDING COHERENCE
// ============================================================

function canonicalOperationBindingIsCoherent(
  binding:
    ProviderCryptographicOperationCanonicalBinding,
  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult,
  fact:
    ProviderCryptographicOperationFact
): boolean {

  const chainRecord =
    runtimeLedgerBinding.chainRecord;

  if (!chainRecord) {

    return false;

  }

  return (
    binding.bindingType ===
      "PROVIDER_CRYPTOGRAPHIC_OPERATION_RUNTIME_FACT_BINDING" &&

    binding.bindingVersion ===
      "P9V.1" &&

    binding.cryptographicOperationId ===
      fact.cryptographicOperationId &&

    binding.cryptographicContextId ===
      fact.cryptographicContextId &&

    binding.cryptographicOperationKind ===
      fact.cryptographicOperationKind &&

    binding.providerContract ===
      runtimeLedgerBinding.providerContract &&

    binding.providerImplementation ===
      runtimeLedgerBinding.providerImplementation &&

    binding.providerOperation ===
      runtimeLedgerBinding.operation &&

    binding.providerResourceId ===
      runtimeLedgerBinding.providerResourceId &&

    binding.providerKeyReference ===
      fact.providerKeyReference &&

    binding.tenantId ===
      runtimeLedgerBinding.tenantId &&

    binding.companyId ===
      runtimeLedgerBinding.companyId &&

    binding.persistenceId ===
      runtimeLedgerBinding.persistenceId &&

    binding.ledgerEntryId ===
      runtimeLedgerBinding.ledgerEntryId &&

    binding.ledgerSequence ===
      runtimeLedgerBinding.ledgerSequence &&

    binding.persistedAt ===
      runtimeLedgerBinding.persistedAt &&

    binding.p9uChainId ===
      chainRecord.chain_id &&

    binding.p9uChainRecordId ===
      chainRecord.record_id &&

    binding.p9uChainRecordHash ===
      chainRecord.current_hash &&

    binding.p9uChainSequence ===
      chainRecord.sequence_number &&

    binding.p9uChainPayloadHash ===
      chainRecord.payload_hash
  );

}


// ============================================================
// RESULT CONTEXT
// ============================================================

interface ProviderCryptographicOperationResultContext {

  runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult;

  fact:
    ProviderCryptographicOperationFact;

}


// ============================================================
// DENIED RESULT
// ============================================================

function buildDeniedResult(
  input:
    ProviderCryptographicOperationBindingInput,
  context:
    ProviderCryptographicOperationResultContext,
  bindingDenialReason:
    ProviderCryptographicOperationBindingDenialReason,
  summaryToken:
    string
): ProviderCryptographicOperationBindingResult {

  const runtimeLedgerBinding =
    context.runtimeLedgerBinding;

  const fact =
    context.fact;

  return {

    bindingStatus:
      "PROVIDER_CRYPTOGRAPHIC_OPERATION_BINDING_DENIED",

    bindingDecision:
      input.bindingDecision,

    cryptographicOperationBindingAttempted:
      false,

    cryptographicOperationBound:
      false,

    cryptographicOperationBindingDenied:
      true,

    bindingDenialReason,

    cryptographicOperationId:
      fact.cryptographicOperationId,

    cryptographicContextId:
      fact.cryptographicContextId,

    cryptographicOperationKind:
      fact.cryptographicOperationKind,

    providerContract:
      fact.providerContract,

    providerImplementation:
      fact.providerImplementation,

    providerOperation:
      fact.providerOperation,

    providerResourceId:
      fact.providerResourceId,

    providerKeyReference:
      fact.providerKeyReference,

    tenantId:
      fact.tenantId,

    companyId:
      runtimeLedgerBinding.companyId,

    inputArtifact:
      copyArtifactIdentity(
        fact.inputArtifact
      ),

    outputArtifact:
      copyArtifactIdentity(
        fact.outputArtifact
      ),

    observedAt:
      fact.observedAt,

    providerOperationReference:
      fact.providerOperationReference,

    persistenceId:
      runtimeLedgerBinding.persistenceId,

    ledgerEntryId:
      runtimeLedgerBinding.ledgerEntryId,

    ledgerSequence:
      runtimeLedgerBinding.ledgerSequence,

    persistedAt:
      runtimeLedgerBinding.persistedAt,

    p9uChainId:
      runtimeLedgerBinding.chainRecord?.chain_id,

    p9uChainRecordId:
      runtimeLedgerBinding.chainRecord?.record_id,

    p9uChainRecordHash:
      runtimeLedgerBinding.chainRecord?.current_hash,

    p9uChainSequence:
      runtimeLedgerBinding.chainRecord?.sequence_number,

    p9uChainPayloadHash:
      runtimeLedgerBinding.chainRecord?.payload_hash,

    runtimeLedgerBindingSummary:
      copySummary(
        runtimeLedgerBinding.summary
      ),

    cryptographicOperationFactSummary:
      copySummary(
        fact.summary
      ),

    summary: [
      ...copySummary(
        runtimeLedgerBinding.summary
      ),
      ...copySummary(
        fact.summary
      ),
      "provider_cryptographic_operation_binding_denied",
      summaryToken,
    ],

  };

}


// ============================================================
// NOT BOUND RESULT
// ============================================================

function buildNotBoundResult(
  input:
    ProviderCryptographicOperationBindingInput,
  context:
    ProviderCryptographicOperationResultContext,
  bindingFailureReason:
    ProviderCryptographicOperationBindingFailureReason,
  summaryToken:
    string,
  canonicalBinding?:
    ProviderCryptographicOperationCanonicalBinding
): ProviderCryptographicOperationBindingResult {

  const runtimeLedgerBinding =
    context.runtimeLedgerBinding;

  const fact =
    context.fact;

  return {

    bindingStatus:
      "PROVIDER_CRYPTOGRAPHIC_OPERATION_NOT_BOUND",

    bindingDecision:
      input.bindingDecision,

    cryptographicOperationBindingAttempted:
      true,

    cryptographicOperationBound:
      false,

    cryptographicOperationBindingDenied:
      false,

    bindingFailureReason,

    cryptographicOperationId:
      fact.cryptographicOperationId,

    cryptographicContextId:
      fact.cryptographicContextId,

    cryptographicOperationKind:
      fact.cryptographicOperationKind,

    providerContract:
      fact.providerContract,

    providerImplementation:
      fact.providerImplementation,

    providerOperation:
      fact.providerOperation,

    providerResourceId:
      fact.providerResourceId,

    providerKeyReference:
      fact.providerKeyReference,

    tenantId:
      fact.tenantId,

    companyId:
      runtimeLedgerBinding.companyId,

    inputArtifact:
      copyArtifactIdentity(
        fact.inputArtifact
      ),

    outputArtifact:
      copyArtifactIdentity(
        fact.outputArtifact
      ),

    observedAt:
      fact.observedAt,

    providerOperationReference:
      fact.providerOperationReference,

    persistenceId:
      runtimeLedgerBinding.persistenceId,

    ledgerEntryId:
      runtimeLedgerBinding.ledgerEntryId,

    ledgerSequence:
      runtimeLedgerBinding.ledgerSequence,

    persistedAt:
      runtimeLedgerBinding.persistedAt,

    p9uChainId:
      runtimeLedgerBinding.chainRecord?.chain_id,

    p9uChainRecordId:
      runtimeLedgerBinding.chainRecord?.record_id,

    p9uChainRecordHash:
      runtimeLedgerBinding.chainRecord?.current_hash,

    p9uChainSequence:
      runtimeLedgerBinding.chainRecord?.sequence_number,

    p9uChainPayloadHash:
      runtimeLedgerBinding.chainRecord?.payload_hash,

    canonicalBinding,

    runtimeLedgerBindingSummary:
      copySummary(
        runtimeLedgerBinding.summary
      ),

    cryptographicOperationFactSummary:
      copySummary(
        fact.summary
      ),

    summary: [
      ...copySummary(
        runtimeLedgerBinding.summary
      ),
      ...copySummary(
        fact.summary
      ),
      "provider_cryptographic_operation_not_bound",
      summaryToken,
    ],

  };

}


// ============================================================
// BOUND RESULT
// ============================================================

function buildBoundResult(
  input:
    ProviderCryptographicOperationBindingInput,
  context:
    ProviderCryptographicOperationResultContext,
  canonicalBinding:
    ProviderCryptographicOperationCanonicalBinding,
  cryptographicOperationBindingDigest:
    string
): ProviderCryptographicOperationBindingResult {

  const runtimeLedgerBinding =
    context.runtimeLedgerBinding;

  const fact =
    context.fact;

  return {

    bindingStatus:
      "PROVIDER_CRYPTOGRAPHIC_OPERATION_BOUND",

    bindingDecision:
      input.bindingDecision,

    cryptographicOperationBindingAttempted:
      true,

    cryptographicOperationBound:
      true,

    cryptographicOperationBindingDenied:
      false,

    cryptographicOperationId:
      fact.cryptographicOperationId,

    cryptographicContextId:
      fact.cryptographicContextId,

    cryptographicOperationKind:
      fact.cryptographicOperationKind,

    providerContract:
      fact.providerContract,

    providerImplementation:
      fact.providerImplementation,

    providerOperation:
      fact.providerOperation,

    providerResourceId:
      fact.providerResourceId,

    providerKeyReference:
      fact.providerKeyReference,

    tenantId:
      fact.tenantId,

    companyId:
      runtimeLedgerBinding.companyId,

    inputArtifact:
      copyArtifactIdentity(
        fact.inputArtifact
      ),

    outputArtifact:
      copyArtifactIdentity(
        fact.outputArtifact
      ),

    observedAt:
      fact.observedAt,

    providerOperationReference:
      fact.providerOperationReference,

    persistenceId:
      runtimeLedgerBinding.persistenceId,

    ledgerEntryId:
      runtimeLedgerBinding.ledgerEntryId,

    ledgerSequence:
      runtimeLedgerBinding.ledgerSequence,

    persistedAt:
      runtimeLedgerBinding.persistedAt,

    p9uChainId:
      runtimeLedgerBinding.chainRecord?.chain_id,

    p9uChainRecordId:
      runtimeLedgerBinding.chainRecord?.record_id,

    p9uChainRecordHash:
      runtimeLedgerBinding.chainRecord?.current_hash,

    p9uChainSequence:
      runtimeLedgerBinding.chainRecord?.sequence_number,

    p9uChainPayloadHash:
      runtimeLedgerBinding.chainRecord?.payload_hash,

    canonicalBinding,

    cryptographicOperationBindingDigest,

    cryptographicOperationBindingDigestAlgorithm:
      "SHA-256",

    runtimeLedgerBindingSummary:
      copySummary(
        runtimeLedgerBinding.summary
      ),

    cryptographicOperationFactSummary:
      copySummary(
        fact.summary
      ),

    summary: [
      ...copySummary(
        runtimeLedgerBinding.summary
      ),
      ...copySummary(
        fact.summary
      ),
      "provider_cryptographic_operation_bound",
      "cryptographic_operation_runtime_fact_bound",
      "provider_key_reference_bound",
      "cryptographic_artifact_lineage_bound",
      "p9u_chain_identity_bound",
      "cryptographic_operation_binding_digest_created",
    ],

  };

}


// ============================================================
// PROVIDER CRYPTOGRAPHIC OPERATION BINDING
// ============================================================

export function bindProviderCryptographicOperation(
  input:
    ProviderCryptographicOperationBindingInput
): ProviderCryptographicOperationBindingResult {

  const runtimeLedgerBinding =
    input.runtimeLedgerBinding;

  const fact =
    input.cryptographicOperationFact;

  const context:
    ProviderCryptographicOperationResultContext = {

      runtimeLedgerBinding,

      fact,

    };

  // ----------------------------------------------------------
  // 1. EXPLICIT BINDING DECISION
  // ----------------------------------------------------------

  if (
    input.bindingDecision ===
    "REJECT_PROVIDER_CRYPTOGRAPHIC_OPERATION_BINDING"
  ) {

    return buildDeniedResult(
      input,
      context,
      "CRYPTOGRAPHIC_OPERATION_BINDING_NOT_ALLOWED",
      "cryptographic_operation_binding_not_allowed"
    );

  }

  // ----------------------------------------------------------
  // 2. P9U CRYPTOGRAPHIC LEDGER BINDING REQUIRED
  // ----------------------------------------------------------

  if (
    !p9uRuntimeLedgerIsCryptographicallyBound(
      runtimeLedgerBinding
    )
  ) {

    return buildDeniedResult(
      input,
      context,
      "P9U_RUNTIME_LEDGER_NOT_CRYPTOGRAPHICALLY_BOUND",
      "p9u_runtime_ledger_not_cryptographically_bound"
    );

  }

  // ----------------------------------------------------------
  // 3. P9U IMMUTABLE-CHAIN VERIFICATION REQUIRED
  // ----------------------------------------------------------

  if (
    !p9uImmutableChainIsVerified(
      runtimeLedgerBinding
    )
  ) {

    return buildDeniedResult(
      input,
      context,
      "P9U_IMMUTABLE_CHAIN_NOT_VERIFIED",
      "p9u_immutable_chain_not_verified"
    );

  }

  // ----------------------------------------------------------
  // 4. P9U DURABLE AND CHAIN IDENTITY REQUIRED
  // ----------------------------------------------------------

  if (
    !p9uDurableRuntimeIdentityExists(
      runtimeLedgerBinding
    ) ||
    !p9uChainIdentityExists(
      runtimeLedgerBinding
    )
  ) {

    return buildDeniedResult(
      input,
      context,
      "P9U_DURABLE_RUNTIME_IDENTITY_MISSING",
      "p9u_durable_runtime_identity_missing"
    );

  }

  // ----------------------------------------------------------
  // 5. CRYPTOGRAPHIC OPERATION OBSERVATION REQUIRED
  // ----------------------------------------------------------

  if (
    fact.cryptographicOperationObserved !==
    true
  ) {

    return buildDeniedResult(
      input,
      context,
      "CRYPTOGRAPHIC_OPERATION_NOT_OBSERVED",
      "cryptographic_operation_not_observed"
    );

  }

  // ----------------------------------------------------------
  // 6. CRYPTOGRAPHIC OPERATION IDENTITY REQUIRED
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(
      fact.cryptographicOperationId
    )
  ) {

    return buildDeniedResult(
      input,
      context,
      "CRYPTOGRAPHIC_OPERATION_IDENTITY_MISSING",
      "cryptographic_operation_identity_missing"
    );

  }

  // ----------------------------------------------------------
  // 7. CRYPTOGRAPHIC CONTEXT IDENTITY REQUIRED
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(
      fact.cryptographicContextId
    )
  ) {

    return buildDeniedResult(
      input,
      context,
      "CRYPTOGRAPHIC_CONTEXT_IDENTITY_MISSING",
      "cryptographic_context_identity_missing"
    );

  }

  // ----------------------------------------------------------
  // 8. PROVIDER KEY REFERENCE REQUIRED
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(
      fact.providerKeyReference
    )
  ) {

    return buildDeniedResult(
      input,
      context,
      "PROVIDER_KEY_REFERENCE_MISSING",
      "provider_key_reference_missing"
    );

  }

  // ----------------------------------------------------------
  // 9. CRYPTOGRAPHIC ARTIFACT LINEAGE REQUIRED
  // ----------------------------------------------------------

  if (
    !cryptographicArtifactLineageExists(
      fact
    )
  ) {

    return buildDeniedResult(
      input,
      context,
      "CRYPTOGRAPHIC_ARTIFACT_LINEAGE_MISSING",
      "cryptographic_artifact_lineage_missing"
    );

  }

  // ----------------------------------------------------------
  // 10. PROVIDER CONTEXT COHERENCE
  // ----------------------------------------------------------

  if (
    !providerContextIsCoherent(
      runtimeLedgerBinding,
      fact
    )
  ) {

    return buildNotBoundResult(
      input,
      context,
      "PROVIDER_CONTEXT_MISMATCH",
      "provider_context_mismatch"
    );

  }

  // ----------------------------------------------------------
  // 11. RUNTIME OPERATION COHERENCE
  // ----------------------------------------------------------

  if (
    !runtimeOperationIsCoherent(
      runtimeLedgerBinding,
      fact
    ) ||
    !cryptographicOperationKindIsCoherent(
      runtimeLedgerBinding,
      fact
    )
  ) {

    return buildNotBoundResult(
      input,
      context,
      "RUNTIME_OPERATION_MISMATCH",
      "runtime_operation_mismatch"
    );

  }

  // ----------------------------------------------------------
  // 12. PROVIDER KEY REFERENCE COHERENCE
  // ----------------------------------------------------------

  if (
    !providerKeyReferenceIsCoherent(
      runtimeLedgerBinding,
      fact
    )
  ) {

    return buildNotBoundResult(
      input,
      context,
      "PROVIDER_KEY_REFERENCE_MISMATCH",
      "provider_key_reference_mismatch"
    );

  }

  // ----------------------------------------------------------
  // 13. SOVEREIGN TENANT COHERENCE
  // ----------------------------------------------------------

  if (
    !sovereignTenantContextIsCoherent(
      runtimeLedgerBinding,
      fact
    )
  ) {

    return buildNotBoundResult(
      input,
      context,
      "SOVEREIGN_TENANT_CONTEXT_MISMATCH",
      "sovereign_tenant_context_mismatch"
    );

  }

  // ----------------------------------------------------------
  // 14. CRYPTOGRAPHIC CONTEXT COHERENCE
  // ----------------------------------------------------------

  if (
    !cryptographicContextIsCoherent(
      runtimeLedgerBinding,
      fact
    )
  ) {

    return buildNotBoundResult(
      input,
      context,
      "CRYPTOGRAPHIC_CONTEXT_MISMATCH",
      "cryptographic_context_mismatch"
    );

  }

  // ----------------------------------------------------------
  // 15. CRYPTOGRAPHIC ARTIFACT LINEAGE COHERENCE
  // ----------------------------------------------------------

  if (
    !cryptographicArtifactLineageIsCoherent(
      fact
    )
  ) {

    return buildNotBoundResult(
      input,
      context,
      "CRYPTOGRAPHIC_ARTIFACT_LINEAGE_INCOHERENT",
      "cryptographic_artifact_lineage_incoherent"
    );

  }

  // ----------------------------------------------------------
  // 16. CANONICAL OPERATION BINDING CREATION
  // ----------------------------------------------------------

  const canonicalBinding =
    createCanonicalOperationBinding(
      runtimeLedgerBinding,
      fact
    );

  if (!canonicalBinding) {

    return buildNotBoundResult(
      input,
      context,
      "CANONICAL_OPERATION_BINDING_NOT_CREATED",
      "canonical_operation_binding_not_created"
    );

  }

  // ----------------------------------------------------------
  // 17. CANONICAL OPERATION BINDING COHERENCE
  // ----------------------------------------------------------

  if (
    !canonicalOperationBindingIsCoherent(
      canonicalBinding,
      runtimeLedgerBinding,
      fact
    )
  ) {

    return buildNotBoundResult(
      input,
      context,
      "CANONICAL_OPERATION_BINDING_INCOHERENT",
      "canonical_operation_binding_incoherent",
      canonicalBinding
    );

  }

  // ----------------------------------------------------------
  // 18. DETERMINISTIC BINDING DIGEST
  // ----------------------------------------------------------

  const cryptographicOperationBindingDigest =
    createBindingDigest(
      canonicalBinding
    );

  if (
    !isNonEmptyString(
      cryptographicOperationBindingDigest
    )
  ) {

    return buildNotBoundResult(
      input,
      context,
      "CRYPTOGRAPHIC_OPERATION_BINDING_DIGEST_NOT_CREATED",
      "cryptographic_operation_binding_digest_not_created",
      canonicalBinding
    );

  }

  // ----------------------------------------------------------
  // 19. CRYPTOGRAPHIC OPERATION BOUND
  // ----------------------------------------------------------

  return buildBoundResult(
    input,
    context,
    canonicalBinding,
    cryptographicOperationBindingDigest
  );

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// P9V receives:
//
// - one completed P9U cryptographic ledger binding
// - one observed cryptographic operation fact
//
// P9V preserves:
//
// - P9R persistence identity
// - P9R ledger identity
// - P9U chain identity
// - P9U chain-record identity
// - P9U chain-record hash
// - P9U chain sequence
// - P9U canonical payload hash
// - provider contract
// - provider implementation
// - governed provider operation
// - provider resource identity
// - sovereign tenant identity
// - sovereign company identity
//
// P9V binds:
//
// - cryptographic operation identity
// - cryptographic context identity
// - cryptographic operation kind
// - provider key reference
// - input cryptographic artifact identity
// - output cryptographic artifact identity
// - provider operation reference
// - P9R durable runtime fact
// - P9U immutable-chain record
//
// P9V creates:
//
// - one canonical operation binding
// - one deterministic SHA-256 binding digest
//
// P9V does not modify:
//
// - the P9U result
// - the P9U chain payload
// - the P9U chain record
// - the observed cryptographic operation fact
//
// ============================================================


// ============================================================
// BINDING PRINCIPLES
// ============================================================
//
// Provider Runtime Fact
// ≠
// Cryptographic Operation Fact
//
// Cryptographic Operation Observed
// ≠
// Cryptographic Operation Bound
//
// Provider Operation Completed
// ≠
// Cryptographic Artifact Proven
//
// Cryptographic Artifact Bound
// ≠
// Cryptographic Artifact Authenticity Proven
//
// Provider Key Reference Bound
// ≠
// Provider Key Ownership Proven
//
// Binding Digest
// ≠
// Provider Signature
//
// Binding Digest
// ≠
// Provider Authenticity
//
// P9U Chain Integrity
// ≠
// Cryptographic Operation Authenticity
//
// P9V Operation Binding
// ≠
// Full Ledger History Verification
//
// ============================================================


// ============================================================
// PROVIDER-INDEPENDENT BINDING
// ============================================================
//
// P9V must remain independent from:
//
// - AWS KMS response shapes
// - Vault response shapes
// - HSM vendor response shapes
// - provider-specific SDK exceptions
// - provider-specific credential formats
// - provider-specific ciphertext structures
//
// Provider adapters are responsible for exposing one
// sanitized ProviderCryptographicOperationFact.
//
// P9V binds the canonical fact.
//
// P9V does not reinterpret raw provider responses.
//
// ============================================================


// ============================================================
// CRYPTOGRAPHIC MATERIAL BOUNDARY
// ============================================================
//
// P9V must never require or expose:
//
// - plaintext payloads
// - decrypted payloads
// - raw data keys
// - unwrapped key material
// - private keys
// - provider credentials
// - secret values
// - raw provider authorization material
//
// P9V binds identities and digests.
//
// P9V does not bind secret contents.
//
// ============================================================


// ============================================================
// EXPLICIT BOUNDARIES
// ============================================================
//
// This file MUST NOT:
//
// - execute provider cryptographic operations
// - authorize provider cryptographic operations
// - call provider SDKs
// - call provider APIs
// - invoke provider execution
// - verify provider execution
// - classify provider runtime failure
// - assign runtime failure severity
// - decide runtime response
// - replace runtime response
// - execute runtime response
// - invoke governed response executors
// - certify execution outcome
// - admit provider-runtime evidence
// - persist provider-runtime evidence
// - write provider-runtime ledger facts
// - manufacture P9R durable identifiers
// - append P9U immutable-chain records
// - rewrite P9U chain records
// - verify full ledger history
// - execute provider-runtime audit
// - write provider-runtime audit records
// - re-sanitize provider errors
// - alter sanitized failure surfaces
// - encrypt payloads
// - decrypt payloads
// - wrap keys
// - unwrap keys
// - rewrap keys
// - rotate keys
// - generate data keys
// - sign provider operation facts
// - verify provider signatures
// - claim provider authenticity
// - claim signer identity
// - claim cryptographic artifact authenticity
// - expose raw cryptographic material
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ receive completed P9U cryptographic
//   ledger-binding result
//
// ✓ require verified P9U immutable chain
//
// ✓ require P9R durable runtime identity
//
// ✓ require observed cryptographic operation
//
// ✓ require cryptographic operation identity
//
// ✓ require cryptographic context identity
//
// ✓ require provider key reference
//
// ✓ require cryptographic artifact lineage
//
// ✓ validate provider context coherence
//
// ✓ validate runtime operation coherence
//
// ✓ validate provider key-reference coherence
//
// ✓ validate sovereign tenant coherence
//
// ✓ validate cryptographic context coherence
//
// ✓ validate artifact-lineage coherence
//
// ✓ create canonical cryptographic operation
//   runtime-fact binding
//
// ✓ bind cryptographic operation identity
//
// ✓ bind cryptographic context identity
//
// ✓ bind provider key reference
//
// ✓ bind cryptographic artifact identities
//
// ✓ bind P9R durable identity
//
// ✓ bind P9U immutable-chain identity
//
// ✓ create deterministic SHA-256 binding digest
//
// ✓ preserve P9U result immutability
//
// ✓ preserve cryptographic operation fact
//   immutability
//
// ✗ execute cryptographic operation
//
// ✗ call provider APIs or SDKs
//
// ✗ verify provider signature
//
// ✗ claim provider authenticity
//
// ✗ claim artifact authenticity
//
// ✗ verify full ledger history
//
// ✗ execute audit
//
// ============================================================