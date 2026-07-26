import { generateKeyPairSync } from "node:crypto";
import type {
  AwsKmsVerificationMaterialAcquisitionResult,
} from "../../provider/implementations/P9J.aws.kms.verification.material.acquisition";
import { verifyVerificationMaterialIntegrity } from "../verification.material.integrity";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
function acquired(modulusLength: number):
AwsKmsVerificationMaterialAcquisitionResult {
  const { publicKey } = generateKeyPairSync("rsa", {
    modulusLength,
    publicExponent: 0x10001,
  });
  return {
    acquired: true,
    providerImplementation: "AWS_KMS",
    providerKeyReference: "arn:aws:kms:eu-west-1:111122223333:key/example",
    keyUsage: "SIGN_VERIFY",
    keySpec: "RSA_2048",
    supportedSigningAlgorithms: ["RSASSA_PSS_SHA_256"],
    verificationMaterialFormat: "SPKI_DER",
    verificationMaterial: new Uint8Array(publicKey.export({
      format: "der",
      type: "spki",
    })),
  };
}

const valid = verifyVerificationMaterialIntegrity(acquired(2048));
assert(valid.verified, "valid RSA-2048 SPKI material passes integrity");
assert(
  valid.verified &&
    valid.verificationMaterialDigestAlgorithm === "SHA-256" &&
    /^[0-9a-f]{64}$/.test(valid.verificationMaterialDigest),
  "material receives a deterministic SHA-256 identity",
);
const invalidDer = verifyVerificationMaterialIntegrity({
  ...(acquired(2048) as Extract<
    AwsKmsVerificationMaterialAcquisitionResult,
    { acquired: true }
  >),
  verificationMaterial: new Uint8Array([1, 2, 3]),
});
assert(
  !invalidDer.verified &&
    invalidDer.denialReason === "VERIFICATION_MATERIAL_DER_INVALID",
  "invalid DER fails closed",
);
const weak = verifyVerificationMaterialIntegrity(acquired(1024));
assert(
  !weak.verified &&
    weak.denialReason ===
      "VERIFICATION_MATERIAL_KEY_CAPABILITY_INCOHERENT",
  "wrong RSA modulus size fails closed",
);
const absent = verifyVerificationMaterialIntegrity({
  acquired: false,
  denialReason: "AWS_KMS_VERIFICATION_MATERIAL_CALL_FAILED",
  retryable: false,
  sanitizedMessage: "sanitized",
});
assert(
  !absent.verified &&
    absent.denialReason === "VERIFICATION_MATERIAL_NOT_ACQUIRED",
  "unacquired material fails closed",
);
console.log("Verification material integrity runner completed.");
