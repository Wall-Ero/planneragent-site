import type { TrustedSignCompositionResult } from "../../orchestration/trusted.sign.composition";
import type { ProviderAdapterRequest } from "./P9I.provider.adapter.contract";

export type AwsKmsSignAdapterRequestResult =
  | Readonly<{ mapped: true; adapterRequest: Readonly<ProviderAdapterRequest> }>
  | Readonly<{ mapped: false; denialReason:
      | "TRUSTED_SIGN_COMPOSITION_REQUIRED"
      | "AWS_KMS_SIGN_CONFIGURATION_INVALID" }>;

export function mapAwsKmsSignAdapterRequest(
  composition: TrustedSignCompositionResult,
  providerConfigurationRef: string,
  providerCredentialRef: string,
): AwsKmsSignAdapterRequestResult {
  if (!composition.composed) return Object.freeze({
    mapped: false, denialReason: "TRUSTED_SIGN_COMPOSITION_REQUIRED",
  });
  if (
    !providerConfigurationRef || !providerCredentialRef ||
    !composition.providerKeyReference ||
    composition.providerAlgorithm !== "RSASSA_PSS_SHA_256" ||
    composition.messageType !== "RAW" ||
    composition.signingInput.byteLength === 0
  ) return Object.freeze({
    mapped: false, denialReason: "AWS_KMS_SIGN_CONFIGURATION_INVALID",
  });

  return Object.freeze({
    mapped: true,
    adapterRequest: Object.freeze({
      providerContract: "KEY_MANAGEMENT",
      providerImplementation: "AWS_KMS",
      operation: "SIGN",
      providerResourceId: composition.providerKeyReference,
      providerConfigurationRef,
      providerCredentialRef,
      executionMetadata: Object.freeze({
        compositionId: composition.compositionId,
        message: composition.signingInput.slice(),
        messageType: composition.messageType,
        signingAlgorithm: composition.providerAlgorithm,
      }),
    }),
  });
}
