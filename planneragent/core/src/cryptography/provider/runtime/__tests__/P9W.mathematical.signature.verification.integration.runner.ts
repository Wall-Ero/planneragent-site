import type { MathematicalSignatureVerificationResult } from "../../../mechanisms/signature.mathematical.verification";
import type { ProviderCryptographicAttestationAdmissionResult } from "../P9W.provider.cryptographic.attestation.verification.admission";
import { integrateP9WMathematicalSignatureVerification } from "../P9W.mathematical.signature.verification.integration";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
const signatureDigest = "a".repeat(64);
const admission = {
  admissionStatus: "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMITTED",
  cryptographicAttestationAdmitted: true,
  attestationId: "attestation-1",
  cryptographicOperationId: "operation-1",
  cryptographicContextId: "context-1",
  cryptographicOperationKind: "SIGN",
  providerKeyReference: "arn:aws:kms:key/example",
  targetBindingDigest: "b".repeat(64),
  outputArtifact: {
    artifactId: "signature-1",
    artifactKind: "SIGNATURE",
    artifactDigest: signatureDigest,
    artifactDigestAlgorithm: "SHA-256",
  },
} as ProviderCryptographicAttestationAdmissionResult;
const mathematical: MathematicalSignatureVerificationResult = {
  verified: true,
  cryptographicOperation: "SIGN",
  signingAlgorithm: "RSASSA_PSS_SHA_256",
  messageType: "RAW",
  providerKeyReference: "arn:aws:kms:key/example",
  verificationMaterialDigest: "c".repeat(64),
  signatureArtifactDigest: signatureDigest,
  signatureArtifactDigestAlgorithm: "SHA-256",
  verifiedAt: "2026-07-26T10:00:02.000Z",
};
const integrated = integrateP9WMathematicalSignatureVerification(
  admission,
  mathematical,
);
assert(integrated.integrated, "P9W admission integrates mathematical proof");
assert(integrated.integrated && integrated.mathematicallyVerified,
  "integrated result asserts mathematical verification");
const invalid = integrateP9WMathematicalSignatureVerification(
  admission,
  { verified: false, denialReason: "SIGNATURE_MATHEMATICALLY_INVALID",
    verifiedAt: "2026-07-26T10:00:02.000Z" },
);
assert(!invalid.integrated &&
  invalid.denialReason === "MATHEMATICAL_SIGNATURE_NOT_VERIFIED",
  "invalid mathematics cannot pass P9W integration");
const substituted = integrateP9WMathematicalSignatureVerification(
  { ...admission, providerKeyReference: "arn:aws:kms:key/other" },
  mathematical,
);
assert(!substituted.integrated &&
  substituted.denialReason === "P9W_MATHEMATICAL_CONTEXT_INCOHERENT",
  "P9W key contradiction fails closed");
const changedSignature = integrateP9WMathematicalSignatureVerification(
  { ...admission, outputArtifact: {
    ...admission.outputArtifact!, artifactDigest: "d".repeat(64) } },
  mathematical,
);
assert(!changedSignature.integrated &&
  changedSignature.denialReason === "P9W_MATHEMATICAL_CONTEXT_INCOHERENT",
  "signature artifact contradiction fails closed");
console.log("P9W mathematical signature integration runner completed.");
