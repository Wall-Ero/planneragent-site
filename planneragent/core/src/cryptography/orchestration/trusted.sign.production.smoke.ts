import type { ProviderCryptographicAttestationAdmissionResult } from "../provider/runtime/P9W.provider.cryptographic.attestation.verification.admission";
import type { TrustedSignCompositionResult } from "./trusted.sign.composition";
import {
  reserveTrustedSignExecution,
  type TrustedSignReplayReservationStore,
} from "./trusted.sign.anti.replay";
import { mapAwsKmsSignAdapterRequest } from "../provider/adapters/P9I.aws.kms.sign.request";
import {
  executeAwsKmsSign,
  type AwsKmsSignClient,
  type AwsKmsSignExecutionResult,
} from "../provider/implementations/P9J.aws.kms.sign.execution";
import {
  acquireAwsKmsVerificationMaterial,
  type AwsKmsVerificationMaterialClient,
} from "../provider/implementations/P9J.aws.kms.verification.material.acquisition";
import {
  verifyVerificationMaterialIntegrity,
} from "../mechanisms/verification.material.integrity";
import {
  verifySignatureMathematically,
  type MathematicalSignatureVerificationResult,
} from "../mechanisms/signature.mathematical.verification";
import {
  integrateP9WMathematicalSignatureVerification,
} from "../provider/runtime/P9W.mathematical.signature.verification.integration";
import {
  certifyP9XSignatureAuthenticity,
  type P9XSignatureAuthenticityCertificationResult,
} from "../provider/runtime/P9X.signature.authenticity.certification";

export interface TrustedSignProductionSmokeInput {
  readonly composition: TrustedSignCompositionResult;
  readonly reservationId: string;
  readonly reservedAt: string;
  readonly providerConfigurationRef: string;
  readonly providerCredentialRef: string;
  readonly verifiedAt: string;
  readonly certificateId: string;
  readonly certifiedAt: string;
  readonly replayStore: TrustedSignReplayReservationStore;
  readonly signClient: AwsKmsSignClient;
  readonly verificationMaterialClient: AwsKmsVerificationMaterialClient;
  readonly bindAndAdmitAttestation: (
    composition: Extract<TrustedSignCompositionResult, { composed: true }>,
    execution: Extract<AwsKmsSignExecutionResult, {
      executionStatus: "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED";
    }>,
    mathematicalVerification: Extract<
      MathematicalSignatureVerificationResult,
      { verified: true }
    >,
  ) => Promise<ProviderCryptographicAttestationAdmissionResult>;
}

export type TrustedSignProductionSmokeResult =
  | Readonly<{
      completed: true;
      certificate: Extract<
        P9XSignatureAuthenticityCertificationResult,
        { certified: true }
      >;
    }>
  | Readonly<{
      completed: false;
      failedStage:
        | "ANTI_REPLAY"
        | "ADAPTER_MAPPING"
        | "AWS_KMS_SIGN"
        | "VERIFICATION_MATERIAL_ACQUISITION"
        | "VERIFICATION_MATERIAL_INTEGRITY"
        | "MATHEMATICAL_VERIFICATION"
        | "P9W_ADMISSION"
        | "P9X_CERTIFICATION";
    }>;

const fail = (
  failedStage: Extract<TrustedSignProductionSmokeResult, {
    completed: false;
  }>["failedStage"],
): TrustedSignProductionSmokeResult =>
  Object.freeze({ completed: false, failedStage });

export async function runTrustedSignProductionSmoke(
  input: TrustedSignProductionSmokeInput,
): Promise<TrustedSignProductionSmokeResult> {
  const reservation = await reserveTrustedSignExecution(
    input.composition,
    input.reservationId,
    input.reservedAt,
    input.replayStore,
  );
  if (!reservation.reserved) return fail("ANTI_REPLAY");

  const adapter = mapAwsKmsSignAdapterRequest(
    input.composition,
    input.providerConfigurationRef,
    input.providerCredentialRef,
  );
  if (!adapter.mapped) return fail("ADAPTER_MAPPING");

  const execution = await executeAwsKmsSign(
    adapter.adapterRequest,
    input.signClient,
  );
  if (
    execution.executionStatus !== "PROVIDER_IMPLEMENTATION_EXECUTION_COMPLETED"
  ) return fail("AWS_KMS_SIGN");
  if (!input.composition.composed) return fail("ADAPTER_MAPPING");

  const acquisition = await acquireAwsKmsVerificationMaterial(
    input.composition,
    execution,
    input.verificationMaterialClient,
  );
  if (!acquisition.acquired) {
    return fail("VERIFICATION_MATERIAL_ACQUISITION");
  }
  const integrity = verifyVerificationMaterialIntegrity(acquisition);
  if (!integrity.verified) return fail("VERIFICATION_MATERIAL_INTEGRITY");
  const mathematical = verifySignatureMathematically(
    input.composition,
    execution,
    integrity,
    input.verifiedAt,
  );
  if (!mathematical.verified) return fail("MATHEMATICAL_VERIFICATION");

  let admission: ProviderCryptographicAttestationAdmissionResult;
  try {
    admission = await input.bindAndAdmitAttestation(
      input.composition,
      execution,
      mathematical,
    );
  } catch {
    return fail("P9W_ADMISSION");
  }
  const integrated = integrateP9WMathematicalSignatureVerification(
    admission,
    mathematical,
  );
  if (!integrated.integrated) return fail("P9W_ADMISSION");
  const certificate = certifyP9XSignatureAuthenticity(
    integrated,
    input.certificateId,
    input.certifiedAt,
  );
  if (!certificate.certified) return fail("P9X_CERTIFICATION");
  return Object.freeze({ completed: true, certificate });
}
