import type { TrustedSignCompositionResult } from "../../../orchestration/trusted.sign.composition";
import type { MathematicalSignatureVerificationResult } from "../../../mechanisms/signature.mathematical.verification";
import type { AwsKmsSignExecutionResult } from "../../implementations/P9J.aws.kms.sign.execution";
import type { ProviderCryptographicOperationBindingResult } from "../P9V.provider.cryptographic.operation.binding";
import { bindAndAdmitTrustedSignAttestation } from "../trusted.sign.binding.admission";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
const composition = {
  composed: true, compositionId: "90000000-0000-4000-8000-000000000001",
  composedAt: "2026-07-26T10:00:00.000Z",
  governanceDecisionId: "20000000-0000-4000-8000-000000000001",
  infrastructureAuthorizationId: "30000000-0000-4000-8000-000000000001",
  mechanismsAuthorizationId: "60000000-0000-4000-8000-000000000001",
  subjectId: "80000000-0000-4000-8000-000000000001",
  tenantId: "tenant-1", companyId: "company-1",
  proofProfileId: "PLANNERAGENT_FDC_SIGN_V1", proofProfileVersion: "1",
  providerKeyReference: "arn:kms:key", providerAlgorithm: "RSASSA_PSS_SHA_256",
  messageType: "RAW", signingInput: new Uint8Array([1, 2, 3]),
} satisfies Extract<TrustedSignCompositionResult, { composed: true }>;
const execution = {
  executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED",
  providerCallAttempted: true, providerCallCompleted: true,
  operation: "SIGN", providerImplementation: "AWS_KMS",
  keyId: "arn:kms:key", signingAlgorithm: "RSASSA_PSS_SHA_256",
  signature: new Uint8Array([4, 5, 6]),
} satisfies Extract<AwsKmsSignExecutionResult, {
  executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED";
}>;
const mathematical = {
  verified: true, cryptographicOperation: "SIGN",
  signingAlgorithm: "RSASSA_PSS_SHA_256", messageType: "RAW",
  providerKeyReference: "arn:kms:key",
  verificationMaterialDigest: "a".repeat(64),
  signatureArtifactDigest: "b".repeat(64),
  signatureArtifactDigestAlgorithm: "SHA-256",
  verifiedAt: "2026-07-26T10:00:02.000Z",
} satisfies Extract<MathematicalSignatureVerificationResult, { verified: true }>;
const artifact = (kind: "DIGEST" | "SIGNATURE", digest: string) => ({
  artifactId: `${kind.toLowerCase()}-1`, artifactKind: kind,
  artifactDigest: digest, artifactDigestAlgorithm: "SHA-256",
});
const binding = {
  bindingStatus: "PROVIDER_CRYPTOGRAPHIC_OPERATION_BOUND",
  bindingDecision: "BIND_PROVIDER_CRYPTOGRAPHIC_OPERATION",
  cryptographicOperationBindingAttempted: true,
  cryptographicOperationBound: true,
  cryptographicOperationBindingDenied: false,
  cryptographicOperationId: "a0000000-0000-4000-8000-000000000001",
  cryptographicContextId: composition.compositionId,
  cryptographicOperationKind: "SIGN",
  providerContract: "KEY_MANAGEMENT", providerImplementation: "AWS_KMS",
  providerOperation: "SIGN", providerResourceId: "arn:kms:key",
  providerKeyReference: "arn:kms:key", tenantId: "tenant-1",
  companyId: "company-1", inputArtifact: artifact("DIGEST", "c".repeat(64)),
  outputArtifact: artifact("SIGNATURE", mathematical.signatureArtifactDigest),
  observedAt: "2026-07-26T10:00:01.000Z",
  persistenceId: "persistence-1", ledgerEntryId: "ledger-1",
  ledgerSequence: 1, persistedAt: "2026-07-26T10:00:01.000Z",
  p9uChainId: "chain-1", p9uChainRecordId: "record-1",
  p9uChainRecordHash: "d".repeat(64), p9uChainSequence: 1,
  p9uChainPayloadHash: "e".repeat(64),
  canonicalBinding: {
    bindingType: "PROVIDER_CRYPTOGRAPHIC_OPERATION_RUNTIME_FACT_BINDING",
    bindingVersion: "P9V.1",
    cryptographicOperationId: "a0000000-0000-4000-8000-000000000001",
    cryptographicContextId: composition.compositionId,
    cryptographicOperationKind: "SIGN",
    providerContract: "KEY_MANAGEMENT",
    providerImplementation: "AWS_KMS",
    providerOperation: "SIGN",
    providerResourceId: "arn:kms:key",
    providerKeyReference: "arn:kms:key",
    tenantId: "tenant-1",
    companyId: "company-1",
    inputArtifact: artifact("DIGEST", "c".repeat(64)),
    outputArtifact: artifact("SIGNATURE", mathematical.signatureArtifactDigest),
    observedAt: "2026-07-26T10:00:01.000Z",
    persistenceId: "persistence-1",
    ledgerEntryId: "ledger-1",
    ledgerSequence: 1,
    persistedAt: "2026-07-26T10:00:01.000Z",
    p9uChainId: "chain-1",
    p9uChainRecordId: "record-1",
    p9uChainRecordHash: "d".repeat(64),
    p9uChainSequence: 1,
    p9uChainPayloadHash: "e".repeat(64),
  },
  cryptographicOperationBindingDigest: "f".repeat(64),
  cryptographicOperationBindingDigestAlgorithm: "SHA-256",
  runtimeLedgerBindingSummary: ["runtime_bound"],
  cryptographicOperationFactSummary: ["sign_observed"],
  summary: ["provider_cryptographic_operation_bound"],
} as ProviderCryptographicOperationBindingResult;
const admitted = bindAndAdmitTrustedSignAttestation({
  composition, execution, mathematicalVerification: mathematical,
  runtimeLedgerBinding: {} as never,
  cryptographicOperationId: binding.cryptographicOperationId!,
  observedAt: binding.observedAt!,
  attestationId: "attestation-1",
  attestedAt: "2026-07-26T10:00:02.000Z",
}, { bindOperation: () => binding });
assert(admitted.cryptographicAttestationAdmitted,
  "concrete adapter binds P9V and admits P9W");
assert(admitted.outputArtifact?.artifactDigest ===
  mathematical.signatureArtifactDigest,
  "mathematical signature lineage reaches P9W");
const denied = bindAndAdmitTrustedSignAttestation({
  composition, execution: { ...execution, keyId: "arn:kms:other" },
  mathematicalVerification: mathematical, runtimeLedgerBinding: {} as never,
  cryptographicOperationId: binding.cryptographicOperationId!,
  observedAt: binding.observedAt!, attestationId: "attestation-2",
  attestedAt: "2026-07-26T10:00:02.000Z",
}, { bindOperation: () => binding });
assert(!denied.cryptographicAttestationAdmitted,
  "incoherent completed SIGN fails before P9V/P9W");
console.log("Trusted SIGN binding admission runner completed.");
