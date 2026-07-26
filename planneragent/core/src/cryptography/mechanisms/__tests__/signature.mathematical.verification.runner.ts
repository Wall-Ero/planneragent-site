import {
  constants,
  generateKeyPairSync,
  sign,
} from "node:crypto";
import type { TrustedSignCompositionResult } from "../../orchestration/trusted.sign.composition";
import type { AwsKmsSignExecutionResult } from "../../provider/implementations/P9J.aws.kms.sign.execution";
import { verifySignatureMathematically } from "../signature.mathematical.verification";
import { verifyVerificationMaterialIntegrity } from "../verification.material.integrity";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
const keyId = "arn:aws:kms:eu-west-1:111122223333:key/example";
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
});
const message = new TextEncoder().encode('{"subject":"canonical"}');
const signature = new Uint8Array(sign("sha256", message, {
  key: privateKey,
  padding: constants.RSA_PKCS1_PSS_PADDING,
  saltLength: 32,
}));
const composition: TrustedSignCompositionResult = {
  composed: true,
  compositionId: "90000000-0000-4000-8000-000000000001",
  composedAt: "2026-07-26T10:00:00.000Z",
  governanceDecisionId: "20000000-0000-4000-8000-000000000001",
  infrastructureAuthorizationId: "30000000-0000-4000-8000-000000000001",
  mechanismsAuthorizationId: "60000000-0000-4000-8000-000000000001",
  subjectId: "80000000-0000-4000-8000-000000000001",
  tenantId: "tenant-1",
  companyId: "company-1",
  proofProfileId: "PLANNERAGENT_FDC_SIGN_V1",
  proofProfileVersion: "1",
  providerKeyReference: keyId,
  providerAlgorithm: "RSASSA_PSS_SHA_256",
  messageType: "RAW",
  signingInput: message,
};
const execution: AwsKmsSignExecutionResult = {
  executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED",
  providerCallAttempted: true,
  providerCallCompleted: true,
  operation: "SIGN",
  providerImplementation: "AWS_KMS",
  keyId,
  signingAlgorithm: "RSASSA_PSS_SHA_256",
  signature,
};
const material = verifyVerificationMaterialIntegrity({
  acquired: true,
  providerImplementation: "AWS_KMS",
  providerKeyReference: keyId,
  keyUsage: "SIGN_VERIFY",
  keySpec: "RSA_2048",
  supportedSigningAlgorithms: ["RSASSA_PSS_SHA_256"],
  verificationMaterialFormat: "SPKI_DER",
  verificationMaterial: new Uint8Array(publicKey.export({
    format: "der",
    type: "spki",
  })),
});
const verifiedAt = "2026-07-26T10:00:01.000Z";
const verified = verifySignatureMathematically(
  composition,
  execution,
  material,
  verifiedAt,
);
assert(verified.verified, "valid RSA-PSS signature verifies mathematically");
const changedSignature = signature.slice();
changedSignature[0] ^= 1;
const invalidSignature = verifySignatureMathematically(
  composition,
  { ...execution, signature: changedSignature },
  material,
  verifiedAt,
);
assert(
  !invalidSignature.verified &&
    invalidSignature.denialReason === "SIGNATURE_MATHEMATICALLY_INVALID",
  "altered signature fails closed",
);
const invalidMessage = verifySignatureMathematically(
  { ...composition, signingInput: new TextEncoder().encode("changed") },
  execution,
  material,
  verifiedAt,
);
assert(
  !invalidMessage.verified &&
    invalidMessage.denialReason === "SIGNATURE_MATHEMATICALLY_INVALID",
  "altered canonical subject fails closed",
);
const wrongKey = verifySignatureMathematically(
  composition,
  execution,
  material.verified
    ? { ...material, providerKeyReference: "arn:aws:kms:other" }
    : material,
  verifiedAt,
);
assert(
  !wrongKey.verified &&
    wrongKey.denialReason === "MATHEMATICAL_VERIFICATION_CONTEXT_INCOHERENT",
  "verification-key substitution fails closed",
);
console.log("Mathematical signature verification runner completed.");
