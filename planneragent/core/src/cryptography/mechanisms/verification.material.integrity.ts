import {
  createHash,
  createPublicKey,
} from "node:crypto";
import type {
  AwsKmsVerificationMaterialAcquisitionResult,
} from "../provider/implementations/P9J.aws.kms.verification.material.acquisition";

export type VerificationMaterialIntegrityResult =
  | Readonly<{
      verified: true;
      providerKeyReference: string;
      verificationMaterialFormat: "SPKI_DER";
      keyFamily: "RSA";
      modulusBits: 2048;
      keyPurpose: "SIGN_VERIFY";
      signingAlgorithm: "RSASSA_PSS_SHA_256";
      verificationMaterialDigest: string;
      verificationMaterialDigestAlgorithm: "SHA-256";
      verificationMaterial: Uint8Array;
    }>
  | Readonly<{
      verified: false;
      denialReason:
        | "VERIFICATION_MATERIAL_NOT_ACQUIRED"
        | "VERIFICATION_MATERIAL_PROFILE_INCOHERENT"
        | "VERIFICATION_MATERIAL_DER_INVALID"
        | "VERIFICATION_MATERIAL_KEY_CAPABILITY_INCOHERENT";
    }>;

function deny(
  denialReason: Extract<VerificationMaterialIntegrityResult, {
    verified: false;
  }>["denialReason"],
): VerificationMaterialIntegrityResult {
  return Object.freeze({ verified: false, denialReason });
}

export function verifyVerificationMaterialIntegrity(
  acquisition: AwsKmsVerificationMaterialAcquisitionResult,
): VerificationMaterialIntegrityResult {
  if (!acquisition.acquired) {
    return deny("VERIFICATION_MATERIAL_NOT_ACQUIRED");
  }
  if (
    acquisition.providerImplementation !== "AWS_KMS" ||
    acquisition.keyUsage !== "SIGN_VERIFY" ||
    acquisition.keySpec !== "RSA_2048" ||
    acquisition.verificationMaterialFormat !== "SPKI_DER" ||
    acquisition.supportedSigningAlgorithms.length !== 1 ||
    acquisition.supportedSigningAlgorithms[0] !== "RSASSA_PSS_SHA_256"
  ) return deny("VERIFICATION_MATERIAL_PROFILE_INCOHERENT");

  let publicKey;
  try {
    publicKey = createPublicKey({
      key: Buffer.from(acquisition.verificationMaterial),
      format: "der",
      type: "spki",
    });
  } catch {
    return deny("VERIFICATION_MATERIAL_DER_INVALID");
  }
  if (
    publicKey.type !== "public" ||
    publicKey.asymmetricKeyType !== "rsa" ||
    publicKey.asymmetricKeyDetails?.modulusLength !== 2048
  ) return deny("VERIFICATION_MATERIAL_KEY_CAPABILITY_INCOHERENT");

  const material = acquisition.verificationMaterial.slice();
  return Object.freeze({
    verified: true,
    providerKeyReference: acquisition.providerKeyReference,
    verificationMaterialFormat: "SPKI_DER",
    keyFamily: "RSA",
    modulusBits: 2048,
    keyPurpose: "SIGN_VERIFY",
    signingAlgorithm: "RSASSA_PSS_SHA_256",
    verificationMaterialDigest:
      createHash("sha256").update(material).digest("hex"),
    verificationMaterialDigestAlgorithm: "SHA-256",
    verificationMaterial: material,
  });
}
