import {
  constants,
  createPublicKey,
  verify,
} from "node:crypto";
import type { TrustedSignCompositionResult } from "../orchestration/trusted.sign.composition";
import type { AwsKmsSignExecutionResult } from "../provider/implementations/P9J.aws.kms.sign.execution";
import type { VerificationMaterialIntegrityResult } from "./verification.material.integrity";

export type MathematicalSignatureVerificationResult =
  | Readonly<{
      verified: true;
      cryptographicOperation: "SIGN";
      signingAlgorithm: "RSASSA_PSS_SHA_256";
      messageType: "RAW";
      providerKeyReference: string;
      verificationMaterialDigest: string;
      verifiedAt: string;
    }>
  | Readonly<{
      verified: false;
      denialReason:
        | "MATHEMATICAL_VERIFICATION_INPUT_INCOMPLETE"
        | "MATHEMATICAL_VERIFICATION_CONTEXT_INCOHERENT"
        | "MATHEMATICAL_VERIFICATION_TIME_INVALID"
        | "SIGNATURE_MATHEMATICALLY_INVALID";
      verifiedAt: string;
    }>;

const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function denied(
  denialReason: Extract<MathematicalSignatureVerificationResult, {
    verified: false;
  }>["denialReason"],
  verifiedAt: string,
): MathematicalSignatureVerificationResult {
  return Object.freeze({ verified: false, denialReason, verifiedAt });
}

export function verifySignatureMathematically(
  composition: TrustedSignCompositionResult,
  execution: AwsKmsSignExecutionResult,
  material: VerificationMaterialIntegrityResult,
  verifiedAt: string,
): MathematicalSignatureVerificationResult {
  if (
    !composition.composed ||
    execution.executionStatus !== "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED" ||
    !material.verified
  ) return denied("MATHEMATICAL_VERIFICATION_INPUT_INCOMPLETE", verifiedAt);
  if (
    composition.messageType !== "RAW" ||
    composition.providerAlgorithm !== "RSASSA_PSS_SHA_256" ||
    execution.signingAlgorithm !== composition.providerAlgorithm ||
    execution.keyId !== composition.providerKeyReference ||
    material.providerKeyReference !== composition.providerKeyReference ||
    material.signingAlgorithm !== composition.providerAlgorithm ||
    material.keyFamily !== "RSA" ||
    material.modulusBits !== 2048
  ) return denied("MATHEMATICAL_VERIFICATION_CONTEXT_INCOHERENT", verifiedAt);
  if (
    !TIME.test(verifiedAt) ||
    !Number.isFinite(Date.parse(verifiedAt)) ||
    new Date(verifiedAt).toISOString() !== verifiedAt
  ) return denied("MATHEMATICAL_VERIFICATION_TIME_INVALID", verifiedAt);

  let valid = false;
  try {
    const key = createPublicKey({
      key: Buffer.from(material.verificationMaterial),
      format: "der",
      type: "spki",
    });
    valid = verify(
      "sha256",
      composition.signingInput,
      {
        key,
        padding: constants.RSA_PKCS1_PSS_PADDING,
        saltLength: 32,
      },
      execution.signature,
    );
  } catch {
    valid = false;
  }
  if (!valid) {
    return denied("SIGNATURE_MATHEMATICALLY_INVALID", verifiedAt);
  }
  return Object.freeze({
    verified: true,
    cryptographicOperation: "SIGN",
    signingAlgorithm: "RSASSA_PSS_SHA_256",
    messageType: "RAW",
    providerKeyReference: composition.providerKeyReference,
    verificationMaterialDigest: material.verificationMaterialDigest,
    verifiedAt,
  });
}
