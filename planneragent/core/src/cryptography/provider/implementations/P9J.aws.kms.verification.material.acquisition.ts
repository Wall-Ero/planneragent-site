import {
  GetPublicKeyCommand,
  type GetPublicKeyCommandOutput,
} from "@aws-sdk/client-kms";
import type { TrustedSignCompositionResult } from "../../orchestration/trusted.sign.composition";
import type {
  AwsKmsSignExecutionResult,
} from "./P9J.aws.kms.sign.execution";

export interface AwsKmsVerificationMaterialClient {
  send(command: GetPublicKeyCommand): Promise<GetPublicKeyCommandOutput>;
}

export type AwsKmsVerificationMaterialAcquisitionResult =
  | Readonly<{
      acquired: true;
      providerImplementation: "AWS_KMS";
      providerKeyReference: string;
      keyUsage: "SIGN_VERIFY";
      keySpec: "RSA_2048";
      supportedSigningAlgorithms: readonly ["RSASSA_PSS_SHA_256"];
      verificationMaterialFormat: "SPKI_DER";
      verificationMaterial: Uint8Array;
    }>
  | Readonly<{
      acquired: false;
      denialReason:
        | "COMPLETED_TRUSTED_SIGN_REQUIRED"
        | "AWS_KMS_VERIFICATION_MATERIAL_CALL_FAILED"
        | "AWS_KMS_VERIFICATION_MATERIAL_INCOHERENT";
      retryable: boolean;
      sanitizedMessage: string;
    }>;

function denied(
  denialReason: Extract<AwsKmsVerificationMaterialAcquisitionResult, {
    acquired: false;
  }>["denialReason"],
  retryable = false,
): AwsKmsVerificationMaterialAcquisitionResult {
  return Object.freeze({
    acquired: false,
    denialReason,
    retryable,
    sanitizedMessage: "AWS KMS verification material acquisition failed.",
  });
}

export async function acquireAwsKmsVerificationMaterial(
  composition: TrustedSignCompositionResult,
  execution: AwsKmsSignExecutionResult,
  client: AwsKmsVerificationMaterialClient,
): Promise<AwsKmsVerificationMaterialAcquisitionResult> {
  if (
    !composition.composed ||
    execution.executionStatus !== "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED" ||
    execution.keyId !== composition.providerKeyReference ||
    execution.signingAlgorithm !== composition.providerAlgorithm
  ) return denied("COMPLETED_TRUSTED_SIGN_REQUIRED");

  let response: GetPublicKeyCommandOutput;
  try {
    response = await client.send(new GetPublicKeyCommand({
      KeyId: composition.providerKeyReference,
    }));
  } catch (error) {
    const candidate = error as {
      $retryable?: unknown;
      $metadata?: { httpStatusCode?: unknown };
    };
    const status = candidate?.$metadata?.httpStatusCode;
    return denied(
      "AWS_KMS_VERIFICATION_MATERIAL_CALL_FAILED",
      Boolean(candidate?.$retryable) ||
        status === 429 ||
        (typeof status === "number" && status >= 500),
    );
  }

  if (
    response.KeyId !== composition.providerKeyReference ||
    response.KeyUsage !== "SIGN_VERIFY" ||
    response.KeySpec !== "RSA_2048" ||
    !response.SigningAlgorithms?.includes("RSASSA_PSS_SHA_256") ||
    !(response.PublicKey instanceof Uint8Array) ||
    response.PublicKey.byteLength === 0
  ) return denied("AWS_KMS_VERIFICATION_MATERIAL_INCOHERENT");

  return Object.freeze({
    acquired: true,
    providerImplementation: "AWS_KMS",
    providerKeyReference: response.KeyId,
    keyUsage: "SIGN_VERIFY",
    keySpec: "RSA_2048",
    supportedSigningAlgorithms: Object.freeze(["RSASSA_PSS_SHA_256"] as const),
    verificationMaterialFormat: "SPKI_DER",
    verificationMaterial: response.PublicKey.slice(),
  });
}
