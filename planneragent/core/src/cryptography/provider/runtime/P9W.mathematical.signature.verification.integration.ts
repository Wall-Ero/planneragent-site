import type {
  MathematicalSignatureVerificationResult,
} from "../../mechanisms/signature.mathematical.verification";
import type {
  ProviderCryptographicAttestationAdmissionResult,
} from "./P9W.provider.cryptographic.attestation.verification.admission";

export type P9WMathematicalSignatureVerificationIntegrationResult =
  | Readonly<{
      integrated: true;
      attestationId: string;
      cryptographicOperationId: string;
      cryptographicContextId: string;
      providerKeyReference: string;
      targetBindingDigest: string;
      signatureArtifactDigest: string;
      verificationMaterialDigest: string;
      mathematicallyVerified: true;
      verifiedAt: string;
    }>
  | Readonly<{
      integrated: false;
      denialReason:
        | "P9W_ATTESTATION_NOT_ADMITTED"
        | "MATHEMATICAL_SIGNATURE_NOT_VERIFIED"
        | "P9W_MATHEMATICAL_CONTEXT_INCOHERENT";
    }>;

export function integrateP9WMathematicalSignatureVerification(
  admission: ProviderCryptographicAttestationAdmissionResult,
  mathematicalVerification: MathematicalSignatureVerificationResult,
): P9WMathematicalSignatureVerificationIntegrationResult {
  if (
    admission.admissionStatus !==
      "PROVIDER_CRYPTOGRAPHIC_ATTESTATION_ADMITTED" ||
    !admission.cryptographicAttestationAdmitted ||
    !admission.attestationId ||
    !admission.cryptographicOperationId ||
    !admission.cryptographicContextId ||
    !admission.providerKeyReference ||
    !admission.targetBindingDigest
  ) return Object.freeze({
    integrated: false,
    denialReason: "P9W_ATTESTATION_NOT_ADMITTED",
  });
  if (!mathematicalVerification.verified) {
    return Object.freeze({
      integrated: false,
      denialReason: "MATHEMATICAL_SIGNATURE_NOT_VERIFIED",
    });
  }
  if (
    admission.cryptographicOperationKind !== "SIGN" ||
    admission.providerKeyReference !==
      mathematicalVerification.providerKeyReference ||
    admission.outputArtifact?.artifactKind !== "SIGNATURE" ||
    admission.outputArtifact.artifactDigestAlgorithm !== "SHA-256" ||
    admission.outputArtifact.artifactDigest !==
      mathematicalVerification.signatureArtifactDigest
  ) return Object.freeze({
    integrated: false,
    denialReason: "P9W_MATHEMATICAL_CONTEXT_INCOHERENT",
  });

  return Object.freeze({
    integrated: true,
    attestationId: admission.attestationId,
    cryptographicOperationId: admission.cryptographicOperationId,
    cryptographicContextId: admission.cryptographicContextId,
    providerKeyReference: admission.providerKeyReference,
    targetBindingDigest: admission.targetBindingDigest,
    signatureArtifactDigest:
      mathematicalVerification.signatureArtifactDigest,
    verificationMaterialDigest:
      mathematicalVerification.verificationMaterialDigest,
    mathematicallyVerified: true,
    verifiedAt: mathematicalVerification.verifiedAt,
  });
}
