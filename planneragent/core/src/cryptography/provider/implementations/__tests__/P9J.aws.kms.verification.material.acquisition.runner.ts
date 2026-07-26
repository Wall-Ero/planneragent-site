import {
  GetPublicKeyCommand,
  type GetPublicKeyCommandOutput,
} from "@aws-sdk/client-kms";
import type { TrustedSignCompositionResult } from "../../../orchestration/trusted.sign.composition";
import type { AwsKmsSignExecutionResult } from "../P9J.aws.kms.sign.execution";
import {
  acquireAwsKmsVerificationMaterial,
  type AwsKmsVerificationMaterialClient,
} from "../P9J.aws.kms.verification.material.acquisition";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

async function run(): Promise<void> {
  const keyId = "arn:aws:kms:eu-west-1:111122223333:key/example";
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
    signingInput: new Uint8Array([1, 2, 3]),
  };
  const execution: AwsKmsSignExecutionResult = {
    executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED",
    providerCallAttempted: true,
    providerCallCompleted: true,
    operation: "SIGN",
    providerImplementation: "AWS_KMS",
    keyId,
    signingAlgorithm: "RSASSA_PSS_SHA_256",
    signature: new Uint8Array([4, 5, 6]),
  };
  let dispatched: GetPublicKeyCommand | undefined;
  const client: AwsKmsVerificationMaterialClient = {
    async send(command): Promise<GetPublicKeyCommandOutput> {
      dispatched = command;
      return {
        KeyId: keyId,
        KeyUsage: "SIGN_VERIFY",
        KeySpec: "RSA_2048",
        SigningAlgorithms: ["RSASSA_PSS_SHA_256"],
        PublicKey: new Uint8Array([48, 3, 1, 2, 3]),
        $metadata: {},
      };
    },
  };
  const acquired = await acquireAwsKmsVerificationMaterial(
    composition,
    execution,
    client,
  );
  assert(acquired.acquired, "AWS KMS verification material is acquired");
  assert(
    dispatched instanceof GetPublicKeyCommand &&
      dispatched.input.KeyId === keyId,
    "GetPublicKey uses the exact authorized key",
  );
  assert(
    acquired.acquired &&
      acquired.keySpec === "RSA_2048" &&
      acquired.keyUsage === "SIGN_VERIFY" &&
      acquired.verificationMaterialFormat === "SPKI_DER",
    "key capability and material format are preserved",
  );

  let calls = 0;
  const mismatch = await acquireAwsKmsVerificationMaterial(
    composition,
    { ...execution, keyId: "arn:aws:kms:other" },
    { async send() { calls += 1; return {} as GetPublicKeyCommandOutput; } },
  );
  assert(
    !mismatch.acquired &&
      mismatch.denialReason === "COMPLETED_TRUSTED_SIGN_REQUIRED" &&
      calls === 0,
    "key substitution fails before provider acquisition",
  );
  const incoherent = await acquireAwsKmsVerificationMaterial(
    composition,
    execution,
    {
      async send(): Promise<GetPublicKeyCommandOutput> {
        return {
          KeyId: keyId,
          KeyUsage: "ENCRYPT_DECRYPT",
          KeySpec: "RSA_2048",
          PublicKey: new Uint8Array([1]),
          $metadata: {},
        };
      },
    },
  );
  assert(
    !incoherent.acquired &&
      incoherent.denialReason ===
        "AWS_KMS_VERIFICATION_MATERIAL_INCOHERENT",
    "wrong key purpose fails closed",
  );
  console.log("AWS KMS verification material acquisition runner completed.");
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
