import { SignCommand, type SignCommandOutput } from "@aws-sdk/client-kms";
import type { ProviderAdapterRequest } from "../../adapters/P9I.provider.adapter.contract";
import { executeAwsKmsSign, type AwsKmsSignClient } from "../P9J.aws.kms.sign.execution";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
const request: ProviderAdapterRequest = {
  providerContract: "KEY_MANAGEMENT",
  providerImplementation: "AWS_KMS",
  operation: "SIGN",
  providerResourceId: "arn:aws:kms:eu-west-1:111122223333:key/example",
  providerConfigurationRef: "aws-kms-eu-west-1",
  providerCredentialRef: "workload-identity",
  executionMetadata: {
    compositionId: "90000000-0000-4000-8000-000000000001",
    message: new TextEncoder().encode('{"subject":"exact"}'),
    messageType: "RAW",
    signingAlgorithm: "RSASSA_PSS_SHA_256",
  },
};
async function run(): Promise<void> {
let dispatched: SignCommand | undefined;
const client: AwsKmsSignClient = {
  async send(command): Promise<SignCommandOutput> {
    dispatched = command;
    return {
      KeyId: request.providerResourceId,
      SigningAlgorithm: "RSASSA_PSS_SHA_256",
      Signature: Uint8Array.from([1, 2, 3, 4]),
      $metadata: {},
    };
  },
};
const result = await executeAwsKmsSign(request, client);
assert(result.executionStatus === "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED",
  "AWS KMS SIGN completes");
assert(dispatched instanceof SignCommand, "real AWS SignCommand is dispatched");
assert(dispatched?.input.MessageType === "RAW" &&
  dispatched.input.SigningAlgorithm === "RSASSA_PSS_SHA_256",
  "AWS request preserves RAW and RSASSA-PSS-SHA-256");
assert(dispatched?.input.KeyId === request.providerResourceId,
  "exact authorized KMS key is used");
assert(result.executionStatus === "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED" &&
  result.signature.join(",") === "1,2,3,4",
  "provider signature bytes are preserved");

let calls = 0;
const invalid = await executeAwsKmsSign({
  ...request,
  executionMetadata: { ...request.executionMetadata, messageType: "DIGEST" },
}, { async send() { calls += 1; return {} as SignCommandOutput; } });
assert(invalid.executionStatus === "PROVIDER_IMPLEMENTATION_EXECUTION_FAILED" &&
  invalid.failureCode === "AWS_KMS_SIGN_REQUEST_INVALID" && calls === 0,
  "RAW-to-DIGEST reinterpretation fails before dispatch");
const failed = await executeAwsKmsSign(request, {
  async send() {
    throw Object.assign(new Error("secret provider detail"), {
      $metadata: { httpStatusCode: 503 },
    });
  },
});
assert(failed.executionStatus === "PROVIDER_IMPLEMENTATION_EXECUTION_FAILED" &&
  failed.failureCode === "AWS_KMS_SIGN_CALL_FAILED" && failed.retryable &&
  !JSON.stringify(failed).includes("secret provider detail"),
  "provider failures are sanitized and retryability is reported");
console.log("AWS KMS SIGN execution runner completed.");
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
