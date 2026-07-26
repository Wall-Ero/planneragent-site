import { createHash } from "node:crypto";
import type {
  P9WMathematicalSignatureVerificationIntegrationResult,
} from "./P9W.mathematical.signature.verification.integration";

export type P9XSignatureAuthenticityCertificationResult =
  | Readonly<{
      certified: true;
      certificate: Readonly<{
        certificateType: "MATHEMATICALLY_VERIFIED_SIGNATURE_AUTHENTICITY";
        certificateVersion: "P9X.1";
        certificateId: string;
        attestationId: string;
        cryptographicOperationId: string;
        cryptographicContextId: string;
        providerKeyReference: string;
        targetBindingDigest: string;
        signatureArtifactDigest: string;
        verificationMaterialDigest: string;
        mathematicalVerification: true;
        signerIdentityCertified: false;
        authorityCertified: false;
        certifiedAt: string;
      }>;
      certificateDigest: string;
      certificateDigestAlgorithm: "SHA-256";
    }>
  | Readonly<{
      certified: false;
      denialReason:
        | "P9W_MATHEMATICAL_VERIFICATION_NOT_INTEGRATED"
        | "P9X_CERTIFICATE_IDENTITY_INVALID"
        | "P9X_CERTIFICATE_TIME_INVALID";
    }>;

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function deny(
  denialReason: Extract<P9XSignatureAuthenticityCertificationResult, {
    certified: false;
  }>["denialReason"],
): P9XSignatureAuthenticityCertificationResult {
  return Object.freeze({ certified: false, denialReason });
}

export function certifyP9XSignatureAuthenticity(
  integrated: P9WMathematicalSignatureVerificationIntegrationResult,
  certificateId: string,
  certifiedAt: string,
): P9XSignatureAuthenticityCertificationResult {
  if (!integrated.integrated || !integrated.mathematicallyVerified) {
    return deny("P9W_MATHEMATICAL_VERIFICATION_NOT_INTEGRATED");
  }
  if (!UUID_V4.test(certificateId)) {
    return deny("P9X_CERTIFICATE_IDENTITY_INVALID");
  }
  if (
    !TIME.test(certifiedAt) ||
    !Number.isFinite(Date.parse(certifiedAt)) ||
    new Date(certifiedAt).toISOString() !== certifiedAt ||
    Date.parse(certifiedAt) < Date.parse(integrated.verifiedAt)
  ) return deny("P9X_CERTIFICATE_TIME_INVALID");

  const certificate = Object.freeze({
    certificateType:
      "MATHEMATICALLY_VERIFIED_SIGNATURE_AUTHENTICITY" as const,
    certificateVersion: "P9X.1" as const,
    certificateId,
    attestationId: integrated.attestationId,
    cryptographicOperationId: integrated.cryptographicOperationId,
    cryptographicContextId: integrated.cryptographicContextId,
    providerKeyReference: integrated.providerKeyReference,
    targetBindingDigest: integrated.targetBindingDigest,
    signatureArtifactDigest: integrated.signatureArtifactDigest,
    verificationMaterialDigest: integrated.verificationMaterialDigest,
    mathematicalVerification: true as const,
    signerIdentityCertified: false as const,
    authorityCertified: false as const,
    certifiedAt,
  });
  const certificateDigest = createHash("sha256")
    .update(JSON.stringify(certificate), "utf8")
    .digest("hex");
  return Object.freeze({
    certified: true,
    certificate,
    certificateDigest,
    certificateDigestAlgorithm: "SHA-256",
  });
}
