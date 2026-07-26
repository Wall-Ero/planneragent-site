import {
  KMSClient,
  SignCommand,
  type SignCommandOutput,
} from "@aws-sdk/client-kms";
import type { ProviderAdapterRequest } from "../adapters/P9I.provider.adapter.contract";

export interface AwsKmsSignClient {
  send(command: SignCommand): Promise<SignCommandOutput>;
}

export type AwsKmsSignExecutionResult =
  | Readonly<{
      executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED";
      providerCallAttempted: true;
      providerCallCompleted: true;
      operation: "SIGN";
      providerImplementation: "AWS_KMS";
      keyId: string;
      signingAlgorithm: "RSASSA_PSS_SHA_256";
      signature: Uint8Array;
    }>
  | Readonly<{
      executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_FAILED";
      providerCallAttempted: boolean;
      providerCallCompleted: false;
      operation: "SIGN";
      providerImplementation: "AWS_KMS";
      failureCode:
        | "AWS_KMS_SIGN_REQUEST_INVALID"
        | "AWS_KMS_SIGN_CALL_FAILED"
        | "AWS_KMS_SIGN_RESPONSE_INVALID";
      retryable: boolean;
      sanitizedMessage: string;
    }>;

function fail(
  failureCode: Extract<AwsKmsSignExecutionResult, {
    executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_FAILED";
  }>["failureCode"],
  attempted: boolean,
  retryable: boolean,
  sanitizedMessage: string,
): AwsKmsSignExecutionResult {
  return Object.freeze({
    executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_FAILED",
    providerCallAttempted: attempted,
    providerCallCompleted: false,
    operation: "SIGN",
    providerImplementation: "AWS_KMS",
    failureCode,
    retryable,
    sanitizedMessage,
  });
}

function readSignMetadata(request: ProviderAdapterRequest): Readonly<{
  message: Uint8Array;
  messageType: "RAW";
  signingAlgorithm: "RSASSA_PSS_SHA_256";
}> | undefined {
  const metadata = request.executionMetadata;
  if (
    request.providerContract !== "KEY_MANAGEMENT" ||
    request.providerImplementation !== "AWS_KMS" ||
    request.operation !== "SIGN" ||
    request.providerResourceId.length === 0 ||
    !(metadata?.message instanceof Uint8Array) ||
    metadata.message.byteLength === 0 ||
    metadata.messageType !== "RAW" ||
    metadata.signingAlgorithm !== "RSASSA_PSS_SHA_256"
  ) return undefined;
  return {
    message: metadata.message,
    messageType: "RAW",
    signingAlgorithm: "RSASSA_PSS_SHA_256",
  };
}

export function createAwsKmsClient(region: string): AwsKmsSignClient {
  return new KMSClient({ region });
}

export async function executeAwsKmsSign(
  request: ProviderAdapterRequest,
  client: AwsKmsSignClient,
): Promise<AwsKmsSignExecutionResult> {
  const metadata = readSignMetadata(request);
  if (!metadata) {
    return fail(
      "AWS_KMS_SIGN_REQUEST_INVALID",
      false,
      false,
      "AWS KMS SIGN request rejected before dispatch.",
    );
  }

  let response: SignCommandOutput;
  try {
    response = await client.send(new SignCommand({
      KeyId: request.providerResourceId,
      Message: metadata.message,
      MessageType: metadata.messageType,
      SigningAlgorithm: metadata.signingAlgorithm,
    }));
  } catch (error) {
    const candidate = error as {
      name?: unknown;
      $retryable?: unknown;
      $metadata?: { httpStatusCode?: unknown };
    };
    const retryable = Boolean(candidate?.$retryable) ||
      candidate?.$metadata?.httpStatusCode === 429 ||
      (typeof candidate?.$metadata?.httpStatusCode === "number" &&
        candidate.$metadata.httpStatusCode >= 500);
    return fail(
      "AWS_KMS_SIGN_CALL_FAILED",
      true,
      retryable,
      "AWS KMS SIGN call failed.",
    );
  }

  if (
    !(response.Signature instanceof Uint8Array) ||
    response.Signature.byteLength === 0 ||
    response.SigningAlgorithm !== "RSASSA_PSS_SHA_256" ||
    typeof response.KeyId !== "string" ||
    response.KeyId.length === 0
  ) return fail(
    "AWS_KMS_SIGN_RESPONSE_INVALID",
    true,
    false,
    "AWS KMS SIGN returned an invalid response.",
  );

  return Object.freeze({
    executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED",
    providerCallAttempted: true,
    providerCallCompleted: true,
    operation: "SIGN",
    providerImplementation: "AWS_KMS",
    keyId: response.KeyId,
    signingAlgorithm: "RSASSA_PSS_SHA_256",
    signature: response.Signature.slice(),
  });
}
