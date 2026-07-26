import { createHash } from "node:crypto";
import type { TrustedSignCompositionResult } from "../../orchestration/trusted.sign.composition";
import type { MathematicalSignatureVerificationResult } from "../../mechanisms/signature.mathematical.verification";
import type { AwsKmsSignExecutionResult } from "../implementations/P9J.aws.kms.sign.execution";
import {
  createAwsKmsSignOperationFact,
} from "./P9V.aws.kms.sign.operation.fact";
import {
  bindProviderCryptographicOperation,
  type ProviderCryptographicOperationBindingInput,
  type ProviderCryptographicOperationBindingResult,
} from "./P9V.provider.cryptographic.operation.binding";
import {
  verifyAndAdmitProviderCryptographicAttestation,
  type ProviderCryptographicAttestationAdmissionResult,
  type ProviderCryptographicAttestationMaterial,
} from "./P9W.provider.cryptographic.attestation.verification.admission";
import type {
  ProviderRuntimeCryptographicLedgerBindingResult,
} from "./P9U.provider.runtime.cryptographic.ledger.binding.chain.verification";

export interface TrustedSignBindingAdmissionInput {
  readonly composition: Extract<
    TrustedSignCompositionResult,
    { composed: true }
  >;
  readonly execution: Extract<
    AwsKmsSignExecutionResult,
    { executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED" }
  >;
  readonly mathematicalVerification: Extract<
    MathematicalSignatureVerificationResult,
    { verified: true }
  >;
  readonly runtimeLedgerBinding:
    ProviderRuntimeCryptographicLedgerBindingResult;
  readonly cryptographicOperationId: string;
  readonly observedAt: string;
  readonly attestationId: string;
  readonly attestedAt: string;
}

export interface TrustedSignBindingAdmissionDependencies {
  readonly bindOperation?: (
    input: ProviderCryptographicOperationBindingInput,
  ) => ProviderCryptographicOperationBindingResult;
}

export function bindAndAdmitTrustedSignAttestation(
  input: TrustedSignBindingAdmissionInput,
  dependencies: TrustedSignBindingAdmissionDependencies = {},
): ProviderCryptographicAttestationAdmissionResult {
  const fact = createAwsKmsSignOperationFact(
    input.composition,
    input.execution,
    input.cryptographicOperationId,
    input.observedAt,
  );
  if (!fact.created) {
    return failedAdmission("SIGN_OPERATION_FACT_NOT_CREATED");
  }
  const binding = (dependencies.bindOperation ??
    bindProviderCryptographicOperation)({
    runtimeLedgerBinding: input.runtimeLedgerBinding,
    cryptographicOperationFact: fact.operationFact,
    bindingDecision: "BIND_PROVIDER_CRYPTOGRAPHIC_OPERATION",
  });
  if (
    binding.bindingStatus !== "PROVIDER_CRYPTOGRAPHIC_OPERATION_BOUND" ||
    !binding.cryptographicOperationBindingDigest ||
    !binding.cryptographicOperationId ||
    !binding.cryptographicContextId ||
    !binding.providerKeyReference ||
    !binding.tenantId ||
    !binding.companyId ||
    !binding.persistenceId ||
    !binding.ledgerEntryId ||
    !binding.ledgerSequence ||
    !binding.persistedAt ||
    !binding.p9uChainId ||
    !binding.p9uChainRecordId ||
    !binding.p9uChainRecordHash ||
    !binding.p9uChainSequence ||
    !binding.p9uChainPayloadHash
  ) return failedAdmission("P9V_SIGN_OPERATION_NOT_BOUND");

  const attestationDigest = createHash("sha256").update([
    binding.cryptographicOperationBindingDigest,
    input.mathematicalVerification.signatureArtifactDigest,
    input.mathematicalVerification.verificationMaterialDigest,
  ].join("\u001f"), "utf8").digest("hex");
  const material: ProviderCryptographicAttestationMaterial = {
    attestationMaterialType:
      "PROVIDER_INDEPENDENT_CRYPTOGRAPHIC_ATTESTATION",
    attestationMaterialVersion: "P9W.1",
    attestationId: input.attestationId,
    attestationObserved: true,
    attestationDigest,
    attestationDigestAlgorithm: "SHA-256",
    targetBindingDigest: binding.cryptographicOperationBindingDigest,
    targetBindingDigestAlgorithm: "SHA-256",
    cryptographicOperationId: binding.cryptographicOperationId,
    cryptographicContextId: binding.cryptographicContextId,
    cryptographicOperationKind: binding.cryptographicOperationKind!,
    providerContract: binding.providerContract,
    providerImplementation: binding.providerImplementation,
    providerOperation: binding.providerOperation,
    providerResourceId: binding.providerResourceId,
    providerKeyReference: binding.providerKeyReference,
    tenantId: binding.tenantId,
    companyId: binding.companyId,
    inputArtifact: binding.inputArtifact,
    outputArtifact: binding.outputArtifact,
    p9rPersistenceId: binding.persistenceId,
    p9rLedgerEntryId: binding.ledgerEntryId,
    p9rLedgerSequence: binding.ledgerSequence,
    p9rPersistedAt: binding.persistedAt,
    p9uChainId: binding.p9uChainId,
    p9uChainRecordId: binding.p9uChainRecordId,
    p9uChainRecordHash: binding.p9uChainRecordHash,
    p9uChainSequence: binding.p9uChainSequence,
    p9uChainPayloadHash: binding.p9uChainPayloadHash,
    attestedAt: input.attestedAt,
    summary: [
      "provider_independent_attestation_observed",
      "mathematical_signature_verification_preserved",
      "attestation_targets_p9v_binding",
    ],
  };
  return verifyAndAdmitProviderCryptographicAttestation({
    operationBinding: binding,
    attestationMaterial: material,
    admissionDecision: "VERIFY_AND_ADMIT_PROVIDER_CRYPTOGRAPHIC_ATTESTATION",
  });
}

function failedAdmission(
  marker: string,
): ProviderCryptographicAttestationAdmissionResult {
  return {
    admissionStatus: "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_NOT_ADMITTED",
    admissionDecision: "VERIFY_AND_ADMIT_PROVIDER_CRYPTOGRAPHIC_ATTESTATION",
    cryptographicAttestationVerificationAttempted: false,
    cryptographicAttestationPresent: false,
    cryptographicAttestationCoherent: false,
    cryptographicAttestationVerified: false,
    cryptographicAttestationAdmitted: false,
    cryptographicAttestationAdmissionDenied: false,
    admissionFailureReason: "P9V_OPERATION_BINDING_NOT_COMPLETED",
    p9vBindingSummary: [],
    attestationSummary: [],
    summary: [marker.toLowerCase(), "fail_closed"],
  };
}
