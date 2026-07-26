import { createHash } from "node:crypto";
import type { TrustedSignCompositionResult } from "../../orchestration/trusted.sign.composition";
import type { AwsKmsSignExecutionResult } from "../implementations/P9J.aws.kms.sign.execution";
import type {
  ProviderCryptographicOperationFact,
} from "./P9V.provider.cryptographic.operation.binding";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export type AwsKmsSignOperationFactResult =
  | Readonly<{ created: true; operationFact:
      Readonly<ProviderCryptographicOperationFact> }>
  | Readonly<{ created: false; denialReason:
      | "COMPLETED_SIGN_REQUIRED"
      | "SIGN_RESULT_INCOHERENT"
      | "OPERATION_FACT_IDENTITY_INVALID" }>;

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function createAwsKmsSignOperationFact(
  composition: TrustedSignCompositionResult,
  execution: AwsKmsSignExecutionResult,
  cryptographicOperationId: string,
  observedAt: string,
): AwsKmsSignOperationFactResult {
  if (
    !composition.composed ||
    execution.executionStatus !== "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED"
  ) return Object.freeze({
    created: false, denialReason: "COMPLETED_SIGN_REQUIRED",
  });
  if (
    execution.operation !== "SIGN" ||
    execution.providerImplementation !== "AWS_KMS" ||
    execution.keyId !== composition.providerKeyReference ||
    execution.signingAlgorithm !== composition.providerAlgorithm ||
    execution.signature.byteLength === 0
  ) return Object.freeze({
    created: false, denialReason: "SIGN_RESULT_INCOHERENT",
  });
  if (
    !UUID_V4.test(cryptographicOperationId) ||
    !TIME.test(observedAt) ||
    !Number.isFinite(Date.parse(observedAt))
  ) return Object.freeze({
    created: false, denialReason: "OPERATION_FACT_IDENTITY_INVALID",
  });

  const operationFact: ProviderCryptographicOperationFact = Object.freeze({
    cryptographicOperationObserved: true,
    cryptographicOperationId,
    cryptographicContextId: composition.compositionId,
    cryptographicOperationKind: "SIGN",
    providerContract: "KEY_MANAGEMENT",
    providerImplementation: "AWS_KMS",
    providerOperation: "SIGN",
    providerResourceId: composition.providerKeyReference,
    providerKeyReference: execution.keyId,
    tenantId: composition.tenantId,
    inputArtifact: Object.freeze({
      artifactId: composition.subjectId,
      artifactKind: "DIGEST",
      artifactDigest: digest(composition.signingInput),
      artifactDigestAlgorithm: "SHA-256",
    }),
    outputArtifact: Object.freeze({
      artifactId: `${cryptographicOperationId}:signature`,
      artifactKind: "SIGNATURE",
      artifactDigest: digest(execution.signature),
      artifactDigestAlgorithm: "SHA-256",
    }),
    observedAt,
    summary: Object.freeze([
      "aws_kms_sign_observed",
      "completed_sign_ready_for_p9v_binding",
    ]) as unknown as string[],
  });
  return Object.freeze({ created: true, operationFact });
}
