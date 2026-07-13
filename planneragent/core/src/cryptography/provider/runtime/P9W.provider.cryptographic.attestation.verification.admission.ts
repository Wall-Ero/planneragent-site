// ============================================================
// PlannerAgent - Provider Cryptographic Attestation Verification
// and Admission
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime/
// P9W.provider.cryptographic.attestation.verification.admission.ts
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
// P9W.1 - Provider Cryptographic Attestation Verification
// and Admission
//
// PURPOSE
// ------------------------------------------------------------
// Verify and admit one provider-independent cryptographic
// attestation material against one completed P9V provider
// cryptographic operation binding.
//
// P9W receives:
//
// - ProviderCryptographicOperationBindingResult from P9V
// - one provider-independent attestation material
// - explicit attestation verification/admission decision
//
// P9W:
//
// - requires completed P9V operation binding
// - requires one P9V binding digest
// - requires explicit verification/admission decision
// - requires provider-independent attestation material
// - verifies target binding-digest coherence
// - verifies operation/context/key coherence
// - verifies artifact-lineage coherence
// - verifies tenant/company/provider/runtime coherence
// - produces one canonical attestation admission material
// - preserves P9V/P9U/P9R lineage
//
// P9W does not:
//
// - execute cryptographic operations
// - call provider APIs or SDKs
// - generate signatures
// - verify provider signatures
// - claim provider authenticity
// - claim signer identity
// - claim cryptographic artifact authenticity
// - modify P9V, P9U, or P9R source results
// - write ledger or audit state
// - verify full ledger history
// - re-sanitize provider errors
// - expose raw key material, secrets, plaintext, or credentials
// - create or reinterpret authority
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// P9V binds one observed cryptographic operation fact to one
// chain-bound provider-runtime fact.
//
// P9W verifies that one provider-independent attestation
// material targets that P9V binding coherently.
//
// Attestation Material Present
// !=
// Attestation Material Coherent
//
// Attestation Material Coherent
// !=
// Attestation Admitted
//
// Attestation Admitted
// !=
// Provider Authenticity Proven
//
// ============================================================

import type {
  ProviderCryptographicArtifactIdentity,
  ProviderCryptographicOperationBindingResult,
  ProviderCryptographicOperationKind,
} from "./P9V.provider.cryptographic.operation.binding";


// ============================================================
// ATTESTATION ADMISSION STATUS
// ============================================================

export type ProviderCryptographicAttestationAdmissionStatus =
  | "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMITTED"
  | "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_NOT_ADMITTED"
  | "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMISSION_DENIED";


// ============================================================
// ATTESTATION ADMISSION DECISION
// ============================================================

export type ProviderCryptographicAttestationAdmissionDecision =
  | "VERIFY_AND_ADMIT_PROVIDER_CRYPTOGRAPHIC_ATTESTATION"
  | "REJECT_PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMISSION";


// ============================================================
// ATTESTATION ADMISSION DENIAL REASON
// ============================================================

export type ProviderCryptographicAttestationAdmissionDenialReason =
  | "CRYPTOGRAPHIC_ATTESTATION_ADMISSION_NOT_ALLOWED"
  | "P9V_OPERATION_BINDING_DENIED";


// ============================================================
// ATTESTATION ADMISSION FAILURE REASON
// ============================================================

export type ProviderCryptographicAttestationAdmissionFailureReason =
  | "P9V_OPERATION_BINDING_NOT_COMPLETED"
  | "P9V_OPERATION_BINDING_DIGEST_MISSING"
  | "ATTESTATION_MATERIAL_MISSING"
  | "ATTESTATION_TARGET_BINDING_DIGEST_INCOHERENT"
  | "ATTESTATION_OPERATION_CONTEXT_INCOHERENT"
  | "ATTESTATION_PROVIDER_KEY_REFERENCE_INCOHERENT"
  | "ATTESTATION_ARTIFACT_LINEAGE_INCOHERENT"
  | "ATTESTATION_SOVEREIGN_CONTEXT_INCOHERENT"
  | "ATTESTATION_PROVIDER_RUNTIME_CONTEXT_INCOHERENT"
  | "ATTESTATION_P9U_LINEAGE_INCOHERENT"
  | "ATTESTATION_SUMMARY_INSUFFICIENT"
  | "CANONICAL_ATTESTATION_ADMISSION_MATERIAL_NOT_CREATED";


// ============================================================
// ATTESTATION MATERIAL TYPE
// ============================================================

export type ProviderCryptographicAttestationMaterialType =
  "PROVIDER_INDEPENDENT_CRYPTOGRAPHIC_ATTESTATION";


// ============================================================
// ATTESTATION MATERIAL VERSION
// ============================================================

export type ProviderCryptographicAttestationMaterialVersion =
  "P9W.1";


// ============================================================
// PROVIDER-INDEPENDENT ATTESTATION MATERIAL
// ============================================================
//
// This material is provider-independent and contract-level.
//
// It is not a provider signature model, a trust-anchor model,
// a signer-authority model, or a provider capability model.
//
// P9W verifies that the material targets the already completed
// P9V binding coherently. It does not prove provider identity.
//
// ============================================================

export interface ProviderCryptographicAttestationMaterial {

  attestationMaterialType:
    ProviderCryptographicAttestationMaterialType;

  attestationMaterialVersion:
    ProviderCryptographicAttestationMaterialVersion;

  attestationId:
    string;

  attestationObserved:
    boolean;

  attestationDigest:
    string;

  attestationDigestAlgorithm:
    string;

  targetBindingDigest:
    string;

  targetBindingDigestAlgorithm:
    "SHA-256";

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

  p9rPersistenceId:
    string;

  p9rLedgerEntryId:
    string;

  p9rLedgerSequence:
    number;

  p9rPersistedAt:
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

  attestedAt:
    string;

  summary:
    string[];

}


// ============================================================
// CANONICAL ATTESTATION ADMISSION MATERIAL
// ============================================================

export interface ProviderCryptographicAttestationAdmissionMaterial {

  admissionMaterialType:
    "PROVIDER_CRYPTOGRAPHIC_ATTESTATION";

  admissionMaterialVersion:
    "P9W.1";

  attestationId:
    string;

  attestationDigest:
    string;

  attestationDigestAlgorithm:
    string;

  targetBindingDigest:
    string;

  targetBindingDigestAlgorithm:
    "SHA-256";

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

  p9rPersistenceId:
    string;

  p9rLedgerEntryId:
    string;

  p9rLedgerSequence:
    number;

  p9rPersistedAt:
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

  attestedAt:
    string;

  p9vBindingSummary:
    string[];

  attestationSummary:
    string[];

}


// ============================================================
// INPUT
// ============================================================

export interface ProviderCryptographicAttestationAdmissionInput {

  operationBinding:
    ProviderCryptographicOperationBindingResult;

  attestationMaterial?:
    ProviderCryptographicAttestationMaterial;

  admissionDecision:
    ProviderCryptographicAttestationAdmissionDecision;

}


// ============================================================
// RESULT
// ============================================================

export interface ProviderCryptographicAttestationAdmissionResult {

  admissionStatus:
    ProviderCryptographicAttestationAdmissionStatus;

  admissionDecision:
    ProviderCryptographicAttestationAdmissionDecision;

  cryptographicAttestationVerificationAttempted:
    boolean;

  cryptographicAttestationPresent:
    boolean;

  cryptographicAttestationCoherent:
    boolean;

  cryptographicAttestationVerified:
    boolean;

  cryptographicAttestationAdmitted:
    boolean;

  cryptographicAttestationAdmissionDenied:
    boolean;

  admissionDenialReason?:
    ProviderCryptographicAttestationAdmissionDenialReason;

  admissionFailureReason?:
    ProviderCryptographicAttestationAdmissionFailureReason;

  attestationId?:
    string;

  attestationDigest?:
    string;

  attestationDigestAlgorithm?:
    string;

  targetBindingDigest?:
    string;

  targetBindingDigestAlgorithm?:
    "SHA-256";

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

  p9rPersistenceId?:
    string;

  p9rLedgerEntryId?:
    string;

  p9rLedgerSequence?:
    number;

  p9rPersistedAt?:
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

  attestedAt?:
    string;

  attestationAdmissionMaterial?:
    ProviderCryptographicAttestationAdmissionMaterial;

  p9vBindingSummary:
    string[];

  attestationSummary:
    string[];

  summary:
    string[];

}


// ============================================================
// HELPERS
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


function artifactsMatch(
  left:
    ProviderCryptographicArtifactIdentity | undefined,
  right:
    ProviderCryptographicArtifactIdentity | undefined
): boolean {

  if (!left && !right) {

    return true;

  }

  if (!left || !right) {

    return false;

  }

  return (
    left.artifactId === right.artifactId &&
    left.artifactKind === right.artifactKind &&
    left.artifactDigest === right.artifactDigest &&
    left.artifactDigestAlgorithm === right.artifactDigestAlgorithm
  );

}


function p9vBindingIsCompleted(
  binding:
    ProviderCryptographicOperationBindingResult
): boolean {

  return (
    binding.bindingStatus ===
      "PROVIDER_CRYPTOGRAPHIC_OPERATION_BOUND" &&
    binding.cryptographicOperationBindingAttempted === true &&
    binding.cryptographicOperationBound === true &&
    binding.cryptographicOperationBindingDenied === false &&
    binding.canonicalBinding !== undefined
  );

}


function p9vBindingDigestExists(
  binding:
    ProviderCryptographicOperationBindingResult
): boolean {

  return (
    isNonEmptyString(
      binding.cryptographicOperationBindingDigest
    ) &&
    binding.cryptographicOperationBindingDigestAlgorithm ===
      "SHA-256"
  );

}


function attestationMaterialShapeIsValid(
  material:
    ProviderCryptographicAttestationMaterial | undefined
): material is ProviderCryptographicAttestationMaterial {

  if (!material) {

    return false;

  }

  return (
    material.attestationMaterialType ===
      "PROVIDER_INDEPENDENT_CRYPTOGRAPHIC_ATTESTATION" &&
    material.attestationMaterialVersion ===
      "P9W.1" &&
    material.attestationObserved === true &&
    isNonEmptyString(
      material.attestationId
    ) &&
    isNonEmptyString(
      material.attestationDigest
    ) &&
    isNonEmptyString(
      material.attestationDigestAlgorithm
    ) &&
    isNonEmptyString(
      material.targetBindingDigest
    ) &&
    material.targetBindingDigestAlgorithm ===
      "SHA-256" &&
    isNonEmptyString(
      material.cryptographicOperationId
    ) &&
    isNonEmptyString(
      material.cryptographicContextId
    ) &&
    isNonEmptyString(
      material.providerKeyReference
    ) &&
    isNonEmptyString(
      material.tenantId
    ) &&
    isNonEmptyString(
      material.companyId
    ) &&
    isNonEmptyString(
      material.p9rPersistenceId
    ) &&
    isNonEmptyString(
      material.p9rLedgerEntryId
    ) &&
    isPositiveInteger(
      material.p9rLedgerSequence
    ) &&
    isNonEmptyString(
      material.p9rPersistedAt
    ) &&
    isNonEmptyString(
      material.p9uChainId
    ) &&
    isNonEmptyString(
      material.p9uChainRecordId
    ) &&
    isNonEmptyString(
      material.p9uChainRecordHash
    ) &&
    isPositiveInteger(
      material.p9uChainSequence
    ) &&
    isNonEmptyString(
      material.p9uChainPayloadHash
    ) &&
    isNonEmptyString(
      material.attestedAt
    )
  );

}


function targetBindingDigestIsCoherent(
  binding:
    ProviderCryptographicOperationBindingResult,
  material:
    ProviderCryptographicAttestationMaterial
): boolean {

  return (
    material.targetBindingDigest ===
      binding.cryptographicOperationBindingDigest &&
    material.targetBindingDigestAlgorithm ===
      binding.cryptographicOperationBindingDigestAlgorithm
  );

}


function operationContextIsCoherent(
  binding:
    ProviderCryptographicOperationBindingResult,
  material:
    ProviderCryptographicAttestationMaterial
): boolean {

  return (
    material.cryptographicOperationId ===
      binding.cryptographicOperationId &&
    material.cryptographicContextId ===
      binding.cryptographicContextId &&
    material.cryptographicOperationKind ===
      binding.cryptographicOperationKind
  );

}


function providerRuntimeContextIsCoherent(
  binding:
    ProviderCryptographicOperationBindingResult,
  material:
    ProviderCryptographicAttestationMaterial
): boolean {

  return (
    material.providerContract ===
      binding.providerContract &&
    material.providerImplementation ===
      binding.providerImplementation &&
    material.providerOperation ===
      binding.providerOperation &&
    material.providerResourceId ===
      binding.providerResourceId
  );

}


function providerKeyReferenceIsCoherent(
  binding:
    ProviderCryptographicOperationBindingResult,
  material:
    ProviderCryptographicAttestationMaterial
): boolean {

  return (
    material.providerKeyReference ===
      binding.providerKeyReference
  );

}


function artifactLineageIsCoherent(
  binding:
    ProviderCryptographicOperationBindingResult,
  material:
    ProviderCryptographicAttestationMaterial
): boolean {

  return (
    artifactsMatch(
      binding.inputArtifact,
      material.inputArtifact
    ) &&
    artifactsMatch(
      binding.outputArtifact,
      material.outputArtifact
    ) &&
    (
      material.inputArtifact !== undefined ||
      material.outputArtifact !== undefined
    )
  );

}


function sovereignContextIsCoherent(
  binding:
    ProviderCryptographicOperationBindingResult,
  material:
    ProviderCryptographicAttestationMaterial
): boolean {

  return (
    material.tenantId ===
      binding.tenantId &&
    material.companyId ===
      binding.companyId
  );

}


function p9uLineageIsCoherent(
  binding:
    ProviderCryptographicOperationBindingResult,
  material:
    ProviderCryptographicAttestationMaterial
): boolean {

  return (
    material.p9rPersistenceId ===
      binding.persistenceId &&
    material.p9rLedgerEntryId ===
      binding.ledgerEntryId &&
    material.p9rLedgerSequence ===
      binding.ledgerSequence &&
    material.p9rPersistedAt ===
      binding.persistedAt &&
    material.p9uChainId ===
      binding.p9uChainId &&
    material.p9uChainRecordId ===
      binding.p9uChainRecordId &&
    material.p9uChainRecordHash ===
      binding.p9uChainRecordHash &&
    material.p9uChainSequence ===
      binding.p9uChainSequence &&
    material.p9uChainPayloadHash ===
      binding.p9uChainPayloadHash
  );

}


function attestationSummaryIsSufficient(
  material:
    ProviderCryptographicAttestationMaterial
): boolean {

  return (
    copySummary(
      material.summary
    ).length > 0
  );

}


function buildAdmissionMaterial(
  binding:
    ProviderCryptographicOperationBindingResult,
  material:
    ProviderCryptographicAttestationMaterial
): ProviderCryptographicAttestationAdmissionMaterial {

  return {

    admissionMaterialType:
      "PROVIDER_CRYPTOGRAPHIC_ATTESTATION",

    admissionMaterialVersion:
      "P9W.1",

    attestationId:
      material.attestationId,

    attestationDigest:
      material.attestationDigest,

    attestationDigestAlgorithm:
      material.attestationDigestAlgorithm,

    targetBindingDigest:
      material.targetBindingDigest,

    targetBindingDigestAlgorithm:
      material.targetBindingDigestAlgorithm,

    cryptographicOperationId:
      material.cryptographicOperationId,

    cryptographicContextId:
      material.cryptographicContextId,

    cryptographicOperationKind:
      material.cryptographicOperationKind,

    providerContract:
      material.providerContract,

    providerImplementation:
      material.providerImplementation,

    providerOperation:
      material.providerOperation,

    providerResourceId:
      material.providerResourceId,

    providerKeyReference:
      material.providerKeyReference,

    tenantId:
      material.tenantId,

    companyId:
      material.companyId,

    inputArtifact:
      copyArtifactIdentity(
        material.inputArtifact
      ),

    outputArtifact:
      copyArtifactIdentity(
        material.outputArtifact
      ),

    p9rPersistenceId:
      material.p9rPersistenceId,

    p9rLedgerEntryId:
      material.p9rLedgerEntryId,

    p9rLedgerSequence:
      material.p9rLedgerSequence,

    p9rPersistedAt:
      material.p9rPersistedAt,

    p9uChainId:
      material.p9uChainId,

    p9uChainRecordId:
      material.p9uChainRecordId,

    p9uChainRecordHash:
      material.p9uChainRecordHash,

    p9uChainSequence:
      material.p9uChainSequence,

    p9uChainPayloadHash:
      material.p9uChainPayloadHash,

    attestedAt:
      material.attestedAt,

    p9vBindingSummary:
      copySummary(
        binding.summary
      ),

    attestationSummary:
      copySummary(
        material.summary
      ),

  };

}


function resultContext(
  binding:
    ProviderCryptographicOperationBindingResult,
  material?:
    ProviderCryptographicAttestationMaterial
) {

  return {

    attestationId:
      material?.attestationId,

    attestationDigest:
      material?.attestationDigest,

    attestationDigestAlgorithm:
      material?.attestationDigestAlgorithm,

    targetBindingDigest:
      material?.targetBindingDigest,

    targetBindingDigestAlgorithm:
      material?.targetBindingDigestAlgorithm,

    cryptographicOperationId:
      binding.cryptographicOperationId,

    cryptographicContextId:
      binding.cryptographicContextId,

    cryptographicOperationKind:
      binding.cryptographicOperationKind,

    providerContract:
      binding.providerContract,

    providerImplementation:
      binding.providerImplementation,

    providerOperation:
      binding.providerOperation,

    providerResourceId:
      binding.providerResourceId,

    providerKeyReference:
      binding.providerKeyReference,

    tenantId:
      binding.tenantId,

    companyId:
      binding.companyId,

    inputArtifact:
      copyArtifactIdentity(
        binding.inputArtifact
      ),

    outputArtifact:
      copyArtifactIdentity(
        binding.outputArtifact
      ),

    p9rPersistenceId:
      binding.persistenceId,

    p9rLedgerEntryId:
      binding.ledgerEntryId,

    p9rLedgerSequence:
      binding.ledgerSequence,

    p9rPersistedAt:
      binding.persistedAt,

    p9uChainId:
      binding.p9uChainId,

    p9uChainRecordId:
      binding.p9uChainRecordId,

    p9uChainRecordHash:
      binding.p9uChainRecordHash,

    p9uChainSequence:
      binding.p9uChainSequence,

    p9uChainPayloadHash:
      binding.p9uChainPayloadHash,

    attestedAt:
      material?.attestedAt,

    p9vBindingSummary:
      copySummary(
        binding.summary
      ),

    attestationSummary:
      copySummary(
        material?.summary
      ),

  };

}


function buildDeniedResult(
  input:
    ProviderCryptographicAttestationAdmissionInput,
  admissionDenialReason:
    ProviderCryptographicAttestationAdmissionDenialReason,
  summaryToken:
    string
): ProviderCryptographicAttestationAdmissionResult {

  return {

    admissionStatus:
      "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMISSION_DENIED",

    admissionDecision:
      input.admissionDecision,

    cryptographicAttestationVerificationAttempted:
      false,

    cryptographicAttestationPresent:
      false,

    cryptographicAttestationCoherent:
      false,

    cryptographicAttestationVerified:
      false,

    cryptographicAttestationAdmitted:
      false,

    cryptographicAttestationAdmissionDenied:
      true,

    admissionDenialReason,

    ...resultContext(
      input.operationBinding,
      input.attestationMaterial
    ),

    summary: [
      ...copySummary(
        input.operationBinding.summary
      ),
      "provider_cryptographic_attestation_admission_denied",
      summaryToken,
    ],

  };

}


function buildNotAdmittedResult(
  input:
    ProviderCryptographicAttestationAdmissionInput,
  admissionFailureReason:
    ProviderCryptographicAttestationAdmissionFailureReason,
  summaryToken:
    string,
  present:
    boolean = false,
  coherent:
    boolean = false
): ProviderCryptographicAttestationAdmissionResult {

  return {

    admissionStatus:
      "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_NOT_ADMITTED",

    admissionDecision:
      input.admissionDecision,

    cryptographicAttestationVerificationAttempted:
      true,

    cryptographicAttestationPresent:
      present,

    cryptographicAttestationCoherent:
      coherent,

    cryptographicAttestationVerified:
      false,

    cryptographicAttestationAdmitted:
      false,

    cryptographicAttestationAdmissionDenied:
      false,

    admissionFailureReason,

    ...resultContext(
      input.operationBinding,
      input.attestationMaterial
    ),

    summary: [
      ...copySummary(
        input.operationBinding.summary
      ),
      ...copySummary(
        input.attestationMaterial?.summary
      ),
      "provider_cryptographic_attestation_not_admitted",
      summaryToken,
    ],

  };

}


// ============================================================
// ATTESTATION VERIFICATION / ADMISSION
// ============================================================

export function verifyAndAdmitProviderCryptographicAttestation(
  input:
    ProviderCryptographicAttestationAdmissionInput
): ProviderCryptographicAttestationAdmissionResult {

  const binding =
    input.operationBinding;

  const material =
    input.attestationMaterial;

  // ----------------------------------------------------------
  // 1. EXPLICIT ADMISSION DECISION
  // ----------------------------------------------------------

  if (
    input.admissionDecision ===
    "REJECT_PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMISSION"
  ) {

    return buildDeniedResult(
      input,
      "CRYPTOGRAPHIC_ATTESTATION_ADMISSION_NOT_ALLOWED",
      "cryptographic_attestation_admission_not_allowed"
    );

  }

  // ----------------------------------------------------------
  // 2. P9V DENIAL PRESERVED
  // ----------------------------------------------------------

  if (
    binding.bindingStatus ===
    "PROVIDER_CRYPTOGRAPHIC_OPERATION_BINDING_DENIED"
  ) {

    return buildDeniedResult(
      input,
      "P9V_OPERATION_BINDING_DENIED",
      "p9v_operation_binding_denied"
    );

  }

  // ----------------------------------------------------------
  // 3. COMPLETED P9V BINDING REQUIRED
  // ----------------------------------------------------------

  if (
    !p9vBindingIsCompleted(
      binding
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "P9V_OPERATION_BINDING_NOT_COMPLETED",
      "p9v_operation_binding_not_completed"
    );

  }

  // ----------------------------------------------------------
  // 4. P9V BINDING DIGEST REQUIRED
  // ----------------------------------------------------------

  if (
    !p9vBindingDigestExists(
      binding
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "P9V_OPERATION_BINDING_DIGEST_MISSING",
      "p9v_operation_binding_digest_missing"
    );

  }

  // ----------------------------------------------------------
  // 5. PROVIDER-INDEPENDENT ATTESTATION MATERIAL REQUIRED
  // ----------------------------------------------------------

  if (
    !attestationMaterialShapeIsValid(
      material
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "ATTESTATION_MATERIAL_MISSING",
      "attestation_material_missing",
      false,
      false
    );

  }

  // ----------------------------------------------------------
  // 6. TARGET BINDING DIGEST COHERENCE
  // ----------------------------------------------------------

  if (
    !targetBindingDigestIsCoherent(
      binding,
      material
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "ATTESTATION_TARGET_BINDING_DIGEST_INCOHERENT",
      "attestation_target_binding_digest_incoherent",
      true,
      false
    );

  }

  // ----------------------------------------------------------
  // 7. OPERATION / CONTEXT COHERENCE
  // ----------------------------------------------------------

  if (
    !operationContextIsCoherent(
      binding,
      material
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "ATTESTATION_OPERATION_CONTEXT_INCOHERENT",
      "attestation_operation_context_incoherent",
      true,
      false
    );

  }

  // ----------------------------------------------------------
  // 8. PROVIDER KEY REFERENCE COHERENCE
  // ----------------------------------------------------------

  if (
    !providerKeyReferenceIsCoherent(
      binding,
      material
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "ATTESTATION_PROVIDER_KEY_REFERENCE_INCOHERENT",
      "attestation_provider_key_reference_incoherent",
      true,
      false
    );

  }

  // ----------------------------------------------------------
  // 9. ARTIFACT LINEAGE COHERENCE
  // ----------------------------------------------------------

  if (
    !artifactLineageIsCoherent(
      binding,
      material
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "ATTESTATION_ARTIFACT_LINEAGE_INCOHERENT",
      "attestation_artifact_lineage_incoherent",
      true,
      false
    );

  }

  // ----------------------------------------------------------
  // 10. SOVEREIGN CONTEXT COHERENCE
  // ----------------------------------------------------------

  if (
    !sovereignContextIsCoherent(
      binding,
      material
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "ATTESTATION_SOVEREIGN_CONTEXT_INCOHERENT",
      "attestation_sovereign_context_incoherent",
      true,
      false
    );

  }

  // ----------------------------------------------------------
  // 11. PROVIDER / RUNTIME CONTEXT COHERENCE
  // ----------------------------------------------------------

  if (
    !providerRuntimeContextIsCoherent(
      binding,
      material
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "ATTESTATION_PROVIDER_RUNTIME_CONTEXT_INCOHERENT",
      "attestation_provider_runtime_context_incoherent",
      true,
      false
    );

  }

  // ----------------------------------------------------------
  // 12. P9U / P9R LINEAGE COHERENCE
  // ----------------------------------------------------------

  if (
    !p9uLineageIsCoherent(
      binding,
      material
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "ATTESTATION_P9U_LINEAGE_INCOHERENT",
      "attestation_p9u_lineage_incoherent",
      true,
      false
    );

  }

  // ----------------------------------------------------------
  // 13. SUMMARY SUFFICIENCY
  // ----------------------------------------------------------

  if (
    !attestationSummaryIsSufficient(
      material
    )
  ) {

    return buildNotAdmittedResult(
      input,
      "ATTESTATION_SUMMARY_INSUFFICIENT",
      "attestation_summary_insufficient",
      true,
      true
    );

  }

  // ----------------------------------------------------------
  // 14. CANONICAL ADMISSION MATERIAL
  // ----------------------------------------------------------

  const attestationAdmissionMaterial =
    buildAdmissionMaterial(
      binding,
      material
    );

  if (!attestationAdmissionMaterial) {

    return buildNotAdmittedResult(
      input,
      "CANONICAL_ATTESTATION_ADMISSION_MATERIAL_NOT_CREATED",
      "canonical_attestation_admission_material_not_created",
      true,
      true
    );

  }

  // ----------------------------------------------------------
  // 15. ATTESTATION VERIFIED AND ADMITTED
  // ----------------------------------------------------------

  return {

    admissionStatus:
      "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMITTED",

    admissionDecision:
      input.admissionDecision,

    cryptographicAttestationVerificationAttempted:
      true,

    cryptographicAttestationPresent:
      true,

    cryptographicAttestationCoherent:
      true,

    cryptographicAttestationVerified:
      true,

    cryptographicAttestationAdmitted:
      true,

    cryptographicAttestationAdmissionDenied:
      false,

    ...resultContext(
      binding,
      material
    ),

    attestationAdmissionMaterial,

    summary: [
      ...copySummary(
        binding.summary
      ),
      ...copySummary(
        material.summary
      ),
      "provider_cryptographic_attestation_present",
      "provider_cryptographic_attestation_coherent",
      "provider_cryptographic_attestation_verified",
      "provider_cryptographic_attestation_admitted",
    ],

  };

}


// ============================================================
// CONTRACT OBSERVATION
// ============================================================
//
// P9W receives:
//
// - one completed P9V operation binding
// - one provider-independent attestation material
//
// P9W preserves:
//
// - P9V operation binding identity
// - P9V binding digest
// - P9R persistence identity
// - P9R ledger identity
// - P9U chain identity
// - P9U chain-record identity
// - P9U chain-record hash
// - P9U chain sequence
// - P9U canonical payload hash
// - provider/runtime context
// - artifact identity lineage
//
// P9W creates:
//
// - one canonical attestation admission material
//
// P9W does not modify:
//
// - the P9V result
// - the P9U chain material
// - the P9R durable identifiers
// - the attestation material
//
// ============================================================


// ============================================================
// VERIFIED RESPONSIBILITIES
// ============================================================
//
// ✓ require completed P9V binding
//
// ✓ require explicit admission decision
//
// ✓ require provider-independent attestation material
//
// ✓ verify target binding-digest coherence
//
// ✓ verify operation/context/key coherence
//
// ✓ verify artifact-lineage coherence
//
// ✓ verify tenant/company/provider/runtime coherence
//
// ✓ distinguish proof present, coherent, verified, admitted
//
// ✓ produce canonical attestation admission material
//
// ✓ preserve P9V/P9U/P9R lineage
//
// ✗ execute cryptographic operations
//
// ✗ call provider APIs or SDKs
//
// ✗ generate signatures
//
// ✗ verify provider signatures
//
// ✗ write ledger or audit state
//
// ✗ verify full ledger history
//
// ✗ create or reinterpret authority
//
// ============================================================
