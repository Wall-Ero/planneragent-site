import type { P9WMathematicalSignatureVerificationIntegrationResult } from "../P9W.mathematical.signature.verification.integration";
import { certifyP9XSignatureAuthenticity } from "../P9X.signature.authenticity.certification";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
const integrated: P9WMathematicalSignatureVerificationIntegrationResult = {
  integrated: true,
  attestationId: "attestation-1",
  cryptographicOperationId: "operation-1",
  cryptographicContextId: "context-1",
  providerKeyReference: "arn:aws:kms:key/example",
  targetBindingDigest: "a".repeat(64),
  signatureArtifactDigest: "b".repeat(64),
  verificationMaterialDigest: "c".repeat(64),
  mathematicallyVerified: true,
  verifiedAt: "2026-07-26T10:00:02.000Z",
};
const certificateId = "d0000000-0000-4000-8000-000000000001";
const certifiedAt = "2026-07-26T10:00:03.000Z";
const first = certifyP9XSignatureAuthenticity(
  integrated,
  certificateId,
  certifiedAt,
);
const second = certifyP9XSignatureAuthenticity(
  integrated,
  certificateId,
  certifiedAt,
);
assert(first.certified, "mathematically verified signature is certified");
assert(
  first.certified &&
    first.certificate.mathematicalVerification &&
    !first.certificate.signerIdentityCertified &&
    !first.certificate.authorityCertified,
  "certificate makes no signer identity or authority overclaim",
);
assert(
  first.certified &&
    second.certified &&
    first.certificateDigest === second.certificateDigest,
  "identical authenticity facts produce deterministic certificate digest",
);
assert(first.certified && Object.isFrozen(first.certificate),
  "authenticity certificate is immutable");
const denied = certifyP9XSignatureAuthenticity(
  {
    integrated: false,
    denialReason: "MATHEMATICAL_SIGNATURE_NOT_VERIFIED",
  },
  certificateId,
  certifiedAt,
);
assert(
  !denied.certified &&
    denied.denialReason ===
      "P9W_MATHEMATICAL_VERIFICATION_NOT_INTEGRATED",
  "unverified signature cannot be certified",
);
const timeTravel = certifyP9XSignatureAuthenticity(
  integrated,
  certificateId,
  "2026-07-26T10:00:01.000Z",
);
assert(
  !timeTravel.certified &&
    timeTravel.denialReason === "P9X_CERTIFICATE_TIME_INVALID",
  "certificate cannot predate mathematical verification",
);
console.log("P9X signature authenticity certification runner completed.");
